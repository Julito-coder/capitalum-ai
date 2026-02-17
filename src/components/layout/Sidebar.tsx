import { NavLink, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  FileSearch, 
  Calendar, 
  Calculator, 
  MessageCircle, 
  Settings,
  LogOut,
  ScanSearch,
  UserCircle,
  Receipt,
  PiggyBank,
  TrendingUp,
  Building2,
  FileText,
  Wallet
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useSpace } from '@/contexts/SpaceContext';
import { SpaceToggle } from './SpaceToggle';
import logo from '@/assets/logo.png';

// Navigation items for Personal space (Particuliers)
const personalNavItems = [
  { path: '/', icon: LayoutDashboard, label: 'Tableau de bord' },
  { path: '/fiscal-profile', icon: UserCircle, label: 'Mon profil fiscal' },
  { path: '/audit', icon: FileSearch, label: 'Audit fiscal' },
  { path: '/scanner', icon: ScanSearch, label: 'Scanner fiscal' },
  { path: '/calendar', icon: Calendar, label: 'Calendrier' },
  { path: '/simulator', icon: Building2, label: 'Simulateur Immo' },
  { path: '/savings', icon: PiggyBank, label: 'Épargne long terme' },
  { path: '/formulaires', icon: FileText, label: 'Formulaires' },
  { path: '/glossary', icon: FileText, label: 'Glossaire' },
];

// Navigation items for Professional space (Indépendants, TPE, Micro)
const professionalNavItems = [
  { path: '/', icon: LayoutDashboard, label: 'Tableau de bord' },
  { path: '/pro/onboarding', icon: Building2, label: 'Mon activité' },
  { path: '/pro/revenue', icon: TrendingUp, label: 'Suivi CA' },
  { path: '/pro/urssaf', icon: Receipt, label: 'URSSAF' },
  { path: '/pro/invoices', icon: FileText, label: 'Factures' },
  { path: '/pro/cashflow', icon: Wallet, label: 'Trésorerie' },
  { path: '/pro/hiring', icon: UserCircle, label: 'Simulateur embauche' },
  { path: '/pro/status', icon: Calculator, label: 'Comparateur statuts' },
  { path: '/scanner', icon: ScanSearch, label: 'Scanner fiscal' },
  { path: '/glossary', icon: FileText, label: 'Glossaire' },
];

export const Sidebar = () => {
  const location = useLocation();
  const { signOut } = useAuth();
  const { currentSpace, isProfessionalSpace } = useSpace();

  // Select nav items based on current space
  const navItems = isProfessionalSpace ? professionalNavItems : personalNavItems;

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r border-sidebar-border bg-sidebar flex flex-col">
      {/* Logo */}
      <div className="flex items-center gap-3 p-6 border-b border-sidebar-border">
        <img src={logo} alt="Capitalum" className="h-10 w-10 rounded-xl" />
        <span className="text-xl font-bold gradient-text">CAPITALUM</span>
      </div>

      {/* Space Toggle */}
      <SpaceToggle />

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
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
