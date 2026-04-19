import { Sparkles, ArrowRight } from 'lucide-react';

interface Recommendation {
  title: string;
  description?: string;
  estimated_gain?: number;
  action_label?: string;
  action_prompt?: string;
}

interface Props {
  data: { recommendations?: Recommendation[] };
  onRunPrompt?: (prompt: string) => void;
}

const fmt = (n: number) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n);

export const RecommendationsList = ({ data, onRunPrompt }: Props) => {
  const recos = data?.recommendations ?? [];

  return (
    <div className="space-y-3 mt-3">
      {recos.map((r, i) => (
        <div key={i} className="rounded-xl bg-white border border-[#E5DED3] shadow-sm p-4">
          <div className="flex items-start justify-between gap-3 mb-2">
            <div className="flex items-start gap-2 flex-1">
              <Sparkles className="w-4 h-4 text-[#C8943E] mt-0.5 shrink-0" />
              <h4 className="font-semibold text-[#1B3A5C]" style={{ fontFamily: 'Sora' }}>
                {r.title}
              </h4>
            </div>
            {typeof r.estimated_gain === 'number' && r.estimated_gain > 0 && (
              <span className="text-sm font-semibold text-[#4B8264] whitespace-nowrap">
                +{fmt(r.estimated_gain)}
              </span>
            )}
          </div>
          {r.description && <p className="text-sm text-[#1F3347] mb-3">{r.description}</p>}
          {(r.action_label || r.action_prompt) && (
            <button
              onClick={() => r.action_prompt && onRunPrompt?.(r.action_prompt)}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-[#C8943E] hover:text-[#1B3A5C] transition-colors"
              style={{ fontFamily: 'Sora' }}
            >
              {r.action_label || 'Lancer avec Élio'}
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      ))}
    </div>
  );
};
