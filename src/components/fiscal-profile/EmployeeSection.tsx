import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FiscalProfileData } from '@/lib/fiscalProfileService';

interface Props {
  data: FiscalProfileData;
  onChange: (updates: Partial<FiscalProfileData>) => void;
}

export const EmployeeSection = ({ data, onChange }: Props) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label>Employeur</Label>
        <Input value={data.employerName} onChange={(e) => onChange({ employerName: e.target.value })} placeholder="Nom de l'entreprise" />
      </div>
      <div className="space-y-2">
        <Label>Type de contrat</Label>
        <Select value={data.contractType} onValueChange={(v) => onChange({ contractType: v as any })}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="cdi">CDI</SelectItem>
            <SelectItem value="cdd">CDD</SelectItem>
            <SelectItem value="interim">Intérim</SelectItem>
            <SelectItem value="freelance">Freelance</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>Salaire brut mensuel (€)</Label>
        <Input type="number" value={data.grossMonthlySalary || ''} onChange={(e) => onChange({ grossMonthlySalary: parseFloat(e.target.value) || 0 })} placeholder="3 500" />
      </div>
      <div className="space-y-2">
        <Label>Salaire net mensuel (€)</Label>
        <Input type="number" value={data.netMonthlySalary || ''} onChange={(e) => onChange({ netMonthlySalary: parseFloat(e.target.value) || 0 })} placeholder="2 700" />
      </div>
      <div className="space-y-2">
        <Label>Prime annuelle (€)</Label>
        <Input type="number" value={data.annualBonus || ''} onChange={(e) => onChange({ annualBonus: parseFloat(e.target.value) || 0 })} />
      </div>
      <div className="space-y-2">
        <Label>13ème mois (€)</Label>
        <Input type="number" value={data.thirteenthMonth || ''} onChange={(e) => onChange({ thirteenthMonth: parseFloat(e.target.value) || 0 })} />
      </div>
      <div className="space-y-2">
        <Label>Heures sup annuelles (€)</Label>
        <Input type="number" value={data.overtimeAnnual || ''} onChange={(e) => onChange({ overtimeAnnual: parseFloat(e.target.value) || 0 })} />
      </div>
      <div className="space-y-2">
        <Label>PEE (€)</Label>
        <Input type="number" value={data.peeAmount || ''} onChange={(e) => onChange({ peeAmount: parseFloat(e.target.value) || 0 })} />
      </div>
      <div className="space-y-2">
        <Label>PERCO (€)</Label>
        <Input type="number" value={data.percoAmount || ''} onChange={(e) => onChange({ percoAmount: parseFloat(e.target.value) || 0 })} />
      </div>
      <div className="space-y-2">
        <Label>Stock-options (€)</Label>
        <Input type="number" value={data.stockOptionsValue || ''} onChange={(e) => onChange({ stockOptionsValue: parseFloat(e.target.value) || 0 })} />
      </div>
      <div className="flex items-center gap-3">
        <Switch checked={data.hasRealExpenses} onCheckedChange={(v) => onChange({ hasRealExpenses: v })} />
        <Label>Frais réels</Label>
      </div>
      {data.hasRealExpenses && (
        <div className="space-y-2">
          <Label>Montant frais réels (€/an)</Label>
          <Input type="number" value={data.realExpensesAmount || ''} onChange={(e) => onChange({ realExpensesAmount: parseFloat(e.target.value) || 0 })} />
        </div>
      )}
      <div className="flex items-center gap-3">
        <Switch checked={data.hasCompanyHealthInsurance} onCheckedChange={(v) => onChange({ hasCompanyHealthInsurance: v })} />
        <Label>Mutuelle d'entreprise</Label>
      </div>
      <div className="flex items-center gap-3">
        <Switch checked={data.hasMealVouchers} onCheckedChange={(v) => onChange({ hasMealVouchers: v })} />
        <Label>Tickets restaurant</Label>
      </div>
    </div>
  );
};
