import { supabase } from '@/integrations/supabase/client';
import { useScanStore } from '@/store/scanStore';
import type { ScoreBreakdown, StyleAnalysisResult } from '@/types/styleTypes';
import { parseMarkdownToJSON } from '@/utils/analysisParser';

export const analyzeStyle = async (imageFile: File): Promise<StyleAnalysisResult> => {
  try {
    // Convert image to base64
    const base64Image = await fileToBase64(imageFile);
    
    console.log('Calling analyze-style function...');
    const startTime = performance.now();
    
    const { data, error } = await supabase.functions.invoke('analyze-style', {
      body: { image: base64Image, style: "casual" }
    });

    if (error) {
      console.error('Supabase function error:', error);
      throw new Error('Failed to analyze image: ' + error.message);
    }

    const endTime = performance.now();
    console.log(`Analysis completed in ${Math.round(endTime - startTime)}ms`);
    console.log('Analysis response:', data);

    if (!data || !data.feedback) {
      throw new Error('Invalid response format from AI service');
    }
    
    // Parse the raw analysis to extract structured data
    const parsedAnalysis = parseMarkdownToJSON(data.feedback);
    
    // Upload image to Supabase Storage
    const imageUrl = await uploadImageToSupabase(imageFile);
    console.log('Image uploaded to Supabase:', imageUrl);
    
    // Save the analysis to the database
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError) {
      console.error('Error getting user:', userError);
      throw new Error('User authentication error');
    }
    
    if (userData && userData.user) {
      // Stringify the breakdown for database compatibility
      const breakdownJson = JSON.stringify(parsedAnalysis.breakdown || []);
      
      const analysisData = {
        user_id: userData.user.id,
        total_score: parsedAnalysis.totalScore,
        raw_analysis: data.feedback,
        feedback: parsedAnalysis.feedback || data.feedback.substring(0, 200) + '...', 
        breakdown: breakdownJson,
        image_url: imageUrl,
        thumbnail_url: imageUrl,
        scan_date: new Date().toISOString(),
      };
      
      const { error: insertError } = await supabase
        .from('style_analyses')
        .insert(analysisData);
        
      if (insertError) {
        console.error('Error saving analysis to database:', insertError);
      } else {
        console.log('Analysis saved to database successfully');
      }
    } else {
      console.log('User not logged in, skipping database save');
    }
    
    // Create result in the format expected by the UI
    const result: StyleAnalysisResult = {
      overallScore: parsedAnalysis.totalScore,
      rawAnalysis: data.feedback,
      breakdown: parsedAnalysis.breakdown,
      imageUrl
    };
    
    // Update the scan store with the new analysis
    const store = useScanStore.getState();
    store.setLatestScan(result);
    
    return result;
  } catch (error) {
    console.error('Error analyzing style:', error);
    throw error;
  }
};

// Upload image to Supabase Storage
const uploadImageToSupabase = async (imageFile: File): Promise<string> => {
  try {
    const timestamp = new Date().getTime();
    const filePath = `outfit_${timestamp}_${imageFile.name.replace(/\s+/g, '_')}`;
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('style_images')
      .upload(filePath, imageFile);
      
    if (uploadError) {
      console.error('Error uploading image:', uploadError);
      throw new Error('Failed to upload image to storage');
    }
    
    // Get public URL for the uploaded image
    const { data: { publicUrl } } = supabase.storage
      .from('style_images')
      .getPublicUrl(filePath);
      
    return publicUrl;
  } catch (error) {
    console.error('Image upload error:', error);
    throw error;
  }
};

// Convert file to base64
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Failed to convert file to base64'));
      }
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
};
