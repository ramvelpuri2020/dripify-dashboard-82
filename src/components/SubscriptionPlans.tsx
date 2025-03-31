
import React, { useState } from 'react';
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, Sparkles, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useSubscription } from "@/hooks/useSubscription";
import { PACKAGE_TYPE } from '@revenuecat/purchases-capacitor';
import { Skeleton } from '@/components/ui/skeleton';

interface SubscriptionPlansProps {
  onContinue: (planSelected: boolean) => void;
}

export const SubscriptionPlans: React.FC<SubscriptionPlansProps> = ({ onContinue }) => {
  const { toast } = useToast();
  const { isLoading, currentOffering, purchase } = useSubscription();
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [purchaseInProgress, setPurchaseInProgress] = useState(false);

  const handlePurchase = async () => {
    if (!selectedPlan || !currentOffering) return;
    
    try {
      setPurchaseInProgress(true);
      
      const packageToPurchase = currentOffering.availablePackages.find(
        pkg => pkg.identifier === selectedPlan
      );
      
      if (!packageToPurchase) {
        throw new Error("Selected plan not available");
      }
      
      await purchase(packageToPurchase);
      
      toast({
        title: "Subscription successful!",
        description: "Thank you for your subscription",
        variant: "success",
      });
      
      onContinue(true);
    } catch (error: any) {
      if (!error.userCancelled) {
        toast({
          title: "Subscription failed",
          description: error.message || "There was a problem with your purchase",
          variant: "destructive",
        });
      }
    } finally {
      setPurchaseInProgress(false);
    }
  };

  const handleSkip = () => {
    onContinue(false);
  };

  if (isLoading || !currentOffering) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 w-full" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

  const monthlyPackage = currentOffering.monthly;
  const annualPackage = currentOffering.annual;
  
  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold tracking-tight">Choose Your Plan</h2>
        <p className="text-muted-foreground">
          Unlock premium features to elevate your style
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {monthlyPackage && (
          <Card 
            className={`border-2 relative ${selectedPlan === monthlyPackage.identifier ? 'border-purple-500' : 'border-gray-200'}`}
            onClick={() => setSelectedPlan(monthlyPackage.identifier)}
          >
            <div className="absolute top-2 right-2">
              {selectedPlan === monthlyPackage.identifier && (
                <Badge className="bg-purple-500">Selected</Badge>
              )}
            </div>
            <CardHeader>
              <h3 className="font-bold text-lg flex items-center">
                <Sparkles className="w-5 h-5 mr-2 text-purple-500" />
                Monthly
              </h3>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="text-xl font-bold">
                {monthlyPackage.product.priceString}<span className="text-sm font-normal text-gray-500">/month</span>
              </div>
              <ul className="space-y-1">
                <li className="flex items-center">
                  <Check className="w-4 h-4 mr-2 text-green-500" />
                  Unlimited style analyses
                </li>
                <li className="flex items-center">
                  <Check className="w-4 h-4 mr-2 text-green-500" />
                  Personalized recommendations
                </li>
                <li className="flex items-center">
                  <Check className="w-4 h-4 mr-2 text-green-500" />
                  Style history tracking
                </li>
              </ul>
            </CardContent>
          </Card>
        )}
        
        {annualPackage && (
          <Card 
            className={`border-2 relative ${selectedPlan === annualPackage.identifier ? 'border-purple-500' : 'border-gray-200'}`}
            onClick={() => setSelectedPlan(annualPackage.identifier)}
          >
            <div className="absolute top-2 right-2">
              <Badge className="bg-pink-500">Best Value</Badge>
            </div>
            <CardHeader>
              <h3 className="font-bold text-lg flex items-center">
                <Star className="w-5 h-5 mr-2 text-pink-500" />
                Annual
              </h3>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="text-xl font-bold">
                {annualPackage.product.priceString}
                <span className="text-sm font-normal text-gray-500">/year</span>
                <div className="text-sm text-pink-500">Save {Math.round((1 - (annualPackage.product.price / (monthlyPackage ? monthlyPackage.product.price * 12 : 1))) * 100)}%</div>
              </div>
              <ul className="space-y-1">
                <li className="flex items-center">
                  <Check className="w-4 h-4 mr-2 text-green-500" />
                  Everything in monthly plan
                </li>
                <li className="flex items-center">
                  <Check className="w-4 h-4 mr-2 text-green-500" />
                  Priority style analysis
                </li>
                <li className="flex items-center">
                  <Check className="w-4 h-4 mr-2 text-green-500" />
                  Exclusive style tips
                </li>
              </ul>
            </CardContent>
          </Card>
        )}
      </div>
      
      <div className="flex flex-col space-y-2">
        <Button
          onClick={handlePurchase}
          disabled={!selectedPlan || purchaseInProgress}
          className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
        >
          {purchaseInProgress ? 'Processing...' : 'Continue with Premium'}
        </Button>
        <Button variant="ghost" onClick={handleSkip}>
          Continue with Free Plan
        </Button>
      </div>
    </div>
  );
};
