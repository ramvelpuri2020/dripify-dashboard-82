import React, { createContext, useContext, useEffect, useState } from 'react';
import { CustomerInfo } from '@revenuecat/purchases-capacitor';
import { 
  initializePurchases, 
  getCustomerInfo, 
  isSubscribed,
  logout as revenueCatLogout
} from '@/utils/revenueCat';
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

export const SubscriptionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshSubscription = async () => {
    try {
      setIsLoading(true);
      const info = await getCustomerInfo();
      setCustomerInfo(info);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to refresh subscription');
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await revenueCatLogout();
      setCustomerInfo(null);
    } catch (err) {
      console.error('Failed to logout from RevenueCat:', err);
    }
  };

  useEffect(() => {
    const setupSubscription = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          await initializePurchases(session.user.id);
          await refreshSubscription();
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to setup subscription');
      }
    };

    setupSubscription();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        await initializePurchases(session.user.id);
        await refreshSubscription();
      } else if (event === 'SIGNED_OUT') {
        await logout();
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const value = {
    isSubscribed: customerInfo ? isSubscribed(customerInfo) : false,
    customerInfo,
    isLoading,
    error,
    refreshSubscription,
    logout
  };

  return (
    <SubscriptionContext.Provider value={value}>
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