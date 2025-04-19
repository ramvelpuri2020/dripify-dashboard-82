import { Purchases, PurchasesPackage, PurchasesOfferings } from '@revenuecat/purchases-capacitor';

// Placeholder file for RevenueCat functionality
// This is a stub file that provides the necessary exports to prevent build errors
// Browser-only implementation without actual Capacitor functionality

/**
 * Initializes the purchases module (stub implementation for browser)
 */
export const initializePurchases = async (userId: string) => {
  try {
    await Purchases.configure({
      apiKey: import.meta.env.VITE_REVENUECAT_API_KEY,
      appUserID: userId,
    });
    console.log('RevenueCat initialized successfully');
  } catch (error) {
    console.error('Failed to initialize RevenueCat:', error);
    throw error;
  }
};

/**
 * Stub implementation for purchasing a product
 */
export const purchaseProduct = async (productId: string): Promise<boolean> => {
  console.log(`Purchase of product ${productId} skipped - browser environment detected`);
  return Promise.resolve(false);
};

/**
 * Stub implementation for restoring purchases
 */
export const restorePurchases = async () => {
  try {
    const { customerInfo } = await Purchases.restorePurchases();
    return customerInfo;
  } catch (error) {
    console.error('Failed to restore purchases:', error);
    throw error;
  }
};

// Get available offerings
export const getOfferings = async (): Promise<PurchasesOfferings> => {
  try {
    const offerings = await Purchases.getOfferings();
    return offerings;
  } catch (error) {
    console.error('Failed to get offerings:', error);
    throw error;
  }
};

// Purchase a package
export const purchasePackage = async (pkg: PurchasesPackage) => {
  try {
    const { customerInfo } = await Purchases.purchasePackage({ aPackage: pkg });
    return customerInfo;
  } catch (error) {
    console.error('Failed to purchase package:', error);
    throw error;
  }
};

// Get customer info
export const getCustomerInfo = async () => {
  try {
    const { customerInfo } = await Purchases.getCustomerInfo();
    return customerInfo;
  } catch (error) {
    console.error('Failed to get customer info:', error);
    throw error;
  }
};

// Check if user has active subscription
export const hasActiveSubscription = async (): Promise<boolean> => {
  try {
    const { customerInfo } = await Purchases.getCustomerInfo();
    return Object.keys(customerInfo.entitlements.active).length > 0;
  } catch (error) {
    console.error('Failed to check subscription status:', error);
    return false;
  }
};
