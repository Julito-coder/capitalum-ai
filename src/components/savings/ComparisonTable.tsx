import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { SavingsSimulationResults } from '@/lib/savingsTypes';
import { formatEuro, isPERRelevant } from '@/lib/savingsCalculations';
import { Scale, TrendingUp, Shield, Clock, Wallet, ArrowRight } from 'lucide-react';

interface ComparisonTableProps {
  results: SavingsSimulationResults;
}

export function ComparisonTable({ results }: ComparisonTableProps) {
  const peaEquilibre = results.pea.equilibre;
  const perEquilibre = results.per.equilibre;
  const perRelevant = isPERRelevant(results.inputs.tmi);

  const criteria = [
    {
      label: 'Horizon conseillé',
      pea: '8-10 ans minimum',
      per: 'Jusqu\'à la retraite',
      icon: Clock,
    },
    {
      label: 'Fiscalité avantageuse',
      pea: 'À la sortie (après 5 ans)',
      per: 'À l\'entrée (déduction TMI)',
      icon: Scale,
    },
    {
      label: 'Liquidité',
      pea: 'Moyenne (retrait possible)',
      per: 'Faible (bloqué sauf cas)',
      icon: Wallet,
    },
    {
      label: 'Simplicité',
      pea: 'Élevée',
      per: 'Moyenne',
      icon: TrendingUp,
    },
    {
      label: 'Plafond versements',
      pea: '150 000 €',
      per: '~10% revenus/an',
      icon: Shield,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold mb-2">Comparaison PEA vs PER</h2>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Analyse côte à côte des deux enveloppes selon vos paramètres de simulation.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* PEA Summary */}
        <Card className="glass-card border-primary/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <TrendingUp className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-bold">PEA</h3>
                  <p className="text-xs text-muted-foreground">Profil Équilibré</p>
                </div>
              </div>
              <Badge className="bg-primary/10 text-primary">5% / an</Badge>
            </div>
            
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Capital final</span>
                <span className="font-bold text-primary">{formatEuro(peaEquilibre.capitalEnd)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Intérêts gagnés</span>
                <span className="font-semibold text-success">+{formatEuro(peaEquilibre.interestTotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Effort total</span>
                <span className="font-medium">{formatEuro(peaEquilibre.totalContributed)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* PER Summary */}
        <Card className={`glass-card ${perRelevant ? 'border-accent/20' : 'border-border/50'}`}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-accent/10">
                  <Shield className="h-5 w-5 text-accent" />
                </div>
                <div>
                  <h3 className="font-bold">PER</h3>
                  <p className="text-xs text-muted-foreground">Profil Équilibré</p>
                </div>
              </div>
              {perRelevant ? (
                <Badge className="bg-accent/10 text-accent">Pertinent pour vous</Badge>
              ) : (
                <Badge variant="secondary">TMI faible</Badge>
              )}
            </div>
            
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Capital final</span>
                <span className="font-bold text-accent">{formatEuro(perEquilibre.capitalEnd)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Économie d'impôt</span>
                <span className="font-semibold text-success">
                  -{formatEuro(perEquilibre.taxSavings ?? 0)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Effort net réel</span>
                <span className="font-medium">{formatEuro(perEquilibre.netEffort ?? perEquilibre.totalContributed)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Comparison Table */}
      <Card className="glass-card">
        <CardContent className="p-6">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border/50">
                <th className="text-left py-3 text-sm font-semibold">Critère</th>
                <th className="text-center py-3 text-sm font-semibold text-primary">PEA</th>
                <th className="text-center py-3 text-sm font-semibold text-accent">PER</th>
              </tr>
            </thead>
            <tbody>
              {criteria.map((row, idx) => (
                <tr key={idx} className="border-b border-border/30 last:border-0">
                  <td className="py-4">
                    <div className="flex items-center gap-2">
                      <row.icon className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">{row.label}</span>
                    </div>
                  </td>
                  <td className="py-4 text-center text-sm text-muted-foreground">{row.pea}</td>
                  <td className="py-4 text-center text-sm text-muted-foreground">{row.per}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Recommendation */}
      <Card className="glass-card border-primary/20">
        <CardContent className="p-6">
          <h3 className="font-bold mb-4 flex items-center gap-2">
            <ArrowRight className="h-5 w-5 text-primary" />
            Lecture selon ton profil
          </h3>
          
          <div className="grid md:grid-cols-2 gap-4">
            <div className="p-4 rounded-lg bg-primary/5 border border-primary/10">
              <p className="text-sm font-semibold mb-2">Si vous débutez</p>
              <p className="text-sm text-muted-foreground">
                Le PEA avec ETF indiciels est idéal : simple, fiscalement avantageux après 5 ans, 
                et vous conservez la liquidité.
              </p>
            </div>
            
            <div className="p-4 rounded-lg bg-accent/5 border border-accent/10">
              <p className="text-sm font-semibold mb-2">Si tu es fortement imposé (TMI ≥ 30%)</p>
              <p className="text-sm text-muted-foreground">
                Le PER en complément peut être très intéressant : l'économie d'impôt immédiate 
                réduit considérablement votre effort réel.
              </p>
            </div>
          </div>

          <div className="mt-4 p-4 rounded-lg bg-muted/30 border border-border/50">
            <p className="text-sm text-muted-foreground italic">
              💡 <strong>Conseil :</strong> Épargner {formatEuro(results.inputs.monthlyContribution)} par mois 
              pendant {results.inputs.durationYears} ans peut être plus efficace qu'un gros versement ponctuel. 
              La régularité prime sur le montant.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
