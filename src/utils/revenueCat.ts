
// Fix the errors in this file
import { Capacitor } from '@capacitor/core';
import { 
  Purchases, 
  PurchasesOfferings, 
  PurchasesConfiguration,
  CustomerInfo
} from '@revenuecat/purchases-capacitor';

const isPlatformSupported = () => {
  const platform = Capacitor.getPlatform();
  return platform === 'ios' || platform === 'android';
};

const isRevenueCatAvailable = async (): Promise<boolean> => {
  const isSupported = isPlatformSupported();
  if (!isSupported) {
    console.log('RevenueCat is only available on iOS and Android');
    return false;
  }
  return true;
};

export const initializeRevenueCat = async (apiKey: string): Promise<boolean> => {
  try {
    const available = await isRevenueCatAvailable();
    if (!available) return false;

    // Detect platform
    const platform = Capacitor.getPlatform();
  
    // Only initialize on mobile platforms
    if (platform === "ios" || platform === "android") {
      const configuration: PurchasesConfiguration = {
        apiKey,
        observerMode: false, // Change this based on your needs
        userDefaultsSuiteName: "com.styleapp.userdefaults",
      };

      await Purchases.configure(configuration);
      console.log('RevenueCat initialized successfully');
      return true;
    } else {
      console.log('RevenueCat not initialized on web platform');
      return false;
    }
  } catch (error) {
    console.error('Failed to initialize RevenueCat:', error);
    return false;
  }
};

export const getOfferings = async (): Promise<PurchasesOfferings | null> => {
  try {
    const available = await isRevenueCatAvailable();
    if (!available) return null;

    const offerings = await Purchases.getOfferings();
    console.log('RevenueCat offerings:', offerings);
    return offerings;
  } catch (error) {
    console.error('Failed to get offerings:', error);
    return null;
  }
};

export const getCurrentUser = async (): Promise<CustomerInfo | null> => {
  try {
    const available = await isRevenueCatAvailable();
    if (!available) return null;

    const { customerInfo } = await Purchases.getCustomerInfo();
    return customerInfo;
  } catch (error) {
    console.error('Failed to get customer info:', error);
    return null;
  }
};

export const purchasePackage = async (
  packageId: string,
  offeringId: string
): Promise<CustomerInfo | null> => {
  try {
    const available = await isRevenueCatAvailable();
    if (!available) return null;

    const offerings = await Purchases.getOfferings();
    const offering = offerings.current;
    
    if (!offering) {
      console.error('No offering available');
      return null;
    }
    
    const pkg = offering.availablePackages.find(p => p.identifier === packageId);
    if (!pkg) {
      console.error('Package not found:', packageId);
      return null;
    }
    
    const { customerInfo } = await Purchases.purchasePackage({ 
      aPackage: pkg
    });
    
    return customerInfo;
  } catch (error) {
    console.error('Failed to purchase package:', error);
    return null;
  }
};

export const restorePurchases = async (): Promise<CustomerInfo | null> => {
  try {
    const available = await isRevenueCatAvailable();
    if (!available) return null;

    const { customerInfo } = await Purchases.restorePurchases();
    return customerInfo;
  } catch (error) {
    console.error('Failed to restore purchases:', error);
    return null;
  }
};

export const checkEntitlementAccess = async (
  entitlementId: string
): Promise<boolean> => {
  try {
    const available = await isRevenueCatAvailable();
    if (!available) return false;

    const { customerInfo } = await Purchases.getCustomerInfo();
    
    const entitlements = customerInfo.entitlements.active;
    return !!entitlements[entitlementId];
  } catch (error) {
    console.error('Failed to check entitlement access:', error);
    return false;
  }
};
