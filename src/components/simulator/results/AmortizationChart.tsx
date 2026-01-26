import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { 
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip as RechartsTooltip, ResponsiveContainer, Legend, ComposedChart, Line
} from 'recharts';
import { formatCurrency } from '@/data/mockData';
import { AmortizationRow } from '@/lib/realEstateTypes';

interface AmortizationChartProps {
  amortizationTable: AmortizationRow[];
  loanAmount: number;
  totalInterest: number;
  totalInsurance: number;
}

export const AmortizationChart: React.FC<AmortizationChartProps> = ({
  amortizationTable,
  loanAmount,
  totalInterest,
  totalInsurance
}) => {
  // Aggregate by year
  const yearlyData: { 
    year: number; 
    principal: number; 
    interest: number; 
    insurance: number;
    remaining_balance: number;
    cumulative_principal: number;
  }[] = [];
  
  let cumulativePrincipal = 0;
  const maxYear = Math.ceil(amortizationTable.length / 12);
  
  for (let year = 1; year <= maxYear; year++) {
    const yearRows = amortizationTable.filter(r => r.year === year);
    if (yearRows.length > 0) {
      const yearPrincipal = yearRows.reduce((s, r) => s + r.principal, 0);
      cumulativePrincipal += yearPrincipal;
      
      yearlyData.push({
        year,
        principal: yearPrincipal,
        interest: yearRows.reduce((s, r) => s + r.interest, 0),
        insurance: yearRows.reduce((s, r) => s + r.insurance, 0),
        remaining_balance: yearRows[yearRows.length - 1].remaining_balance,
        cumulative_principal: cumulativePrincipal,
      });
    }
  }

  const totalCost = loanAmount + totalInterest + totalInsurance;
  const interestPct = (totalInterest / totalCost * 100).toFixed(1);
  const insurancePct = (totalInsurance / totalCost * 100).toFixed(1);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const d = payload[0].payload;
      return (
        <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
          <p className="font-semibold mb-2">Année {label}</p>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between gap-4">
              <span className="text-primary">Capital remboursé:</span>
              <span className="font-medium">{formatCurrency(d.principal)}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-chart-4">Intérêts payés:</span>
              <span className="font-medium">{formatCurrency(d.interest)}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-chart-3">Assurance:</span>
              <span className="font-medium">{formatCurrency(d.insurance)}</span>
            </div>
            <div className="border-t pt-1 mt-1 flex justify-between gap-4">
              <span>Capital restant dû:</span>
              <span className="font-bold">{formatCurrency(d.remaining_balance)}</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Main chart - CRD evolution */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Évolution du capital restant dû</CardTitle>
          <CardDescription>
            Courbe de remboursement du prêt sur la durée
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={yearlyData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="crdGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--chart-4))" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="hsl(var(--chart-4))" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="principalGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
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
                  dataKey="remaining_balance" 
                  name="Capital restant dû"
                  stroke="hsl(var(--chart-4))" 
                  fill="url(#crdGradient)"
                  strokeWidth={2}
                />
                <Area 
                  type="monotone" 
                  dataKey="cumulative_principal" 
                  name="Capital remboursé"
                  stroke="hsl(var(--primary))" 
                  fill="url(#principalGradient)"
                  strokeWidth={2}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Principal vs Interest breakdown */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Répartition annuelle capital / intérêts</CardTitle>
          <CardDescription>
            Composition des remboursements par année
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={yearlyData.slice(0, 25)} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" vertical={false} />
                <XAxis 
                  dataKey="year" 
                  tick={{ fontSize: 10 }}
                  interval={Math.floor(yearlyData.length / 10)}
                />
                <YAxis 
                  tickFormatter={(v) => `${(v/1000).toFixed(0)}k`}
                  tick={{ fontSize: 11 }}
                />
                <RechartsTooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                
                <Bar 
                  dataKey="principal" 
                  name="Capital" 
                  stackId="a" 
                  fill="hsl(var(--primary))" 
                  radius={[0, 0, 0, 0]}
                />
                <Bar 
                  dataKey="interest" 
                  name="Intérêts" 
                  stackId="a" 
                  fill="hsl(var(--chart-4))" 
                  radius={[0, 0, 0, 0]}
                />
                <Bar 
                  dataKey="insurance" 
                  name="Assurance" 
                  stackId="a" 
                  fill="hsl(var(--chart-3))" 
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Cost summary */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Coût total du crédit</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-3">
            <div className="p-4 rounded-lg bg-primary/10 text-center">
              <p className="text-2xl font-bold text-primary">{formatCurrency(loanAmount)}</p>
              <p className="text-sm text-muted-foreground">Capital emprunté</p>
            </div>
            <div className="p-4 rounded-lg bg-chart-4/10 text-center">
              <p className="text-2xl font-bold text-chart-4">{formatCurrency(totalInterest)}</p>
              <p className="text-sm text-muted-foreground">Intérêts ({interestPct}%)</p>
            </div>
            <div className="p-4 rounded-lg bg-chart-3/10 text-center">
              <p className="text-2xl font-bold text-chart-3">{formatCurrency(totalInsurance)}</p>
              <p className="text-sm text-muted-foreground">Assurance ({insurancePct}%)</p>
            </div>
            <div className="p-4 rounded-lg bg-muted text-center">
              <p className="text-2xl font-bold">{formatCurrency(totalCost)}</p>
              <p className="text-sm text-muted-foreground">Coût total</p>
            </div>
          </div>
          
          {/* Ratio bar */}
          <div className="mt-4 h-4 rounded-full overflow-hidden flex">
            <div 
              className="bg-primary h-full" 
              style={{ width: `${(loanAmount / totalCost * 100)}%` }}
            />
            <div 
              className="bg-chart-4 h-full" 
              style={{ width: `${(totalInterest / totalCost * 100)}%` }}
            />
            <div 
              className="bg-chart-3 h-full" 
              style={{ width: `${(totalInsurance / totalCost * 100)}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-muted-foreground mt-1">
            <span>Capital ({(loanAmount / totalCost * 100).toFixed(0)}%)</span>
            <span>Intérêts ({interestPct}%)</span>
            <span>Assurance ({insurancePct}%)</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AmortizationChart;
