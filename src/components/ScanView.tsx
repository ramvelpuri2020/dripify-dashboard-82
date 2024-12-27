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

  const analyzeImage = async (imageFile: File) => {
    const base64Image = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(imageFile);
    });

    try {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: "gpt-4-vision-preview",
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: `Analyze this outfit for the ${selectedStyle} style category. Provide a detailed analysis with scores out of 10 for the following categories:
                  1. Color Coordination
                  2. Fit & Proportion
                  3. Style Coherence
                  4. Accessories
                  5. Outfit Creativity
                  6. Trend Awareness
                  
                  Also provide specific feedback and suggestions for improvement.`
                },
                {
                  type: "image_url",
                  image_url: base64Image as string
                }
              ]
            }
          ],
          max_tokens: 1000
        })
      });

      if (!response.ok) {
        throw new Error("Failed to analyze image");
      }

      const data = await response.json();
      console.log("OpenAI Response:", data);
      
      // Parse the response and extract scores
      const analysis = data.choices[0].message.content;
      
      // Simple parsing logic (you might want to make this more robust)
      const scores = {
        colorCoordination: parseInt(analysis.match(/Color Coordination:?\s*(\d+)/i)?.[1] || "7"),
        fitProportion: parseInt(analysis.match(/Fit & Proportion:?\s*(\d+)/i)?.[1] || "7"),
        styleCoherence: parseInt(analysis.match(/Style Coherence:?\s*(\d+)/i)?.[1] || "7"),
        accessories: parseInt(analysis.match(/Accessories:?\s*(\d+)/i)?.[1] || "7"),
        outfitCreativity: parseInt(analysis.match(/Outfit Creativity:?\s*(\d+)/i)?.[1] || "7"),
        trendAwareness: parseInt(analysis.match(/Trend Awareness:?\s*(\d+)/i)?.[1] || "7")
      };

      const totalScore = Math.round(
        Object.values(scores).reduce((acc, curr) => acc + curr, 0) / 6
      );

      return {
        totalScore,
        breakdown: [
          { category: "Color Coordination", score: scores.colorCoordination, emoji: "🎨" },
          { category: "Fit & Proportion", score: scores.fitProportion, emoji: "📏" },
          { category: "Style Coherence", score: scores.styleCoherence, emoji: "✨" },
          { category: "Accessories", score: scores.accessories, emoji: "💍" },
          { category: "Outfit Creativity", score: scores.outfitCreativity, emoji: "🎯" },
          { category: "Trend Awareness", score: scores.trendAwareness, emoji: "🌟" },
        ],
        feedback: analysis
      };
    } catch (error) {
      console.error("Analysis error:", error);
      throw error;
    }
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
      const results = await analyzeImage(selectedImage);
      setAnalysisResults(results);
      setShowResults(true);
    } catch (error) {
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