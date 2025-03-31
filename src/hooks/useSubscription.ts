
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
import { Capacitor } from '@capacitor/core';

export const useSubscription = () => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentOffering, setCurrentOffering] = useState<PurchasesOffering | null>(null);
  const [isPremium, setIsPremium] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Check if running on web or native platform
  const isNativePlatform = Capacitor.isNativePlatform();

  // Initialize RevenueCat
  useEffect(() => {
    const initialize = async () => {
      try {
        setIsLoading(true);
        
        // Skip initialization if not on native platform
        if (!isNativePlatform) {
          console.log("Web environment detected, skipping RevenueCat initialization");
          setIsInitialized(false);
          setIsPremium(false);
          setIsLoading(false);
          return;
        }
        
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
        console.error("Subscription initialization error:", err);
        // Don't treat as error on web platforms
        if (isNativePlatform) {
          setError('Failed to initialize subscription service');
        }
        // Set default values since RevenueCat failed
        setIsPremium(false);
      } finally {
        setIsLoading(false);
      }
    };

    initialize();
  }, [isNativePlatform]);

  // Purchase a package
  const purchase = async (packageToPurchase: any) => {
    try {
      // If not on native platform, simulate successful purchase
      if (!isNativePlatform) {
        console.log("Web environment detected, simulating purchase");
        setIsPremium(true);
        return { isPremium: true };
      }
      
      setIsLoading(true);
      const customerInfo = await purchasePackage(packageToPurchase);
      
      if (customerInfo) {
        // Check if the purchase was successful
        const { isPremium: premium } = await checkSubscriptionStatus();
        setIsPremium(premium);
      }
      
      return customerInfo;
    } catch (err: any) {
      console.error("Purchase error:", err);
      setError(err.message || 'Purchase failed');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Restore previous purchases
  const restore = async () => {
    try {
      // If not on native platform, simulate restore
      if (!isNativePlatform) {
        console.log("Web environment detected, simulating restore");
        return { isPremium: false };
      }
      
      setIsLoading(true);
      const customerInfo = await restorePurchases();
      
      // Update premium status after restore
      const { isPremium: premium } = await checkSubscriptionStatus();
      setIsPremium(premium);
      
      return customerInfo;
    } catch (err: any) {
      console.error("Restore error:", err);
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
