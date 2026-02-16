import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, BookOpen, TrendingUp, Sparkles, CheckSquare, FolderOpen,
  ExternalLink, Calculator, ChevronRight, AlertTriangle,
  CheckCircle2, Upload, MessageSquare
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { EnrichedDeadline, DeadlineStatus } from '@/lib/deadlinesTypes';
import { useActionGuide } from '@/components/guides/ActionGuideContext';
import { useNavigate } from 'react-router-dom';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface DeadlineActionPanelProps {
  deadline: EnrichedDeadline;
  onClose: () => void;
  onStatusChange: (key: string, status: DeadlineStatus, reason?: string) => void;
  profile: any;
}

type PanelTab = 'understand' | 'impact' | 'action' | 'guide' | 'proof';

const TABS: { id: PanelTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'understand', label: 'Comprendre', icon: BookOpen },
  { id: 'impact', label: 'Impact', icon: TrendingUp },
  { id: 'action', label: 'Agir', icon: Sparkles },
  { id: 'guide', label: 'Guide', icon: CheckSquare },
  { id: 'proof', label: 'Preuve', icon: FolderOpen },
];

function formatCurrency(n: number): string {
  return n.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });
}

export const DeadlineActionPanel = ({ deadline, onClose, onStatusChange, profile }: DeadlineActionPanelProps) => {
  const [activeTab, setActiveTab] = useState<PanelTab>('understand');
  const [ignoreReason, setIgnoreReason] = useState('');
  const [showIgnoreForm, setShowIgnoreForm] = useState(false);
  const navigate = useNavigate();
  const { openGuide } = useActionGuide();
  const impact = deadline.personalImpact;

  // Generate 10-year projection data for chart
  const projectionData = Array.from({ length: 11 }).map((_, i) => ({
    year: `A${i}`,
    withAction: impact.estimatedGain * i,
    withoutAction: -(impact.riskIfNoAction * i),
  }));

  const handleAction = (action: typeof deadline.actions[0]) => {
    switch (action.type) {
      case 'external':
        if (action.target) window.open(action.target, '_blank', 'noopener');
        break;
      case 'simulation':
        if (action.target) navigate(action.target);
        onClose();
        break;
      case 'guide':
        // Will be connected to ActionGuide system
        if (action.target?.startsWith('/')) {
          navigate(action.target);
          onClose();
        }
        break;
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        {/* Backdrop */}
        <motion.div
          className="absolute inset-0 bg-background/80 backdrop-blur-sm"
          onClick={onClose}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        />

        {/* Panel */}
        <motion.div
          className="relative w-full max-w-2xl max-h-[92vh] bg-card border border-border/50 rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col"
          initial={{ y: '100%', opacity: 0 }}
          animate={{ y: 0, opacity: 1, transition: { type: 'spring', damping: 25, stiffness: 300 } }}
          exit={{ y: '100%', opacity: 0 }}
        >
          {/* Header */}
          <div className="sticky top-0 bg-card/95 backdrop-blur-md border-b border-border/30 px-5 py-4 z-10">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <h2 className="text-lg font-bold">{deadline.title}</h2>
                <p className="text-sm text-muted-foreground mt-0.5">{deadline.shortDescription}</p>
              </div>
              <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full shrink-0">
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 mt-4 overflow-x-auto pb-1 scrollbar-none -mx-1 px-1">
              {TABS.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all min-h-[40px]
                      ${isActive
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'text-muted-foreground hover:bg-muted'}`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-5 py-5">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                {activeTab === 'understand' && (
                  <div className="space-y-4">
                    <div className="p-4 rounded-xl bg-info/5 border border-info/20">
                      <h4 className="font-semibold text-sm flex items-center gap-2 mb-2">
                        <BookOpen className="h-4 w-4 text-info" />
                        C'est quoi ?
                      </h4>
                      <p className="text-sm text-muted-foreground leading-relaxed">{deadline.explanation}</p>
                    </div>

                    <div className="p-4 rounded-xl bg-warning/5 border border-warning/20">
                      <h4 className="font-semibold text-sm flex items-center gap-2 mb-2">
                        <AlertTriangle className="h-4 w-4 text-warning" />
                        Pourquoi c'est important ?
                      </h4>
                      <p className="text-sm text-muted-foreground leading-relaxed">{deadline.consequences}</p>
                    </div>

                    {deadline.externalUrl && (
                      <Button
                        variant="outline"
                        className="w-full min-h-[48px] justify-between"
                        onClick={() => window.open(deadline.externalUrl, '_blank', 'noopener')}
                      >
                        <span className="flex items-center gap-2">
                          <ExternalLink className="h-4 w-4" />
                          {deadline.externalUrlLabel || 'Accéder au formulaire officiel'}
                        </span>
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                )}

                {activeTab === 'impact' && (
                  <div className="space-y-4">
                    <div className="p-4 rounded-xl bg-success/5 border border-success/20">
                      <p className="text-sm leading-relaxed">{impact.explanation}</p>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <div className="text-center p-3 rounded-xl bg-success/10 border border-success/20">
                        <p className="text-lg font-bold text-success">{formatCurrency(impact.estimatedGain)}</p>
                        <p className="text-xs text-muted-foreground">Gain estimé</p>
                      </div>
                      <div className="text-center p-3 rounded-xl bg-destructive/10 border border-destructive/20">
                        <p className="text-lg font-bold text-destructive">{formatCurrency(impact.riskIfNoAction)}</p>
                        <p className="text-xs text-muted-foreground">Risque</p>
                      </div>
                      <div className="text-center p-3 rounded-xl bg-primary/10 border border-primary/20">
                        <p className="text-lg font-bold text-primary">{formatCurrency(impact.patrimonialEffect10y)}</p>
                        <p className="text-xs text-muted-foreground">Effet 10 ans</p>
                      </div>
                    </div>

                    {/* Chart */}
                    {(impact.estimatedGain > 0 || impact.riskIfNoAction > 0) && (
                      <div className="h-48 mt-2">
                        <p className="text-xs text-muted-foreground mb-2 font-medium">Projection patrimoniale sur 10 ans</p>
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={projectionData}>
                            <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" />
                            <XAxis dataKey="year" className="text-xs" tick={{ fontSize: 10 }} />
                            <YAxis className="text-xs" tick={{ fontSize: 10 }} tickFormatter={(v) => `${v >= 0 ? '+' : ''}${(v / 1000).toFixed(0)}k`} />
                            <Tooltip
                              formatter={(v: number) => formatCurrency(v)}
                              contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 12, fontSize: 12 }}
                            />
                            <Area type="monotone" dataKey="withAction" stackId="1" stroke="hsl(var(--success))" fill="hsl(var(--success))" fillOpacity={0.15} name="Avec action" />
                            <Area type="monotone" dataKey="withoutAction" stackId="2" stroke="hsl(var(--destructive))" fill="hsl(var(--destructive))" fillOpacity={0.1} name="Sans action" />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'action' && (
                  <div className="space-y-3">
                    {deadline.actions.map((action) => {
                      const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
                        Sparkles, Search: Calculator, ExternalLink, BookOpen, Calculator, FileText: FolderOpen, BarChart: TrendingUp, CheckSquare,
                      };
                      const Icon = iconMap[action.icon] || Sparkles;
                      return (
                        <Button
                          key={action.id}
                          variant={action.id === 'optimize' || action.id === 'guide' ? 'default' : 'outline'}
                          className="w-full min-h-[52px] justify-between text-left"
                          onClick={() => handleAction(action)}
                        >
                          <span className="flex items-center gap-3">
                            <Icon className="h-5 w-5" />
                            <span className="font-medium">{action.label}</span>
                          </span>
                          {action.type === 'external' ? <ExternalLink className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                        </Button>
                      );
                    })}

                    <div className="border-t border-border/30 pt-3 mt-4">
                      <p className="text-xs text-muted-foreground mb-2 font-medium">Changer le statut</p>
                      <div className="flex gap-2 flex-wrap">
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-warning border-warning/30"
                          onClick={() => onStatusChange(deadline.key, 'in_progress')}
                        >
                          En cours
                        </Button>
                        <Button
                          size="sm"
                          className="bg-success hover:bg-success/90"
                          onClick={() => onStatusChange(deadline.key, 'optimized')}
                        >
                          <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                          Optimisée
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-destructive border-destructive/30"
                          onClick={() => setShowIgnoreForm(true)}
                        >
                          Ignorer
                        </Button>
                      </div>

                      {showIgnoreForm && (
                        <div className="mt-3 space-y-2">
                          <Textarea
                            placeholder="Justification obligatoire..."
                            value={ignoreReason}
                            onChange={(e) => setIgnoreReason(e.target.value)}
                            className="min-h-[80px]"
                          />
                          <Button
                            size="sm"
                            variant="destructive"
                            disabled={!ignoreReason.trim()}
                            onClick={() => {
                              onStatusChange(deadline.key, 'ignored', ignoreReason);
                              setShowIgnoreForm(false);
                            }}
                          >
                            Confirmer l'ignorement
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {activeTab === 'guide' && (
                  <div className="space-y-4">
                    {['Vérifier éligibilité', 'Simuler', 'Arbitrer', 'Exécuter', 'Valider comme optimisé'].map((step, i) => {
                      const guideProgress = deadline.tracking?.guide_progress || {};
                      const stepKey = `step-${i}`;
                      const isDone = guideProgress[stepKey] === true;
                      return (
                        <div key={i} className={`flex items-center gap-4 p-4 rounded-xl border transition-all
                          ${isDone ? 'bg-success/5 border-success/20' : 'bg-muted/30 border-border/20'}`}>
                          <div className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0
                            ${isDone ? 'bg-success text-success-foreground' : 'bg-muted text-muted-foreground'}`}>
                            {isDone ? <CheckCircle2 className="h-4 w-4" /> : i + 1}
                          </div>
                          <div className="flex-1">
                            <p className={`font-medium text-sm ${isDone ? 'line-through text-muted-foreground' : ''}`}>{step}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {activeTab === 'proof' && (
                  <div className="space-y-4">
                    <div className="p-6 rounded-xl border-2 border-dashed border-border/50 text-center">
                      <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
                      <p className="text-sm font-medium">Joindre un justificatif</p>
                      <p className="text-xs text-muted-foreground mt-1">PDF, image ou document</p>
                      <Button variant="outline" size="sm" className="mt-3">
                        Choisir un fichier
                      </Button>
                    </div>

                    <div className="p-4 rounded-xl bg-muted/30 border border-border/20">
                      <h4 className="text-sm font-medium flex items-center gap-2 mb-2">
                        <MessageSquare className="h-4 w-4" />
                        Notes personnelles
                      </h4>
                      <Textarea
                        placeholder="Ajoute tes remarques..."
                        className="min-h-[80px]"
                        defaultValue={deadline.tracking?.notes || ''}
                      />
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Sticky CTA */}
          <div className="sticky bottom-0 bg-card/95 backdrop-blur-md border-t border-border/30 px-5 py-4">
            <Button
              className="w-full min-h-[52px] text-base font-semibold"
              onClick={() => {
                const mainAction = deadline.actions[0];
                if (mainAction) handleAction(mainAction);
              }}
            >
              <Sparkles className="h-5 w-5 mr-2" />
              Optimiser maintenant
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
