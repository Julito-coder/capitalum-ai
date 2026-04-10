import { Info, TrendingUp, Shield, Clock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface EnvelopeCardProps {
  title: string;
  subtitle: string;
  objective: string;
  horizon: string;
  advantages: string[];
  disadvantages: string[];
  fiscality: string;
  icon: 'pea' | 'per';
}

export function EnvelopeCard({
  title,
  subtitle,
  objective,
  horizon,
  advantages,
  disadvantages,
  fiscality,
  icon,
}: EnvelopeCardProps) {
  return (
    <Card className="glass-card border-border/50 hover:border-primary/30 transition-all duration-300">
      <CardContent className="p-6">
        {/* Header */}
        <div className="flex items-start gap-4 mb-6">
          <div className={`p-3 rounded-xl ${icon === 'pea' ? 'bg-primary/10' : 'bg-accent/10'}`}>
            {icon === 'pea' ? (
              <TrendingUp className={`h-6 w-6 ${icon === 'pea' ? 'text-primary' : 'text-accent'}`} />
            ) : (
              <Shield className="h-6 w-6 text-accent" />
            )}
          </div>
          <div>
            <h3 className="text-xl font-bold">{title}</h3>
            <p className="text-sm text-muted-foreground">{subtitle}</p>
          </div>
        </div>

        {/* Objective & Horizon */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="p-3 rounded-lg bg-muted/30">
            <p className="text-xs text-muted-foreground mb-1">Objectif</p>
            <p className="text-sm font-medium">{objective}</p>
          </div>
          <div className="p-3 rounded-lg bg-muted/30">
            <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
              <Clock className="h-3 w-3" />
              Horizon
            </div>
            <p className="text-sm font-medium">{horizon}</p>
          </div>
        </div>

        {/* Fiscality */}
        <div className="p-4 rounded-lg bg-primary/5 border border-primary/10 mb-6">
          <div className="flex items-center gap-2 mb-2">
            <Info className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold text-primary">Fiscalité</span>
          </div>
          <p className="text-sm text-muted-foreground">{fiscality}</p>
        </div>

        {/* Advantages */}
        <div className="mb-4">
          <p className="text-sm font-semibold text-success mb-2">✓ Avantages</p>
          <ul className="space-y-1">
            {advantages.map((adv, idx) => (
              <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                <span className="text-success mt-0.5">•</span>
                {adv}
              </li>
            ))}
          </ul>
        </div>

        {/* Disadvantages */}
        <div>
          <p className="text-sm font-semibold text-warning mb-2">⚠ Limites</p>
          <ul className="space-y-1">
            {disadvantages.map((dis, idx) => (
              <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                <span className="text-warning mt-0.5">•</span>
                {dis}
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}

export function EnvelopesOverview() {
  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold mb-2">Les grandes enveloppes d'épargne</h2>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Deux solutions principales pour investir sur le long terme en France, 
          avec des avantages fiscaux distincts selon ta situation.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <EnvelopeCard
          icon="pea"
          title="PEA"
          subtitle="Plan d'Épargne en Actions"
          objective="Investir en actions européennes"
          horizon="Long terme (8-10 ans minimum)"
          fiscality="Exonération d'impôt sur les gains après 5 ans. Prélèvements sociaux (17,2%) toujours dus à la sortie."
          advantages={[
            'Fiscalité très attractive après 5 ans',
            'Simple à gérer via ETF indiciels',
            'Idéal pour démarrer en bourse',
            'Liquidité conservée (retrait possible)',
          ]}
          disadvantages={[
            'Plafond de versement à 150 000 €',
            'Volatilité à court terme',
            'Limité aux actions européennes',
          ]}
        />

        <EnvelopeCard
          icon="per"
          title="PER"
          subtitle="Plan d'Épargne Retraite"
          objective="Préparer un complément de retraite"
          horizon="Long terme (jusqu'à la retraite)"
          fiscality="Déduction fiscale à l'entrée (selon votre TMI). Fiscalité à la sortie à anticiper."
          advantages={[
            "Réduction immédiate de l'impôt",
            "Très puissant pour les revenus élevés",
            "Sortie en capital ou rente possible",
            "Cas de déblocage anticipé (achat RP)",
          ]}
          disadvantages={[
            "Argent bloqué jusqu'à la retraite",
            "Fiscalité à la sortie à anticiper",
            "Plafonds de déduction annuels",
          ]}
        />
      </div>

      <div className="p-4 rounded-lg bg-muted/30 border border-border/50 text-center">
        <p className="text-sm text-muted-foreground italic">
          💡 <strong>À retenir :</strong> Il n'existe pas de "meilleur" produit universel, 
          seulement des solutions adaptées à chaque situation personnelle.
        </p>
      </div>
    </div>
  );
}
