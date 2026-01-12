import { Calendar, ArrowRight, CheckCircle2 } from 'lucide-react';
import { CalendarTask, formatCurrency } from '@/data/mockData';

interface CalendarPreviewProps {
  tasks: CalendarTask[];
  onViewAll?: () => void;
}

export const CalendarPreview = ({ tasks, onViewAll }: CalendarPreviewProps) => {
  const upcomingTasks = tasks.filter(t => t.status !== 'done').slice(0, 4);

  const priorityConfig = {
    critical: {
      dot: 'bg-destructive',
      text: 'text-destructive'
    },
    warning: {
      dot: 'bg-warning',
      text: 'text-warning'
    },
    normal: {
      dot: 'bg-info',
      text: 'text-info'
    }
  };

  return (
    <div className="glass-card rounded-2xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Calendar className="h-5 w-5 text-primary" />
          </div>
          <h3 className="text-lg font-semibold">Prochaines échéances</h3>
        </div>
        <button 
          onClick={onViewAll}
          className="flex items-center gap-1 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
        >
          Tout voir
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>

      <div className="space-y-3">
        {upcomingTasks.map((task) => {
          const config = priorityConfig[task.priority];
          const date = new Date(task.date);
          const daysLeft = Math.ceil((date.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
          
          return (
            <div 
              key={task.id}
              className="flex items-center gap-4 p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer group"
            >
              <div className="relative">
                <div className={`h-3 w-3 rounded-full ${config.dot}`} />
                {task.priority === 'critical' && (
                  <div className={`absolute inset-0 h-3 w-3 rounded-full ${config.dot} animate-ping opacity-75`} />
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{task.title}</p>
                <p className="text-xs text-muted-foreground">
                  {date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                  {daysLeft > 0 ? ` • Dans ${daysLeft} jours` : daysLeft === 0 ? ' • Aujourd\'hui' : ' • En retard!'}
                </p>
              </div>

              {task.gain > 0 && (
                <span className="text-sm font-semibold text-success">
                  +{formatCurrency(task.gain)}
                </span>
              )}

              <button className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg hover:bg-success/10">
                <CheckCircle2 className="h-4 w-4 text-success" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
