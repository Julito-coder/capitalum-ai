import { ArrowRight, Lightbulb, Clock, TrendingUp } from 'lucide-react';
import { Recommendation, formatCurrency } from '@/data/mockData';

interface RecommendationCardProps {
  recommendation: Recommendation;
  onAccept?: () => void;
  onDetails?: () => void;
}

export const RecommendationCard = ({ recommendation, onAccept, onDetails }: RecommendationCardProps) => {
  return (
    <div className="glass-card rounded-2xl p-6 transition-all duration-300 hover:glow-sm">
      {/* Header */}
      <div className="flex items-start gap-4 mb-6">
        <div className="p-3 rounded-xl bg-primary/10">
          <Lightbulb className="h-6 w-6 text-primary" />
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold mb-1">{recommendation.title}</h3>
          <p className="text-sm text-muted-foreground">{recommendation.description}</p>
        </div>
        <div className="text-right">
          <span className="text-2xl font-bold text-success">+{formatCurrency(recommendation.gain)}</span>
          <p className="text-xs text-muted-foreground">d'économies</p>
        </div>
      </div>

      {/* Comparison */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="rounded-xl bg-muted/30 p-4 border border-border/50">
          <p className="text-xs text-muted-foreground mb-2 uppercase tracking-wide">Actuellement</p>
          <p className="text-lg font-semibold">{formatCurrency(recommendation.currentOption.value)}</p>
          <p className="text-xs text-muted-foreground mt-1">{recommendation.currentOption.detail}</p>
        </div>
        <div className="rounded-xl bg-primary/5 p-4 border border-primary/20 relative">
          <div className="absolute -top-2 right-3">
            <span className="text-xs font-bold bg-primary text-primary-foreground px-2 py-0.5 rounded-full">
              Recommandé
            </span>
          </div>
          <p className="text-xs text-muted-foreground mb-2 uppercase tracking-wide">Optimisé</p>
          <p className="text-lg font-semibold text-primary">{formatCurrency(recommendation.recommendedOption.value)}</p>
          <p className="text-xs text-muted-foreground mt-1">{recommendation.recommendedOption.detail}</p>
        </div>
      </div>

      {/* Metadata */}
      <div className="flex items-center gap-6 mb-6 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4" />
          <span>{recommendation.effort}</span>
        </div>
        <div className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-success" />
          <span>ROI immédiat</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button 
          onClick={onAccept}
          className="btn-primary flex-1"
        >
          Accepter la recommandation
          <ArrowRight className="h-4 w-4" />
        </button>
        <button 
          onClick={onDetails}
          className="btn-secondary"
        >
          Détails
        </button>
      </div>
    </div>
  );
};
