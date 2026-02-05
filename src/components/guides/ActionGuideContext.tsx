import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { UserProfile } from '@/lib/dashboardService';

export interface GuideStep {
  id: string;
  title: string;
  description?: string;
  type?: 'education' | 'simulation' | 'action' | 'confirmation';
  component?: React.ComponentType<{ onNext: () => void; onBack?: () => void; profile?: UserProfile | null }>;
  content?: React.ReactNode;
}

export interface ActionGuide {
  id: string;
  title: string;
  subtitle?: string;
  category: 'savings' | 'tax' | 'investment' | 'deduction' | 'status' | 'pro';
  estimatedGain: number;
  effort?: string;
  deadline?: string;
  steps: GuideStep[];
}

interface ActionGuideContextType {
  isOpen: boolean;
  currentGuide: ActionGuide | null;
  currentStep: number;
  completedActions: string[];
  pendingActions: string[];
  profile: UserProfile | null;
  openGuide: (guide: ActionGuide, profile?: UserProfile | null) => void;
  closeGuide: () => void;
  nextStep: () => void;
  prevStep: () => void;
  goToStep: (step: number) => void;
  markActionCompleted: (actionId: string) => void;
  markActionPending: (actionId: string) => void;
  isActionCompleted: (actionId: string) => boolean;
  isActionPending: (actionId: string) => boolean;
}

const ActionGuideContext = createContext<ActionGuideContextType | undefined>(undefined);

export const useActionGuide = () => {
  const context = useContext(ActionGuideContext);
  if (!context) {
    throw new Error('useActionGuide must be used within an ActionGuideProvider');
  }
  return context;
};

interface ActionGuideProviderProps {
  children: ReactNode;
}

export const ActionGuideProvider: React.FC<ActionGuideProviderProps> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentGuide, setCurrentGuide] = useState<ActionGuide | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [completedActions, setCompletedActions] = useState<string[]>(() => {
    const stored = localStorage.getItem('capitalum_completed_actions');
    return stored ? JSON.parse(stored) : [];
  });
  const [pendingActions, setPendingActions] = useState<string[]>(() => {
    const stored = localStorage.getItem('capitalum_pending_actions');
    return stored ? JSON.parse(stored) : [];
  });
  const [profile, setProfile] = useState<UserProfile | null>(null);

  const openGuide = useCallback((guide: ActionGuide, userProfile?: UserProfile | null) => {
    setCurrentGuide(guide);
    setCurrentStep(0);
    setProfile(userProfile || null);
    setIsOpen(true);
  }, []);

  const closeGuide = useCallback(() => {
    setIsOpen(false);
    setTimeout(() => {
      setCurrentGuide(null);
      setCurrentStep(0);
    }, 300);
  }, []);

  const nextStep = useCallback(() => {
    if (currentGuide && currentStep < currentGuide.steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    }
  }, [currentGuide, currentStep]);

  const prevStep = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  }, [currentStep]);

  const goToStep = useCallback((step: number) => {
    if (currentGuide && step >= 0 && step < currentGuide.steps.length) {
      setCurrentStep(step);
    }
  }, [currentGuide]);

  const markActionCompleted = useCallback((actionId: string) => {
    setCompletedActions(prev => {
      if (prev.includes(actionId)) return prev;
      const updated = [...prev, actionId];
      localStorage.setItem('capitalum_completed_actions', JSON.stringify(updated));
      return updated;
    });
    setPendingActions(prev => {
      const updated = prev.filter(id => id !== actionId);
      localStorage.setItem('capitalum_pending_actions', JSON.stringify(updated));
      return updated;
    });
  }, []);

  const markActionPending = useCallback((actionId: string) => {
    setPendingActions(prev => {
      if (prev.includes(actionId)) return prev;
      const updated = [...prev, actionId];
      localStorage.setItem('capitalum_pending_actions', JSON.stringify(updated));
      return updated;
    });
  }, []);

  const isActionCompleted = useCallback((actionId: string) => {
    return completedActions.includes(actionId);
  }, [completedActions]);

  const isActionPending = useCallback((actionId: string) => {
    return pendingActions.includes(actionId);
  }, [pendingActions]);

  return (
    <ActionGuideContext.Provider
      value={{
        isOpen,
        currentGuide,
        currentStep,
        completedActions,
        pendingActions,
        profile,
        openGuide,
        closeGuide,
        nextStep,
        prevStep,
        goToStep,
        markActionCompleted,
        markActionPending,
        isActionCompleted,
        isActionPending,
      }}
    >
      {children}
    </ActionGuideContext.Provider>
  );
};
