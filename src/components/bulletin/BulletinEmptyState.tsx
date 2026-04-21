import { UserCircle, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

export const BulletinEmptyState = () => {
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="mx-5 lg:mx-8 mt-4 bg-card rounded-2xl border border-border shadow-sm p-6 lg:p-8 text-center"
    >
      <UserCircle className="h-12 w-12 text-muted-foreground mx-auto" />
      <h2 className="text-xl font-bold text-foreground mt-4">
        Je ne te connais pas encore assez
      </h2>
      <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
        Réponds à 5 questions pour que je puisse vraiment te rendre service.
      </p>
      <Button
        className="mt-6 h-11 rounded-xl"
        onClick={() => navigate('/profil/fiscal')}
      >
        Compléter mon profil (2 min)
        <ArrowRight className="h-4 w-4 ml-2" />
      </Button>
    </motion.div>
  );
};
