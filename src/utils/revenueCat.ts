
// Placeholder file for RevenueCat functionality
// This is a stub file that provides the necessary exports to prevent build errors
// Browser-only implementation without actual Capacitor functionality

/**
 * Initializes the purchases module (stub implementation for browser)
 */
export const initializePurchases = async (): Promise<void> => {
  console.log('RevenueCat initialization skipped - browser environment detected');
  return Promise.resolve();
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
export const restorePurchases = async (): Promise<void> => {
  console.log('Restore purchases skipped - browser environment detected');
  return Promise.resolve();
};
