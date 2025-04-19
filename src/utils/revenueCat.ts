
import { Purchases, PurchasesPackage, PurchasesOfferings, CustomerInfo, PurchasesConfiguration } from '@revenuecat/purchases-capacitor';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

let isInitialized = false;
const isCapacitorAvailable = typeof Purchases !== 'undefined';

/**
 * Gets the RevenueCat public key from Supabase edge function
 */
async function getRevenueCatKey(): Promise<string> {
  try {
    console.log("Fetching RevenueCat key from Supabase function...");
    const { data, error } = await supabase.functions.invoke('revenuecat-config');
    
    if (error) {
      console.error("Supabase function error:", error);
      throw new Error(`Failed to invoke revenuecat-config: ${error.message}`);
    }
    
    if (!data?.publicKey) {
      console.error("No public key in response:", data);
      throw new Error('RevenueCat public key not found in response');
    }
    
    console.log("Successfully retrieved RevenueCat key");
    return data.publicKey;
  } catch (error) {
    console.error("Error in getRevenueCatKey:", error);
    throw new Error(`Unable to fetch RevenueCat key: ${error.message}`);
  }
}

/**
 * Initializes the purchases module with the RevenueCat key from Supabase
 * In web environments, this will not throw an error but will mark as initialized with a warning log
 */
export const initializePurchases = async (userId?: string): Promise<void> => {
  if (isInitialized) {
    console.log('RevenueCat already initialized');
    return;
  }

  // For web environment, just mark as initialized and return
  if (!isCapacitorAvailable) {
    console.log('RevenueCat Capacitor plugin not available in this environment - web mode enabled');
    isInitialized = true;
    return;
  }

  try {
    const publicKey = await getRevenueCatKey();
    const config: PurchasesConfiguration = {
      apiKey: publicKey,
      ...(userId && { appUserID: userId })
    };

    await Purchases.configure(config);
    isInitialized = true;
    console.log('RevenueCat initialized successfully');
  } catch (error) {
    console.error('Failed to initialize RevenueCat:', error);
    // Mark as initialized anyway to prevent further initialization attempts
    isInitialized = true;
    
    // Only show the error toast in Capacitor environments where RevenueCat is expected to work
    if (isCapacitorAvailable) {
      toast({
        title: "Error",
        description: "Failed to initialize payment system. Please try again later.",
        variant: "destructive",
      });
    }
  }
};

/**
 * Checks if RevenueCat is initialized and available
 */
export const isRevenueCatAvailable = (): boolean => {
  return isCapacitorAvailable && isInitialized;
};

/**
 * Get available offerings
 * Returns demo packages in web environment
 */
export const getOfferings = async (): Promise<PurchasesPackage[]> => {
  // In web environment, return demo packages
  if (!isCapacitorAvailable) {
    console.log('Web environment detected, returning demo packages');
    
    // Demo packages for web environment
    // Using type casting to make TypeScript happy while providing test data
    const demoPackages = [
      {
        identifier: 'monthly',
        packageType: 'MONTHLY',
        product: {
          identifier: 'premium_monthly',
          title: 'Monthly Premium',
          description: 'Unlimited style scans and personalized tips',
          price: 4.99,
          priceString: '$4.99/month',
          currencyCode: 'USD',
          subscriptionPeriod: 'P1M'
        },
        offering: 'default',
        offeringIdentifier: 'default',
        presentedOfferingContext: {},
      },
      {
        identifier: 'yearly',
        packageType: 'ANNUAL',
        product: {
          identifier: 'premium_yearly',
          title: 'Annual Premium',
          description: 'Our best value plan with additional perks',
          price: 39.99,
          priceString: '$39.99/year',
          currencyCode: 'USD',
          subscriptionPeriod: 'P1Y'
        },
        offering: 'default',
        offeringIdentifier: 'default',
        presentedOfferingContext: {},
      }
    ] as unknown as PurchasesPackage[];
    
    return demoPackages;
  }
  
  // For mobile environments, use the actual RevenueCat SDK
  if (!isInitialized) {
    console.log('RevenueCat not initialized, initializing now...');
    await initializePurchases();
  }
  
  try {
    const offerings = await Purchases.getOfferings();
    const packages = offerings?.current?.availablePackages || [];
    console.log('RevenueCat offerings retrieved:', packages.length);
    return packages;
  } catch (error) {
    console.error('Failed to get offerings:', error);
    toast({
      title: "Error",
      description: "Failed to load subscription options. Please try again.",
      variant: "destructive",
    });
    return [];
  }
};

/**
 * Purchase a package
 */
export const purchasePackage = async (pkg: PurchasesPackage): Promise<CustomerInfo | null> => {
  if (!isRevenueCatAvailable()) {
    console.log('RevenueCat not available or not initialized');
    toast({
      title: "Feature Not Available",
      description: "Purchases are only available in the mobile app.",
      variant: "destructive",
    });
    return null;
  }
  
  try {
    const { customerInfo } = await Purchases.purchasePackage({ aPackage: pkg });
    return customerInfo;
  } catch (error) {
    console.error('Failed to purchase package:', error);
    toast({
      title: "Purchase Failed",
      description: error.message || "Failed to complete purchase. Please try again.",
      variant: "destructive",
    });
    return null;
  }
};

/**
 * Get customer info
 */
export const getCustomerInfo = async (): Promise<CustomerInfo | null> => {
  if (!isRevenueCatAvailable()) {
    console.log('RevenueCat not available or not initialized');
    return null;
  }
  
  try {
    const { customerInfo } = await Purchases.getCustomerInfo();
    return customerInfo;
  } catch (error) {
    console.error('Failed to get customer info:', error);
    return null;
  }
};

/**
 * Check if user has active subscription
 */
export const hasActiveSubscription = async (): Promise<boolean> => {
  if (!isRevenueCatAvailable()) {
    console.log('RevenueCat not available or not initialized');
    return false;
  }
  
  try {
    const { customerInfo } = await Purchases.getCustomerInfo();
    return Object.keys(customerInfo.entitlements.active).length > 0;
  } catch (error) {
    console.error('Failed to check subscription status:', error);
    return false;
  }
};

export type { PurchasesPackage };
