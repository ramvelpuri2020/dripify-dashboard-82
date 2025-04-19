import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ChevronRight, Check, AlertCircle } from "lucide-react";
import { getOfferings, purchasePackage, initializePurchases, PurchasesPackage, isRevenueCatAvailable } from "@/utils/revenueCat";

type OnboardingStep = "welcome" | "gender" | "referral" | "pricing" | "auth" | "paywall";

// Create a separate mock package type for web demo purposes only
// This avoids TypeScript errors while keeping the UI functional
interface MockPackage {
  identifier: string;
  packageType: string;
  product: {
    identifier: string;
    title: string;
    description: string;
    price: number;
    priceString: string;
    currencyCode: string;
    subscriptionPeriod: string;
  };
  offering: string;
}

// Demo packages for web browser view
const demoWebPackages: MockPackage[] = [
  {
    identifier: 'monthly',
    packageType: 'MONTHLY',
    product: {
      identifier: 'premium_monthly',
      title: 'Monthly Premium',
      description: 'Unlimited style scans and personalized tips',
      price: 4.99,
      priceString: '$4.99/month',
      currencyCode: 'USD',
      subscriptionPeriod: 'P1M'
    },
    offering: 'default',
  },
  {
    identifier: 'yearly',
    packageType: 'ANNUAL',
    product: {
      identifier: 'premium_yearly',
      title: 'Annual Premium',
      description: 'Our best value plan with additional perks',
      price: 39.99,
      priceString: '$39.99/year',
      currencyCode: 'USD',
      subscriptionPeriod: 'P1Y'
    },
    offering: 'default',
  }
];

