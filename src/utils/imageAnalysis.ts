
import { supabase } from '@/integrations/supabase/client';
import { useScanStore } from '@/store/scanStore';
import type { StyleAnalysisResult } from '@/types/styleTypes';
import { parseAnalysis } from '@/utils/analysisParser';

export const analyzeStyle = async (imageFile: File): Promise<StyleAnalysisResult> => {
  try {
    // Convert image to base64 with optimized method
    const base64Image = await fileToBase64(imageFile);
    
    console.log('Starting style analysis...');
    const startTime = performance.now();
    
    // Call the analyze-style Supabase function with improved timeout handling
    // Reduced timeout from 30s to 20s for faster user feedback
    const timeoutPromise = new Promise<never>((_, reject) => 
      setTimeout(() => reject(new Error('Analysis timed out')), 20000)
    );
    
    // Pre-upload the image to Supabase Storage in parallel with the analysis
    const imageUploadPromise = uploadImageToSupabase(imageFile);
    
    const analysisPromise = supabase.functions.invoke('analyze-style', {
      body: { image: base64Image, style: "casual" }
    });
    
    // Race between timeout and analysis completion
    const { data, error } = await Promise.race([analysisPromise, timeoutPromise]) as any;
    
    if (error) {
      console.error('Supabase function error:', error);
      throw new Error('Failed to analyze image: ' + error.message);
    }
    
    if (!data || !data.feedback) {
      throw new Error('Invalid response format from AI service');
    }
    
    const endTime = performance.now();
    console.log(`Analysis completed in ${Math.round(endTime - startTime)}ms`);
    
    // Parse the analysis results
    const analysisData = parseAnalysis(data.feedback);
    
    // Wait for the image upload to complete
    const imageUrl = await imageUploadPromise;
    console.log('Image uploaded to Supabase');
    
    // Get user info for database save
    const { data: userData } = await supabase.auth.getUser();
    
    // Save analysis to database if user is logged in
    if (userData && userData.user) {
      const dbAnalysisData = {
        user_id: userData.user.id,
        total_score: analysisData.overallScore || 0,
        raw_analysis: data.feedback,
        feedback: analysisData.summary || data.feedback.substring(0, 200) + '...',
        breakdown: JSON.stringify(analysisData.breakdown || []),
        tips: JSON.stringify(analysisData.tips || []),
        image_url: imageUrl,
        thumbnail_url: imageUrl,
        scan_date: new Date().toISOString(),
      };
      
      try {
        await supabase
          .from('style_analyses')
          .insert(dbAnalysisData);
          
        console.log('Analysis saved to database');
      } catch (dbError) {
        console.error('Database error:', dbError);
      }
    }
    
    // Create the result object
    const result: StyleAnalysisResult = {
      overallScore: analysisData.overallScore || 0,
      rawAnalysis: data.feedback,
      imageUrl,
      breakdown: analysisData.breakdown || [],
      tips: analysisData.tips || [],
      summary: analysisData.summary
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

// Optimized image upload with parallel processing
const uploadImageToSupabase = async (imageFile: File): Promise<string> => {
  try {
    const timestamp = new Date().getTime();
    const filePath = `outfit_${timestamp}_${imageFile.name.replace(/\s+/g, '_')}`;
    
    // Try upload with automatic retry and reduced wait time
    let retries = 0;
    const maxRetries = 1; // Reduced retries for faster response
    
    while (retries <= maxRetries) {
      try {
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('style_images')
          .upload(filePath, imageFile, { cacheControl: '3600', upsert: true });
          
        if (!uploadError) {
          // Get public URL for the uploaded image
          const { data: { publicUrl } } = supabase.storage
            .from('style_images')
            .getPublicUrl(filePath);
            
          return publicUrl;
        }
        
        retries++;
        if (retries <= maxRetries) {
          // Shorter exponential backoff
          await new Promise(resolve => setTimeout(resolve, 100));
        } else {
          throw uploadError;
        }
      } catch (uploadError) {
        if (retries >= maxRetries) throw uploadError;
      }
    }
    
    throw new Error('Failed to upload image after retries');
  } catch (error) {
    console.error('Image upload error:', error);
    throw error;
  }
};

// Optimized base64 conversion
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
