import { ExternalLink, Star, ArrowRight, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Partner } from '@/data/partnersData';
import { usePartnerRouter, RecommendationType, getUserSegment } from '@/hooks/usePartnerRouter';
import { buildTrackedUrl, trackPartnerClick, PartnerPosition } from '@/lib/partnerTracking';
import { UserProfile } from '@/lib/dashboardService';

// Couleurs stables par partenaire
const PARTNER_COLORS: Record<string, string> = {
  'Carac': 'bg-blue-600',
  'Suravenir (Fortuneo)': 'bg-orange-500',
  'Nalo': 'bg-violet-600',
  'Trade Republic': 'bg-stone-800',
  'Boursorama': 'bg-red-600',
  'Fortuneo': 'bg-orange-600',
  'Linxea': 'bg-teal-600',
  'Boursorama Vie': 'bg-red-500',
  'Yomoni': 'bg-emerald-600',
  'N26': 'bg-cyan-600',
  'Revolut': 'bg-indigo-600',
  'Bunq': 'bg-green-500',
  'Qonto': 'bg-fuchsia-600',
  'Shine': 'bg-yellow-500',
  'Indy': 'bg-sky-600',
  'Pennylane': 'bg-pink-600',
  'Amundi Épargne Entreprise': 'bg-blue-700',
  'Natixis Interépargne': 'bg-rose-600',
  'Impots.gouv.fr': 'bg-blue-800',
};

const getPartnerInitials = (name: string): string => {
  const words = name.replace(/[()]/g, '').split(/\s+/).filter(Boolean);
  if (words.length === 1) return words[0].substring(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
};

const getPartnerColor = (name: string): string => {
  return PARTNER_COLORS[name] || 'bg-primary';
};

const PartnerAvatar = ({ partner }: { partner: Partner }) => {
  return (
    <div className={`flex-shrink-0 h-10 w-10 rounded-lg ${getPartnerColor(partner.name)} flex items-center justify-center`}>
      <span className="text-white text-xs font-bold">{getPartnerInitials(partner.name)}</span>
    </div>
  );
};

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
      <div className="flex items-start gap-3 mb-3">
        <PartnerAvatar partner={partner} />
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
