interface Scores {
  colorCoordination: number;
  fitProportion: number;
  styleCoherence: number;
  accessories: number;
  outfitCreativity: number;
  trendAwareness: number;
}

interface MarkdownParseResult {
  totalScore: number;
  breakdown: Array<{
    category: string;
    score: number;
    emoji: string;
    details: string;
  }>;
  feedback: string;
  styleTips?: Array<{
    category: string;
    tips: string[];
  }>;
  nextLevelTips?: string[];
}

/**
 * Extracts a number from a text using regex pattern
 */
const extractScore = (text: string, pattern: RegExp, defaultValue = 7): number => {
  const match = text.match(pattern);
  if (match && match[1]) {
    const value = parseFloat(match[1]);
    return isNaN(value) ? defaultValue : Math.round(value);
  }
  return defaultValue;
};

/**
 * Parses markdown AI response into structured data
 */
export const parseMarkdownToJSON = (markdownContent: string): MarkdownParseResult => {
  console.log("Parsing markdown content:", markdownContent.substring(0, 200) + "...");
  
  // Extract overall score if available
  const totalScoreMatch = markdownContent.match(/Overall Score:?\s*(\d+\.?\d*)/i) || 
                          markdownContent.match(/Total Score:?\s*(\d+\.?\d*)/i);
  const totalScore = totalScoreMatch ? Math.round(parseFloat(totalScoreMatch[1])) : 7;
  
  // Extract category sections - only look for them, don't create defaults
  const categoryPatterns = [
    { name: "Overall Style", emoji: "👑", pattern: /Overall Style:?\s*(\d+\.?\d*)/i },
    { name: "Color Coordination", emoji: "🎨", pattern: /Color Coordination:?\s*(\d+\.?\d*)/i },
    { name: "Fit & Proportion", emoji: "📏", pattern: /Fit (?:&|and) Proportion:?\s*(\d+\.?\d*)/i },
    { name: "Style Coherence", emoji: "✨", pattern: /Style Coherence:?\s*(\d+\.?\d*)/i },
    { name: "Accessories", emoji: "💍", pattern: /Accessories:?\s*(\d+\.?\d*)/i },
    { name: "Outfit Creativity", emoji: "🎯", pattern: /(?:Outfit|Style) Creativity:?\s*(\d+\.?\d*)/i },
    { name: "Trend Awareness", emoji: "🌟", pattern: /Trend Awareness:?\s*(\d+\.?\d*)/i }
  ];
  
  // Extract feedback - try to find a summary section
  const feedbackMatch = markdownContent.match(/(?:Summary|Overall Feedback|Feedback):(.*?)(?:\n\n|\n#|\n\*\*|$)/is);
  const feedback = feedbackMatch 
    ? feedbackMatch[1].trim() 
    : markdownContent.split('\n').slice(0, 3).join(' ').trim(); // Fallback to first few lines
  
  // Build breakdown only from categories found in the content - no defaults
  const breakdown = categoryPatterns
    .map(category => {
      const score = extractScore(markdownContent, category.pattern, 0);
      
      // Only include categories that were actually found in the response
      if (score === 0) return null;
      
      // Try to extract details about this category
      const categoryDetailsRegex = new RegExp(`\\*\\*${category.name}\\*\\*:?\\s*([^*]+)`, 'i');
      const detailsMatch = markdownContent.match(categoryDetailsRegex);
      const details = detailsMatch ? detailsMatch[1].trim() : "";
      
      return {
        category: category.name,
        score,
        emoji: category.emoji,
        details
      };
    })
    .filter(item => item !== null) as ScoreBreakdown[];
  
  // Extract style tips if present, but don't create defaults
  let styleTips: Array<{category: string, tips: string[]}> = [];
  const tipSections = markdownContent.match(/\*\*([\w\s&]+)\*\*\s*Tips?:([^*]+)/ig);
  
  if (tipSections) {
    styleTips = tipSections.map(section => {
      const [_, categoryName, tipsText] = section.match(/\*\*([\w\s&]+)\*\*\s*Tips?:([^*]+)/i) || 
                                         [null, "Style", section];
      
      // Extract bullet points
      const tips = tipsText
        .split('\n')
        .filter(line => line.trim().startsWith('-') || line.trim().startsWith('*') || line.trim().match(/^\d+\./))
        .map(tip => tip.replace(/^[-*]\s+|^\d+\.\s+/, '').trim())
        .filter(tip => tip.length > 0);
      
      return {
        category: categoryName.trim(),
        tips: tips.length > 0 ? tips : []
      };
    });
  }
  
  // Extract next level tips if they exist
  const nextLevelTipSection = markdownContent.match(/(?:\*\*Next Level|Advanced)\s*Tips?:?([^*]+)(?:\*\*|$)/i);
  const nextLevelTips = nextLevelTipSection 
    ? nextLevelTipSection[1]
        .split('\n')
        .filter(line => line.trim().startsWith('-') || line.trim().startsWith('*') || line.trim().match(/^\d+\./))
        .map(tip => tip.replace(/^[-*]\s+|^\d+\.\s+/, '').trim())
        .filter(tip => tip.length > 0)
    : [];

  return {
    totalScore,
    breakdown,
    feedback,
    styleTips,
    nextLevelTips
  };
};

export const parseAnalysis = (analysis: string) => {
  return parseMarkdownToJSON(analysis);
};
