import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ExternalLink, MessageSquare, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useIsMobile } from '@/hooks/use-mobile';
import { EnrichedDeadline } from '@/lib/deadlinesTypes';
import { FormAssistantPanel } from './FormAssistantPanel';
import { Crypto2086Form, CessionEntry } from './forms/Crypto2086Form';
import { ForeignAccounts3916Form, AccountEntry } from './forms/ForeignAccounts3916Form';
import { upsertTracking } from '@/lib/deadlinesService';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

interface InAppFormViewerProps {
  deadline: EnrichedDeadline;
  profile: any;
  onClose: () => void;
}

const FORM_TITLES: Record<string, string> = {
  '2086': 'Formulaire 2086 — Plus-values crypto-actifs',
  '3916-bis': 'Formulaire 3916-bis — Comptes crypto étrangers',
};

export const InAppFormViewer = ({ deadline, profile, onClose }: InAppFormViewerProps) => {
  const isMobile = useIsMobile();
  const { user } = useAuth();
  const [showAssistant, setShowAssistant] = useState(!isMobile);
  const [activeField, setActiveField] = useState<string | undefined>();
  const formType = deadline.formType ?? '';
  const formTitle = FORM_TITLES[formType] ?? 'Formulaire';

  // Load existing data from tracking
  const existingFormData = deadline.tracking?.guide_progress
    ? (deadline.tracking.guide_progress as Record<string, unknown>)?.form_data as any
    : null;

  const userContext = {
    formType,
    professionalStatus: profile?.professional_status,
    cryptoPnl: profile?.crypto_pnl_2025,
    tmi: profile?.tax_bracket,
    familyStatus: profile?.family_status,
    cryptoWallet: profile?.crypto_wallet_address,
  };

  const handleSaveFormData = useCallback(async (formData: any) => {
    if (!user) return;
    try {
      const existingProgress = (deadline.tracking?.guide_progress as Record<string, unknown>) ?? {};
      await upsertTracking(user.id, deadline.key, {
        status: 'in_progress',
        guide_progress: {
          ...existingProgress,
          form_data: {
            formType,
            ...formData,
            savedAt: new Date().toISOString(),
          },
        } as any,
      });
    } catch (err) {
      console.error('Error saving form data:', err);
      toast({ title: 'Erreur', description: 'Impossible de sauvegarder.', variant: 'destructive' });
    }
  }, [user, deadline, formType]);

  const renderForm = () => {
    switch (formType) {
      case '2086':
        return (
          <Crypto2086Form
            initialData={existingFormData}
            cryptoPnl={profile?.crypto_pnl_2025}
            onSave={handleSaveFormData}
            onFieldFocus={setActiveField}
          />
        );
      case '3916-bis':
        return (
          <ForeignAccounts3916Form
            initialData={existingFormData}
            cryptoWalletAddress={profile?.crypto_wallet_address}
            onSave={handleSaveFormData}
            onFieldFocus={setActiveField}
          />
        );
      default:
        return (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <p>Formulaire non disponible</p>
          </div>
        );
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 bg-background flex flex-col"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
      >
        {/* Header */}
        <div className="shrink-0 border-b border-border/30 bg-card/95 backdrop-blur-md px-4 py-3">
          <div className="flex items-center justify-between max-w-7xl mx-auto">
            <div className="flex items-center gap-3 min-w-0">
              <h2 className="font-bold text-sm sm:text-base truncate">{formTitle}</h2>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {deadline.externalUrl && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(deadline.externalUrl, '_blank', 'noopener')}
                >
                  <ExternalLink className="h-4 w-4 mr-1" />
                  <span className="hidden sm:inline">PDF officiel</span>
                </Button>
              )}
              {isMobile && (
                <Button
                  variant={showAssistant ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setShowAssistant((v) => !v)}
                >
                  <MessageSquare className="h-4 w-4" />
                </Button>
              )}
              <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full">
                <X className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>

        {/* Content — split layout */}
        <div className="flex-1 flex overflow-hidden">
          {/* Form column */}
          <div className={`flex-1 overflow-y-auto p-4 sm:p-6 ${showAssistant && !isMobile ? 'w-[65%]' : 'w-full'}`}>
            <div className="max-w-2xl mx-auto">
              {renderForm()}
            </div>
          </div>

          {/* Assistant column */}
          {showAssistant && (
            <div className={`border-l border-border/30 ${isMobile ? 'fixed inset-0 z-50 bg-card' : 'w-[35%]'}`}>
              <FormAssistantPanel
                formType={formType}
                formTitle={formTitle}
                userContext={userContext}
                activeField={activeField}
                onClose={isMobile ? () => setShowAssistant(false) : undefined}
              />
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
