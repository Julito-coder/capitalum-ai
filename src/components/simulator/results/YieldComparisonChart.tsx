import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip as RechartsTooltip, ResponsiveContainer, Cell, ReferenceLine, LabelList
} from 'recharts';

interface YieldComparisonChartProps {
  grossYield: number;
  netYield: number;
  netNetYield: number;
  benchmarkYield?: number;
}

export const YieldComparisonChart: React.FC<YieldComparisonChartProps> = ({
  grossYield,
  netYield,
  netNetYield,
  benchmarkYield = 3.5
}) => {
  const data = [
    { 
      name: 'Brute', 
      value: grossYield, 
      fill: 'hsl(var(--primary))',
      description: 'Loyer / Prix total'
    },
    { 
      name: 'Nette', 
      value: netYield, 
      fill: 'hsl(var(--chart-2))',
      description: 'Après charges'
    },
    { 
      name: 'Nette-nette', 
      value: netNetYield, 
      fill: 'hsl(var(--chart-3))',
      description: 'Après impôts'
    },
  ];

  const maxValue = Math.max(grossYield, netYield, netNetYield, benchmarkYield) * 1.2;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          Comparaison des rentabilités
        </CardTitle>
        <CardDescription>
          Évolution du rendement après déduction des charges et fiscalité
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} layout="vertical" margin={{ left: 10, right: 50 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" horizontal={true} vertical={false} />
              <XAxis 
                type="number" 
                domain={[0, maxValue]} 
                tickFormatter={(v) => `${v.toFixed(1)}%`}
                tick={{ fontSize: 12 }}
              />
              <YAxis 
                type="category" 
                dataKey="name" 
                width={80}
                tick={{ fontSize: 12 }}
              />
              <RechartsTooltip 
                formatter={(value: number, name: string, props: any) => [
                  `${value.toFixed(2)}%`, 
                  props.payload.description
                ]}
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--card))', 
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px'
                }}
              />
              <ReferenceLine 
                x={benchmarkYield} 
                stroke="hsl(var(--muted-foreground))" 
                strokeDasharray="5 5"
                label={{ 
                  value: `Livret A (${benchmarkYield}%)`, 
                  position: 'top',
                  fill: 'hsl(var(--muted-foreground))',
                  fontSize: 11
                }}
              />
              <Bar 
                dataKey="value" 
                radius={[0, 6, 6, 0]}
                maxBarSize={40}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
                <LabelList 
                  dataKey="value" 
                  position="right" 
                  formatter={(v: number) => `${v.toFixed(2)}%`}
                  style={{ fontSize: 12, fontWeight: 600 }}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        
        {/* Legend / Analysis */}
        <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs">
          <div className="p-2 rounded-lg bg-primary/10">
            <p className="font-semibold text-primary">{grossYield.toFixed(2)}%</p>
            <p className="text-muted-foreground">Brute</p>
          </div>
          <div className="p-2 rounded-lg bg-chart-2/10">
            <p className="font-semibold text-chart-2">{netYield.toFixed(2)}%</p>
            <p className="text-muted-foreground">Nette</p>
            <p className="text-[10px] text-muted-foreground">-{(grossYield - netYield).toFixed(1)}pts</p>
          </div>
          <div className="p-2 rounded-lg bg-chart-3/10">
            <p className="font-semibold text-chart-3">{netNetYield.toFixed(2)}%</p>
            <p className="text-muted-foreground">Nette-nette</p>
            <p className="text-[10px] text-muted-foreground">-{(netYield - netNetYield).toFixed(1)}pts</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default YieldComparisonChart;
