import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { supabase } from '@/integrations/supabase/client';

export type SpaceType = 'personal' | 'professional';

interface SpaceContextType {
  currentSpace: SpaceType;
  setCurrentSpace: (space: SpaceType) => void;
  toggleSpace: () => void;
  isPersonalSpace: boolean;
  isProfessionalSpace: boolean;
}

const SpaceContext = createContext<SpaceContextType | undefined>(undefined);

export const SpaceProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [currentSpace, setCurrentSpaceState] = useState<SpaceType>(() => {
    // Load from localStorage on init
    const saved = localStorage.getItem('capitalum-space');
    return (saved as SpaceType) || 'personal';
  });

  // Persist to localStorage
  useEffect(() => {
    localStorage.setItem('capitalum-space', currentSpace);
  }, [currentSpace]);

  const setCurrentSpace = (space: SpaceType) => {
    setCurrentSpaceState(space);
  };

  const toggleSpace = () => {
    setCurrentSpaceState(prev => prev === 'personal' ? 'professional' : 'personal');
  };

  return (
    <SpaceContext.Provider value={{
      currentSpace,
      setCurrentSpace,
      toggleSpace,
      isPersonalSpace: currentSpace === 'personal',
      isProfessionalSpace: currentSpace === 'professional',
    }}>
      {children}
    </SpaceContext.Provider>
  );
};

export const useSpace = () => {
  const context = useContext(SpaceContext);
  if (context === undefined) {
    throw new Error('useSpace must be used within a SpaceProvider');
  }
  return context;
};
