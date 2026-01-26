import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip as RechartsTooltip, ResponsiveContainer, ReferenceLine
} from 'recharts';
import { formatCurrency } from '@/data/mockData';
import { SensitivityData } from '@/lib/realEstateTypes';

interface SensitivityChartsProps {
  sensitivityData: SensitivityData;
  currentRent: number;
  currentRate: number;
}

export const SensitivityCharts: React.FC<SensitivityChartsProps> = ({
  sensitivityData,
  currentRent,
  currentRate
}) => {
  const rentData = sensitivityData.rent_sensitivity || [];
  const rateData = sensitivityData.rate_sensitivity || [];
  const priceData = sensitivityData.price_sensitivity || [];

  const RentTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const d = payload[0].payload;
      return (
        <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
          <p className="font-semibold">Loyer: {d.rent}€/mois</p>
          <div className="space-y-1 text-sm mt-2">
            <div className="flex justify-between gap-4">
              <span>Cashflow:</span>
              <span className={`font-medium ${d.cashflow >= 0 ? 'text-success' : 'text-destructive'}`}>
                {formatCurrency(d.cashflow)}/mois
              </span>
            </div>
            <div className="flex justify-between gap-4">
              <span>Rentabilité:</span>
              <span className="font-medium">{d.yield?.toFixed(1) || 0}%</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  const RateTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const d = payload[0].payload;
      return (
        <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
          <p className="font-semibold">Taux: {d.rate}%</p>
          <div className="space-y-1 text-sm mt-2">
            <div className="flex justify-between gap-4">
              <span>Mensualité:</span>
              <span className="font-medium">{formatCurrency(d.monthly_payment)}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span>Cashflow:</span>
              <span className={`font-medium ${d.cashflow >= 0 ? 'text-success' : 'text-destructive'}`}>
                {formatCurrency(d.cashflow)}/mois
              </span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="grid md:grid-cols-2 gap-6">
      {/* Rent sensitivity */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Sensibilité au loyer</CardTitle>
          <CardDescription>
            Impact d'une variation du loyer sur le cashflow
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={rentData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" vertical={false} />
                <XAxis 
                  dataKey="rent" 
                  tickFormatter={(v) => `${v}€`}
                  tick={{ fontSize: 10 }}
                />
                <YAxis 
                  tickFormatter={(v) => `${v}€`}
                  tick={{ fontSize: 11 }}
                />
                <RechartsTooltip content={<RentTooltip />} />
                <ReferenceLine y={0} stroke="hsl(var(--muted-foreground))" strokeDasharray="3 3" />
                {currentRent && (
                  <ReferenceLine 
                    x={currentRent} 
                    stroke="hsl(var(--primary))" 
                    strokeDasharray="5 5"
                    label={{ value: 'Actuel', position: 'top', fill: 'hsl(var(--primary))', fontSize: 10 }}
                  />
                )}
                <Line 
                  type="monotone" 
                  dataKey="cashflow" 
                  name="Cashflow" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={2}
                  dot={{ fill: 'hsl(var(--primary))', strokeWidth: 0, r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Rate sensitivity */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Sensibilité au taux</CardTitle>
          <CardDescription>
            Impact d'une variation du taux sur le cashflow
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={rateData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" vertical={false} />
                <XAxis 
                  dataKey="rate" 
                  tickFormatter={(v) => `${v}%`}
                  tick={{ fontSize: 10 }}
                />
                <YAxis 
                  tickFormatter={(v) => `${v}€`}
                  tick={{ fontSize: 11 }}
                />
                <RechartsTooltip content={<RateTooltip />} />
                <ReferenceLine y={0} stroke="hsl(var(--muted-foreground))" strokeDasharray="3 3" />
                {currentRate && (
                  <ReferenceLine 
                    x={currentRate} 
                    stroke="hsl(var(--primary))" 
                    strokeDasharray="5 5"
                    label={{ value: 'Actuel', position: 'top', fill: 'hsl(var(--primary))', fontSize: 10 }}
                  />
                )}
                <Line 
                  type="monotone" 
                  dataKey="cashflow" 
                  name="Cashflow" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={2}
                  dot={{ fill: 'hsl(var(--primary))', strokeWidth: 0, r: 3 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="monthly_payment" 
                  name="Mensualité" 
                  stroke="hsl(var(--chart-4))" 
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Price sensitivity */}
      <Card className="md:col-span-2">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Sensibilité au prix</CardTitle>
          <CardDescription>
            Impact d'une variation du prix d'achat sur les indicateurs
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={priceData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" vertical={false} />
                <XAxis 
                  dataKey="price" 
                  tickFormatter={(v) => `${(v/1000).toFixed(0)}k€`}
                  tick={{ fontSize: 10 }}
                />
                <YAxis 
                  yAxisId="left"
                  tickFormatter={(v) => `${v}€`}
                  tick={{ fontSize: 11 }}
                />
                <YAxis 
                  yAxisId="right"
                  orientation="right"
                  tickFormatter={(v) => `${v}%`}
                  tick={{ fontSize: 11 }}
                />
                <RechartsTooltip 
                  formatter={(value: number, name: string) => [
                    name === 'Rentabilité' ? `${value}%` : formatCurrency(value),
                    name
                  ]}
                />
                <ReferenceLine yAxisId="left" y={0} stroke="hsl(var(--muted-foreground))" strokeDasharray="3 3" />
                <Line 
                  yAxisId="left"
                  type="monotone" 
                  dataKey="cashflow" 
                  name="Cashflow" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={2}
                  dot={{ fill: 'hsl(var(--primary))', strokeWidth: 0, r: 3 }}
                />
                <Line 
                  yAxisId="right"
                  type="monotone" 
                  dataKey="yield" 
                  name="Rentabilité" 
                  stroke="hsl(var(--chart-2))" 
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SensitivityCharts;
