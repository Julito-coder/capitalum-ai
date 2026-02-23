import { useState, useCallback } from 'react'; // wizard v3 — chronological PMPA
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, ArrowRight, Coins, Save } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { WizardStep, TransactionClassification } from '@/domain/crypto/types';

import { WizardSourcesStep } from '@/components/crypto/wizard/WizardSourcesStep';
import { WizardTransactionsStep } from '@/components/crypto/wizard/WizardTransactionsStep';
import { WizardValorisationStep } from '@/components/crypto/wizard/WizardValorisationStep';
import { WizardQualificationStep } from '@/components/crypto/wizard/WizardQualificationStep';
import { WizardCalculStep } from '@/components/crypto/wizard/WizardCalculStep';
import { WizardPreparationStep } from '@/components/crypto/wizard/WizardPreparationStep';

// ── Shared wizard state types ──
export interface AccountDraft {
  id: string;
  name: string;
  accountType: 'exchange' | 'wallet';
  country: string;
  isForeignAccount: boolean;
}

export interface TxDraft {
  id: string;
  accountId: string;
  date: string;
  assetFrom: string;
  assetTo: string;
  qtyFrom: string;
  qtyTo: string;
  fiatValueEur: string;
  feesEur: string;
  classification: TransactionClassification;
  /** Override de la valeur globale du portefeuille à ce moment (optionnel) */
  portfolioValueOverride?: string;
}

const STEPS: { key: WizardStep; label: string; shortLabel: string }[] = [
  { key: 'sources', label: 'Sources & comptes', shortLabel: 'Sources' },
  { key: 'transactions', label: 'Transactions', shortLabel: 'Transactions' },
  { key: 'valorisation', label: 'Valorisation EUR', shortLabel: 'Valeur' },
  { key: 'qualification', label: 'Qualification fiscale', shortLabel: 'Qualif.' },
  { key: 'calcul', label: 'Calcul PV/MV', shortLabel: 'Calcul' },
  { key: 'preparation', label: 'Synthèse & Export', shortLabel: 'Synthèse' },
];

const CryptoWizard = () => {
  const navigate = useNavigate();
  const [currentStepIdx, setCurrentStepIdx] = useState(0);
  const currentStep = STEPS[currentStepIdx];
  const progressPct = Math.round(((currentStepIdx + 1) / STEPS.length) * 100);

  // ── Shared state ──
  const [accounts, setAccounts] = useState<AccountDraft[]>([]);
  const [transactions, setTransactions] = useState<TxDraft[]>([]);
  const [initialPortfolioValue, setInitialPortfolioValue] = useState('');

  const goNext = useCallback(() => {
    if (currentStepIdx < STEPS.length - 1) setCurrentStepIdx((i) => i + 1);
  }, [currentStepIdx]);

  const goPrev = useCallback(() => {
    if (currentStepIdx > 0) setCurrentStepIdx((i) => i - 1);
  }, [currentStepIdx]);

  const renderStep = () => {
    switch (currentStep.key) {
      case 'sources':
        return <WizardSourcesStep accounts={accounts} setAccounts={setAccounts} />;
      case 'transactions':
        return (
          <WizardTransactionsStep
            transactions={transactions}
            setTransactions={setTransactions}
            accounts={accounts}
          />
        );
      case 'valorisation':
        return (
          <WizardValorisationStep
            transactions={transactions}
            setTransactions={setTransactions}
            initialPortfolioValue={initialPortfolioValue}
            setInitialPortfolioValue={setInitialPortfolioValue}
          />
        );
      case 'qualification':
        return (
          <WizardQualificationStep
            transactions={transactions}
            setTransactions={setTransactions}
          />
        );
      case 'calcul':
        return (
          <WizardCalculStep
            transactions={transactions}
            accounts={accounts}
            initialPortfolioValue={initialPortfolioValue}
          />
        );
      case 'preparation':
        return (
          <WizardPreparationStep
            transactions={transactions}
            accounts={accounts}
            initialPortfolioValue={initialPortfolioValue}
          />
        );
      default:
        return null;
    }
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-4 p-4 pb-32">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/crypto/2086')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-lg font-bold flex items-center gap-2">
              <Coins className="h-5 w-5 text-primary" />
              Préparation 2086
            </h1>
          </div>
          <Badge variant="outline" className="text-xs">
            Sauvegarde auto
            <Save className="h-3 w-3 ml-1" />
          </Badge>
        </div>

        {/* Step indicator */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>
              Étape {currentStepIdx + 1}/{STEPS.length} — {currentStep.label}
            </span>
            <span className="font-semibold text-primary">{progressPct}%</span>
          </div>
          <Progress value={progressPct} className="h-2" />
          <div className="flex gap-1">
            {STEPS.map((s, i) => (
              <button
                key={s.key}
                onClick={() => setCurrentStepIdx(i)}
                className={`flex-1 text-[10px] py-1 rounded-md text-center transition-colors ${
                  i === currentStepIdx
                    ? 'bg-primary/20 text-primary font-semibold'
                    : i < currentStepIdx
                    ? 'bg-success/10 text-success'
                    : 'bg-muted/30 text-muted-foreground'
                }`}
              >
                {s.shortLabel}
              </button>
            ))}
          </div>
        </div>

        {/* Step content */}
        <Card>
          <CardContent className="pt-6">{renderStep()}</CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex gap-3">
          <Button variant="outline" onClick={goPrev} disabled={currentStepIdx === 0} className="flex-1">
            <ArrowLeft className="h-4 w-4 mr-1" /> Précédent
          </Button>
          {currentStepIdx < STEPS.length - 1 ? (
            <Button onClick={goNext} className="flex-1">
              Continuer <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          ) : (
            <Button onClick={() => navigate('/crypto/2086/controls')} className="flex-1">
              Vérifier les contrôles <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default CryptoWizard;
