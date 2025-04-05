
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
  
  // Extract category sections
  const categoryPatterns = [
    { name: "Color Coordination", emoji: "🎨", pattern: /Color Coordination:?\s*(\d+\.?\d*)/i },
    { name: "Fit & Proportion", emoji: "📏", pattern: /Fit (?:&|and) Proportion:?\s*(\d+\.?\d*)/i },
    { name: "Style Coherence", emoji: "✨", pattern: /Style Coherence:?\s*(\d+\.?\d*)/i },
    { name: "Accessories", emoji: "💍", pattern: /Accessories:?\s*(\d+\.?\d*)/i },
    { name: "Outfit Creativity", emoji: "🎯", pattern: /(?:Outfit|Style) Creativity:?\s*(\d+\.?\d*)/i },
    { name: "Trend Awareness", emoji: "🌟", pattern: /Trend Awareness:?\s*(\d+\.?\d*)/i },
    // Additional possible categories
    { name: "Overall Style", emoji: "👑", pattern: /Overall Style:?\s*(\d+\.?\d*)/i },
    { name: "Style Expression", emoji: "🪄", pattern: /Style Expression:?\s*(\d+\.?\d*)/i },
    { name: "Trend Alignment", emoji: "✨", pattern: /Trend Alignment:?\s*(\d+\.?\d*)/i }
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
        : `Your ${category.name.toLowerCase()} demonstrates good potential but could be enhanced with targeted improvements.`;
      
      return {
        category: category.name,
        score,
        emoji: category.emoji,
        details
      };
    })
    // Filter out categories with default scores (which likely weren't found)
    .filter((item, index, self) => 
      // Only keep items where we either found a non-default score
      // or it's one of the essential 6 categories
      (item.category === "Color Coordination" || 
       item.category === "Fit & Proportion" ||
       item.category === "Style Coherence" ||
       item.category === "Accessories" ||
       item.category === "Outfit Creativity" ||
       item.category === "Trend Awareness")
    );
  
  // Add default categories if we don't have enough
  if (breakdown.length < 6) {
    const defaultCategories = [
      { category: "Color Coordination", score: 7, emoji: "🎨", details: "Your color choices work well together, but could benefit from more intentional pairing." },
      { category: "Fit & Proportion", score: 7, emoji: "📏", details: "The proportions are generally flattering to your body shape." },
      { category: "Style Coherence", score: 7, emoji: "✨", details: "Your outfit has a cohesive direction but could be more focused." },
      { category: "Accessories", score: 6, emoji: "💍", details: "Consider adding more strategic accessories to elevate your look." },
      { category: "Outfit Creativity", score: 7, emoji: "🎯", details: "Your outfit shows creativity but could push boundaries more." },
      { category: "Trend Awareness", score: 7, emoji: "🌟", details: "There's evidence of trend awareness in your styling choices." }
    ];
    
    defaultCategories.forEach(defaultCat => {
      if (!breakdown.some(item => item.category === defaultCat.category)) {
        breakdown.push(defaultCat);
      }
    });
  }
  
  // Extract style tips - look for bulleted lists
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
        tips: tips.length > 0 ? tips : ["Consider adding more complementary elements to enhance this aspect of your style."]
      };
    });
  }
  
  // If no tips were found, create some default ones
  if (styleTips.length === 0) {
    styleTips = breakdown.map(item => ({
      category: item.category,
      tips: [
        `Consider how to enhance your ${item.category.toLowerCase()} with more intentional choices.`,
        `Explore different options to improve this aspect of your style.`,
        `Work on developing this area to take your outfit to the next level.`
      ]
    }));
  }
  
  // Extract next level tips
  const nextLevelTipSection = markdownContent.match(/(?:\*\*Next Level|Advanced)\s*Tips?:?([^*]+)(?:\*\*|$)/i);
  const nextLevelTips = nextLevelTipSection 
    ? nextLevelTipSection[1]
        .split('\n')
        .filter(line => line.trim().startsWith('-') || line.trim().startsWith('*') || line.trim().match(/^\d+\./))
        .map(tip => tip.replace(/^[-*]\s+|^\d+\.\s+/, '').trim())
        .filter(tip => tip.length > 0)
    : [
        "Develop a personal style board to help focus your fashion direction.",
        "Invest in quality foundation pieces that can be styled multiple ways.",
        "Learn basic alterations to customize off-the-rack pieces to your proportions.",
        "Study color theory to create more sophisticated outfit color palettes.",
        "Master the art of accessorizing to elevate even simple outfits."
      ];

  return {
    totalScore,
    breakdown,
    feedback,
    styleTips,
    nextLevelTips
  };
};

export const parseAnalysis = (analysis: string) => {
  const scores: Scores = {
    colorCoordination: Math.round(parseFloat(analysis.match(/Color Coordination:?\s*(\d+\.?\d*)/i)?.[1] || "7")),
    fitProportion: Math.round(parseFloat(analysis.match(/Fit & Proportion:?\s*(\d+\.?\d*)/i)?.[1] || "7")),
    styleCoherence: Math.round(parseFloat(analysis.match(/Style Coherence:?\s*(\d+\.?\d*)/i)?.[1] || "7")),
    accessories: Math.round(parseFloat(analysis.match(/Accessories:?\s*(\d+\.?\d*)/i)?.[1] || "7")),
    outfitCreativity: Math.round(parseFloat(analysis.match(/Outfit Creativity:?\s*(\d+\.?\d*)/i)?.[1] || "7")),
    trendAwareness: Math.round(parseFloat(analysis.match(/Trend Awareness:?\s*(\d+\.?\d*)/i)?.[1] || "7"))
  };

  const totalScore = Math.round(
    Object.values(scores).reduce((acc, curr) => acc + curr, 0) / 6
  );

  return {
    totalScore,
    breakdown: [
      { category: "Color Coordination", score: scores.colorCoordination, emoji: "🎨", details: "Your color choices show good coordination." },
      { category: "Fit & Proportion", score: scores.fitProportion, emoji: "📏", details: "The fit and proportions of your outfit work well." },
      { category: "Style Coherence", score: scores.styleCoherence, emoji: "✨", details: "Your outfit has a cohesive style." },
      { category: "Accessories", score: scores.accessories, emoji: "💍", details: "Your accessory choices complement your outfit." },
      { category: "Outfit Creativity", score: scores.outfitCreativity, emoji: "🎯", details: "Your outfit shows creative elements." },
      { category: "Trend Awareness", score: scores.trendAwareness, emoji: "🌟", details: "Your outfit incorporates current fashion trends." },
    ],
    feedback: analysis
  };
};
