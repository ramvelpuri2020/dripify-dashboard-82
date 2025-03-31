import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { Motion } from "@/components/ui/motion";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ChevronRight, Check, Star } from "lucide-react";
import { SubscriptionPlans } from "@/components/SubscriptionPlans";

type OnboardingStep = "welcome" | "gender" | "referral" | "pricing" | "auth";

export const Auth = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [isSignUp, setIsSignUp] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState<OnboardingStep>("welcome");
  const [gender, setGender] = useState("male");
  const [referralSource, setReferralSource] = useState("friend");
  const [selectedPlan, setSelectedPlan] = useState("free");
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate("/");
      }
    });
  }, [navigate]);

  const handleAuthSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (isSignUp) {
        if (!username.trim()) {
          throw new Error("Username is required");
        }
      
        // Sign up with email and password
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              username,
              gender: gender,
              referral_source: referralSource,
              subscription_plan: selectedPlan,
              sign_up_date: new Date().toISOString()
            },
          },
        });
        
        if (signUpError) {
          if (signUpError.status === 429) {
            const errorBody = JSON.parse(signUpError.message.includes('{') ? 
              signUpError.message.substring(signUpError.message.indexOf('{')) : 
              '{"reason":"Too many requests"}');
            throw new Error(errorBody.reason || "Too many attempts, please try again later");
          }
          throw signUpError;
        }
        
        toast({
          title: "Account created",
          description: "Check your email to confirm your account",
        });
      } else {
        // Sign in with email and password
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        
        if (error) throw error;
        
        navigate("/");
      }
    } catch (error) {
      console.error("Authentication error:", error);
      toast({
        title: "Authentication failed",
        description: error instanceof Error ? error.message : "Invalid email or password",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
        }
      });
      
      if (error) {
        console.error("Google sign-in error:", error);
        throw error;
      }
    } catch (error) {
      console.error("Google sign-in error:", error);
      toast({
        title: "Authentication failed",
        description: error instanceof Error ? error.message : "Could not sign in with Google",
        variant: "destructive",
      });
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case "welcome":
        return (
          <div className="space-y-8 text-center">
            <h2 className="text-2xl font-bold tracking-tight">Welcome to GenStyle</h2>
            <p className="text-muted-foreground">
              Elevate your style with AI-powered fashion analysis and recommendations
            </p>
            <Button 
              className="w-full"
              onClick={() => setCurrentStep("gender")}
            >
              Get Started <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        );
      
      case "gender":
        return (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold tracking-tight">Tell us about yourself</h2>
              <p className="text-muted-foreground">
                This helps us personalize your style recommendations
              </p>
            </div>
            
            <div className="space-y-4">
              <Label>I identify as</Label>
              <RadioGroup 
                defaultValue={gender} 
                onValueChange={setGender}
                className="grid grid-cols-2 gap-4"
              >
                <Label
                  htmlFor="male"
                  className={`flex flex-col items-center justify-between rounded-md border-2 p-4 ${
                    gender === 'male' ? 'border-primary' : 'border-muted'
                  } hover:border-primary cursor-pointer`}
                >
                  <RadioGroupItem value="male" id="male" className="sr-only" />
                  <span>Male</span>
                </Label>
                <Label
                  htmlFor="female"
                  className={`flex flex-col items-center justify-between rounded-md border-2 p-4 ${
                    gender === 'female' ? 'border-primary' : 'border-muted'
                  } hover:border-primary cursor-pointer`}
                >
                  <RadioGroupItem value="female" id="female" className="sr-only" />
                  <span>Female</span>
                </Label>
                <Label
                  htmlFor="non_binary"
                  className={`flex flex-col items-center justify-between rounded-md border-2 p-4 ${
                    gender === 'non_binary' ? 'border-primary' : 'border-muted'
                  } hover:border-primary cursor-pointer`}
                >
                  <RadioGroupItem value="non_binary" id="non_binary" className="sr-only" />
                  <span>Non-binary</span>
                </Label>
                <Label
                  htmlFor="prefer_not_to_say"
                  className={`flex flex-col items-center justify-between rounded-md border-2 p-4 ${
                    gender === 'prefer_not_to_say' ? 'border-primary' : 'border-muted'
                  } hover:border-primary cursor-pointer`}
                >
                  <RadioGroupItem value="prefer_not_to_say" id="prefer_not_to_say" className="sr-only" />
                  <span>Prefer not to say</span>
                </Label>
              </RadioGroup>
            </div>
            
            <Button 
              className="w-full"
              onClick={() => setCurrentStep("referral")}
            >
              Continue <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        );
      
      case "referral":
        return (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold tracking-tight">How did you hear about us?</h2>
              <p className="text-muted-foreground">
                We'd love to know what brought you to GenStyle
              </p>
            </div>
            
            <RadioGroup 
              defaultValue={referralSource} 
              onValueChange={setReferralSource}
              className="space-y-2"
            >
              <Label
                htmlFor="friend"
                className={`flex items-center justify-between rounded-md border-2 p-3 ${
                  referralSource === 'friend' ? 'border-primary' : 'border-muted'
                } hover:border-primary cursor-pointer`}
              >
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="friend" id="friend" />
                  <span>Friend or family</span>
                </div>
              </Label>
              <Label
                htmlFor="social"
                className={`flex items-center justify-between rounded-md border-2 p-3 ${
                  referralSource === 'social' ? 'border-primary' : 'border-muted'
                } hover:border-primary cursor-pointer`}
              >
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="social" id="social" />
                  <span>Social media</span>
                </div>
              </Label>
              <Label
                htmlFor="search"
                className={`flex items-center justify-between rounded-md border-2 p-3 ${
                  referralSource === 'search' ? 'border-primary' : 'border-muted'
                } hover:border-primary cursor-pointer`}
              >
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="search" id="search" />
                  <span>Search engine</span>
                </div>
              </Label>
              <Label
                htmlFor="ad"
                className={`flex items-center justify-between rounded-md border-2 p-3 ${
                  referralSource === 'ad' ? 'border-primary' : 'border-muted'
                } hover:border-primary cursor-pointer`}
              >
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="ad" id="ad" />
                  <span>Advertisement</span>
                </div>
              </Label>
              <Label
                htmlFor="other"
                className={`flex items-center justify-between rounded-md border-2 p-3 ${
                  referralSource === 'other' ? 'border-primary' : 'border-muted'
                } hover:border-primary cursor-pointer`}
              >
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="other" id="other" />
                  <span>Other</span>
                </div>
              </Label>
            </RadioGroup>
            
            <Button 
              className="w-full"
              onClick={() => setCurrentStep("pricing")}
            >
              Continue <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        );
        
      case "pricing":
        return (
          <SubscriptionPlans 
            onContinue={(planSelected) => {
              setSelectedPlan(planSelected ? 'premium' : 'free');
              setCurrentStep("auth");
            }} 
          />
        );
      
      case "auth":
        return (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold tracking-tight">{isSignUp ? 'Create an account' : 'Welcome back'}</h2>
              <p className="text-muted-foreground">
                {isSignUp ? 'Sign up to get started' : 'Sign in to your account'}
              </p>
            </div>
            
            <form onSubmit={handleAuthSubmit} className="space-y-4">
              {isSignUp && (
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input 
                    id="username"
                    placeholder="johndoe" 
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                  />
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input 
                  id="email"
                  type="email" 
                  placeholder="email@example.com" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input 
                  id="password"
                  type="password" 
                  placeholder="••••••••" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <Button className="w-full" type="submit" disabled={isLoading}>
                {isLoading ? "Loading..." : isSignUp ? "Sign Up" : "Sign In"}
              </Button>
            </form>
            
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-muted"></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
              </div>
            </div>
            
            <Button variant="outline" className="w-full" onClick={handleGoogleSignIn}>
              <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                <path
                  d="M12.0003 4.75C13.7703 4.75 15.3553 5.36002 16.6053 6.54998L20.0303 3.125C17.9502 1.19 15.2353 0 12.0003 0C7.31028 0 3.25527 2.69 1.28027 6.60998L5.27028 9.70498C6.21525 6.86002 8.87028 4.75 12.0003 4.75Z"
                  fill="#EA4335"
                />
                <path
                  d="M23.49 12.275C23.49 11.49 23.415 10.73 23.3 10H12V14.51H18.47C18.18 15.99 17.34 17.25 16.08 18.1L19.945 21.1C22.2 19.01 23.49 15.92 23.49 12.275Z"
                  fill="#4285F4"
                />
                <path
                  d="M5.26498 14.2949C5.02498 13.5699 4.88501 12.7999 4.88501 11.9999C4.88501 11.1999 5.01998 10.4299 5.26498 9.7049L1.275 6.60986C0.46 8.22986 0 10.0599 0 11.9999C0 13.9399 0.46 15.7699 1.28 17.3899L5.26498 14.2949Z"
                  fill="#FBBC05"
                />
                <path
                  d="M12.0004 24.0001C15.2404 24.0001 17.9654 22.935 19.9454 21.095L16.0804 18.095C15.0054 18.82 13.6204 19.25 12.0004 19.25C8.8704 19.25 6.2104 17.14 5.2654 14.295L1.2754 17.39C3.2504 21.31 7.3104 24.0001 12.0004 24.0001Z"
                  fill="#34A853"
                />
              </svg>
              Google
            </Button>
            
            <div className="text-center text-sm">
              {isSignUp ? 'Already have an account? ' : "Don't have an account? "}
              <button
                type="button"
                className="underline font-medium"
                onClick={() => setIsSignUp(!isSignUp)}
              >
                {isSignUp ? 'Sign In' : 'Sign Up'}
              </button>
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-purple-700 to-pink-600 p-4">
      <Card className="w-full max-w-md mx-auto overflow-hidden">
        <CardContent className="p-6">
          {renderStep()}
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
