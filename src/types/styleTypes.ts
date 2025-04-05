
import type { Json } from '@/integrations/supabase/types';

export interface ScoreBreakdown {
  category: string;
  score: number;
  emoji: string;
  details?: string;
}

export interface StyleAnalysisCategory {
  name: string;
  score: number;
  details: string;
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
  breakdown?: ScoreBreakdown[] | Json;
  tips?: any;
  user_id?: string | null;
}

export interface StyleAnalysisResult {
  overallScore: number;
  rawAnalysis: string;
  imageUrl?: string;
  timestamp?: Date;
  breakdown?: ScoreBreakdown[];
}
