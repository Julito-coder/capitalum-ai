import { Check, AlertTriangle, ExternalLink } from 'lucide-react';

interface ConceptData {
  id: string;
  title: string;
  elio_explanation: string;
  key_numbers_2025: string[];
  who_it_fits: string[];
  watch_out_for: string[];
  source_url: string;
}

interface Props {
  data: {
    concept?: ConceptData;
    error?: string;
  };
}

export const FiscalConcept = ({ data }: Props) => {
  if (data?.error || !data?.concept) {
    return (
      <div className="mt-3 p-3 rounded-xl bg-[#FFF4E6] border border-[#F5D4A8]" style={{ fontFamily: 'Sora' }}>
        <p className="text-sm text-[#1F3347]">{data?.error || 'Concept introuvable.'}</p>
      </div>
    );
  }

  const c = data.concept;

  return (
    <div
      className="mt-3 rounded-xl bg-white border border-[#E5E7EB] overflow-hidden"
      style={{ fontFamily: 'Sora' }}
    >
      <div className="px-4 py-3 bg-[#F8F5F0] border-b border-[#E5DED3]">
        <h3 className="text-base font-semibold text-[#1B3A5C]">{c.title}</h3>
      </div>

      <div className="p-4 space-y-4">
        {/* En gros */}
        <div>
          <h4 className="text-xs font-semibold text-[#6B7A8D] uppercase tracking-wide mb-1.5">
            En gros
          </h4>
          <p className="text-sm text-[#1F3347] leading-relaxed">{c.elio_explanation}</p>
        </div>

        {/* Chiffres 2025 */}
        {c.key_numbers_2025?.length > 0 && (
          <div>
            <h4 className="text-xs font-semibold text-[#6B7A8D] uppercase tracking-wide mb-1.5">
              Les chiffres 2025
            </h4>
            <ul className="space-y-1">
              {c.key_numbers_2025.map((n, i) => (
                <li key={i} className="text-sm text-[#1F3347] flex items-start gap-2">
                  <span className="text-[#C8943E] mt-1">•</span>
                  <span className="leading-relaxed">{n}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Pour qui c'est bien */}
        {c.who_it_fits?.length > 0 && (
          <div>
            <h4 className="text-xs font-semibold text-[#6B7A8D] uppercase tracking-wide mb-1.5">
              Pour qui c'est bien
            </h4>
            <ul className="space-y-1.5">
              {c.who_it_fits.map((w, i) => (
                <li key={i} className="text-sm text-[#1F3347] flex items-start gap-2">
                  <Check className="w-4 h-4 text-[#4B8264] mt-0.5 shrink-0" />
                  <span className="leading-relaxed">{w}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Attention à */}
        {c.watch_out_for?.length > 0 && (
          <div className="rounded-lg bg-[#FFF4E6] border border-[#F5D4A8] p-3">
            <h4 className="text-xs font-semibold text-[#D4923E] uppercase tracking-wide mb-1.5 flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5" />
              Attention à
            </h4>
            <ul className="space-y-1">
              {c.watch_out_for.map((w, i) => (
                <li key={i} className="text-sm text-[#1F3347] flex items-start gap-2">
                  <span className="text-[#D4923E] mt-1">•</span>
                  <span className="leading-relaxed">{w}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Source */}
        <div className="pt-2 border-t border-[#E5E7EB]">
          <a
            href={c.source_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs font-medium text-[#C8943E] hover:underline"
          >
            Source officielle
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>
    </div>
  );
};
