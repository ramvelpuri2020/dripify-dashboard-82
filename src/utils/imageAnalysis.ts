
import { supabase } from '@/integrations/supabase/client';
import { useScanStore } from '@/store/scanStore';

export interface StyleAnalysisCategory {
  name: string;
  score: number;
  details: string;
}

export interface StyleAnalysisResult {
  fullAnalysis: string;
  totalScore: number;
  categories: StyleAnalysisCategory[];
  tips: string[];
  nextLevelTips: string[];
  summary: string;
  breakdown: { category: string; score: number; emoji: string; details?: string }[];
  feedback: string;
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
    
    // Try to save analysis to Supabase
    try {
      await saveAnalysisToSupabase(validatedResult, imageFile);
    } catch (saveError) {
      console.error('Error saving analysis to Supabase (continuing anyway):', saveError);
    }

    // Update the scan store with the new analysis
    const store = useScanStore.getState();
    store.setLatestScan(validatedResult);
    store.fetchUserStats();

    return validatedResult;

  } catch (error) {
    console.error('Error analyzing style:', error);
    throw error;
  }
};

// Helper function to validate and clean up the AI response
const validateAndCleanResult = (data: any): StyleAnalysisResult => {
  // Clean up tips if they're present
  const cleanedTips = Array.isArray(data.tips) 
    ? cleanTextArray(data.tips.filter(tip => typeof tip === 'string'))
    : [];

  // Clean up nextLevelTips if they're present  
  const cleanedNextLevelTips = Array.isArray(data.nextLevelTips)
    ? cleanTextArray(data.nextLevelTips.filter(tip => typeof tip === 'string'))
    : [];
  
  // Ensure categories are valid
  const categories = Array.isArray(data.categories) 
    ? data.categories 
    : defaultCategories();
  
  // Ensure breakdown is valid
  const breakdown = Array.isArray(data.breakdown) 
    ? data.breakdown 
    : mapCategoriesToBreakdown(categories);
  
  // Create a clean summary
  const summary = data.summary 
    ? cleanText(data.summary) 
    : "Your outfit shows potential. Focus on accessorizing and color coordination to take it to the next level.";
  
  return {
    fullAnalysis: data.fullAnalysis || '',
    totalScore: typeof data.totalScore === 'number' ? data.totalScore : 7,
    categories: categories,
    tips: cleanedTips.length > 0 ? cleanedTips : generateDefaultTips(),
    nextLevelTips: cleanedNextLevelTips.length > 0 ? cleanedNextLevelTips : generateDefaultNextLevelTips(),
    summary: summary,
    breakdown: breakdown,
    feedback: summary
  };
};

// Default categories if missing from response
const defaultCategories = (): StyleAnalysisCategory[] => [
  { name: "Overall Style", score: 7, details: "The outfit has a nice balance but could use more cohesion." },
  { name: "Color Coordination", score: 6, details: "The colors work together, but could use more intentional choices." },
  { name: "Fit and Proportion", score: 7, details: "The fit is generally flattering to your body shape." },
  { name: "Accessorizing", score: 5, details: "The outfit lacks accessories that could elevate the look." },
  { name: "Trend Awareness", score: 7, details: "There's good awareness of current trends in this outfit." },
  { name: "Personal Style", score: 7, details: "Your personality shows through in this outfit." }
];

// Generate default tips
const generateDefaultTips = (): string[] => [
  "Consider adding accessories to complete your look.",
  "Try experimenting with colors that complement your skin tone.",
  "Consider a statement piece to elevate your outfit.",
  "Ensure your clothing fits well to create a more polished look."
];

// Generate default next level tips
const generateDefaultNextLevelTips = (): string[] => [
  "Experiment with layering different textures for added visual interest.",
  "Invest in high-quality basics that can be mixed and matched."
];

// Helper function to clean up text
const cleanText = (text: string): string => {
  if (!text || typeof text !== 'string') return '';
  
  // Remove any leading/trailing asterisks and excessive whitespace
  return text
    .replace(/^\*+\s*|\s*\*+$/g, '')
    .replace(/\n\n+/g, '\n')
    .trim();
};

// Helper function to clean up text arrays
const cleanTextArray = (textArray: string[]): string[] => {
  if (!Array.isArray(textArray) || textArray.length === 0) return [];
  
  return textArray
    .filter(tip => tip && typeof tip === 'string' && tip.trim().length > 0)
    .map(tip => cleanText(tip))
    .filter(tip => tip.length > 5); // Filter out very short tips
};

// Helper function to map categories to breakdown format
const mapCategoriesToBreakdown = (categories: StyleAnalysisCategory[]) => {
  return categories.map(cat => ({
    category: cat.name,
    score: cat.score,
    emoji: getCategoryEmoji(cat.name),
    details: cat.details
  }));
};

