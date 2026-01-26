import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { 
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip as RechartsTooltip, ResponsiveContainer, Legend, Area, ReferenceLine
} from 'recharts';
import { formatCurrency } from '@/data/mockData';
import { CashflowYear } from '@/lib/realEstateTypes';

interface CashflowEvolutionChartProps {
  cashflowSeries: CashflowYear[];
}

export const CashflowEvolutionChart: React.FC<CashflowEvolutionChartProps> = ({
  cashflowSeries
}) => {
  const data = cashflowSeries.map(cf => ({
    year: `An ${cf.year}`,
    yearNum: cf.year,
    revenus: cf.rental_income,
    charges: -cf.operating_costs,
    credit: -cf.loan_payment,
    impots: -cf.tax,
    cashflowBrut: cf.cashflow_before_tax,
    cashflowNet: cf.cashflow_after_tax,
  }));

  // Calculate cumulative cashflow
  let cumulative = 0;
  const dataWithCumulative = data.map(d => {
    cumulative += d.cashflowNet;
    return { ...d, cumulatif: cumulative };
  });

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const d = payload[0].payload;
      return (
        <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
          <p className="font-semibold mb-2">{label}</p>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between gap-4">
              <span className="text-success">Revenus:</span>
              <span className="font-medium">{formatCurrency(d.revenus)}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-destructive">Charges:</span>
              <span className="font-medium">{formatCurrency(d.charges)}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-chart-4">Crédit:</span>
              <span className="font-medium">{formatCurrency(d.credit)}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-warning">Impôts:</span>
              <span className="font-medium">{formatCurrency(d.impots)}</span>
            </div>
            <div className="border-t pt-1 mt-1 flex justify-between gap-4">
              <span className="font-semibold">Cashflow net:</span>
              <span className={`font-bold ${d.cashflowNet >= 0 ? 'text-success' : 'text-destructive'}`}>
                {formatCurrency(d.cashflowNet)}
              </span>
            </div>
            <div className="flex justify-between gap-4 text-muted-foreground">
              <span>Cumulé:</span>
              <span>{formatCurrency(d.cumulatif)}</span>
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
        <CardTitle className="text-base">Évolution des cashflows annuels</CardTitle>
        <CardDescription>
          Décomposition revenus - charges - crédit - impôts
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={dataWithCumulative} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" vertical={false} />
              <XAxis 
                dataKey="year" 
                tick={{ fontSize: 11 }}
                interval={Math.floor(data.length / 10)}
              />
              <YAxis 
                tickFormatter={(v) => `${(v/1000).toFixed(0)}k`}
                tick={{ fontSize: 11 }}
              />
              <RechartsTooltip content={<CustomTooltip />} />
              <Legend 
                wrapperStyle={{ fontSize: 11 }}
                iconType="square"
              />
              <ReferenceLine y={0} stroke="hsl(var(--muted-foreground))" strokeWidth={1} />
              
              <Bar 
                dataKey="revenus" 
                name="Revenus" 
                fill="hsl(var(--success))" 
                stackId="stack"
                radius={[4, 4, 0, 0]}
              />
              <Bar 
                dataKey="charges" 
                name="Charges" 
                fill="hsl(var(--chart-4))" 
                stackId="stack"
              />
              <Bar 
                dataKey="credit" 
                name="Crédit" 
                fill="hsl(var(--primary))" 
                stackId="stack"
              />
              <Bar 
                dataKey="impots" 
                name="Impôts" 
                fill="hsl(var(--warning))" 
                stackId="stack"
                radius={[0, 0, 4, 4]}
              />
              
              <Line 
                type="monotone" 
                dataKey="cashflowNet" 
                name="Cashflow net" 
                stroke="hsl(var(--foreground))" 
                strokeWidth={2}
                dot={{ fill: 'hsl(var(--foreground))', strokeWidth: 0, r: 3 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
        
        {/* Summary stats */}
        <div className="mt-4 grid grid-cols-4 gap-2 text-center text-xs">
          <div className="p-2 rounded-lg bg-success/10">
            <p className="font-semibold text-success">
              {formatCurrency(cashflowSeries.reduce((s, c) => s + c.rental_income, 0))}
            </p>
            <p className="text-muted-foreground">Revenus totaux</p>
          </div>
          <div className="p-2 rounded-lg bg-chart-4/10">
            <p className="font-semibold text-chart-4">
              {formatCurrency(cashflowSeries.reduce((s, c) => s + c.operating_costs + c.loan_payment, 0))}
            </p>
            <p className="text-muted-foreground">Dépenses totales</p>
          </div>
          <div className="p-2 rounded-lg bg-warning/10">
            <p className="font-semibold text-warning">
              {formatCurrency(cashflowSeries.reduce((s, c) => s + c.tax, 0))}
            </p>
            <p className="text-muted-foreground">Impôts totaux</p>
          </div>
          <div className="p-2 rounded-lg bg-primary/10">
            <p className={`font-semibold ${cumulative >= 0 ? 'text-success' : 'text-destructive'}`}>
              {formatCurrency(cumulative)}
            </p>
            <p className="text-muted-foreground">Cashflow cumulé</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CashflowEvolutionChart;
