import { useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { 
  Scale, Euro, TrendingUp, CheckCircle2, XCircle, Star, AlertTriangle,
  Users, Car, Home, Shield, Calculator, Info, ChevronDown, ChevronUp
} from 'lucide-react';
import { formatCurrency } from '@/lib/dashboardService';
import {
  type StatusFormData,
  type StatusAnalysis,
  calculateAllStatuses,
  MICRO_THRESHOLDS,
} from '@/lib/statusCalculations';

const StatusComparator = () => {
  const [formData, setFormData] = useState<StatusFormData>({
    annualRevenue: 50000,
    businessExpenses: 10000,
    activityType: 'services',
    hasEmployees: false,
    employeeCount: 0,
    hasOffice: false,
    officeRent: 0,
    hasVehicle: false,
    vehicleExpenses: 0,
    wantsUnemployment: false,
    wantsDividends: false,
    planningToSell: false,
    yearsInBusiness: 0,
    familyStatus: 'single',
    otherHouseholdIncome: 0,
  });

  const [expandedId, setExpandedId] = useState<string | null>(null);

  const MICRO_THRESHOLD = MICRO_THRESHOLDS[formData.activityType];
  const isMicroEligible = formData.annualRevenue <= MICRO_THRESHOLD;
  const statuses = calculateAllStatuses(formData);
  const bestEligible = statuses.find(s => s.eligible);

  const update = (patch: Partial<StatusFormData>) => setFormData(p => ({ ...p, ...patch }));

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold">Comparateur de statuts</h1>
          <p className="text-muted-foreground mt-1">Analyse personnalisée selon ta situation — Barèmes 2025</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* ─── Formulaire ─── */}
          <Card className="border border-border/30 bg-card/80 backdrop-blur-sm lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Calculator className="h-5 w-5 text-primary" />
                Ta situation
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <Label>CA annuel prévu (HT)</Label>
                <Input type="number" value={formData.annualRevenue} onChange={(e) => update({ annualRevenue: Number(e.target.value) })} />
                <Slider value={[formData.annualRevenue]} onValueChange={(v) => update({ annualRevenue: v[0] })} min={10000} max={300000} step={5000} />
                <p className="text-xs text-muted-foreground text-right">{formData.annualRevenue.toLocaleString('fr-FR')} €</p>
              </div>

              <div className="space-y-2">
                <Label>Type d'activité</Label>
                <Select value={formData.activityType} onValueChange={(v: StatusFormData['activityType']) => update({ activityType: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="services">Prestations de services (BIC)</SelectItem>
                    <SelectItem value="liberal">Profession libérale (BNC)</SelectItem>
                    <SelectItem value="vente">Achat-revente (BIC)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Charges professionnelles annuelles</Label>
                <Input type="number" value={formData.businessExpenses} onChange={(e) => update({ businessExpenses: Number(e.target.value) })} />
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <Label className="flex items-center gap-2"><Home className="h-4 w-4" />Local professionnel</Label>
                  <Switch checked={formData.hasOffice} onCheckedChange={(c) => update({ hasOffice: c })} />
                </div>
                {formData.hasOffice && (
                  <Input type="number" placeholder="Loyer annuel" value={formData.officeRent || ''} onChange={(e) => update({ officeRent: Number(e.target.value) })} />
                )}
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <Label className="flex items-center gap-2"><Car className="h-4 w-4" />Véhicule professionnel</Label>
                  <Switch checked={formData.hasVehicle} onCheckedChange={(c) => update({ hasVehicle: c })} />
                </div>
                {formData.hasVehicle && (
                  <Input type="number" placeholder="Frais annuels" value={formData.vehicleExpenses || ''} onChange={(e) => update({ vehicleExpenses: Number(e.target.value) })} />
                )}
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <Label className="flex items-center gap-2"><Users className="h-4 w-4" />Salariés</Label>
                  <Switch checked={formData.hasEmployees} onCheckedChange={(c) => update({ hasEmployees: c })} />
                </div>
                {formData.hasEmployees && (
                  <Input type="number" placeholder="Nombre de salariés" value={formData.employeeCount || ''} onChange={(e) => update({ employeeCount: Number(e.target.value) })} min={1} />
                )}
              </div>

              <div className="pt-3 border-t border-border/30 space-y-3">
                <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Vos priorités</p>
                <div className="flex items-center justify-between">
                  <Label className="flex items-center gap-2"><Shield className="h-4 w-4" />Droits au chômage</Label>
                  <Switch checked={formData.wantsUnemployment} onCheckedChange={(c) => update({ wantsUnemployment: c })} />
                </div>
                <div className="flex items-center justify-between">
                  <Label className="flex items-center gap-2"><Euro className="h-4 w-4" />Optimiser dividendes</Label>
                  <Switch checked={formData.wantsDividends} onCheckedChange={(c) => update({ wantsDividends: c })} />
                </div>
                <div className="flex items-center justify-between">
                  <Label className="flex items-center gap-2"><TrendingUp className="h-4 w-4" />Revente prévue</Label>
                  <Switch checked={formData.planningToSell} onCheckedChange={(c) => update({ planningToSell: c })} />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Années d'activité</Label>
                <Input type="number" value={formData.yearsInBusiness} onChange={(e) => update({ yearsInBusiness: Number(e.target.value) })} min={0} />
              </div>

              {!isMicroEligible && (
                <div className="p-3 rounded-lg bg-warning/10 border border-warning/20 text-sm text-warning flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>CA supérieur au seuil micro ({formatCurrency(MICRO_THRESHOLD)})</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* ─── Résultats ─── */}
          <div className="lg:col-span-2 space-y-4">
            {statuses.map((status, index) => {
              const isBest = index === 0 && status.eligible;
              const isExpanded = expandedId === status.id;

              return (
                <Card
                  key={status.id}
                  className={`border transition-all ${
                    !status.eligible
                      ? 'border-border/20 opacity-60 bg-muted/30'
                      : isBest
                        ? 'border-success/50 ring-2 ring-success/20 bg-card/80 backdrop-blur-sm'
                        : 'border-border/30 bg-card/80 backdrop-blur-sm'
                  }`}
                >
                  <CardContent className="pt-6">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${
                          !status.eligible ? 'bg-muted' : isBest ? 'bg-success/10' : 'bg-primary/10'
                        }`}>
                          <Scale className={`h-6 w-6 ${!status.eligible ? 'text-muted-foreground' : isBest ? 'text-success' : 'text-primary'}`} />
                        </div>
                        <div>
                          <h3 className="font-bold text-lg">{status.name}</h3>
                          {isBest && (
                            <Badge className="bg-success/20 text-success border-success/30">
                              <Star className="h-3 w-3 mr-1" />Recommandé Elio
                            </Badge>
                          )}
                          {!status.eligible && (
                            <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/30">
                              Non éligible
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">Score</p>
                        <p className={`text-2xl font-bold ${isBest ? 'text-success' : ''}`}>
                          {status.elioScore}<span className="text-sm text-muted-foreground">/100</span>
                        </p>
                      </div>
                    </div>

                    {/* Inéligibilité */}
                    {!status.eligible && status.eligibilityReason && (
                      <div className="p-3 mb-4 rounded-lg bg-destructive/5 border border-destructive/20 text-sm text-destructive flex items-start gap-2">
                        <XCircle className="h-4 w-4 shrink-0 mt-0.5" />
                        <span>{status.eligibilityReason}</span>
                      </div>
                    )}

                    {/* KPIs */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                      <div className="p-3 rounded-xl bg-success/10">
                        <p className="text-xs text-muted-foreground">Net après impôts</p>
                        <p className="font-bold text-success">{formatCurrency(status.netAfterTax)}</p>
                      </div>
                      <div className="p-3 rounded-xl bg-destructive/10">
                        <p className="text-xs text-muted-foreground">Cotisations</p>
                        <p className="font-bold text-destructive">-{formatCurrency(status.charges)}</p>
                      </div>
                      <div className="p-3 rounded-xl bg-warning/10">
                        <p className="text-xs text-muted-foreground">IR estimé</p>
                        <p className="font-bold text-warning">-{formatCurrency(status.ir)}</p>
                      </div>
                      <div className="p-3 rounded-xl bg-accent/10">
                        <p className="text-xs text-muted-foreground">Taux effectif</p>
                        <p className="font-bold text-accent">{status.effectiveTaxRate.toFixed(1)}%</p>
                      </div>
                    </div>

                    {/* Recommendation */}
                    <div className="p-3 rounded-lg bg-primary/5 border border-primary/20 text-sm mb-4 flex items-start gap-2">
                      <Info className="h-4 w-4 shrink-0 mt-0.5 text-primary" />
                      <span>{status.recommendation}</span>
                    </div>

                    {/* Warnings */}
                    {status.warnings.length > 0 && (
                      <div className="space-y-2 mb-4">
                        {status.warnings.map((w, i) => (
                          <div key={i} className="p-2 rounded-lg bg-warning/5 border border-warning/20 text-xs text-warning flex items-start gap-2">
                            <AlertTriangle className="h-3 w-3 shrink-0 mt-0.5" />
                            <span>{w}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Pros / Cons */}
                    <div className="flex gap-4 text-sm mb-3">
                      <div className="flex-1 space-y-1">
                        {status.pros.slice(0, isExpanded ? undefined : 3).map((p, i) => (
                          <div key={i} className="flex items-start gap-1.5 text-success">
                            <CheckCircle2 className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                            <span className="text-foreground text-xs">{p}</span>
                          </div>
                        ))}
                      </div>
                      <div className="flex-1 space-y-1">
                        {status.cons.slice(0, isExpanded ? undefined : 3).map((c, i) => (
                          <div key={i} className="flex items-start gap-1.5 text-destructive">
                            <XCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                            <span className="text-foreground text-xs">{c}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Expanded details */}
                    {isExpanded && (
                      <div className="mt-4 pt-4 border-t border-border/30">
                        <p className="text-xs text-muted-foreground uppercase tracking-wide mb-3 font-medium">Détail du calcul</p>
                        <div className="grid grid-cols-2 gap-2">
                          {status.details.map((d, i) => (
                            <div key={i} className={`p-2 rounded-lg text-xs ${d.highlight ? 'bg-warning/10 border border-warning/20' : 'bg-muted/30'}`}>
                              <span className="text-muted-foreground">{d.label}</span>
                              <p className="font-semibold">{d.value}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Toggle */}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full mt-2 text-muted-foreground"
                      onClick={() => setExpandedId(isExpanded ? null : status.id)}
                    >
                      {isExpanded ? <ChevronUp className="h-4 w-4 mr-1" /> : <ChevronDown className="h-4 w-4 mr-1" />}
                      {isExpanded ? 'Masquer les détails' : 'Voir le détail du calcul'}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}

            {/* Disclaimer */}
            <div className="p-4 rounded-xl bg-muted/30 border border-border/30 text-xs text-muted-foreground flex items-start gap-2">
              <Info className="h-4 w-4 shrink-0 mt-0.5" />
              <div>
                <p className="font-medium mb-1">Avertissement</p>
                <p>Ces estimations sont basées sur les barèmes 2025 (IR, cotisations sociales, IS). Elles ne constituent pas un conseil fiscal. Consulte votre expert-comptable pour une analyse personnalisée tenant compte de l'ensemble de ta situation.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default StatusComparator;
