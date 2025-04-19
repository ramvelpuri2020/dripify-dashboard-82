
import { Purchases, PurchasesPackage, PurchasesOfferings, CustomerInfo } from '@revenuecat/purchases-capacitor';
import { supabase } from "@/integrations/supabase/client";

let isInitialized = false;

/**
 * Gets the RevenueCat public key from Supabase edge function
 */
async function getRevenueCatKey(): Promise<string> {
  const { data, error } = await supabase.functions.invoke('revenuecat-config');
  if (error || !data?.publicKey) {
    throw new Error('Unable to fetch RevenueCat key');
  }
  return data.publicKey;
}

/**
 * Initializes the purchases module with the RevenueCat key from Supabase
 */
export const initializePurchases = async (userId: string): Promise<void> => {
  if (isInitialized) {
    console.log('RevenueCat already initialized');
    return;
  }

  try {
    const publicKey = await getRevenueCatKey();
    await Purchases.configure({
      apiKey: publicKey,
      appUserID: userId,
    });
    isInitialized = true;
    console.log('RevenueCat initialized successfully');
  } catch (error) {
    console.error('Failed to initialize RevenueCat:', error);
    throw error;
  }
};

/**
 * Checks if RevenueCat is initialized
 */
export const checkInitialization = () => {
  if (!isInitialized) {
    throw new Error('RevenueCat not initialized. Call initializePurchases first.');
  }
};

/**
 * Get available offerings
 */
export const getOfferings = async (): Promise<PurchasesOfferings> => {
  checkInitialization();
  try {
    const offerings = await Purchases.getOfferings();
    return offerings;
  } catch (error) {
    console.error('Failed to get offerings:', error);
    throw error;
  }
};

/**
 * Purchase a package
 */
export const purchasePackage = async (pkg: PurchasesPackage): Promise<CustomerInfo> => {
  checkInitialization();
  try {
    const { customerInfo } = await Purchases.purchasePackage({ aPackage: pkg });
    return customerInfo;
  } catch (error) {
    console.error('Failed to purchase package:', error);
    throw error;
  }
};

/**
 * Get customer info
 */
export const getCustomerInfo = async (): Promise<CustomerInfo> => {
  checkInitialization();
  try {
    const { customerInfo } = await Purchases.getCustomerInfo();
    return customerInfo;
  } catch (error) {
    console.error('Failed to get customer info:', error);
    throw error;
  }
};

/**
 * Check if user has active subscription
 */
export const hasActiveSubscription = async (): Promise<boolean> => {
  checkInitialization();
  try {
    const { customerInfo } = await Purchases.getCustomerInfo();
    return Object.keys(customerInfo.entitlements.active).length > 0;
  } catch (error) {
    console.error('Failed to check subscription status:', error);
    return false;
  }
};

/**
 * Restore purchases
 */
export const restorePurchases = async (): Promise<CustomerInfo> => {
  checkInitialization();
  try {
    const { customerInfo } = await Purchases.restorePurchases();
    return customerInfo;
  } catch (error) {
    console.error('Failed to restore purchases:', error);
    throw error;
  }
};
