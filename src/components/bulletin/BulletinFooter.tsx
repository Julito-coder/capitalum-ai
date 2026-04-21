import { Calendar, ScanSearch, MessageCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

export const BulletinFooter = () => {
  const navigate = useNavigate();

  const shortcuts = [
    { icon: Calendar, label: 'Calendrier', path: '/outils/calendrier' },
    { icon: ScanSearch, label: 'Scanner', path: '/outils/scanner' },
    { icon: MessageCircle, label: 'Élio Agent', path: '/agent' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.5 }}
      className="mt-8 mx-5 lg:mx-8"
    >
      <div className="bg-muted/30 rounded-xl p-4 flex gap-3">
        {shortcuts.map(({ icon: Icon, label, path }) => (
          <button
            key={path}
            onClick={() => navigate(path)}
            className="flex-1 flex flex-col items-center gap-1.5 py-2 rounded-lg hover:bg-muted/50 transition-colors"
          >
            <Icon className="h-5 w-5 text-muted-foreground" />
            <span className="text-xs text-muted-foreground font-medium">{label}</span>
          </button>
        ))}
      </div>

      <p className="text-center text-xs text-muted-foreground/60 mt-6 mb-8">
        Bulletin généré à 00h01 · Reviens demain à la même heure
      </p>
    </motion.div>
  );
};
