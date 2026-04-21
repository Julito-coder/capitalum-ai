import { motion } from 'framer-motion';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from '@/components/ui/drawer';
import { Skeleton } from '@/components/ui/skeleton';
import { forwardRef, useState } from 'react';

interface NewsPersonnaliseeProps {
  context: string | null;
  title: string | null;
  body: string | null;
  loading?: boolean;
}

export const NewsPersonnalisee = forwardRef<HTMLDivElement, NewsPersonnaliseeProps>(
  ({ context, title, body, loading = false }, ref) => {
    const [drawerOpen, setDrawerOpen] = useState(false);

    // Skeleton pendant le chargement de la news
    if (loading) {
      return (
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45, duration: 0.5, ease: 'easeOut' }}
          className="bg-card rounded-xl border border-border p-6 mx-5 lg:mx-8 mt-4"
        >
          <Skeleton className="h-3 w-40 mb-3" />
          <Skeleton className="h-5 w-3/4 mb-3" />
          <Skeleton className="h-4 w-full mb-1" />
          <Skeleton className="h-4 w-2/3" />
        </motion.div>
      );
    }

    if (!title || !body) return null;

    return (
      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.45, duration: 0.5, ease: 'easeOut' }}
        className="bg-card rounded-xl border border-border p-6 mx-5 lg:mx-8 mt-4"
      >
        {context && (
          <p className="text-xs text-secondary font-medium uppercase tracking-wider">{context}</p>
        )}
        <h3 className="text-lg font-semibold text-foreground mt-2 leading-snug">{title}</h3>
        <p className="text-sm text-muted-foreground mt-3 leading-relaxed">{body}</p>

        <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
          <DrawerTrigger asChild>
            <button className="text-sm text-primary font-medium mt-4 hover:underline">
              Comprendre →
            </button>
          </DrawerTrigger>
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle>{title}</DrawerTitle>
            </DrawerHeader>
            <div className="p-6 space-y-4">
              {context && (
                <p className="text-xs text-secondary font-medium uppercase tracking-wider">{context}</p>
              )}
              <p className="text-base text-foreground leading-relaxed">{body}</p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Cette information est personnalisée en fonction de ton profil fiscal. 
                Pour des conseils adaptés à ta situation, n'hésite pas à consulter Élio Agent.
              </p>
            </div>
          </DrawerContent>
        </Drawer>
      </motion.div>
    );
  }
);

NewsPersonnalisee.displayName = 'NewsPersonnalisee';
