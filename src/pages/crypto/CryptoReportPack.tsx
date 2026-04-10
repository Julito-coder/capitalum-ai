import { useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  ArrowLeft,
  ClipboardCopy,
  ExternalLink,
  CheckCircle2,
  Info,
  FileText,
  ArrowRight,
  Copy,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';
import type { ReportField } from '@/domain/crypto/types';

const CryptoReportPack = () => {
  const navigate = useNavigate();
  const [reportedFields, setReportedFields] = useState<Record<string, boolean>>({});

  // Placeholder fields — will come from TaxForm2086Draft.fieldMapping
  const fields: ReportField[] = [
    {
      fieldId: 'case3AN',
      label: 'Case 3AN — Plus-values nettes',
      location: 'Déclaration en ligne > Annexes > 2086 > Plus-values',
      value: 0,
      explanation: 'Somme de toutes les plus-values réalisées sur cessions d\'actifs numériques durant l\'année.',
    },
    {
      fieldId: 'case3BN',
      label: 'Case 3BN — Moins-values nettes',
      location: 'Déclaration en ligne > Annexes > 2086 > Moins-values',
      value: 0,
      explanation: 'Somme des moins-values. Peut être reportée les années suivantes sous conditions.',
    },
  ];

  const copyValue = (value: number, label: string) => {
    navigator.clipboard.writeText(value.toLocaleString('fr-FR', { minimumFractionDigits: 2 }));
    toast({ title: '📋 Copié !', description: `${label} copié dans le presse-papier.` });
  };

  const toggleReported = (fieldId: string) => {
    setReportedFields((prev) => ({ ...prev, [fieldId]: !prev[fieldId] }));
  };

  const allReported = fields.every((f) => reportedFields[f.fieldId]);

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-6 p-4 pb-24">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/crypto/2086')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-bold">Pack de report — impots.gouv</h1>
        </div>

        {/* Step 1: Open impots.gouv */}
        <Card className="border-primary/20">
          <CardContent className="py-5 space-y-3">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-primary/10 text-primary shrink-0">
                <ExternalLink className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold text-sm">Étape 1 — Ouvrir impots.gouv</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Elio ne transmet pas à la DGFiP. Tu reportes manuellement les valeurs
                  calculées ci-dessous.
                </p>
              </div>
            </div>
            <Button
              className="w-full"
              onClick={() =>
                window.open('https://www.impots.gouv.fr/accueil', '_blank', 'noopener')
              }
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Ouvrir ma déclaration en ligne
            </Button>
          </CardContent>
        </Card>

        {/* Step 2: Fields to report */}
        <div className="space-y-3">
          <h3 className="font-semibold text-sm flex items-center gap-2">
            <ClipboardCopy className="h-4 w-4 text-primary" />
            Étape 2 — Reporter champ par champ
          </h3>

          {fields.map((field) => (
            <Card key={field.fieldId} className={reportedFields[field.fieldId] ? 'border-success/30 bg-success/5' : ''}>
              <CardContent className="py-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-sm">{field.label}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      📍 {field.location}
                    </p>
                  </div>
                  <Checkbox
                    checked={reportedFields[field.fieldId] ?? false}
                    onCheckedChange={() => toggleReported(field.fieldId)}
                  />
                </div>

                {/* Value */}
                <div className="flex items-center gap-3">
                  <div className="flex-1 p-3 rounded-lg bg-muted/30 font-mono text-xl font-bold text-center">
                    {field.value.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyValue(field.value, field.label)}
                  >
                    <Copy className="h-4 w-4 mr-1" />
                    Copier
                  </Button>
                </div>

                {/* Explanation */}
                <div className="p-3 rounded-lg bg-info/5 border border-info/10">
                  <p className="text-xs text-muted-foreground">
                    <Info className="h-3.5 w-3.5 inline mr-1 text-info" />
                    {field.explanation}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Step 3: Checklist */}
        <Card>
          <CardContent className="py-5">
            <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-primary" />
              Étape 3 — Confirmation
            </h3>
            {allReported ? (
              <div className="text-center space-y-3">
                <CheckCircle2 className="h-10 w-10 text-success mx-auto" />
                <p className="text-sm font-semibold text-success">
                  Tous les champs ont été reportés ✓
                </p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center">
                Coche chaque champ une fois reporté sur impots.gouv
              </p>
            )}
          </CardContent>
        </Card>

        {/* Continue */}
        <Button className="w-full" onClick={() => navigate('/crypto/2086/exports')}>
          Générer le PDF d'archive <ArrowRight className="h-4 w-4 ml-1" />
        </Button>
      </div>
    </Layout>
  );
};

export default CryptoReportPack;
