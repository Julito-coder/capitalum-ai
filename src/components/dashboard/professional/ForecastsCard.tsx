import { CalendarClock, TrendingUp, AlertTriangle, Check, Clock, ChevronRight, Play } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useNavigate } from 'react-router-dom';
import { UserProfile, formatCurrency } from '@/lib/dashboardService';
import { useActionGuide } from '@/components/guides/ActionGuideContext';
import { createFiscaliteISGuide } from '@/components/guides';

interface ForecastsCardProps {
  profile: UserProfile | null;
}

interface ForecastItem {
  id: string;
  label: string;
  amount: number;
  dueDate: Date;
  type: 'urssaf' | 'tva' | 'ir' | 'is' | 'other';
  isPaid: boolean;
}

const getUpcomingObligations = (profile: UserProfile | null): ForecastItem[] => {
  const now = new Date();
  const year = now.getFullYear();
  const ca = profile?.annualRevenueHt || 0;
  const urssafQuarterly = ca * 0.22 / 4;
  const estimatedIR = ca * 0.15;
  
  const items: ForecastItem[] = [
    { id: 'urssaf-q1', label: 'URSSAF T1', amount: urssafQuarterly, dueDate: new Date(year, 0, 31), type: 'urssaf', isPaid: now > new Date(year, 0, 31) },
    { id: 'urssaf-q2', label: 'URSSAF T2', amount: urssafQuarterly, dueDate: new Date(year, 3, 30), type: 'urssaf', isPaid: now > new Date(year, 3, 30) },
    { id: 'ir-acompte-1', label: 'Acompte IR', amount: estimatedIR / 3, dueDate: new Date(year, 1, 15), type: 'ir', isPaid: now > new Date(year, 1, 15) },
    { id: 'urssaf-q3', label: 'URSSAF T3', amount: urssafQuarterly, dueDate: new Date(year, 6, 31), type: 'urssaf', isPaid: now > new Date(year, 6, 31) },
    { id: 'ir-acompte-2', label: 'Acompte IR', amount: estimatedIR / 3, dueDate: new Date(year, 4, 15), type: 'ir', isPaid: now > new Date(year, 4, 15) },
    { id: 'urssaf-q4', label: 'URSSAF T4', amount: urssafQuarterly, dueDate: new Date(year, 9, 31), type: 'urssaf', isPaid: now > new Date(year, 9, 31) },
    { id: 'ir-solde', label: 'Solde IR', amount: estimatedIR / 3, dueDate: new Date(year, 8, 15), type: 'ir', isPaid: now > new Date(year, 8, 15) },
  ];
  
  return items.filter(item => item.dueDate > now || !item.isPaid).sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());
};

const getTypeColor = (type: string) => {
  switch (type) {
    case 'urssaf': return 'bg-info/10 text-info';
    case 'ir': return 'bg-warning/10 text-warning';
    case 'is': return 'bg-destructive/10 text-destructive';
    case 'tva': return 'bg-accent/10 text-accent';
    default: return 'bg-muted text-muted-foreground';
  }
};

const formatDate = (date: Date) => date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });

