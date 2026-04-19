import { useState } from 'react';
import { ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';

interface AidItem {
  id: string;
  name: string;
  category: string;
  source_url: string;
  status: 'eligible' | 'not_eligible' | 'needs_info' | 'uncertain';
  reason: string;
  estimated_amount?: string;
  missing_fields?: string[];
}

interface Props {
  data: {
    eligible?: AidItem[];
    needs_info?: AidItem[];
    uncertain?: AidItem[];
    not_eligible?: AidItem[];
  };
}

const Section = ({
  title,
  emoji,
  bgColor,
  borderColor,
  items,
  showAmount = true,
}: {
  title: string;
  emoji: string;
  bgColor: string;
  borderColor: string;
  items: AidItem[];
  showAmount?: boolean;
}) => {
  if (!items || items.length === 0) return null;
  return (
    <div className="mb-3" style={{ fontFamily: 'Sora' }}>
      <div className="flex items-center gap-2 mb-2 px-1">
        <span className="text-base">{emoji}</span>
        <h3 className="text-sm font-semibold text-[#1B3A5C]">
          {title} <span className="text-[#6B7A8D] font-normal">({items.length})</span>
        </h3>
      </div>
      <div className="space-y-2">
        {items.map((aid) => (
          <div
            key={aid.id}
            className="rounded-xl p-3 border"
            style={{ backgroundColor: bgColor, borderColor }}
          >
            <div className="flex items-start justify-between gap-2 mb-1">
              <h4 className="text-sm font-semibold text-[#1F3347] leading-snug">{aid.name}</h4>
              {showAmount && aid.estimated_amount && (
                <span className="text-xs font-semibold text-[#1B3A5C] whitespace-nowrap">
                  {aid.estimated_amount}
                </span>
              )}
            </div>
            <p className="text-xs text-[#1F3347] leading-relaxed mb-2">{aid.reason}</p>
            {aid.missing_fields && aid.missing_fields.length > 0 && (
              <p className="text-[11px] text-[#6B7A8D] mb-2">
                À compléter : {aid.missing_fields.join(', ')}
              </p>
            )}
            <a
              href={aid.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs font-medium text-[#C8943E] hover:underline"
            >
              En savoir plus
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        ))}
      </div>
    </div>
  );
};

export const AidsEligibility = ({ data }: Props) => {
  const [showNotEligible, setShowNotEligible] = useState(false);
  const eligible = data?.eligible || [];
  const needsInfo = data?.needs_info || [];
  const uncertain = data?.uncertain || [];
  const notEligible = data?.not_eligible || [];

  const hasAny = eligible.length + needsInfo.length + uncertain.length + notEligible.length > 0;
  if (!hasAny) {
    return (
      <div className="mt-3 p-3 rounded-xl bg-[#F8F5F0] border border-[#E5DED3]" style={{ fontFamily: 'Sora' }}>
        <p className="text-sm text-[#1F3347]">Aucune analyse d'aide disponible.</p>
      </div>
    );
  }

  return (
    <div className="mt-3" style={{ fontFamily: 'Sora' }}>
      <Section
        title="Tu as droit à"
        emoji="✅"
        bgColor="#D4E8DD"
        borderColor="#A8D0BB"
        items={eligible}
      />
      <Section
        title="Il te manque des infos pour"
        emoji="📝"
        bgColor="#FFF4E6"
        borderColor="#F5D4A8"
        items={needsInfo}
      />
      <Section
        title="À vérifier"
        emoji="🔎"
        bgColor="#FFFBEA"
        borderColor="#F0E5B0"
        items={uncertain}
      />

      {notEligible.length > 0 && (
        <div className="mt-2">
          <button
            onClick={() => setShowNotEligible((v) => !v)}
            className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-[#F4F4F4] border border-[#E5E7EB] text-xs font-medium text-[#6B7A8D] hover:bg-[#EEEEEE] transition-colors"
          >
            <span>
              Pas éligible <span className="font-normal">({notEligible.length})</span>
            </span>
            {showNotEligible ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          {showNotEligible && (
            <div className="mt-2">
              <Section
                title=""
                emoji=""
                bgColor="#F4F4F4"
                borderColor="#E5E7EB"
                items={notEligible}
                showAmount={false}
              />
            </div>
          )}
        </div>
      )}

      <p className="text-[10px] text-[#6B7A8D] mt-3 px-1 leading-relaxed">
        Estimations indicatives basées sur ton profil. Vérifie ton éligibilité réelle sur les sites officiels.
      </p>
    </div>
  );
};
