import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Target, TrendingUp, TrendingDown, AlertTriangle, CheckCircle2, 
  ArrowUp, ArrowDown, Minus
} from 'lucide-react';
import { formatCurrency } from '@/data/mockData';
import { SimulationResults } from '@/lib/realEstateTypes';

interface BreakEvenAnalysisProps {
  results: SimulationResults;
  currentRent: number;
  currentPrice: number;
  currentRate: number;
}

export const BreakEvenAnalysis: React.FC<BreakEvenAnalysisProps> = ({
  results,
  currentRent,
  currentPrice,
  currentRate
}) => {
  const r = results;
  
  // Calculate margins
  const rentMargin = currentRent > 0 ? ((currentRent - r.break_even_rent) / currentRent * 100) : 0;
  const priceMargin = r.break_even_price > 0 ? ((r.break_even_price - currentPrice) / currentPrice * 100) : 0;
  const rateMargin = r.break_even_rate - currentRate;

  const getMarginStatus = (margin: number, type: 'rent' | 'price' | 'rate') => {
    if (type === 'rent') {
      if (margin >= 20) return { status: 'excellent', color: 'text-emerald-500', bg: 'bg-emerald-500' };
      if (margin >= 10) return { status: 'good', color: 'text-success', bg: 'bg-success' };
      if (margin >= 0) return { status: 'warning', color: 'text-warning', bg: 'bg-warning' };
      return { status: 'bad', color: 'text-destructive', bg: 'bg-destructive' };
    }
    if (type === 'price') {
      if (margin >= 15) return { status: 'excellent', color: 'text-emerald-500', bg: 'bg-emerald-500' };
      if (margin >= 5) return { status: 'good', color: 'text-success', bg: 'bg-success' };
      if (margin >= 0) return { status: 'warning', color: 'text-warning', bg: 'bg-warning' };
      return { status: 'bad', color: 'text-destructive', bg: 'bg-destructive' };
    }
    // rate
    if (margin >= 2) return { status: 'excellent', color: 'text-emerald-500', bg: 'bg-emerald-500' };
    if (margin >= 1) return { status: 'good', color: 'text-success', bg: 'bg-success' };
    if (margin >= 0) return { status: 'warning', color: 'text-warning', bg: 'bg-warning' };
    return { status: 'bad', color: 'text-destructive', bg: 'bg-destructive' };
  };

  const rentStatus = getMarginStatus(rentMargin, 'rent');
  const priceStatus = getMarginStatus(priceMargin, 'price');
  const rateStatus = getMarginStatus(rateMargin, 'rate');

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Target className="h-5 w-5 text-primary" />
          Analyse des seuils de rentabilité
        </CardTitle>
        <CardDescription>
          Marges de sécurité avant que le projet devienne non viable
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Rent break-even */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-medium">Loyer minimum</span>
              <Badge variant="outline" className="text-xs">Break-even</Badge>
            </div>
            <div className="flex items-center gap-2">
              <span className={`font-bold ${rentStatus.color}`}>
                {formatCurrency(r.break_even_rent || 0)}
              </span>
              <span className="text-muted-foreground">vs {formatCurrency(currentRent)} actuel</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Progress 
              value={Math.max(0, Math.min(100, rentMargin + 20))} 
              className="h-2 flex-1"
            />
            <span className={`text-sm font-medium w-16 text-right ${rentStatus.color}`}>
              {rentMargin >= 0 ? '+' : ''}{rentMargin.toFixed(0)}%
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            {rentMargin >= 10 
              ? `Marge confortable : le loyer peut baisser de ${rentMargin.toFixed(0)}% avant d'atteindre l'équilibre`
              : rentMargin >= 0
              ? `Marge limitée : attention à la vacance et aux impayés`
              : `Le loyer actuel ne couvre pas les charges - effort d'épargne nécessaire`
            }
          </p>
        </div>

        {/* Price break-even */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-medium">Prix maximum</span>
              <Badge variant="outline" className="text-xs">Rentabilité nulle</Badge>
            </div>
            <div className="flex items-center gap-2">
              <span className={`font-bold ${priceStatus.color}`}>
                {formatCurrency(r.break_even_price || 0)}
              </span>
              <span className="text-muted-foreground">vs {formatCurrency(currentPrice)} actuel</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Progress 
              value={Math.max(0, Math.min(100, priceMargin * 3 + 50))} 
              className="h-2 flex-1"
            />
            <span className={`text-sm font-medium w-16 text-right ${priceStatus.color}`}>
              {priceMargin >= 0 ? '+' : ''}{priceMargin.toFixed(0)}%
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            {priceMargin >= 10
              ? `Bonne marge de négociation possible sur le prix`
              : priceMargin >= 0
              ? `Prix proche du maximum acceptable - négociation conseillée`
              : `Prix trop élevé pour le loyer attendu - risque de perte`
            }
          </p>
        </div>

        {/* Rate break-even */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-medium">Taux maximum</span>
              <Badge variant="outline" className="text-xs">Cashflow nul</Badge>
            </div>
            <div className="flex items-center gap-2">
              <span className={`font-bold ${rateStatus.color}`}>
                {(r.break_even_rate || 0).toFixed(2)}%
              </span>
              <span className="text-muted-foreground">vs {currentRate.toFixed(2)}% actuel</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Progress 
              value={Math.max(0, Math.min(100, rateMargin * 25 + 50))} 
              className="h-2 flex-1"
            />
            <span className={`text-sm font-medium w-16 text-right ${rateStatus.color}`}>
              +{rateMargin.toFixed(2)} pts
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            {rateMargin >= 2
              ? `Projet résistant aux hausses de taux (marge de ${rateMargin.toFixed(1)} points)`
              : rateMargin >= 0.5
              ? `Marge acceptable face aux variations de taux`
              : `Sensibilité élevée aux taux - privilégier un taux fixe`
            }
          </p>
        </div>

        {/* Overall status */}
        <div className={`p-4 rounded-lg ${
          rentMargin >= 10 && priceMargin >= 5 && rateMargin >= 1 
            ? 'bg-success/10 border border-success/30' 
            : rentMargin >= 0 && priceMargin >= 0 && rateMargin >= 0
            ? 'bg-warning/10 border border-warning/30'
            : 'bg-destructive/10 border border-destructive/30'
        }`}>
          <div className="flex items-center gap-3">
            {rentMargin >= 10 && priceMargin >= 5 && rateMargin >= 1 ? (
              <>
                <CheckCircle2 className="h-5 w-5 text-success" />
                <div>
                  <p className="font-semibold text-success">Projet robuste</p>
                  <p className="text-sm text-muted-foreground">
                    Bonnes marges de sécurité sur tous les indicateurs
                  </p>
                </div>
              </>
            ) : rentMargin >= 0 && priceMargin >= 0 && rateMargin >= 0 ? (
              <>
                <AlertTriangle className="h-5 w-5 text-warning" />
                <div>
                  <p className="font-semibold text-warning">Marges limitées</p>
                  <p className="text-sm text-muted-foreground">
                    Projet viable mais sensible aux variations du marché
                  </p>
                </div>
              </>
            ) : (
              <>
                <AlertTriangle className="h-5 w-5 text-destructive" />
                <div>
                  <p className="font-semibold text-destructive">Attention requise</p>
                  <p className="text-sm text-muted-foreground">
                    Un ou plusieurs seuils sont dépassés - revoir les hypothèses
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default BreakEvenAnalysis;
