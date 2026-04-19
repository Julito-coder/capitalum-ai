import { Calendar } from 'lucide-react';

interface Deadline {
  label: string;
  date: string;
  amount?: number;
  impact?: string;
}

interface Props {
  data: { deadlines?: Deadline[] };
}

const fmt = (n: number) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n);

const fmtDate = (d: string) => {
  try {
    return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
  } catch {
    return d;
  }
};

export const DeadlinesList = ({ data }: Props) => {
  const deadlines = data?.deadlines ?? [];

  return (
    <div className="rounded-xl bg-white border border-[#E5DED3] shadow-sm p-4 mt-3">
      <h4 className="font-semibold text-[#1B3A5C] mb-3" style={{ fontFamily: 'Sora' }}>
        Tes prochaines échéances
      </h4>
      <div className="space-y-3">
        {deadlines.map((d, i) => (
          <div key={i} className="flex gap-3">
            <div className="flex flex-col items-center">
              <div className="w-8 h-8 rounded-full bg-[#F8F5F0] border border-[#E5DED3] flex items-center justify-center">
                <Calendar className="w-4 h-4 text-[#C8943E]" />
              </div>
              {i < deadlines.length - 1 && <div className="w-px flex-1 bg-[#E5DED3] mt-1" />}
            </div>
            <div className="flex-1 pb-3">
              <p className="text-sm font-medium text-[#1B3A5C]" style={{ fontFamily: 'Sora' }}>
                {d.label}
              </p>
              <p className="text-xs text-[#6B7A8D] mt-0.5">{fmtDate(d.date)}</p>
              {typeof d.amount === 'number' && d.amount > 0 && (
                <p className="text-sm font-semibold text-[#C8943E] mt-1">{fmt(d.amount)}</p>
              )}
              {d.impact && <p className="text-xs text-[#6B7A8D] mt-0.5">{d.impact}</p>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
