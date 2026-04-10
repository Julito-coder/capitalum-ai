import { useState, useEffect, useRef } from 'react';
import { useGlossaryAI } from '@/hooks/useGlossaryAI';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, Sparkles, X, Loader2 } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface FormAssistantPanelProps {
  formType: string;
  formTitle: string;
  userContext?: Record<string, unknown>;
  activeField?: string;
  onClose?: () => void;
}

const SUGGESTIONS_BY_FORM: Record<string, string[]> = {
  '2086': [
    'Comment calculer le PMPA ?',
    'Les échanges crypto-crypto sont-ils imposables ?',
    "Qu'est-ce que la case 3AN ?",
    'Dois-je déclarer les airdrops ?',
    'Quelle est la différence entre PFU et barème ?',
  ],
  '3916-bis': [
    'Quelles plateformes dois-je déclarer ?',
    'Binance est-elle considérée étrangère ?',
    'Un wallet MetaMask est-il un compte étranger ?',
    'Que risque-t-on si on oublie un compte ?',
    'Les plateformes DeFi doivent-elles être déclarées ?',
  ],
};

const FIELD_TIPS: Record<string, string> = {
  prix_cession: "Le prix de cession correspond au montant en euros reçu lors de la vente. Quel est le prix de cession que je dois indiquer ?",
  prix_total_acquisition: "Le prix total d'acquisition du portefeuille est le coût total de tous mes achats crypto. Comment le calculer ?",
  valeur_globale_portefeuille: "La valeur globale est la valeur totale de mon portefeuille au moment de la cession. Comment l'estimer ?",
  case_3AN: "La case 3AN reçoit le total net des plus-values. Explique-moi ce qui va dans la case 3AN.",
  case_3BN: "La case 3BN reçoit les moins-values. Que se passe-t-il avec mes moins-values crypto ?",
  plateforme: "Je dois déclarer cette plateforme. Comment savoir si elle est étrangère ?",
  pays: "Comment trouver le pays du siège social de ma plateforme crypto ?",
  regime: "Quel régime fiscal choisir pour mes crypto : PFU ou barème progressif ?",
};

export const FormAssistantPanel = ({ formType, formTitle, userContext, activeField, onClose }: FormAssistantPanelProps) => {
  const { messages, isStreaming, streamChat, cancelStream, clearMessages } = useGlossaryAI();
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const suggestions = SUGGESTIONS_BY_FORM[formType] ?? [];

  // Auto-scroll on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Send welcome message on mount
  useEffect(() => {
    if (messages.length === 0) {
      const welcomeContext = userContext ? JSON.stringify(userContext) : '';
      streamChat(
        `Je commence à remplir le formulaire ${formType} (${formTitle}). Donne-moi un résumé de ce que je dois savoir et les erreurs courantes à éviter. Sois concis.`,
        userContext as any,
        `Formulaire ${formType} - ${formTitle}`
      );
    }
  }, []); // Only on mount

  const handleSend = (text: string) => {
    if (!text.trim() || isStreaming) return;
    setInput('');
    streamChat(text, userContext as any, `Formulaire ${formType} - ${formTitle}`);
  };

  // React to field focus changes
  useEffect(() => {
    if (activeField && FIELD_TIPS[activeField] && messages.length > 1) {
      // Don't auto-send, just show a suggestion chip
    }
  }, [activeField]);

  const fieldTip = activeField ? FIELD_TIPS[activeField] : null;

  return (
    <div className="flex flex-col h-full bg-card">
      {/* Header */}
      <div className="p-4 border-b border-border/30 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <h3 className="font-semibold text-sm">Assistant Elio</h3>
        </div>
        {onClose && (
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 px-4 py-3" ref={scrollRef}>
        <div className="space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[90%] p-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                  msg.role === 'user'
                    ? 'bg-primary text-primary-foreground rounded-br-md'
                    : 'bg-muted rounded-bl-md'
                }`}
              >
                {msg.content || (isStreaming ? '...' : '')}
              </div>
            </div>
          ))}
          {isStreaming && messages.length > 0 && !messages[messages.length - 1].content && (
            <div className="flex justify-start">
              <div className="p-3 rounded-2xl bg-muted rounded-bl-md">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Field-specific tip */}
      {fieldTip && (
        <div className="px-4 pb-2">
          <button
            onClick={() => handleSend(fieldTip)}
            className="w-full text-left text-xs p-2.5 rounded-lg bg-primary/5 border border-primary/20 text-primary hover:bg-primary/10 transition-colors"
          >
            💡 {fieldTip}
          </button>
        </div>
      )}

      {/* Suggestions */}
      {messages.length <= 2 && suggestions.length > 0 && (
        <div className="px-4 pb-2 flex flex-wrap gap-1.5">
          {suggestions.slice(0, 3).map((s) => (
            <button
              key={s}
              onClick={() => handleSend(s)}
              className="text-xs px-3 py-1.5 rounded-full bg-muted hover:bg-muted/80 text-muted-foreground transition-colors"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="p-3 border-t border-border/30 shrink-0">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend(input);
          }}
          className="flex gap-2"
        >
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Pose ta question..."
            className="flex-1"
            disabled={isStreaming}
          />
          <Button type="submit" size="icon" disabled={!input.trim() || isStreaming}>
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
};
