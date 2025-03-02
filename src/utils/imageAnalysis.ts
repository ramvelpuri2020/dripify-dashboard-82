import { supabase } from '@/integrations/supabase/client';

export interface StyleAnalysisResult {
  totalScore: number;
  breakdown: {
    category: string;
    score: number;
    emoji: string;
    details?: string;
  }[];
  feedback: string;
  styleTips?: {
    category: string;
    tips: string[];
  }[];
  nextLevelTips?: string[];
}

export const analyzeStyle = async (imageFile: File): Promise<StyleAnalysisResult> => {
  try {
    // Convert image to base64
    const base64Image = await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(imageFile);
    });

    console.log('Calling analyze-style function...');
    const { data, error } = await supabase.functions.invoke('analyze-style', {
      body: { image: base64Image, style: "casual" }
    });

    if (error) {
      console.error('Supabase function error:', error);
      throw new Error('Failed to analyze image');
    }

    console.log('Analysis response:', data);

    if (!data || !data.totalScore || !data.breakdown || !data.feedback) {
      console.error('Invalid response format:', data);
      throw new Error('Invalid response format from OpenAI');
    }

    return {
      totalScore: data.totalScore,
      breakdown: data.breakdown,
      feedback: data.feedback,
      styleTips: data.styleTips || [],
      nextLevelTips: data.nextLevelTips || []
    };

  } catch (error) {
    console.error('Error analyzing style:', error);
    throw error;
  }
};

// Legacy function - we'll keep this for backward compatibility
export const generateTipsForCategory = (category: string, score: number): string[] => {
  const defaultTips = [
    "Consider consulting with a personal stylist for more tailored advice.",
    "Experiment with different styles to find what works best for you.",
    "Focus on what makes you feel confident and comfortable."
  ];
  
  // The function now returns default tips, as we'll be using AI-generated tips instead
  return defaultTips;
};
