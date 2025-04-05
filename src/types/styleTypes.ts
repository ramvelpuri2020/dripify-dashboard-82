
export interface ScoreBreakdown {
  category: string;
  score: number;
  emoji: string;
  details?: string;
}

export interface StyleAnalysis {
  id: string;
  total_score: number;
  feedback: string;
  image_url: string;
  thumbnail_url?: string;
  created_at: string;
  scan_date: string;
  streak_count?: number;
  last_scan_date?: string;
  breakdown?: ScoreBreakdown[];
  tips?: any;
}

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
  fullAnalysis?: string;
  tips?: string[];
  summary?: string;
  categories?: any[];
}
