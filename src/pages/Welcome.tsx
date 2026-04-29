import { useEffect } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  Check,
  Sparkles,
  ScanLine,
  Calendar,
  Calculator,
  HandCoins,
  Bot,
  Newspaper,
  ShieldCheck,
  Menu,
  X,
} from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { useAuth } from '@/contexts/AuthContext';
import { ElioLogo } from '@/components/layout/ElioLogo';
import { Loader2 } from 'lucide-react';

const SIGNUP_HREF = '/quiz';
const LOGIN_HREF = '/auth?mode=login&from=welcome';

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-80px' },
  transition: { duration: 0.5, ease: 'easeOut' as const },
} as const;

// ─────────────────────────────────────── Nav
function LandingNav() {
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/60 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link to="/welcome" className="flex items-center">
          <ElioLogo variant="compact" size={32} className="sm:hidden" />
          <ElioLogo variant="compact" size={36} className="hidden sm:inline-flex" />
        </Link>
        <nav className="hidden items-center gap-8 md:flex">
          <a href="#features" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Fonctionnalités</a>
          <a href="#pricing" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Tarifs</a>
          <a href="#faq" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">FAQ</a>
        </nav>
        <div className="hidden items-center gap-3 md:flex">
          <Link to={LOGIN_HREF}>
            <Button variant="ghost" size="sm">Se connecter</Button>
          </Link>
          <Link to={SIGNUP_HREF}>
            <Button size="sm" className="gap-1">
              Commencer gratuitement
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
        <button
          aria-label="Ouvrir le menu"
          className="md:hidden p-2 -mr-2 text-foreground"
          onClick={() => setOpen(!open)}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>
      {open && (
        <div className="md:hidden border-t border-border bg-background">
          <div className="flex flex-col gap-1 px-4 py-3">
            <a href="#features" onClick={() => setOpen(false)} className="rounded-lg px-3 py-2 text-sm font-medium hover:bg-muted">Fonctionnalités</a>
            <a href="#pricing" onClick={() => setOpen(false)} className="rounded-lg px-3 py-2 text-sm font-medium hover:bg-muted">Tarifs</a>
            <a href="#faq" onClick={() => setOpen(false)} className="rounded-lg px-3 py-2 text-sm font-medium hover:bg-muted">FAQ</a>
            <div className="mt-2 flex flex-col gap-2 border-t border-border pt-3">
              <Link to={LOGIN_HREF}><Button variant="outline" className="w-full">Se connecter</Button></Link>
              <Link to={SIGNUP_HREF}><Button className="w-full">Commencer gratuitement</Button></Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

// ─────────────────────────────────────── Hero
function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(60% 50% at 80% 0%, hsl(37 55% 51% / 0.18), transparent 60%), radial-gradient(60% 50% at 10% 20%, hsl(210 53% 23% / 0.12), transparent 60%)',
        }}
      />
      <div className="relative mx-auto grid max-w-7xl gap-12 px-4 py-16 sm:px-6 sm:py-24 lg:grid-cols-2 lg:gap-16 lg:py-32">
        <motion.div {...fadeUp} className="flex flex-col justify-center">
          <span className="inline-flex w-fit items-center gap-2 rounded-full border border-secondary/30 bg-secondary/10 px-3 py-1 text-xs font-medium text-secondary">
            <Sparkles className="h-3.5 w-3.5" />
            Diagnostic gratuit en 90 secondes
          </span>
          <h1 className="mt-6 text-4xl font-bold leading-[1.05] tracking-tight text-foreground sm:text-5xl lg:text-6xl">
            Ne perds plus un euro par{' '}
            <span className="gradient-text">manque d'information.</span>
          </h1>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            Élio est ton copilote administratif et financier. Aides oubliées, erreurs fiscales, contrats sous-optimisés — on récupère en moyenne <strong className="text-foreground">2 000 € par an</strong> pour toi.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link to={SIGNUP_HREF}>
              <Button size="lg" className="w-full gap-2 sm:w-auto">
                Créer mon compte gratuit
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <a href="#how">
              <Button size="lg" variant="outline" className="w-full sm:w-auto">
                Voir comment ça marche
              </Button>
            </a>
          </div>
          <p className="mt-4 text-xs text-muted-foreground">
            Sans CB · Diagnostic offert · 2 minutes
          </p>
        </motion.div>

        {/* Mockup */}
        <motion.div
          initial={{ opacity: 0, y: 30, rotate: -1 }}
          animate={{ opacity: 1, y: 0, rotate: 0 }}
          transition={{ duration: 0.7, ease: 'easeOut', delay: 0.1 }}
          className="relative flex items-center justify-center"
        >
          <div className="absolute inset-0 -z-10 rounded-[2rem] bg-gradient-to-br from-primary/10 via-transparent to-secondary/20 blur-2xl" />
          <div className="w-full max-w-sm rounded-[2rem] border border-border bg-card p-4 shadow-2xl">
            <div className="rounded-2xl bg-background p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Mardi 29 avril</p>
                  <p className="text-lg font-bold text-foreground">Bonjour Léa</p>
                </div>
                <div className="rounded-full bg-success/15 px-3 py-1 text-xs font-semibold text-success">
                  +420 €
                </div>
              </div>
              <div className="mt-4 rounded-xl border border-border bg-card p-4">
                <p className="text-xs font-medium uppercase tracking-wider text-secondary">Action du jour</p>
                <p className="mt-1 font-semibold text-foreground">Demande l'APL étudiant</p>
                <p className="mt-1 text-xs text-muted-foreground">Tu as droit à environ 220 €/mois.</p>
                <Button size="sm" className="mt-3 w-full">Faire la démarche</Button>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <div className="rounded-xl border border-border bg-card p-3">
                  <p className="text-[10px] font-medium uppercase text-muted-foreground">Score Élio</p>
                  <p className="text-2xl font-bold text-primary">72</p>
                </div>
                <div className="rounded-xl border border-border bg-card p-3">
                  <p className="text-[10px] font-medium uppercase text-muted-foreground">Récupérable</p>
                  <p className="text-2xl font-bold text-secondary">2 140 €</p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────── Social proof
function SocialProof() {
  const stats = [
    { value: '10 Md€', label: "d'aides non réclamées chaque année en France" },
    { value: '2 000 €', label: 'récupérables en moyenne par foyer' },
    { value: '90 s', label: 'pour ton premier diagnostic' },
  ];
  return (
    <section className="border-y border-border bg-card/50">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:grid-cols-3 sm:px-6">
        {stats.map((s, i) => (
          <motion.div key={i} {...fadeUp} transition={{ ...fadeUp.transition, delay: i * 0.1 }} className="text-center">
            <p className="text-3xl font-bold text-primary sm:text-4xl">{s.value}</p>
            <p className="mt-2 text-sm text-muted-foreground">{s.label}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

// ─────────────────────────────────────── How it works
function HowItWorks() {
  const steps = [
    { n: 1, title: 'Réponds au quiz', desc: '5 à 7 questions, en swipe. Pas de formulaire interminable.' },
    { n: 2, title: 'Reçois ton Score Élio', desc: 'Un score de 0 à 100, ton montant récupérable et le top 3 des actions.' },
    { n: 3, title: 'Agis chaque matin', desc: 'Ton bulletin quotidien : une action concrète, en 60 secondes.' },
  ];
  return (
    <section id="how" className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
      <motion.div {...fadeUp} className="mx-auto max-w-2xl text-center">
        <h2 className="text-3xl font-bold text-foreground sm:text-4xl">Comment ça marche</h2>
        <p className="mt-4 text-muted-foreground">Trois étapes pour transformer l'admin en habitude qui rapporte.</p>
      </motion.div>
      <div className="mt-12 grid gap-6 md:grid-cols-3">
        {steps.map((s, i) => (
          <motion.div key={s.n} {...fadeUp} transition={{ ...fadeUp.transition, delay: i * 0.1 }}>
            <Card className="h-full p-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold">
                {s.n}
              </div>
              <h3 className="mt-4 text-lg font-semibold text-foreground">{s.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{s.desc}</p>
            </Card>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

// ─────────────────────────────────────── Features
function FeaturesGrid() {
  const features = [
    { icon: Newspaper, title: 'Bulletin quotidien', desc: "L'habitude qui rapporte. Une action, un gain en euros, chaque matin." },
    { icon: ScanLine, title: 'Scanner fiscal IA', desc: 'Détecte les erreurs et optimisations sur ton avis ou ta déclaration.' },
    { icon: HandCoins, title: 'Détecteur d\'aides', desc: "APL, prime d'activité, MaPrimeRénov', chèque énergie… on vérifie pour toi." },
    { icon: Calendar, title: 'Calendrier prédictif', desc: 'Toutes tes échéances et prélèvements estimés sur 12 mois.' },
    { icon: Calculator, title: 'Simulateurs', desc: 'Immobilier, PACS, freelance, épargne longue. Avec PDF exportable.' },
    { icon: Bot, title: 'Agent IA Élio', desc: 'Pose tes questions. Réponses chiffrées avec les vrais barèmes français.' },
  ];
  return (
    <section id="features" className="bg-card/50 py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <motion.div {...fadeUp} className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold text-foreground sm:text-4xl">Tout ce qu'il te faut, dans une seule app</h2>
          <p className="mt-4 text-muted-foreground">Élio remplace 25 plateformes administratives. On a tout pensé pour toi.</p>
        </motion.div>
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f, i) => (
            <motion.div key={f.title} {...fadeUp} transition={{ ...fadeUp.transition, delay: i * 0.05 }}>
              <Card className="h-full p-6 transition-shadow hover:shadow-md">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <f.icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 text-base font-semibold text-foreground">{f.title}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground">{f.desc}</p>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────── Pricing
function Pricing() {
  const free = [
    'Diagnostic complet + Score Élio',
    'Top 3 actions personnalisées',
    'Calendrier sans montants',
    '1 scan fiscal par mois',
    'Agent IA limité (5 requêtes/jour)',
  ];
  const premium = [
    'Tout le plan Gratuit',
    'Calendrier avec montants + trésorerie',
    'Scans fiscaux illimités',
    'Agent IA illimité + actions + exports',
    'Simulateurs complets + PDF',
    'Coffre-fort 5 Go',
    'Coach fiscal proactif',
  ];
  return (
    <section id="pricing" className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
      <motion.div {...fadeUp} className="mx-auto max-w-2xl text-center">
        <h2 className="text-3xl font-bold text-foreground sm:text-4xl">Des tarifs simples</h2>
        <p className="mt-4 text-muted-foreground">Commence gratuitement. Passe en Premium quand Élio te rapporte.</p>
      </motion.div>
      <div className="mx-auto mt-12 grid max-w-4xl gap-6 md:grid-cols-2">
        <motion.div {...fadeUp}>
          <Card className="flex h-full flex-col p-8">
            <h3 className="text-lg font-semibold text-foreground">Gratuit</h3>
            <p className="mt-1 text-sm text-muted-foreground">Pour découvrir Élio</p>
            <p className="mt-6 text-4xl font-bold text-foreground">0 €<span className="text-base font-normal text-muted-foreground">/mois</span></p>
            <ul className="mt-6 flex-1 space-y-3">
              {free.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm text-foreground">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                  {f}
                </li>
              ))}
            </ul>
            <Link to={SIGNUP_HREF} className="mt-8">
              <Button variant="outline" className="w-full">Commencer gratuitement</Button>
            </Link>
          </Card>
        </motion.div>
        <motion.div {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.1 }}>
          <Card className="relative flex h-full flex-col border-secondary/40 p-8 shadow-lg">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-secondary-foreground">
              Le plus choisi
            </div>
            <h3 className="text-lg font-semibold text-foreground">Premium</h3>
            <p className="mt-1 text-sm text-muted-foreground">Pour récupérer chaque euro</p>
            <p className="mt-6 text-4xl font-bold text-foreground">9,99 €<span className="text-base font-normal text-muted-foreground">/mois</span></p>
            <p className="text-xs text-muted-foreground">ou 99 €/an (2 mois offerts)</p>
            <ul className="mt-6 flex-1 space-y-3">
              {premium.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm text-foreground">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                  {f}
                </li>
              ))}
            </ul>
            <Link to={SIGNUP_HREF} className="mt-8">
              <Button className="w-full">Commencer gratuitement</Button>
            </Link>
          </Card>
        </motion.div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────── Testimonials
function Testimonials() {
  const items = [
    { name: 'Léa, 22 ans', role: 'Étudiante', quote: "J'ai découvert que j'avais droit à 220 €/mois d'APL et à la prime d'activité. En 5 minutes." },
    { name: 'Thomas, 29 ans', role: 'Développeur CDI', quote: "Élio m'a fait gagner 680 € sur ma déclaration grâce aux frais réels télétravail." },
    { name: 'Sarah & Karim', role: 'Couple, 2 enfants', quote: "On a enfin compris notre quotient familial et optimisé la CMG. 1 200 €/an récupérés." },
  ];
  return (
    <section className="bg-card/50 py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <motion.div {...fadeUp} className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold text-foreground sm:text-4xl">Ils ont récupéré leur argent</h2>
        </motion.div>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {items.map((t, i) => (
            <motion.div key={t.name} {...fadeUp} transition={{ ...fadeUp.transition, delay: i * 0.1 }}>
              <Card className="h-full p-6">
                <p className="text-sm leading-relaxed text-foreground">« {t.quote} »</p>
                <div className="mt-4 border-t border-border pt-4">
                  <p className="text-sm font-semibold text-foreground">{t.name}</p>
                  <p className="text-xs text-muted-foreground">{t.role}</p>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
        <p className="mt-6 text-center text-xs text-muted-foreground">Exemples illustratifs basés sur des profils types.</p>
      </div>
    </section>
  );
}

// ─────────────────────────────────────── FAQ
function FAQ() {
  const items = [
    { q: 'Est-ce que c\'est vraiment gratuit ?', a: "Oui. Le diagnostic, le Score Élio et les actions essentielles sont gratuits, sans carte bancaire. Le plan Premium est optionnel pour débloquer les fonctionnalités avancées." },
    { q: 'Élio remplace-t-il mon comptable ?', a: "Non. Élio fournit des estimations à titre indicatif et te guide vers les bonnes démarches. Pour toute décision fiscale importante, consulte un professionnel habilité." },
    { q: 'Mes données sont-elles en sécurité ?', a: "Tes données sont chiffrées et hébergées en Europe. Tu peux exporter ou supprimer ton compte à tout moment depuis ton profil." },
    { q: 'Puis-je l\'utiliser sur mobile ?', a: "Oui. Élio est une application web installable (PWA) optimisée mobile. Tu peux l'ajouter à ton écran d'accueil iPhone ou Android en un clic." },
    { q: 'Quand passer en Premium ?', a: "Quand Élio t'a déjà fait gagner plus que le prix de l'abonnement. La plupart des utilisateurs récupèrent 10 à 20× le coût annuel." },
  ];
  return (
    <section id="faq" className="mx-auto max-w-3xl px-4 py-20 sm:px-6">
      <motion.div {...fadeUp} className="text-center">
        <h2 className="text-3xl font-bold text-foreground sm:text-4xl">Questions fréquentes</h2>
      </motion.div>
      <motion.div {...fadeUp} className="mt-10">
        <Accordion type="single" collapsible className="space-y-2">
          {items.map((item, i) => (
            <AccordionItem key={i} value={`item-${i}`} className="rounded-xl border border-border bg-card px-4">
              <AccordionTrigger className="text-left text-sm font-semibold text-foreground hover:no-underline">
                {item.q}
              </AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground">
                {item.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </motion.div>
    </section>
  );
}

// ─────────────────────────────────────── Final CTA
function FinalCTA() {
  return (
    <section className="px-4 pb-20 sm:px-6">
      <motion.div
        {...fadeUp}
        className="relative mx-auto max-w-6xl overflow-hidden rounded-3xl px-8 py-16 text-center sm:px-16 sm:py-20"
        style={{
          background:
            'linear-gradient(135deg, hsl(210 53% 23%) 0%, hsl(210 53% 28%) 50%, hsl(37 55% 51%) 130%)',
        }}
      >
        <div aria-hidden className="absolute inset-0 opacity-20" style={{ background: 'radial-gradient(60% 60% at 50% 0%, white, transparent)' }} />
        <div className="relative">
          <h2 className="text-3xl font-bold text-primary-foreground sm:text-4xl lg:text-5xl">
            Commence à récupérer ton argent dès aujourd'hui.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-base text-primary-foreground/80">
            Diagnostic gratuit en 90 secondes. Sans carte bancaire.
          </p>
          <Link to={SIGNUP_HREF} className="mt-8 inline-block">
            <Button size="lg" variant="secondary" className="gap-2 bg-background text-primary hover:bg-background/90">
              Créer mon compte gratuit
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </motion.div>
    </section>
  );
}

// ─────────────────────────────────────── Footer
function LandingFooter() {
  return (
    <footer className="border-t border-border bg-card">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <div className="grid gap-8 sm:grid-cols-2 md:grid-cols-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold">É</div>
              <span className="font-bold text-foreground">Élio</span>
            </div>
            <p className="mt-3 text-xs text-muted-foreground">Le copilote administratif et financier des Français.</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-foreground">Produit</p>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li><a href="#features" className="hover:text-foreground">Fonctionnalités</a></li>
              <li><a href="#pricing" className="hover:text-foreground">Tarifs</a></li>
              <li><Link to="/auth" className="hover:text-foreground">Se connecter</Link></li>
            </ul>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-foreground">Ressources</p>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li><a href="#faq" className="hover:text-foreground">FAQ</a></li>
              <li><a href="mailto:contact@eliotax.fr" className="hover:text-foreground">Contact</a></li>
            </ul>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-foreground">Légal</p>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li><a href="#" className="hover:text-foreground">Mentions légales</a></li>
              <li><a href="#" className="hover:text-foreground">Confidentialité</a></li>
              <li><a href="#" className="hover:text-foreground">CGU</a></li>
            </ul>
          </div>
        </div>
        <div className="mt-10 flex flex-col gap-4 border-t border-border pt-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Élio. Tous droits réservés.</p>
          <p className="flex items-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5" />
            Élio fournit des estimations à titre indicatif. Pour toute décision fiscale, consulte un professionnel habilité.
          </p>
        </div>
      </div>
    </footer>
  );
}

// ─────────────────────────────────────── Page
const Welcome = () => {
  const { user, loading } = useAuth();

  useEffect(() => {
    document.title = 'Élio — Ne perds plus un euro par manque d\'information';
    const meta =
      document.querySelector('meta[name="description"]') ||
      (() => {
        const m = document.createElement('meta');
        m.setAttribute('name', 'description');
        document.head.appendChild(m);
        return m;
      })();
    meta.setAttribute(
      'content',
      "Élio est ton copilote administratif et financier. Diagnostic gratuit en 90s. Récupère en moyenne 2 000 €/an d'aides, erreurs fiscales et contrats sous-optimisés.",
    );
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (user) {
    return <Navigate to="/bulletin" replace />;
  }

  return (
    <div className="min-h-screen bg-background font-sans text-foreground">
      <LandingNav />
      <main>
        <Hero />
        <SocialProof />
        <HowItWorks />
        <FeaturesGrid />
        <Pricing />
        <Testimonials />
        <FAQ />
        <FinalCTA />
      </main>
      <LandingFooter />
    </div>
  );
};

export default Welcome;
