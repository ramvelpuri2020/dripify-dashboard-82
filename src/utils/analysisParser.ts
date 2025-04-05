
// This is a simplified function to extract an overall score from AI analysis
export const extractOverallScore = (rawAnalysis: string): number => {
  try {
    // Check for an explicit "Overall Score" mention
    const overallScoreMatch = rawAnalysis.match(/Overall Score:?\s*(\d+)/i);
    
    if (overallScoreMatch && overallScoreMatch[1]) {
      return parseInt(overallScoreMatch[1], 10);
    }
    
    // Fallback: look for any score at the beginning
    const initialScoreMatch = rawAnalysis.match(/^[^\d]*(\d+)/);
    if (initialScoreMatch && initialScoreMatch[1]) {
      return parseInt(initialScoreMatch[1], 10);
    }
    
    // Default score if no match found
    return 5;
  } catch (error) {
    console.error("Error extracting overall score:", error);
    return 5;
  }
};

// Parse the raw analysis to extract individual category scores
export const parseAnalysisBreakdown = (rawAnalysis: string): { category: string; score: number; emoji: string; details?: string }[] => {
  try {
    const lines = rawAnalysis.split('\n');
    const categories: { category: string; score: number; emoji: string; details?: string }[] = [];
    
    // Map of categories to emojis
    const categoryEmojis: { [key: string]: string } = {
      "Color Coordination": "🎨",
      "Fit & Proportion": "📏",
      "Style Coherence": "✨",
      "Accessories": "👜",
      "Outfit Creativity": "💡",
      "Trend Awareness": "📱",
      // Add more category-emoji mappings as needed
    };
    
    // Default emoji if category is not found in the map
    const defaultEmoji = "👕";
    
    let currentCategory = "";
    let currentScore = 0;
    let currentDetails = "";
    let collectingDetails = false;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Skip empty lines
      if (!line) continue;
      
      // Check for category and score pattern
      const categoryMatch = line.match(/\*\*(.*?):\*\*\s*(\d+)/);
      
      if (categoryMatch) {
        // If we were collecting details for a previous category, add it
        if (currentCategory && currentScore > 0) {
          const emoji = categoryEmojis[currentCategory] || defaultEmoji;
          categories.push({ 
            category: currentCategory, 
            score: currentScore,
            emoji,
            details: currentDetails.trim()
          });
        }
        
        // Start a new category
        currentCategory = categoryMatch[1].trim();
        currentScore = parseInt(categoryMatch[2], 10);
        currentDetails = "";
        collectingDetails = true;
        
        // Skip "Overall Score" as a category
        if (currentCategory.toLowerCase() === "overall score") {
          collectingDetails = false;
        }
      } 
      // If we're collecting details and this isn't a new category header
      else if (collectingDetails && !line.startsWith('**')) {
        // Append this line to the current details
        currentDetails += line + " ";
      }
      // If we've hit a new section that starts with ** but isn't a score
      else if (line.startsWith('**') && !line.match(/\*\*(.*?):\*\*\s*(\d+)/)) {
        collectingDetails = false;
      }
    }
    
    // Don't forget to add the last category if there is one
    if (currentCategory && currentScore > 0 && currentCategory.toLowerCase() !== "overall score") {
      const emoji = categoryEmojis[currentCategory] || defaultEmoji;
      categories.push({ 
        category: currentCategory, 
        score: currentScore,
        emoji,
        details: currentDetails.trim()
      });
    }
    
    return categories;
  } catch (error) {
    console.error("Error parsing analysis breakdown:", error);
    return [];
  }
};

// Function to parse numeric score safely
export const parseNumericScore = (scoreText: string): number => {
  if (!scoreText) return 0;
  
  try {
    // Extract number using regex (handles cases where there might be text around the number)
    const match = scoreText.match(/(\d+(\.\d+)?)/);
    if (match && match[1]) {
      const numericValue = parseFloat(match[1]);
      return isNaN(numericValue) ? 0 : numericValue;
    }
    return 0;
  } catch (error) {
    console.error("Error parsing numeric score:", error);
    return 0;
  }
};
