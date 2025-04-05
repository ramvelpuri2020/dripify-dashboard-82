
import { Purchases, PurchasesConfiguration } from '@revenuecat/purchases-capacitor';
import { Capacitor } from '@capacitor/core';

// RevenueCat API keys
const REVENUECAT_API_KEYS = {
  apple: 'appl_YOUR_IOS_KEY_HERE',
  google: 'goog_YOUR_ANDROID_KEY_HERE',
  amazon: 'amzn_YOUR_AMAZON_KEY_HERE'
};

// Product identifiers
export const PRODUCT_IDS = {
  monthly: 'genstyle_monthly_subscription',
  freeTrial: 'genstyle_free_trial'
};

/**
 * Initialize RevenueCat SDK with proper platform configuration
 */
export const initializePurchases = async () => {
  try {
    const platform = Capacitor.getPlatform();
    let apiKey = '';

    // Get the appropriate API key for the platform
    switch (platform) {
      case 'ios':
        apiKey = REVENUECAT_API_KEYS.apple;
        break;
      case 'android':
        apiKey = REVENUECAT_API_KEYS.google;
        break;
      case 'web':
        console.log('RevenueCat is not supported on web. Using simulation mode.');
        return true;
      default:
        console.warn('Unknown platform for RevenueCat initialization');
        return false;
    }

    // Skip initialization in development web environment
    if (platform === 'web') {
      return true;
    }

    // Configure RevenueCat
    const configuration: PurchasesConfiguration = {
      apiKey,
      // Enable debug logs for development
      debugLogsEnabled: true,
      // Handle purchases across user accounts
      observerMode: false,
    };

    // Initialize the SDK
    await Purchases.configure(configuration);
    console.log('RevenueCat initialized successfully');
    return true;
  } catch (error) {
    console.error('Failed to initialize RevenueCat:', error);
    return false;
  }
};

/**
 * Get available packages for the current user
 */
export const getOfferings = async () => {
  try {
    // Skip for web platform
    if (Capacitor.getPlatform() === 'web') {
      return mockOfferings();
    }
    
    const offerings = await Purchases.getOfferings();
    return offerings;
  } catch (error) {
    console.error('Failed to get offerings:', error);
    throw error;
  }
};

/**
 * Purchase a package
 * @param packageToPurchase The package to purchase
 */
export const purchasePackage = async (productId: string) => {
  try {
    // Skip for web platform
    if (Capacitor.getPlatform() === 'web') {
      return mockPurchase(productId);
    }
    
    const offerings = await Purchases.getOfferings();
    const offering = offerings.current;
    
    if (!offering) {
      throw new Error('No offerings available');
    }
    
    const availablePackages = offering.availablePackages;
    const packageToPurchase = availablePackages.find(
      pkg => pkg.product.identifier === productId
    );
    
    if (!packageToPurchase) {
      throw new Error(`Package with id ${productId} not found`);
    }
    
    const { customerInfo } = await Purchases.purchasePackage({ 
      package: packageToPurchase 
    });
    
    return customerInfo;
  } catch (error) {
    console.error('Purchase failed:', error);
    throw error;
  }
};

/**
 * Get current customer info
 */
export const getCustomerInfo = async () => {
  try {
    // Skip for web platform
    if (Capacitor.getPlatform() === 'web') {
      return mockCustomerInfo();
    }
    
    const customerInfo = await Purchases.getCustomerInfo();
    return customerInfo;
  } catch (error) {
    console.error('Failed to get customer info:', error);
    throw error;
  }
};

/**
 * Check if user has active subscription
 */
export const hasActiveSubscription = async () => {
  try {
    // Skip for web platform
    if (Capacitor.getPlatform() === 'web') {
      return true; // For testing purposes
    }
    
    const customerInfo = await Purchases.getCustomerInfo();
    
    // Check if the user has any active subscription
    return customerInfo.entitlements.active.premium !== undefined;
  } catch (error) {
    console.error('Failed to check subscription status:', error);
    return false;
  }
};

/**
 * Restore purchases
 */
export const restorePurchases = async () => {
  try {
    // Skip for web platform
    if (Capacitor.getPlatform() === 'web') {
      return mockCustomerInfo();
    }
    
    const customerInfo = await Purchases.restorePurchases();
    return customerInfo;
  } catch (error) {
    console.error('Failed to restore purchases:', error);
    throw error;
  }
};

// Mock functions for web development
const mockOfferings = () => {
  return {
    current: {
      identifier: 'default',
      availablePackages: [
        {
          identifier: 'monthly',
          packageType: 'MONTHLY',
          product: {
            identifier: PRODUCT_IDS.monthly,
            description: 'Monthly subscription to GenStyle Premium',
            title: 'GenStyle Premium Monthly',
            price: 4.99,
            priceString: '$4.99',
            currencyCode: 'USD'
          }
        },
        {
          identifier: 'free_trial',
          packageType: 'FREE_TRIAL',
          product: {
            identifier: PRODUCT_IDS.freeTrial,
            description: '7-day free trial to GenStyle Premium',
            title: 'GenStyle Premium Trial',
            price: 0,
            priceString: 'Free',
            currencyCode: 'USD'
          }
        }
      ]
    }
  };
};

const mockPurchase = (productId: string) => {
  return {
    entitlements: {
      active: {
        premium: {
          identifier: 'premium',
          isActive: true,
          willRenew: true,
          periodType: productId === PRODUCT_IDS.freeTrial ? 'TRIAL' : 'NORMAL',
          expirationDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        }
      }
    }
  };
};

const mockCustomerInfo = () => {
  return {
    entitlements: {
      active: {
        premium: {
          identifier: 'premium',
          isActive: true,
          willRenew: true,
          periodType: 'NORMAL',
          expirationDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        }
      }
    }
  };
};
