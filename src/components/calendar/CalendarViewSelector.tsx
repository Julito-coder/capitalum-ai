import { CalendarViewMode } from '@/lib/deadlinesTypes';
import { Calendar, Target, AlertTriangle } from 'lucide-react';

interface ViewSelectorProps {
  activeView: CalendarViewMode;
  onChange: (view: CalendarViewMode) => void;
}

const VIEWS: { id: CalendarViewMode; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'chronological', label: 'Chronologique', icon: Calendar },
  { id: 'strategic', label: 'Stratégique', icon: Target },
  { id: 'urgent', label: 'Urgent (90j)', icon: AlertTriangle },
];

export const CalendarViewSelector = ({ activeView, onChange }: ViewSelectorProps) => {
  return (
    <div className="flex gap-1 p-1 rounded-xl bg-muted/50 border border-border/30">
      {VIEWS.map((view) => {
        const Icon = view.icon;
        const isActive = activeView === view.id;
        return (
          <button
            key={view.id}
            onClick={() => onChange(view.id)}
            className={`flex items-center gap-1.5 px-3 sm:px-4 py-2.5 rounded-lg text-sm font-medium transition-all flex-1 justify-center min-h-[44px]
              ${isActive
                ? 'bg-card text-foreground shadow-sm border border-border/50'
                : 'text-muted-foreground hover:text-foreground'}`}
          >
            <Icon className="h-4 w-4" />
            <span className="hidden sm:inline">{view.label}</span>
          </button>
        );
      })}
    </div>
  );
};
