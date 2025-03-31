
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { 
  initializeRevenueCat,
  getOfferings,
  purchasePackage,
  restorePurchases,
  checkSubscriptionStatus,
  loginUser
} from '@/services/revenuecat';
import { PurchasesOffering } from '@revenuecat/purchases-capacitor';

export const useSubscription = () => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentOffering, setCurrentOffering] = useState<PurchasesOffering | null>(null);
  const [isPremium, setIsPremium] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize RevenueCat
  useEffect(() => {
    const initialize = async () => {
      try {
        setIsLoading(true);
        const initialized = await initializeRevenueCat();
        setIsInitialized(initialized);

        // Get the current user and log them in if they exist
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await loginUser(user.id);
        }

        // Get subscription status
        const { isPremium: premium } = await checkSubscriptionStatus();
        setIsPremium(premium);

        // Load offerings
        const offerings = await getOfferings();
        setCurrentOffering(offerings);
      } catch (err) {
        setError('Failed to initialize subscription service');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    initialize();
  }, []);

  // Purchase a package
  const purchase = async (packageToPurchase: any) => {
    try {
      setIsLoading(true);
      const customerInfo = await purchasePackage(packageToPurchase);
      
      if (customerInfo) {
        // Check if the purchase was successful
        const { isPremium: premium } = await checkSubscriptionStatus();
        setIsPremium(premium);
      }
      
      return customerInfo;
    } catch (err: any) {
      setError(err.message || 'Purchase failed');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Restore previous purchases
  const restore = async () => {
    try {
      setIsLoading(true);
      const customerInfo = await restorePurchases();
      
      // Update premium status after restore
      const { isPremium: premium } = await checkSubscriptionStatus();
      setIsPremium(premium);
      
      return customerInfo;
    } catch (err: any) {
      setError(err.message || 'Failed to restore purchases');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isInitialized,
    isLoading,
    isPremium,
    currentOffering,
    error,
    purchase,
    restore
  };
};
