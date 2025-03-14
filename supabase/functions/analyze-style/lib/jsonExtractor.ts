
export function extractJsonFromResponse(text: string): any {
  // First try to parse the entire response as JSON
  try {
    return JSON.parse(text);
  } catch (firstError) {
    console.log('Not valid JSON, attempting to extract JSON portion');
    
    try {
      // Look for JSON object in the text (between curly braces)
      const jsonRegex = /{[\s\S]*?}/g;
      const matches = text.match(jsonRegex);
      
      if (matches && matches.length > 0) {
        // Try each match until we find valid JSON
        for (const match of matches) {
          try {
            return JSON.parse(match);
          } catch (e) {
            // Continue to next match
          }
        }
      }

      // If no valid JSON found in curly braces, try to parse the markdown into JSON
      if (text.includes('**Total Score:**') || text.includes('Overall Style')) {
        console.log('Attempting to extract markdown structured data');
        return parseMarkdownToJson(text);
      }
      
      throw new Error('Could not extract valid JSON');
    } catch (error) {
      console.error('Error parsing response:', error);
      throw error;
    }
  }
}

function parseMarkdownToJson(markdown: string): any {
  const result: any = {
    totalScore: 0,
    breakdown: [],
    feedback: ''
  };

  // Extract total score
  const scoreMatch = markdown.match(/\*\*Total Score:\*\*\s*(\d+\.?\d*)/i);
  if (scoreMatch && scoreMatch[1]) {
    result.totalScore = parseFloat(scoreMatch[1]);
  }

  // Extract categories and scores
  const categories = [
    { name: 'Overall Style', regex: /\*\*Overall Style\*\*:?\s*(\d+)/i, emoji: '👑' },
    { name: 'Color Coordination', regex: /\*\*Color Coordination\*\*:?\s*(\d+)/i, emoji: '🎨' },
    { name: 'Fit & Proportion', regex: /\*\*Fit (&|and) Proportion\*\*:?\s*(\d+)/i, emoji: '📏' },
    { name: 'Accessories', regex: /\*\*Accessories\*\*:?\s*(\d+)/i, emoji: '⭐' },
    { name: 'Trend Alignment', regex: /\*\*Trend Alignment\*\*:?\s*(\d+)/i, emoji: '✨' },
    { name: 'Style Expression', regex: /\*\*Style Expression\*\*:?\s*(\d+)/i, emoji: '🪄' }
  ];

  for (const category of categories) {
    const match = markdown.match(category.regex);
    if (match) {
      const scoreIndex = category.name === 'Fit & Proportion' ? 2 : 1;
      const score = parseInt(match[scoreIndex], 10);
      
      // Find details for this category
      const detailsRegex = new RegExp(`\\*\\*${category.name}\\*\\*:?\\s*\\d+[^*]*\\*\\s*(.+?)(?=\\n\\n|\\*\\*|$)`, 'is');
      const detailsMatch = markdown.match(detailsRegex);
      const details = detailsMatch ? detailsMatch[1].trim() : '';
      
      result.breakdown.push({
        category: category.name,
        score,
        emoji: category.emoji,
        details
      });
    }
  }

  // Extract feedback
  const feedbackMatch = markdown.match(/\*\*Feedback:\*\*\s*([\s\S]+?)(?=\n\n\*\*|$)/i);
  if (feedbackMatch && feedbackMatch[1]) {
    result.feedback = feedbackMatch[1].trim();
  }

  // Calculate total score if not found directly
  if (result.totalScore === 0 && result.breakdown.length > 0) {
    const sum = result.breakdown.reduce((acc, item) => acc + item.score, 0);
    result.totalScore = Math.round(sum / result.breakdown.length);
  }

  return result;
}
