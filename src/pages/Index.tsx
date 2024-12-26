import { useState } from "react";
import { ImageUpload } from "@/components/ImageUpload";
import { StyleSelector } from "@/components/StyleSelector";
import { DripResults } from "@/components/DripResults";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

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
    // Simulate API call
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
    <div className="min-h-screen bg-[#1A1F2C] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white mb-2 animate-fade-in">DripCheck</h1>
          <p className="text-gray-400">
            Upload your fit and get instant style feedback
          </p>
        </div>

        {!showResults ? (
          <div className="bg-[#221F26]/50 backdrop-blur-xl rounded-xl shadow-lg border border-white/10 p-6 space-y-6 animate-fade-in">
            <ImageUpload onImageSelect={setSelectedImage} />
            
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-white text-center">
                What's the occasion?
              </h3>
              <StyleSelector selected={selectedStyle} onSelect={setSelectedStyle} />
            </div>

            <div className="flex justify-center">
              <Button
                onClick={handleAnalyze}
                disabled={!selectedImage || analyzing}
                className="bg-[#F97316] hover:bg-[#F97316]/90 text-white font-medium px-8 py-2 rounded-full transition-all duration-200 disabled:opacity-50"
              >
                {analyzing ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    Analyzing...
                  </div>
                ) : (
                  "Check Your Drip"
                )}
              </Button>
            </div>
          </div>
        ) : (
          <DripResults
            totalScore={8}
            breakdown={mockBreakdown}
            onShare={handleShare}
          />
        )}
      </div>
    </div>
  );
};

export default Index;