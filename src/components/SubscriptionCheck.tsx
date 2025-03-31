
import { useEffect, useState } from 'react';
import { useSubscription } from '@/hooks/useSubscription';
import { useToast } from '@/hooks/use-toast';
import { Capacitor } from '@capacitor/core';

interface SubscriptionCheckProps {
  children: React.ReactNode;
}

export const SubscriptionCheck: React.FC<SubscriptionCheckProps> = ({ children }) => {
  const { isPremium, isInitialized, isLoading, error } = useSubscription();
  const { toast } = useToast();
  const [hasShownInitialMessage, setHasShownInitialMessage] = useState(false);
  
  // Check if running on web or native
  const isNative = Capacitor.isNativePlatform();
  
  useEffect(() => {
    // Only show subscription-related notifications on native platforms
    if (!isNative) return;
    
    if (error && !hasShownInitialMessage) {
      toast({
        title: "Subscription Service",
        description: "Unable to connect to subscription service. Some features may be limited.",
        variant: "destructive",
        duration: 5000,
      });
      setHasShownInitialMessage(true);
    } else if (isInitialized && !isLoading && !isPremium && !hasShownInitialMessage) {
      toast({
        title: "Free Plan",
        description: "Upgrade to Premium for unlimited features",
        duration: 5000,
      });
      setHasShownInitialMessage(true);
    }
  }, [isInitialized, isLoading, isPremium, toast, error, hasShownInitialMessage, isNative]);
  
  return <>{children}</>;
};
