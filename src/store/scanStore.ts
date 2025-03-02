
import { create } from 'zustand';

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

interface ScanStore {
  latestScan: StyleAnalysisResult | null;
  setLatestScan: (scan: StyleAnalysisResult) => void;
}

export const useScanStore = create<ScanStore>((set) => ({
  latestScan: null,
  setLatestScan: (scan) => set({ latestScan: { ...scan, timestamp: new Date() } }),
}));
