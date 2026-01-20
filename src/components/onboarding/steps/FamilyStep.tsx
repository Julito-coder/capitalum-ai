import { OnboardingData, ChildDetail } from '@/data/onboardingTypes';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2 } from 'lucide-react';

interface Props {
  data: OnboardingData;
  updateData: <K extends keyof OnboardingData>(field: K, value: OnboardingData[K]) => void;
}

export const FamilyStep = ({ data, updateData }: Props) => {
  const addChild = () => {
    updateData('childrenDetails', [...data.childrenDetails, { age: 0, isStudent: false, hasDisability: false }]);
    updateData('childrenCount', data.childrenCount + 1);
  };

  const removeChild = (index: number) => {
    const newDetails = data.childrenDetails.filter((_, i) => i !== index);
    updateData('childrenDetails', newDetails);
    updateData('childrenCount', Math.max(0, data.childrenCount - 1));
  };

  const updateChild = (index: number, field: keyof ChildDetail, value: number | boolean) => {
    const newDetails = [...data.childrenDetails];
    newDetails[index] = { ...newDetails[index], [field]: value };
    updateData('childrenDetails', newDetails);
  };

  const showSpouseIncome = ['married', 'pacs'].includes(data.familyStatus);

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label>Situation matrimoniale</Label>
        <Select 
          value={data.familyStatus} 
          onValueChange={(v) => updateData('familyStatus', v as OnboardingData['familyStatus'])}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="single">Célibataire</SelectItem>
            <SelectItem value="married">Marié(e)</SelectItem>
            <SelectItem value="pacs">Pacsé(e)</SelectItem>
            <SelectItem value="divorced">Divorcé(e)</SelectItem>
            <SelectItem value="widowed">Veuf/Veuve</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {showSpouseIncome && (
        <div className="space-y-2 p-4 rounded-lg bg-muted/50">
          <Label htmlFor="spouseIncome">Revenu annuel du conjoint (€)</Label>
          <Input
            id="spouseIncome"
            type="number"
            min={0}
            value={data.spouseIncome}
            onChange={(e) => updateData('spouseIncome', parseFloat(e.target.value) || 0)}
          />
          <p className="text-xs text-muted-foreground">Important pour le calcul du quotient familial</p>
        </div>
      )}

      <div className="border-t border-border pt-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-medium">Enfants à charge</h3>
            <p className="text-sm text-muted-foreground">Enfants rattachés à votre foyer fiscal</p>
          </div>
          <button
            onClick={addChild}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors text-sm font-medium"
          >
            <Plus className="h-4 w-4" />
            Ajouter
          </button>
        </div>

        {data.childrenDetails.length === 0 ? (
          <p className="text-center text-muted-foreground py-8 border border-dashed rounded-lg">
            Aucun enfant à charge déclaré
          </p>
        ) : (
          <div className="space-y-4">
            {data.childrenDetails.map((child, index) => (
              <div key={index} className="p-4 rounded-lg border border-border bg-card">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-medium">Enfant {index + 1}</span>
                  <button
                    onClick={() => removeChild(index)}
                    className="p-1.5 rounded hover:bg-destructive/10 text-destructive transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Âge</Label>
                    <Input
                      type="number"
                      min={0}
                      max={30}
                      value={child.age}
                      onChange={(e) => updateChild(index, 'age', parseInt(e.target.value) || 0)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <Label className="cursor-pointer text-sm">Étudiant</Label>
                    <Switch
                      checked={child.isStudent}
                      onCheckedChange={(v) => updateChild(index, 'isStudent', v)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <Label className="cursor-pointer text-sm">Handicap</Label>
                    <Switch
                      checked={child.hasDisability}
                      onCheckedChange={(v) => updateChild(index, 'hasDisability', v)}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
