
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { SubscriptionPlans } from "@/components/SubscriptionPlans";

const Auth = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [showSubscription, setShowSubscription] = useState(false);
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({ 
        email, 
        password 
      });
      
      if (error) throw error;
      
      toast({
        title: "Login successful",
        description: "Welcome back!",
        variant: "success",
      });
    } catch (error: any) {
      toast({
        title: "Login failed",
        description: error.message || "Please check your credentials",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
  
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.auth.signUp({ 
        email, 
        password,
        options: {
          emailRedirectTo: window.location.origin
        }
      });
      
      if (error) throw error;
      
      setShowSubscription(true);
      toast({
        title: "Sign up successful!",
        description: "Choose a subscription plan to continue",
        variant: "success",
      });
    } catch (error: any) {
      toast({
        title: "Sign up failed",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleContinueAfterSubscription = (premiumSelected: boolean) => {
    if (premiumSelected) {
      toast({
        title: "Premium plan activated",
        description: "Thank you for subscribing!",
        variant: "success",
      });
    } else {
      toast({
        title: "Free plan selected",
        description: "You can upgrade anytime in your profile",
        variant: "default",
      });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-black p-4">
      <div className="w-full max-w-md">
        {showSubscription ? (
          <Card className="border-0 shadow-xl bg-black/60 backdrop-blur-sm text-white">
            <CardHeader>
              <CardTitle className="text-xl text-center">Choose Your Plan</CardTitle>
            </CardHeader>
            <CardContent>
              <SubscriptionPlans onContinue={handleContinueAfterSubscription} />
            </CardContent>
          </Card>
        ) : (
          <Card className="border-0 shadow-xl bg-black/60 backdrop-blur-sm text-white">
            <CardHeader>
              <CardTitle className="text-xl text-center">
                {isSignUp ? "Create an Account" : "Welcome Back"}
              </CardTitle>
              <CardDescription className="text-center text-gray-400">
                {isSignUp ? "Sign up to get started" : "Log in to your account"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={isSignUp ? handleSignUp : handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Input
                    id="email"
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="bg-gray-800/50 border-gray-700 text-white placeholder:text-gray-500"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Input
                    id="password"
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="bg-gray-800/50 border-gray-700 text-white placeholder:text-gray-500"
                    required
                  />
                </div>
                <Button 
                  type="submit" 
                  className="w-full bg-gradient-to-r from-purple-500 to-pink-500"
                  disabled={loading}
                >
                  {loading ? (
                    <span>Loading...</span>
                  ) : isSignUp ? (
                    "Create Account"
                  ) : (
                    "Log In"
                  )}
                </Button>
              </form>
            </CardContent>
            <CardFooter>
              <Button 
                variant="link" 
                onClick={() => setIsSignUp(!isSignUp)}
                className="w-full text-gray-400 hover:text-white"
              >
                {isSignUp
                  ? "Already have an account? Log in"
                  : "Don't have an account? Sign up"}
              </Button>
            </CardFooter>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Auth;
