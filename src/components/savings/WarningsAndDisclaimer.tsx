import { Card, CardContent } from '@/components/ui/card';
import { AlertTriangle, Shield, Info, XCircle } from 'lucide-react';

export function WarningsAndDisclaimer() {
  const warnings = [
    {
      icon: AlertTriangle,
      title: 'Volatilité des marchés',
      description: 'Les actions peuvent perdre de la valeur à court terme. Un horizon long permet d\'absorber les fluctuations.',
      color: 'warning',
    },
    {
      icon: Shield,
      title: 'Importance de l\'horizon',
      description: 'Plus ton horizon est long, plus tu peux prendre de risque. Ne placez jamais de l\'argent dont vous aurez besoin à court terme.',
      color: 'primary',
    },
    {
      icon: Info,
      title: 'Risque de vente au mauvais moment',
      description: 'Vendre en période de baisse cristallise les pertes. La patience est la meilleure alliée de l\'investisseur.',
      color: 'accent',
    },
    {
      icon: XCircle,
      title: 'Frais à surveiller',
      description: 'Privilégiez les ETF à faibles frais (< 0,3%/an). Les frais élevés grignotent la performance sur le long terme.',
      color: 'destructive',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold mb-2">Points de vigilance</h2>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Ces avertissements sont volontairement affichés pour garantir une approche responsable et réaliste.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {warnings.map((warning, idx) => (
          <Card key={idx} className="glass-card">
            <CardContent className="p-5">
              <div className="flex items-start gap-4">
                <div className={`p-2 rounded-lg bg-${warning.color}/10 shrink-0`}>
                  <warning.icon className={`h-5 w-5 text-${warning.color}`} />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">{warning.title}</h3>
                  <p className="text-sm text-muted-foreground">{warning.description}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Disclaimer Box */}
      <Card className="glass-card border-destructive/20 bg-destructive/5">
        <CardContent className="p-6">
          <h3 className="font-bold text-destructive mb-4">Ce que cette simulation n'est PAS</h3>
          <ul className="space-y-2">
            <li className="flex items-start gap-2 text-sm text-muted-foreground">
              <XCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
              Ce n'est <strong>pas un conseil personnalisé</strong> en investissement
            </li>
            <li className="flex items-start gap-2 text-sm text-muted-foreground">
              <XCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
              Ce n'est <strong>pas une promesse de rendement</strong> – les marchés sont imprévisibles
            </li>
            <li className="flex items-start gap-2 text-sm text-muted-foreground">
              <XCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
              Ce n'est <strong>pas une incitation à investir</strong> sans réflexion approfondie
            </li>
          </ul>
          
          <div className="mt-4 pt-4 border-t border-destructive/20">
            <p className="text-sm text-muted-foreground">
              <strong>Mais c'est :</strong> Un outil d'aide à la compréhension et à la décision, 
              basé sur des hypothèses pédagogiques simplifiées.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Legal Disclaimer */}
      <div className="p-4 rounded-lg bg-muted/30 border border-border/50 text-center">
        <p className="text-xs text-muted-foreground">
          ⚠️ <strong>Les performances passées ne préjugent pas des performances futures.</strong><br />
          Tout investissement comporte des risques de perte en capital. 
          Consulte un conseiller financier agréé avant toute décision d'investissement.
        </p>
      </div>
    </div>
  );
}
