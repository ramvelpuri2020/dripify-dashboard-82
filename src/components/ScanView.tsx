
import { useState } from "react";
import { ImageUpload } from "@/components/ImageUpload";
import { StyleSelector } from "@/components/StyleSelector";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import { analyzeStyle } from "@/utils/imageAnalysis";
import { useScanStore } from "@/store/scanStore";
import { Sparkles, Crown, Palette, Shirt, DollarSign, ChevronDown, Star, Check } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Share2, Save } from "lucide-react";
import ReactMarkdown from 'react-markdown';

export const ScanView = () => {
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [selectedStyle, setSelectedStyle] = useState("casual");
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisPhase, setAnalysisPhase] = useState<string>("");
  const [showResults, setShowResults] = useState(false);
  const { toast } = useToast();
  const setLatestScan = useScanStore((state) => state.setLatestScan);
  const [result, setResult] = useState<{ overallScore: number; rawAnalysis: string; imageUrl?: string; breakdown?: any[] } | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);

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

  const toggleCategory = (category: string) => {
    if (expandedCategories.includes(category)) {
      setExpandedCategories(expandedCategories.filter(c => c !== category));
    } else {
      setExpandedCategories([...expandedCategories, category]);
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "Color Coordination":
        return <Palette className="w-5 h-5 text-yellow-400" />;
      case "Fit & Proportion":
        return <Shirt className="w-5 h-5 text-blue-400" />;
      case "Style Coherence":
        return <Crown className="w-5 h-5 text-purple-400" />;
      case "Accessories":
        return <DollarSign className="w-5 h-5 text-green-400" />;
      case "Outfit Creativity":
        return <Sparkles className="w-5 h-5 text-pink-400" />;
      case "Trend Awareness":
        return <Star className="w-5 h-5 text-amber-400" />;
      default:
        return <Check className="w-5 h-5 text-teal-400" />;
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 8) return "from-green-400 to-emerald-500";
    if (score >= 6) return "from-yellow-400 to-amber-500";
    return "from-red-400 to-rose-500";
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
    setExpandedCategories([]);
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
                    Your outfit shows potential. Focus on accessorizing and color coordination to take it to the next level.
                  </p>
                </div>
              </motion.div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {result.breakdown && result.breakdown.map((category, index) => (
                  <motion.div
                    key={category.category}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 + (index * 0.1) }}
                  >
                    <Card className="bg-black/20 border-white/10 overflow-hidden">
                      <div 
                        className="p-4 cursor-pointer" 
                        onClick={() => toggleCategory(category.category)}
                      >
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            {getCategoryIcon(category.category)}
                            <span className="font-medium text-white">{category.category}</span>
                          </div>
                          <ChevronDown className={`w-5 h-5 text-white/60 transition-transform ${expandedCategories.includes(category.category) ? 'rotate-180' : ''}`} />
                        </div>
                        
                        <div className="mt-4">
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-2xl font-bold text-white">{category.score}</span>
                            <span className="text-sm text-white/60">out of 10</span>
                          </div>
                          <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: `${(category.score / 10) * 100}%` }}
                              transition={{ delay: 0.5, duration: 0.8 }}
                              className={`h-full bg-gradient-to-r ${getScoreColor(category.score)}`}
                            />
                          </div>
                        </div>
                      </div>
                      
                      {expandedCategories.includes(category.category) && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          transition={{ duration: 0.3 }}
                          className="px-4 pb-4"
                        >
                          <p className="text-sm text-white/70">{category.details}</p>
                        </motion.div>
                      )}
                    </Card>
                  </motion.div>
                ))}
              </div>

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
                className="hidden"
              >
                <ScrollArea className="h-[400px]">
                  <div className="p-6">
                    <h3 className="text-lg font-semibold text-white mb-4">Full Analysis</h3>
                    <div className="prose prose-invert max-w-none">
                      <ReactMarkdown>
                        {result.rawAnalysis}
                      </ReactMarkdown>
                    </div>
                  </div>
                </ScrollArea>
              </motion.div>
            </div>
          )}
        </motion.div>
      )}
    </motion.div>
  );
};
