
import { supabase } from '@/integrations/supabase/client';
import { useScanStore } from '@/store/scanStore';

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

    const result = {
      totalScore: data.totalScore,
      breakdown: data.breakdown,
      feedback: data.feedback,
      styleTips: data.styleTips || [],
      nextLevelTips: data.nextLevelTips || []
    };

    // Save analysis to Supabase
    saveAnalysisToSupabase(result, imageFile);

    // Update the scan store with the new analysis
    const store = useScanStore.getState();
    store.setLatestScan(result);
    store.fetchUserStats();

    return result;

  } catch (error) {
    console.error('Error analyzing style:', error);
    throw error;
  }
};

const saveAnalysisToSupabase = async (result: StyleAnalysisResult, imageFile: File) => {
  try {
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.log('No user logged in, skipping save to Supabase');
      return;
    }

    // Upload image to Supabase Storage
    const fileName = `outfit_${Date.now()}_${imageFile.name.replace(/\s+/g, '_')}`;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('outfit_images')
      .upload(`public/${fileName}`, imageFile);

    if (uploadError) {
      console.error('Error uploading image:', uploadError);
      return;
    }

    // Get public URL for the uploaded image
    const { data: { publicUrl } } = supabase.storage
      .from('outfit_images')
      .getPublicUrl(`public/${fileName}`);

    // Store analysis in Supabase database
    const { data, error } = await supabase
      .from('style_analyses')
      .insert({
        user_id: user.id,
        total_score: result.totalScore,
        breakdown: result.breakdown,
        feedback: result.feedback,
        tips: result.styleTips,
        image_url: publicUrl,
        scan_date: new Date().toISOString()
      });

    if (error) {
      console.error('Error saving analysis to database:', error);
    }

  } catch (error) {
    console.error('Error in saveAnalysisToSupabase:', error);
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
