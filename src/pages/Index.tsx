import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { ModernOnboardingWizard } from '@/components/onboarding/modern/ModernOnboardingWizard';
import { Loader2 } from 'lucide-react';

const Index = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return <ModernOnboardingWizard />;
};

export default Index;
