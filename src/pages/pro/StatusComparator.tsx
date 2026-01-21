import { useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Scale, Euro, TrendingUp, CheckCircle2, XCircle, Star, Building2, Briefcase, Rocket, 
  Users, Car, Home, Lightbulb, Shield, Calculator
} from 'lucide-react';
import { formatCurrency } from '@/lib/dashboardService';

interface StatusAnalysis {
  name: string;
  icon: typeof Building2;
  charges: number;
  ir: number;
  netAfterTax: number;
  chargesRate: number;
  pros: string[];
  cons: string[];
  capitalumScore: number;
}

const StatusComparator = () => {
  // Detailed form state
  const [formData, setFormData] = useState({
    annualRevenue: 50000,
    businessExpenses: 10000,
    activityType: 'services' as 'services' | 'vente' | 'liberal',
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
    familyStatus: 'single' as 'single' | 'married' | 'pacs',
    otherHouseholdIncome: 0,
  });

  const MICRO_THRESHOLD = formData.activityType === 'vente' ? 188700 : 77700;
  const isMicroEligible = formData.annualRevenue <= MICRO_THRESHOLD;

  const totalExpenses = formData.businessExpenses + 
    (formData.hasOffice ? formData.officeRent : 0) + 
    (formData.hasVehicle ? formData.vehicleExpenses : 0) +
    (formData.hasEmployees ? formData.employeeCount * 35000 : 0);

  const calculateMicroBNC = (): StatusAnalysis => {
    const abattement = formData.activityType === 'vente' ? 0.71 : formData.activityType === 'liberal' ? 0.34 : 0.50;
    const rate = formData.activityType === 'vente' ? 0.128 : 0.22;
    const taxableIncome = formData.annualRevenue * (1 - abattement);
    const charges = formData.annualRevenue * rate;
    let ir = 0;
    if (taxableIncome > 11294) ir += (Math.min(taxableIncome, 28797) - 11294) * 0.11;
    if (taxableIncome > 28797) ir += (Math.min(taxableIncome, 82341) - 28797) * 0.30;
    if (taxableIncome > 82341) ir += (taxableIncome - 82341) * 0.41;
    let score = 70;
    if (totalExpenses < formData.annualRevenue * abattement) score += 15;
    if (!formData.hasEmployees) score += 10;
    if (formData.wantsUnemployment) score -= 30;
    return {
      name: 'Micro-entreprise', icon: Rocket, charges, ir,
      netAfterTax: formData.annualRevenue - charges - ir,
      chargesRate: rate * 100,
      pros: ['Comptabilité simplifiée', 'Franchise TVA possible', 'Déclarations faciles'],
      cons: formData.hasEmployees ? ['Pas adapté avec salariés'] : ['Pas de déduction de charges', 'Plafond de CA'],
      capitalumScore: Math.max(0, Math.min(100, score))
    };
  };

  const calculateEURL = (): StatusAnalysis => {
    const profit = formData.annualRevenue - totalExpenses;
    const charges = Math.max(0, profit) * 0.45;
    const taxableIncome = Math.max(0, profit - charges);
    let ir = 0;
    if (taxableIncome > 11294) ir += (Math.min(taxableIncome, 28797) - 11294) * 0.11;
    if (taxableIncome > 28797) ir += (Math.min(taxableIncome, 82341) - 28797) * 0.30;
    if (taxableIncome > 82341) ir += (taxableIncome - 82341) * 0.41;
    let score = 60;
    if (totalExpenses > formData.annualRevenue * 0.35) score += 20;
    if (formData.hasEmployees) score += 10;
    return {
      name: 'EURL (IR)', icon: Building2, charges, ir,
      netAfterTax: formData.annualRevenue - totalExpenses - charges - ir,
      chargesRate: profit > 0 ? (charges / profit) * 100 : 0,
      pros: ['Déduction charges réelles', 'Pas de plafond CA', 'Crédibilité'],
      cons: ['Cotisations élevées (~45%)', 'Comptabilité obligatoire'],
      capitalumScore: Math.max(0, Math.min(100, score))
    };
  };

  const calculateSASU = (): StatusAnalysis => {
    const profit = formData.annualRevenue - totalExpenses;
    const salary = profit * 0.6;
    const dividends = profit * 0.4 * 0.75;
    const salaryCosts = salary * 0.55;
    const is = profit * 0.4 * 0.25;
    const dividendTax = dividends * 0.30;
    let score = 50;
    if (formData.wantsUnemployment) score += 25;
    if (formData.wantsDividends) score += 15;
    if (formData.annualRevenue > 100000) score += 10;
    return {
      name: 'SASU', icon: Briefcase, charges: salary - salaryCosts + is, ir: dividendTax,
      netAfterTax: salaryCosts + dividends - dividendTax,
      chargesRate: profit > 0 ? ((salary - salaryCosts + is) / profit) * 100 : 0,
      pros: ['Assimilé salarié', 'Dividendes optimisés', formData.wantsUnemployment ? 'Chômage possible' : 'Image professionnelle'],
      cons: ['Charges très élevées', 'Gestion complexe'],
      capitalumScore: Math.max(0, Math.min(100, score))
    };
  };

  const calculatePortage = (): StatusAnalysis => {
    const frais = formData.annualRevenue * 0.10;
    const available = formData.annualRevenue - frais;
    const charges = available * 0.50;
    const net = available - charges;
    const ir = net * 0.15;
    let score = 40;
    if (formData.wantsUnemployment) score += 30;
    if (formData.yearsInBusiness < 2) score += 15;
    return {
      name: 'Portage salarial', icon: Users, charges: frais + charges, ir,
      netAfterTax: net - ir, chargesRate: ((frais + charges) / formData.annualRevenue) * 100,
      pros: ['Zéro gestion', 'Chômage garanti', 'CDI possible'],
      cons: ['10% frais gestion', 'Net le plus faible'],
      capitalumScore: Math.max(0, Math.min(100, score))
    };
  };

  const statuses = [calculateMicroBNC(), calculateEURL(), calculateSASU(), calculatePortage()]
    .filter(s => !(s.name === 'Micro-entreprise' && !isMicroEligible))
    .sort((a, b) => b.capitalumScore - a.capitalumScore);

  const bestStatus = statuses[0];

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold">Comparateur de statuts</h1>
          <p className="text-muted-foreground mt-1">Analyse personnalisée selon votre situation</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Form */}
          <Card className="glass-card lg:col-span-1">
            <CardHeader><CardTitle className="flex items-center gap-2"><Calculator className="h-5 w-5" />Votre situation</CardTitle></CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <Label>CA annuel prévu</Label>
                <Input type="number" value={formData.annualRevenue} onChange={(e) => setFormData(p => ({...p, annualRevenue: Number(e.target.value)}))} />
                <Slider value={[formData.annualRevenue]} onValueChange={(v) => setFormData(p => ({...p, annualRevenue: v[0]}))} min={20000} max={200000} step={5000} />
              </div>
              <div className="space-y-2">
                <Label>Type d'activité</Label>
                <Select value={formData.activityType} onValueChange={(v: any) => setFormData(p => ({...p, activityType: v}))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="services">Prestations de services</SelectItem>
                    <SelectItem value="liberal">Profession libérale</SelectItem>
                    <SelectItem value="vente">Vente de marchandises</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Charges professionnelles</Label>
                <Input type="number" value={formData.businessExpenses} onChange={(e) => setFormData(p => ({...p, businessExpenses: Number(e.target.value)}))} />
              </div>
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2"><Home className="h-4 w-4" />Local professionnel</Label>
                <Switch checked={formData.hasOffice} onCheckedChange={(c) => setFormData(p => ({...p, hasOffice: c}))} />
              </div>
              {formData.hasOffice && <Input type="number" placeholder="Loyer annuel" value={formData.officeRent || ''} onChange={(e) => setFormData(p => ({...p, officeRent: Number(e.target.value)}))} />}
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2"><Car className="h-4 w-4" />Véhicule pro</Label>
                <Switch checked={formData.hasVehicle} onCheckedChange={(c) => setFormData(p => ({...p, hasVehicle: c}))} />
              </div>
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2"><Users className="h-4 w-4" />Salariés</Label>
                <Switch checked={formData.hasEmployees} onCheckedChange={(c) => setFormData(p => ({...p, hasEmployees: c}))} />
              </div>
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2"><Shield className="h-4 w-4" />Droits chômage</Label>
                <Switch checked={formData.wantsUnemployment} onCheckedChange={(c) => setFormData(p => ({...p, wantsUnemployment: c}))} />
              </div>
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2"><Euro className="h-4 w-4" />Optimiser dividendes</Label>
                <Switch checked={formData.wantsDividends} onCheckedChange={(c) => setFormData(p => ({...p, wantsDividends: c}))} />
              </div>
              {!isMicroEligible && <div className="p-3 rounded-lg bg-warning/10 border border-warning/20 text-sm text-warning">⚠️ CA supérieur au seuil micro ({formatCurrency(MICRO_THRESHOLD)})</div>}
            </CardContent>
          </Card>

          {/* Results */}
          <div className="lg:col-span-2 space-y-4">
            {statuses.map((status, index) => (
              <Card key={status.name} className={`glass-card ${index === 0 ? 'border-success/50 ring-2 ring-success/20' : ''}`}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${index === 0 ? 'bg-success/10' : 'bg-primary/10'}`}>
                        <status.icon className={`h-6 w-6 ${index === 0 ? 'text-success' : 'text-primary'}`} />
                      </div>
                      <div>
                        <h3 className="font-bold text-lg">{status.name}</h3>
                        {index === 0 && <Badge className="bg-success/20 text-success border-success/30"><Star className="h-3 w-3 mr-1" />Recommandé Capitalum</Badge>}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Score</p>
                      <p className={`text-2xl font-bold ${index === 0 ? 'text-success' : ''}`}>{status.capitalumScore}/100</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4 mt-4">
                    <div className="p-3 rounded-xl bg-success/10"><p className="text-xs text-muted-foreground">Net après impôts</p><p className="font-bold text-success">{formatCurrency(status.netAfterTax)}</p></div>
                    <div className="p-3 rounded-xl bg-destructive/10"><p className="text-xs text-muted-foreground">Cotisations</p><p className="font-bold text-destructive">-{formatCurrency(status.charges)}</p></div>
                    <div className="p-3 rounded-xl bg-warning/10"><p className="text-xs text-muted-foreground">IR estimé</p><p className="font-bold text-warning">-{formatCurrency(status.ir)}</p></div>
                  </div>
                  <div className="flex gap-4 mt-4 text-sm">
                    <div className="flex-1">{status.pros.map((p,i) => <div key={i} className="flex items-center gap-1 text-success"><CheckCircle2 className="h-3 w-3" />{p}</div>)}</div>
                    <div className="flex-1">{status.cons.map((c,i) => <div key={i} className="flex items-center gap-1 text-destructive"><XCircle className="h-3 w-3" />{c}</div>)}</div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default StatusComparator;
