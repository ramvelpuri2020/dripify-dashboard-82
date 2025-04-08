
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
  
  // Fast overall score extraction
  const overallScoreMatch = rawAnalysis.match(/\*\*Overall Score:\*\*\s*(\d+)/i);
  const overallScore = overallScoreMatch ? parseInt(overallScoreMatch[1], 10) : undefined;
  
  // Fast summary extraction
  const summaryMatch = rawAnalysis.match(/\*\*Summary:\*\*([\s\S]*?)(?:\*\*|$)/i);
  const summary = summaryMatch ? summaryMatch[1].trim() : undefined;
  
  // Fast category extraction - optimized for speed
  const categories = [
    "Color Coordination", 
    "Fit & Proportion", 
    "Style Coherence", 
    "Accessories", 
    "Outfit Creativity", 
    "Trend Awareness"
  ];
  
  // One-pass extraction of all categories
  for (const category of categories) {
    const pattern = new RegExp(`\\*\\*${category}:\\*\\*\\s*(\\d+)([\\s\\S]*?)(?=\\*\\*[^*]+:\\*\\*|$)`, 'i');
    const match = rawAnalysis.match(pattern);
    
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
  
  // One-pass extraction of all tips
  const tipSections = rawAnalysis.match(/\*\*([^*]+) Tips:\*\*([\s\S]*?)(?=\*\*[^*]+(?:Tips|\*\*)|\*\*Next Level|\s*$)/gi) || [];
  
  for (const section of tipSections) {
    const categoryMatch = section.match(/\*\*([^*]+) Tips:\*\*/i);
    if (!categoryMatch) continue;
    
    const category = categoryMatch[1].trim();
    const tipContent = section.replace(categoryMatch[0], '').trim();
    const tipItems = tipContent.match(/\*\s*([^\n]+)/g) || [];
    
    for (const item of tipItems) {
      const tip = item.replace(/\*\s*/, '').trim();
      if (tip) {
        tips.push({
          category,
          tip,
          level: category.toLowerCase() === "next level" ? "advanced" : "intermediate"
        });
      }
    }
  }
  
  // Extract Next Level Tips (advanced)
  const nextLevelMatch = rawAnalysis.match(/\*\*Next Level Tips:\*\*([\s\S]*?)(?=\*\*|$)/i);
  if (nextLevelMatch) {
    const tipContent = nextLevelMatch[1].trim();
    const tipItems = tipContent.match(/\*\s*([^\n]+)/g) || [];
    
    for (const item of tipItems) {
      const tip = item.replace(/\*\s*/, '').trim();
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
