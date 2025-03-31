
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { SubscriptionPlans } from "@/components/SubscriptionPlans";
import { ChevronRight, ChevronLeft } from "lucide-react";

const STYLE_QUESTIONS = [
  {
    question: "What's your fashion style?",
    options: ["Casual", "Formal", "Streetwear", "Athletic", "Minimalist"]
  },
  {
    question: "What colors do you prefer?",
    options: ["Neutrals", "Bright Colors", "Pastels", "Earth Tones", "Monochrome"]
  },
  {
    question: "What's your budget range?",
    options: ["Budget", "Mid-range", "Premium", "Luxury", "Mix"]
  }
];

const Auth = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const [showSubscription, setShowSubscription] = useState(false);
  const { toast } = useToast();

  const handleAnswerSelect = (answer: string) => {
    const newAnswers = [...answers];
    newAnswers[currentStep] = answer;
    setAnswers(newAnswers);
    
    if (currentStep < STYLE_QUESTIONS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Last question answered, proceed to subscription
      setShowSubscription(true);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleContinueAfterSubscription = async (premiumSelected: boolean) => {
    try {
      // Create anonymous session
      const { data, error } = await supabase.auth.signUp({
        email: `anonymous-${Date.now()}@example.com`,
        password: `password-${Math.random().toString(36).substring(2, 15)}`,
      });
      
      if (error) throw error;
      
      // Store the user's style preferences
      if (data.user) {
        await supabase.from('profiles').update({
          style_preferences: answers
        }).eq('id', data.user.id);
      }
      
      toast({
        title: premiumSelected ? "Premium plan activated" : "Free plan selected",
        description: "Welcome to GenStyle! Let's find your perfect look.",
        variant: premiumSelected ? "success" : "default",
      });
    } catch (error: any) {
      console.error("Error in onboarding:", error);
      toast({
        title: "Error completing setup",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    }
  };

  const renderQuestion = () => {
    const currentQuestion = STYLE_QUESTIONS[currentStep];
    
    return (
      <div className="space-y-6">
        <div className="text-center mb-6">
          <div className="flex items-center justify-center space-x-2 mb-4">
            {STYLE_QUESTIONS.map((_, index) => (
              <div 
                key={index} 
                className={`h-2 w-2 rounded-full ${
                  index === currentStep ? 'bg-purple-500' : 
                  index < currentStep ? 'bg-gray-400' : 'bg-gray-200'
                }`}
              />
            ))}
          </div>
          <h2 className="text-2xl font-bold">{currentQuestion.question}</h2>
        </div>
        
        <div className="grid gap-3">
          {currentQuestion.options.map((option) => (
            <Button
              key={option}
              onClick={() => handleAnswerSelect(option)}
              variant="outline" 
              className={`w-full py-6 text-lg justify-between ${
                answers[currentStep] === option ? 'border-purple-500 bg-purple-50/10 text-purple-500' : ''
              }`}
            >
              {option}
              <ChevronRight className="h-5 w-5" />
            </Button>
          ))}
        </div>
        
        {currentStep > 0 && (
          <Button 
            variant="ghost" 
            onClick={handlePrevious}
            className="mt-4 w-full"
          >
            <ChevronLeft className="h-5 w-5 mr-2" /> Back
          </Button>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-black p-4">
      <div className="w-full max-w-md">
        <Card className="border-0 shadow-xl bg-black/60 backdrop-blur-sm text-white">
          <CardHeader>
            <CardTitle className="text-xl text-center">
              {showSubscription ? "Choose Your Plan" : "Welcome to GenStyle"}
            </CardTitle>
            {!showSubscription && (
              <CardDescription className="text-center text-gray-400">
                Let's personalize your style experience
              </CardDescription>
            )}
          </CardHeader>
          <CardContent>
            {showSubscription ? (
              <SubscriptionPlans onContinue={handleContinueAfterSubscription} />
            ) : (
              renderQuestion()
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Auth;
