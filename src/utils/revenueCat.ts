
import Purchases, { 
  CustomerInfo, 
  PurchasesConfiguration,
  LOG_LEVEL 
} from '@revenuecat/purchases-capacitor';
import { isPlatform } from '@capacitor/core';

export const initializePurchases = async () => {
  try {
    // Only initialize on mobile platforms
    if (!isPlatform('ios') && !isPlatform('android')) {
      console.log('RevenueCat: Not initializing on web platform');
      return;
    }

    const apiKey = isPlatform('ios') 
      ? import.meta.env.VITE_REVENUECAT_IOS_KEY
      : import.meta.env.VITE_REVENUECAT_ANDROID_KEY;

    if (!apiKey) {
      console.error('RevenueCat: API key not found for platform');
      return;
    }

    console.log(`RevenueCat: Initializing for ${isPlatform('ios') ? 'iOS' : 'Android'}`);

    const configuration: PurchasesConfiguration = {
      apiKey,
      logLevel: LOG_LEVEL.DEBUG
    };

    await Purchases.configure(configuration);
    console.log('RevenueCat: Successfully initialized');
  } catch (error) {
    console.error('RevenueCat: Failed to initialize:', error);
  }
};

export const getCustomerInfo = async (): Promise<CustomerInfo | null> => {
  try {
    if (!isPlatform('ios') && !isPlatform('android')) {
      return null;
    }

    const { customerInfo } = await Purchases.getCustomerInfo();
    return customerInfo;
  } catch (error) {
    console.error('RevenueCat: Failed to get customer info:', error);
    return null;
  }
};

export const checkSubscriptionStatus = async (): Promise<boolean> => {
  try {
    const customerInfo = await getCustomerInfo();
    if (!customerInfo) return false;
    
    // Check if user has active entitlement
    return customerInfo.entitlements.active && 
           Object.keys(customerInfo.entitlements.active).length > 0;
  } catch (error) {
    console.error('RevenueCat: Failed to check subscription status:', error);
    return false;
  }
};
