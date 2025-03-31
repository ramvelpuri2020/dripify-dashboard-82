
import React, { useState } from 'react';
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, Sparkles, Star, Crown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useSubscription } from "@/hooks/useSubscription";
import { Skeleton } from '@/components/ui/skeleton';
import { motion } from 'framer-motion';

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
        <div className="text-center mb-4">
          <Skeleton className="h-8 w-3/4 mx-auto mb-2" />
          <Skeleton className="h-4 w-2/4 mx-auto" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
        <Skeleton className="h-10 w-full mt-4" />
      </div>
    );
  }

  const monthlyPackage = currentOffering.monthly;
  const annualPackage = currentOffering.annual;
  
  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">Choose Your Plan</h2>
        <p className="text-gray-400">
          Unlock premium features to elevate your style
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {monthlyPackage && (
          <motion.div
            whileHover={{ scale: 1.03 }}
            transition={{ duration: 0.2 }}
          >
            <Card 
              className={`border-2 relative cursor-pointer transition-all h-full ${
                selectedPlan === monthlyPackage.identifier 
                ? 'border-purple-500 bg-purple-900/20' 
                : 'border-gray-700 bg-gray-800/30'
              }`}
              onClick={() => setSelectedPlan(monthlyPackage.identifier)}
            >
              <div className="absolute top-3 right-3">
                {selectedPlan === monthlyPackage.identifier && (
                  <Badge className="bg-purple-500">Selected</Badge>
                )}
              </div>
              <CardHeader className="pb-2">
                <h3 className="font-bold text-lg flex items-center text-gray-100">
                  <Sparkles className="w-5 h-5 mr-2 text-purple-400" />
                  Monthly
                </h3>
              </CardHeader>
              <CardContent className="pt-0 space-y-4">
                <div className="text-2xl font-bold text-white">
                  {monthlyPackage.product.priceString}<span className="text-sm font-normal text-gray-400">/month</span>
                </div>
                <ul className="space-y-2">
                  <li className="flex items-center text-gray-300">
                    <Check className="w-4 h-4 mr-2 text-green-500" />
                    Unlimited style analyses
                  </li>
                  <li className="flex items-center text-gray-300">
                    <Check className="w-4 h-4 mr-2 text-green-500" />
                    Personalized recommendations
                  </li>
                  <li className="flex items-center text-gray-300">
                    <Check className="w-4 h-4 mr-2 text-green-500" />
                    Style history tracking
                  </li>
                </ul>
              </CardContent>
            </Card>
          </motion.div>
        )}
        
        {annualPackage && (
          <motion.div
            whileHover={{ scale: 1.03 }}
            transition={{ duration: 0.2 }}
          >
            <Card 
              className={`border-2 relative cursor-pointer transition-all h-full ${
                selectedPlan === annualPackage.identifier 
                ? 'border-pink-500 bg-pink-900/20' 
                : 'border-gray-700 bg-gray-800/30'
              }`}
              onClick={() => setSelectedPlan(annualPackage.identifier)}
            >
              <div className="absolute top-3 right-3">
                <Badge className="bg-gradient-to-r from-pink-500 to-purple-500">Best Value</Badge>
              </div>
              <CardHeader className="pb-2">
                <h3 className="font-bold text-lg flex items-center text-gray-100">
                  <Crown className="w-5 h-5 mr-2 text-pink-400" />
                  Annual
                </h3>
              </CardHeader>
              <CardContent className="pt-0 space-y-4">
                <div className="text-2xl font-bold text-white">
                  {annualPackage.product.priceString}
                  <span className="text-sm font-normal text-gray-400">/year</span>
                  <div className="text-sm text-pink-400">Save {Math.round((1 - (annualPackage.product.price / (monthlyPackage ? monthlyPackage.product.price * 12 : 1))) * 100)}%</div>
                </div>
                <ul className="space-y-2">
                  <li className="flex items-center text-gray-300">
                    <Check className="w-4 h-4 mr-2 text-green-500" />
                    Everything in monthly plan
                  </li>
                  <li className="flex items-center text-gray-300">
                    <Check className="w-4 h-4 mr-2 text-green-500" />
                    Priority style analysis
                  </li>
                  <li className="flex items-center text-gray-300">
                    <Check className="w-4 h-4 mr-2 text-green-500" />
                    Exclusive style tips
                  </li>
                </ul>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
      
      <div className="flex flex-col space-y-3 pt-4">
        <Button
          onClick={handlePurchase}
          disabled={!selectedPlan || purchaseInProgress}
          className={`relative overflow-hidden ${!selectedPlan ? 'bg-gray-700' : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700'}`}
        >
          {purchaseInProgress ? 'Processing...' : 'Continue with Premium'}
          {!purchaseInProgress && selectedPlan && (
            <motion.span 
              className="absolute inset-0 bg-white/20"
              initial={{ x: '-100%' }}
              animate={{ x: '100%' }}
              transition={{ repeat: Infinity, duration: 1.5 }}
            />
          )}
        </Button>
        <Button variant="ghost" onClick={handleSkip} className="text-gray-400 hover:text-white">
          Continue with Free Plan
        </Button>
      </div>
    </div>
  );
};
