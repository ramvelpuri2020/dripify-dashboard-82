
import { Purchases, PurchasesOffering, CustomerInfo, PACKAGE_TYPE } from '@revenuecat/purchases-capacitor';

// Subscription plans
export const SUBSCRIPTION_PLANS = {
  MONTHLY: 'monthly_plan',
  ANNUAL: 'annual_plan', 
  LIFETIME: 'lifetime_plan'
};

// Initialize RevenueCat with your API key
export const initializeRevenueCat = async () => {
  try {
    await Purchases.configure({
      apiKey: 'YOUR_REVENUECAT_API_KEY', // Replace with your actual API key
      appUserID: null, // Will use anonymous ID initially
    });
    console.log('RevenueCat initialized successfully');
    return true;
  } catch (error) {
    console.error('Error initializing RevenueCat:', error);
    return false;
  }
};

// Get available offerings
export const getOfferings = async (): Promise<PurchasesOffering | null> => {
  try {
    const offerings = await Purchases.getOfferings();
    return offerings.current;
  } catch (error) {
    console.error('Error getting offerings:', error);
    return null;
  }
};

// Make a purchase
export const purchasePackage = async (packageToPurchase: any) => {
  try {
    const { customerInfo } = await Purchases.purchasePackage({
      aPackage: packageToPurchase,
    });
    return customerInfo;
  } catch (error: any) {
    // Check if user canceled
    if (error.userCancelled) {
      console.log('User cancelled purchase');
      return null;
    }
    console.error('Error purchasing package:', error);
    throw error;
  }
};

// Restore purchases
export const restorePurchases = async (): Promise<CustomerInfo> => {
  try {
    const { customerInfo } = await Purchases.restorePurchases();
    return customerInfo;
  } catch (error) {
    console.error('Error restoring purchases:', error);
    throw error;
  }
};

// Check subscription status
export const checkSubscriptionStatus = async () => {
  try {
    const { customerInfo } = await Purchases.getCustomerInfo();
    return {
      isPremium: customerInfo.entitlements.active['premium'] !== undefined,
      customerInfo
    };
  } catch (error) {
    console.error('Error checking subscription status:', error);
    return { isPremium: false, customerInfo: null };
  }
};

// Login identified user
export const loginUser = async (userId: string) => {
  try {
    const { customerInfo } = await Purchases.logIn({ appUserID: userId });
    return customerInfo;
  } catch (error) {
    console.error('Error logging in with RevenueCat:', error);
    throw error;
  }
};

// Logout user
export const logoutUser = async () => {
  try {
    const { customerInfo } = await Purchases.logOut();
    return customerInfo;
  } catch (error) {
    console.error('Error logging out with RevenueCat:', error);
    throw error;
  }
};
