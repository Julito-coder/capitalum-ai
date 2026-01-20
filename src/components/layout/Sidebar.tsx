import { NavLink, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  FileSearch, 
  Calendar, 
  Calculator, 
  MessageCircle, 
  Settings,
  LogOut
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import logo from '@/assets/logo.png';

const navItems = [
  { path: '/', icon: LayoutDashboard, label: 'Tableau de bord' },
  { path: '/audit', icon: FileSearch, label: 'Audit fiscal' },
  { path: '/calendar', icon: Calendar, label: 'Calendrier' },
  { path: '/simulator', icon: Calculator, label: 'Simulateur' },
  { path: '/assistant', icon: MessageCircle, label: 'Assistant' },
];

export const Sidebar = () => {
  const location = useLocation();
  const { signOut } = useAuth();

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r border-sidebar-border bg-sidebar flex flex-col">
      {/* Logo */}
      <div className="flex items-center gap-3 p-6 border-b border-sidebar-border">
        <img src={logo} alt="Capitalum" className="h-10 w-10 rounded-xl" />
        <span className="text-xl font-bold gradient-text">CAPITALUM</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group ${
                isActive 
                  ? 'bg-primary/10 text-primary border border-primary/20' 
                  : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground'
              }`}
            >
              <item.icon className={`h-5 w-5 transition-colors ${isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'}`} />
              <span className="font-medium">{item.label}</span>
              {isActive && (
                <div className="ml-auto h-2 w-2 rounded-full bg-primary animate-pulse" />
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Bottom section */}
      <div className="p-4 border-t border-sidebar-border space-y-1">
        <NavLink
          to="/settings"
          className="flex items-center gap-3 px-4 py-3 rounded-lg text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-all"
        >
          <Settings className="h-5 w-5 text-muted-foreground" />
          <span className="font-medium">Paramètres</span>
        </NavLink>
        <button 
          onClick={signOut}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-destructive/70 hover:bg-destructive/10 hover:text-destructive transition-all"
        >
          <LogOut className="h-5 w-5" />
          <span className="font-medium">Déconnexion</span>
        </button>
      </div>
    </aside>
  );
};
