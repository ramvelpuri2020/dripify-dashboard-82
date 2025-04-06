import { useState } from "react";
import { ImageUpload } from "@/components/ImageUpload";
import { StyleSelector } from "@/components/StyleSelector";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import { analyzeStyle } from "@/utils/imageAnalysis";
import { useScanStore } from "@/store/scanStore";
import { Sparkles, Camera, Share2, Save } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CategoryBreakdown } from "./analysis/CategoryBreakdown";
import { StyleTips } from "./analysis/StyleTips";
import type { ScoreBreakdown, StyleTip } from "@/types/styleTypes";

export const ScanView = () => {
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [selectedStyle, setSelectedStyle] = useState("casual");
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisPhase, setAnalysisPhase] = useState<string>("");
  const [showResults, setShowResults] = useState(false);
  const { toast } = useToast();
  const setLatestScan = useScanStore((state) => state.setLatestScan);
  const [result, setResult] = useState<{ 
    overallScore: number; 
    rawAnalysis: string; 
    imageUrl: string; 
    breakdown?: ScoreBreakdown[];
    tips?: StyleTip[];
  } | null>(null);

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

  const getScoreColor = (score: number) => {
    if (score >= 8) return "text-green-400";
    if (score >= 6) return "text-amber-400";
    return "text-rose-400";
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

  const handleShare = () => {
    toast({
      title: "Shared",
      description: "Your style analysis has been shared!",
      variant: "success"
    });
  };

  const handleSave = () => {
    toast({
      title: "Saved",
      description: "Your style analysis has been saved to your profile!",
      variant: "success"
    });
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
                  <>
                    <Camera className="mr-2 h-5 w-5" />
                    Analyze Style
                  </>
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
          className="pb-20"
        >
          {result && (
            <div className="w-full max-w-2xl mx-auto space-y-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center space-y-4"
              >
                <Avatar className="w-24 h-24 mx-auto border-2 border-purple-500/30">
                  <AvatarImage src={selectedImage ? URL.createObjectURL(selectedImage) : undefined} alt="Profile" className="object-cover" />
                  <AvatarFallback className="bg-gradient-to-br from-purple-700 to-pink-500 text-white text-2xl">👕</AvatarFallback>
                </Avatar>
                
                <div className="space-y-2">
                  <h2 className="text-5xl font-bold bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">{result.overallScore}/10</h2>
                  <p className="text-xl text-green-400 font-semibold">Style Score</p>
                  <div className="h-1.5 w-32 mx-auto bg-gray-800 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(result.overallScore / 10) * 100}%` }}
                      transition={{ delay: 0.5, duration: 1.2 }}
                      className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
                    />
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-black/30 backdrop-blur-lg border-white/10 rounded-lg"
              >
                <div className="p-6">
                  <h3 className="text-xl font-semibold text-white mb-4">Overall Feedback</h3>
                  <p className="text-white/80 leading-relaxed">
                    {result.rawAnalysis.split('\n')[0]}
                  </p>
                </div>
              </motion.div>

              {result.breakdown && result.breakdown.length > 0 && (
                <CategoryBreakdown categories={result.breakdown} />
              )}

              {result.tips && result.tips.length > 0 && (
                <StyleTips tips={result.tips} />
              )}

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="flex justify-center gap-4"
              >
                <Button
                  variant="outline"
                  size="lg"
                  className="rounded-full bg-white hover:bg-white/90 text-black border-none"
                  onClick={handleSave}
                >
                  <Save className="w-5 h-5 mr-2" />
                  Save
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  className="rounded-full bg-white hover:bg-white/90 text-black border-none"
                  onClick={handleShare}
                >
                  <Share2 className="w-5 h-5 mr-2" />
                  Share
                </Button>
              </motion.div>
              
              <div className="mt-8 flex justify-center">
                <Button
                  onClick={handleRestart}
                  className="bg-white/10 hover:bg-white/20 text-white transition-all"
                >
                  Analyze Another Outfit
                </Button>
              </div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="bg-black/30 backdrop-blur-lg border-white/10 rounded-lg overflow-hidden mt-8"
              >
                <div className="p-6">
                  <h3 className="text-xl font-semibold text-white mb-4">Full Analysis</h3>
                  <ScrollArea className="h-[300px] pr-4">
                    <div className="prose prose-invert max-w-none">
                      <ReactMarkdown>
                        {result.rawAnalysis}
                      </ReactMarkdown>
                    </div>
                  </ScrollArea>
                </div>
              </motion.div>
            </div>
          )}
        </motion.div>
      )}
    </motion.div>
  );
};
