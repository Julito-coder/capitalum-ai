import { useState } from 'react';
import { 
  Search, Pin, PinOff, Trash2, Copy, MessageCircle, Clock, 
  ChevronDown, Bot, User, Loader2, X
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { useConversationHistory, type ConversationRecord } from '@/hooks/useConversationHistory';
import { toast } from '@/hooks/use-toast';
import { formatDistanceToNow, differenceInDays } from 'date-fns';
import { fr } from 'date-fns/locale';
import { getGlossaryTermIdsFromTags } from '@/lib/conversationTagExtractor';
import { getTermById } from '@/data/glossaryData';

// All unique tags across conversations for filter
const POPULAR_TAGS = ['TMI', 'IR', 'PER', 'PEA', 'URSSAF', 'TVA', 'Micro-entreprise', 'SCPI', 'Crypto', 'Plus-value'];

interface ConversationHistoryProps {
  onSelectGlossaryTerm?: (termId: string) => void;
  onResumeConversation?: (messages: { id: string; role: 'user' | 'assistant'; content: string; timestamp: Date }[]) => void;
}

export const ConversationHistory = ({ onSelectGlossaryTerm, onResumeConversation }: ConversationHistoryProps) => {
  const {
    conversations, isLoading, hasMore, loadMore,
    pinConversation, deleteConversation,
    searchQuery, setSearchQuery, tagFilter, setTagFilter
  } = useConversationHistory();

  const [expandedId, setExpandedId] = useState<string | null>(null);

  const handleExport = (conv: ConversationRecord) => {
    const lines = conv.messages.map(m => {
      const role = m.role === 'user' ? '👤 Vous' : '🤖 Assistant';
      const time = new Date(m.timestamp).toLocaleString('fr-FR');
      return `[${time}] ${role}\n${m.content}`;
    });
    const text = `Conversation Elio — ${conv.topic || 'Sans sujet'}\n${new Date(conv.created_at).toLocaleDateString('fr-FR')}\n${'─'.repeat(40)}\n\n${lines.join('\n\n')}`;
    navigator.clipboard.writeText(text);
    toast({ title: 'Copié !', description: 'Conversation copiée dans le presse-papier.' });
  };

  const handleResume = (conv: ConversationRecord) => {
    if (!onResumeConversation) return;
    const msgs = conv.messages.map((m, i) => ({
      id: `resumed-${i}`,
      role: m.role as 'user' | 'assistant',
      content: m.content,
      timestamp: new Date(m.timestamp)
    }));
    onResumeConversation(msgs);
    toast({ title: 'Conversation reprise', description: 'Le widget est prêt avec cette conversation.' });
  };

  const getExpirationProgress = (conv: ConversationRecord): number => {
    if (conv.is_pinned || !conv.expires_at) return 100;
    const created = new Date(conv.created_at).getTime();
    const expires = new Date(conv.expires_at).getTime();
    const now = Date.now();
    const total = expires - created;
    const remaining = expires - now;
    return Math.max(0, Math.min(100, (remaining / total) * 100));
  };

  const getDaysRemaining = (conv: ConversationRecord): number | null => {
    if (conv.is_pinned || !conv.expires_at) return null;
    return Math.max(0, differenceInDays(new Date(conv.expires_at), new Date()));
  };

  if (isLoading && conversations.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-primary/10">
          <MessageCircle className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h2 className="text-lg font-semibold">Historique des conversations</h2>
          <p className="text-sm text-muted-foreground">{conversations.length} conversation{conversations.length > 1 ? 's' : ''} archivée{conversations.length > 1 ? 's' : ''}</p>
        </div>
      </div>

      {/* Search + filters */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher dans l'historique..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-10 bg-muted/50"
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {tagFilter && (
            <Button variant="secondary" size="sm" onClick={() => setTagFilter(null)} className="text-xs gap-1">
              {tagFilter} <X className="h-3 w-3" />
            </Button>
          )}
          {!tagFilter && POPULAR_TAGS.map(tag => (
            <button
              key={tag}
              onClick={() => setTagFilter(tag)}
              className="text-xs px-2 py-1 rounded-full bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      {/* Empty state */}
      {conversations.length === 0 && !isLoading && (
        <div className="text-center py-12 text-muted-foreground">
          <MessageCircle className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p>Aucune conversation archivée</p>
          <p className="text-xs mt-1">Vos futures discussions avec l'assistant apparaîtront ici.</p>
        </div>
      )}

      {/* Conversations list */}
      <div className="space-y-3">
        {conversations.map(conv => {
          const isExpanded = expandedId === conv.id;
          const daysRemaining = getDaysRemaining(conv);
          const progress = getExpirationProgress(conv);
          const glossaryIds = getGlossaryTermIdsFromTags(conv.tags);

          return (
            <div key={conv.id} className="glass-card rounded-xl overflow-hidden">
              {/* Card header */}
              <button
                onClick={() => setExpandedId(isExpanded ? null : conv.id)}
                className="w-full text-left p-4 hover:bg-muted/20 transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{conv.summary || 'Conversation'}</p>
                    <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      <span>{formatDistanceToNow(new Date(conv.created_at), { addSuffix: true, locale: fr })}</span>
                      {conv.topic && <span>• {conv.topic}</span>}
                    </div>
                    {conv.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {conv.tags.slice(0, 5).map(tag => (
                          <Badge key={tag} variant="outline" className="text-[10px] px-1.5 py-0">
                            {tag}
                          </Badge>
                        ))}
                        {conv.tags.length > 5 && (
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                            +{conv.tags.length - 5}
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {conv.is_pinned && <Pin className="h-3.5 w-3.5 text-primary" />}
                    <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                  </div>
                </div>
                {/* Expiration bar */}
                {!conv.is_pinned && daysRemaining !== null && (
                  <div className="mt-2 flex items-center gap-2">
                    <Progress value={progress} className="h-1 flex-1" />
                    <span className={`text-[10px] ${daysRemaining <= 7 ? 'text-orange-400' : 'text-muted-foreground'}`}>
                      {daysRemaining}j restant{daysRemaining > 1 ? 's' : ''}
                    </span>
                  </div>
                )}
              </button>

              {/* Expanded content */}
              {isExpanded && (
                <div className="border-t border-border">
                  {/* Actions */}
                  <div className="flex items-center gap-1 px-4 py-2 border-b border-border bg-muted/10">
                    <Button variant="ghost" size="sm" onClick={() => pinConversation(conv.id, conv.is_pinned)} className="text-xs gap-1 h-7">
                      {conv.is_pinned ? <PinOff className="h-3 w-3" /> : <Pin className="h-3 w-3" />}
                      {conv.is_pinned ? 'Détacher' : 'Épingler'}
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleExport(conv)} className="text-xs gap-1 h-7">
                      <Copy className="h-3 w-3" /> Exporter
                    </Button>
                    {onResumeConversation && (
                      <Button variant="ghost" size="sm" onClick={() => handleResume(conv)} className="text-xs gap-1 h-7">
                        <MessageCircle className="h-3 w-3" /> Reprendre
                      </Button>
                    )}
                    <div className="flex-1" />
                    <Button variant="ghost" size="sm" onClick={() => deleteConversation(conv.id)} className="text-xs gap-1 h-7 text-destructive hover:text-destructive">
                      <Trash2 className="h-3 w-3" /> Supprimer
                    </Button>
                  </div>

                  {/* Messages */}
                  <ScrollArea className="max-h-80 px-4 py-3">
                    <div className="space-y-3">
                      {conv.messages.map((msg, i) => (
                        <div key={i} className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                          {msg.role === 'assistant' && (
                            <div className="p-1 rounded bg-primary/10 h-fit mt-1">
                              <Bot className="h-3 w-3 text-primary" />
                            </div>
                          )}
                          <div className={`max-w-[85%] rounded-lg p-2.5 text-xs ${msg.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted/50'}`}>
                            <p className="whitespace-pre-wrap">{msg.content}</p>
                          </div>
                          {msg.role === 'user' && (
                            <div className="p-1 rounded bg-muted h-fit mt-1">
                              <User className="h-3 w-3" />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </ScrollArea>

                  {/* Linked glossary terms */}
                  {glossaryIds.length > 0 && (
                    <div className="px-4 py-2 border-t border-border bg-muted/5">
                      <p className="text-[10px] text-muted-foreground mb-1">Termes du glossaire liés :</p>
                      <div className="flex flex-wrap gap-1">
                        {glossaryIds.map(termId => {
                          const term = getTermById(termId);
                          if (!term) return null;
                          return (
                            <Button
                              key={termId}
                              variant="outline"
                              size="sm"
                              className="text-[10px] h-6 px-2"
                              onClick={() => onSelectGlossaryTerm?.(termId)}
                            >
                              {term.term}
                            </Button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Load more */}
      {hasMore && conversations.length > 0 && (
        <div className="text-center">
          <Button variant="outline" size="sm" onClick={loadMore} disabled={isLoading}>
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Charger plus'}
          </Button>
        </div>
      )}
    </div>
  );
};