export const Auth = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [currentStep, setCurrentStep] = useState<OnboardingStep>("welcome");
  const [gender, setGender] = useState<string>("");
  const [referralSource, setReferralSource] = useState<string>("");
  const [selectedPlan, setSelectedPlan] = useState<string>("free");
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [offerings, setOfferings] = useState<PurchasesPackage[]>([]);
  const [isLoadingOfferings, setIsLoadingOfferings] = useState(false);
  const [isWebEnvironment, setIsWebEnvironment] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate("/");
      }
    });
  }, [navigate]);

  useEffect(() => {
    const loadOfferings = async () => {
      if (currentStep !== "paywall") return;
      
      setIsLoadingOfferings(true);
      try {
        // Initialize RevenueCat without showing errors on web
        try {
          await initializePurchases('anonymous');
        } catch (error) {
          console.log('RevenueCat initialization in Auth failed (expected on web):', error);
        }
        
        // Set flag to indicate if we're in web environment where RevenueCat isn't available
        const rcAvailable = isRevenueCatAvailable();
        setIsWebEnvironment(!rcAvailable);
        
        // Get packages from RevenueCat if available, otherwise use demo packages
        let packages: PurchasesPackage[] = [];
        if (rcAvailable) {
          packages = await getOfferings();
        } else {
          // Use demo packages in web environment for testing UI
          // Cast the mock packages to PurchasesPackage with unknown as intermediary
          // This is safe because we're only using these properties in the UI
          packages = demoWebPackages as unknown as PurchasesPackage[];
          console.log("Using demo packages for web environment:", packages);
        }
        
        if (packages.length > 0) {
          setOfferings(packages);
        } else {
          toast({
            title: "No Packages Available",
            description: "No subscription packages were found. Please try again later.",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error('Failed to load offerings:', error);
        toast({
          title: "Error",
          description: "Failed to load subscription options. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsLoadingOfferings(false);
      }
    };

    loadOfferings();
  }, [currentStep, toast]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isSignUp) {
        if (!username.trim()) {
          throw new Error("Username is required");
        }
        if (username.length < 3) {
          throw new Error("Username must be at least 3 characters long");
        }

        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              username: username,
              gender: gender,
              referral_source: referralSource,
              plan: selectedPlan
            }
          }
        });
        
        if (signUpError) {
          if (signUpError.status === 429) {
            const errorBody = JSON.parse(signUpError.message.includes('{') ? 
              signUpError.message.substring(signUpError.message.indexOf('{')) : 
              '{"message": "Please wait a moment before trying again."}'
            );
            throw new Error(errorBody.message || "Please wait before trying again.");
          }
          throw signUpError;
        }

        toast({
          title: "Sign up successful!",
          description: "Please check your email to verify your account.",
          variant: "success",
        });
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (signInError) throw signInError;
        
        toast({
          title: "Welcome back!",
          description: "You have successfully signed in.",
          variant: "success",
        });
        navigate("/");
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An error occurred";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          }
        }
      });
      
      if (error) {
        console.error("Google sign-in error:", error);
        throw error;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An error occurred";
      toast({
        title: "Error with Google Sign In",
        description: errorMessage,
        variant: "destructive",
      });
      setLoading(false);
    }
  };

  const handlePurchase = async (pkg: PurchasesPackage) => {
    setIsSubscribing(true);
    try {
      if (isWebEnvironment) {
        // Simulate purchase for web environment
        setTimeout(() => {
          toast({
            title: "Success",
            description: "Demo subscription activated. In the real app, this would process through the App Store or Google Play.",
            variant: "success",
          });
          setCurrentStep("auth");
        }, 1500);
        return;
      }
      
      // Real purchase for mobile environments
      const customerInfo = await purchasePackage(pkg);
      if (customerInfo) {
        toast({
          title: "Success",
          description: "Subscription purchased successfully!",
          variant: "success",
        });
        setCurrentStep("auth");
      }
    } catch (error) {
      console.error('Failed to purchase:', error);
      toast({
        title: "Error",
        description: "Failed to complete purchase. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubscribing(false);
    }
  };

  const nextStep = () => {
    if (currentStep === "welcome") setCurrentStep("gender");
    else if (currentStep === "gender" && gender) setCurrentStep("referral");
    else if (currentStep === "referral" && referralSource) setCurrentStep("pricing");
    else if (currentStep === "pricing") {
      if (selectedPlan === "premium") {
        setCurrentStep("paywall");
      } else {
        setCurrentStep("auth");
      }
    }
    else if (currentStep === "paywall") setCurrentStep("auth");
  };

  const prevStep = () => {
    if (currentStep === "gender") setCurrentStep("welcome");
    else if (currentStep === "referral") setCurrentStep("gender");
    else if (currentStep === "pricing") setCurrentStep("referral");
    else if (currentStep === "paywall") setCurrentStep("pricing");
    else if (currentStep === "auth") {
      if (selectedPlan === "premium") {
        setCurrentStep("paywall");
      } else {
        setCurrentStep("pricing");
      }
    }
  };

  const renderWelcomeScreen = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="text-center"
    >
      <div className="py-6 flex justify-center">
        <img 
          src="/lovable-uploads/346e5cd9-38d5-43b3-ac71-4abd6b546a1a.png" 
          alt="GenStyle Shirt" 
          className="w-40 h-40 object-contain"
        />
      </div>
      
      <h1 className="text-3xl font-bold bg-gradient-to-r from-[#F97316] to-[#FB923C] text-transparent bg-clip-text mb-4">
        Welcome to GenStyle
      </h1>
      
      <p className="text-white/70 mb-8">
        Your AI-powered personal stylist that helps you look your best.
      </p>
      
      <Button 
        onClick={nextStep} 
        className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
      >
        Get Started <ChevronRight className="ml-2 h-4 w-4" />
      </Button>
      
      <div className="mt-6 text-sm text-white/50">
        By continuing, you agree to our Terms of Service and Privacy Policy
      </div>
    </motion.div>
  );

  const renderGenderSelection = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
    >
      <h2 className="text-xl font-semibold text-white mb-6 text-center">How do you identify?</h2>
      
      <RadioGroup value={gender} onValueChange={setGender} className="gap-3">
        <div className={`relative flex items-center rounded-md border ${gender === 'male' ? 'border-purple-500 bg-purple-500/10' : 'border-white/10'} p-4 cursor-pointer`} onClick={() => setGender('male')}>
          <RadioGroupItem value="male" id="male" className="absolute right-4" />
          <Label htmlFor="male" className="flex-1 cursor-pointer text-white">Male</Label>
        </div>
        
        <div className={`relative flex items-center rounded-md border ${gender === 'female' ? 'border-purple-500 bg-purple-500/10' : 'border-white/10'} p-4 cursor-pointer`} onClick={() => setGender('female')}>
          <RadioGroupItem value="female" id="female" className="absolute right-4" />
          <Label htmlFor="female" className="flex-1 cursor-pointer text-white">Female</Label>
        </div>
        
        <div className={`relative flex items-center rounded-md border ${gender === 'non-binary' ? 'border-purple-500 bg-purple-500/10' : 'border-white/10'} p-4 cursor-pointer`} onClick={() => setGender('non-binary')}>
          <RadioGroupItem value="non-binary" id="non-binary" className="absolute right-4" />
          <Label htmlFor="non-binary" className="flex-1 cursor-pointer text-white">Non-binary</Label>
        </div>
        
        <div className={`relative flex items-center rounded-md border ${gender === 'prefer-not-to-say' ? 'border-purple-500 bg-purple-500/10' : 'border-white/10'} p-4 cursor-pointer`} onClick={() => setGender('prefer-not-to-say')}>
          <RadioGroupItem value="prefer-not-to-say" id="prefer-not-to-say" className="absolute right-4" />
          <Label htmlFor="prefer-not-to-say" className="flex-1 cursor-pointer text-white">Prefer not to say</Label>
        </div>
      </RadioGroup>
      
      <div className="flex mt-8 gap-3">
        <Button variant="outline" onClick={prevStep} className="flex-1">
          Back
        </Button>
        <Button 
          onClick={nextStep} 
          disabled={!gender}
          className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
        >
          Next <ChevronRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </motion.div>
  );

  const renderReferralSource = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
    >
      <h2 className="text-xl font-semibold text-white mb-6 text-center">How did you find us?</h2>
      
      <RadioGroup value={referralSource} onValueChange={setReferralSource} className="gap-3">
        <div className={`relative flex items-center rounded-md border ${referralSource === 'instagram' ? 'border-purple-500 bg-purple-500/10' : 'border-white/10'} p-4 cursor-pointer`} onClick={() => setReferralSource('instagram')}>
          <RadioGroupItem value="instagram" id="instagram" className="absolute right-4" />
          <Label htmlFor="instagram" className="flex-1 cursor-pointer text-white">Instagram</Label>
        </div>
        
        <div className={`relative flex items-center rounded-md border ${referralSource === 'x' ? 'border-purple-500 bg-purple-500/10' : 'border-white/10'} p-4 cursor-pointer`} onClick={() => setReferralSource('x')}>
          <RadioGroupItem value="x" id="x" className="absolute right-4" />
          <Label htmlFor="x" className="flex-1 cursor-pointer text-white">X (Twitter)</Label>
        </div>
        
        <div className={`relative flex items-center rounded-md border ${referralSource === 'discord' ? 'border-purple-500 bg-purple-500/10' : 'border-white/10'} p-4 cursor-pointer`} onClick={() => setReferralSource('discord')}>
          <RadioGroupItem value="discord" id="discord" className="absolute right-4" />
          <Label htmlFor="discord" className="flex-1 cursor-pointer text-white">Discord</Label>
        </div>
        
        <div className={`relative flex items-center rounded-md border ${referralSource === 'linkedin' ? 'border-purple-500 bg-purple-500/10' : 'border-white/10'} p-4 cursor-pointer`} onClick={() => setReferralSource('linkedin')}>
          <RadioGroupItem value="linkedin" id="linkedin" className="absolute right-4" />
          <Label htmlFor="linkedin" className="flex-1 cursor-pointer text-white">LinkedIn</Label>
        </div>
        
        <div className={`relative flex items-center rounded-md border ${referralSource === 'other' ? 'border-purple-500 bg-purple-500/10' : 'border-white/10'} p-4 cursor-pointer`} onClick={() => setReferralSource('other')}>
          <RadioGroupItem value="other" id="other" className="absolute right-4" />
          <Label htmlFor="other" className="flex-1 cursor-pointer text-white">Other</Label>
        </div>
      </RadioGroup>
      
      <div className="flex mt-8 gap-3">
        <Button variant="outline" onClick={prevStep} className="flex-1">
          Back
        </Button>
        <Button 
          onClick={nextStep} 
          disabled={!referralSource}
          className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
        >
          Next <ChevronRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </motion.div>
  );

  const renderPricingPlans = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
    >
      <h2 className="text-xl font-semibold text-white mb-6 text-center">Choose your plan</h2>
      
      <div className="space-y-4">
        <div 
          className={`relative rounded-lg border p-4 ${selectedPlan === 'free' ? 'border-purple-500 bg-purple-500/10' : 'border-white/10'}`}
          onClick={() => setSelectedPlan('free')}
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-white">Free</h3>
              <p className="text-sm text-gray-400">Basic style analysis</p>
            </div>
            <p className="font-semibold text-white">$0</p>
          </div>
          <ul className="mt-4 space-y-2 text-sm">
            <li className="flex items-center text-white">
              <Check className="mr-2 h-4 w-4 text-green-500" /> 3 style scans per month
            </li>
            <li className="flex items-center text-white">
              <Check className="mr-2 h-4 w-4 text-green-500" /> Basic style tips
            </li>
          </ul>
          {selectedPlan === 'free' && (
            <div className="absolute -top-2 -right-2 bg-purple-500 rounded-full p-1">
              <Check className="h-4 w-4 text-white" />
            </div>
          )}
        </div>
        
        <div 
          className={`relative rounded-lg border p-4 ${selectedPlan === 'premium' ? 'border-purple-500 bg-purple-500/10' : 'border-white/10'}`}
          onClick={() => setSelectedPlan('premium')}
        >
          <div className="absolute -top-3 right-3 bg-gradient-to-r from-yellow-400 to-yellow-600 text-black text-xs px-2 py-1 rounded-full">
            POPULAR
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-white">Premium</h3>
              <p className="text-sm text-gray-400">Advanced fashion analysis</p>
            </div>
            <div>
              <p className="font-semibold text-white">$4.99<span className="text-xs text-gray-400">/month</span></p>
            </div>
          </div>
          <ul className="mt-4 space-y-2 text-sm">
            <li className="flex items-center text-white">
              <Check className="mr-2 h-4 w-4 text-green-500" /> Unlimited style scans
            </li>
            <li className="flex items-center text-white">
              <Check className="mr-2 h-4 w-4 text-green-500" /> Detailed analysis reports
            </li>
            <li className="flex items-center text-white">
              <Check className="mr-2 h-4 w-4 text-green-500" /> Personalized shopping tips
            </li>
          </ul>
          {selectedPlan === 'premium' && (
            <div className="absolute -top-2 -right-2 bg-purple-500 rounded-full p-1">
              <Check className="h-4 w-4 text-white" />
            </div>
          )}
        </div>
      </div>
      
      <div className="flex mt-8 gap-3">
        <Button variant="outline" onClick={prevStep} className="flex-1">
          Back
        </Button>
        <Button 
          onClick={nextStep} 
          className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
        >
          {selectedPlan === 'free' ? 'Continue with Free' : 'Continue with Premium'}
        </Button>
      </div>
    </motion.div>
  );

  const renderPaywallScreen = () => (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex flex-col space-y-6"
    >
      <h2 className="text-2xl font-bold text-white text-center mb-4">Choose Your Subscription</h2>
      
      {isWebEnvironment && (
        <div className="bg-yellow-500/20 border border-yellow-500/50 rounded-md p-3 mb-4">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-5 w-5 text-yellow-500 mt-0.5" />
            <p className="text-sm text-white/80">
              This is a demo of the subscription flow. In the actual mobile app, you would be redirected to the App Store or Google Play for payment processing.
            </p>
          </div>
        </div>
      )}
      
      {isLoadingOfferings ? (
        <div className="flex justify-center py-10">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      ) : offerings.length > 0 ? (
        <div className="space-y-4">
          {offerings.map((pkg) => (
            <div 
              key={pkg.identifier}
              className="border border-purple-400/30 rounded-lg p-5 bg-purple-500/5 hover:bg-purple-500/10 transition-all"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-white font-medium">{pkg.product.title}</h3>
                  <p className="text-gray-400 text-sm">{pkg.product.description}</p>
                  <p className="text-purple-300 font-bold mt-2">{pkg.product.priceString}</p>
                </div>
                <Button
                  onClick={() => handlePurchase(pkg)}
                  disabled={isSubscribing}
                  className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                >
                  {isSubscribing ? "Processing..." : "Subscribe"}
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-white">
          <p>No subscription packages available at this time.</p>
          <p className="text-sm text-gray-400 mt-2">Please try again later or contact support.</p>
        </div>
      )}
      
      <div className="flex justify-center mt-4">
        <Button variant="outline" onClick={prevStep}>
          Back to Plans
        </Button>
      </div>
    </motion.div>
  );

  const renderAuthScreen = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
    >
      <h2 className="text-xl font-semibold text-white mb-6 text-center">
        {isSignUp ? "Create your account" : "Sign in to your account"}
      </h2>
      
      <Button
        onClick={handleGoogleSignIn}
        disabled={loading}
        className="w-full mb-4 bg-white text-gray-800 hover:bg-gray-200 flex items-center justify-center gap-2"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="24px" height="24px">
          <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"/>
          <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"/>
          <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"/>
          <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"/>
        </svg>
        {isSignUp ? "Sign up with Google" : "Sign in with Google"}
      </Button>
      
      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-white/20"></div>
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="px-2 bg-black/30 text-white/60">OR</span>
        </div>
      </div>
      
      <form onSubmit={handleAuth} className="space-y-4">
        {isSignUp && (
          <div className="space-y-2">
            <Label htmlFor="username" className="text-white">Username</Label>
            <Input
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="bg-white/5 border-white/10 text-white"
              placeholder="Choose a username"
            />
          </div>
        )}
        <div className="space-y-2">
          <Label htmlFor="email" className="text-white">Email</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="bg-white/5 border-white/10 text-white"
            placeholder="Enter your email"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password" className="text-white">Password</Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="bg-white/5 border-white/10 text-white"
            placeholder="Choose a password"
          />
        </div>
        <div className="flex gap-3">
          <Button
            type="button"
            onClick={prevStep}
            variant="outline"
            className="flex-1"
          >
            Back
          </Button>
          <Button
            type="submit"
            disabled={loading}
            className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                {isSignUp ? "Signing up..." : "Signing in..."}
              </div>
            ) : (
              <>{isSignUp ? "Sign up" : "Sign in"}</>
            )}
          </Button>
        </div>
        <div className="text-center">
          <button
            type="button"
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-sm text-white/60 hover:text-white"
          >
            {isSignUp
              ? "Already have an account? Sign in"
              : "Don't have an account? Sign up"}
          </button>
        </div>
      </form>
    </motion.div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1A1F2C] to-[#2C1F3D] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <Card className="backdrop-blur-xl bg-black/30 border-white/10">
          <CardContent className="pt-6">
            <AnimatePresence mode="wait">
              {currentStep === "welcome" && renderWelcomeScreen()}
              {currentStep === "gender" && renderGenderSelection()}
              {currentStep === "referral" && renderReferralSource()}
              {currentStep === "pricing" && renderPricingPlans()}
              {currentStep === "paywall" && renderPaywallScreen()}
              {currentStep === "auth" && renderAuthScreen()}
            </AnimatePresence>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default Auth;
