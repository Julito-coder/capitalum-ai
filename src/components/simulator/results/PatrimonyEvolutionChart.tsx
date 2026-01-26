import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, 
  Tooltip as RechartsTooltip, ResponsiveContainer, Legend, ComposedChart, Line
} from 'recharts';
import { formatCurrency } from '@/data/mockData';
import { PatrimonyYear } from '@/lib/realEstateTypes';

interface PatrimonyEvolutionChartProps {
  patrimonySeries: PatrimonyYear[];
  downPayment: number;
}

export const PatrimonyEvolutionChart: React.FC<PatrimonyEvolutionChartProps> = ({
  patrimonySeries,
  downPayment
}) => {
  const data = patrimonySeries.map(p => ({
    year: p.year,
    valeurBien: p.property_value,
    detteRestante: p.remaining_debt,
    cashflowCumule: p.cumulative_cashflow,
    patrimoineNet: p.net_patrimony,
    equity: p.property_value - p.remaining_debt,
  }));

  const finalPatrimony = data.length > 0 ? data[data.length - 1].patrimoineNet : 0;
  const roi = downPayment > 0 ? ((finalPatrimony - downPayment) / downPayment * 100) : 0;
  const multiplier = downPayment > 0 ? (finalPatrimony / downPayment) : 0;

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const d = payload[0].payload;
      return (
        <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
          <p className="font-semibold mb-2">Année {label}</p>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between gap-4">
              <span>Valeur bien:</span>
              <span className="font-medium">{formatCurrency(d.valeurBien)}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-chart-4">Dette restante:</span>
              <span className="font-medium">{formatCurrency(d.detteRestante)}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span>Équité:</span>
              <span className="font-medium">{formatCurrency(d.equity)}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className={d.cashflowCumule >= 0 ? 'text-success' : 'text-destructive'}>
                Cashflows cumulés:
              </span>
              <span className="font-medium">{formatCurrency(d.cashflowCumule)}</span>
            </div>
            <div className="border-t pt-1 mt-1 flex justify-between gap-4">
              <span className="font-semibold">Patrimoine net:</span>
              <span className="font-bold text-primary">{formatCurrency(d.patrimoineNet)}</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Évolution du patrimoine net</CardTitle>
        <CardDescription>
          Construction du capital : valeur du bien - dette + cashflows cumulés
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="patrimonyGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="equityGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--success))" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="hsl(var(--success))" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" vertical={false} />
              <XAxis 
                dataKey="year" 
                tickFormatter={(v) => `${v}`}
                tick={{ fontSize: 11 }}
              />
              <YAxis 
                tickFormatter={(v) => `${(v/1000).toFixed(0)}k`}
                tick={{ fontSize: 11 }}
              />
              <RechartsTooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              
              <Area 
                type="monotone" 
                dataKey="patrimoineNet" 
                name="Patrimoine net"
                stroke="hsl(var(--primary))" 
                fill="url(#patrimonyGradient)"
                strokeWidth={2}
              />
              <Line 
                type="monotone" 
                dataKey="valeurBien" 
                name="Valeur du bien"
                stroke="hsl(var(--chart-2))" 
                strokeWidth={1.5}
                strokeDasharray="5 5"
                dot={false}
              />
              <Line 
                type="monotone" 
                dataKey="detteRestante" 
                name="Dette restante"
                stroke="hsl(var(--chart-4))" 
                strokeWidth={1.5}
                dot={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
        
        {/* Summary stats */}
        <div className="mt-4 grid grid-cols-4 gap-2 text-center">
          <div className="p-3 rounded-lg bg-muted/50">
            <p className="text-lg font-bold">{formatCurrency(downPayment)}</p>
            <p className="text-xs text-muted-foreground">Apport initial</p>
          </div>
          <div className="p-3 rounded-lg bg-primary/10">
            <p className="text-lg font-bold text-primary">{formatCurrency(finalPatrimony)}</p>
            <p className="text-xs text-muted-foreground">Patrimoine final</p>
          </div>
          <div className="p-3 rounded-lg bg-success/10">
            <p className={`text-lg font-bold ${roi >= 0 ? 'text-success' : 'text-destructive'}`}>
              {roi >= 0 ? '+' : ''}{roi.toFixed(0)}%
            </p>
            <p className="text-xs text-muted-foreground">ROI total</p>
          </div>
          <div className="p-3 rounded-lg bg-chart-2/10">
            <p className="text-lg font-bold text-chart-2">×{multiplier.toFixed(1)}</p>
            <p className="text-xs text-muted-foreground">Multiplicateur</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PatrimonyEvolutionChart;
