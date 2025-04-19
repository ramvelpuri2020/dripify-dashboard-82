import { Purchases, CustomerInfo, PurchasesPackage, PurchasesOfferings } from '@revenuecat/purchases-capacitor';

const REVENUECAT_API_KEY = import.meta.env.VITE_REVENUECAT_API_KEY;

if (!REVENUECAT_API_KEY) {
  throw new Error('RevenueCat API key is not configured. Please set VITE_REVENUECAT_API_KEY in your environment variables.');
}

export const initializePurchases = async (userId?: string): Promise<void> => {
  try {
    await Purchases.configure({
      apiKey: REVENUECAT_API_KEY,
      appUserID: userId,
    });
    console.log('RevenueCat initialized successfully');
  } catch (error) {
    console.error('Failed to initialize RevenueCat:', error);
    throw error;
  }
};

export const getOfferings = async (): Promise<PurchasesOfferings> => {
  try {
    const offerings = await Purchases.getOfferings();
    return offerings;
  } catch (error) {
    console.error('Failed to get offerings:', error);
    throw error;
  }
};

export const purchasePackage = async (pkg: PurchasesPackage): Promise<CustomerInfo> => {
  try {
    const { customerInfo } = await Purchases.purchasePackage({ aPackage: pkg });
    return customerInfo;
  } catch (error) {
    console.error('Failed to purchase package:', error);
    throw error;
  }
};

export const restorePurchases = async (): Promise<CustomerInfo> => {
  try {
    const { customerInfo } = await Purchases.restorePurchases();
    return customerInfo;
  } catch (error) {
    console.error('Failed to restore purchases:', error);
    throw error;
  }
};

export const getCustomerInfo = async (): Promise<CustomerInfo> => {
  try {
    const { customerInfo } = await Purchases.getCustomerInfo();
    return customerInfo;
  } catch (error) {
    console.error('Failed to get customer info:', error);
    throw error;
  }
};

export const isSubscribed = (customerInfo: CustomerInfo): boolean => {
  return customerInfo.entitlements.active['premium'] !== undefined;
};

export const logout = async (): Promise<void> => {
  try {
    await Purchases.logOut();
  } catch (error) {
    console.error('Failed to logout from RevenueCat:', error);
    throw error;
  }
};
