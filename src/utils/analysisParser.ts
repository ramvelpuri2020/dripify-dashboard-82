
import { ScoreBreakdown, StyleTip } from "@/types/styleTypes";

interface AnalysisResult {
  breakdown: ScoreBreakdown[];
  tips?: StyleTip[];
  overallScore?: number;
  summary?: string;
}

const categoryEmojis: Record<string, string> = {
  "Color Coordination": "🎨",
  "Fit & Proportion": "📏",
  "Style Coherence": "✨",
  "Accessories": "💍",
  "Outfit Creativity": "🌟",
  "Trend Awareness": "📱",
};

export const parseAnalysis = (rawAnalysis: string): AnalysisResult => {
  console.log('Parsing analysis...');
  
  const breakdown: ScoreBreakdown[] = [];
  const tips: StyleTip[] = [];
  
  // Ultra-optimized overall score extraction - one liner with fallback
  const overallScore = parseInt((rawAnalysis.match(/\*\*Overall Score:\*\*\s*(\d+)/i) || [])[1] || '8', 10);
  
  // Ultra-optimized summary extraction - one liner
  const summary = ((rawAnalysis.match(/\*\*Summary:\*\*([\s\S]*?)(?=\*\*|$)/i) || [])[1] || '').trim();
  
  // Categories to extract - defined once for performance
  const categories = [
    "Color Coordination", 
    "Fit & Proportion", 
    "Style Coherence", 
    "Accessories", 
    "Outfit Creativity", 
    "Trend Awareness"
  ];
  
  // One-time regex compilation for each category for maximum speed
  const categoryRegexes = categories.map(category => {
    return {
      category,
      regex: new RegExp(`\\*\\*${category}:\\*\\*\\s*(\\d+)([\\s\\S]*?)(?=\\*\\*[^*]+:\\*\\*|$)`, 'i')
    };
  });
  
  // Ultra-optimized extraction - single pass per category
  for (const {category, regex} of categoryRegexes) {
    const match = rawAnalysis.match(regex);
    
    if (match) {
      const score = parseInt(match[1], 10);
      const details = match[2].trim();
      
      if (!isNaN(score)) {
        breakdown.push({
          category,
          score,
          emoji: categoryEmojis[category] || "✅",
          details
        });
      }
    }
  }
  
  // Optimize tips parsing - precompiled regexes
  const tipSectionRegex = /\*\*([^*]+) Tips:\*\*([\s\S]*?)(?=\*\*[^*]+(?:Tips|\*\*)|\*\*Next Level|\s*$)/gi;
  const tipItemRegex = /\*\s*([^\n]+)/g;
  
  // Extract tips in a single pass
  let tipMatch;
  while ((tipMatch = tipSectionRegex.exec(rawAnalysis)) !== null) {
    const category = tipMatch[1].trim();
    const tipContent = tipMatch[2].trim();
    
    let tipItemMatch;
    while ((tipItemMatch = tipItemRegex.exec(tipContent)) !== null) {
      const tip = tipItemMatch[1].trim();
      if (tip) {
        tips.push({
          category,
          tip,
          level: category.toLowerCase() === "next level" ? "advanced" : "intermediate"
        });
      }
    }
  }
  
  // Next Level Tips - dedicated extraction for speed
  const nextLevelMatch = rawAnalysis.match(/\*\*Next Level Tips:\*\*([\s\S]*?)(?=\*\*|$)/i);
  if (nextLevelMatch) {
    const tipContent = nextLevelMatch[1].trim();
    let tipItemMatch;
    
    // Reuse the tipItemRegex
    tipItemRegex.lastIndex = 0; // Reset the regex state
    while ((tipItemMatch = tipItemRegex.exec(tipContent)) !== null) {
      const tip = tipItemMatch[1].trim();
      if (tip) {
        tips.push({
          category: "Advanced",
          tip,
          level: "advanced"
        });
      }
    }
  }
  
  return { 
    breakdown, 
    tips, 
    overallScore,
    summary
  };
};
