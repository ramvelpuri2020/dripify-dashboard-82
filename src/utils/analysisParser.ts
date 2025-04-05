
interface ScoreBreakdown {
  category: string;
  score: number;
  emoji: string;
  details?: string;
}

interface MarkdownParseResult {
  totalScore: number;
  breakdown: ScoreBreakdown[];
  feedback: string;
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
 * Simple parser that extracts the most important data from the AI's markdown response
 */
export const parseMarkdownToJSON = (markdownContent: string): MarkdownParseResult => {
  console.log("Parsing markdown content:", markdownContent.substring(0, 200) + "...");
  
  // Extract overall score if available
  const totalScoreMatch = markdownContent.match(/Overall Score:?\s*(\d+\.?\d*)/i) || 
                          markdownContent.match(/Total Score:?\s*(\d+\.?\d*)/i);
  const totalScore = totalScoreMatch ? Math.round(parseFloat(totalScoreMatch[1])) : 7;
  
  // Extract category sections
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
  
  // Build breakdown from categories found in the content
  const breakdown = categoryPatterns
    .map(category => {
      const score = extractScore(markdownContent, category.pattern);
      
      // Try to extract details about this category
      const categoryDetailsRegex = new RegExp(`\\*\\*${category.name}\\*\\*:?\\s*([^*]+)`, 'i');
      const detailsMatch = markdownContent.match(categoryDetailsRegex);
      const details = detailsMatch 
        ? detailsMatch[1].trim() 
        : undefined;
      
      return {
        category: category.name,
        score,
        emoji: category.emoji,
        details
      };
    })
    // Only include categories that have a specific score in the analysis
    .filter(item => {
      const scoreMatch = markdownContent.match(new RegExp(`${item.category}:?\\s*(\\d+\\.?\\d*)`, 'i'));
      return !!scoreMatch;
    });

  return {
    totalScore,
    breakdown,
    feedback: markdownContent
  };
};

// Basic analysis parser for backward compatibility
export const parseAnalysis = (analysis: string) => {
  const scores: any = {
    colorCoordination: Math.round(parseFloat(analysis.match(/Color Coordination:?\s*(\d+\.?\d*)/i)?.[1] || "7")),
    fitProportion: Math.round(parseFloat(analysis.match(/Fit & Proportion:?\s*(\d+\.?\d*)/i)?.[1] || "7")),
    styleCoherence: Math.round(parseFloat(analysis.match(/Style Coherence:?\s*(\d+\.?\d*)/i)?.[1] || "7")),
    accessories: Math.round(parseFloat(analysis.match(/Accessories:?\s*(\d+\.?\d*)/i)?.[1] || "7")),
    outfitCreativity: Math.round(parseFloat(analysis.match(/Outfit Creativity:?\s*(\d+\.?\d*)/i)?.[1] || "7")),
    trendAwareness: Math.round(parseFloat(analysis.match(/Trend Awareness:?\s*(\d+\.?\d*)/i)?.[1] || "7"))
  };

  const totalScore = Math.round(
    Object.values(scores).reduce((acc: number, curr: number) => acc + curr, 0) / 6
  );

  return {
    totalScore,
    breakdown: [
      { category: "Color Coordination", score: scores.colorCoordination, emoji: "🎨" },
      { category: "Fit & Proportion", score: scores.fitProportion, emoji: "📏" },
      { category: "Style Coherence", score: scores.styleCoherence, emoji: "✨" },
      { category: "Accessories", score: scores.accessories, emoji: "💍" },
      { category: "Outfit Creativity", score: scores.outfitCreativity, emoji: "🎯" },
      { category: "Trend Awareness", score: scores.trendAwareness, emoji: "🌟" },
    ],
    feedback: analysis
  };
};
