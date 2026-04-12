import { motion } from 'framer-motion';
import { Calendar, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface UpcomingDeadline {
  title: string;
  date: Date;
  impactScore: number;
}

interface CalendarPreviewProps {
  deadlines: UpcomingDeadline[];
}

export const CalendarPreview = ({ deadlines }: CalendarPreviewProps) => {
  const navigate = useNavigate();
  const upcoming = deadlines.slice(0, 3);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      className="bg-card rounded-xl border border-border p-5 shadow-sm space-y-4"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-primary" />
          <h3 className="font-semibold text-foreground">Prochaines échéances</h3>
        </div>
        <button
          onClick={() => navigate('/outils/calendrier')}
          className="text-xs font-medium text-primary hover:underline flex items-center gap-1"
        >
          Tout voir <ArrowRight className="h-3 w-3" />
        </button>
      </div>

      {upcoming.length === 0 ? (
        <p className="text-sm text-muted-foreground py-2">Aucune échéance à venir</p>
      ) : (
        <div className="space-y-3">
          {upcoming.map((d, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex flex-col items-center justify-center shrink-0">
                <span className="text-xs font-bold text-primary leading-none">
                  {format(d.date, 'dd', { locale: fr })}
                </span>
                <span className="text-[10px] text-primary/70 uppercase leading-none">
                  {format(d.date, 'MMM', { locale: fr })}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{d.title}</p>
                <p className="text-xs text-muted-foreground">
                  Impact : {'●'.repeat(d.impactScore)}{'○'.repeat(5 - d.impactScore)}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
};
