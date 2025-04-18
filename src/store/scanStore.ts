import { create } from 'zustand';
import type { ScoreBreakdown, StyleAnalysisResult, StyleTip, UserStats } from '@/types/styleTypes';
import { supabase } from '@/integrations/supabase/client';

interface ScanState {
  latestScan: StyleAnalysisResult | null;
  scanHistory: StyleAnalysisResult[];
  stats: UserStats;
  isLoading: boolean;
  error: string | null;
  setLatestScan: (scan: StyleAnalysisResult) => void;
  setScanHistory: (scans: StyleAnalysisResult[]) => void;
  fetchUserScans: () => Promise<void>;
  fetchUserStats: (userId?: string) => Promise<void>;
  clearError: () => void;
}

const defaultStats: UserStats = {
  totalScans: 0,
  averageScore: 0,
  topCategory: '',
  improvedCategories: [],
  streak: 0,
  lastScan: null,
  bestScore: 0 // Add bestScore with default 0
};

export const useScanStore = create<ScanState>((set, get) => ({
  latestScan: null,
  scanHistory: [],
  stats: defaultStats,
  isLoading: false,
  error: null,
  
  setLatestScan: (scan: StyleAnalysisResult) => set({ latestScan: scan }),
  
  setScanHistory: (scans: StyleAnalysisResult[]) => set({ scanHistory: scans }),
  
  fetchUserScans: async () => {
    set({ isLoading: true, error: null });
    
    try {
      const { data: userData } = await supabase.auth.getUser();
      
      if (!userData?.user) {
        set({ isLoading: false });
        return;
      }
      
      const { data, error } = await supabase
        .from('style_analyses')
        .select('*')
        .eq('user_id', userData.user.id)
        .order('scan_date', { ascending: false });
        
      if (error) {
        throw error;
      }
      
      const scans: StyleAnalysisResult[] = data.map(scan => {
        // Parse the JSON strings from the database
        let breakdown: ScoreBreakdown[] = [];
        let tips: StyleTip[] = [];
        
        try {
          if (scan.breakdown) {
            breakdown = typeof scan.breakdown === 'string' 
              ? JSON.parse(scan.breakdown) 
              : scan.breakdown as ScoreBreakdown[];
          }
        } catch (e) {
          console.error('Error parsing breakdown:', e);
        }
        
        try {
          if (scan.tips) {
            tips = typeof scan.tips === 'string'
              ? JSON.parse(scan.tips)
              : scan.tips as StyleTip[];
          }
        } catch (e) {
          console.error('Error parsing tips:', e);
        }
        
        return {
          overallScore: scan.total_score,
          rawAnalysis: scan.raw_analysis || '',
          imageUrl: scan.image_url,
          breakdown,
          tips,
          id: scan.id,
          scanDate: scan.scan_date
        };
      });
      
      set({ scanHistory: scans, isLoading: false });
      
      // If we have scans, set the latest one
      if (scans.length > 0) {
        set({ latestScan: scans[0] });
      }
      
    } catch (error) {
      console.error('Error fetching user scans:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to fetch scan history', 
        isLoading: false 
      });
    }
  },
  
  fetchUserStats: async (userId?: string) => {
    set({ isLoading: true, error: null });
    
    try {
      let userIdToUse = userId;
      
      if (!userIdToUse) {
        const { data: userData } = await supabase.auth.getUser();
        userIdToUse = userData?.user?.id;
      }
      
      if (!userIdToUse) {
        set({ isLoading: false });
        return;
      }
      
      const { data, error } = await supabase
        .from('style_analyses')
        .select('*')
        .eq('user_id', userIdToUse)
        .order('scan_date', { ascending: false });
        
      if (error) {
        throw error;
      }
      
      if (!data || data.length === 0) {
        set({ stats: defaultStats, isLoading: false });
        return;
      }
      
      // Calculate stats
      const totalScans = data.length;
      let totalScore = 0;
      let bestScore = 0;
      const categoryScores: Record<string, number[]> = {};
      let maxStreak = 0;
      
      data.forEach(scan => {
        // Add to total score
        const score = typeof scan.total_score === 'number' ? scan.total_score : 0;
        totalScore += score;
        
        // Track best score
        if (score > bestScore) {
          bestScore = score;
        }
        
        // Track max streak
        if (scan.streak_count && scan.streak_count > maxStreak) {
          maxStreak = scan.streak_count;
        }
        
        // Parse breakdown for category stats
        try {
          if (scan.breakdown) {
            let breakdown: ScoreBreakdown[];
            
            if (typeof scan.breakdown === 'string') {
              breakdown = JSON.parse(scan.breakdown);
            } else {
              breakdown = scan.breakdown as ScoreBreakdown[];
            }
            
            breakdown.forEach(item => {
              if (!categoryScores[item.category]) {
                categoryScores[item.category] = [];
              }
              categoryScores[item.category].push(item.score);
            });
          }
        } catch (e) {
          console.error('Error parsing breakdown for stats:', e);
        }
      });
      
      // Calculate average score
      const averageScore = totalScans > 0 ? Math.round((totalScore / totalScans) * 10) / 10 : 0;
      
      // Find top category
      let topCategory = '';
      let topAverage = 0;
      
      for (const [category, scores] of Object.entries(categoryScores)) {
        if (scores.length > 0) {
          const avg = scores.reduce((sum, score) => sum + score, 0) / scores.length;
          if (avg > topAverage) {
            topAverage = avg;
            topCategory = category;
          }
        }
      }
      
      // Find improved categories (categories where the most recent score is higher than the average)
      const improvedCategories: string[] = [];
      
      for (const [category, scores] of Object.entries(categoryScores)) {
        if (scores.length > 1) {
          const latest = scores[0];
          const previous = scores.slice(1);
          const avgPrevious = previous.reduce((sum, score) => sum + score, 0) / previous.length;
          
          if (latest > avgPrevious) {
            improvedCategories.push(category);
          }
        }
      }
      
      // Get last scan date
      const lastScan = data[0]?.scan_date || null;
      
      const stats: UserStats = {
        totalScans,
        averageScore,
        topCategory,
        improvedCategories,
        streak: maxStreak,
        lastScan,
        bestScore
      };
      
      set({ stats, isLoading: false });
      
    } catch (error) {
      console.error('Error fetching user stats:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to fetch user stats', 
        isLoading: false 
      });
    }
  },
  
  clearError: () => set({ error: null })
}));
