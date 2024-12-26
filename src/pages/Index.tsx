import { useState } from "react";
import { ImageUpload } from "@/components/ImageUpload";
import { StyleSelector } from "@/components/StyleSelector";
import { DripScore } from "@/components/DripScore";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

const Index = () => {
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [selectedStyle, setSelectedStyle] = useState("casual");
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<{ score: number; feedback: string } | null>(
    null
  );
  const { toast } = useToast();

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
    
    // Mock result - in real app, this would come from your AI service
    setResult({
      score: Math.floor(Math.random() * 30) + 70, // Random score between 70-100
      feedback:
        "Your outfit shows great potential! The color coordination is on point, but consider adding some accessories to elevate the look. The fit of your clothes is good, and your style choice works well for the selected category.",
    });
    setAnalyzing(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">DripCheck</h1>
          <p className="text-gray-600">
            Upload your fit and get instant style feedback
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 space-y-6">
          <ImageUpload onImageSelect={setSelectedImage} />
          
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 text-center">
              What's the occasion?
            </h3>
            <StyleSelector selected={selectedStyle} onSelect={setSelectedStyle} />
          </div>

          <div className="flex justify-center">
            <Button
              onClick={handleAnalyze}
              disabled={!selectedImage || analyzing}
              className="bg-drip-primary hover:bg-drip-secondary text-white"
            >
              {analyzing ? "Analyzing..." : "Check Your Drip"}
            </Button>
          </div>

          {result && <DripScore score={result.score} feedback={result.feedback} />}
        </div>
      </div>
    </div>
  );
};

export default Index;