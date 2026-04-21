import { CalendarClock, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import type { BulletinDeadline } from '@/lib/bulletinEngine';

interface ProchaineEcheanceProps {
  deadline: BulletinDeadline;
}

function formatEuros(cents: number): string {
  return Math.round(cents / 100).toLocaleString('fr-FR') + ' €';
}

export const ProchaineEcheance = ({ deadline }: ProchaineEcheanceProps) => {
  const navigate = useNavigate();
  const isUrgent = deadline.daysLeft < 14;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      onClick={() => navigate('/outils/calendrier')}
      className="bg-card rounded-xl border border-border p-5 mx-5 lg:mx-8 mt-4 flex items-center gap-4 cursor-pointer hover:shadow-sm transition-shadow"
    >
      <CalendarClock className={`h-6 w-6 flex-shrink-0 ${isUrgent ? 'text-warning' : 'text-muted-foreground'}`} />
      <div className="flex-1 min-w-0">
        <p className="text-xs uppercase tracking-wider text-muted-foreground">Prochain rendez-vous</p>
        <p className="text-base font-semibold text-foreground mt-0.5 truncate">
          {deadline.title}
          {deadline.amountCents ? ` — ${formatEuros(deadline.amountCents)}` : ''}
        </p>
        <p className="text-sm text-muted-foreground mt-0.5">
          {new Date(deadline.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}
          {' · '}
          {deadline.daysLeft === 0 ? "aujourd'hui" : deadline.daysLeft === 1 ? 'demain' : `dans ${deadline.daysLeft} jours`}
        </p>
      </div>
      <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
    </motion.div>
  );
};
