import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ExternalLink, MessageSquare, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useIsMobile } from '@/hooks/use-mobile';
import { EnrichedDeadline } from '@/lib/deadlinesTypes';
import { FormAssistantPanel } from './FormAssistantPanel';

interface InAppFormViewerProps {
  deadline: EnrichedDeadline;
  profile: any;
  onClose: () => void;
}

const FORM_TITLES: Record<string, string> = {
  '2086': 'Formulaire 2086 — Plus-values crypto-actifs',
  '3916-bis': 'Formulaire 3916-bis — Comptes crypto étrangers',
};

/** Local PDF paths served from /public/forms/ */
const LOCAL_PDF_PATHS: Record<string, string> = {
  '2086': '/forms/2086.pdf',
  '3916-bis': '/forms/3916-bis.pdf',
};

const OfficialPdfViewer = ({ pdfUrl, formType }: { pdfUrl: string; formType: string }) => {
  // Use local PDF if available, otherwise fall back to external URL
  const localPath = LOCAL_PDF_PATHS[formType];
  const iframeSrc = localPath ?? pdfUrl;

  return (
    <div className="relative w-full h-full">
      <iframe
        src={iframeSrc}
        className="w-full h-full border-0"
        title="Formulaire officiel PDF"
      />
    </div>
  );
};

export const InAppFormViewer = ({ deadline, profile, onClose }: InAppFormViewerProps) => {
  const isMobile = useIsMobile();
  const [showAssistant, setShowAssistant] = useState(!isMobile);
  const [activeField, setActiveField] = useState<string | undefined>();
  const formType = deadline.formType ?? '';
  const formTitle = FORM_TITLES[formType] ?? 'Formulaire';
  const pdfUrl = deadline.externalUrl ?? '';

  const userContext = {
    formType,
    professionalStatus: profile?.professional_status,
    cryptoPnl: profile?.crypto_pnl_2025,
    tmi: profile?.tax_bracket,
    familyStatus: profile?.family_status,
    cryptoWallet: profile?.crypto_wallet_address,
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
              <FileText className="h-5 w-5 text-primary shrink-0" />
              <h2 className="font-bold text-sm sm:text-base truncate">{formTitle}</h2>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {pdfUrl && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(pdfUrl, '_blank', 'noopener')}
                >
                  <ExternalLink className="h-4 w-4 mr-1" />
                  <span className="hidden sm:inline">Ouvrir dans un onglet</span>
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
          {/* PDF column */}
          <div className={`flex-1 overflow-hidden ${showAssistant && !isMobile ? 'w-[65%]' : 'w-full'}`}>
            {pdfUrl || LOCAL_PDF_PATHS[formType] ? (
              <OfficialPdfViewer pdfUrl={pdfUrl} formType={formType} />
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                <p>Aucun PDF officiel disponible pour ce formulaire.</p>
              </div>
            )}
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
