import { useState } from "react";
import { ImageUpload } from "@/components/ImageUpload";
import { StyleSelector } from "@/components/StyleSelector";
import { DripResults } from "@/components/DripResults";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { motion } from "framer-motion";

const Index = () => {
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [selectedStyle, setSelectedStyle] = useState("casual");
  const [analyzing, setAnalyzing] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const { toast } = useToast();

  const mockBreakdown = [
    { category: "Color Coordination", score: 8, emoji: "🎨" },
    { category: "Fit & Proportion", score: 7, emoji: "📏" },
    { category: "Style Coherence", score: 9, emoji: "✨" },
    { category: "Accessories", score: 6, emoji: "💍" },
    { category: "Outfit Creativity", score: 8, emoji: "🎯" },
    { category: "Trend Awareness", score: 7, emoji: "🌟" },
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
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setShowResults(true);
    setAnalyzing(false);
  };

  const handleShare = () => {
    toast({
      title: "Sharing",
      description: "Opening share dialog...",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1A1F2C] to-[#2C1F3D] py-12 px-4 sm:px-6 lg:px-8">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-3xl mx-auto space-y-8"
      >
        <div className="text-center space-y-4">
          <motion.h1 
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5, type: "spring" }}
            className="text-5xl font-bold bg-gradient-to-r from-[#F97316] to-[#FB923C] text-transparent bg-clip-text"
          >
            DripCheck
          </motion.h1>
          <p className="text-gray-400 text-lg">
            Upload your fit and get instant style feedback
          </p>
        </div>

        {!showResults ? (
          <Card className="backdrop-blur-xl bg-white/5 border-white/10">
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
              totalScore={8}
              breakdown={mockBreakdown}
              onShare={handleShare}
            />
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};

export default Index;