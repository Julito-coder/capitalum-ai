interface Props {
  data: {
    monthly_cashflow?: number;
    annual_return?: number;
    effort_epargne?: number;
    patrimony_10y?: number;
  };
}

const fmt = (n: number) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n);

export const RealEstateCashflow = ({ data }: Props) => {
  const { monthly_cashflow = 0, annual_return = 0, effort_epargne = 0, patrimony_10y = 0 } = data || {};

  const cards = [
    { label: 'Cashflow mensuel', value: fmt(monthly_cashflow), color: monthly_cashflow >= 0 ? '#4B8264' : '#C9432E' },
    { label: 'Rentabilité', value: `${(annual_return * 100).toFixed(2)}%`, color: '#1B3A5C' },
    { label: 'Effort épargne /mois', value: fmt(effort_epargne), color: '#C8943E' },
    { label: 'Patrimoine à 10 ans', value: fmt(patrimony_10y), color: '#1B3A5C' },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 mt-3">
      {cards.map((c, i) => (
        <div key={i} className="rounded-xl bg-white border border-[#E5DED3] shadow-sm p-4">
          <p className="text-xs text-[#6B7A8D] mb-1" style={{ fontFamily: 'Sora' }}>
            {c.label}
          </p>
          <p className="text-xl font-semibold" style={{ color: c.color, fontFamily: 'Sora' }}>
            {c.value}
          </p>
        </div>
      ))}
    </div>
  );
};
