import { ExternalLink, Star, ArrowRight, Wallet, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Partner } from '@/data/partnersData';
import { usePartnerRouter, RecommendationType, getUserSegment } from '@/hooks/usePartnerRouter';
import { buildTrackedUrl, trackPartnerClick, PartnerPosition } from '@/lib/partnerTracking';
import { UserProfile } from '@/lib/dashboardService';

interface PartnerRecommendationsProps {
  type: RecommendationType;
  profile: UserProfile | null;
  campaign?: string;
}

const PartnerCard = ({
  partner,
  position,
  type,
  campaign,
  userSegment,
  isBest = false,
}: {
  partner: Partner;
  position: PartnerPosition;
  type: string;
  campaign?: string;
  userSegment: string;
  isBest?: boolean;
}) => {
  const handleClick = () => {
    trackPartnerClick(type, partner.name, position, userSegment);
    const url = buildTrackedUrl(partner.url, campaign);
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div
      className={`p-4 rounded-xl border transition-all ${
        isBest
          ? 'bg-primary/5 border-primary/30 shadow-sm'
          : 'bg-secondary/30 border-border/30 hover:border-primary/20'
      }`}
    >
      {/* Logo and header */}
      <div className="flex items-start gap-3 mb-3">
        {partner.logoUrl && (
          <div className="flex-shrink-0">
            <img
              src={partner.logoUrl}
              alt={`${partner.name} logo`}
              className="h-10 w-10 object-contain bg-white rounded-lg p-1"
              onError={(e) => {
                // Fallback si le logo ne charge pas
                (e.currentTarget as HTMLImageElement).style.display = 'none';
              }}
            />
          </div>
        )}
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              {isBest && (
                <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary">
                  <Star className="h-3 w-3" />
                  Recommandé
                </span>
              )}
            </div>
            {partner.performance && (
              <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-success/10 text-success">
                {partner.performance}
              </span>
            )}
          </div>
          <h3 className="font-medium text-sm">{partner.name}</h3>
        </div>
      </div>

      <p className="text-xs text-muted-foreground mb-3">{partner.description}</p>

      {(partner.fees || partner.monthlyFee) && (
        <div className="flex gap-3 text-xs text-muted-foreground mb-3">
          {partner.fees && <span>Frais : {partner.fees}</span>}
          {partner.monthlyFee && <span>Abonnement : {partner.monthlyFee}</span>}
        </div>
      )}

      <Button
        variant={isBest ? 'default' : 'outline'}
        size="sm"
        className="w-full gap-2"
        onClick={handleClick}
      >
        {partner.cta}
        <ExternalLink className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
};

export const PartnerRecommendations = ({ type, profile, campaign }: PartnerRecommendationsProps) => {
  const { primary, alternatives, neobanking, relevanceScore } = usePartnerRouter(type, profile);
  const userSegment = getUserSegment(profile);

  return (
    <div className="space-y-4">
      {/* Relevance score */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Pertinence pour votre profil</span>
          <span className="font-semibold text-primary">{relevanceScore}%</span>
        </div>
        <Progress value={relevanceScore} className="h-2" />
      </div>

      {/* Primary partner */}
      <PartnerCard
        partner={primary}
        position="primary"
        type={type}
        campaign={campaign}
        userSegment={userSegment}
        isBest
      />

      {/* Alternatives */}
      {alternatives.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
            <ArrowRight className="h-3 w-3" />
            Alternatives
          </p>
          {alternatives.map((partner) => (
            <PartnerCard
              key={partner.id}
              partner={partner}
              position="alternative"
              type={type}
              campaign={campaign}
              userSegment={userSegment}
            />
          ))}
        </div>
      )}

      {/* Neobanking suggestion */}
      {neobanking && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
            <Wallet className="h-3 w-3" />
            Compte complémentaire recommandé
          </p>
          <PartnerCard
            partner={neobanking}
            position="neobanking"
            type={type}
            campaign={campaign}
            userSegment={userSegment}
          />
        </div>
      )}
    </div>
  );
};
