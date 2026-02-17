import { Layout } from '@/components/layout/Layout';
import { motion } from 'framer-motion';
import { FileText, ChevronRight, Coins, Building2, Receipt, Clock, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface FormProcess {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  route: string;
  category: string;
  status: 'available' | 'coming_soon';
  tags: string[];
}

const FORM_PROCESSES: FormProcess[] = [
  {
    id: 'crypto-2086',
    title: 'Formulaire 2086 — Plus-values crypto',
    description: 'Préparation complète de la déclaration des cessions de crypto-actifs. Calcul PMPA, pack de report et exports.',
    icon: Coins,
    route: '/crypto/2086',
    category: 'Crypto',
    status: 'available',
    tags: ['crypto', 'obligatoire', 'annuel'],
  },
  {
    id: 'ir-2042',
    title: 'Déclaration de revenus (2042)',
    description: 'Assistance à la déclaration de revenus : revenus, déductions, crédits d\'impôt.',
    icon: Receipt,
    route: '#',
    category: 'Fiscalité',
    status: 'coming_soon',
    tags: ['IR', 'obligatoire', 'annuel'],
  },
  {
    id: 'sci-2072',
    title: 'Déclaration SCI (2072)',
    description: 'Déclaration des revenus fonciers pour les sociétés civiles immobilières.',
    icon: Building2,
    route: '#',
    category: 'Immobilier',
    status: 'coming_soon',
    tags: ['SCI', 'immobilier', 'annuel'],
  },
];

const FormulairesPage = () => {
  const navigate = useNavigate();

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-6">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2.5 rounded-xl bg-primary/10">
              <FileText className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold">Formulaires</h1>
              <p className="text-muted-foreground text-sm">
                Tous les processus de déclaration guidés par Capitalum
              </p>
            </div>
          </div>
        </motion.div>

        <div className="space-y-3">
          {FORM_PROCESSES.map((form, i) => {
            const Icon = form.icon;
            const isAvailable = form.status === 'available';

            return (
              <motion.div
                key={form.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Card
                  className={`border border-border/30 transition-all ${
                    isAvailable
                      ? 'cursor-pointer hover:border-primary/30 hover:shadow-md active:scale-[0.99]'
                      : 'opacity-60'
                  }`}
                  onClick={() => isAvailable && navigate(form.route)}
                >
                  <CardContent className="p-5">
                    <div className="flex items-start gap-4">
                      <div className={`p-3 rounded-xl shrink-0 ${isAvailable ? 'bg-primary/10' : 'bg-muted/50'}`}>
                        <Icon className={`h-6 w-6 ${isAvailable ? 'text-primary' : 'text-muted-foreground'}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-sm sm:text-base">{form.title}</h3>
                          {!isAvailable && (
                            <Badge variant="outline" className="text-[10px] px-2 py-0.5 bg-muted/50 text-muted-foreground border-border/30">
                              <Clock className="h-3 w-3 mr-1" />
                              Bientôt
                            </Badge>
                          )}
                          {isAvailable && (
                            <Badge variant="outline" className="text-[10px] px-2 py-0.5 bg-success/10 text-success border-success/20">
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              Disponible
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                          {form.description}
                        </p>
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {form.tags.map((tag) => (
                            <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full bg-muted/50 text-muted-foreground">
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                      {isAvailable && (
                        <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0 mt-1" />
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="p-4 rounded-xl bg-muted/30 border border-border/20 text-center"
        >
          <p className="text-xs text-muted-foreground">
            💡 Les formulaires sont également accessibles depuis le <strong>calendrier fiscal</strong> et les <strong>recommandations du tableau de bord</strong>.
          </p>
        </motion.div>
      </div>
    </Layout>
  );
};

export default FormulairesPage;