// Helper function to get emoji for category
const getCategoryEmoji = (category: string): string => {
  const categoryLower = category.toLowerCase();
  if (categoryLower.includes('overall') || categoryLower.includes('style expression')) return '👑';
  if (categoryLower.includes('color')) return '🎨';
  if (categoryLower.includes('fit') || categoryLower.includes('proportion')) return '📏';
  if (categoryLower.includes('accessor')) return '⭐';
  if (categoryLower.includes('trend')) return '✨';
  if (categoryLower.includes('personal')) return '🪄';
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

// Save analysis to Supabase
const saveAnalysisToSupabase = async (result: StyleAnalysisResult, imageFile: File) => {
  try {
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.log('No user logged in, skipping save to Supabase');
      return;
    }

    // Check if outfit_images bucket exists
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      console.error('Error checking buckets:', bucketsError);
      throw bucketsError;
    }
    
    const outfitBucketExists = buckets?.some(bucket => bucket.name === 'outfit_images');
    
    let imageUrl = 'placeholder.svg';
    let thumbnailUrl = 'placeholder.svg';
    
    if (!outfitBucketExists) {
      console.log('Outfit images bucket not found, skipping image upload');
      
      // Try to create the bucket
      try {
        const { error: createError } = await supabase.storage.createBucket(
          'outfit_images', 
          { public: true }
        );
        
        if (createError) {
          console.error('Error creating bucket:', createError);
        } else {
          console.log('Successfully created outfit_images bucket');
          // Now upload the image to the newly created bucket
          await uploadImageToBucket(imageFile, user.id, result);
          return; // Exit after successful bucket creation and upload
        }
      } catch (createBucketError) {
        console.error('Error creating bucket:', createBucketError);
      }
    } else {
      // Bucket exists, upload the image
      await uploadImageToBucket(imageFile, user.id, result);
    }
  } catch (error) {
    console.error('Error in saveAnalysisToSupabase:', error);
    throw error;
  }
};

// Helper function to upload image to bucket and save analysis data
const uploadImageToBucket = async (imageFile: File, userId: string, result: StyleAnalysisResult) => {
  try {
    // Upload image to Supabase Storage
    const fileName = `outfit_${Date.now()}_${imageFile.name.replace(/\s+/g, '_')}`;
    const filePath = `public/${fileName}`;
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('outfit_images')
      .upload(filePath, imageFile, {
        cacheControl: '3600',
        upsert: true
      });

    if (uploadError) {
      console.error('Error uploading image:', uploadError);
      throw uploadError;
    }
    
    // Get the public URL
    const { data: publicUrlData } = supabase.storage
      .from('outfit_images')
      .getPublicUrl(filePath);
      
    const imageUrl = publicUrlData?.publicUrl || `outfit_images/${filePath}`;
    
    // Generate and upload thumbnail
    try {
      const thumbnail = await generateThumbnail(imageFile);
      const thumbnailPath = `public/thumb_${fileName}`;
      
      const { data: thumbData, error: thumbError } = await supabase.storage
        .from('outfit_images')
        .upload(thumbnailPath, thumbnail, {
          cacheControl: '3600',
          upsert: true
        });
        
      if (thumbError) {
        console.error('Error uploading thumbnail:', thumbError);
      }
      
      const { data: thumbUrlData } = supabase.storage
        .from('outfit_images')
        .getPublicUrl(thumbnailPath);
        
      const thumbnailUrl = thumbUrlData?.publicUrl || `outfit_images/${thumbnailPath}`;
      
      // Get the current date
      const currentDate = new Date().toISOString();
      const currentDateString = currentDate.split('T')[0]; // YYYY-MM-DD format

      // Prepare streak calculation data
      const { data: previousScan } = await supabase
        .from('style_analyses')
        .select('scan_date, last_scan_date, streak_count')
        .eq('user_id', userId)
        .order('scan_date', { ascending: false })
        .limit(1)
        .maybeSingle();
        
      let streakCount = 1; // Default for first scan
      
      if (previousScan) {
        const prevDate = previousScan.last_scan_date;
        
        if (prevDate) {
          const prevDateObj = new Date(prevDate);
          const todayObj = new Date(currentDateString);
          
          // Calculate days difference
          const diffTime = todayObj.getTime() - prevDateObj.getTime();
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          
          if (diffDays === 1) {
            // Consecutive day, increment streak
            streakCount = (previousScan.streak_count || 0) + 1;
          } else if (diffDays === 0) {
            // Same day, maintain streak
            streakCount = previousScan.streak_count || 1;
          }
        }
      }

      // Format tips for storage
      const formattedTips = result.tips.map(tip => ({ 
        category: "General", 
        tips: [tip] 
      }));

      // Store analysis in database
      const { error: insertError } = await supabase
        .from('style_analyses')
        .insert({
          user_id: userId,
          total_score: result.totalScore,
          breakdown: result.breakdown,
          feedback: result.summary,
          tips: formattedTips,
          scan_date: currentDate,
          last_scan_date: currentDateString,
          streak_count: streakCount,
          image_url: imageUrl,
          thumbnail_url: thumbnailUrl
        });
        
      if (insertError) {
        console.error('Error inserting analysis data:', insertError);
      } else {
        console.log('Successfully saved analysis with image:', imageUrl);
      }
      
    } catch (thumbErr) {
      console.error('Error in thumbnail process:', thumbErr);
    }
  } catch (error) {
    console.error('Error in uploadImageToBucket:', error);
    throw error;
  }
};

// Helper function to generate thumbnail
const generateThumbnail = async (file: File): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      const size = 200;
      canvas.width = size;
      canvas.height = size;

      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }
      
      // Create a square thumbnail
      const scale = Math.min(size / img.width, size / img.height);
      const x = (size - img.width * scale) / 2;
      const y = (size - img.height * scale) / 2;

      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, size, size);
      ctx.drawImage(img, x, y, img.width * scale, img.height * scale);

      canvas.toBlob((blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Failed to create thumbnail'));
      }, 'image/jpeg', 0.8);
    };
    
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = URL.createObjectURL(file);
  });
};
