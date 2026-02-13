import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { user, loading } = useAuth();
  const location = useLocation();
  const navState = location.state as { onboardingJustCompleted?: boolean } | null;
  const [onboardingChecked, setOnboardingChecked] = useState(false);
  const [onboardingCompleted, setOnboardingCompleted] = useState<boolean | null>(null);

  const justCompleted = navState?.onboardingJustCompleted === true;

  useEffect(() => {
    if (!user) {
      setOnboardingChecked(true);
      return;
    }

    if (justCompleted) {
      setOnboardingCompleted(true);
      setOnboardingChecked(true);
      return;
    }

    setOnboardingChecked(false);

    const checkOnboarding = async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('onboarding_completed')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error || !data) {
        setOnboardingCompleted(false);
      } else {
        setOnboardingCompleted((data as any).onboarding_completed || false);
      }
      setOnboardingChecked(true);
    };

    checkOnboarding();
  }, [user, location.pathname, justCompleted]);

  if (loading || !onboardingChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  if (onboardingCompleted && location.pathname === '/onboarding') {
    return <Navigate to="/" replace />;
  }

  if (!onboardingCompleted && location.pathname !== '/onboarding') {
    return <Navigate to="/onboarding" replace />;
  }

  return <>{children}</>;
};
