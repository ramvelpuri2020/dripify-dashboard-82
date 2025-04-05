
export interface StyleAnalysisResult {
  overallScore: number;
  rawAnalysis: string;
  imageUrl: string;
  breakdown?: ScoreBreakdown[];
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
