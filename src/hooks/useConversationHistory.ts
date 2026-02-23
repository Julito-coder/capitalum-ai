import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface ConversationRecord {
  id: string;
  user_id: string;
  topic: string | null;
  summary: string | null;
  messages: { role: string; content: string; timestamp: string }[];
  tags: string[];
  is_pinned: boolean;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
}

const PAGE_SIZE = 20;

export const useConversationHistory = () => {
  const [conversations, setConversations] = useState<ConversationRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [tagFilter, setTagFilter] = useState<string | null>(null);

  const fetchConversations = useCallback(async (pageNum: number, reset = false) => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setIsLoading(false); return; }

      let query = (supabase.from('ai_conversations' as any) as any)
        .select('*')
        .eq('user_id', user.id)
        .order('is_pinned', { ascending: false })
        .order('created_at', { ascending: false })
        .range(pageNum * PAGE_SIZE, (pageNum + 1) * PAGE_SIZE - 1);

      if (tagFilter) {
        query = query.contains('tags', [tagFilter]);
      }

      const { data, error } = await query;
      if (error) throw error;

      const rows = (data || []) as unknown as ConversationRecord[];
      setHasMore(rows.length === PAGE_SIZE);

      if (reset) {
        setConversations(rows);
      } else {
        setConversations(prev => [...prev, ...rows]);
      }
    } catch (err) {
      console.error('Error fetching conversations:', err);
    } finally {
      setIsLoading(false);
    }
  }, [tagFilter]);

  useEffect(() => {
    setPage(0);
    fetchConversations(0, true);
  }, [fetchConversations]);

  const loadMore = useCallback(() => {
    const next = page + 1;
    setPage(next);
    fetchConversations(next);
  }, [page, fetchConversations]);

  const pinConversation = useCallback(async (id: string, currentlyPinned: boolean) => {
    const newPinned = !currentlyPinned;
    const updates: any = {
      is_pinned: newPinned,
      expires_at: newPinned ? null : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    };

    const { error } = await (supabase.from('ai_conversations' as any) as any)
      .update(updates)
      .eq('id', id);

    if (error) {
      toast({ title: 'Erreur', description: 'Impossible de modifier l\'épingle.', variant: 'destructive' });
      return;
    }

    setConversations(prev =>
      prev.map(c => c.id === id ? { ...c, is_pinned: newPinned, expires_at: updates.expires_at } : c)
    );
    toast({ title: newPinned ? 'Conversation épinglée' : 'Épingle retirée' });
  }, []);

  const deleteConversation = useCallback(async (id: string) => {
    const { error } = await (supabase.from('ai_conversations' as any) as any).delete().eq('id', id);
    if (error) {
      toast({ title: 'Erreur', description: 'Impossible de supprimer.', variant: 'destructive' });
      return;
    }
    setConversations(prev => prev.filter(c => c.id !== id));
    toast({ title: 'Conversation supprimée' });
  }, []);

  const refresh = useCallback(() => {
    setPage(0);
    fetchConversations(0, true);
  }, [fetchConversations]);

  // Client-side search filter
  const filteredConversations = searchQuery
    ? conversations.filter(c => {
        const q = searchQuery.toLowerCase();
        return (
          (c.summary || '').toLowerCase().includes(q) ||
          c.tags.some(t => t.toLowerCase().includes(q)) ||
          c.messages.some(m => m.content.toLowerCase().includes(q))
        );
      })
    : conversations;

  return {
    conversations: filteredConversations,
    isLoading,
    hasMore,
    loadMore,
    pinConversation,
    deleteConversation,
    searchQuery,
    setSearchQuery,
    tagFilter,
    setTagFilter,
    refresh
  };
};
