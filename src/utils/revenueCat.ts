
import { Capacitor } from '@capacitor/core';
import * as Purchases from '@revenuecat/purchases-capacitor';

const isNativePlatform = () => {
  return Capacitor.isNativePlatform() && (Capacitor.getPlatform() === 'ios' || Capacitor.getPlatform() === 'android');
};

// Initialize RevenueCat with your public API key
export const initializeRevenueCat = async () => {
  try {
    if (!isNativePlatform()) {
      console.info('RevenueCat is not supported on web. Using simulation mode.');
      return;
    }

    // Set up RevenueCat
    const purchasesConfiguration = {
      apiKey: 'your_api_key_here', // API key placeholder
      observerMode: false
    };

    await Purchases.PurchasesPlugin.configure(purchasesConfiguration);
    console.log('RevenueCat initialized successfully');
  } catch (error) {
    console.error('Error initializing RevenueCat:', error);
  }
};

// Get current customer info
export const getCustomerInfo = async () => {
  try {
    if (!isNativePlatform()) {
      return {
        customerInfo: {
          entitlements: {
            active: {},
            all: {}
          }
        }
      };
    }

    const customerInfo = await Purchases.PurchasesPlugin.getCustomerInfo();
    return customerInfo;
  } catch (error) {
    console.error('Error getting customer info:', error);
    throw error;
  }
};

// Check if user has an active subscription
export const hasActiveSubscription = async () => {
  try {
    if (!isNativePlatform()) {
      // In web, return false or a simulation value
      return false;
    }

    const customerInfo = await getCustomerInfo();
    return Object.keys(customerInfo.customerInfo.entitlements.active).length > 0;
  } catch (error) {
    console.error('Error checking subscription status:', error);
    return false;
  }
};

// Purchase a package
export const purchasePackage = async (packageIdentifier: string) => {
  try {
    if (!isNativePlatform()) {
      console.info('Purchase function not available on web');
      return {
        customerInfo: {
          entitlements: {
            active: {},
            all: {}
          }
        }
      };
    }

    const options = {
      packageIdentifier: packageIdentifier,
    };
    
    const purchaseResult = await Purchases.PurchasesPlugin.purchasePackage(options);
    return purchaseResult;
  } catch (error) {
    console.error('Error making purchase:', error);
    throw error;
  }
};

// Get available packages
export const getOfferings = async () => {
  try {
    if (!isNativePlatform()) {
      // Return mock data for web
      return {
        current: {
          identifier: 'standard',
          availablePackages: [
            {
              identifier: 'monthly',
              product: {
                price: 9.99,
                priceString: '$9.99',
                title: 'Monthly Subscription'
              }
            },
            {
              identifier: 'annual',
              product: {
                price: 99.99,
                priceString: '$99.99',
                title: 'Annual Subscription'
              }
            }
          ]
        }
      };
    }
    
    const offerings = await Purchases.PurchasesPlugin.getOfferings();
    return offerings.current;
  } catch (error) {
    console.error('Error getting offerings:', error);
    throw error;
  }
};

// Restore purchases
export const restorePurchases = async () => {
  try {
    if (!isNativePlatform()) {
      console.info('Restore purchases function not available on web');
      return {
        customerInfo: {
          entitlements: {
            active: {},
            all: {}
          }
        }
      };
    }
    
    const restoreResult = await Purchases.PurchasesPlugin.restorePurchases();
    return restoreResult;
  } catch (error) {
    console.error('Error restoring purchases:', error);
    throw error;
  }
};
