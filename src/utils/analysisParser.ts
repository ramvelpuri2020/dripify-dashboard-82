
import { ScoreBreakdown, StyleTip } from "@/types/styleTypes";

interface AnalysisResult {
  breakdown: ScoreBreakdown[];
  tips?: StyleTip[];
  overallScore?: number;
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
    const tips: StyleTip[] = [];
    
    // Get the overall score first
    const overallScoreMatch = rawAnalysis.match(/(?:Overall|Total) Score:?\s*(\d+(?:\.\d+)?)/i);
    const overallScore = overallScoreMatch ? Math.round(parseFloat(overallScoreMatch[1])) : 7;
    
    // Extract categories and their detailed descriptions
    const categoryRegex = /(?:^|\n)(?:\*\*|\d+\.\s*)([A-Za-z\s&]+)(?:\*\*)?(?:\s*:\s*|(?:\s*-\s*))(?:(\d+(?:\.\d+)?)\s*\/\s*10)?/gm;
    let match;
    
    const processedCategories = new Set();
    const categoryBlocks: Record<string, string> = {};
    
    // First pass: identify all category blocks
    const lines = rawAnalysis.split('\n');
    let currentCategory = '';
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Match category headers
      const categoryMatch = line.match(/(?:\*\*|\b)([A-Za-z\s&]+)(?:\*\*)?(?:\s*:\s*|(?:\s*-\s*))(?:(\d+(?:\.\d+)?)\s*\/\s*10)?/);
      if (categoryMatch) {
        const category = categoryMatch[1].trim();
        
        // Skip non-category headers
        if (category.toLowerCase() === 'overall score' || 
            category.toLowerCase() === 'total score' ||
            category.toLowerCase() === 'summary' ||
            category.length < 3 ||
            category.length > 30) {
          continue;
        }
        
        // Start recording a new category
        currentCategory = category;
        categoryBlocks[currentCategory] = '';
      } 
      // If we're in a category and the line isn't another category header,
      // add the line to the current category's block
      else if (currentCategory && !line.match(/(?:\*\*|\b)([A-Za-z\s&]+)(?:\*\*)?(?:\s*:)/)) {
        if (line.trim() && !line.includes('Tips:')) {
          categoryBlocks[currentCategory] += line + '\n';
        }
      }
      
      // If we found a new Tips section, break out of the current category
      if (line.includes('Tips:')) {
        currentCategory = '';
      }
    }
    
    // Extract tips
    const tipSections = rawAnalysis.match(/\*\*([A-Za-z\s&]+) Tips:\*\*\n(?:(?:\*|\d+\.)\s*[^\n]+\n?)+/g) || [];
    const allTips: StyleTip[] = [];
    
    tipSections.forEach(section => {
      const categoryMatch = section.match(/\*\*([A-Za-z\s&]+) Tips:\*\*/);
      if (categoryMatch) {
        const category = categoryMatch[1].trim();
        const tipMatches = section.match(/(?:\*|\d+\.)\s*([^\n]+)/g) || [];
        
        tipMatches.forEach(tipText => {
          const tip = tipText.replace(/(?:\*|\d+\.)\s*/, '').trim();
          allTips.push({
            category,
            tip,
            level: category.includes('Next Level') ? 'advanced' : 'intermediate'
          });
        });
      }
    });
    
    // Second pass: extract scores and create breakdown items
    while ((match = categoryRegex.exec(rawAnalysis)) !== null) {
      const categoryName = match[1].trim();
      
      // Skip if this is likely not a category but some other header
      if (categoryName.toLowerCase() === 'overall score' || 
          categoryName.toLowerCase() === 'total score' ||
          categoryName.toLowerCase() === 'summary' ||
          categoryName.length < 3 ||
          categoryName.length > 30) {
        continue;
      }
      
      // For each category, try to find a score
      const scorePattern = new RegExp(`${categoryName}(?:\\*\\*)?(?:\\s*:\\s*|(?:\\s*-\\s*))(?:(\\d+(?:\\.\\d+)?)\\s*\\/\\s*10)`, 'i');
      const scoreMatch = rawAnalysis.match(scorePattern);
      
      let score = scoreMatch ? Math.round(parseFloat(scoreMatch[1])) : match[2] ? Math.round(parseFloat(match[2])) : 7;
      
      // Validate the score
      if (isNaN(score) || score < 0 || score > 10) {
        score = 7; // Default if invalid
      }
      
      // Get the details for this category from our extracted blocks
      let details = categoryBlocks[categoryName] || "";
      
      // Clean up the details
      details = details.trim();
      
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
      return { breakdown: defaultCategories, tips: [], overallScore };
    }
    
    // Sort categories by score (highest first)
    breakdown.sort((a, b) => b.score - a.score);
    
    return { breakdown, tips: allTips, overallScore };
    
  } catch (error) {
    console.error('Error parsing analysis:', error);
    return { breakdown: defaultCategories, tips: [] };
  }
};
