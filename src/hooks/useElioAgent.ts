import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export type RichViewType =
  | 'tax_breakdown'
  | 'real_estate_cashflow'
  | 'deadlines_list'
  | 'recommendations_list'
  | 'aids_eligibility'
  | 'fiscal_concept'
  | null;

export interface RichView {
  type: RichViewType;
  data: any;
}

export interface AgentMessage {
  role: 'user' | 'assistant';
  content: string;
  rich_view?: RichView | null;
}

export const useElioAgent = () => {
  const [messages, setMessages] = useState<AgentMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [remainingToday, setRemainingToday] = useState<number | null>(null);

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || isLoading) return;

      const userMsg: AgentMessage = { role: 'user', content: trimmed };
      setMessages((prev) => [...prev, userMsg]);
      setIsLoading(true);

      try {
        const { data, error } = await supabase.functions.invoke('elio-agent', {
          body: { message: trimmed, conversation_id: conversationId },
        });

        if (error) {
          // 429 rate limit
          const status = (error as any).context?.status ?? (error as any).status;
          if (status === 429) {
            toast({
              title: 'Trop de requêtes',
              description: 'Élio reçoit beaucoup de demandes. Réessaie dans quelques secondes.',
              variant: 'destructive',
            });
          } else {
            toast({
              title: 'Erreur',
              description: 'Élio est momentanément indisponible. Réessaie dans un instant.',
              variant: 'destructive',
            });
          }
          setMessages((prev) => prev.slice(0, -1));
          return;
        }

        if (data?.conversation_id) setConversationId(data.conversation_id);
        if (typeof data?.remaining_today === 'number') setRemainingToday(data.remaining_today);

        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: data?.message ?? '',
            rich_view: data?.rich_view ?? null,
          },
        ]);
      } catch (e) {
        console.error('[useElioAgent] error', e);
        toast({
          title: 'Erreur',
          description: 'Impossible de contacter Élio.',
          variant: 'destructive',
        });
        setMessages((prev) => prev.slice(0, -1));
      } finally {
        setIsLoading(false);
      }
    },
    [conversationId, isLoading]
  );

  const startNewConversation = useCallback(() => {
    setMessages([]);
    setConversationId(null);
  }, []);

  /**
   * À appeler depuis les pages où l'utilisateur modifie son profil
   * (FiscalProfile, onboarding, etc.). N'envoie rien au serveur :
   * l'edge function relit `profiles` à chaque message et détecte
   * la mise à jour via `updated_at` vs `last_profile_snapshot_at`.
   */
  const notifyProfileUpdated = useCallback(() => {
    toast({
      title: 'Profil mis à jour',
      description: 'Élio prend en compte tes nouvelles infos au prochain message 🌤️',
    });
  }, []);

  return {
    messages,
    isLoading,
    conversationId,
    remainingToday,
    sendMessage,
    startNewConversation,
    notifyProfileUpdated,
  };
};
