import { useEffect, useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import {
  Send,
  ArrowLeft,
  Calculator,
  Search,
  FileText,
  GitCompare,
  Building2,
  Calendar,
  Sparkles,
  TrendingUp,
  History,
  Pin,
  Trash2,
  X,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useElioAgent } from '@/hooks/useElioAgent';
import { RichViewRenderer } from '@/components/elio-agent/RichViewRenderer';
import {
  listConversations,
  loadConversation,
  togglePin,
  deleteConversation,
  type ConversationSummary,
} from '@/lib/agentConversationsService';

interface Suggestion {
  label: string;
  prompt: string;
  icon: React.ComponentType<{ className?: string }>;
}

const ElioSymbol = ({ size = 24 }: { size?: number }) => (
  <div
    className="rounded-full bg-[#1B3A5C] flex items-center justify-center relative shrink-0"
    style={{ width: size, height: size }}
  >
    <div
      className="rounded-full bg-[#C8943E] absolute"
      style={{ width: size * 0.22, height: size * 0.22, top: size * 0.22, right: size * 0.22 }}
    />
  </div>
);

const getGreeting = (firstName: string, profile: any): { text: string; needsProfile: boolean } => {
  const month = new Date().getMonth() + 1; // 1-12
  const incomplete = !profile || (!profile.gross_monthly_salary && !profile.annual_revenue_ht && !profile.main_pension_annual);

  if (incomplete) {
    return {
      text: 'Salut. Pour t\'aider au mieux, remplis d\'abord ton profil fiscal.',
      needsProfile: true,
    };
  }

  const name = firstName || 'toi';
  if (month === 4 || month === 5) {
    return { text: `Salut ${name}. Ta déclaration approche. Tu veux que je check ta situation ?`, needsProfile: false };
  }
  if (month === 7) {
    return { text: `Salut ${name}. Ton avis d'imposition devrait arriver. Je peux le vérifier avec toi.`, needsProfile: false };
  }
  if (month === 9) {
    return { text: `Salut ${name}. La taxe foncière arrive. On prépare ta trésorerie ?`, needsProfile: false };
  }
  return { text: `Salut ${name}. Qu'est-ce que je regarde pour toi aujourd'hui ?`, needsProfile: false };
};

const buildSuggestions = (profile: any): Suggestion[] => {
  const month = new Date().getMonth() + 1;
  const out: Suggestion[] = [];

  const hasIncome = profile?.gross_monthly_salary > 0 || profile?.annual_revenue_ht > 0 || profile?.main_pension_annual > 0;
  if (hasIncome) {
    out.push({ label: 'Calcule mon impôt 2025', prompt: 'Calcule mon impôt sur le revenu 2025', icon: Calculator });
  }

  out.push({ label: 'Vérifie mes droits aux aides', prompt: 'Vérifie si j\'ai droit à des aides', icon: Search });

  if (profile?.crypto_pnl_2025 || profile?.crypto_wallet_address) {
    out.push({ label: 'Déclaration crypto 2086', prompt: 'Prépare ma déclaration crypto 2086', icon: FileText });
  }

  if (profile?.is_self_employed) {
    out.push({ label: 'Compare micro vs SASU', prompt: 'Compare micro vs SASU pour moi', icon: GitCompare });
  }

  if ((month === 4 || month === 5) && out.length < 4) {
    out.push({ label: 'Check ma déclaration', prompt: 'Check ma déclaration de cette année', icon: FileText });
  }

  if (profile?.has_rental_income && out.length < 4) {
    out.push({ label: 'Simule un investissement locatif', prompt: 'Simule un investissement locatif pour moi', icon: Building2 });
  }

  // Fallbacks pour atteindre 4
  const fallbacks: Suggestion[] = [
    { label: 'Que puis-je optimiser ?', prompt: 'Que puis-je optimiser cette année ?', icon: Sparkles },
    { label: 'Mes prochaines échéances', prompt: 'Quelles sont mes prochaines échéances fiscales ?', icon: Calendar },
    { label: 'Ma tranche d\'imposition', prompt: 'Explique-moi ma tranche d\'imposition', icon: TrendingUp },
    { label: 'Trouve des aides oubliées', prompt: 'Trouve-moi des aides que j\'oublie', icon: Search },
  ];

  for (const f of fallbacks) {
    if (out.length >= 4) break;
    if (!out.find((s) => s.label === f.label)) out.push(f);
  }

  return out.slice(0, 4);
};

const AgentPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [profile, setProfile] = useState<any>(null);
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  const { messages, isLoading, remainingToday, sendMessage, startNewConversation, confirmProfileUpdates } = useElioAgent();

  useEffect(() => {
    if (!user) return;
    supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle()
      .then(({ data }) => setProfile(data));
  }, [user]);

  // Auto-send prompt si arrivé via feed proactif
  useEffect(() => {
    const initial = (location.state as any)?.initialPrompt;
    if (initial && messages.length === 0 && !isLoading) {
      sendMessage(initial);
      navigate(location.pathname, { replace: true, state: {} });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.state]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const firstName = (profile?.full_name || '').split(' ')[0] || '';
  const { text: greeting, needsProfile } = getGreeting(firstName, profile);
  const suggestions = buildSuggestions(profile);

  const handleSend = () => {
    if (!input.trim()) return;
    const text = input;
    setInput('');
    sendMessage(text);
  };

  const handleSuggestion = (prompt: string) => {
    sendMessage(prompt);
  };

  const isWelcome = messages.length === 0;

  return (
    <AppLayout>
      <div className="max-w-[640px] mx-auto flex flex-col" style={{ fontFamily: 'Sora', minHeight: 'calc(100vh - 140px)' }}>
        {/* Header */}
        <div className="flex items-center gap-3 mb-6 px-1">
          {!isWelcome ? (
            <button
              onClick={startNewConversation}
              className="flex items-center gap-2 text-sm font-medium text-[#1B3A5C] hover:text-[#C8943E] transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Nouvelle conversation
            </button>
          ) : (
            <>
              <ElioSymbol size={32} />
              <h1 className="text-xl font-semibold text-[#1B3A5C]">Élio Agent</h1>
              {typeof remainingToday === 'number' && (
                <span className="ml-auto text-xs text-[#6B7A8D]">{remainingToday} restant·s aujourd'hui</span>
              )}
            </>
          )}
        </div>

        {/* Welcome state */}
        {isWelcome ? (
          <div className="flex-1 flex flex-col">
            <p className="text-2xl font-medium text-[#1B3A5C] leading-snug mb-2 px-1">{greeting}</p>

            {needsProfile && (
              <button
                onClick={() => navigate('/profil/fiscal')}
                className="self-start mt-2 mb-4 px-4 py-2 rounded-lg bg-[#1B3A5C] text-white text-sm font-medium hover:bg-[#152e4a] transition-colors"
              >
                Compléter mon profil
              </button>
            )}

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-6 mb-6">
              {suggestions.map((s) => {
                const Icon = s.icon;
                return (
                  <button
                    key={s.label}
                    onClick={() => handleSuggestion(s.prompt)}
                    disabled={isLoading}
                    className="text-left p-4 rounded-xl bg-[#F8F5F0] border border-[#E5DED3] hover:border-[#C8943E] transition-colors disabled:opacity-50 flex flex-col gap-2"
                  >
                    <Icon className="w-5 h-5 text-[#C8943E]" />
                    <span className="text-sm font-medium text-[#1B3A5C]">{s.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          /* Conversation state */
          <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-4 mb-4 px-1">
            {messages.map((m, i) => {
              if (m.role === 'user') {
                return (
                  <div key={i} className="flex justify-end">
                    <div className="max-w-[85%] rounded-2xl rounded-tr-sm bg-[#1B3A5C] text-white px-4 py-3 text-sm">
                      {m.content}
                    </div>
                  </div>
                );
              }
              return (
                <div key={i} className="flex gap-2">
                  <ElioSymbol size={28} />
                  <div className="flex-1 max-w-[calc(100%-40px)]">
                    {m.content && (
                      <div className="text-[#1F3347] text-sm whitespace-pre-wrap leading-relaxed">{m.content}</div>
                    )}
                    <RichViewRenderer rich_view={m.rich_view} onRunPrompt={sendMessage} onConfirmProfileUpdate={confirmProfileUpdates} />
                  </div>
                </div>
              );
            })}
            {isLoading && (
              <div className="flex gap-2 items-center">
                <ElioSymbol size={28} />
                <div className="flex gap-1.5 px-3 py-2">
                  <span className="w-2 h-2 rounded-full bg-[#C8943E] animate-pulse" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 rounded-full bg-[#C8943E] animate-pulse" style={{ animationDelay: '200ms' }} />
                  <span className="w-2 h-2 rounded-full bg-[#C8943E] animate-pulse" style={{ animationDelay: '400ms' }} />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Input bar */}
        <div className="sticky bottom-0 bg-[#FAFAF7] pt-2 pb-2">
          <div className="flex items-end gap-2 bg-white border border-[#E5DED3] rounded-2xl p-2">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Pose-moi ta question..."
              rows={1}
              disabled={isLoading}
              className="flex-1 resize-none bg-transparent px-2 py-2 text-sm text-[#1F3347] placeholder:text-[#6B7A8D] focus:outline-none max-h-32"
              style={{ fontFamily: 'Sora' }}
            />
            <button
              onClick={handleSend}
              disabled={isLoading || !input.trim()}
              className="w-10 h-10 rounded-full bg-[#C8943E] text-white flex items-center justify-center hover:bg-[#b07f2f] transition-colors disabled:opacity-40 shrink-0"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
          <p className="text-[10px] text-[#6B7A8D] text-center mt-2 px-2">
            Élio fournit des estimations à titre indicatif. Pour toute décision fiscale, consulte un professionnel habilité.
          </p>
        </div>
      </div>
    </AppLayout>
  );
};

export default AgentPage;
