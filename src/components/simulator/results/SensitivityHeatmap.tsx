import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { SensitivityData } from '@/lib/realEstateTypes';

interface SensitivityHeatmapProps {
  heatmapData: SensitivityData['heatmap'];
}

export const SensitivityHeatmap: React.FC<SensitivityHeatmapProps> = ({
  heatmapData
}) => {
  if (!heatmapData || heatmapData.length === 0) {
    return null;
  }

  // Get unique prices and rents
  const prices = [...new Set(heatmapData.map(h => h.price))].sort((a, b) => a - b);
  const rents = [...new Set(heatmapData.map(h => h.rent))].sort((a, b) => a - b);

  const getYieldColor = (yieldVal: number) => {
    if (yieldVal >= 7) return 'bg-emerald-500 text-white';
    if (yieldVal >= 5) return 'bg-success text-success-foreground';
    if (yieldVal >= 4) return 'bg-success/60 text-success-foreground';
    if (yieldVal >= 3) return 'bg-warning text-warning-foreground';
    if (yieldVal >= 2) return 'bg-warning/60 text-warning-foreground';
    return 'bg-destructive text-destructive-foreground';
  };

  const formatPrice = (price: number) => {
    if (price >= 1000000) return `${(price / 1000000).toFixed(1)}M`;
    return `${(price / 1000).toFixed(0)}k`;
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          Matrice de sensibilité
          <Badge variant="outline" className="text-xs">Prix × Loyer</Badge>
        </CardTitle>
        <CardDescription>
          Rentabilité nette selon différentes combinaisons de prix et de loyer
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th className="py-2 px-3 text-left text-muted-foreground font-medium">
                  Prix \ Loyer
                </th>
                {rents.map((rent, i) => (
                  <th key={i} className="py-2 px-3 text-center font-medium">
                    {rent}€
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {prices.map((price, i) => (
                <tr key={i} className="border-t border-muted/50">
                  <td className="py-2 px-3 font-medium text-muted-foreground">
                    {formatPrice(price)}€
                  </td>
                  {rents.map((rent, j) => {
                    const cell = heatmapData.find(h => h.price === price && h.rent === rent);
                    const yieldVal = cell?.net_yield || 0;
                    return (
                      <td key={j} className="py-1 px-1">
                        <div 
                          className={`py-2 px-2 text-center rounded-md font-semibold text-xs transition-all hover:scale-105 ${getYieldColor(yieldVal)}`}
                        >
                          {yieldVal.toFixed(1)}%
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Legend */}
        <div className="mt-4 flex items-center justify-center gap-2 flex-wrap">
          <span className="text-xs text-muted-foreground">Rentabilité:</span>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 rounded bg-emerald-500" />
            <span className="text-xs">≥7%</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 rounded bg-success" />
            <span className="text-xs">5-7%</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 rounded bg-success/60" />
            <span className="text-xs">4-5%</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 rounded bg-warning" />
            <span className="text-xs">3-4%</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 rounded bg-warning/60" />
            <span className="text-xs">2-3%</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 rounded bg-destructive" />
            <span className="text-xs">&lt;2%</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SensitivityHeatmap;
