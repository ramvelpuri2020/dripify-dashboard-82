
export interface StyleAnalysisResult {
  overallScore: number;
  rawAnalysis: string;
  imageUrl: string;
  breakdown?: ScoreBreakdown[];
  tips?: StyleTip[];
}

export interface ScoreBreakdown {
  category: string;
  score: number;
  emoji: string;
  details?: string;
}

export interface StyleTip {
  category: string;
  tip: string;
  level: "beginner" | "intermediate" | "advanced";
}

export interface StyleAnalysis {
  id: string;
  total_score: number;
  feedback: string;
  image_url: string;
  thumbnail_url?: string | null;
  created_at: string;
  scan_date?: string | null;
  streak_count?: number | null;
  last_scan_date?: string | null;
  breakdown?: ScoreBreakdown[] | any;
  raw_analysis?: string;
  tips?: StyleTip[] | any;
  user_id?: string | null;
}
