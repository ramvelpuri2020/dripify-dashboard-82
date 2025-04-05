
// Import the proper types and packages
import { Capacitor } from '@capacitor/core';
import Purchases from "@revenuecat/purchases-capacitor";

/**
 * Initialize the RevenueCat SDK.
 * This function will be called when the app starts.
 */
export async function initializeRevenueCat() {
  try {
    // Check if we're on a native platform (iOS or Android)
    const isNative = Capacitor.isNativePlatform();
    
    if (!isNative) {
      console.info('RevenueCat is not supported on web. Using simulation mode.');
      return false;
    }
    
    // Configure RevenueCat with the API key
    // We dynamically set the API key based on the platform
    const apiKey = Capacitor.getPlatform() === 'ios' 
      ? 'appl_yourAppleAPIKey' 
      : 'goog_yourGoogleAPIKey';

    // Configure RevenueCat SDK
    await Purchases.setLogLevel({ level: 'debug' });
    
    // Setup the SDK with the API key
    await Purchases.configure({
      apiKey,
      appUserID: null, // Let RC handle user IDs for now
    });
    
    console.log('RevenueCat initialized successfully');
    return true;
  } catch (error) {
    console.error('Error initializing RevenueCat:', error);
    return false;
  }
}

/**
 * Get the current user's subscription info
 */
export async function getSubscriptionStatus() {
  try {
    // Check if we're on a native platform (iOS or Android)
    const isNative = Capacitor.isNativePlatform();
    
    if (!isNative) {
      // Simulate a subscription for web development
      return {
        isPro: false,
        expirationDate: null,
        isLifetime: false
      };
    }
    
    // Get the user's current subscription info
    const { customerInfo } = await Purchases.getCustomerInfo();
    
    // Check if user has an active subscription
    const isPro = customerInfo?.entitlements?.active?.['pro'] !== undefined;
    
    // Get expiration date
    const expirationMs = customerInfo?.entitlements?.active?.['pro']?.expiresDate 
      ? parseInt(customerInfo.entitlements.active['pro'].expiresDate) 
      : null;
    
    const expirationDate = expirationMs ? new Date(expirationMs) : null;
    
    // Check if this is a lifetime purchase
    const isLifetime = customerInfo?.nonSubscriptionTransactions?.some(
      transaction => transaction.productIdentifier === 'lifetime_pro'
    ) || false;
    
    return {
      isPro,
      expirationDate,
      isLifetime
    };
  } catch (error) {
    console.error('Error getting subscription status:', error);
    return {
      isPro: false,
      expirationDate: null,
      isLifetime: false
    };
  }
}
