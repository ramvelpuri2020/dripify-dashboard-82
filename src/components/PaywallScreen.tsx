
import React, { useEffect, useState } from 'react';
import { Button } from './ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from './ui/card';
import { getOfferings, purchasePackage, restorePurchases } from '@/utils/revenueCat';
import { useToast } from '@/hooks/use-toast';

const PaywallScreen = () => {
  const [loading, setLoading] = useState(true);
  const [offerings, setOfferings] = useState<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadOfferings();
  }, []);

  const loadOfferings = async () => {
    try {
      const currentOfferings = await getOfferings();
      setOfferings(currentOfferings);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load subscription options",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async (packageId: string) => {
    try {
      setLoading(true);
      await purchasePackage(packageId);
      toast({
        title: "Success!",
        description: "Thank you for your purchase!",
        variant: "success",
      });
    } catch (error: any) {
      toast({
        title: "Purchase Failed",
        description: error.message || "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async () => {
    try {
      setLoading(true);
      const restored = await restorePurchases();
      if (Object.keys(restored).length > 0) {
        toast({
          title: "Success",
          description: "Purchases restored successfully!",
          variant: "success",
        });
      } else {
        toast({
          title: "No Purchases Found",
          description: "No previous purchases were found to restore.",
          variant: "default",
        });
      }
    } catch (error) {
      toast({
        title: "Restore Failed",
        description: "Failed to restore purchases",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  return (
    <div className="container mx-auto p-4 max-w-md">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Upgrade Your Experience</CardTitle>
          <CardDescription>Choose a plan that works for you</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {offerings?.availablePackages?.map((pkg: any) => (
            <div key={pkg.identifier} className="border rounded-lg p-4">
              <h3 className="font-bold">{pkg.product.title}</h3>
              <p className="text-sm text-gray-600">{pkg.product.description}</p>
              <p className="font-bold mt-2">{pkg.product.priceString}</p>
              <Button
                className="w-full mt-2"
                onClick={() => handlePurchase(pkg.identifier)}
                disabled={loading}
              >
                Select
              </Button>
            </div>
          ))}
        </CardContent>
        <CardFooter>
          <Button variant="outline" className="w-full" onClick={handleRestore} disabled={loading}>
            Restore Purchases
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default PaywallScreen;
