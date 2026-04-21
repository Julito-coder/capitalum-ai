import { TrendingUp, Minus } from 'lucide-react';
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import { useEffect, useState } from 'react';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from '@/components/ui/drawer';

interface GainCumuleProps {
  totalCents: number;
  weeklyDeltaCents: number;
}

function formatEuros(cents: number): string {
  const euros = Math.round(cents / 100);
  return euros.toLocaleString('fr-FR') + ' €';
}

const AnimatedNumber = ({ value }: { value: number }) => {
  const [displayed, setDisplayed] = useState(0);

  useEffect(() => {
    const controls = animate(0, value, {
      duration: 1.2,
      ease: 'easeOut',
      onUpdate: (v) => setDisplayed(Math.round(v)),
    });
    return controls.stop;
  }, [value]);

  return <>{displayed.toLocaleString('fr-FR')} €</>;
};

export const GainCumule = ({ totalCents, weeklyDeltaCents }: GainCumuleProps) => {
  const isPositiveDelta = weeklyDeltaCents > 0;

  return (
    <Drawer>
      <DrawerTrigger asChild>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-card rounded-2xl border border-border shadow-sm p-6 mx-5 lg:mx-8 cursor-pointer hover:shadow-md transition-shadow"
        >
          <p className="text-sm text-muted-foreground">Élio t'a fait gagner</p>
          <p className="text-5xl lg:text-6xl font-bold text-primary mt-2">
            <AnimatedNumber value={Math.round(totalCents / 100)} />
          </p>
          <p className="text-sm text-muted-foreground mt-1">cette année</p>

          <div className="flex items-center gap-1.5 mt-3">
            {isPositiveDelta ? (
              <>
                <TrendingUp className="h-4 w-4 text-success" />
                <span className="text-sm font-medium text-success">
                  + {formatEuros(weeklyDeltaCents)} cette semaine
                </span>
              </>
            ) : (
              <>
                <Minus className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium text-muted-foreground">
                  stable cette semaine
                </span>
              </>
            )}
          </div>
        </motion.div>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Détail de tes gains</DrawerTitle>
        </DrawerHeader>
        <div className="p-6 space-y-4">
          <div className="flex justify-between items-center py-3 border-b border-border">
            <span className="text-sm text-muted-foreground">Optimisations fiscales</span>
            <span className="font-semibold text-foreground">{formatEuros(Math.round(totalCents * 0.5))}</span>
          </div>
          <div className="flex justify-between items-center py-3 border-b border-border">
            <span className="text-sm text-muted-foreground">Aides réclamées</span>
            <span className="font-semibold text-foreground">{formatEuros(Math.round(totalCents * 0.3))}</span>
          </div>
          <div className="flex justify-between items-center py-3">
            <span className="text-sm text-muted-foreground">Contrats optimisés</span>
            <span className="font-semibold text-foreground">{formatEuros(Math.round(totalCents * 0.2))}</span>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
};
