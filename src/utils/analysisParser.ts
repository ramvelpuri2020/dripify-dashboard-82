
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
  "Balance": "⚖️",
  "Contrast": "🔄",
  "Texture": "👕",
  "Occasion Appropriateness": "🎭",
  "Material Quality": "🧵",
  "Layering": "🧥",
  "Pattern Mixing": "📊",
  "Adaptability": "🔄",
  "Uniqueness": "🦄",
};

export const parseAnalysis = (rawAnalysis: string): AnalysisResult => {
  console.log('Parsing analysis...');
  
  try {
    const breakdown: ScoreBreakdown[] = [];
    const tips: StyleTip[] = [];
    
    // Extract the overall score - strict numerical extraction
    const overallScoreMatch = rawAnalysis.match(/\*\*Overall Score:\*\*\s*(\d+)/i);
    const overallScore = overallScoreMatch 
      ? parseInt(overallScoreMatch[1], 10) 
      : extractFallbackScore(rawAnalysis);
    
    if (overallScore === undefined) {
      console.warn('Could not find overall score in analysis');
    }
    
    // Extract the summary section
    const summaryMatch = rawAnalysis.match(/\*\*Summary:\*\*([\s\S]*?)(?:\*\*|$)/i);
    const summary = summaryMatch ? summaryMatch[1].trim() : undefined;
    
    // Extract categories with strict numerical score extraction
    const categoryMatches = [...rawAnalysis.matchAll(/\*\*([^*]+):\*\*\s*(\d+)[^\d]*([\s\S]*?)(?=\*\*|$)/g)];
    
    for (const match of categoryMatches) {
      const category = match[1].trim();
      const scoreText = match[2];
      const details = match[3].trim();
      
      // Skip overall score and summary which are handled separately
      if (category.toLowerCase() === 'overall score' || category.toLowerCase() === 'summary') {
        continue;
      }
      
      const score = parseInt(scoreText, 10);
      
      // Only add if we have a valid score
      if (!isNaN(score)) {
        const emoji = categoryEmojis[category] || "✅";
        
        breakdown.push({
          category,
          score,
          emoji,
          details
        });
      } else {
        console.warn(`Invalid score "${scoreText}" for category: ${category}`);
      }
    }
    
    // If no categories were extracted, try a more flexible approach
    if (breakdown.length === 0) {
      extractCategoriesFlexible(rawAnalysis, breakdown);
    }
    
    // Extract tips from the analysis
    extractAllTips(rawAnalysis, tips);
    
    // Sort categories by score (highest first)
    breakdown.sort((a, b) => b.score - a.score);
    
    // Make sure we have a valid overall score
    const validOverallScore = (overallScore !== undefined && !isNaN(overallScore)) 
      ? overallScore 
      : breakdown.length > 0 
        ? Math.round(breakdown.reduce((sum, item) => sum + item.score, 0) / breakdown.length) 
        : 5; // Use 5 only as absolute fallback
    
    return { 
      breakdown, 
      tips, 
      overallScore: validOverallScore,
      summary 
    };
    
  } catch (error) {
    console.error('Error parsing analysis:', error);
    // Return minimal valid data in case of error
    return {
      breakdown: [],
      tips: [],
      overallScore: 5, // Fallback score
      summary: "We encountered an error analyzing your outfit. Please try again with a different image."
    };
  }
};

// Fallback score extraction for when the standard regex fails
function extractFallbackScore(text: string): number | undefined {
  // Try different formats that might appear in the text
  const patterns = [
    /overall score.*?(\d+)/i,
    /total score.*?(\d+)/i,
    /score.*?(\d+).*?10/i,
    /rating.*?(\d+)/i
  ];
  
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      const score = parseInt(match[1], 10);
      if (!isNaN(score) && score >= 0 && score <= 10) {
        return score;
      }
    }
  }
  
  return undefined;
}

