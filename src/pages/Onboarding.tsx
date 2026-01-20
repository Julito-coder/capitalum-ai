import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { OnboardingWizard } from '@/components/onboarding/OnboardingWizard';
import { OnboardingData } from '@/data/onboardingTypes';
import { saveOnboardingData, loadOnboardingData } from '@/lib/onboardingService';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

const Onboarding = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [initialData, setInitialData] = useState<Partial<OnboardingData> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadExistingData = async () => {
      if (!user) return;
      
      try {
        const data = await loadOnboardingData(user.id);
        setInitialData(data || {});
      } catch (error) {
        console.error('Error loading onboarding data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (!authLoading && user) {
      loadExistingData();
    } else if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  const handleComplete = async (data: OnboardingData) => {
    if (!user) return;

    const result = await saveOnboardingData(user.id, data);
    
    if (result.success) {
      toast({
        title: "✅ Profil complété !",
        description: "Votre audit fiscal personnalisé est prêt.",
      });
      navigate('/');
    } else {
      toast({
        title: "Erreur",
        description: result.error || "Une erreur est survenue",
        variant: "destructive",
      });
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <OnboardingWizard 
      onComplete={handleComplete} 
      initialData={initialData || undefined}
    />
  );
};

export default Onboarding;
