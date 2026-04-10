import { useState, useRef, useEffect } from 'react';
import { 
  MessageCircle, 
  X, 
  Send, 
  Sparkles,
  Minimize2,
  Maximize2,
  Bot,
  User,
  BookOpen,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useGlossaryAI } from '@/hooks/useGlossaryAI';
import { useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

// Map routes to topics for context
const routeTopics: Record<string, string> = {
  '/': 'tableau de bord fiscal',
  '/scanner': 'scanner de documents fiscaux',
  '/calendar': 'calendrier fiscal et échéances',
  '/simulator': 'simulateur d\'impôt sur le revenu',
  '/glossary': 'glossaire fiscal',
  '/audit': 'audit fiscal',
  '/onboarding': 'profil fiscal',
  '/pro/urssaf': 'cotisations URSSAF',
  '/pro/invoices': 'facturation et gestion des factures',
  '/pro/revenue': 'suivi du chiffre d\'affaires',
  '/pro/cashflow': 'trésorerie et prévisions',
  '/pro/hiring': 'simulation d\'embauche',
  '/pro/status': 'comparaison des statuts juridiques'
};

const suggestedQuestions = [
  "C'est quoi le TMI ?",
  "Comment calculer mes cotisations URSSAF ?",
  "Différence entre micro et réel ?",
  "Qu'est-ce que le PER ?"
];

export const AIHelpWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [input, setInput] = useState('');
  const [userContext, setUserContext] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  
  const { messages, isStreaming, streamChat, clearMessages, setMessages, saveCurrentConversation } = useGlossaryAI();

  // Get current topic based on route
  const currentTopic = routeTopics[location.pathname] || 'fiscalité générale';

// Load comprehensive user context on mount
  useEffect(() => {
    const loadUserContext = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select(`
            professional_status, fiscal_status, annual_revenue_ht, family_status,
            is_employee, is_self_employed, is_retired, is_investor,
            children_count, birth_year, has_rental_income, has_investments,
            gross_monthly_salary, net_monthly_salary, annual_bonus,
            main_pension_annual, pea_balance, life_insurance_balance,
            has_real_expenses, real_expenses_amount, siret, company_name,
            primary_objective, onboarding_completed
          `)
          .eq('user_id', user.id)
          .single();
        
        if (profile) {
          setUserContext({
            // Statut professionnel
            professionalStatus: profile.professional_status,
            fiscalStatus: profile.fiscal_status,
            isEmployee: profile.is_employee,
            isSelfEmployed: profile.is_self_employed,
            isRetired: profile.is_retired,
            isInvestor: profile.is_investor,
            
            // Revenus
            annualRevenue: profile.annual_revenue_ht,
            grossMonthlySalary: profile.gross_monthly_salary,
            netMonthlySalary: profile.net_monthly_salary,
            annualBonus: profile.annual_bonus,
            mainPension: profile.main_pension_annual,
            
            // Famille
            familyStatus: profile.family_status,
            childrenCount: profile.children_count,
            birthYear: profile.birth_year,
            
            // Patrimoine
            hasRentalIncome: profile.has_rental_income,
            hasInvestments: profile.has_investments,
            peaBalance: profile.pea_balance,
            lifeInsuranceBalance: profile.life_insurance_balance,
            
            // Déductions
            hasRealExpenses: profile.has_real_expenses,
            realExpensesAmount: profile.real_expenses_amount,
            
            // Entreprise
            siret: profile.siret,
            companyName: profile.company_name,
            
            // Objectifs
            primaryObjective: profile.primary_objective,
            onboardingCompleted: profile.onboarding_completed
          });
        }
      }
    };
    loadUserContext();
  }, []);

  // Set welcome message on first open
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([{
        id: 'welcome',
        role: 'assistant',
        content: `👋 Salut ! Je suis ton copilote Élio.

Je peux t'aider à comprendre les concepts fiscaux et financiers. Tu es actuellement sur la page **${currentTopic}**.

Pose-moi tes questions !`,
        timestamp: new Date()
      }]);
    }
  }, [isOpen]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (text?: string) => {
    const messageText = text || input;
    if (!messageText.trim() || isStreaming) return;
    
    setInput('');
    await streamChat(messageText, userContext, currentTopic);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleClose = async () => {
    await saveCurrentConversation(currentTopic);
    setIsOpen(false);
    setIsExpanded(false);
  };

  const handleNewChat = async () => {
    await saveCurrentConversation(currentTopic);
    clearMessages();
    setMessages([{
      id: 'welcome-new',
      role: 'assistant',
      content: `💬 Nouvelle conversation ! 

Tu es sur **${currentTopic}**. Comment puis-je t'aider ?`,
      timestamp: new Date()
    }]);
  };

  // Closed state - floating button
  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-20 right-4 lg:bottom-6 lg:right-6 z-50 p-4 rounded-full bg-primary text-primary-foreground shadow-lg hover:scale-105 transition-transform glow-md"
        aria-label="Ouvrir l'assistant fiscal"
      >
        <Sparkles className="h-6 w-6" />
      </button>
    );
  }

  // Open state - chat widget
  const widgetClasses = isExpanded 
    ? 'fixed inset-4 lg:inset-8 z-50'
    : 'fixed bottom-20 right-4 lg:bottom-6 lg:right-6 w-[calc(100%-2rem)] max-w-md h-[500px] z-50';

  return (
    <div className={`${widgetClasses} glass-card rounded-2xl border border-border shadow-2xl flex flex-col overflow-hidden`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border bg-muted/30">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Sparkles className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-sm">Assistant Fiscal</h3>
            <p className="text-xs text-muted-foreground">{currentTopic}</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleNewChat}
            className="h-8 w-8"
            title="Nouvelle conversation"
          >
            <MessageCircle className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsExpanded(!isExpanded)}
            className="h-8 w-8 hidden lg:flex"
          >
            {isExpanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleClose}
            className="h-8 w-8"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-2 ${message.role === 'user' ? 'justify-end' : ''}`}
            >
              {message.role === 'assistant' && (
                <div className="p-1.5 rounded-lg bg-primary/10 h-fit">
                  <Bot className="h-3 w-3 text-primary" />
                </div>
              )}
              <div
                className={`max-w-[85%] rounded-xl p-3 text-sm ${
                  message.role === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted/50'
                }`}
              >
                <div className="whitespace-pre-wrap">
                  {message.content.split('\n').map((line, i) => (
                    <p key={i} className="mb-1 last:mb-0">
                      {line.startsWith('**') && line.endsWith('**') ? (
                        <strong>{line.slice(2, -2)}</strong>
                      ) : line.includes('**') ? (
                        line.split(/(\*\*.*?\*\*)/).map((part, j) => 
                          part.startsWith('**') && part.endsWith('**') 
                            ? <strong key={j}>{part.slice(2, -2)}</strong>
                            : part
                        )
                      ) : (
                        line
                      )}
                    </p>
                  ))}
                </div>
              </div>
              {message.role === 'user' && (
                <div className="p-1.5 rounded-lg bg-muted h-fit">
                  <User className="h-3 w-3" />
                </div>
              )}
            </div>
          ))}
          
          {isStreaming && messages[messages.length - 1]?.content === '' && (
            <div className="flex gap-2">
              <div className="p-1.5 rounded-lg bg-primary/10 h-fit">
                <Bot className="h-3 w-3 text-primary" />
              </div>
              <div className="bg-muted/50 rounded-xl p-3">
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Suggestions */}
      {messages.length <= 1 && (
        <div className="px-4 pb-2">
          <div className="flex flex-wrap gap-1.5">
            {suggestedQuestions.map((q, i) => (
              <button
                key={i}
                onClick={() => handleSend(q)}
                disabled={isStreaming}
                className="text-xs px-2.5 py-1.5 rounded-full bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="p-4 border-t border-border">
        <div className="flex gap-2">
          <Input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Pose ta question..."
            className="flex-1 bg-muted/50"
            disabled={isStreaming}
          />
          <Button
            onClick={() => handleSend()}
            disabled={!input.trim() || isStreaming}
            size="icon"
            className="shrink-0"
          >
            {isStreaming ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
        <p className="text-[10px] text-muted-foreground text-center mt-2">
          Propulsé par Elio AI • <a href="/glossary" className="hover:underline">Consulter le glossaire</a>
        </p>
      </div>
    </div>
  );
};
