
import { supabase } from '@/integrations/supabase/client';
import { useScanStore } from '@/store/scanStore';

export interface StyleAnalysisCategory {
  name: string;
  score: number;
  details: string;
}

export interface StyleAnalysisResult {
  fullAnalysis?: string;
  totalScore: number;
  categories?: StyleAnalysisCategory[];
  tips?: string[];
  nextLevelTips?: string[];
  summary?: string;
  breakdown: { category: string; score: number; emoji: string; details?: string }[];
  feedback: string;
  styleTips?: { category: string; tips: string[] }[];
}

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

    if (!data) {
      throw new Error('Invalid response format from AI service');
    }

    // Ensure we have valid data structure
    const validatedResult = validateAndCleanResult(data);
    
    // Upload image to Supabase Storage
    const imageUrl = await uploadImageToSupabase(imageFile);
    console.log('Image uploaded to Supabase:', imageUrl);
    
    // Create a thumbnail from the image
    const thumbnailUrl = imageUrl; // For now, using the same URL for both
    
    // Save the analysis to the database
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError) {
      console.error('Error getting user:', userError);
      throw new Error('User authentication error');
    }
    
    if (userData && userData.user) {
      const analysisData = {
        user_id: userData.user.id,
        total_score: validatedResult.totalScore,
        breakdown: validatedResult.breakdown,
        feedback: validatedResult.feedback,
        tips: validatedResult.styleTips || [],
        image_url: imageUrl,
        thumbnail_url: thumbnailUrl,
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
    
    // Update the scan store with the new analysis
    const store = useScanStore.getState();
    store.setLatestScan(validatedResult);
    
    return validatedResult;

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

// Helper function to validate and clean up the AI response
const validateAndCleanResult = (data: any): StyleAnalysisResult => {
  // Ensure breakdown is valid
  const breakdown = Array.isArray(data.breakdown) 
    ? data.breakdown.map(item => ({
        category: item.category || "Style Category",
        score: typeof item.score === 'number' ? Math.round(item.score) : 7,
        emoji: item.emoji || getCategoryEmoji(item.category || "Style Category"),
        details: item.details || "No details available"
      }))
    : defaultCategories();
  
  // Ensure styleTips is valid
  const styleTips = Array.isArray(data.styleTips) 
    ? data.styleTips.map(category => ({
        category: category.category || "Style Tips",
        tips: Array.isArray(category.tips) 
          ? category.tips
              .filter(tip => typeof tip === 'string' && tip.trim().length > 0)
              .map(cleanupText)
          : ["No specific tips available for this category"]
      }))
    : [];
  
  // Ensure nextLevelTips is valid
  const nextLevelTips = Array.isArray(data.nextLevelTips)
    ? data.nextLevelTips
        .filter(tip => typeof tip === 'string' && tip.trim().length > 0)
        .map(cleanupText)
    : [];
  
  // Create a clean summary/feedback
  const feedback = data.feedback 
    ? cleanupText(data.feedback) 
    : "Your outfit shows potential. Focus on accessorizing and color coordination to take it to the next level.";
  
  // Calculate total score as average of breakdown scores if not provided
  const totalScore = typeof data.totalScore === 'number' 
    ? Math.round(data.totalScore) 
    : Math.round(
        breakdown.reduce((sum, item) => sum + item.score, 0) / Math.max(1, breakdown.length)
      );
  
  return {
    totalScore,
    breakdown,
    feedback,
    styleTips,
    nextLevelTips
  };
};

// Clean up text by removing markdown formatting
const cleanupText = (text: string): string => {
  if (!text) return '';
  return text
    .replace(/^\*\*/g, '') // Remove leading **
    .replace(/\*\*$/g, '') // Remove trailing **
    .replace(/\*\*/g, '') // Remove all other **
    .trim();
};

// Default categories if missing from response
const defaultCategories = () => [
  { category: "Overall Style", score: 7, emoji: "👑", details: "The outfit has a nice balance but could use more cohesion." },
  { category: "Color Coordination", score: 6, emoji: "🎨", details: "The colors work together, but could use more intentional choices." },
  { category: "Fit and Proportion", score: 7, emoji: "📏", details: "The fit is generally flattering to your body shape." },
  { category: "Accessories", score: 5, emoji: "⭐", details: "The outfit lacks accessories that could elevate the look." },
  { category: "Trend Awareness", score: 7, emoji: "✨", details: "There's good awareness of current trends in this outfit." },
  { category: "Personal Style", score: 7, emoji: "🪄", details: "Your personality shows through in this outfit." }
];

// Helper function to get emoji for category
const getCategoryEmoji = (category: string): string => {
  const categoryLower = category.toLowerCase();
  if (categoryLower.includes('overall') || categoryLower.includes('style impression')) return '👑';
  if (categoryLower.includes('color')) return '🎨';
  if (categoryLower.includes('fit') || categoryLower.includes('proportion')) return '📏';
  if (categoryLower.includes('accessor')) return '⭐';
  if (categoryLower.includes('trend')) return '✨';
  if (categoryLower.includes('personal') || categoryLower.includes('expression')) return '🪄';
  return '🪄';
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
