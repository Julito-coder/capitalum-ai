interface Bracket {
  rate: number;
  amount: number;
  threshold?: number;
}

interface Deduction {
  label: string;
  amount: number;
}

interface TaxBreakdownProps {
  data: {
    total?: number;
    brackets?: Bracket[];
    deductions?: Deduction[];
    effective_rate?: number;
  };
}

const fmt = (n: number) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n);

export const TaxBreakdown = ({ data }: TaxBreakdownProps) => {
  const { total = 0, brackets = [], deductions = [], effective_rate = 0 } = data || {};

  return (
    <div className="rounded-xl bg-white border border-[#E5DED3] shadow-sm p-4 mt-3">
      <h4 className="font-semibold text-[#1B3A5C] mb-3" style={{ fontFamily: 'Sora' }}>
        Détail de ton impôt
      </h4>

      {brackets.length > 0 && (
        <div className="mb-4">
          <p className="text-xs text-[#6B7A8D] mb-2 uppercase tracking-wide">Tranches</p>
          <div className="space-y-1.5">
            {brackets.map((b, i) => (
              <div key={i} className="flex items-center justify-between text-sm">
                <span className="text-[#1F3347]">{(b.rate * 100).toFixed(0)}%</span>
                <span className="font-medium text-[#1B3A5C]">{fmt(b.amount)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {deductions.length > 0 && (
        <div className="mb-4">
          <p className="text-xs text-[#6B7A8D] mb-2 uppercase tracking-wide">Déductions</p>
          <div className="space-y-1.5">
            {deductions.map((d, i) => (
              <div key={i} className="flex items-center justify-between text-sm">
                <span className="text-[#1F3347]">{d.label}</span>
                <span className="font-medium text-[#4B8264]">−{fmt(d.amount)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="border-t border-[#E5DED3] pt-3 flex items-center justify-between">
        <div>
          <p className="text-xs text-[#6B7A8D]">Impôt total estimé</p>
          <p className="text-2xl font-semibold text-[#1B3A5C]" style={{ fontFamily: 'Sora' }}>
            {fmt(total)}
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-[#6B7A8D]">Taux effectif</p>
          <p className="text-lg font-semibold text-[#C8943E]">{(effective_rate * 100).toFixed(1)}%</p>
        </div>
      </div>
    </div>
  );
};
