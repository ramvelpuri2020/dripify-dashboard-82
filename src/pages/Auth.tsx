
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { SubscriptionPlans } from "@/components/SubscriptionPlans";
import { ChevronRight, ChevronLeft, Sparkles } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

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
  const [showWelcome, setShowWelcome] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    // Auto-advance from welcome screen after 2 seconds
    if (showWelcome) {
      const timer = setTimeout(() => {
        setShowWelcome(false);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [showWelcome]);

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
    if (showSubscription) {
      setShowSubscription(false);
      return;
    }
    
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

  const renderWelcomeScreen = () => (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="flex flex-col items-center justify-center text-center space-y-6"
    >
      <div className="w-32 h-32 bg-gradient-to-br from-purple-600 to-pink-500 rounded-full flex items-center justify-center mb-4">
        <img 
          src="/lovable-uploads/c847c263-ab7b-42d7-8916-b9b32b9c16ba.png" 
          alt="GenStyle Shirt" 
          className="w-20 h-20 object-contain"
        />
      </div>
      <h1 className="text-3xl font-bold tracking-tighter bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">
        Welcome to GenStyle
      </h1>
      <p className="text-gray-300 text-lg max-w-xs">
        Let's personalize your style experience
      </p>
      <div className="flex items-center justify-center space-x-2 pt-6">
        <Sparkles className="w-5 h-5 text-purple-400 animate-pulse" />
      </div>
    </motion.div>
  );

  const renderQuestion = () => {
    const currentQuestion = STYLE_QUESTIONS[currentStep];
    
    return (
      <motion.div 
        className="space-y-6"
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -50 }}
        transition={{ duration: 0.3 }}
      >
        <div className="text-center mb-6">
          <div className="flex items-center justify-center space-x-3 mb-6">
            {STYLE_QUESTIONS.map((_, index) => (
              <div 
                key={index} 
                className={`h-2.5 rounded-full transition-all duration-300 ${
                  index === currentStep ? 'w-6 bg-purple-500' : 
                  index < currentStep ? 'w-2.5 bg-purple-300' : 'w-2.5 bg-gray-600'
                }`}
              />
            ))}
          </div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
            {currentQuestion.question}
          </h2>
        </div>
        
        <div className="grid gap-3">
          {currentQuestion.options.map((option) => (
            <Button
              key={option}
              onClick={() => handleAnswerSelect(option)}
              variant="outline" 
              className={`w-full py-7 text-lg justify-between transition-all duration-300 ${
                answers[currentStep] === option 
                ? 'border-purple-500 bg-purple-900/30 text-purple-300' 
                : 'bg-gray-800/50 border-gray-700 hover:bg-gray-800 hover:border-purple-500/50'
              }`}
            >
              <span className="ml-2">{option}</span>
              <ChevronRight className={`h-5 w-5 transition-transform ${
                answers[currentStep] === option ? 'text-purple-400' : ''
              }`} />
            </Button>
          ))}
        </div>
        
        {currentStep > 0 && (
          <Button 
            variant="ghost" 
            onClick={handlePrevious}
            className="mt-4 w-full text-gray-400 hover:text-white hover:bg-transparent"
          >
            <ChevronLeft className="h-5 w-5 mr-2" /> Back
          </Button>
        )}
      </motion.div>
    );
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-black p-4">
      <div className="w-full max-w-md">
        <Card className="border-0 shadow-xl bg-black/60 backdrop-blur-sm text-white overflow-hidden">
          <CardContent className="p-6 pt-8">
            <AnimatePresence mode="wait">
              {showWelcome ? (
                <motion.div key="welcome">
                  {renderWelcomeScreen()}
                </motion.div>
              ) : showSubscription ? (
                <motion.div 
                  key="subscription"
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -50 }}
                >
                  <Button 
                    variant="ghost" 
                    onClick={handlePrevious}
                    className="mb-4 text-gray-400 hover:text-white hover:bg-transparent pl-0"
                  >
                    <ChevronLeft className="h-5 w-5 mr-1" /> Back
                  </Button>
                  <SubscriptionPlans onContinue={handleContinueAfterSubscription} />
                </motion.div>
              ) : (
                <motion.div key="questions">
                  {renderQuestion()}
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Auth;
