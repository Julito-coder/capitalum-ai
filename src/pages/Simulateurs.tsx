import { AppLayout } from '@/components/layout/AppLayout';
import { useNavigate } from 'react-router-dom';
import {
  Heart, Briefcase, Building2, PiggyBank, Sun,
  ArrowRight, Sparkles, Check, Clock, Baby, Users, HandCoins,
  Coins, FileText, TrendingUp, Wallet, Bitcoin, Home, Hammer,
  Calendar as CalendarIcon, LogOut,
} from 'lucide-react';
import { motion } from 'framer-motion';

type Status = 'available' | 'agent' | 'soon';

interface SubItem {
  label: string;
  icon: any;
  status: Status;
  to?: string;
  prompt?: string;
}

interface Section {
  title: string;
  subtitle: string;
  icon: any;
  accent: string;
  items: SubItem[];
}

const sections: Section[] = [
  {
    title: 'Famille & Couple',
    subtitle: 'Union, séparation, enfants, transmission',
    icon: Heart,
    accent: 'bg-[#1B3A5C]/10 text-[#1B3A5C]',
    items: [
      { label: 'PACS / Mariage', icon: Heart, status: 'available', to: '/simulateurs/pacs' },
      { label: 'Régime matrimonial', icon: Users, status: 'agent', prompt: 'Compare les régimes matrimoniaux (communauté réduite, séparation de biens, participation aux acquêts) dans ma situation.' },
      { label: 'Naissance / quotient familial', icon: Baby, status: 'agent', prompt: 'Quel est l\'impact fiscal d\'une naissance sur mon quotient familial et mon impôt ?' },
      { label: 'Garde alternée', icon: Users, status: 'agent', prompt: 'Explique l\'impact fiscal d\'une garde alternée (demi-parts) dans ma situation.' },
      { label: 'Pension alimentaire', icon: HandCoins, status: 'agent', prompt: 'Comment déduire ou déclarer une pension alimentaire versée ou reçue ?' },
      { label: 'Rattachement enfant majeur', icon: Users, status: 'agent', prompt: 'Vaut-il mieux rattacher mon enfant majeur étudiant à mon foyer fiscal ou verser une pension ?' },
      { label: 'Donation entre vifs', icon: HandCoins, status: 'agent', prompt: 'Explique-moi les abattements de donation (100 000€ / 15 ans) et la stratégie optimale.' },
      { label: 'Divorce / dissolution PACS', icon: LogOut, status: 'soon' },
      { label: 'Succession', icon: FileText, status: 'soon' },
    ],
  },
  {
    title: 'Vie professionnelle',
    subtitle: 'Statut, rémunération, transitions',
    icon: Briefcase,
    accent: 'bg-[#C8943E]/15 text-[#C8943E]',
    items: [
      { label: 'CDI vs Freelance', icon: Briefcase, status: 'available', to: '/simulateurs/freelance' },
      { label: 'Choix IR vs IS', icon: FileText, status: 'agent', prompt: 'Mon entreprise doit-elle être à l\'IR ou à l\'IS ? Compare les deux dans ma situation.' },
      { label: 'Dividendes vs salaire', icon: Coins, status: 'agent', prompt: 'En SASU/EURL, vaut-il mieux me verser un salaire ou des dividendes ?' },
      { label: 'Versement libératoire micro', icon: FileText, status: 'agent', prompt: 'Le versement libératoire de l\'impôt en micro-entreprise est-il intéressant pour moi ?' },
      { label: 'Passage micro → réel', icon: TrendingUp, status: 'agent', prompt: 'Quand basculer de la micro-entreprise au régime réel ?' },
      { label: 'Franchise TVA', icon: FileText, status: 'agent', prompt: 'Dois-je sortir de la franchise de TVA ou y rester ?' },
      { label: 'Rupture conventionnelle', icon: LogOut, status: 'agent', prompt: 'Compare rupture conventionnelle vs démission : ARE, fiscalité des indemnités.' },
      { label: 'Stock-options / BSPCE / AGA', icon: TrendingUp, status: 'agent', prompt: 'Explique-moi la fiscalité de mes stock-options / BSPCE / AGA.' },
      { label: 'Expatriation / impatriation', icon: LogOut, status: 'soon' },
    ],
  },
  {
    title: 'Immobilier',
    subtitle: 'Achat, locatif, travaux, revente',
    icon: Building2,
    accent: 'bg-[#4B8264]/15 text-[#4B8264]',
    items: [
      { label: 'Simulateur immobilier complet', icon: Building2, status: 'available', to: '/outils/simulateur' },
      { label: 'Résidence principale vs location', icon: Home, status: 'available', to: '/outils/simulateur' },
      { label: 'Locatif nu (micro-foncier vs réel)', icon: Building2, status: 'available', to: '/outils/simulateur' },
      { label: 'Locatif meublé (LMNP/LMP)', icon: Building2, status: 'available', to: '/outils/simulateur' },
      { label: 'Meublé tourisme / Airbnb', icon: Home, status: 'agent', prompt: 'Quels sont les nouveaux seuils 2025 pour la location meublée touristique (Airbnb) ?' },
      { label: 'SCI à l\'IR vs IS', icon: FileText, status: 'agent', prompt: 'SCI à l\'IR ou à l\'IS : que choisir dans ma situation ?' },
      { label: 'Travaux / déficit foncier', icon: Hammer, status: 'agent', prompt: 'Comment optimiser mes travaux locatifs avec le déficit foncier et MaPrimeRénov\' ?' },
      { label: 'Démembrement (usufruit / NP)', icon: FileText, status: 'agent', prompt: 'Explique-moi la stratégie de démembrement (usufruit / nue-propriété).' },
      { label: 'Plus-value à la revente', icon: TrendingUp, status: 'agent', prompt: 'Calcule ma plus-value à la revente et les abattements pour durée de détention.' },
      { label: 'Pinel / Denormandie / Loc\'Avantages', icon: Building2, status: 'soon' },
    ],
  },
  {
    title: 'Épargne & placements',
    subtitle: 'PER, AV, PEA, SCPI, crypto',
    icon: PiggyBank,
    accent: 'bg-[#1B3A5C]/10 text-[#1B3A5C]',
    items: [
      { label: 'Simulateur épargne PEA / PER', icon: PiggyBank, status: 'available', to: '/outils/epargne' },
      { label: 'Versement PER (déduction IR)', icon: Wallet, status: 'agent', prompt: 'Combien verser sur mon PER pour optimiser ma déduction d\'impôt ?' },
      { label: 'Assurance-vie (rachat / clause)', icon: FileText, status: 'agent', prompt: 'Comment optimiser mes rachats sur assurance-vie et la clause bénéficiaire ?' },
      { label: 'Arbitrage CTO → PEA', icon: TrendingUp, status: 'agent', prompt: 'Vaut-il mieux investir via mon CTO ou ouvrir un PEA ?' },
      { label: 'SCPI (direct, AV, démembrement)', icon: Building2, status: 'agent', prompt: 'Compare les façons d\'investir en SCPI : en direct, via AV, en démembrement.' },
      { label: 'Crypto (déclaration 2086)', icon: Bitcoin, status: 'available', to: '/outils/scanner' },
      { label: 'Épargne salariale (PEE/PERCO)', icon: Wallet, status: 'agent', prompt: 'Comment optimiser mon épargne salariale (PEE, PERCO, intéressement, participation) ?' },
      { label: 'Dons aux œuvres (66% / 75%)', icon: HandCoins, status: 'agent', prompt: 'Quelle réduction d\'impôt puis-je obtenir avec mes dons aux œuvres ?' },
      { label: 'FCPI / FIP', icon: TrendingUp, status: 'soon' },
    ],
  },
  {
    title: 'Retraite & événements',
    subtitle: 'Préparer, anticiper, transmettre',
    icon: Sun,
    accent: 'bg-[#C8943E]/15 text-[#C8943E]',
    items: [
      { label: 'Rachat de trimestres', icon: CalendarIcon, status: 'agent', prompt: 'Le rachat de trimestres pour ma retraite est-il rentable dans ma situation ?' },
      { label: 'Date optimale de départ', icon: CalendarIcon, status: 'agent', prompt: 'Quelle est la date optimale pour partir à la retraite (taux plein, surcote) ?' },
      { label: 'Sortie PER (capital vs rente)', icon: Wallet, status: 'agent', prompt: 'À la retraite, vaut-il mieux sortir mon PER en capital ou en rente ?' },
      { label: 'Cumul emploi-retraite', icon: Briefcase, status: 'agent', prompt: 'Comment fonctionne le cumul emploi-retraite et son imposition ?' },
      { label: 'Prime / bonus exceptionnel', icon: Coins, status: 'agent', prompt: 'J\'ai reçu une prime exceptionnelle. Comment lisser l\'impôt ou la verser sur un PER ?' },
      { label: 'Vente d\'entreprise (150-0 B ter)', icon: TrendingUp, status: 'soon' },
      { label: 'Pacte Dutreil', icon: FileText, status: 'soon' },
    ],
  },
];

