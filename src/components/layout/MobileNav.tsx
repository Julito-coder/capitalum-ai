import { NavLink, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  ScanSearch, 
  Calendar, 
  Calculator, 
  BookOpen
} from 'lucide-react';

const navItems = [
  { path: '/', icon: LayoutDashboard, label: 'Accueil' },
  { path: '/scanner', icon: ScanSearch, label: 'Scanner' },
  { path: '/calendar', icon: Calendar, label: 'Agenda' },
  { path: '/simulator', icon: Calculator, label: 'Simul.' },
  { path: '/glossary', icon: BookOpen, label: 'Glossaire' },
];

export const MobileNav = () => {
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-sidebar/95 backdrop-blur-lg border-t border-sidebar-border lg:hidden">
      <div className="flex items-center justify-around py-2">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-all ${
                isActive 
                  ? 'text-primary' 
                  : 'text-muted-foreground'
              }`}
            >
              <item.icon className={`h-5 w-5 ${isActive ? 'text-primary' : ''}`} />
              <span className="text-xs font-medium">{item.label}</span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
};
