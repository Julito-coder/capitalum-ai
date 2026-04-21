import { Flame } from 'lucide-react';

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

function formatDateFr(): string {
  return new Date().toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
}

export const BulletinHeader = ({ userName, currentStreak }: BulletinHeaderProps) => {
  const dateStr = formatDateFr();
  const greeting = getGreeting(userName || 'toi');

  return (
    <div className="px-5 pt-8 pb-4 lg:px-8 lg:pt-12 lg:pb-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground capitalize">{dateStr}</p>
        {currentStreak >= 3 && (
          <span className="inline-flex items-center gap-1.5 bg-secondary/10 text-secondary px-3 py-1 rounded-full text-xs font-medium">
            <Flame className="h-3.5 w-3.5" />
            {currentStreak} jours de suite
          </span>
        )}
      </div>
      <h1 className="text-3xl lg:text-4xl font-bold text-foreground mt-2">
        {greeting}
      </h1>
    </div>
  );
};
