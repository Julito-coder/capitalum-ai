import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Save, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import {
  loadFiscalProfile,
  saveFiscalProfile,
  calculateProfileCompletion,
  FiscalProfileData,
} from '@/lib/fiscalProfileService';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { CompletionIndicator } from './CompletionIndicator';
import { IdentitySection } from './IdentitySection';
import { FamilySection } from './FamilySection';
import { ProfessionalSection } from './ProfessionalSection';
import { EmployeeSection } from './EmployeeSection';
import { SelfEmployedSection } from './SelfEmployedSection';
import { RetiredSection } from './RetiredSection';
import { InvestmentRealEstateSection } from './InvestmentRealEstateSection';
import { InvestmentFinancialSection } from './InvestmentFinancialSection';
import { ConsentsSection } from './ConsentsSection';

export const FiscalProfileForm = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [data, setData] = useState<FiscalProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [completion, setCompletion] = useState(0);

  useEffect(() => {
    if (!user) return;
    loadFiscalProfile(user.id).then((profile) => {
      setData(profile);
      setCompletion(calculateProfileCompletion(profile));
      setLoading(false);
    });
  }, [user]);

  const handleChange = useCallback((updates: Partial<FiscalProfileData>) => {
    setData((prev) => {
      if (!prev) return prev;
      const next = { ...prev, ...updates };
      setCompletion(calculateProfileCompletion(next));
      return next;
    });
  }, []);

  const handleSave = async () => {
    if (!user || !data) return;
    setSaving(true);
    const result = await saveFiscalProfile(user.id, data);
    setSaving(false);
    if (result.success) {
      toast({ title: '✅ Profil sauvegardé', description: 'Tes informations ont été mises à jour.' });
      // Notifie l'agent Élio que le profil a été modifié manuellement
      window.dispatchEvent(new CustomEvent('elio:profile-updated', { detail: { source: 'fiscal_profile_form' } }));
    } else {
      toast({ title: 'Erreur', description: result.error, variant: 'destructive' });
    }
  };

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const isEmployee = data.profileTypes.includes('employee');
  const isSelfEmployed = data.profileTypes.includes('self_employed');
  const isRetired = data.profileTypes.includes('retired');
  const hasInvestments = data.profileTypes.includes('investor') || data.hasRentalIncome || data.hasInvestments;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Completion indicator */}
      <div className="glass-card rounded-2xl p-6">
        <CompletionIndicator percentage={completion} />
      </div>

      {/* Accordion sections */}
      <Accordion type="multiple" defaultValue={['identity']} className="space-y-3">
        <AccordionItem value="identity" className="glass-card rounded-2xl border-border/50 px-6">
          <AccordionTrigger className="text-base font-semibold">🪪 Identité</AccordionTrigger>
          <AccordionContent className="pb-6">
            <IdentitySection data={data} onChange={handleChange} />
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="family" className="glass-card rounded-2xl border-border/50 px-6">
          <AccordionTrigger className="text-base font-semibold">👨‍👩‍👧‍👦 Situation familiale</AccordionTrigger>
          <AccordionContent className="pb-6">
            <FamilySection data={data} onChange={handleChange} />
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="professional" className="glass-card rounded-2xl border-border/50 px-6">
          <AccordionTrigger className="text-base font-semibold">💼 Situation professionnelle</AccordionTrigger>
          <AccordionContent className="pb-6">
            <ProfessionalSection data={data} onChange={handleChange} />
          </AccordionContent>
        </AccordionItem>

        {isEmployee && (
          <AccordionItem value="employee" className="glass-card rounded-2xl border-border/50 px-6">
            <AccordionTrigger className="text-base font-semibold">📋 Revenus salariés</AccordionTrigger>
            <AccordionContent className="pb-6">
              <EmployeeSection data={data} onChange={handleChange} />
            </AccordionContent>
          </AccordionItem>
        )}

        {isSelfEmployed && (
          <AccordionItem value="selfemployed" className="glass-card rounded-2xl border-border/50 px-6">
            <AccordionTrigger className="text-base font-semibold">🚀 Activité indépendante</AccordionTrigger>
            <AccordionContent className="pb-6">
              <SelfEmployedSection data={data} onChange={handleChange} />
            </AccordionContent>
          </AccordionItem>
        )}

        {isRetired && (
          <AccordionItem value="retired" className="glass-card rounded-2xl border-border/50 px-6">
            <AccordionTrigger className="text-base font-semibold">🏖️ Retraite</AccordionTrigger>
            <AccordionContent className="pb-6">
              <RetiredSection data={data} onChange={handleChange} />
            </AccordionContent>
          </AccordionItem>
        )}

        <AccordionItem value="realestate" className="glass-card rounded-2xl border-border/50 px-6">
          <AccordionTrigger className="text-base font-semibold">🏠 Investissements immobiliers</AccordionTrigger>
          <AccordionContent className="pb-6">
            <InvestmentRealEstateSection data={data} onChange={handleChange} />
          </AccordionContent>
        </AccordionItem>

        {(hasInvestments || true) && (
          <AccordionItem value="financial" className="glass-card rounded-2xl border-border/50 px-6">
            <AccordionTrigger className="text-base font-semibold">📈 Investissements financiers</AccordionTrigger>
            <AccordionContent className="pb-6">
              <InvestmentFinancialSection data={data} onChange={handleChange} />
            </AccordionContent>
          </AccordionItem>
        )}

        <AccordionItem value="consents" className="glass-card rounded-2xl border-border/50 px-6">
          <AccordionTrigger className="text-base font-semibold">🔒 Consentements</AccordionTrigger>
          <AccordionContent className="pb-6">
            <ConsentsSection data={data} onChange={handleChange} />
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      {/* Save button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="btn-primary px-8 py-3 rounded-xl"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Enregistrer
        </button>
      </div>
    </motion.div>
  );
};
