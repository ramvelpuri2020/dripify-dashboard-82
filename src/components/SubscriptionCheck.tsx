
import { useEffect } from 'react';
import { useSubscription } from '@/hooks/useSubscription';
import { useToast } from '@/hooks/use-toast';

interface SubscriptionCheckProps {
  children: React.ReactNode;
}

export const SubscriptionCheck: React.FC<SubscriptionCheckProps> = ({ children }) => {
  const { isPremium, isInitialized, isLoading } = useSubscription();
  const { toast } = useToast();
  
  useEffect(() => {
    if (isInitialized && !isLoading && !isPremium) {
      // This is optional - you can show a toast to non-premium users
      toast({
        title: "Free Plan",
        description: "Upgrade to Premium for unlimited features",
        duration: 5000,
      });
    }
  }, [isInitialized, isLoading, isPremium, toast]);
  
  return <>{children}</>;
};
