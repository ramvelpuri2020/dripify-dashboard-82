
import { ScoreBreakdown } from "@/types/styleTypes";

interface AnalysisResult {
  breakdown: ScoreBreakdown[];
  tips?: string[];
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
  console.log('Parsing analysis:', rawAnalysis);
  
  // Default categories if we can't extract them
  const defaultCategories = [
    { category: "Color Coordination", score: 7, emoji: "🎨", details: "Good color choices with room for improvement." },
    { category: "Fit & Proportion", score: 7, emoji: "📏", details: "The fit is appropriate but could be optimized." },
    { category: "Style Coherence", score: 7, emoji: "✨", details: "The outfit elements work together well." },
    { category: "Outfit Creativity", score: 6, emoji: "🌟", details: "Some creative choices, but could be more adventurous." }
  ];
  
  try {
    const breakdown: ScoreBreakdown[] = [];
    
    // Try to find category sections and score patterns
    const categoryRegex = /(?:^|\n)(?:\d+\.\s*)?([A-Za-z\s&]+)(?:\s*:\s*|(?:\s*-\s*))(?:(\d+(?:\.\d+)?)\s*\/\s*10)?/gm;
    let match;
    
    const processedCategories = new Set();
    
    // First pass: try to match categories with scores
    while ((match = categoryRegex.exec(rawAnalysis)) !== null) {
      const categoryName = match[1].trim();
      
      // Skip if this is likely not a category but some other header
      if (categoryName.toLowerCase() === 'overall score' || 
          categoryName.toLowerCase() === 'total score' ||
          categoryName.length < 3 ||
          categoryName.length > 30) {
        continue;
      }
      
      // For each category, try to find a score using regex
      const scorePattern = new RegExp(`${categoryName}(?:\\s*:\\s*|(?:\\s*-\\s*))(?:(\\d+(?:\\.\\d+)?)\\s*\\/\\s*10)`, 'i');
      const scoreMatch = rawAnalysis.match(scorePattern);
      
      let score = scoreMatch ? Math.round(parseFloat(scoreMatch[1])) : match[2] ? Math.round(parseFloat(match[2])) : 7;
      
      // Validate the score
      if (isNaN(score) || score < 0 || score > 10) {
        score = 7; // Default if invalid
      }
      
      // Find the details for this category
      let details = "";
      const detailsMatch = rawAnalysis.split(match[0])[1]?.split(/(?:^|\n)(?:\d+\.\s*)?[A-Za-z\s&]+(?:\s*:\s*|(?:\s*-\s*))/m)[0];
      
      if (detailsMatch) {
        details = detailsMatch.trim();
      }
      
      // Get emoji for the category
      const emoji = categoryEmojis[categoryName] || "✅";
      
      // Check if we've already processed this category
      if (!processedCategories.has(categoryName.toLowerCase())) {
        breakdown.push({
          category: categoryName,
          score,
          emoji,
          details
        });
        
        processedCategories.add(categoryName.toLowerCase());
      }
    }
    
    // Use default categories if we couldn't extract any
    if (breakdown.length === 0) {
      return { breakdown: defaultCategories };
    }
    
    // Sort categories by score (highest first)
    breakdown.sort((a, b) => b.score - a.score);
    
    return { breakdown };
    
  } catch (error) {
    console.error('Error parsing analysis:', error);
    return { breakdown: defaultCategories };
  }
};
