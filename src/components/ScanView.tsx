
import { useState } from "react";
import { ImageUpload } from "@/components/ImageUpload";
import { StyleSelector } from "@/components/StyleSelector";
import { DripResults } from "@/components/DripResults";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import { analyzeStyle } from "@/utils/imageAnalysis";
import { useScanStore } from "@/store/scanStore";
import { Sparkles } from "lucide-react";

export const ScanView = () => {
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [selectedStyle, setSelectedStyle] = useState("casual");
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisPhase, setAnalysisPhase] = useState<string>("");
  const [showResults, setShowResults] = useState(false);
  const { toast } = useToast();
  const setLatestScan = useScanStore((state) => state.setLatestScan);
  const [result, setResult] = useState(null);

  const analysisPhrases = [
    "Scanning outfit details...",
    "Analyzing color coordination...",
    "Evaluating fit and proportions...",
    "Checking style coherence...",
    "Assessing trend alignment...",
    "Generating personalized tips...",
    "Finalizing your style report..."
  ];

  const cycleAnalysisPhrases = () => {
    let phraseIndex = 0;
    
    const interval = setInterval(() => {
      setAnalysisPhase(analysisPhrases[phraseIndex]);
      phraseIndex = (phraseIndex + 1) % analysisPhrases.length;
    }, 1500);
    
    return interval;
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
    setAnalysisPhase(analysisPhrases[0]);
    const phraseCycleInterval = cycleAnalysisPhrases();
    
    try {
      console.log('Starting analysis...');
      
      // Call the analyzeStyle function with the selected image
      const analysisResult = await analyzeStyle(selectedImage);
      
      console.log('Analysis completed successfully:', analysisResult);
      setResult(analysisResult);
      setLatestScan(analysisResult);
      
      clearInterval(phraseCycleInterval);
      
      toast({
        title: "Analysis Complete",
        description: "Your style has been analyzed!",
        variant: "success"
      });
      
      setTimeout(() => {
        setShowResults(true);
        setAnalyzing(false);
      }, 800);
      
    } catch (error) {
      clearInterval(phraseCycleInterval);
      
      console.error("Analysis error:", error);
      toast({
        title: "Analysis failed",
        description: error instanceof Error ? error.message : "There was an error analyzing your image",
        variant: "destructive",
      });
      setAnalyzing(false);
    }
  };

  const handleRestart = () => {
    setShowResults(false);
    setSelectedImage(null);
    setResult(null);
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
                  <div className="flex flex-col items-center gap-3">
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-5 w-5 animate-pulse text-yellow-300" />
                      <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                      <Sparkles className="h-5 w-5 animate-pulse text-yellow-300" />
                    </div>
                    <div className="flex flex-col items-center">
                      <p className="text-sm font-medium">{analysisPhase}</p>
                      <motion.div 
                        className="h-1 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full mt-1"
                        initial={{ width: 0 }}
                        animate={{ width: "100%" }}
                        transition={{ 
                          duration: 10,
                          ease: "easeInOut",
                        }}
                      />
                    </div>
                  </div>
                ) : (
                  "Analyze Style"
                )}
              </Button>
            </motion.div>
          </CardContent>
        </Card>
      ) : (
        <motion.div
          initial={{ opacity: 0, x: 100 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
          className="pb-20" // Added padding to ensure content doesn't get cut off
        >
          {result && (
            <>
              <DripResults
                totalScore={result.totalScore}
                breakdown={result.breakdown}
                feedback={result.feedback}
                styleTips={result.styleTips || []}
                nextLevelTips={result.nextLevelTips || []}
                onShare={() => {
                  toast({
                    title: "Shared",
                    description: "Your style analysis has been shared!",
                    variant: "success"
                  });
                }}
                onSave={() => {
                  toast({
                    title: "Saved",
                    description: "Your style analysis has been saved to your profile!",
                    variant: "success"
                  });
                }}
                profileImage={selectedImage ? URL.createObjectURL(selectedImage) : undefined}
              />
              <div className="mt-8 flex justify-center">
                <Button
                  onClick={handleRestart}
                  className="bg-white/10 hover:bg-white/20 text-white transition-all"
                >
                  Analyze Another Outfit
                </Button>
              </div>
            </>
          )}
        </motion.div>
      )}
    </motion.div>
  );
};
