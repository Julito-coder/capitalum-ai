import { useState } from 'react';
import { TaxScannerInput, DEFAULT_TAX_INPUT, QUESTIONNAIRE_STEPS, FamilyStatus, ProfessionalStatus } from '@/data/taxScannerTypes';
import { ArrowLeft, ArrowRight, Check } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Props {
  initialData: TaxScannerInput;
  onComplete: (data: TaxScannerInput) => void;
  onBack: () => void;
}

export const ScannerQuestionnaire = ({ initialData, onComplete, onBack }: Props) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [data, setData] = useState<TaxScannerInput>(initialData);

  const visibleSteps = QUESTIONNAIRE_STEPS.filter(
    step => !step.condition || step.condition(data)
  );
  const step = visibleSteps[currentStep];
  const progress = ((currentStep + 1) / visibleSteps.length) * 100;

  const updateField = <K extends keyof TaxScannerInput>(field: K, value: TaxScannerInput[K]) => {
    setData(prev => ({ ...prev, [field]: value }));
  };

  const handleNext = () => {
    if (currentStep < visibleSteps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      onComplete(data);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    } else {
      onBack();
    }
  };

  const renderField = (fieldId: string) => {
    switch (fieldId) {
      case 'familyStatus':
        return (
          <div className="space-y-2">
            <Label>Situation familiale</Label>
            <Select value={data.familyStatus} onValueChange={(v) => updateField('familyStatus', v as FamilyStatus)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="single">Célibataire</SelectItem>
                <SelectItem value="married">Marié(e)</SelectItem>
                <SelectItem value="pacs">Pacsé(e)</SelectItem>
                <SelectItem value="divorced">Divorcé(e)</SelectItem>
                <SelectItem value="widowed">Veuf/Veuve</SelectItem>
              </SelectContent>
            </Select>
          </div>
        );
      case 'birthYear':
        return (
          <div className="space-y-2">
            <Label>Année de naissance</Label>
            <Input type="number" value={data.birthYear} onChange={(e) => updateField('birthYear', parseInt(e.target.value) || 1980)} />
          </div>
        );
      case 'professionalStatus':
        return (
          <div className="space-y-2">
            <Label>Statut professionnel</Label>
            <Select value={data.professionalStatus} onValueChange={(v) => updateField('professionalStatus', v as ProfessionalStatus)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="employee">Salarié(e)</SelectItem>
                <SelectItem value="self_employed">Indépendant(e)</SelectItem>
                <SelectItem value="retired">Retraité(e)</SelectItem>
                <SelectItem value="mixed">Activité mixte</SelectItem>
                <SelectItem value="unemployed">Sans emploi</SelectItem>
                <SelectItem value="student">Étudiant(e)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        );
      case 'childrenCount':
        return (
          <div className="space-y-2">
            <Label>Nombre d'enfants à charge</Label>
            <Input type="number" min={0} value={data.childrenCount} onChange={(e) => updateField('childrenCount', parseInt(e.target.value) || 0)} />
          </div>
        );
      case 'salaryDeclared':
        return (
          <div className="space-y-2">
            <Label>Revenu net imposable déclaré (€)</Label>
            <Input type="number" value={data.salaryDeclared} onChange={(e) => updateField('salaryDeclared', parseFloat(e.target.value) || 0)} />
          </div>
        );
      case 'salaryNet':
        return (
          <div className="space-y-2">
            <Label>Salaire net perçu annuel (€)</Label>
            <Input type="number" value={data.salaryNet} onChange={(e) => updateField('salaryNet', parseFloat(e.target.value) || 0)} />
          </div>
        );
      case 'realExpenses':
        return (
          <div className="space-y-2">
            <Label>Frais réels professionnels (€)</Label>
            <Input type="number" value={data.realExpenses} onChange={(e) => updateField('realExpenses', parseFloat(e.target.value) || 0)} />
          </div>
        );
      case 'rentalIncome':
        return (
          <div className="space-y-2">
            <Label>Revenus fonciers annuels (€)</Label>
            <Input type="number" value={data.rentalIncome} onChange={(e) => updateField('rentalIncome', parseFloat(e.target.value) || 0)} />
          </div>
        );
      case 'dividends':
        return (
          <div className="space-y-2">
            <Label>Dividendes perçus (€)</Label>
            <Input type="number" value={data.dividends} onChange={(e) => updateField('dividends', parseFloat(e.target.value) || 0)} />
          </div>
        );
      case 'perContributions':
        return (
          <div className="space-y-2">
            <Label>Versements PER (€)</Label>
            <Input type="number" value={data.perContributions} onChange={(e) => updateField('perContributions', parseFloat(e.target.value) || 0)} />
          </div>
        );
      case 'donations':
        return (
          <div className="space-y-2">
            <Label>Dons associations (€)</Label>
            <Input type="number" value={data.donations} onChange={(e) => updateField('donations', parseFloat(e.target.value) || 0)} />
          </div>
        );
      case 'hasDisability':
        return (
          <div className="flex items-center justify-between">
            <Label>Titulaire carte invalidité 80%+</Label>
            <Switch checked={data.hasDisability} onCheckedChange={(v) => updateField('hasDisability', v)} />
          </div>
        );
      case 'isJournalist':
        return (
          <div className="flex items-center justify-between">
            <Label>Journaliste professionnel</Label>
            <Switch checked={data.isJournalist} onCheckedChange={(v) => updateField('isJournalist', v)} />
          </div>
        );
      case 'hasAirbnb':
        return (
          <div className="flex items-center justify-between">
            <Label>Location type Airbnb</Label>
            <Switch checked={data.hasAirbnb} onCheckedChange={(v) => updateField('hasAirbnb', v)} />
          </div>
        );
      case 'hasForeignIncome':
        return (
          <div className="flex items-center justify-between">
            <Label>Revenus de source étrangère</Label>
            <Switch checked={data.hasForeignIncome} onCheckedChange={(v) => updateField('hasForeignIncome', v)} />
          </div>
        );
      default:
        return null;
    }
  };

  const fieldsToRender = step.fields.filter(f => renderField(f) !== null);

  return (
    <div>
      {/* Progress */}
      <div className="mb-8">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-muted-foreground">Étape {currentStep + 1}/{visibleSteps.length}</span>
          <span className="font-medium">{Math.round(progress)}%</span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div className="h-full bg-primary transition-all duration-300" style={{ width: `${progress}%` }} />
        </div>
      </div>

      {/* Step content */}
      <div className="glass-card rounded-2xl p-6 lg:p-8 mb-6">
        <h2 className="text-xl font-semibold mb-2">{step.title}</h2>
        <p className="text-muted-foreground mb-6">{step.description}</p>
        
        <div className="space-y-6">
          {fieldsToRender.map(fieldId => (
            <div key={fieldId}>{renderField(fieldId)}</div>
          ))}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-between">
        <button onClick={handlePrev} className="btn-secondary">
          <ArrowLeft className="w-4 h-4" />
          Précédent
        </button>
        <button onClick={handleNext} className="btn-primary">
          {currentStep === visibleSteps.length - 1 ? (
            <>Analyser <Check className="w-4 h-4" /></>
          ) : (
            <>Suivant <ArrowRight className="w-4 h-4" /></>
          )}
        </button>
      </div>
    </div>
  );
};
