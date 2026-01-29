import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Globe, 
  Building2, 
  TrendingUp, 
  Shield, 
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Info,
  PieChart,
  BarChart3,
  Check,
  X
} from 'lucide-react';
import {
  IndexData,
  INDICES_DATA,
  getIndicesByEnvelope,
  getRiskLevelLabel,
  getRiskLevelColor,
} from '@/lib/savingsIndicesData';
import { PieChart as RechartsPie, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

interface IndicesSelectorProps {
  envelope: 'pea' | 'per';
  selectedIndices: string[];
  onSelect: (indices: string[]) => void;
}

export function IndicesSelector({ envelope, selectedIndices, onSelect }: IndicesSelectorProps) {
  const [expandedIndex, setExpandedIndex] = useState<string | null>(null);
  const availableIndices = getIndicesByEnvelope(envelope);

  const toggleIndex = (indexId: string) => {
    if (selectedIndices.includes(indexId)) {
      onSelect(selectedIndices.filter(id => id !== indexId));
    } else {
      onSelect([...selectedIndices, indexId]);
    }
  };

  const getZoneIcon = (zone: IndexData['geographicZone']) => {
    switch (zone) {
      case 'monde': return Globe;
      case 'europe': return Building2;
      case 'usa': return TrendingUp;
      case 'emergents': return AlertTriangle;
      default: return Globe;
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold mb-2">
          Indices disponibles en {envelope.toUpperCase()}
        </h2>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Découvrez en détail les indices accessibles, leurs performances historiques et leurs risques.
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card className="glass-card">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-primary">{availableIndices.length}</p>
            <p className="text-xs text-muted-foreground">Indices éligibles</p>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-success">
              +{Math.max(...availableIndices.map(i => i.annualizedReturn10Y)).toFixed(1)}%
            </p>
            <p className="text-xs text-muted-foreground">Meilleure perf. 10 ans/an</p>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-accent">
              {(availableIndices.reduce((acc, i) => acc + i.typicalTER, 0) / availableIndices.length * 100).toFixed(0)} pts
            </p>
            <p className="text-xs text-muted-foreground">Frais moyens (TER)</p>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold">{selectedIndices.length}</p>
            <p className="text-xs text-muted-foreground">Sélectionnés</p>
          </CardContent>
        </Card>
      </div>

      {/* Indices List */}
      <div className="space-y-4">
        {availableIndices.map((index) => {
          const isExpanded = expandedIndex === index.id;
          const isSelected = selectedIndices.includes(index.id);
          const ZoneIcon = getZoneIcon(index.geographicZone);

          return (
            <Card 
              key={index.id} 
              className={`glass-card transition-all ${isSelected ? 'ring-2 ring-primary border-primary/30' : ''}`}
            >
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-muted/50">
                      <ZoneIcon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg flex items-center gap-2">
                        {index.name}
                        <Badge 
                          variant="outline" 
                          style={{ 
                            borderColor: getRiskLevelColor(index.riskLevel),
                            color: getRiskLevelColor(index.riskLevel)
                          }}
                        >
                          Risque {index.riskLevel}/7
                        </Badge>
                      </CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">{index.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant={isSelected ? "default" : "outline"}
                      size="sm"
                      onClick={() => toggleIndex(index.id)}
                    >
                      {isSelected ? <Check className="h-4 w-4 mr-1" /> : null}
                      {isSelected ? 'Sélectionné' : 'Sélectionner'}
                    </Button>
                  </div>
                </div>

                {/* Performance Summary */}
                <div className="grid grid-cols-4 gap-4 mt-4">
                  <div className="text-center p-2 rounded-lg bg-muted/30">
                    <p className="text-xs text-muted-foreground">Perf. 1 an</p>
                    <p className={`font-bold ${index.annualizedReturn1Y >= 0 ? 'text-success' : 'text-destructive'}`}>
                      {index.annualizedReturn1Y >= 0 ? '+' : ''}{index.annualizedReturn1Y}%
                    </p>
                  </div>
                  <div className="text-center p-2 rounded-lg bg-muted/30">
                    <p className="text-xs text-muted-foreground">Perf. 5 ans/an</p>
                    <p className={`font-bold ${index.annualizedReturn5Y >= 0 ? 'text-success' : 'text-destructive'}`}>
                      {index.annualizedReturn5Y >= 0 ? '+' : ''}{index.annualizedReturn5Y}%
                    </p>
                  </div>
                  <div className="text-center p-2 rounded-lg bg-muted/30">
                    <p className="text-xs text-muted-foreground">Perf. 10 ans/an</p>
                    <p className={`font-bold ${index.annualizedReturn10Y >= 0 ? 'text-success' : 'text-destructive'}`}>
                      {index.annualizedReturn10Y >= 0 ? '+' : ''}{index.annualizedReturn10Y}%
                    </p>
                  </div>
                  <div className="text-center p-2 rounded-lg bg-muted/30">
                    <p className="text-xs text-muted-foreground">Volatilité</p>
                    <p className="font-bold">{index.volatility}%</p>
                  </div>
                </div>

                {/* Expand Button */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setExpandedIndex(isExpanded ? null : index.id)}
                  className="w-full mt-2"
                >
                  {isExpanded ? (
                    <>Voir moins <ChevronUp className="h-4 w-4 ml-1" /></>
                  ) : (
                    <>Voir détails complets <ChevronDown className="h-4 w-4 ml-1" /></>
                  )}
                </Button>
              </CardHeader>

              {/* Expanded Content */}
              {isExpanded && (
                <CardContent className="pt-0">
                  <Tabs defaultValue="composition" className="w-full">
                    <TabsList className="grid w-full grid-cols-4">
                      <TabsTrigger value="composition">Composition</TabsTrigger>
                      <TabsTrigger value="performance">Performance</TabsTrigger>
                      <TabsTrigger value="risks">Risques</TabsTrigger>
                      <TabsTrigger value="holdings">Top Holdings</TabsTrigger>
                    </TabsList>

                    {/* Composition Tab */}
                    <TabsContent value="composition" className="mt-4">
                      <div className="grid md:grid-cols-2 gap-6">
                        <div>
                          <h4 className="font-semibold mb-3 flex items-center gap-2">
                            <PieChart className="h-4 w-4" />
                            Répartition sectorielle
                          </h4>
                          <div className="h-48">
                            <ResponsiveContainer width="100%" height="100%">
                              <RechartsPie>
                                <Pie
                                  data={index.composition}
                                  cx="50%"
                                  cy="50%"
                                  innerRadius={40}
                                  outerRadius={70}
                                  dataKey="weight"
                                  nameKey="sector"
                                  label={({ sector, weight }) => `${sector}: ${weight}%`}
                                  labelLine={false}
                                >
                                  {index.composition.map((entry, i) => (
                                    <Cell key={i} fill={entry.color} />
                                  ))}
                                </Pie>
                                <Tooltip />
                              </RechartsPie>
                            </ResponsiveContainer>
                          </div>
                        </div>
                        <div>
                          <h4 className="font-semibold mb-3">Détails</h4>
                          <div className="space-y-2">
                            {index.composition.map((sector, i) => (
                              <div key={i} className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <div 
                                    className="w-3 h-3 rounded-full" 
                                    style={{ backgroundColor: sector.color }}
                                  />
                                  <span className="text-sm">{sector.sector}</span>
                                </div>
                                <span className="text-sm font-medium">{sector.weight}%</span>
                              </div>
                            ))}
                          </div>
                          <div className="mt-4 p-3 rounded-lg bg-muted/30">
                            <p className="text-sm text-muted-foreground">
                              <strong>{index.numberOfHoldings}</strong> titres en portefeuille
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Frais de gestion (TER) : <strong>{(index.typicalTER * 100).toFixed(0)} points de base</strong>
                            </p>
                          </div>
                        </div>
                      </div>
                    </TabsContent>

                    {/* Performance Tab */}
                    <TabsContent value="performance" className="mt-4">
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div className="p-3 rounded-lg bg-muted/30 text-center">
                            <p className="text-xs text-muted-foreground">Rendement 10 ans</p>
                            <p className="text-xl font-bold text-primary">
                              +{((Math.pow(1 + index.annualizedReturn10Y / 100, 10) - 1) * 100).toFixed(0)}%
                            </p>
                            <p className="text-xs text-muted-foreground">cumulé</p>
                          </div>
                          <div className="p-3 rounded-lg bg-muted/30 text-center">
                            <p className="text-xs text-muted-foreground">Volatilité annuelle</p>
                            <p className="text-xl font-bold">{index.volatility}%</p>
                          </div>
                          <div className="p-3 rounded-lg bg-destructive/10 text-center">
                            <p className="text-xs text-muted-foreground">Perte max historique</p>
                            <p className="text-xl font-bold text-destructive">{index.maxDrawdown}%</p>
                          </div>
                          <div className="p-3 rounded-lg bg-muted/30 text-center">
                            <p className="text-xs text-muted-foreground">Ratio rendement/risque</p>
                            <p className="text-xl font-bold">
                              {(index.annualizedReturn10Y / index.volatility).toFixed(2)}
                            </p>
                          </div>
                        </div>

                        <h4 className="font-semibold flex items-center gap-2">
                          <BarChart3 className="h-4 w-4" />
                          Performance annuelle (10 dernières années)
                        </h4>
                        <div className="h-64">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={index.historicalPerformance}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#333" opacity={0.3} />
                              <XAxis dataKey="year" tick={{ fontSize: 11 }} />
                              <YAxis tickFormatter={(v) => `${v}%`} tick={{ fontSize: 11 }} />
                              <Tooltip 
                                formatter={(value: number) => [`${value.toFixed(1)}%`, 'Performance']}
                                contentStyle={{
                                  backgroundColor: 'hsl(var(--background))',
                                  border: '1px solid hsl(var(--border))',
                                  borderRadius: '8px',
                                }}
                              />
                              <Bar 
                                dataKey="return" 
                                fill="#3b82f6"
                                radius={[4, 4, 0, 0]}
                              />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                        <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
                          <p className="text-sm text-muted-foreground">
                            <Info className="h-4 w-4 inline mr-1" />
                            Les performances passées ne préjugent pas des performances futures. 
                            Ces données sont indicatives et basées sur l'historique réel de l'indice.
                          </p>
                        </div>
                      </div>
                    </TabsContent>

                    {/* Risks Tab */}
                    <TabsContent value="risks" className="mt-4">
                      <div className="grid md:grid-cols-2 gap-6">
                        <div>
                          <h4 className="font-semibold mb-3 flex items-center gap-2 text-destructive">
                            <X className="h-4 w-4" />
                            Risques à connaître
                          </h4>
                          <div className="space-y-2">
                            {index.risks.map((risk, i) => (
                              <div key={i} className="flex items-start gap-2 p-2 rounded-lg bg-destructive/5">
                                <AlertTriangle className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
                                <p className="text-sm">{risk}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                        <div>
                          <h4 className="font-semibold mb-3 flex items-center gap-2 text-success">
                            <Check className="h-4 w-4" />
                            Avantages
                          </h4>
                          <div className="space-y-2">
                            {index.advantages.map((advantage, i) => (
                              <div key={i} className="flex items-start gap-2 p-2 rounded-lg bg-success/5">
                                <Check className="h-4 w-4 text-success mt-0.5 flex-shrink-0" />
                                <p className="text-sm">{advantage}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="grid md:grid-cols-2 gap-6 mt-6">
                        <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                          <h4 className="font-semibold mb-2">Adapté pour</h4>
                          <ul className="space-y-1">
                            {index.suitableFor.map((item, i) => (
                              <li key={i} className="text-sm flex items-center gap-2">
                                <Check className="h-3 w-3 text-success" />
                                {item}
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div className="p-4 rounded-lg bg-destructive/5 border border-destructive/20">
                          <h4 className="font-semibold mb-2">Moins adapté pour</h4>
                          <ul className="space-y-1">
                            {index.notSuitableFor.map((item, i) => (
                              <li key={i} className="text-sm flex items-center gap-2">
                                <X className="h-3 w-3 text-destructive" />
                                {item}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </TabsContent>

                    {/* Holdings Tab */}
                    <TabsContent value="holdings" className="mt-4">
                      {index.topHoldings.length > 0 ? (
                        <div>
                          <h4 className="font-semibold mb-3">Top 10 positions</h4>
                          <div className="overflow-x-auto">
                            <table className="w-full">
                              <thead>
                                <tr className="border-b border-border/50">
                                  <th className="text-left py-2 text-sm font-medium">#</th>
                                  <th className="text-left py-2 text-sm font-medium">Entreprise</th>
                                  <th className="text-left py-2 text-sm font-medium">Ticker</th>
                                  <th className="text-left py-2 text-sm font-medium">Pays</th>
                                  <th className="text-right py-2 text-sm font-medium">Poids</th>
                                </tr>
                              </thead>
                              <tbody>
                                {index.topHoldings.map((holding, i) => (
                                  <tr key={i} className="border-b border-border/30">
                                    <td className="py-2 text-sm text-muted-foreground">{i + 1}</td>
                                    <td className="py-2 text-sm font-medium">{holding.name}</td>
                                    <td className="py-2 text-sm text-muted-foreground">{holding.ticker}</td>
                                    <td className="py-2 text-sm">{holding.country}</td>
                                    <td className="py-2 text-sm text-right font-medium">{holding.weight}%</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                          <p className="text-xs text-muted-foreground mt-3">
                            Ces {index.topHoldings.length} positions représentent environ{' '}
                            {index.topHoldings.reduce((acc, h) => acc + h.weight, 0).toFixed(1)}% de l'indice.
                          </p>
                        </div>
                      ) : (
                        <div className="text-center py-8 text-muted-foreground">
                          <Info className="h-8 w-8 mx-auto mb-2 opacity-50" />
                          <p>Ce support n'est pas composé de titres individuels identifiables.</p>
                        </div>
                      )}
                    </TabsContent>
                  </Tabs>
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
