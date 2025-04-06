
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
    
    // Extract categories, their scores, and detailed descriptions
    const categoryBlocks = extractCategoryBlocks(rawAnalysis);
    const categoryScores = extractCategoryScores(rawAnalysis);
    
    // Combine the extracted information into breakdown items
    for (const [category, details] of Object.entries(categoryBlocks)) {
      // Find the score for this category
      const score = categoryScores[category] !== undefined ? 
        categoryScores[category] : 7; // Default score if not found
        
      // Get emoji for the category
      const emoji = categoryEmojis[category] || "✅";
      
      // Add to breakdown
      breakdown.push({
        category,
        score,
        emoji,
        details: details.trim()
      });
    }
    
    // Extract tips from the analysis
    const extractedTips = extractTips(rawAnalysis);
    tips.push(...extractedTips);
    
    // Use default categories if we couldn't extract any
    if (breakdown.length === 0) {
      return { breakdown: defaultCategories, tips: [], overallScore };
    }
    
    // Sort categories by score (highest first)
    breakdown.sort((a, b) => b.score - a.score);
    
    return { breakdown, tips, overallScore };
    
  } catch (error) {
    console.error('Error parsing analysis:', error);
    return { breakdown: defaultCategories, tips: [] };
  }
};

// Helper function to extract category blocks from the analysis
function extractCategoryBlocks(text: string): Record<string, string> {
  const blocks: Record<string, string> = {};
  const lines = text.split('\n');
  
  let currentCategory = '';
  let currentBlock = '';
  let inTipsSection = false;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Skip empty lines
    if (!line) continue;
    
    // Check if we're entering a tips section
    if (line.toLowerCase().includes('tips:') || line.toLowerCase().includes('tips section')) {
      inTipsSection = true;
      currentCategory = '';
      continue;
    }
    
    // Skip processing if we're in the tips section
    if (inTipsSection) continue;
    
    // Look for category headers (bold text, numbered items, etc.)
    const categoryMatch = line.match(/(?:\*\*|\d+\.\s*)([A-Za-z\s&]+)(?:\*\*)?(?:\s*:\s*|(?:\s*-\s*))(?:(\d+(?:\.\d+)?)\s*\/\s*10)?/);
    
    if (categoryMatch) {
      // If we were processing a previous category, save its block
      if (currentCategory && currentBlock) {
        blocks[currentCategory] = currentBlock.trim();
      }
      
      // Start a new category
      currentCategory = categoryMatch[1].trim();
      currentBlock = '';
      
      // Skip if this appears to be the overall score or summary
      if (currentCategory.toLowerCase().includes('overall') || 
          currentCategory.toLowerCase().includes('score') || 
          currentCategory.toLowerCase().includes('summary')) {
        currentCategory = '';
      }
      
      continue;
    }
    
    // If we have a current category, add this line to its block
    if (currentCategory) {
      currentBlock += line + '\n';
    }
  }
  
  // Add the last category if there is one
  if (currentCategory && currentBlock) {
    blocks[currentCategory] = currentBlock.trim();
  }
  
  return blocks;
}

// Helper function to extract category scores from the analysis
function extractCategoryScores(text: string): Record<string, number> {
  const scores: Record<string, number> = {};
  const scorePattern = /(?:\*\*|\d+\.\s*)([A-Za-z\s&]+)(?:\*\*)?(?:\s*:\s*|(?:\s*-\s*))(?:(\d+(?:\.\d+)?)\s*\/\s*10)/g;
  
  let match;
  while ((match = scorePattern.exec(text)) !== null) {
    const category = match[1].trim();
    const score = parseFloat(match[2]);
    
    // Skip if this appears to be the overall score or summary
    if (category.toLowerCase().includes('overall') || 
        category.toLowerCase().includes('score') || 
        category.toLowerCase().includes('summary')) {
      continue;
    }
    
    // Add the score if it's valid
    if (!isNaN(score) && score >= 0 && score <= 10) {
      scores[category] = Math.round(score);
    }
  }
  
  return scores;
}

// Helper function to extract tips from the analysis
function extractTips(text: string): StyleTip[] {
  const tips: StyleTip[] = [];
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
    
    // If we're in a tips section, look for bullet points or numbered items
    if (inTipsSection && (line.startsWith('*') || line.startsWith('-') || line.match(/^\d+\./))) {
      // Extract the tip content (remove the bullet/number)
      const tipContent = line.replace(/^(?:\*|\-|\d+\.)\s*/, '').trim();
      
      if (tipContent) {
        tips.push({
          category: currentCategory,
          tip: tipContent,
          level: determineLevel(tipContent)
        });
      }
    }
    
    // If we hit a new section header, exit the tips section
    if (inTipsSection && line.match(/(?:\*\*|\#)\s*[A-Za-z\s&]+(?:\*\*|\#):?/) && !line.includes('Tips')) {
      inTipsSection = false;
      currentCategory = '';
    }
  }
  
  return tips;
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
