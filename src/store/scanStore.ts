
import { create } from 'zustand';
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
  timestamp?: Date;
}

interface ScanStoreState {
  latestScan: StyleAnalysisResult | null;
  styleStats: {
    averageScore: number;
    bestScore: number;
    streak: number;
  };
  isLoading: boolean;
}

interface ScanStoreActions {
  setLatestScan: (scan: StyleAnalysisResult) => void;
  fetchUserStats: (userId?: string) => Promise<void>;
}

type ScanStore = ScanStoreState & ScanStoreActions;

export const useScanStore = create<ScanStore>((set, get) => ({
  latestScan: null,
  styleStats: {
    averageScore: 0,
    bestScore: 0,
    streak: 0,
  },
  isLoading: false,
  
  setLatestScan: (scan) => set({ 
    latestScan: { ...scan, timestamp: new Date() }
  }),
  
  fetchUserStats: async (userId) => {
    set({ isLoading: true });
    
    try {
      // If no userId is provided, get the current user
      if (!userId) {
        const { data: { user } } = await supabase.auth.getUser();
        userId = user?.id;
      }
      
      if (!userId) {
        console.log("No user ID available for fetching stats");
        set({ isLoading: false });
        return;
      }
      
      // Fetch average score
      const { data: scoreData, error: scoreError } = await supabase
        .from('style_analyses')
        .select('total_score')
        .eq('user_id', userId);
        
      if (scoreError) {
        console.error('Error fetching scores:', scoreError);
        set({ isLoading: false });
        return;
      }
      
      let averageScore = 0;
      let bestScore = 0;
      
      if (scoreData && scoreData.length > 0) {
        // Calculate average score
        averageScore = Math.round(
          scoreData.reduce((acc, curr) => acc + curr.total_score, 0) / scoreData.length
        );
        
        // Find best score
        bestScore = Math.max(...scoreData.map(item => item.total_score));
      }
      
      // Get streak
      const { data: latestScan, error: latestError } = await supabase
        .from('style_analyses')
        .select('streak_count')
        .eq('user_id', userId)
        .order('scan_date', { ascending: false })
        .limit(1)
        .single();
        
      let streak = 0;
      
      if (!latestError && latestScan) {
        streak = latestScan.streak_count || 0;
      }
      
      set({
        styleStats: {
          averageScore,
          bestScore,
          streak
        },
        isLoading: false
      });
      
    } catch (error) {
      console.error('Error in fetchUserStats:', error);
      set({ isLoading: false });
    }
  }
}));
