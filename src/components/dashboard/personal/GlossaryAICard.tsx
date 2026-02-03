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
  category: 'fiscal' | 'epargne' | 'immobilier' | 'general';
}

// Context-aware question suggestions
const getContextualQuestions = (profile: UserProfile | null): SuggestedQuestion[] => {
  const questions: SuggestedQuestion[] = [];
  
  // Always relevant
  questions.push({
    id: 'tmi',
    question: 'Comment calculer ma tranche marginale d\'imposition ?',
    category: 'fiscal'
  });
  
  if (profile?.isEmployee) {
    questions.push({
      id: 'frais-reels',
      question: 'Frais réels vs abattement 10% : que choisir ?',
      category: 'fiscal'
    });
  }
  
  if (profile?.isSelfEmployed) {
    questions.push({
      id: 'micro-reel',
      question: 'Micro-entreprise vs régime réel : comparaison',
      category: 'fiscal'
    });
  }
  
  if ((profile?.peaBalance || 0) > 0) {
    questions.push({
      id: 'pea-fiscalite',
      question: 'Fiscalité du PEA après 5 ans',
      category: 'epargne'
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
  
  return questions.slice(0, 4);
};

const getCategoryColor = (category: string) => {
  switch (category) {
    case 'fiscal': return 'bg-info/10 text-info border-info/30';
    case 'epargne': return 'bg-success/10 text-success border-success/30';
    case 'immobilier': return 'bg-warning/10 text-warning border-warning/30';
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
    <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <div className="p-2 rounded-lg bg-primary/10">
            <Sparkles className="h-5 w-5 text-primary" />
          </div>
          Glossaire & Aide IA
        </CardTitle>
        <p className="text-sm text-muted-foreground">Posez vos questions fiscales</p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Suggested questions */}
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
            Questions suggérées
          </p>
          {suggestedQuestions.map((q) => (
            <button
              key={q.id}
              className="w-full flex items-center gap-3 p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors text-left group"
              onClick={() => navigate('/glossary')}
            >
              <HelpCircle className="h-4 w-4 text-muted-foreground shrink-0" />
              <span className="text-sm flex-1 group-hover:text-primary transition-colors">
                {q.question}
              </span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${getCategoryColor(q.category)}`}>
                {getCategoryLabel(q.category)}
              </span>
            </button>
          ))}
        </div>

        {/* Quick actions */}
        <div className="grid grid-cols-2 gap-2 pt-2">
          <Button 
            variant="outline" 
            className="justify-start h-auto py-3"
            onClick={() => navigate('/glossary')}
          >
            <BookOpen className="h-4 w-4 mr-2" />
            Glossaire
          </Button>
          <Button 
            className="justify-start h-auto py-3 bg-primary/10 text-primary hover:bg-primary/20 border border-primary/30"
            onClick={() => navigate('/glossary')}
          >
            <MessageCircle className="h-4 w-4 mr-2" />
            Poser une question
          </Button>
        </div>

        {/* AI disclaimer */}
        <p className="text-[10px] text-muted-foreground/60 text-center">
          L'assistant IA fournit des informations générales. Consultez un professionnel pour un conseil personnalisé.
        </p>
      </CardContent>
    </Card>
  );
};