const getDaysUntil = (date: Date) => {
  const diff = Math.ceil((date.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
  if (diff <= 0) return 'Échue';
  if (diff === 1) return 'Demain';
  if (diff < 7) return `${diff}j`;
  if (diff < 30) return `${Math.ceil(diff / 7)}sem`;
  return `${Math.ceil(diff / 30)}m`;
};

const filterByHorizon = (items: ForecastItem[], months: number) => {
  const limit = new Date();
  limit.setMonth(limit.getMonth() + months);
  return items.filter(item => item.dueDate <= limit);
};

export const ForecastsCard = ({ profile }: ForecastsCardProps) => {
  const navigate = useNavigate();
  const { openGuide } = useActionGuide();
  const allObligations = getUpcomingObligations(profile);

  const handleOptimizeClick = () => {
    openGuide(createFiscaliteISGuide(profile), profile);
  };

  const renderTimeline = (items: ForecastItem[]) => {
    if (items.length === 0) {
      return (
        <div className="text-center py-6 text-muted-foreground text-sm">
          Aucune échéance sur cette période
        </div>
      );
    }

    const totalAmount = items.reduce((sum, item) => sum + item.amount, 0);
    const estimatedSavings = Math.round(totalAmount * 0.1); // 10% d'économie potentielle

    return (
      <div className="space-y-2.5">
        {items.slice(0, 3).map((item) => {
          const daysUntil = getDaysUntil(item.dueDate);
          const isUrgent = daysUntil === 'Demain' || daysUntil.includes('j');
          
          return (
            <div 
              key={item.id}
              className={`flex items-center gap-3 p-3.5 rounded-xl border min-h-[60px] ${
                isUrgent ? 'bg-warning/5 border-warning/20' : 'bg-secondary/30 border-border/20'
              }`}
            >
              <div className={`p-2 rounded-lg shrink-0 ${getTypeColor(item.type)}`}>
                {item.isPaid ? <Check className="h-4 w-4" /> : isUrgent ? <AlertTriangle className="h-4 w-4" /> : <Clock className="h-4 w-4" />}
              </div>
              
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{item.label}</p>
                <p className="text-xs text-muted-foreground">{formatDate(item.dueDate)}</p>
              </div>
              
              <div className="text-right shrink-0">
                <p className="text-sm font-semibold">{formatCurrency(item.amount)}</p>
                <p className={`text-xs ${isUrgent ? 'text-warning font-medium' : 'text-muted-foreground'}`}>
                  {daysUntil}
                </p>
              </div>
            </div>
          );
        })}

        {/* Total + optimization CTA */}
        <div className="space-y-2 mt-3">
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-primary/5 border border-primary/15">
            <span className="text-sm font-medium">À provisionner</span>
            <span className="text-lg font-bold text-primary">{formatCurrency(totalAmount)}</span>
          </div>

          {/* Actionable optimization */}
          {estimatedSavings > 500 && (
            <button
              onClick={handleOptimizeClick}
              className="w-full flex items-center justify-between p-3 rounded-xl bg-success/5 border border-success/20 hover:border-success/40 transition-all group"
            >
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-success" />
                <span className="text-sm font-medium group-hover:text-success transition-colors">
                  Réduire ces montants
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="bg-success/10 text-success border-success/30 text-xs">
                  -{formatCurrency(estimatedSavings)}
                </Badge>
                <Play className="h-4 w-4 text-success" />
              </div>
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <Card className="border border-border/30 bg-card/80 backdrop-blur-sm">
      <CardHeader className="pb-3 pt-5 px-5 sm:px-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-warning/10 shrink-0">
            <CalendarClock className="h-5 w-5 text-warning" />
          </div>
          <div className="min-w-0">
            <CardTitle className="text-base sm:text-lg font-semibold">Prévisions</CardTitle>
            <p className="text-xs sm:text-sm text-muted-foreground">Échéances fiscales & sociales</p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="px-5 sm:px-6 pb-5 sm:pb-6">
        <Tabs defaultValue="3m" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-4 h-11">
            <TabsTrigger value="3m" className="text-sm">3 mois</TabsTrigger>
            <TabsTrigger value="6m" className="text-sm">6 mois</TabsTrigger>
            <TabsTrigger value="12m" className="text-sm">12 mois</TabsTrigger>
          </TabsList>
          
          <TabsContent value="3m" className="mt-0">
            {renderTimeline(filterByHorizon(allObligations, 3))}
          </TabsContent>
          <TabsContent value="6m" className="mt-0">
            {renderTimeline(filterByHorizon(allObligations, 6))}
          </TabsContent>
          <TabsContent value="12m" className="mt-0">
            {renderTimeline(filterByHorizon(allObligations, 12))}
          </TabsContent>
        </Tabs>

        <Button 
          variant="ghost" 
          className="w-full justify-between text-muted-foreground hover:text-foreground min-h-[44px] mt-4 -mx-1"
          onClick={() => navigate('/pro/urssaf')}
        >
          <span className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Toutes les prévisions
          </span>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </CardContent>
    </Card>
  );
};
