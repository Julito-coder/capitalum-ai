import { useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { 
  CheckCircle2, 
  Circle, 
  Clock,
  ArrowRight,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { mockUserData, formatCurrency } from '@/data/mockData';

const CalendarPage = () => {
  const { calendar } = mockUserData;
  const [expandedMonth, setExpandedMonth] = useState<string | null>('December 2024');

  // Group tasks by month
  const tasksByMonth: Record<string, typeof calendar> = {};
  calendar.forEach(task => {
    const date = new Date(task.date);
    const monthKey = date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
    if (!tasksByMonth[monthKey]) {
      tasksByMonth[monthKey] = [];
    }
    tasksByMonth[monthKey].push(task);
  });

  const priorityConfig = {
    critical: {
      bg: 'bg-destructive/10',
      border: 'border-destructive/30',
      dot: 'bg-destructive',
      text: 'text-destructive'
    },
    warning: {
      bg: 'bg-warning/10',
      border: 'border-warning/30',
      dot: 'bg-warning',
      text: 'text-warning'
    },
    normal: {
      bg: 'bg-info/10',
      border: 'border-info/30',
      dot: 'bg-info',
      text: 'text-info'
    }
  };

  const statusIcon = (status: string) => {
    switch (status) {
      case 'done':
        return <CheckCircle2 className="h-5 w-5 text-success" />;
      case 'in_progress':
        return <Clock className="h-5 w-5 text-warning" />;
      default:
        return <Circle className="h-5 w-5 text-muted-foreground" />;
    }
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl lg:text-3xl font-bold mb-2">Calendrier fiscal</h1>
          <p className="text-muted-foreground">Toutes vos échéances et actions à venir</p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="glass-card rounded-xl p-4 text-center">
            <p className="text-3xl font-bold text-destructive">{calendar.filter(t => t.priority === 'critical' && t.status !== 'done').length}</p>
            <p className="text-sm text-muted-foreground">Urgentes</p>
          </div>
          <div className="glass-card rounded-xl p-4 text-center">
            <p className="text-3xl font-bold text-warning">{calendar.filter(t => t.priority === 'warning' && t.status !== 'done').length}</p>
            <p className="text-sm text-muted-foreground">À prévoir</p>
          </div>
          <div className="glass-card rounded-xl p-4 text-center">
            <p className="text-3xl font-bold text-success">{calendar.filter(t => t.status === 'done').length}</p>
            <p className="text-sm text-muted-foreground">Terminées</p>
          </div>
          <div className="glass-card rounded-xl p-4 text-center">
            <p className="text-3xl font-bold gradient-text">
              +{formatCurrency(calendar.filter(t => t.status !== 'done').reduce((sum, t) => sum + t.gain, 0))}
            </p>
            <p className="text-sm text-muted-foreground">À gagner</p>
          </div>
        </div>

        {/* Timeline */}
        <div className="space-y-4">
          {Object.entries(tasksByMonth).map(([month, tasks]) => {
            const isExpanded = expandedMonth === month;
            const hasUrgent = tasks.some(t => t.priority === 'critical' && t.status !== 'done');
            
            return (
              <div key={month} className="glass-card rounded-2xl overflow-hidden">
                <button
                  onClick={() => setExpandedMonth(isExpanded ? null : month)}
                  className="w-full flex items-center justify-between p-4 lg:p-6 hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    {hasUrgent && (
                      <span className="h-3 w-3 rounded-full bg-destructive animate-pulse" />
                    )}
                    <h3 className="text-lg font-semibold capitalize">{month}</h3>
                    <span className="text-sm text-muted-foreground">
                      {tasks.filter(t => t.status !== 'done').length} action(s)
                    </span>
                  </div>
                  {isExpanded ? (
                    <ChevronUp className="h-5 w-5 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-muted-foreground" />
                  )}
                </button>

                {isExpanded && (
                  <div className="px-4 lg:px-6 pb-4 lg:pb-6 space-y-3">
                    {tasks.map((task) => {
                      const config = priorityConfig[task.priority];
                      const date = new Date(task.date);
                      
                      return (
                        <div
                          key={task.id}
                          className={`flex items-center gap-4 p-4 rounded-xl ${config.bg} border ${config.border} transition-all hover:scale-[1.01]`}
                        >
                          <div className="relative">
                            <div className={`h-3 w-3 rounded-full ${config.dot}`} />
                          </div>
                          
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${config.bg} ${config.text}`}>
                                {date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                              </span>
                              {task.status === 'done' && (
                                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-success/20 text-success">
                                  Terminé
                                </span>
                              )}
                            </div>
                            <p className="font-medium">{task.title}</p>
                            {task.description && (
                              <p className="text-sm text-muted-foreground mt-1">{task.description}</p>
                            )}
                          </div>

                          {task.gain > 0 && (
                            <span className="text-sm font-bold text-success">
                              +{formatCurrency(task.gain)}
                            </span>
                          )}

                          {statusIcon(task.status)}
                          
                          {task.status !== 'done' && (
                            <button className="btn-secondary py-2 px-3 text-sm">
                              <ArrowRight className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </Layout>
  );
};

export default CalendarPage;
