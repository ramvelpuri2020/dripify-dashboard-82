
import Purchases, { 
  CustomerInfo, 
  PurchasesConfiguration
} from '@revenuecat/purchases-capacitor';

// Simple platform detection for web vs mobile
const isMobilePlatform = (): boolean => {
  return typeof window !== 'undefined' && 
    (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent));
};

const isIOS = (): boolean => {
  return typeof window !== 'undefined' && 
    (/iPhone|iPad|iPod/i.test(navigator.userAgent));
};

export const initializePurchases = async () => {
  try {
    // Only initialize on mobile platforms
    if (!isMobilePlatform()) {
      console.log('RevenueCat: Not initializing on web platform');
      return;
    }

    const apiKey = isIOS() 
      ? import.meta.env.VITE_REVENUECAT_IOS_KEY
      : import.meta.env.VITE_REVENUECAT_ANDROID_KEY;

    if (!apiKey) {
      console.error('RevenueCat: API key not found for platform');
      return;
    }

    console.log(`RevenueCat: Initializing for ${isIOS() ? 'iOS' : 'Android'}`);

    const configuration: PurchasesConfiguration = {
      apiKey
    };

    // Using configure instead of setup as per the correct API
    await Purchases.configure(configuration);
    console.log('RevenueCat: Successfully initialized');
  } catch (error) {
    console.error('RevenueCat: Failed to initialize:', error);
  }
};

export const getCustomerInfo = async (): Promise<CustomerInfo | null> => {
  try {
    if (!isMobilePlatform()) {
      return null;
    }

    // Using the correct API format which returns { customerInfo }
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
