import { Flame } from 'lucide-react';
import { motion } from 'framer-motion';

interface BulletinHeaderProps {
  userName: string;
  currentStreak: number;
}

function getGreeting(name: string): string {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return `Bonjour, ${name}.`;
  if (hour >= 12 && hour < 18) return `${name}, le bulletin t'attend.`;
  return `Bonsoir, ${name}.`;
}

function getWeekendGreeting(name: string): string {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return `Bon week-end, ${name}.`;
  return `Ton week-end, côté admin.`;
}

function isWeekend(): boolean {
  const day = new Date().getDay();
  return day === 0 || day === 6;
}

function formatDateFr(): string {
  return new Date().toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
}

export const BulletinHeader = ({ userName, currentStreak }: BulletinHeaderProps) => {
  const dateStr = formatDateFr();
  const weekend = isWeekend();
  const greeting = weekend ? getWeekendGreeting(userName || 'toi') : getGreeting(userName || 'toi');

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="px-5 pt-8 pb-4 lg:px-8 lg:pt-12 lg:pb-6"
    >
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground capitalize">{dateStr}</p>
        {currentStreak >= 3 && (
          <motion.span
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.6, type: 'spring', stiffness: 200 }}
            className="inline-flex items-center gap-1.5 bg-secondary/10 text-secondary px-3 py-1 rounded-full text-xs font-medium"
          >
            <Flame className="h-3.5 w-3.5" />
            {currentStreak} jours de suite
          </motion.span>
        )}
      </div>
      <h1 className="text-3xl lg:text-4xl font-bold text-foreground mt-2">
        {greeting}
      </h1>
    </motion.div>
  );
};
