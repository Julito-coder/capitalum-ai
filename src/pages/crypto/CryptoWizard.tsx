import { useCallback, useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft, ArrowRight, Coins, Save, Loader2, CheckCircle2,
  AlertTriangle, WifiOff, Clock, RefreshCw,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import type { WizardStep, TransactionClassification } from '@/domain/crypto/types';

import { WizardSourcesStep } from '@/components/crypto/wizard/WizardSourcesStep';
import { WizardTransactionsStep } from '@/components/crypto/wizard/WizardTransactionsStep';
import { WizardValorisationStep } from '@/components/crypto/wizard/WizardValorisationStep';
import { WizardQualificationStep } from '@/components/crypto/wizard/WizardQualificationStep';
import { WizardCalculStep } from '@/components/crypto/wizard/WizardCalculStep';
import { WizardPreparationStep } from '@/components/crypto/wizard/WizardPreparationStep';
import { useCryptoDraft } from '@/hooks/useCryptoDraft';

// ── Shared wizard state types (exported for step components) ──
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

// ── Save status indicator ──
function SaveStatusBadge({ status, lastSavedAt }: { status: string; lastSavedAt: string | null }) {
  const formatTime = (iso: string) => {
    try {
      return new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    } catch { return ''; }
  };

  switch (status) {
    case 'saving':
      return (
        <Badge variant="outline" className="text-[10px] gap-1 animate-pulse">
          <Loader2 className="h-3 w-3 animate-spin" />
          Sauvegarde…
        </Badge>
      );
    case 'saved':
      return (
        <Badge variant="outline" className="text-[10px] gap-1 text-success border-success/30">
          <CheckCircle2 className="h-3 w-3" />
          {lastSavedAt ? `Sauvegardé à ${formatTime(lastSavedAt)}` : 'Sauvegardé'}
        </Badge>
      );
    case 'error':
      return (
        <Badge variant="outline" className="text-[10px] gap-1 text-destructive border-destructive/30">
          <AlertTriangle className="h-3 w-3" />
          Erreur — Réessayer
        </Badge>
      );
    case 'offline':
      return (
        <Badge variant="outline" className="text-[10px] gap-1 text-warning border-warning/30">
          <WifiOff className="h-3 w-3" />
          Sauvegarde locale
        </Badge>
      );
    default:
      return (
        <Badge variant="outline" className="text-[10px] gap-1">
          <Save className="h-3 w-3" />
          Auto-save actif
        </Badge>
      );
  }
}

const CryptoWizard = () => {
  const navigate = useNavigate();
  const [showResumeModal, setShowResumeModal] = useState(false);
  const [resumeChecked, setResumeChecked] = useState(false);

  const draft = useCryptoDraft(2025);

  const {
    accounts, setAccounts,
    transactions, setTransactions,
    initialPortfolioValue, setInitialPortfolioValue,
    currentStep, setCurrentStep,
    saveStatus, lastSavedAt,
    isLoading, hasExistingDraft,
    saveNow, resetDraft, setCalcSnapshot,
  } = draft;

  // Show resume modal once loaded if draft exists and step > 0
  const handleLoaded = useCallback(() => {
    if (hasExistingDraft && !resumeChecked) {
      setResumeChecked(true);
      if (draft.currentStep > 0 || transactions.length > 0 || accounts.length > 0) {
        setShowResumeModal(true);
      }
    }
  }, [hasExistingDraft, resumeChecked, draft.currentStep, transactions.length, accounts.length]);

  // Trigger once loading completes
  if (!isLoading && !resumeChecked) {
    handleLoaded();
  }

  const currentStepObj = STEPS[currentStep];
  const progressPct = Math.round(((currentStep + 1) / STEPS.length) * 100);

  const goNext = useCallback(() => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  }, [currentStep, setCurrentStep]);

  const goPrev = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  }, [currentStep, setCurrentStep]);

  const handleResumeExisting = () => {
    setShowResumeModal(false);
    // Draft is already loaded — do nothing
  };

  const handleStartNew = () => {
    resetDraft();
    setShowResumeModal(false);
  };

  const renderStep = () => {
    switch (currentStepObj.key) {
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
            onCalcComplete={setCalcSnapshot}
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

  if (isLoading) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Chargement de ta déclaration…</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-4 p-4 pb-32">
        {/* Resume modal */}
        <Dialog open={showResumeModal} onOpenChange={setShowResumeModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <RefreshCw className="h-5 w-5 text-primary" />
                Déclaration en cours retrouvée
              </DialogTitle>
              <DialogDescription className="space-y-2 pt-2">
                <p>
                  Nous avons retrouvé une déclaration 2086 en cours.
                </p>
                {lastSavedAt && (
                  <p className="flex items-center gap-1.5 text-xs">
                    <Clock className="h-3.5 w-3.5" />
                    Dernière sauvegarde : {new Date(lastSavedAt).toLocaleString('fr-FR')}
                  </p>
                )}
                <div className="flex gap-2 mt-1 text-xs">
                  <Badge variant="secondary">{accounts.length} compte(s)</Badge>
                  <Badge variant="secondary">{transactions.length} transaction(s)</Badge>
                  <Badge variant="secondary">Étape {currentStep + 1}/{STEPS.length}</Badge>
                </div>
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="flex-col sm:flex-row gap-2">
              <Button variant="outline" onClick={handleStartNew} className="w-full sm:w-auto">
                Nouvelle déclaration
              </Button>
              <Button onClick={handleResumeExisting} className="w-full sm:w-auto">
                <RefreshCw className="h-4 w-4 mr-2" />
                Reprendre le brouillon
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

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
          <SaveStatusBadge status={saveStatus} lastSavedAt={lastSavedAt} />
        </div>

        {/* Step indicator */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>
              Étape {currentStep + 1}/{STEPS.length} — {currentStepObj.label}
            </span>
            <span className="font-semibold text-primary">{progressPct}%</span>
          </div>
          <Progress value={progressPct} className="h-2" />
          <div className="flex gap-1">
            {STEPS.map((s, i) => (
              <button
                key={s.key}
                onClick={() => setCurrentStep(i)}
                className={`flex-1 text-[10px] py-1 rounded-md text-center transition-colors ${
                  i === currentStep
                    ? 'bg-primary/20 text-primary font-semibold'
                    : i < currentStep
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
          <Button variant="outline" onClick={goPrev} disabled={currentStep === 0} className="flex-1">
            <ArrowLeft className="h-4 w-4 mr-1" /> Précédent
          </Button>
          {currentStep < STEPS.length - 1 ? (
            <Button onClick={goNext} className="flex-1">
              Continuer <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          ) : (
            <Button onClick={() => { saveNow(); navigate('/crypto/2086/controls'); }} className="flex-1">
              Vérifier les contrôles <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default CryptoWizard;
