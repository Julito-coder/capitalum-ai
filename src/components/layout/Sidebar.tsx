import { NavLink, useLocation } from 'react-router-dom';
import {
  Newspaper,
  Sparkles,
  Wrench,
  UserCircle,
  Calendar,
  ScanSearch,
  Building2,
  PiggyBank,
  FolderLock,
  Settings,
  LogOut,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { ElioLogo } from './ElioLogo';

const mainNav = [
  { path: '/bulletin', icon: Newspaper, label: 'Bulletin du jour' },
  { path: '/agent', icon: Sparkles, label: 'Élio Agent' },
];

const outilsNav = [
  { path: '/outils', icon: Wrench, label: 'Tous les outils', exact: true },
  { path: '/outils/calendrier', icon: Calendar, label: 'Calendrier' },
  { path: '/outils/scanner', icon: ScanSearch, label: 'Scanner fiscal' },
  { path: '/outils/simulateur', icon: Building2, label: 'Simulateur immo' },
  { path: '/outils/epargne', icon: PiggyBank, label: 'Épargne' },
  { path: '/outils/coffre', icon: FolderLock, label: 'Coffre-fort' },
];

const profilNav = [
  { path: '/profil', icon: UserCircle, label: 'Mon profil fiscal' },
];

export const Sidebar = () => {
  const location = useLocation();
  const { signOut } = useAuth();

  const isActive = (path: string, exact?: boolean) => {
    if (exact) return location.pathname === path;
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const renderLink = (item: { path: string; icon: React.ElementType; label: string; exact?: boolean }) => {
    const active = isActive(item.path, item.exact);
    return (
      <NavLink
        key={item.path}
        to={item.path}
        className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group ${
          active
            ? 'bg-primary/10 text-primary border border-primary/20'
            : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground'
        }`}
      >
        <item.icon
          className={`h-5 w-5 transition-colors ${active ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'}`}
          strokeWidth={active ? 2.5 : 2}
        />
        <span className="font-medium text-sm">{item.label}</span>
      </NavLink>
    );
  };

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r border-sidebar-border bg-sidebar flex flex-col">
      <div className="p-6 border-b border-sidebar-border">
        <ElioLogo />
      </div>

      <nav className="flex-1 p-4 space-y-6 overflow-y-auto">
        <div className="space-y-1">
          {mainNav.map(renderLink)}
        </div>

        <div className="space-y-1">
          <p className="px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Outils</p>
          {outilsNav.map(renderLink)}
        </div>

        <div className="space-y-1">
          <p className="px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Compte</p>
          {profilNav.map(renderLink)}
        </div>
      </nav>

      <div className="p-4 border-t border-sidebar-border space-y-1">
        <NavLink
          to="/profil"
          className="flex items-center gap-3 px-4 py-3 rounded-lg text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-all"
        >
          <Settings className="h-5 w-5 text-muted-foreground" />
          <span className="font-medium text-sm">Paramètres</span>
        </NavLink>
        <button
          onClick={signOut}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-destructive/70 hover:bg-destructive/10 hover:text-destructive transition-all"
        >
          <LogOut className="h-5 w-5" />
          <span className="font-medium text-sm">Déconnexion</span>
        </button>
      </div>
    </aside>
  );
};
