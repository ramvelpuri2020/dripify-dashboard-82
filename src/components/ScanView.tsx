import { useState } from "react";
import { ImageUpload } from "@/components/ImageUpload";
import { StyleSelector } from "@/components/StyleSelector";
import { DripResults } from "@/components/DripResults";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";

export const ScanView = () => {
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [selectedStyle, setSelectedStyle] = useState("casual");
  const [analyzing, setAnalyzing] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [analysisResults, setAnalysisResults] = useState<any>(null);
  const { toast } = useToast();

  const getDemoAnalysis = () => {
    return {
      totalScore: 8.5,
      breakdown: [
        { category: "Color Coordination", score: 9, emoji: "🎨" },
        { category: "Style Matching", score: 8, emoji: "👔" },
        { category: "Fit", score: 8.5, emoji: "📏" },
        { category: "Accessories", score: 8.5, emoji: "💍" }
      ],
      feedback: "Great outfit choice! The colors work well together, and the fit is on point. Consider adding a statement accessory to elevate the look even further."
    };
  };

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
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      const results = getDemoAnalysis();
      setAnalysisResults(results);
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

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="px-4"
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
              <h3 className="text-xl font-medium text-center bg-gradient-to-r from-[#F97316] to-[#FB923C] text-transparent bg-clip-text">
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
                className="bg-gradient-to-r from-[#F97316] to-[#FB923C] hover:from-[#F97316]/90 hover:to-[#FB923C]/90 text-white font-medium px-10 py-6 rounded-full transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl hover:-translate-y-1"
              >
                {analyzing ? (
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    Analyzing...
                  </div>
                ) : (
                  "Check Your Drip"
                )}
              </Button>
            </motion.div>
          </CardContent>
        </Card>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <DripResults
            totalScore={analysisResults.totalScore}
            breakdown={analysisResults.breakdown}
            feedback={analysisResults.feedback}
            onShare={handleShare}
          />
        </motion.div>
      )}
    </motion.div>
  );
};