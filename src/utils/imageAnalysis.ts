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

    if (!data) {
      throw new Error('No data received from style analysis');
    }

    // Validate and provide defaults for any missing fields
    const result: StyleAnalysisResult = {
      totalScore: data.totalScore || 5,
      breakdown: data.breakdown || [],
      feedback: data.feedback || "No feedback provided",
      styleTips: data.styleTips || [],
      nextLevelTips: data.nextLevelTips || []
    };

    // Ensure all required breakdown categories exist
    const requiredCategories = [
      { category: "Overall Style", emoji: "👑" },
      { category: "Color Coordination", emoji: "🎨" },
      { category: "Fit & Proportion", emoji: "📏" },
      { category: "Accessories", emoji: "⭐" },
      { category: "Trend Alignment", emoji: "✨" },
      { category: "Style Expression", emoji: "🪄" }
    ];

    // Fill in any missing categories
    if (result.breakdown.length === 0) {
      result.breakdown = requiredCategories.map(cat => ({
        ...cat,
        score: 5,
        details: "No specific details provided."
      }));
    } else {
      // Check for any missing categories and add them with default values
      requiredCategories.forEach(reqCat => {
        if (!result.breakdown.some(item => item.category === reqCat.category)) {
          result.breakdown.push({
            category: reqCat.category,
            emoji: reqCat.emoji,
            score: 5,
            details: "No specific details provided."
          });
        }
      });
    }

    // Save analysis to Supabase
    await saveAnalysisToSupabase(result, imageFile);

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
        scan_date: currentDate,
        last_scan_date: currentDateString,
        streak_count: streakCount
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
