import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Users, Euro, Loader2, RefreshCw } from "lucide-react";
import { AdvancedWizardState } from "@/lib/advancedSimulatorTypes";
import { formatCurrency } from "@/data/mockData";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export interface HouseholdMember {
  id: string;
  firstName: string;
  relation: string;
  professionalStatus: string;
  netMonthlySalary: number;
  contractType: string;
  existingCredits: number;
}

interface HouseholdStepProps {
  state: AdvancedWizardState;
  updateState: <K extends keyof AdvancedWizardState>(
    section: K,
    updates: Partial<AdvancedWizardState[K]>
  ) => void;
  mode: 'essential' | 'advanced';
  monthlyPayment?: number;
}

const relationOptions = [
  { value: "conjoint", label: "Conjoint(e)" },
  { value: "partenaire", label: "Partenaire pacsé(e)" },
  { value: "concubin", label: "Concubin(e)" },
  { value: "autre", label: "Autre" },
];

const professionalStatusOptions = [
  { value: "employee", label: "Salarié(e)" },
  { value: "self_employed", label: "Indépendant(e)" },
  { value: "executive", label: "Cadre" },
  { value: "civil_servant", label: "Fonctionnaire" },
  { value: "retired", label: "Retraité(e)" },
  { value: "unemployed", label: "Sans emploi" },
  { value: "other", label: "Autre" },
];

const contractTypeOptions = [
  { value: "cdi", label: "CDI" },
  { value: "cdd", label: "CDD" },
  { value: "interim", label: "Intérim" },
  { value: "freelance", label: "Freelance" },
  { value: "civil_servant", label: "Titulaire" },
  { value: "retired", label: "Retraite" },
  { value: "other", label: "Autre" },
];

