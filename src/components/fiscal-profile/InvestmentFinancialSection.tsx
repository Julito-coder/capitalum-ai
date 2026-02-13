import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FiscalProfileData } from '@/lib/fiscalProfileService';

interface Props {
  data: FiscalProfileData;
  onChange: (updates: Partial<FiscalProfileData>) => void;
}

export const InvestmentFinancialSection = ({ data, onChange }: Props) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label>PEA – Encours (€)</Label>
        <Input type="number" value={data.peaBalance || ''} onChange={(e) => onChange({ peaBalance: parseFloat(e.target.value) || 0 })} />
      </div>
      <div className="space-y-2">
        <Label>PEA – Versements 2025 (€)</Label>
        <Input type="number" value={data.peaContributions2025 || ''} onChange={(e) => onChange({ peaContributions2025: parseFloat(e.target.value) || 0 })} />
      </div>
      <div className="space-y-2">
        <Label>CTO – Dividendes (€)</Label>
        <Input type="number" value={data.ctoDividends || ''} onChange={(e) => onChange({ ctoDividends: parseFloat(e.target.value) || 0 })} />
      </div>
      <div className="space-y-2">
        <Label>CTO – Plus-values (€)</Label>
        <Input type="number" value={data.ctoCapitalGains || ''} onChange={(e) => onChange({ ctoCapitalGains: parseFloat(e.target.value) || 0 })} />
      </div>
      <div className="space-y-2">
        <Label>Assurance vie – Encours (€)</Label>
        <Input type="number" value={data.lifeInsuranceBalance || ''} onChange={(e) => onChange({ lifeInsuranceBalance: parseFloat(e.target.value) || 0 })} />
      </div>
      <div className="space-y-2">
        <Label>Assurance vie – Versements (€)</Label>
        <Input type="number" value={data.lifeInsuranceContributions || ''} onChange={(e) => onChange({ lifeInsuranceContributions: parseFloat(e.target.value) || 0 })} />
      </div>
      <div className="space-y-2">
        <Label>Assurance vie – Rachats (€)</Label>
        <Input type="number" value={data.lifeInsuranceWithdrawals || ''} onChange={(e) => onChange({ lifeInsuranceWithdrawals: parseFloat(e.target.value) || 0 })} />
      </div>
      <div className="space-y-2">
        <Label>Crypto – PnL 2025 (€)</Label>
        <Input type="number" value={data.cryptoPnl2025 || ''} onChange={(e) => onChange({ cryptoPnl2025: parseFloat(e.target.value) || 0 })} />
      </div>
      <div className="space-y-2">
        <Label>SCPI (€)</Label>
        <Input type="number" value={data.scpiInvestments || ''} onChange={(e) => onChange({ scpiInvestments: parseFloat(e.target.value) || 0 })} />
      </div>
      <div className="space-y-2">
        <Label>Crowdfunding (€)</Label>
        <Input type="number" value={data.crowdfundingInvestments || ''} onChange={(e) => onChange({ crowdfundingInvestments: parseFloat(e.target.value) || 0 })} />
      </div>
    </div>
  );
};
