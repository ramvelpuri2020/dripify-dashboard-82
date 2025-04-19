import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { getOfferings, purchasePackage } from '@/utils/revenueCat';
import { PurchasesPackage } from '@revenuecat/purchases-capacitor';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

export const Auth: React.FC = () => {
  const navigate = useNavigate();
  const { isSubscribed, isLoading: isSubscriptionLoading } = useSubscription();
  const [offerings, setOfferings] = useState<PurchasesPackage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSubscriptions, setShowSubscriptions] = useState(false);

  const handleSignIn = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
        },
      });
      
      if (error) throw error;
      setShowSubscriptions(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to sign in');
    }
  };

  useEffect(() => {
    const loadOfferings = async () => {
      if (!showSubscriptions) return;
      
      try {
        const offerings = await getOfferings();
        if (offerings.current?.availablePackages) {
          setOfferings(offerings.current.availablePackages);
        }
      } catch (err) {
        setError('Failed to load subscription options');
        console.error(err);
      }
    };

    loadOfferings();
  }, [showSubscriptions]);

  const handlePurchase = async (packageToPurchase: PurchasesPackage) => {
    try {
      setIsLoading(true);
      setError(null);
      await purchasePackage(packageToPurchase);
      navigate('/');
    } catch (err) {
      setError('Failed to complete purchase. Please try again.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  if (isSubscriptionLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (isSubscribed) {
    navigate('/');
    return null;
  }

  if (!showSubscriptions) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
              Sign in to your account
            </h2>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative" role="alert">
              <span className="block sm:inline">{error}</span>
            </div>
          )}

          <Button
            onClick={handleSignIn}
            className="w-full"
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              'Sign in with Google'
            )}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Choose Your Plan
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Select a subscription plan to get started
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative" role="alert">
            <span className="block sm:inline">{error}</span>
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          {offerings.map((pkg) => (
            <Card key={pkg.identifier} className="flex flex-col">
              <CardHeader>
                <CardTitle>{pkg.product.title}</CardTitle>
                <CardDescription>{pkg.product.description}</CardDescription>
              </CardHeader>
              <CardContent className="flex-grow">
                <div className="text-2xl font-bold">
                  {pkg.product.priceString}
                </div>
                <div className="text-sm text-gray-500">
                  {pkg.product.subscriptionPeriod}
                </div>
              </CardContent>
              <CardFooter>
                <Button
                  onClick={() => handlePurchase(pkg)}
                  disabled={isLoading}
                  className="w-full"
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    'Subscribe'
                  )}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Auth;
