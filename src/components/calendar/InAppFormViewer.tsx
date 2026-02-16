import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ExternalLink, MessageSquare, Loader2, FileText, AlertTriangle } from 'lucide-react';
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

/** Timeout (ms) before assuming the direct iframe is blocked */
const IFRAME_LOAD_TIMEOUT_MS = 8000;

type PdfLoadState = 'loading' | 'loaded' | 'fallback-loading' | 'fallback-loaded' | 'error';

const OfficialPdfViewer = ({ pdfUrl }: { pdfUrl: string }) => {
  const [state, setState] = useState<PdfLoadState>('loading');

  const googleViewerUrl = `https://docs.google.com/gview?url=${encodeURIComponent(pdfUrl)}&embedded=true`;

  // Timeout: if the direct iframe hasn't fired onLoad, switch to fallback
  useEffect(() => {
    if (state !== 'loading') return;
    const timer = setTimeout(() => {
      setState('fallback-loading');
    }, IFRAME_LOAD_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, [state]);

  const handleDirectLoad = () => {
    if (state === 'loading') setState('loaded');
  };

  const handleFallbackLoad = () => {
    if (state === 'fallback-loading') setState('fallback-loaded');
  };

  const handleFallbackError = () => {
    setState('error');
  };

  const isShowingDirect = state === 'loading' || state === 'loaded';
  const isShowingFallback = state === 'fallback-loading' || state === 'fallback-loaded';
  const isLoading = state === 'loading' || state === 'fallback-loading';

  if (state === 'error') {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 p-8 text-center">
        <AlertTriangle className="h-12 w-12 text-warning" />
        <h3 className="text-lg font-semibold">Impossible d'afficher le PDF ici</h3>
        <p className="text-muted-foreground text-sm max-w-md">
          Le site officiel bloque l'affichage intégré. Vous pouvez ouvrir le formulaire directement dans un nouvel onglet.
        </p>
        <Button onClick={() => window.open(pdfUrl, '_blank', 'noopener')}>
          <ExternalLink className="h-4 w-4 mr-2" />
          Ouvrir le PDF officiel
        </Button>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      {isLoading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-background/80 z-10">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">
            {state === 'loading' ? 'Chargement du PDF officiel…' : 'Tentative via le lecteur alternatif…'}
          </p>
        </div>
      )}

      {isShowingDirect && (
        <iframe
          src={pdfUrl}
          className="w-full h-full border-0"
          title="Formulaire officiel PDF"
          onLoad={handleDirectLoad}
        />
      )}

      {isShowingFallback && (
        <iframe
          src={googleViewerUrl}
          className="w-full h-full border-0"
          title="Formulaire officiel PDF (lecteur alternatif)"
          onLoad={handleFallbackLoad}
          onError={handleFallbackError}
        />
      )}
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
            {pdfUrl ? (
              <OfficialPdfViewer pdfUrl={pdfUrl} />
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
