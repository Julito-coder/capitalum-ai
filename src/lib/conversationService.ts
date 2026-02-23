/**
 * Service de sauvegarde et gestion des conversations IA.
 * Couche data isolée (pas de logique UI).
 */
import { supabase } from '@/integrations/supabase/client';
import { extractFiscalTags } from './conversationTagExtractor';

interface MessageInput {
  role: string;
  content: string;
  timestamp?: Date | string;
}

/**
 * Génère un résumé à partir de la première question utilisateur.
 */
export function generateSummary(messages: MessageInput[]): string {
  const firstUserMsg = messages.find(m => m.role === 'user');
  if (!firstUserMsg) return 'Conversation sans question';
  const text = firstUserMsg.content.trim();
  return text.length > 120 ? text.slice(0, 117) + '...' : text;
}

/**
 * Sauvegarde une conversation en base (fire-and-forget).
 * Ne sauvegarde pas si la conversation ne contient aucun message utilisateur.
 */
export async function saveConversation(
  userId: string,
  messages: MessageInput[],
  topic: string
): Promise<void> {
  // Filtrer les messages vides et les welcome messages
  const meaningfulMessages = messages.filter(
    m => m.content.trim() !== '' && m.role !== 'system'
  );

  // Ne pas sauvegarder si aucun message utilisateur
  const hasUserMessage = meaningfulMessages.some(m => m.role === 'user');
  if (!hasUserMessage) return;

  const tags = extractFiscalTags(meaningfulMessages);
  const summary = generateSummary(meaningfulMessages);

  const serializedMessages = meaningfulMessages.map(m => ({
    role: m.role,
    content: m.content,
    timestamp: m.timestamp instanceof Date ? m.timestamp.toISOString() : m.timestamp || new Date().toISOString()
  }));

  const { error } = await supabase.from('ai_conversations' as any).insert({
    user_id: userId,
    topic,
    summary,
    messages: serializedMessages,
    tags,
    is_pinned: false,
    expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
  });

  if (error) {
    console.error('Failed to save conversation:', error.message);
  }
}
