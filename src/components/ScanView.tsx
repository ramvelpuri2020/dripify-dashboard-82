import { useState } from "react";
import { ImageUpload } from "@/components/ImageUpload";
import { StyleSelector } from "@/components/StyleSelector";
import { DripResults } from "@/components/DripResults";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";

export const ScanView = () => {
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [selectedStyle, setSelectedStyle] = useState("casual");
  const [analyzing, setAnalyzing] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const { toast } = useToast();

  const demoResults = [
    {
      totalScore: 9.5,
      breakdown: [
        { category: "Overall", score: 95, emoji: "🎯" },
        { category: "Style", score: 90, emoji: "👔" },
        { category: "Fit", score: 92, emoji: "📏" },
        { category: "Color", score: 88, emoji: "🎨" },
        { category: "Accessories", score: 85, emoji: "💍" },
        { category: "Confidence", score: 98, emoji: "✨" },
      ],
      feedback: "Exceptional style! Your outfit shows great attention to detail and perfect color coordination. The fit is tailored perfectly, and your accessory choices elevate the entire look."
    },
    {
      totalScore: 9.0,
      breakdown: [
        { category: "Overall", score: 90, emoji: "🎯" },
        { category: "Innovation", score: 92, emoji: "💫" },
        { category: "Execution", score: 88, emoji: "✨" },
        { category: "Uniqueness", score: 95, emoji: "🌟" },
      ],
      feedback: "Your style is truly unique! The way you've combined different elements creates a distinctive look that stands out. Keep pushing boundaries!"
    },
    {
      totalScore: 9.8,
      breakdown: [
        { category: "Overall", score: 98, emoji: "🎯" },
        { category: "Presence", score: 95, emoji: "👑" },
        { category: "Impact", score: 96, emoji: "💥" },
        { category: "Elegance", score: 99, emoji: "✨" },
      ],
      feedback: "Absolutely stunning! Your style commands attention and exhibits a perfect balance of elegance and confidence. A true masterclass in personal style."
    }
  ];

  const handleAnalyze = async () => {
    if (!selectedImage) {
      toast({
        title: "No image selected",
        description: "Please upload an image to analyze",
        variant: "destructive",
      });
      return;
    }

    setAnalyzing(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      setShowResults(true);
    } catch (error) {
      console.error("Analysis error:", error);
      toast({
        title: "Analysis failed",
        description: "There was an error analyzing your image",
        variant: "destructive",
      });
    } finally {
      setAnalyzing(false);
    }
  };

  const handleShare = () => {
    toast({
      title: "Sharing",
      description: "Opening share dialog...",
    });
  };

  const handleSave = () => {
    toast({
      title: "Saved",
      description: "Your style analysis has been saved!",
    });
  };

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % demoResults.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + demoResults.length) % demoResults.length);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="px-4 relative"
    >
      {!showResults ? (
        <Card className="backdrop-blur-xl bg-black/30 border-white/10">
          <CardContent className="space-y-8 p-8">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <ImageUpload onImageSelect={setSelectedImage} />
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="space-y-6"
            >
              <h3 className="text-xl font-medium text-center text-white">
                What's the occasion?
              </h3>
              <StyleSelector selected={selectedStyle} onSelect={setSelectedStyle} />
            </motion.div>

            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="flex justify-center pt-4"
            >
              <Button
                onClick={handleAnalyze}
                disabled={!selectedImage || analyzing}
                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-medium px-10 py-6 rounded-full transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl hover:-translate-y-1"
              >
                {analyzing ? (
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    Analyzing...
                  </div>
                ) : (
                  "Analyze Style"
                )}
              </Button>
            </motion.div>
          </CardContent>
        </Card>
      ) : (
        <div className="relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentSlide}
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -100 }}
              transition={{ duration: 0.3 }}
            >
              <DripResults
                totalScore={demoResults[currentSlide].totalScore}
                breakdown={demoResults[currentSlide].breakdown}
                feedback={demoResults[currentSlide].feedback}
                onShare={handleShare}
                onSave={handleSave}
              />
            </motion.div>
          </AnimatePresence>

          {currentSlide > 0 && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute left-0 top-1/2 -translate-y-1/2 text-white hover:bg-white/10"
              onClick={prevSlide}
            >
              <ChevronLeft className="w-6 h-6" />
            </Button>
          )}

          {currentSlide < demoResults.length - 1 && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-0 top-1/2 -translate-y-1/2 text-white hover:bg-white/10"
              onClick={nextSlide}
            >
              <ChevronRight className="w-6 h-6" />
            </Button>
          )}

          <div className="flex justify-center gap-2 mt-4">
            {demoResults.map((_, index) => (
              <button
                key={index}
                className={`w-2 h-2 rounded-full transition-all ${
                  currentSlide === index ? "bg-white" : "bg-white/30"
                }`}
                onClick={() => setCurrentSlide(index)}
              />
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
};