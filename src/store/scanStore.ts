
import { create } from 'zustand';
import { ScoreBreakdown, StyleAnalysisResult, StyleTip } from '@/types/styleTypes';

interface ScanState {
  latestScan: StyleAnalysisResult | null;
  setLatestScan: (scan: StyleAnalysisResult) => void;
}

export const useScanStore = create<ScanState>((set) => ({
  latestScan: null,
  setLatestScan: (scan: StyleAnalysisResult) => set({ latestScan: scan }),
}));
