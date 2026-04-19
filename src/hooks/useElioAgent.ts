import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export type RichViewType =
  | 'tax_breakdown'
  | 'real_estate_cashflow'
  | 'deadlines_list'
  | 'recommendations_list'
  | 'aids_eligibility'
  | 'fiscal_concept'
  | 'profile_update_proposal'
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

  const handleResponse = useCallback((data: any) => {
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
  }, []);

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || isLoading) return;

      const userMsg: AgentMessage = { role: 'user', content: trimmed };
      setMessages((prev) => [...prev, userMsg]);
      setIsLoading(true);

      try {
        const { data, error } = await supabase.functions.invoke('elio-agent', {
          body: { type: 'message', message: trimmed, conversation_id: conversationId },
        });

        if (error) {
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

        handleResponse(data);
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
    [conversationId, isLoading, handleResponse],
  );

  /**
   * Confirme et applique les mises à jour de profil proposées par l'agent.
   * 1. Écrit en base via UPDATE sur public.profiles
   * 2. Notifie l'agent qui reprend la tâche en cours avec les nouvelles valeurs
   */
  const confirmProfileUpdates = useCallback(
    async (updates: Array<{ field: string; value: any }>) => {
      if (!updates.length) return;
      if (!conversationId) {
        toast({
          title: 'Erreur',
          description: 'Aucune conversation active.',
          variant: 'destructive',
        });
        return;
      }

      setIsLoading(true);
      try {
        const { data: userData } = await supabase.auth.getUser();
        const userId = userData?.user?.id;
        if (!userId) throw new Error('Utilisateur non authentifié');

        // Construit le payload en convertissant les valeurs proprement
        const payload: Record<string, any> = {};
        for (const u of updates) {
          payload[u.field] = u.value;
        }

        const { error: updateError } = await supabase
          .from('profiles')
          .update(payload)
          .eq('user_id', userId);

        if (updateError) {
          console.error('[useElioAgent] profile update error', updateError);
          toast({
            title: 'Erreur',
            description: "Impossible d'enregistrer les modifications.",
            variant: 'destructive',
          });
          return;
        }

        toast({
          title: 'Profil mis à jour',
          description: 'Élio reprend ton calcul avec les nouvelles infos.',
        });

        // Affiche un message user "fantôme" pour la lisibilité du fil
        setMessages((prev) => [
          ...prev,
          {
            role: 'user',
            content: `J'ai confirmé : ${updates.map((u) => u.field).join(', ')}`,
          },
        ]);

        // Notifie l'agent pour qu'il reprenne la tâche
        const { data, error } = await supabase.functions.invoke('elio-agent', {
          body: {
            type: 'resume_after_confirmation',
            conversation_id: conversationId,
            confirmed_updates: updates,
          },
        });

        if (error) {
          toast({
            title: 'Erreur',
            description: "Élio n'a pas pu reprendre. Renvoie ton message.",
            variant: 'destructive',
          });
          return;
        }

        handleResponse(data);
      } catch (e) {
        console.error('[useElioAgent] confirmProfileUpdates error', e);
        toast({
          title: 'Erreur',
          description: 'Erreur lors de la confirmation.',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    },
    [conversationId, handleResponse],
  );

  const startNewConversation = useCallback(() => {
    setMessages([]);
    setConversationId(null);
  }, []);

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
    confirmProfileUpdates,
    startNewConversation,
    notifyProfileUpdated,
  };
};
