
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
  breakdown?: { category: string; score: number; emoji: string; details?: string }[];
  feedback?: string;
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
      throw new Error('Failed to analyze image: ' + error.message);
    }

    console.log('Analysis response:', data);

    if (!data) {
      console.error('Invalid response format:', data);
      throw new Error('Invalid response format from AI service');
    }

    // Format the result to match our desired structure
    const result: StyleAnalysisResult = {
      fullAnalysis: data.fullAnalysis || '',
      totalScore: data.totalScore || 0,
      categories: data.categories || [],
      tips: data.tips || [],
      nextLevelTips: data.nextLevelTips || [],
      summary: data.summary || '',
      // Add these properties to make it compatible with scanStore interface
      breakdown: mapCategoriesToBreakdown(data.categories || []),
      feedback: data.summary || ''
    };

    // Try to save analysis, but don't stop the flow if it fails
    try {
      await saveAnalysisToSupabase(result, imageFile);
    } catch (saveError) {
      console.error('Error saving analysis to Supabase (continuing anyway):', saveError);
    }

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

// Helper function to map categories to breakdown format
const mapCategoriesToBreakdown = (categories: StyleAnalysisCategory[]) => {
  return categories.map(cat => ({
    category: cat.name,
    score: cat.score,
    emoji: getCategoryEmoji(cat.name),
    details: cat.details
  }));
};

const saveAnalysisToSupabase = async (result: StyleAnalysisResult, imageFile: File) => {
  try {
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.log('No user logged in, skipping save to Supabase');
      return;
    }

    // Check if storage bucket exists before uploading
    const { data: buckets } = await supabase.storage.listBuckets();
    const outfitBucketExists = buckets?.some(bucket => bucket.name === 'outfit_images');
    
    if (!outfitBucketExists) {
      console.log('Outfit images bucket not found, skipping image upload');
      // We'll still save the analysis data without images
    } else {
      // Upload image to Supabase Storage
      const fileName = `outfit_${Date.now()}_${imageFile.name.replace(/\s+/g, '_')}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('outfit_images')
        .upload(`public/${fileName}`, imageFile);

      if (uploadError) {
        console.error('Error uploading image:', uploadError);
      }

      let publicUrl = '';
      let thumbnailUrl = '';

      if (!uploadError) {
        // Get public URL for the uploaded image
        const { data: { publicUrl: imgUrl } } = supabase.storage
          .from('outfit_images')
          .getPublicUrl(`public/${fileName}`);
        
        publicUrl = imgUrl;

        // Generate thumbnail
        try {
          const thumbnail = await generateThumbnail(imageFile);
          const thumbnailPath = `thumb_${fileName}`;
          
          const { error: thumbError } = await supabase.storage
            .from('outfit_images')
            .upload(`public/${thumbnailPath}`, thumbnail);

          if (!thumbError) {
            const { data: { publicUrl: thumbUrl } } = supabase.storage
              .from('outfit_images')
              .getPublicUrl(`public/${thumbnailPath}`);
            
            thumbnailUrl = thumbUrl;
          }
        } catch (thumbErr) {
          console.error('Error creating thumbnail:', thumbErr);
        }
      }
    }

    // Get the current date in ISO format
    const currentDate = new Date().toISOString();
    const currentDateString = currentDate.split('T')[0]; // YYYY-MM-DD format

    // Check if there's a previous scan to calculate streak
    const { data: previousScan, error: scanError } = await supabase
      .from('style_analyses')
      .select('scan_date, last_scan_date, streak_count')
      .eq('user_id', user.id)
      .order('scan_date', { ascending: false })
      .limit(1)
      .maybeSingle();

    let streakCount = 1; // Default to 1 for first scan
    
    if (!scanError && previousScan) {
      const prevDate = previousScan.last_scan_date;
      const today = currentDateString;
      
      if (prevDate) {
        const prevDateObj = new Date(prevDate);
        const todayObj = new Date(today);
        
        // Calculate days difference
        const diffTime = todayObj.getTime() - prevDateObj.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays === 1) {
          // Consecutive day, increment streak
          streakCount = (previousScan.streak_count || 0) + 1;
        } else if (diffDays === 0) {
          // Same day, maintain streak
          streakCount = previousScan.streak_count || 1;
        } else {
          // Streak broken
          streakCount = 1;
        }
      }
    }

    // Convert categories to breakdown format for database
    const breakdown = result.breakdown || mapCategoriesToBreakdown(result.categories);

    // Store analysis in Supabase database
    const { data, error } = await supabase
      .from('style_analyses')
      .insert({
        user_id: user.id,
        total_score: result.totalScore,
        breakdown: breakdown,
        feedback: result.summary,
        tips: result.tips.map(tip => ({ category: "General", tips: [tip] })),
        scan_date: currentDate,
        last_scan_date: currentDateString,
        streak_count: streakCount,
        image_url: "placeholder.svg", // Use placeholder if image upload failed
        thumbnail_url: "placeholder.svg" // Use placeholder if thumbnail upload failed
      });

    if (error) {
      console.error('Error saving analysis to database:', error);
    }

  } catch (error) {
    console.error('Error in saveAnalysisToSupabase:', error);
    throw error;
  }
};

// Helper function to generate thumbnail
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
