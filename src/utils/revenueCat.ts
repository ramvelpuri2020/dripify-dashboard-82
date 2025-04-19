import { Purchases } from '@revenuecat/purchases-capacitor';

const REVENUECAT_PUBLIC_API_KEY = 'YOUR_REVENUECAT_PUBLIC_API_KEY';

export const initializePurchases = async (): Promise<void> => {
  try {
    await Purchases.configure({
      apiKey: REVENUECAT_PUBLIC_API_KEY,
      appUserID: null // RevenueCat will generate a user ID
    });
    
    console.log('RevenueCat initialized successfully');
  } catch (error) {
    console.error('Error initializing RevenueCat:', error);
  }
};

export const getOfferings = async () => {
  try {
    const offerings = await Purchases.getOfferings();
    return offerings.current;
  } catch (error) {
    console.error('Error fetching offerings:', error);
    return null;
  }
};

export const purchasePackage = async (packageToPurchase: any) => {
  try {
    const { customerInfo } = await Purchases.purchasePackage({ 
      package: packageToPurchase 
    });
    return customerInfo.entitlements.active;
  } catch (error) {
    console.error('Error making purchase:', error);
    throw error;
  }
};

export const checkSubscriptionStatus = async () => {
  try {
    const { customerInfo } = await Purchases.getCustomerInfo();
    return customerInfo.entitlements.active;
  } catch (error) {
    console.error('Error checking subscription:', error);
    return {};
  }
};

export const restorePurchases = async () => {
  try {
    const { customerInfo } = await Purchases.restorePurchases();
    return customerInfo.entitlements.active;
  } catch (error) {
    console.error('Error restoring purchases:', error);
    return {};
  }
};
