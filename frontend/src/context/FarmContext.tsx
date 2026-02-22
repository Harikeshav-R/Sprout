import { createContext, useContext, useState, type ReactNode } from 'react';

export interface FarmProfile {
  farmName: string;
  website: string;
  zipCode: string;
  city: string;
  state: string;
  county: string;
  farmOfferings: string;
}

interface FarmProfileContextValue {
  profile: FarmProfile;
  setProfile: (profile: FarmProfile) => void;
  updateProfile: (partial: Partial<FarmProfile>) => void;
}

const defaultProfile: FarmProfile = {
  farmName: '',
  website: '',
  zipCode: '',
  city: '',
  state: '',
  county: '',
  farmOfferings: 'organic produce',
};

const FarmProfileContext = createContext<FarmProfileContextValue | null>(null);

export function FarmProfileProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<FarmProfile>(defaultProfile);

  const updateProfile = (partial: Partial<FarmProfile>) => {
    setProfile((prev) => ({ ...prev, ...partial }));
  };

  return (
    <FarmProfileContext.Provider value={{ profile, setProfile, updateProfile }}>
      {children}
    </FarmProfileContext.Provider>
  );
}

export function useFarmProfile(): FarmProfileContextValue {
  const ctx = useContext(FarmProfileContext);
  if (!ctx) {
    throw new Error('useFarmProfile must be used within a FarmProfileProvider');
  }
  return ctx;
}
