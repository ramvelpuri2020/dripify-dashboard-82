
export function extractJsonFromResponse(text: string): any {
  // First try to parse the entire response as JSON
  try {
    return JSON.parse(text);
  } catch (firstError) {
    console.log('Not valid JSON, attempting to extract JSON portion');
    
    try {
      // Try to find JSON in curly braces
      const jsonRegex = /{[\s\S]*?}/g;
      const matches = [...text.matchAll(jsonRegex)];
      
      // Get the largest match - likely to be our complete JSON
      if (matches.length > 0) {
        let largestMatch = '';
        for (const match of matches) {
          if (match[0].length > largestMatch.length) {
            largestMatch = match[0];
          }
        }
        
        if (largestMatch) {
          return JSON.parse(largestMatch);
        }
      }
      
      // If we couldn't find valid JSON with curly braces, try to parse the response as markdown
      return parseMarkdownToJson(text);
    } catch (error) {
      console.error('Error parsing response:', error);
      
      // As a last resort, construct a minimal valid response from the text
      try {
        return constructFallbackResponse(text);
      } catch (finalError) {
        console.error('Failed to create fallback response:', finalError);
        throw new Error('Could not extract valid JSON');
      }
    }
  }
}

// Parse markdown format into JSON
function parseMarkdownToJson(markdown: string): any {
  try {
    console.log('Attempting to parse markdown format');
    
    const response: any = {
      totalScore: 0,
      breakdown: [],
      feedback: ""
    };
    
    // Extract total score
    const totalScoreMatch = markdown.match(/Total Score:?\s*(\d+\.?\d*)/i) || 
                           markdown.match(/Score:?\s*(\d+\.?\d*)/i);
    if (totalScoreMatch) {
      response.totalScore = parseFloat(totalScoreMatch[1]);
    }
    
    // Extract feedback (use the last paragraph or everything after the breakdown)
    const feedbackMatch = markdown.match(/Feedback:?\s*([\s\S]*?)$/i);
    if (feedbackMatch) {
      response.feedback = feedbackMatch[1].trim();
    } else {
      // Use the last paragraph as feedback if nothing else is found
      const paragraphs = markdown.split('\n\n');
      if (paragraphs.length > 0) {
        response.feedback = paragraphs[paragraphs.length - 1].trim();
      }
    }
    
    // Extract categories and scores
    const categories = [
      { regex: /Overall Style:?\s*(\d+)/i, category: 'Overall Style', emoji: '👑' },
      { regex: /Color Coordination:?\s*(\d+)/i, category: 'Color Coordination', emoji: '🎨' },
      { regex: /Fit & Proportion:?\s*(\d+)/i, category: 'Fit & Proportion', emoji: '📏' },
      { regex: /Accessories:?\s*(\d+)/i, category: 'Accessories', emoji: '⭐' },
      { regex: /Trend Alignment:?\s*(\d+)/i, category: 'Trend Alignment', emoji: '✨' },
      { regex: /Style Expression:?\s*(\d+)/i, category: 'Style Expression', emoji: '🪄' }
    ];
    
    for (const cat of categories) {
      const match = markdown.match(cat.regex);
      if (match) {
        // Extract details from text after the score until the next category
        const fullMatch = markdown.indexOf(match[0]);
        const endOfLine = markdown.indexOf('\n', fullMatch + match[0].length);
        let details = '';
        
        if (endOfLine > fullMatch) {
          const detailsStart = markdown.indexOf('*', fullMatch + match[0].length);
          if (detailsStart > 0 && detailsStart < endOfLine) {
            const nextCat = markdown.indexOf('\n*', detailsStart);
            details = markdown.substring(detailsStart, nextCat > 0 ? nextCat : undefined).trim();
            details = details.replace(/^\*+\s*/, '').trim();
          }
        }
        
        response.breakdown.push({
          category: cat.category,
          score: parseInt(match[1]),
          emoji: cat.emoji,
          details: details || `Assessment of ${cat.category.toLowerCase()}`
        });
      }
    }
    
    // Calculate total score if missing
    if (response.totalScore === 0 && response.breakdown.length > 0) {
      const sum = response.breakdown.reduce((acc, item) => acc + item.score, 0);
      response.totalScore = Math.round(sum / response.breakdown.length);
    }
    
    return response;
  } catch (error) {
    console.error('Error parsing markdown:', error);
    throw error;
  }
}

// Create a fallback response with minimal information
function constructFallbackResponse(text: string): any {
  console.log('Constructing fallback response');
  
  // Try to find any numbers that could be scores
  const scores = text.match(/\b[0-9](\.[0-9])?\b/g);
  let totalScore = 7; // Default
  
  if (scores && scores.length > 0) {
    // Use the first number as the total score
    totalScore = parseInt(scores[0]);
  }
  
  return {
    totalScore,
    breakdown: [
      { category: 'Overall Style', score: totalScore, emoji: '👑', details: 'Based on the outfit in the image' },
      { category: 'Color Coordination', score: totalScore, emoji: '🎨', details: 'Based on the outfit in the image' },
      { category: 'Fit & Proportion', score: totalScore, emoji: '📏', details: 'Based on the outfit in the image' },
      { category: 'Accessories', score: totalScore, emoji: '⭐', details: 'Based on the outfit in the image' },
      { category: 'Trend Alignment', score: totalScore, emoji: '✨', details: 'Based on the outfit in the image' },
      { category: 'Style Expression', score: totalScore, emoji: '🪄', details: 'Based on the outfit in the image' }
    ],
    feedback: text.substring(0, 300) + '...' // Use the first 300 chars as feedback
  };
}
