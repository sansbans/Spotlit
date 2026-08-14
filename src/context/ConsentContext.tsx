import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from './AuthContext';
import { RESEARCH_POLICY_VERSION } from '@/constants/consent';

interface ConsentContextValue {
  loading: boolean;
  // null = user has never made a decision yet (should see the consent screen)
  researchOptIn: boolean | null;
  policyVersion: string | null;
  setResearchOptIn: (optIn: boolean) => Promise<void>;
  refresh: () => Promise<void>;
}

const ConsentContext = createContext<ConsentContextValue | null>(null);

export function ConsentProvider({ children }: { children: React.ReactNode }) {
  const { session } = useAuth();
  const [loading, setLoading] = useState(true);
  const [researchOptIn, setResearchOptInState] = useState<boolean | null>(null);
  const [policyVersion, setPolicyVersion] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!session) {
      setResearchOptInState(null);
      setPolicyVersion(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data, error } = await supabase
      .from('current_consent')
      .select('*')
      .eq('user_id', session.user.id)
      .maybeSingle();
    if (!error && data) {
      setResearchOptInState(data.research_opt_in);
      setPolicyVersion(data.policy_version);
    } else {
      setResearchOptInState(null);
      setPolicyVersion(null);
    }
    setLoading(false);
  }, [session]);

  useEffect(() => {
    load();
  }, [load]);

  const setResearchOptIn = useCallback(
    async (optIn: boolean) => {
      if (!session) return;
      const { error } = await supabase.from('consent_records').insert({
        user_id: session.user.id,
        policy_version: RESEARCH_POLICY_VERSION,
        research_opt_in: optIn,
      });
      if (error) throw error;
      await load();
    },
    [session, load]
  );

  return (
    <ConsentContext.Provider
      value={{ loading, researchOptIn, policyVersion, setResearchOptIn, refresh: load }}
    >
      {children}
    </ConsentContext.Provider>
  );
}

export function useConsent() {
  const ctx = useContext(ConsentContext);
  if (!ctx) throw new Error('useConsent must be used within ConsentProvider');
  return ctx;
}
