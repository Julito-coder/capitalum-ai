import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { loadFiscalProfile, calculateProfileCompletion } from '@/lib/fiscalProfileService';

/**
 * Non-intrusive popup that suggests completing the fiscal profile.
 * Shows on dashboard if fiscal profile completion < 100%, dismissable for 7 days.
 */
export const ProfileCompletionPopup = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!user) return;

    const checkAndShow = async () => {
      // Check if dismissed recently
      const dismissedKey = `elio_fiscal_popup_dismissed_${user.id}`;
      const dismissed = localStorage.getItem(dismissedKey);
      if (dismissed) {
        const daysSince = (Date.now() - new Date(dismissed).getTime()) / (1000 * 60 * 60 * 24);
        if (daysSince < 7) return;
      }

      // Check fiscal profile completion
      const profile = await loadFiscalProfile(user.id);
      const completion = calculateProfileCompletion(profile);
      if (completion < 100) {
        setVisible(true);
      }
    };

    const timer = setTimeout(checkAndShow, 3000);
    return () => clearTimeout(timer);
  }, [user]);

  const dismiss = () => {
    if (user) {
      localStorage.setItem(`elio_fiscal_popup_dismissed_${user.id}`, new Date().toISOString());
    }
    setVisible(false);
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 60, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 40, scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          className="fixed bottom-6 right-6 left-6 sm:left-auto sm:w-96 z-50"
        >
          <div className="glass-card rounded-2xl p-5 shadow-2xl border border-primary/20">
            <button
              onClick={dismiss}
              className="absolute top-3 right-3 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-xl bg-primary/20 flex items-center justify-center flex-shrink-0">
                <Sparkles className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-semibold text-sm mb-1">Complète ton profil fiscal</p>
                <p className="text-xs text-muted-foreground mb-3">
                  En 2 minutes, renseigne quelques infos en plus pour booster la pertinence de tes recommandations.
                </p>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => {
                      dismiss();
                      navigate('/fiscal-profile');
                    }}
                    className="btn-primary text-xs px-4 py-2 rounded-xl"
                  >
                    Compléter mon profil
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={dismiss}
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Plus tard
                  </button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
