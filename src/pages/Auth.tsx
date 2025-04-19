import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { getOfferings, purchasePackage } from '@/utils/revenueCat';
import { PurchasesPackage } from '@revenuecat/purchases-capacitor';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

export default function Auth() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [offerings, setOfferings] = useState<PurchasesPackage[]>([]);
  const [isLoadingOfferings, setIsLoadingOfferings] = useState(true);
  const navigate = useNavigate();
  const { isSubscribed, isLoading: isSubscriptionLoading } = useSubscription();

  useEffect(() => {
    const loadOfferings = async () => {
      try {
        setIsLoadingOfferings(true);
        const offeringsData = await getOfferings();
        // Assuming you have a default offering
        const defaultOffering = offeringsData.current;
        if (defaultOffering) {
          setOfferings(defaultOffering.availablePackages);
        }
      } catch (err) {
        console.error('Failed to load offerings:', err);
        setError('Failed to load subscription options');
      } finally {
        setIsLoadingOfferings(false);
      }
    };

    loadOfferings();
  }, []);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      navigate('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to sign in');
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async (pkg: PurchasesPackage) => {
    try {
      setLoading(true);
      setError(null);
      await purchasePackage(pkg);
      navigate('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to complete purchase');
    } finally {
      setLoading(false);
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

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Welcome to Dripify
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Choose a subscription plan to get started
          </p>
        </div>

        {isLoadingOfferings ? (
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading subscription options...</p>
          </div>
        ) : error ? (
          <div className="text-center text-red-500">{error}</div>
        ) : (
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
                </CardContent>
                <CardFooter>
                  <Button
                    className="w-full"
                    onClick={() => handlePurchase(pkg)}
                    disabled={loading}
                  >
                    {loading ? 'Processing...' : 'Subscribe Now'}
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
