import { User, Building2 } from 'lucide-react';
import { useSpace } from '@/contexts/SpaceContext';
import { cn } from '@/lib/utils';

export const SpaceToggle = () => {
  const { currentSpace, toggleSpace, isPersonalSpace, isProfessionalSpace } = useSpace();

  return (
    <div className="p-4 border-b border-sidebar-border">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Espace
        </span>
      </div>
      
      <button
        onClick={toggleSpace}
        className="w-full relative flex items-center h-12 rounded-xl bg-secondary/50 p-1 transition-all"
      >
        {/* Sliding indicator */}
        <div 
          className={cn(
            "absolute h-10 w-[calc(50%-4px)] rounded-lg bg-primary shadow-lg transition-all duration-300 ease-out",
            isProfessionalSpace && "translate-x-[calc(100%+4px)]"
          )}
        />
        
        {/* Personal option */}
        <div 
          className={cn(
            "relative z-10 flex-1 flex items-center justify-center gap-2 py-2 rounded-lg transition-colors",
            isPersonalSpace ? "text-primary-foreground" : "text-muted-foreground"
          )}
        >
          <User className="h-4 w-4" />
          <span className="text-sm font-medium">Particulier</span>
        </div>
        
        {/* Professional option */}
        <div 
          className={cn(
            "relative z-10 flex-1 flex items-center justify-center gap-2 py-2 rounded-lg transition-colors",
            isProfessionalSpace ? "text-primary-foreground" : "text-muted-foreground"
          )}
        >
          <Building2 className="h-4 w-4" />
          <span className="text-sm font-medium">Pro</span>
        </div>
      </button>
      
      <p className="text-xs text-muted-foreground mt-2 text-center">
        {isPersonalSpace ? "Salariés, retraités, investisseurs" : "Indépendants, TPE, micro-entrepreneurs"}
      </p>
    </div>
  );
};