export function HouseholdStep({ state, updateState, monthlyPayment = 0 }: HouseholdStepProps) {
  const { user } = useAuth();
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileLoaded, setProfileLoaded] = useState(false);

  // Load user profile on mount to pre-fill household data
  useEffect(() => {
    if (user && !profileLoaded && state.ownerOccupier.householdIncomeMonthly === 5000) {
      loadUserProfile();
    }
  }, [user]);

  const loadUserProfile = async () => {
    if (!user) return;
    
    setProfileLoading(true);
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;

      if (profile) {
        // Map profile data to household state
        const netIncome = profile.net_monthly_salary || 0;
        const existingCredits = profile.mortgage_remaining ? Math.round(profile.mortgage_remaining / 240) : 0; // Estimate monthly if mortgage exists
        
        // Map professional status
        let professionalStatus = 'employee';
        if (profile.is_self_employed) professionalStatus = 'self_employed';
        else if (profile.is_retired) professionalStatus = 'retired';
        
        updateState('ownerOccupier', {
          householdIncomeMonthly: netIncome > 0 ? netIncome : state.ownerOccupier.householdIncomeMonthly,
          existingCreditsMonthly: existingCredits,
        });

        // If spouse income exists, add as household member
        if (profile.spouse_income && profile.spouse_income > 0) {
          const spouseMember: HouseholdMember = {
            id: crypto.randomUUID(),
            firstName: 'Conjoint(e)',
            relation: 'conjoint',
            professionalStatus: 'employee',
            netMonthlySalary: profile.spouse_income,
            contractType: 'cdi',
            existingCredits: 0,
          };
          
          // Only add if not already present
          const existingMembers = state.ownerOccupier.householdMembers || [];
          const hasSpouse = existingMembers.some(m => m.relation === 'conjoint');
          if (!hasSpouse) {
            updateState('ownerOccupier', {
              householdMembers: [...existingMembers, spouseMember],
            });
          }
        }

        setProfileLoaded(true);
        toast.success("Profil financier chargé");
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setProfileLoading(false);
    }
  };
  // Utiliser directement le state pour garantir les valeurs à jour
  const householdMembers = state.ownerOccupier.householdMembers || [];

  const addMember = () => {
    const newMember: HouseholdMember = {
      id: crypto.randomUUID(),
      firstName: "",
      relation: "conjoint",
      professionalStatus: "employee",
      netMonthlySalary: 0,
      contractType: "cdi",
      existingCredits: 0,
    };
    const currentMembers = state.ownerOccupier.householdMembers || [];
    updateState("ownerOccupier", {
      householdMembers: [...currentMembers, newMember],
    });
  };

  const updateMember = (id: string, field: keyof HouseholdMember, value: string | number) => {
    const currentMembers = state.ownerOccupier.householdMembers || [];
    const updated = currentMembers.map((m) =>
      m.id === id ? { ...m, [field]: value } : m
    );
    updateState("ownerOccupier", { householdMembers: updated });
  };

  const removeMember = (id: string) => {
    const currentMembers = state.ownerOccupier.householdMembers || [];
    updateState("ownerOccupier", {
      householdMembers: currentMembers.filter((m) => m.id !== id),
    });
  };

  // Calculs de solvabilité - toujours utiliser les valeurs fraîches du state
  const primaryIncome = state.ownerOccupier.householdIncomeMonthly || 0;
  const membersIncome = householdMembers.reduce((sum, m) => sum + (Number(m.netMonthlySalary) || 0), 0);
  const totalIncome = primaryIncome + membersIncome;
  const existingCredits = state.ownerOccupier.existingCreditsMonthly || 0;
  const membersCredits = householdMembers.reduce((sum, m) => sum + (Number(m.existingCredits) || 0), 0);
  const totalExistingCredits = existingCredits + membersCredits;
  const totalCreditsAfterProject = totalExistingCredits + monthlyPayment;
  const debtRatio = totalIncome > 0 ? (totalCreditsAfterProject / totalIncome) * 100 : 0;
  const resteAVivre = totalIncome - totalCreditsAfterProject - (state.ownerOccupier.otherChargesMonthly || 0);

  const getDebtRatioBadge = () => {
    if (debtRatio <= 33) {
      return <Badge className="bg-success text-success-foreground">Taux acceptable</Badge>;
    } else if (debtRatio <= 40) {
      return <Badge className="bg-warning text-warning-foreground">Vigilance</Badge>;
    }
    return <Badge className="bg-destructive text-destructive-foreground">Tension</Badge>;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                Titulaire principal
              </CardTitle>
              <CardDescription>Revenus et charges du titulaire du projet</CardDescription>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={loadUserProfile}
              disabled={profileLoading}
            >
              {profileLoading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-1" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-1" />
              )}
              Charger mon profil
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>Revenus nets mensuels</Label>
              <div className="relative">
                <Euro className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="number"
                  value={state.ownerOccupier.householdIncomeMonthly || ""}
                  onChange={(e) =>
                    updateState("ownerOccupier", {
                      householdIncomeMonthly: parseFloat(e.target.value) || 0,
                    })
                  }
                  className="pl-9"
                  placeholder="3000"
                />
              </div>
            </div>
            <div>
              <Label>Crédits existants (mensuel)</Label>
              <div className="relative">
                <Euro className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="number"
                  value={state.ownerOccupier.existingCreditsMonthly || ""}
                  onChange={(e) =>
                    updateState("ownerOccupier", {
                      existingCreditsMonthly: parseFloat(e.target.value) || 0,
                    })
                  }
                  className="pl-9"
                  placeholder="0"
                />
              </div>
            </div>
            <div>
              <Label>Autres charges fixes (mensuel)</Label>
              <div className="relative">
                <Euro className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="number"
                  value={state.ownerOccupier.otherChargesMonthly || ""}
                  onChange={(e) =>
                    updateState("ownerOccupier", {
                      otherChargesMonthly: parseFloat(e.target.value) || 0,
                    })
                  }
                  className="pl-9"
                  placeholder="500"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Membres supplémentaires */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">Membres supplémentaires du ménage</CardTitle>
              <CardDescription>Ajoutez les co-emprunteurs pour l'analyse de solvabilité</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={addMember}>
              <Plus className="h-4 w-4 mr-1" />
              Ajouter
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {householdMembers.length === 0 ? (
            <div className="text-center py-8 border border-dashed rounded-lg text-muted-foreground">
              <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Aucun membre supplémentaire</p>
              <p className="text-xs">Ajoutez un conjoint ou partenaire pour l'analyse complète</p>
            </div>
          ) : (
            <div className="space-y-4">
              {householdMembers.map((member, index) => (
                <Card key={member.id} className="relative border-muted">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-2 h-8 w-8 text-destructive"
                    onClick={() => removeMember(member.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Membre {index + 2}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      <div>
                        <Label>Prénom</Label>
                        <Input
                          value={member.firstName}
                          onChange={(e) => updateMember(member.id, "firstName", e.target.value)}
                          placeholder="Prénom"
                        />
                      </div>
                      <div>
                        <Label>Relation</Label>
                        <Select
                          value={member.relation}
                          onValueChange={(v) => updateMember(member.id, "relation", v)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {relationOptions.map((opt) => (
                              <SelectItem key={opt.value} value={opt.value}>
                                {opt.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Statut professionnel</Label>
                        <Select
                          value={member.professionalStatus}
                          onValueChange={(v) => updateMember(member.id, "professionalStatus", v)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {professionalStatusOptions.map((opt) => (
                              <SelectItem key={opt.value} value={opt.value}>
                                {opt.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Type de contrat</Label>
                        <Select
                          value={member.contractType}
                          onValueChange={(v) => updateMember(member.id, "contractType", v)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {contractTypeOptions.map((opt) => (
                              <SelectItem key={opt.value} value={opt.value}>
                                {opt.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Revenus nets mensuels</Label>
                        <div className="relative">
                          <Euro className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            type="number"
                            value={member.netMonthlySalary || ""}
                            onChange={(e) =>
                              updateMember(member.id, "netMonthlySalary", parseFloat(e.target.value) || 0)
                            }
                            className="pl-9"
                            placeholder="0"
                          />
                        </div>
                      </div>
                      <div>
                        <Label>Crédits existants (mensuel)</Label>
                        <div className="relative">
                          <Euro className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            type="number"
                            value={member.existingCredits || ""}
                            onChange={(e) =>
                              updateMember(member.id, "existingCredits", parseFloat(e.target.value) || 0)
                            }
                            className="pl-9"
                            placeholder="0"
                          />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Synthèse solvabilité */}
      <Card className="bg-muted/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center justify-between">
            <span>Synthèse solvabilité du ménage</span>
            {getDebtRatioBadge()}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div className="p-3 bg-background rounded-lg">
              <p className="text-xs text-muted-foreground">Revenus ménage</p>
              <p className="text-lg font-bold text-success">{formatCurrency(totalIncome)}</p>
            </div>
            <div className="p-3 bg-background rounded-lg">
              <p className="text-xs text-muted-foreground">Crédits existants</p>
              <p className="text-lg font-bold text-warning">{formatCurrency(totalExistingCredits)}</p>
            </div>
            <div className="p-3 bg-background rounded-lg">
              <p className="text-xs text-muted-foreground">Taux d'endettement</p>
              <p className={`text-lg font-bold ${debtRatio <= 33 ? 'text-success' : debtRatio <= 40 ? 'text-warning' : 'text-destructive'}`}>
                {debtRatio.toFixed(1)}%
              </p>
            </div>
            <div className="p-3 bg-background rounded-lg">
              <p className="text-xs text-muted-foreground">Reste à vivre</p>
              <p className={`text-lg font-bold ${resteAVivre > 0 ? 'text-success' : 'text-destructive'}`}>
                {formatCurrency(resteAVivre)}
              </p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-4 text-center">
            Ces indicateurs sont fournis à titre d'aide à la décision. Aucun seuil réglementaire n'est appliqué.
          </p>
        </CardContent>
      </Card>

      {/* Liquidité résiduelle */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Sécurité financière</CardTitle>
          <CardDescription>Épargne de précaution après projet</CardDescription>
        </CardHeader>
        <CardContent>
          <div>
            <Label>Liquidité résiduelle après apport (€)</Label>
            <div className="relative">
              <Euro className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="number"
                value={state.ownerOccupier.remainingLiquidity || ""}
                onChange={(e) =>
                  updateState("ownerOccupier", {
                    remainingLiquidity: parseFloat(e.target.value) || 0,
                  })
                }
                className="pl-9"
                placeholder="10000"
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Épargne disponible après le versement de l'apport personnel
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default HouseholdStep;
