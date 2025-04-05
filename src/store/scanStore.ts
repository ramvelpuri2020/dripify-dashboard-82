
import { create } from 'zustand';
import { supabase } from '@/integrations/supabase/client';
import { StyleAnalysisResult, ScoreBreakdown } from '@/types/styleTypes';

interface ScanStoreState {
  latestScan: StyleAnalysisResult | null;
  isLoading: boolean;
  stats: {
    averageScore: number;
    bestScore: number;
    streak: number;
    totalScans: number;
  };
}

interface ScanStoreActions {
  setLatestScan: (scan: StyleAnalysisResult) => void;
  fetchUserStats: (userId?: string) => Promise<void>;
}

type ScanStore = ScanStoreState & ScanStoreActions;

export const useScanStore = create<ScanStore>((set, get) => ({
  latestScan: null,
  isLoading: false,
  stats: {
    averageScore: 0,
    bestScore: 0,
    streak: 0,
    totalScans: 0
  },
  
  setLatestScan: (scan) => set({ 
    latestScan: { 
      ...scan, 
      timestamp: new Date(),
      // Ensure breakdown is always defined
      breakdown: scan.breakdown || []
    }
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
      
      // Get total scan count
      const { count: totalScans, error: countError } = await supabase
        .from('style_analyses')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);
        
      if (countError) {
        console.error('Error fetching scan count:', countError);
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
        .maybeSingle();
        
      let streak = 0;
      
      if (!latestError && latestScan) {
        streak = latestScan.streak_count || 0;
      }
      
      set({
        stats: {
          averageScore,
          bestScore,
          streak,
          totalScans: totalScans || 0
        },
        isLoading: false
      });
      
    } catch (error) {
      console.error('Error in fetchUserStats:', error);
      set({ isLoading: false });
    }
  }
}));
