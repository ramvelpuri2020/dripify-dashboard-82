
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

    // Check if we got valid data or need to use the default response
    const validResponse = data && data.totalScore ? data : (data && data.defaultResponse ? data.defaultResponse : null);
    
    if (!validResponse) {
      console.error('Invalid response format:', data);
      throw new Error('Invalid response format from AI service');
    }

    console.log('Analysis completed successfully:', validResponse);
    return validResponse;
  } catch (error) {
    console.error('Analysis error:', error);
    throw error;
  }
};

export const getTipsAnalysis = async (imageBase64: string) => {
  return analyzeOutfit(imageBase64, 'general');
};
