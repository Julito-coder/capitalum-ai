import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Users, Euro, FileDown, AlertTriangle } from "lucide-react";
import { formatCurrency } from "@/data/mockData";

export interface HouseholdMember {
  id: string;
  firstName: string;
  relation: string;
  professionalStatus: string;
  netMonthlySalary: number;
  contractType: string;
  existingCredits: number;
}

export interface HouseholdConfig {
  members: HouseholdMember[];
  totalIncome: number;
  totalExistingCredits: number;
}

export interface StressTestConfig {
  rateIncrease: number;
  chargesIncrease: number;
  incomeDecrease: number;
}

interface HouseholdConfigModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onExport: (household: HouseholdConfig, stressTests: StressTestConfig) => void;
  primaryMember: {
    fullName: string;
    professionalStatus?: string;
    contractType?: string;
    netMonthlySalary?: number;
  };
  monthlyPayment: number;
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

export function HouseholdConfigModal({
  open,
  onOpenChange,
  onExport,
  primaryMember,
  monthlyPayment,
}: HouseholdConfigModalProps) {
  const [members, setMembers] = useState<HouseholdMember[]>([]);
  const [stressTests, setStressTests] = useState<StressTestConfig>({
    rateIncrease: 1,
    chargesIncrease: 15,
    incomeDecrease: 10,
  });

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
    setMembers([...members, newMember]);
  };

  const updateMember = (id: string, field: keyof HouseholdMember, value: string | number) => {
    setMembers(members.map(m => 
      m.id === id ? { ...m, [field]: value } : m
    ));
  };

  const removeMember = (id: string) => {
    setMembers(members.filter(m => m.id !== id));
  };

  // Calculate totals
  const primaryIncome = primaryMember.netMonthlySalary || 0;
  const membersIncome = members.reduce((sum, m) => sum + m.netMonthlySalary, 0);
  const totalIncome = primaryIncome + membersIncome;
  const totalExistingCredits = members.reduce((sum, m) => sum + m.existingCredits, 0);
  const totalCreditsAfterProject = totalExistingCredits + monthlyPayment;
  const debtRatio = totalIncome > 0 ? (totalCreditsAfterProject / totalIncome) * 100 : 0;
  const resteAVivre = totalIncome - totalCreditsAfterProject;

  const handleExport = () => {
    const householdConfig: HouseholdConfig = {
      members: [
        {
          id: "primary",
          firstName: primaryMember.fullName?.split(' ')[0] || "Titulaire",
          relation: "titulaire",
          professionalStatus: primaryMember.professionalStatus || "employee",
          netMonthlySalary: primaryMember.netMonthlySalary || 0,
          contractType: primaryMember.contractType || "cdi",
          existingCredits: 0,
        },
        ...members,
      ],
      totalIncome,
      totalExistingCredits,
    };
    onExport(householdConfig, stressTests);
  };

  const getDebtRatioBadge = () => {
    if (debtRatio <= 33) {
      return <Badge className="bg-success text-success-foreground">Taux acceptable</Badge>;
    } else if (debtRatio <= 40) {
      return <Badge className="bg-warning text-warning-foreground">Vigilance</Badge>;
    } else {
      return <Badge className="bg-destructive text-destructive-foreground">Tension</Badge>;
    }
  };

  const getProfessionalStatusLabel = (value: string) => 
    professionalStatusOptions.find(o => o.value === value)?.label || value;

  const getContractTypeLabel = (value: string) => 
    contractTypeOptions.find(o => o.value === value)?.label || value;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Configuration du ménage
          </DialogTitle>
          <DialogDescription>
            Personnalisez la composition du ménage pour l'analyse de solvabilité bancaire
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Titulaire principal */}
          <Card className="border-primary/30">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Badge variant="outline">Titulaire</Badge>
                {primaryMember.fullName}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <Label className="text-muted-foreground">Statut</Label>
                  <p className="font-medium">{getProfessionalStatusLabel(primaryMember.professionalStatus || "")}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Contrat</Label>
                  <p className="font-medium">{getContractTypeLabel(primaryMember.contractType || "")}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Revenus nets</Label>
                  <p className="font-medium text-success">{formatCurrency(primaryMember.netMonthlySalary || 0)}/mois</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Membres supplémentaires */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium">Membres supplémentaires</h4>
              <Button variant="outline" size="sm" onClick={addMember}>
                <Plus className="h-4 w-4 mr-1" />
                Ajouter un membre
              </Button>
            </div>

            {members.length === 0 && (
              <div className="text-center py-6 border border-dashed rounded-lg text-muted-foreground">
                <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Aucun membre supplémentaire</p>
                <p className="text-xs">Ajoutez un conjoint ou partenaire pour l'analyse complète</p>
              </div>
            )}

            {members.map((member, index) => (
              <Card key={member.id} className="relative">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="absolute top-2 right-2 h-8 w-8 text-destructive"
                  onClick={() => removeMember(member.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Membre {index + 2}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor={`firstName-${member.id}`}>Prénom</Label>
                      <Input
                        id={`firstName-${member.id}`}
                        value={member.firstName}
                        onChange={(e) => updateMember(member.id, "firstName", e.target.value)}
                        placeholder="Prénom"
                      />
                    </div>
                    <div>
                      <Label htmlFor={`relation-${member.id}`}>Relation</Label>
                      <Select
                        value={member.relation}
                        onValueChange={(v) => updateMember(member.id, "relation", v)}
                      >
                        <SelectTrigger id={`relation-${member.id}`}>
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
                      <Label htmlFor={`status-${member.id}`}>Statut professionnel</Label>
                      <Select
                        value={member.professionalStatus}
                        onValueChange={(v) => updateMember(member.id, "professionalStatus", v)}
                      >
                        <SelectTrigger id={`status-${member.id}`}>
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
                      <Label htmlFor={`contract-${member.id}`}>Type de contrat</Label>
                      <Select
                        value={member.contractType}
                        onValueChange={(v) => updateMember(member.id, "contractType", v)}
                      >
                        <SelectTrigger id={`contract-${member.id}`}>
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
                      <Label htmlFor={`salary-${member.id}`}>Revenus nets mensuels</Label>
                      <div className="relative">
                        <Euro className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id={`salary-${member.id}`}
                          type="number"
                          value={member.netMonthlySalary || ""}
                          onChange={(e) => updateMember(member.id, "netMonthlySalary", parseFloat(e.target.value) || 0)}
                          className="pl-9"
                          placeholder="0"
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor={`credits-${member.id}`}>Crédits existants (mensuel)</Label>
                      <div className="relative">
                        <Euro className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id={`credits-${member.id}`}
                          type="number"
                          value={member.existingCredits || ""}
                          onChange={(e) => updateMember(member.id, "existingCredits", parseFloat(e.target.value) || 0)}
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

          {/* Synthèse solvabilité */}
          <Card className="bg-muted/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center justify-between">
                <span>Synthèse solvabilité</span>
                {getDebtRatioBadge()}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div>
                  <p className="text-xs text-muted-foreground">Revenus ménage</p>
                  <p className="text-lg font-bold text-success">{formatCurrency(totalIncome)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Crédits existants</p>
                  <p className="text-lg font-bold text-warning">{formatCurrency(totalExistingCredits)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Taux d'endettement</p>
                  <p className={`text-lg font-bold ${debtRatio <= 33 ? 'text-success' : debtRatio <= 40 ? 'text-warning' : 'text-destructive'}`}>
                    {debtRatio.toFixed(1)}%
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Reste à vivre</p>
                  <p className={`text-lg font-bold ${resteAVivre > 0 ? 'text-success' : 'text-destructive'}`}>
                    {formatCurrency(resteAVivre)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Configuration stress tests */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-warning" />
                Configuration des stress tests
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="rateIncrease">Hausse taux (+pts)</Label>
                  <Input
                    id="rateIncrease"
                    type="number"
                    step="0.5"
                    value={stressTests.rateIncrease}
                    onChange={(e) => setStressTests({ ...stressTests, rateIncrease: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <Label htmlFor="chargesIncrease">Hausse charges (%)</Label>
                  <Input
                    id="chargesIncrease"
                    type="number"
                    value={stressTests.chargesIncrease}
                    onChange={(e) => setStressTests({ ...stressTests, chargesIncrease: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <Label htmlFor="incomeDecrease">Baisse revenus (%)</Label>
                  <Input
                    id="incomeDecrease"
                    type="number"
                    value={stressTests.incomeDecrease}
                    onChange={(e) => setStressTests({ ...stressTests, incomeDecrease: parseFloat(e.target.value) || 0 })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <DialogFooter className="mt-6">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button onClick={handleExport}>
            <FileDown className="h-4 w-4 mr-2" />
            Générer le PDF
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
