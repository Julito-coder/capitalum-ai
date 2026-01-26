import { useState } from 'react';
import { HelpCircle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export interface FieldTooltipData {
  shortTip: string;
  definition: string;
  impact: string;
  typicalValue: string;
  source: string;
  example?: string;
}

interface FieldTooltipProps {
  data: FieldTooltipData;
  className?: string;
}

export const FieldTooltip = ({ data, className }: FieldTooltipProps) => {
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              setDialogOpen(true);
            }}
            className={`inline-flex items-center justify-center rounded-full p-0.5 text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors ${className}`}
          >
            <HelpCircle className="h-4 w-4" />
          </button>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs">
          <p className="text-sm">{data.shortTip}</p>
        </TooltipContent>
      </Tooltip>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <HelpCircle className="h-5 w-5 text-primary" />
              En savoir plus
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 text-sm">
            <div>
              <h4 className="font-semibold text-foreground mb-1">📖 Définition</h4>
              <p className="text-muted-foreground">{data.definition}</p>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-1">📊 Pourquoi c'est important</h4>
              <p className="text-muted-foreground">{data.impact}</p>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-1">📈 Valeur typique</h4>
              <p className="text-muted-foreground">{data.typicalValue}</p>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-1">🔍 Où trouver l'info</h4>
              <p className="text-muted-foreground">{data.source}</p>
            </div>
            {data.example && (
              <div>
                <h4 className="font-semibold text-foreground mb-1">💡 Exemple</h4>
                <p className="text-muted-foreground">{data.example}</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

// Pre-defined tooltip data for common fields
export const FIELD_TOOLTIPS: Record<string, FieldTooltipData> = {
  // Rendements
  grossYield: {
    shortTip: "Loyer annuel / Prix total × 100",
    definition: "La rentabilité brute mesure le rapport entre les loyers annuels et le coût total d'acquisition, avant déduction des charges et impôts.",
    impact: "C'est le premier indicateur de comparaison entre biens. Un rendement brut élevé indique un potentiel intéressant mais ne reflète pas la réalité nette.",
    typicalValue: "3-5% en centre-ville grandes métropoles, 6-10% en périphérie ou villes moyennes.",
    source: "Calcul automatique basé sur le loyer mensuel × 12 / coût total du projet.",
    example: "Un T2 loué 800€/mois acheté 200 000€ → 4,8% brut."
  },
  netYield: {
    shortTip: "NOI / Prix total × 100",
    definition: "La rentabilité nette déduit les charges d'exploitation (taxe foncière, copro, assurance, gestion...) mais pas les impôts ni le crédit.",
    impact: "Plus réaliste que le brut, elle permet de comparer des biens avec des charges différentes.",
    typicalValue: "2-4% en centre-ville, 5-8% en périphérie.",
    source: "Calcul: (Loyers - Vacance - Charges d'exploitation) / Coût total.",
  },
  netNetYield: {
    shortTip: "Cashflow après impôts / Prix total × 100",
    definition: "La rentabilité nette-nette intègre l'impact fiscal réel selon votre régime (micro, réel, LMNP...).",
    impact: "C'est l'indicateur le plus proche de votre gain réel, mais varie selon votre situation fiscale.",
    typicalValue: "1-3% en moyenne, peut être négatif si forte fiscalité.",
    source: "Calcul basé sur le cashflow après impôts annuel moyen.",
  },
  
  // Cashflow
  cashflowBeforeTax: {
    shortTip: "Loyers - Charges - Mensualité crédit",
    definition: "Le cashflow avant impôts est la somme qui reste chaque mois après avoir payé toutes les charges et le crédit, mais avant impôt sur le revenu.",
    impact: "Un cashflow positif signifie que le bien s'autofinance. Un cashflow négatif implique un effort d'épargne mensuel.",
    typicalValue: "0 à +200€/mois pour un bien autofinancé. Négatif en début de prêt si peu d'apport.",
    source: "Calculé automatiquement à partir de vos données.",
  },
  cashflowAfterTax: {
    shortTip: "Cashflow avant impôts - Impôts fonciers",
    definition: "Le cashflow net après impôts est votre gain réel mensuel après toutes les dépenses, y compris l'impact fiscal.",
    impact: "C'est l'indicateur clé de la performance réelle de votre investissement.",
    typicalValue: "Variable selon le régime fiscal. Le LMNP réel peut fortement réduire l'impôt.",
    source: "Calculé selon votre TMI et régime fiscal configuré.",
  },
  
  // DSCR
  dscr: {
    shortTip: "NOI / Annuité du prêt",
    definition: "Le DSCR (Debt Service Coverage Ratio) mesure la capacité des revenus locatifs à couvrir les remboursements du prêt.",
    impact: "Les banques regardent ce ratio pour évaluer la solidité du projet. Un DSCR > 1 signifie que les loyers couvrent le crédit.",
    typicalValue: "La banque exige généralement DSCR > 1,1 à 1,3 pour valider un dossier investisseur.",
    source: "Calcul: Revenus nets d'exploitation / (Capital + Intérêts + Assurance).",
    example: "NOI de 8 000€/an avec annuité de 7 000€ → DSCR = 1,14."
  },
  
  // Vacance
  vacancyRate: {
    shortTip: "% du temps où le bien est vacant",
    definition: "Le taux de vacance représente la période pendant laquelle le bien n'est pas loué entre deux locataires.",
    impact: "Réduit directement vos revenus. Un taux élevé dégrade la rentabilité et le DSCR.",
    typicalValue: "2-5% en zone tendue (grandes villes), 5-10% en zone moins demandée.",
    source: "Statistiques locales, agences immobilières, historique du bien.",
    example: "5% = environ 18 jours de vacance par an."
  },
  
  // Financement
  deferment: {
    shortTip: "Différé partiel ou total du remboursement",
    definition: "Le différé permet de retarder le remboursement du capital (partiel) ou du capital + intérêts (total) pendant une période donnée.",
    impact: "Améliore le cashflow initial mais augmente le coût total du crédit. Utile pendant les travaux.",
    typicalValue: "0 à 24 mois maximum généralement proposés par les banques.",
    source: "À négocier avec votre banque, souvent lié à des travaux.",
  },
  insuranceMode: {
    shortTip: "% du capital initial vs % du CRD",
    definition: "L'assurance emprunteur peut être calculée sur le capital initial (fixe) ou sur le capital restant dû (dégressive).",
    impact: "L'assurance sur CRD coûte moins cher au total mais plus en début de prêt.",
    typicalValue: "0,10% à 0,50% selon l'âge et l'état de santé.",
    source: "Simulation banque ou courtier, devis assurance.",
  },
  
  // Fiscalité
  tmi: {
    shortTip: "Tranche Marginale d'Imposition",
    definition: "La TMI est le taux d'imposition appliqué à la dernière tranche de vos revenus. C'est le taux qui s'applique à vos revenus fonciers supplémentaires.",
    impact: "Plus votre TMI est élevée, plus les revenus fonciers seront taxés. Le choix du régime fiscal devient crucial.",
    typicalValue: "0%, 11%, 30%, 41% ou 45% selon vos revenus.",
    source: "Votre dernier avis d'imposition, page 2.",
    example: "Revenus de 40 000€ → TMI à 30%."
  },
  amortization: {
    shortTip: "Déduction comptable de la valeur du bien",
    definition: "L'amortissement permet de déduire fiscalement la perte de valeur théorique du bien (bâti, mobilier, travaux) de vos revenus.",
    impact: "Réduit fortement l'imposition en LMNP réel ou SCI IS. Peut créer un déficit reportable.",
    typicalValue: "Bâti sur 30-50 ans, mobilier sur 5-10 ans, travaux sur 10-15 ans.",
    source: "Comptable spécialisé LMNP ou expert-comptable.",
  },
  
  // Break-even
  breakEvenRent: {
    shortTip: "Loyer minimum pour cashflow = 0",
    definition: "Le seuil de rentabilité en loyer est le montant minimum mensuel nécessaire pour couvrir toutes les charges et le crédit.",
    impact: "Permet d'évaluer la marge de sécurité si les loyers baissent.",
    typicalValue: "Dépend de votre structure de financement et charges.",
    source: "Calculé automatiquement.",
  },
  breakEvenPrice: {
    shortTip: "Prix max pour rentabilité = 0",
    definition: "Le prix d'achat maximum au-delà duquel le bien ne serait plus rentable avec le loyer prévu.",
    impact: "Aide à la négociation et à identifier la marge de sécurité.",
    typicalValue: "Comparez avec le prix du marché local.",
    source: "Calculé automatiquement.",
  },
  
  // RP spécifique
  equity: {
    shortTip: "Valeur du bien - Dette restante",
    definition: "L'équité (ou capitaux propres) représente la part du bien qui vous appartient réellement.",
    impact: "Elle croît avec les remboursements et la valorisation du bien. C'est votre patrimoine net.",
    typicalValue: "Commence à l'apport, augmente progressivement.",
    source: "Valeur estimée - Capital restant dû.",
  },
  resteAVivre: {
    shortTip: "Revenus - Charges fixes - Mensualité",
    definition: "Le reste à vivre est la somme qui reste après paiement de toutes les charges fixes, dont le crédit immobilier.",
    impact: "Les banques l'utilisent pour valider votre capacité d'emprunt au-delà du taux d'endettement.",
    typicalValue: "Minimum ~1 000€/personne adulte exigé par les banques.",
    source: "Calculez: Revenus nets - Crédits - Charges fixes.",
  },
  
  // Stress tests
  stressTest: {
    shortTip: "Simulation avec hypothèses dégradées",
    definition: "Le stress test applique des hypothèses prudentes (loyer -10%, vacance +50%, taux +1%) pour évaluer la résistance du projet.",
    impact: "Montre si le projet reste viable en cas de conditions défavorables. Rassure les banques.",
    typicalValue: "Haircut loyer 10-15%, vacance +50-100%, taux +1-2 points.",
    source: "Standards bancaires et bonnes pratiques investisseurs.",
  },
};
