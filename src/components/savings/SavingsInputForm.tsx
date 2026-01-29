import { useState } from 'react';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Info, Euro, Calendar, Target, User } from 'lucide-react';
import { SavingsInputs, SavingsProfile, SAVINGS_CONSTANTS, PROFILE_LABELS } from '@/lib/savingsTypes';
import { formatEuro } from '@/lib/savingsCalculations';

interface SavingsInputFormProps {
  inputs: SavingsInputs;
  onChange: (inputs: SavingsInputs) => void;
}

export function SavingsInputForm({ inputs, onChange }: SavingsInputFormProps) {
  const handleChange = <K extends keyof SavingsInputs>(key: K, value: SavingsInputs[K]) => {
    onChange({ ...inputs, [key]: value });
  };

  return (
    <div className="space-y-8">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold mb-2">Paramètres de votre simulation</h2>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Ajustez ces hypothèses selon votre situation. Ces valeurs sont modifiables à tout moment.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Monthly Contribution */}
        <Card className="glass-card">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Euro className="h-5 w-5 text-primary" />
              <Label className="text-base font-semibold">Versement mensuel</Label>
            </div>
            <Slider
              value={[inputs.monthlyContribution]}
              onValueChange={([v]) => handleChange('monthlyContribution', v)}
              min={50}
              max={2000}
              step={50}
              className="mb-4"
            />
            <div className="flex justify-between items-center">
              <span className="text-3xl font-bold text-primary">
                {formatEuro(inputs.monthlyContribution)}
              </span>
              <span className="text-sm text-muted-foreground">/ mois</span>
            </div>
          </CardContent>
        </Card>

        {/* Duration */}
        <Card className="glass-card">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Calendar className="h-5 w-5 text-primary" />
              <Label className="text-base font-semibold">Durée de placement</Label>
            </div>
            <Slider
              value={[inputs.durationYears]}
              onValueChange={([v]) => handleChange('durationYears', v)}
              min={5}
              max={40}
              step={1}
              className="mb-4"
            />
            <div className="flex justify-between items-center">
              <span className="text-3xl font-bold text-primary">{inputs.durationYears} ans</span>
              <span className="text-sm text-muted-foreground">
                Total versé : {formatEuro(inputs.monthlyContribution * 12 * inputs.durationYears)}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Age */}
        <Card className="glass-card">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <User className="h-5 w-5 text-primary" />
              <Label className="text-base font-semibold">Votre âge actuel</Label>
            </div>
            <Slider
              value={[inputs.age]}
              onValueChange={([v]) => handleChange('age', v)}
              min={18}
              max={65}
              step={1}
              className="mb-4"
            />
            <div className="flex justify-between items-center">
              <span className="text-3xl font-bold text-primary">{inputs.age} ans</span>
              <span className="text-sm text-muted-foreground">
                Fin du placement à {inputs.age + inputs.durationYears} ans
              </span>
            </div>
          </CardContent>
        </Card>

        {/* TMI */}
        <Card className="glass-card">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Info className="h-5 w-5 text-primary" />
              <Label className="text-base font-semibold">Tranche Marginale d'Imposition (TMI)</Label>
            </div>
            <Select
              value={inputs.tmi.toString()}
              onValueChange={(v) => handleChange('tmi', parseInt(v))}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Sélectionnez votre TMI" />
              </SelectTrigger>
              <SelectContent>
                {SAVINGS_CONSTANTS.TMI_BRACKETS.map((tmi) => (
                  <SelectItem key={tmi} value={tmi.toString()}>
                    {tmi === 0 ? 'Non imposable (0%)' : `${tmi}%`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground mt-3">
              Votre TMI impacte l'avantage fiscal du PER. Plus elle est élevée, plus le PER est intéressant.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Profile Selection */}
      <Card className="glass-card">
        <CardContent className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Target className="h-5 w-5 text-primary" />
            <Label className="text-base font-semibold">Profil de risque</Label>
          </div>
          
          <RadioGroup
            value={inputs.profile}
            onValueChange={(v) => handleChange('profile', v as SavingsProfile)}
            className="grid md:grid-cols-3 gap-4"
          >
            {(['prudent', 'equilibre', 'dynamique'] as SavingsProfile[]).map((profile) => (
              <label
                key={profile}
                className={`flex flex-col p-4 rounded-lg border-2 cursor-pointer transition-all ${
                  inputs.profile === profile
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <RadioGroupItem value={profile} id={profile} />
                  <span className="font-semibold">{PROFILE_LABELS[profile]}</span>
                </div>
                <span className="text-sm text-muted-foreground">
                  Rendement hypothétique : {SAVINGS_CONSTANTS.RATES[profile]}% / an
                </span>
              </label>
            ))}
          </RadioGroup>

          <div className="mt-4 p-3 rounded-lg bg-warning/10 border border-warning/20">
            <p className="text-xs text-muted-foreground">
              ⚠️ <strong>Important :</strong> Ces taux sont des hypothèses pédagogiques, non des garanties. 
              Les performances passées ne préjugent pas des performances futures.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Objective */}
      <Card className="glass-card">
        <CardContent className="p-6">
          <Label className="text-base font-semibold mb-4 block">Votre objectif principal</Label>
          <RadioGroup
            value={inputs.objective}
            onValueChange={(v) => handleChange('objective', v as SavingsInputs['objective'])}
            className="grid md:grid-cols-3 gap-4"
          >
            <label
              className={`flex flex-col p-4 rounded-lg border-2 cursor-pointer transition-all ${
                inputs.objective === 'retraite'
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/50'
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <RadioGroupItem value="retraite" />
                <span className="font-semibold">Retraite</span>
              </div>
              <span className="text-xs text-muted-foreground">Compléter mes revenus futurs</span>
            </label>

            <label
              className={`flex flex-col p-4 rounded-lg border-2 cursor-pointer transition-all ${
                inputs.objective === 'capital'
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/50'
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <RadioGroupItem value="capital" />
                <span className="font-semibold">Capital long terme</span>
              </div>
              <span className="text-xs text-muted-foreground">Constituer un patrimoine</span>
            </label>

            <label
              className={`flex flex-col p-4 rounded-lg border-2 cursor-pointer transition-all ${
                inputs.objective === 'complement'
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/50'
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <RadioGroupItem value="complement" />
                <span className="font-semibold">Complément futur</span>
              </div>
              <span className="text-xs text-muted-foreground">Projet ou sécurité financière</span>
            </label>
          </RadioGroup>
        </CardContent>
      </Card>
    </div>
  );
}
