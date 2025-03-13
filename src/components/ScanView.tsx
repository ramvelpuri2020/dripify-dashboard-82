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
import { supabase } from "@/integrations/supabase/client";

export const ScanView = () => {
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [selectedStyle, setSelectedStyle] = useState("casual");
  const [analyzing, setAnalyzing] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const { toast } = useToast();
  const setLatestScan = useScanStore((state) => state.setLatestScan);
  const [result, setResult] = useState<any>(null);

  const generateThumbnail = async (file: File): Promise<Blob> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        const size = 200;
        canvas.width = size;
        canvas.height = size;

        const scale = Math.min(size / img.width, size / img.height);
        const x = (size - img.width * scale) / 2;
        const y = (size - img.height * scale) / 2;

        if (ctx) {
          ctx.fillStyle = '#000000';
          ctx.fillRect(0, 0, size, size);
          ctx.drawImage(img, x, y, img.width * scale, img.height * scale);
        }

        canvas.toBlob((blob) => {
          if (blob) resolve(blob);
        }, 'image/jpeg', 0.8);
      };

      img.src = URL.createObjectURL(file);
    });
  };

  const saveAnalysisToDatabase = async (analysis: any, imageUrl: string, thumbnailUrl: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from('style_analyses')
      .insert({
        user_id: user.id,
        total_score: analysis.totalScore,
        breakdown: analysis.breakdown,
        feedback: analysis.feedback,
        image_url: imageUrl,
        thumbnail_url: thumbnailUrl,
        tips: analysis.tips,
        scan_date: new Date().toISOString(),
        last_scan_date: new Date().toISOString().split('T')[0]
      });

    if (error) {
      console.error('Error saving analysis:', error);
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
      console.log('Starting analysis...');
      const analysisResult = await analyzeStyle(selectedImage);
      console.log('Analysis completed:', analysisResult);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const fileExt = selectedImage.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      const { error: uploadError, data } = await supabase.storage
        .from('style-images')
        .upload(filePath, selectedImage);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('style-images')
        .getPublicUrl(filePath);

      const thumbnail = await generateThumbnail(selectedImage);
      const thumbnailPath = `${user.id}/thumb_${fileName}`;
      
      const { error: thumbError } = await supabase.storage
        .from('style-thumbnails')
        .upload(thumbnailPath, thumbnail);

      if (thumbError) throw thumbError;

      const { data: { publicUrl: thumbnailUrl } } = supabase.storage
        .from('style-thumbnails')
        .getPublicUrl(thumbnailPath);

      await saveAnalysisToDatabase(analysisResult, publicUrl, thumbnailUrl);

      setResult(analysisResult);
      setLatestScan(analysisResult);
      setShowResults(true);

      toast({
        title: "Analysis Complete",
        description: "Your style has been analyzed and saved!",
      });
    } catch (error) {
      console.error("Analysis error:", error);
      toast({
        title: "Analysis failed",
        description: error instanceof Error ? error.message : "There was an error analyzing your image",
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
        <motion.div
          initial={{ opacity: 0, x: 100 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
        >
          {result && (
            <DripResults
              totalScore={result.totalScore}
              breakdown={result.breakdown}
              feedback={result.feedback}
              styleTips={result.styleTips}
              nextLevelTips={result.nextLevelTips}
              onShare={handleShare}
              onSave={handleSave}
              profileImage={selectedImage ? URL.createObjectURL(selectedImage) : undefined}
            />
          )}
        </motion.div>
      )}
    </motion.div>
  );
};
