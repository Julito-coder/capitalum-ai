import { OnboardingData, ContractType } from '@/data/onboardingTypes';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Briefcase, Euro, Gift } from 'lucide-react';

interface Props {
  data: OnboardingData;
  updateData: <K extends keyof OnboardingData>(field: K, value: OnboardingData[K]) => void;
}

export const EmployeeStep = ({ data, updateData }: Props) => {
  return (
    <div className="space-y-6">
      {/* Employer info */}
      <div className="p-4 rounded-lg bg-muted/30 border border-border">
        <div className="flex items-center gap-2 mb-4">
          <Briefcase className="h-5 w-5 text-primary" />
          <h3 className="font-medium">Employeur</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="employerName">Nom de l'entreprise</Label>
            <Input
              id="employerName"
              placeholder="ACME Corp"
              value={data.employerName}
              onChange={(e) => updateData('employerName', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="employerSiret">SIRET employeur</Label>
            <Input
              id="employerSiret"
              placeholder="123 456 789 00012"
              value={data.employerSiret}
              onChange={(e) => updateData('employerSiret', e.target.value)}
            />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <div className="space-y-2">
            <Label>Type de contrat</Label>
            <Select 
              value={data.contractType} 
              onValueChange={(v) => updateData('contractType', v as ContractType)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cdi">CDI</SelectItem>
                <SelectItem value="cdd">CDD</SelectItem>
                <SelectItem value="interim">Intérim</SelectItem>
                <SelectItem value="freelance">Freelance</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="contractStartDate">Date de début</Label>
            <Input
              id="contractStartDate"
              type="date"
              value={data.contractStartDate}
              onChange={(e) => updateData('contractStartDate', e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Salary */}
      <div className="p-4 rounded-lg bg-muted/30 border border-border">
        <div className="flex items-center gap-2 mb-4">
          <Euro className="h-5 w-5 text-primary" />
          <h3 className="font-medium">Rémunération</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="grossMonthlySalary">Salaire brut mensuel (€)</Label>
            <Input
              id="grossMonthlySalary"
              type="number"
              min={0}
              value={data.grossMonthlySalary}
              onChange={(e) => updateData('grossMonthlySalary', parseFloat(e.target.value) || 0)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="netMonthlySalary">Salaire net mensuel (€)</Label>
            <Input
              id="netMonthlySalary"
              type="number"
              min={0}
              value={data.netMonthlySalary}
              onChange={(e) => updateData('netMonthlySalary', parseFloat(e.target.value) || 0)}
            />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="annualBonus">Primes annuelles (€)</Label>
            <Input
              id="annualBonus"
              type="number"
              min={0}
              value={data.annualBonus}
              onChange={(e) => updateData('annualBonus', parseFloat(e.target.value) || 0)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="thirteenthMonth">13ème mois (€)</Label>
            <Input
              id="thirteenthMonth"
              type="number"
              min={0}
              value={data.thirteenthMonth}
              onChange={(e) => updateData('thirteenthMonth', parseFloat(e.target.value) || 0)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="overtimeAnnual">Heures supp. annuelles (€)</Label>
            <Input
              id="overtimeAnnual"
              type="number"
              min={0}
              value={data.overtimeAnnual}
              onChange={(e) => updateData('overtimeAnnual', parseFloat(e.target.value) || 0)}
            />
          </div>
        </div>
      </div>

      {/* Deductions & Benefits */}
      <div className="p-4 rounded-lg bg-muted/30 border border-border">
        <div className="flex items-center gap-2 mb-4">
          <Gift className="h-5 w-5 text-primary" />
          <h3 className="font-medium">Avantages & Déductions</h3>
        </div>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 rounded-lg bg-background">
            <div>
              <Label className="cursor-pointer">Frais réels (vs abattement 10%)</Label>
              <p className="text-xs text-muted-foreground">Déclarez vos frais professionnels réels</p>
            </div>
            <Switch
              checked={data.hasRealExpenses}
              onCheckedChange={(v) => updateData('hasRealExpenses', v)}
            />
          </div>
          
          {data.hasRealExpenses && (
            <div className="space-y-2 ml-4">
              <Label htmlFor="realExpensesAmount">Montant frais réels annuels (€)</Label>
              <Input
                id="realExpensesAmount"
                type="number"
                min={0}
                value={data.realExpensesAmount}
                onChange={(e) => updateData('realExpensesAmount', parseFloat(e.target.value) || 0)}
              />
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex items-center justify-between p-3 rounded-lg bg-background">
              <Label className="cursor-pointer">Mutuelle entreprise</Label>
              <Switch
                checked={data.hasCompanyHealthInsurance}
                onCheckedChange={(v) => updateData('hasCompanyHealthInsurance', v)}
              />
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-background">
              <Label className="cursor-pointer">Tickets restaurant</Label>
              <Switch
                checked={data.hasMealVouchers}
                onCheckedChange={(v) => updateData('hasMealVouchers', v)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="peeAmount">PEE (€)</Label>
              <Input
                id="peeAmount"
                type="number"
                min={0}
                value={data.peeAmount}
                onChange={(e) => updateData('peeAmount', parseFloat(e.target.value) || 0)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="percoAmount">PERCO (€)</Label>
              <Input
                id="percoAmount"
                type="number"
                min={0}
                value={data.percoAmount}
                onChange={(e) => updateData('percoAmount', parseFloat(e.target.value) || 0)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="stockOptionsValue">Stock-options (€)</Label>
              <Input
                id="stockOptionsValue"
                type="number"
                min={0}
                value={data.stockOptionsValue}
                onChange={(e) => updateData('stockOptionsValue', parseFloat(e.target.value) || 0)}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