// More flexible category extraction for different AI response formats
function extractCategoriesFlexible(text: string, breakdown: ScoreBreakdown[]): void {
  const categories = [
    "Color Coordination", 
    "Fit & Proportion", 
    "Style Coherence", 
    "Accessories", 
    "Outfit Creativity", 
    "Trend Awareness"
  ];
  
  for (const category of categories) {
    // Look for category with different formatting patterns
    const patterns = [
      new RegExp(`\\*\\*${category}:\\*\\*\\s*(\\d+)[^\\d]*([\\s\\S]*?)(?=\\*\\*|$)`, 'i'),
      new RegExp(`\\*\\*${category}\\*\\*\\s*-?\\s*(\\d+)[^\\d]*([\\s\\S]*?)(?=\\*\\*|$)`, 'i'),
      new RegExp(`${category}:\\s*(\\d+)[^\\d]*([\\s\\S]*?)(?=\\*\\*|$)`, 'i'),
      new RegExp(`${category}\\s*-?\\s*(\\d+)\\s*\\/\\s*10([\\s\\S]*?)(?=\\*\\*|$)`, 'i')
    ];
    
    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        const score = parseInt(match[1], 10);
        if (!isNaN(score)) {
          const emoji = categoryEmojis[category] || "✅";
          const details = match[2] ? match[2].trim() : "";
          
          breakdown.push({
            category,
            score,
            emoji,
            details
          });
          
          break; // Found a match for this category, move to next one
        }
      }
    }
  }
}

// Extract all tips from analysis
function extractAllTips(text: string, tips: StyleTip[]): void {
  const lines = text.split('\n');
  
  let inTipsSection = false;
  let currentCategory = '';
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Skip empty lines
    if (!line) continue;
    
    // Check if we're entering a tips section
    const tipsSectionMatch = line.match(/(?:\*\*|\#)?\s*([A-Za-z\s&]+)\s+Tips(?:\*\*|\#)?:?/i);
    
    if (tipsSectionMatch) {
      inTipsSection = true;
      currentCategory = tipsSectionMatch[1].trim();
      continue;
    }
    
    // Special case for "Next Level Tips" section
    if (line.match(/(?:\*\*|\#)?\s*Next\s+Level\s+Tips(?:\*\*|\#)?:?/i)) {
      inTipsSection = true;
      currentCategory = "Advanced";
      continue;
    }
    
    // If we're in a tips section, look for bullet points or numbered items
    if (inTipsSection && (line.startsWith('*') || line.startsWith('-') || line.match(/^\d+\./))) {
      // Extract the tip content (remove the bullet/number)
      const tipContent = line.replace(/^(?:\*|\-|\d+\.)\s*/, '').trim();
      
      if (tipContent) {
        tips.push({
          category: currentCategory,
          tip: tipContent,
          level: currentCategory.toLowerCase() === "advanced" ? "advanced" : determineLevel(tipContent)
        });
      }
    }
    
    // If we hit a new section header, exit the tips section
    if (inTipsSection && line.match(/(?:\*\*|\#)\s*[A-Za-z\s&]+(?:\*\*|\#):?/) && !line.includes('Tips')) {
      inTipsSection = false;
      currentCategory = '';
    }
  }
}

// Helper function to determine the level of a tip
function determineLevel(tip: string): "beginner" | "intermediate" | "advanced" {
  const tip_lower = tip.toLowerCase();
  
  // Check for advanced indicators
  if (tip_lower.includes('advanced') || 
      tip_lower.includes('expert') || 
      tip_lower.includes('professional') || 
      tip_lower.includes('next level') ||
      tip_lower.includes('complex')) {
    return "advanced";
  }
  
  // Check for beginner indicators
  if (tip_lower.includes('start') || 
      tip_lower.includes('basic') || 
      tip_lower.includes('simple') || 
      tip_lower.includes('beginner') ||
      tip_lower.includes('first step')) {
    return "beginner";
  }
  
  // Default to intermediate
  return "intermediate";
}
