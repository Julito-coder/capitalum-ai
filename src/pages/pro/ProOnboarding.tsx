import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  Building2, 
  Save,
  Check,
  ArrowRight,
  ArrowLeft,
  Rocket,
  Euro,
  FileText,
  Calculator,
  Home
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { loadProProfile, saveProProfile, ProProfile } from '@/lib/proService';
import { formatCurrency } from '@/lib/dashboardService';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const FISCAL_STATUS_OPTIONS = [
  { value: 'micro', label: 'Micro-entreprise (BNC)', description: 'Abattement 34%' },
  { value: 'micro_bic_services', label: 'Micro-entreprise (BIC Services)', description: 'Abattement 50%' },
  { value: 'micro_bic_vente', label: 'Micro-entreprise (BIC Vente)', description: 'Abattement 71%' },
  { value: 'eurl_ir', label: 'EURL (IR)', description: 'Impôt sur le revenu' },
  { value: 'eurl_is', label: 'EURL (IS)', description: 'Impôt sur les sociétés' },
  { value: 'sasu', label: 'SASU', description: 'Société par actions' },
  { value: 'ei', label: 'Entreprise Individuelle', description: 'Régime réel' },
];

const ProOnboarding = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [step, setStep] = useState(1);
  const [profile, setProfile] = useState<ProProfile>({
    companyName: '',
    siret: '',
    apeCode: '',
    fiscalStatus: 'micro',
    companyCreationDate: null,
    annualRevenueHt: 0,
    socialChargesPaid: 0,
    officeRent: 0,
    vehicleExpenses: 0,
    professionalSupplies: 0,
    accountingSoftware: null,
    onboardingCompleted: false,
  });

  useEffect(() => {
    const loadData = async () => {
      if (!user) return;
      const data = await loadProProfile(user.id);
      if (data) {
        setProfile(data);
      }
      setLoading(false);
    };
    loadData();
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    
    setSaving(true);
    const result = await saveProProfile(user.id, {
      ...profile,
      onboardingCompleted: true,
    });

    if (result.success) {
      toast({
        title: "Profil enregistré",
        description: "Vos informations ont été sauvegardées avec succès.",
      });
      navigate('/pro/revenue');
    } else {
      toast({
        title: "Erreur",
        description: result.error || "Impossible de sauvegarder le profil.",
        variant: "destructive",
      });
    }
    setSaving(false);
  };

  const updateProfile = (key: keyof ProProfile, value: any) => {
    setProfile(prev => ({ ...prev, [key]: value }));
  };

  const totalCharges = profile.officeRent + profile.vehicleExpenses + profile.professionalSupplies;
  const estimatedURSSAF = profile.annualRevenueHt * 0.22;
  const netEstimate = profile.annualRevenueHt - totalCharges - estimatedURSSAF;

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/')}
              className="h-10 w-10 rounded-xl bg-secondary hover:bg-secondary/80 flex items-center justify-center transition-colors"
            >
              <Home className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-2xl lg:text-3xl font-serif font-bold">Mon activité professionnelle</h1>
              <p className="text-muted-foreground mt-1">
                Configurez ton profil pour des calculs personnalisés
              </p>
            </div>
          </div>
          <Badge className="bg-primary/10 text-primary">
            Étape {step}/3
          </Badge>
        </div>

        {/* Progress */}
        <div className="flex gap-2">
          {[1, 2, 3].map(s => (
            <div 
              key={s}
              className={`h-2 flex-1 rounded-full transition-colors ${s <= step ? 'bg-primary' : 'bg-secondary'}`}
            />
          ))}
        </div>

        {/* Step 1: Identity */}
        {step === 1 && (
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Identité de l'entreprise
              </CardTitle>
              <CardDescription>
                Informations de base sur ton activité
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nom de l'entreprise / Nom commercial</Label>
                  <Input
                    value={profile.companyName}
                    onChange={(e) => updateProfile('companyName', e.target.value)}
                    placeholder="Ma Super Entreprise"
                  />
                </div>
                <div className="space-y-2">
                  <Label>SIRET</Label>
                  <Input
                    value={profile.siret}
                    onChange={(e) => updateProfile('siret', e.target.value)}
                    placeholder="123 456 789 00012"
                    maxLength={17}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Code APE / NAF</Label>
                  <Input
                    value={profile.apeCode}
                    onChange={(e) => updateProfile('apeCode', e.target.value)}
                    placeholder="6201Z"
                    maxLength={5}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Date de création</Label>
                  <Input
                    type="date"
                    value={profile.companyCreationDate || ''}
                    onChange={(e) => updateProfile('companyCreationDate', e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Statut fiscal</Label>
                <Select 
                  value={profile.fiscalStatus} 
                  onValueChange={(v) => updateProfile('fiscalStatus', v)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FISCAL_STATUS_OPTIONS.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>
                        <div className="flex flex-col">
                          <span>{opt.label}</span>
                          <span className="text-xs text-muted-foreground">{opt.description}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Logiciel comptable utilisé (optionnel)</Label>
                <Input
                  value={profile.accountingSoftware || ''}
                  onChange={(e) => updateProfile('accountingSoftware', e.target.value)}
                  placeholder="Ex: Pennylane, Indy, Tiime..."
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Revenue & Charges */}
        {step === 2 && (
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Euro className="h-5 w-5" />
                Chiffre d'affaires et charges
              </CardTitle>
              <CardDescription>
                Estimations pour l'année en cours (vous pourrez affiner mois par mois)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>CA annuel estimé (HT)</Label>
                <div className="relative">
                  <Euro className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="number"
                    value={profile.annualRevenueHt || ''}
                    onChange={(e) => updateProfile('annualRevenueHt', Number(e.target.value))}
                    className="pl-10"
                    placeholder="50000"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Seuil micro-entrepreneur : 77 700 € (services)
                </p>
              </div>

              <div className="space-y-4">
                <Label className="text-base font-semibold">Charges professionnelles annuelles</Label>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm">Loyer bureau / coworking</Label>
                    <div className="relative">
                      <Euro className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="number"
                        value={profile.officeRent || ''}
                        onChange={(e) => updateProfile('officeRent', Number(e.target.value))}
                        className="pl-10"
                        placeholder="0"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-sm">Frais de véhicule</Label>
                    <div className="relative">
                      <Euro className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="number"
                        value={profile.vehicleExpenses || ''}
                        onChange={(e) => updateProfile('vehicleExpenses', Number(e.target.value))}
                        className="pl-10"
                        placeholder="0"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-sm">Fournitures / abonnements</Label>
                    <div className="relative">
                      <Euro className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="number"
                        value={profile.professionalSupplies || ''}
                        onChange={(e) => updateProfile('professionalSupplies', Number(e.target.value))}
                        className="pl-10"
                        placeholder="0"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Cotisations sociales déjà payées cette année</Label>
                <div className="relative">
                  <Euro className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="number"
                    value={profile.socialChargesPaid || ''}
                    onChange={(e) => updateProfile('socialChargesPaid', Number(e.target.value))}
                    className="pl-10"
                    placeholder="0"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Summary */}
        {step === 3 && (
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="h-5 w-5" />
                Récapitulatif
              </CardTitle>
              <CardDescription>
                Vérifiez vos informations avant de valider
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Business Summary */}
              <div className="p-4 rounded-xl bg-secondary/50 space-y-3">
                <h4 className="font-semibold flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Votre entreprise
                </h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <span className="text-muted-foreground">Nom</span>
                  <span className="font-medium">{profile.companyName || 'Non renseigné'}</span>
                  <span className="text-muted-foreground">SIRET</span>
                  <span className="font-medium">{profile.siret || 'Non renseigné'}</span>
                  <span className="text-muted-foreground">Statut</span>
                  <span className="font-medium">
                    {FISCAL_STATUS_OPTIONS.find(o => o.value === profile.fiscalStatus)?.label}
                  </span>
                </div>
              </div>

              {/* Financial Summary */}
              <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 space-y-3">
                <h4 className="font-semibold flex items-center gap-2">
                  <Euro className="h-4 w-4" />
                  Estimation annuelle
                </h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">CA annuel</span>
                    <span className="font-bold text-lg">{formatCurrency(profile.annualRevenueHt)}</span>
                  </div>
                  <div className="flex justify-between text-destructive">
                    <span>Charges professionnelles</span>
                    <span>-{formatCurrency(totalCharges)}</span>
                  </div>
                  <div className="flex justify-between text-destructive">
                    <span>Cotisations URSSAF (≈22%)</span>
                    <span>-{formatCurrency(estimatedURSSAF)}</span>
                  </div>
                  <div className="h-px bg-border my-2" />
                  <div className="flex justify-between text-success text-lg">
                    <span className="font-semibold">Net estimé</span>
                    <span className="font-bold">{formatCurrency(netEstimate)}</span>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-warning/10 border border-warning/20">
                <p className="text-sm text-warning">
                  💡 Ces estimations sont basées sur vos déclarations. Rendez-vous dans "Suivi CA" pour saisir ton CA mensuel réel.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Navigation */}
        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={() => setStep(prev => prev - 1)}
            disabled={step === 1}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Précédent
          </Button>

          {step < 3 ? (
            <Button onClick={() => setStep(prev => prev + 1)}>
              Suivant
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <Button onClick={handleSave} disabled={saving}>
              {saving ? (
                <>
                  <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                  Enregistrement...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Valider mon profil
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default ProOnboarding;