const StatusBadge = ({ status }: { status: Status }) => {
  if (status === 'available') {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#4B8264] bg-[#4B8264]/10 px-2 py-0.5 rounded-full">
        <Check className="h-3 w-3" /> Disponible
      </span>
    );
  }
  if (status === 'agent') {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#C8943E] bg-[#C8943E]/10 px-2 py-0.5 rounded-full">
        <Sparkles className="h-3 w-3" /> Via Élio
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
      <Clock className="h-3 w-3" /> Bientôt
    </span>
  );
};

const Simulateurs = () => {
  const navigate = useNavigate();

  const handleClick = (item: SubItem) => {
    if (item.status === 'soon') return;
    if (item.to) {
      navigate(item.to);
      return;
    }
    if (item.prompt) {
      navigate('/agent', { state: { initialPrompt: item.prompt } });
    }
  };

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto space-y-6 pb-12">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl font-bold text-foreground">Simulateurs de vie</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Anticipe l'impact fiscal de tes grandes décisions, du PACS à la retraite.
          </p>
        </motion.div>

        {/* HERO - Simulateur immo */}
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={() => navigate('/outils/simulateur')}
          className="w-full bg-gradient-to-br from-[#1B3A5C] to-[#2A5A8C] text-white rounded-2xl p-6 text-left shadow-md hover:shadow-lg transition-all group"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-2 flex-1">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-[#C8943E] text-white px-2 py-0.5 rounded-full">
                  <Sparkles className="h-3 w-3" /> Outil complet
                </span>
              </div>
              <h2 className="text-xl font-bold">Simulateur immobilier</h2>
              <p className="text-sm text-white/80">
                Achat RP, locatif nu/meublé, SCI, travaux : amortissement, cashflow, patrimoine, dossier banque PDF.
              </p>
            </div>
            <div className="h-14 w-14 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
              <Building2 className="h-7 w-7" />
            </div>
          </div>
          <div className="flex items-center gap-2 mt-4 text-sm font-semibold">
            Lancer le simulateur
            <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </motion.button>

        {/* Sections */}
        {sections.map((section, sIdx) => (
          <motion.section
            key={section.title}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 + sIdx * 0.04 }}
            className="space-y-3"
          >
            <div className="flex items-center gap-3">
              <div className={`h-10 w-10 rounded-xl ${section.accent} flex items-center justify-center`}>
                <section.icon className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">{section.title}</h3>
                <p className="text-xs text-muted-foreground">{section.subtitle}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {section.items.map((item) => {
                const disabled = item.status === 'soon';
                return (
                  <button
                    key={item.label}
                    onClick={() => handleClick(item)}
                    disabled={disabled}
                    className={`bg-card rounded-xl border border-[#E5E7EB] p-4 text-left transition-all flex items-start gap-3 group ${
                      disabled
                        ? 'opacity-60 cursor-not-allowed'
                        : 'hover:border-[#1B3A5C]/30 hover:shadow-sm'
                    }`}
                  >
                    <div className="h-9 w-9 rounded-lg bg-[#F8F5F0] flex items-center justify-center shrink-0">
                      <item.icon className="h-4 w-4 text-[#1B3A5C]" />
                    </div>
                    <div className="flex-1 min-w-0 space-y-1.5">
                      <p className="text-sm font-medium text-foreground leading-tight group-hover:text-[#1B3A5C] transition-colors">
                        {item.label}
                      </p>
                      <StatusBadge status={item.status} />
                    </div>
                  </button>
                );
              })}
            </div>
          </motion.section>
        ))}

        <p className="text-xs text-muted-foreground text-center px-4 pt-6">
          Élio fournit des estimations à titre indicatif. Pour toute décision fiscale, consulte un professionnel habilité.
        </p>
      </div>
    </AppLayout>
  );
};

export default Simulateurs;
