import { Sparkles, MessageCircle, ChevronRight, BookOpen, HelpCircle } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { UserProfile } from '@/lib/dashboardService';

interface GlossaryAICardProps {
  profile: UserProfile | null;
}

interface SuggestedQuestion {
  id: string;
  question: string;
  category: 'fiscal' | 'epargne' | 'immobilier';
}

const getContextualQuestions = (profile: UserProfile | null): SuggestedQuestion[] => {
  const questions: SuggestedQuestion[] = [];
  
  questions.push({
    id: 'tmi',
    question: 'Comment calculer ma TMI ?',
    category: 'fiscal'
  });
  
  if (profile?.isEmployee) {
    questions.push({
      id: 'frais-reels',
      question: 'Frais réels vs 10% : que choisir ?',
      category: 'fiscal'
    });
  }
  
  if (profile?.isSelfEmployed) {
    questions.push({
      id: 'micro-reel',
      question: 'Micro vs réel : comparaison',
      category: 'fiscal'
    });
  }
  
  questions.push({
    id: 'per-avantage',
    question: 'À quoi sert un PER ?',
    category: 'epargne'
  });
  
  questions.push({
    id: 'deficit-foncier',
    question: 'Comment fonctionne le déficit foncier ?',
    category: 'immobilier'
  });
  
  return questions.slice(0, 3);
};

const getCategoryStyle = (category: string) => {
  switch (category) {
    case 'fiscal': return 'bg-info/10 text-info border-info/20';
    case 'epargne': return 'bg-success/10 text-success border-success/20';
    case 'immobilier': return 'bg-warning/10 text-warning border-warning/20';
    default: return 'bg-muted text-muted-foreground border-border';
  }
};

const getCategoryLabel = (category: string) => {
  switch (category) {
    case 'fiscal': return 'Fiscal';
    case 'epargne': return 'Épargne';
    case 'immobilier': return 'Immo';
    default: return 'Général';
  }
};

export const GlossaryAICard = ({ profile }: GlossaryAICardProps) => {
  const navigate = useNavigate();
  const suggestedQuestions = getContextualQuestions(profile);

  return (
    <Card className="border border-border/30 bg-card/80 backdrop-blur-sm">
      <CardHeader className="pb-3 pt-5 px-5 sm:px-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-primary/10 shrink-0">
            <Sparkles className="h-5 w-5 text-primary" />
          </div>
          <div className="min-w-0">
            <CardTitle className="text-base sm:text-lg font-semibold">Glossaire & Aide</CardTitle>
            <p className="text-xs sm:text-sm text-muted-foreground">Questions fiscales</p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="px-5 sm:px-6 pb-5 sm:pb-6 space-y-4">
        {/* Suggested questions - touch-friendly */}
        <div className="space-y-2">
          {suggestedQuestions.map((q) => (
            <button
              key={q.id}
              className="w-full flex items-center gap-3 p-3.5 rounded-xl bg-secondary/30 border border-border/20 text-left min-h-[52px] active:scale-[0.99] transition-transform"
              onClick={() => navigate('/glossary')}
            >
              <HelpCircle className="h-4 w-4 text-muted-foreground shrink-0" />
              <span className="text-sm flex-1 truncate">
                {q.question}
              </span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium border shrink-0 ${getCategoryStyle(q.category)}`}>
                {getCategoryLabel(q.category)}
              </span>
            </button>
          ))}
        </div>

        {/* Quick actions - two column grid */}
        <div className="grid grid-cols-2 gap-2.5 pt-1">
          <Button 
            variant="outline" 
            className="justify-center h-12"
            onClick={() => navigate('/glossary')}
          >
            <BookOpen className="h-4 w-4 mr-2" />
            Glossaire
          </Button>
          <Button 
            className="justify-center h-12 bg-primary/10 text-primary hover:bg-primary/20 border border-primary/20"
            onClick={() => navigate('/glossary')}
          >
            <MessageCircle className="h-4 w-4 mr-2" />
            Question
          </Button>
        </div>

        {/* Disclaimer */}
        <p className="text-[10px] text-muted-foreground/50 text-center pt-1">
          L'assistant IA fournit des informations générales uniquement.
        </p>
      </CardContent>
    </Card>
  );
};
