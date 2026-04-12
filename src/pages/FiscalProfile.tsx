import { AppLayout } from '@/components/layout/AppLayout';
import { FiscalProfileForm } from '@/components/fiscal-profile/FiscalProfileForm';
import { motion } from 'framer-motion';
import { UserCircle } from 'lucide-react';

const FiscalProfile = () => {
  return (
    <AppLayout>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-2xl bg-primary/20 flex items-center justify-center">
            <UserCircle className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Mon profil fiscal</h1>
            <p className="text-sm text-muted-foreground">
              Complète tes informations pour des recommandations ultra précises.
            </p>
          </div>
        </div>

        <FiscalProfileForm />
      </motion.div>
    </AppLayout>
  );
};

export default FiscalProfile;
