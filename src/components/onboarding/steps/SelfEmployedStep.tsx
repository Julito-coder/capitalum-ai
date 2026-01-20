import { OnboardingData, FiscalStatus, TopClient } from '@/data/onboardingTypes';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Building2, Euro, Users, Plus, Trash2 } from 'lucide-react';

interface Props {
  data: OnboardingData;
  updateData: <K extends keyof OnboardingData>(field: K, value: OnboardingData[K]) => void;
}

export const SelfEmployedStep = ({ data, updateData }: Props) => {
  const addClient = () => {
    updateData('topClients', [...data.topClients, { name: '', annualRevenue: 0 }]);
  };

  const removeClient = (index: number) => {
    updateData('topClients', data.topClients.filter((_, i) => i !== index));
  };

  const updateClient = (index: number, field: keyof TopClient, value: string | number) => {
    const newClients = [...data.topClients];
    newClients[index] = { ...newClients[index], [field]: value };
    updateData('topClients', newClients);
  };

  return (
    <div className="space-y-6">
      {/* Company info */}
      <div className="p-4 rounded-lg bg-muted/30 border border-border">
        <div className="flex items-center gap-2 mb-4">
          <Building2 className="h-5 w-5 text-primary" />
          <h3 className="font-medium">Entreprise</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="siret">SIRET *</Label>
            <Input
              id="siret"
              placeholder="123 456 789 00012"
              value={data.siret}
              onChange={(e) => updateData('siret', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="apeCode">Code APE</Label>
            <Input
              id="apeCode"
              placeholder="6201Z"
              value={data.apeCode}
              onChange={(e) => updateData('apeCode', e.target.value)}
            />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="companyCreationDate">Date de création</Label>
            <Input
              id="companyCreationDate"
              type="date"
              value={data.companyCreationDate}
              onChange={(e) => updateData('companyCreationDate', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Régime fiscal</Label>
            <Select 
              value={data.fiscalStatus} 
              onValueChange={(v) => updateData('fiscalStatus', v as FiscalStatus)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="micro">Micro-entreprise</SelectItem>
                <SelectItem value="micro_social">Micro-social simplifié</SelectItem>
                <SelectItem value="reel_simplifie">Réel simplifié</SelectItem>
                <SelectItem value="reel_normal">Réel normal</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="mt-4 space-y-2">
          <Label htmlFor="accountingSoftware">Logiciel comptable utilisé</Label>
          <Input
            id="accountingSoftware"
            placeholder="Freebe, Pennylane, QuickBooks..."
            value={data.accountingSoftware}
            onChange={(e) => updateData('accountingSoftware', e.target.value)}
          />
        </div>
      </div>

      {/* Revenue & Charges */}
      <div className="p-4 rounded-lg bg-muted/30 border border-border">
        <div className="flex items-center gap-2 mb-4">
          <Euro className="h-5 w-5 text-primary" />
          <h3 className="font-medium">Chiffre d'affaires & Charges</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="annualRevenueHt">CA annuel HT (€) *</Label>
            <Input
              id="annualRevenueHt"
              type="number"
              min={0}
              value={data.annualRevenueHt}
              onChange={(e) => updateData('annualRevenueHt', parseFloat(e.target.value) || 0)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="socialChargesPaid">Charges sociales payées (€)</Label>
            <Input
              id="socialChargesPaid"
              type="number"
              min={0}
              value={data.socialChargesPaid}
              onChange={(e) => updateData('socialChargesPaid', parseFloat(e.target.value) || 0)}
            />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="officeRent">Loyer local pro (€/an)</Label>
            <Input
              id="officeRent"
              type="number"
              min={0}
              value={data.officeRent}
              onChange={(e) => updateData('officeRent', parseFloat(e.target.value) || 0)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="vehicleExpenses">Frais véhicule (€/an)</Label>
            <Input
              id="vehicleExpenses"
              type="number"
              min={0}
              value={data.vehicleExpenses}
              onChange={(e) => updateData('vehicleExpenses', parseFloat(e.target.value) || 0)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="professionalSupplies">Fournitures (€/an)</Label>
            <Input
              id="professionalSupplies"
              type="number"
              min={0}
              value={data.professionalSupplies}
              onChange={(e) => updateData('professionalSupplies', parseFloat(e.target.value) || 0)}
            />
          </div>
        </div>
      </div>

      {/* Top Clients */}
      <div className="p-4 rounded-lg bg-muted/30 border border-border">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            <h3 className="font-medium">Principaux clients</h3>
          </div>
          {data.topClients.length < 3 && (
            <button
              onClick={addClient}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors text-sm font-medium"
            >
              <Plus className="h-4 w-4" />
              Ajouter
            </button>
          )}
        </div>

        {data.topClients.length === 0 ? (
          <p className="text-center text-muted-foreground py-6 border border-dashed rounded-lg text-sm">
            Optionnel : ajoutez vos 3 plus gros clients pour une analyse de dépendance
          </p>
        ) : (
          <div className="space-y-3">
            {data.topClients.map((client, index) => (
              <div key={index} className="flex items-center gap-3">
                <Input
                  placeholder="Nom du client"
                  value={client.name}
                  onChange={(e) => updateClient(index, 'name', e.target.value)}
                  className="flex-1"
                />
                <Input
                  type="number"
                  placeholder="CA annuel"
                  value={client.annualRevenue}
                  onChange={(e) => updateClient(index, 'annualRevenue', parseFloat(e.target.value) || 0)}
                  className="w-32"
                />
                <button
                  onClick={() => removeClient(index)}
                  className="p-2 rounded hover:bg-destructive/10 text-destructive transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
