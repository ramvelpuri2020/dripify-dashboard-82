
import { create } from 'zustand';

interface ScanState {
  latestScan: {
    rawAnalysis: string;
    overallScore: number | null;
    imageUrl?: string;
  } | null;
  setLatestScan: (scan: {
    rawAnalysis: string;
    overallScore: number | null;
    imageUrl?: string;
  } | null) => void;
}

export const useScanStore = create<ScanState>((set) => ({
  latestScan: null,
  setLatestScan: (scan) => set({ latestScan: scan }),
}));
