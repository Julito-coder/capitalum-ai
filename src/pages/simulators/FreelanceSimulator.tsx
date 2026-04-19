import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Briefcase, AlertTriangle, Check, X, Trophy } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Badge } from '@/components/ui/badge';
import { calculateAllStatuses, computeIR, computeParts, type ActivityType, type StatusFormData } from '@/lib/statusCalculations';
import { formatCurrency } from '@/data/mockData';

const FreelanceSimulator = () => {
  const navigate = useNavigate();
  const [annualRevenue, setAnnualRevenue] = useState(60000);
  const [businessExpenses, setBusinessExpenses] = useState(8000);
  const [activityType, setActivityType] = useState<ActivityType>('services');
  const [familyStatus, setFamilyStatus] = useState<'single' | 'pacs' | 'married'>('single');
  const [compareCDI, setCompareCDI] = useState(true);
  const [grossSalary, setGrossSalary] = useState(45000);
  const [expanded, setExpanded] = useState<string | null>(null);

  const statuses = useMemo(() => {
    const data: StatusFormData = {
      annualRevenue,
      businessExpenses,
      activityType,
      hasEmployees: false,
      employeeCount: 0,
      hasOffice: false,
      officeRent: 0,
      hasVehicle: false,
      vehicleExpenses: 0,
      wantsUnemployment: false,
      wantsDividends: true,
      planningToSell: false,
      yearsInBusiness: 1,
      familyStatus,
      otherHouseholdIncome: 0,
    };
    return calculateAllStatuses(data);
  }, [annualRevenue, businessExpenses, activityType, familyStatus]);

  const cdiNet = useMemo(() => {
    if (!compareCDI) return null;
    const netSalary = grossSalary * 0.78; // ~22% charges salariales
    const parts = computeParts(familyStatus, 0);
    const ir = computeIR(netSalary * 0.9, parts); // abattement 10%
    return Math.round(netSalary - ir);
  }, [compareCDI, grossSalary, familyStatus]);

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto space-y-6 pb-24">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <Button variant="ghost" size="sm" onClick={() => navigate('/simulateurs')} className="mb-2 -ml-2">
            <ArrowLeft className="h-4 w-4" /> Retour
          </Button>
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-xl bg-secondary/10 text-secondary flex items-center justify-center">
              <Briefcase className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Passage freelance</h1>
              <p className="text-sm text-muted-foreground">Compare CDI, micro, EURL et SASU</p>
            </div>
          </div>
        </motion.div>

        <Card>
          <CardContent className="p-5 space-y-5">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Chiffre d'affaires annuel prévisionnel</Label>
                <span className="font-semibold text-foreground">{formatCurrency(annualRevenue)}</span>
              </div>
              <Slider value={[annualRevenue]} onValueChange={(v) => setAnnualRevenue(v[0])} min={10000} max={250000} step={1000} />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Charges professionnelles annuelles</Label>
                <span className="font-semibold text-foreground">{formatCurrency(businessExpenses)}</span>
              </div>
              <Slider value={[businessExpenses]} onValueChange={(v) => setBusinessExpenses(v[0])} min={0} max={80000} step={500} />
            </div>

            <div className="space-y-2">
              <Label>Type d'activité</Label>
              <RadioGroup value={activityType} onValueChange={(v) => setActivityType(v as ActivityType)} className="grid grid-cols-3 gap-2">
                <Label className="flex items-center gap-2 rounded-lg border border-border p-3 cursor-pointer hover:border-primary/40 has-[:checked]:border-primary has-[:checked]:bg-primary/5">
                  <RadioGroupItem value="services" /> <span className="text-sm">Services BIC</span>
                </Label>
                <Label className="flex items-center gap-2 rounded-lg border border-border p-3 cursor-pointer hover:border-primary/40 has-[:checked]:border-primary has-[:checked]:bg-primary/5">
                  <RadioGroupItem value="vente" /> <span className="text-sm">Vente</span>
                </Label>
                <Label className="flex items-center gap-2 rounded-lg border border-border p-3 cursor-pointer hover:border-primary/40 has-[:checked]:border-primary has-[:checked]:bg-primary/5">
                  <RadioGroupItem value="liberal" /> <span className="text-sm">Libéral BNC</span>
                </Label>
              </RadioGroup>
            </div>

            <div className="space-y-2">
              <Label>Situation familiale</Label>
              <RadioGroup value={familyStatus} onValueChange={(v) => setFamilyStatus(v as typeof familyStatus)} className="grid grid-cols-3 gap-2">
                <Label className="flex items-center gap-2 rounded-lg border border-border p-3 cursor-pointer hover:border-primary/40 has-[:checked]:border-primary has-[:checked]:bg-primary/5">
                  <RadioGroupItem value="single" /> <span className="text-sm">Célibataire</span>
                </Label>
                <Label className="flex items-center gap-2 rounded-lg border border-border p-3 cursor-pointer hover:border-primary/40 has-[:checked]:border-primary has-[:checked]:bg-primary/5">
                  <RadioGroupItem value="pacs" /> <span className="text-sm">Pacsé(e)</span>
                </Label>
                <Label className="flex items-center gap-2 rounded-lg border border-border p-3 cursor-pointer hover:border-primary/40 has-[:checked]:border-primary has-[:checked]:bg-primary/5">
                  <RadioGroupItem value="married" /> <span className="text-sm">Marié(e)</span>
                </Label>
              </RadioGroup>
            </div>

            <div className="flex items-center justify-between border-t border-border pt-4">
              <div>
                <Label>Comparer avec mon CDI actuel</Label>
                <p className="text-xs text-muted-foreground mt-1">Ajoute ton salaire brut pour comparaison</p>
              </div>
              <Switch checked={compareCDI} onCheckedChange={setCompareCDI} />
            </div>

            {compareCDI && (
              <div>
                <Label className="text-xs">Salaire brut annuel CDI (€)</Label>
                <Input
                  type="number"
                  value={grossSalary || ''}
                  onChange={(e) => setGrossSalary(Number(e.target.value) || 0)}
                  className="mt-1"
                />
              </div>
            )}
          </CardContent>
        </Card>

        {compareCDI && cdiNet !== null && (
          <Card className="border-info/40 bg-info/5">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Ton CDI actuel — net après impôt</p>
                <p className="text-2xl font-bold text-foreground">{formatCurrency(cdiNet)}/an</p>
              </div>
              <Badge variant="outline">Référence</Badge>
            </CardContent>
          </Card>
        )}

        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-foreground">Résultats par statut</h2>
          {statuses.map((status, idx) => {
            const isOpen = expanded === status.id;
            const isBest = idx === 0 && status.eligible;
            return (
              <Card key={status.id} className={isBest ? 'border-success/40' : ''}>
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-foreground">{status.name}</h3>
                        {isBest && (
                          <Badge className="bg-success/10 text-success border-success/30 hover:bg-success/10">
                            <Trophy className="h-3 w-3 mr-1" /> Recommandé
                          </Badge>
                        )}
                        {!status.eligible && <Badge variant="outline" className="text-warning">Non éligible</Badge>}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{status.recommendation}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs text-muted-foreground">Net après impôts</p>
                      <p className="text-xl font-bold text-foreground">{formatCurrency(status.netAfterTax)}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div className="rounded-md bg-muted/40 p-2">
                      <p className="text-muted-foreground">Cotisations</p>
                      <p className="font-semibold text-foreground">{formatCurrency(status.charges)}</p>
                    </div>
                    <div className="rounded-md bg-muted/40 p-2">
                      <p className="text-muted-foreground">Impôt</p>
                      <p className="font-semibold text-foreground">{formatCurrency(status.ir + status.is)}</p>
                    </div>
                    <div className="rounded-md bg-muted/40 p-2">
                      <p className="text-muted-foreground">Score Élio</p>
                      <p className="font-semibold text-foreground">{status.elioScore}/100</p>
                    </div>
                  </div>

                  <Button variant="ghost" size="sm" onClick={() => setExpanded(isOpen ? null : status.id)} className="w-full">
                    {isOpen ? 'Masquer le détail' : 'Voir le détail'}
                  </Button>

                  {isOpen && (
                    <div className="space-y-3 border-t border-border pt-3">
                      <div>
                        <p className="text-xs font-semibold text-success mb-1.5">Avantages</p>
                        <ul className="space-y-1">
                          {status.pros.map((p, i) => (
                            <li key={i} className="flex gap-2 text-xs text-foreground">
                              <Check className="h-3.5 w-3.5 text-success shrink-0 mt-0.5" /> {p}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-destructive mb-1.5">Inconvénients</p>
                        <ul className="space-y-1">
                          {status.cons.map((c, i) => (
                            <li key={i} className="flex gap-2 text-xs text-foreground">
                              <X className="h-3.5 w-3.5 text-destructive shrink-0 mt-0.5" /> {c}
                            </li>
                          ))}
                        </ul>
                      </div>
                      {status.warnings.length > 0 && (
                        <div className="rounded-lg bg-warning/10 p-2.5">
                          {status.warnings.map((w, i) => (
                            <p key={i} className="text-xs text-foreground flex gap-2">
                              <AlertTriangle className="h-3.5 w-3.5 text-warning shrink-0 mt-0.5" /> {w}
                            </p>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Card className="border-warning/30 bg-warning/5">
          <CardContent className="p-4 flex gap-3">
            <AlertTriangle className="h-5 w-5 text-warning shrink-0" />
            <div className="text-xs text-foreground space-y-1">
              <p className="font-semibold">Coûts cachés à anticiper</p>
              <p>• Comptable : 1 200 à 2 500 €/an pour EURL/SASU</p>
              <p>• CFE : 200 à 800 €/an selon ta commune</p>
              <p>• RC pro : 150 à 500 €/an</p>
              <p>• Perte de tes droits ARE si rupture conventionnelle non négociée</p>
              <p>• Protection sociale dégradée : indemnités journalières plus faibles, retraite à compléter</p>
            </div>
          </CardContent>
        </Card>

        <p className="text-xs text-muted-foreground text-center px-4">
          Élio fournit des estimations à titre indicatif basées sur les barèmes 2025. Pour toute décision, consulte un
          expert-comptable ou un professionnel habilité.
        </p>
      </div>
    </AppLayout>
  );
};

export default FreelanceSimulator;
