import { ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { BottomNav } from './BottomNav';

interface AppLayoutProps {
  children: ReactNode;
}

export const AppLayout = ({ children }: AppLayoutProps) => {
  return (
    <div className="min-h-screen bg-background">
      <div className="hidden lg:block">
        <Sidebar />
      </div>

      <main className="lg:ml-64 min-h-screen pb-20 lg:pb-0">
        <div className="relative">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] pointer-events-none" style={{ background: 'radial-gradient(ellipse at top, rgba(27,58,92,0.08), transparent 50%)' }} />
          <div className="relative p-4 lg:p-8">
            {children}
          </div>
        </div>
      </main>

      <BottomNav />
    </div>
  );
};
