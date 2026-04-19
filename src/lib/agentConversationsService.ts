/**
 * Service pour lister et recharger les conversations Élio Agent
 * persistées par l'edge function dans `ai_conversations`.
 */
import { supabase } from '@/integrations/supabase/client';
import type { AgentMessage } from '@/hooks/useElioAgent';

export interface ConversationSummary {
  id: string;
  summary: string | null;
  topic: string | null;
  updated_at: string;
  is_pinned: boolean;
  tags: string[] | null;
}

export interface ConversationDetail extends ConversationSummary {
  messages: AgentMessage[];
}

/** Liste les conversations de l'utilisateur (les plus récentes en premier). */
export async function listConversations(userId: string, limit = 30): Promise<ConversationSummary[]> {
  const { data, error } = await supabase
    .from('ai_conversations')
    .select('id, summary, topic, updated_at, is_pinned, tags')
    .eq('user_id', userId)
    .order('is_pinned', { ascending: false })
    .order('updated_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('[listConversations] error', error);
    return [];
  }
  return (data || []) as ConversationSummary[];
}

/** Charge le détail d'une conversation (messages inclus). */
export async function loadConversation(conversationId: string): Promise<ConversationDetail | null> {
  const { data, error } = await supabase
    .from('ai_conversations')
    .select('id, summary, topic, updated_at, is_pinned, tags, messages')
    .eq('id', conversationId)
    .maybeSingle();

  if (error || !data) {
    console.error('[loadConversation] error', error);
    return null;
  }

  // Les messages stockés contiennent role/content/(rich_view?). On nettoie pour
  // ne garder que ce que l'UI sait afficher.
  const rawMessages = Array.isArray(data.messages) ? (data.messages as any[]) : [];
  const messages: AgentMessage[] = rawMessages
    .filter((m) => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
    .map((m) => ({
      role: m.role,
      content: m.content,
      rich_view: m.rich_view ?? null,
    }));

  return {
    id: data.id,
    summary: data.summary,
    topic: data.topic,
    updated_at: data.updated_at,
    is_pinned: data.is_pinned,
    tags: data.tags,
    messages,
  };
}

export async function togglePin(conversationId: string, pinned: boolean): Promise<void> {
  await supabase.from('ai_conversations').update({ is_pinned: pinned }).eq('id', conversationId);
}

export async function deleteConversation(conversationId: string): Promise<void> {
  await supabase.from('ai_conversations').delete().eq('id', conversationId);
}
