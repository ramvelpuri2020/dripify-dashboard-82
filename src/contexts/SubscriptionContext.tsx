import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { CustomerInfo } from '@revenuecat/purchases-capacitor';
import { getCustomerInfo, hasActiveSubscription } from '@/utils/revenueCat';
import { supabase } from '@/integrations/supabase/client';

interface SubscriptionContextType {
  isSubscribed: boolean;
  customerInfo: CustomerInfo | null;
  isLoading: boolean;
  error: string | null;
  refreshSubscription: () => Promise<void>;
  logout: () => Promise<void>;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export const SubscriptionProvider = ({ children }: { children: ReactNode }) => {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshSubscription = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const [hasSubscription, info] = await Promise.all([
        hasActiveSubscription(),
        getCustomerInfo(),
      ]);
      setIsSubscribed(hasSubscription);
      setCustomerInfo(info);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to refresh subscription');
      console.error('Error refreshing subscription:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
      setCustomerInfo(null);
      setIsSubscribed(false);
    } catch (err) {
      console.error('Error during logout:', err);
    }
  };

  useEffect(() => {
    refreshSubscription();
  }, []);

  return (
    <SubscriptionContext.Provider
      value={{
        isSubscribed,
        customerInfo,
        isLoading,
        error,
        refreshSubscription,
        logout,
      }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
};

export const useSubscription = () => {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
}; 