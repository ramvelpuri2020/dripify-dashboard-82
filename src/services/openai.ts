
import { supabase } from "@/integrations/supabase/client";

export const analyzeOutfit = async (imageBase64: string, style: string) => {
  try {
    console.log('Sending image for analysis...');
    const { data, error } = await supabase.functions.invoke('analyze-style', {
      body: { image: imageBase64, style }
    });

    if (error) {
      console.error('Supabase function error:', error);
      throw new Error('Failed to analyze image: ' + error.message);
    }

    if (!data || !data.totalScore) {
      console.error('Invalid response format:', data);
      throw new Error('Invalid response format from AI service');
    }

    console.log('Analysis completed successfully:', data);
    return data;
  } catch (error) {
    console.error('Analysis error:', error);
    throw error;
  }
};

export const getTipsAnalysis = async (imageBase64: string) => {
  return analyzeOutfit(imageBase64, 'general');
};
