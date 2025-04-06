
import { create } from 'zustand';
import { ScoreBreakdown, StyleAnalysisResult, StyleTip } from '@/types/styleTypes';
import { supabase } from '@/integrations/supabase/client';

interface StatsData {
  averageScore: number;
  streak: number;
  totalScans: number;
  bestScore: number;
}

interface ScanState {
  latestScan: StyleAnalysisResult | null;
  setLatestScan: (scan: StyleAnalysisResult) => void;
  stats: StatsData;
  fetchUserStats: (userId: string) => Promise<void>;
}

export const useScanStore = create<ScanState>((set) => ({
  latestScan: null,
  setLatestScan: (scan: StyleAnalysisResult) => set({ latestScan: scan }),
  stats: {
    averageScore: 0,
    streak: 0,
    totalScans: 0,
    bestScore: 0
  },
  fetchUserStats: async (userId: string) => {
    try {
      // Get user's style analyses
      const { data: analyses, error } = await supabase
        .from('style_analyses')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
        
      if (error) {
        console.error('Error fetching style analyses:', error);
        return;
      }
      
      if (!analyses || analyses.length === 0) {
        // Set default stats if no analyses found
        set({
          stats: {
            averageScore: 0,
            streak: 0, 
            totalScans: 0,
            bestScore: 0
          }
        });
        return;
      }
      
      // Calculate stats
      const totalScans = analyses.length;
      const scores = analyses.map(a => a.total_score);
      const averageScore = Math.round(scores.reduce((a, b) => a + b, 0) / totalScans);
      const bestScore = Math.max(...scores);
      
      // Calculate streak (consecutive days with scans)
      let streak = 1;
      const dates = analyses.map(a => new Date(a.created_at || a.scan_date || '').toDateString());
      const uniqueDates = [...new Set(dates)].sort((a, b) => 
        new Date(b).getTime() - new Date(a).getTime()
      );
      
      if (uniqueDates.length > 1) {
        const today = new Date().toDateString();
        const hasScannedToday = uniqueDates[0] === today;
        
        if (hasScannedToday && uniqueDates.length > 1) {
          let currentDate = new Date(uniqueDates[0]);
          
          for (let i = 1; i < uniqueDates.length; i++) {
            const prevDate = new Date(uniqueDates[i]);
            const diffDays = Math.floor((currentDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24));
            
            if (diffDays === 1) {
              streak++;
              currentDate = prevDate;
            } else {
              break;
            }
          }
        }
      }
      
      // Update state with calculated stats
      set({
        stats: {
          averageScore,
          streak,
          totalScans,
          bestScore
        }
      });
    } catch (err) {
      console.error('Error processing stats:', err);
    }
  }
}));
