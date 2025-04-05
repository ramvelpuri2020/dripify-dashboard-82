import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { image, style } = await req.json();
    console.log('Analyzing style for:', style);

    const nebiusApiKey = Deno.env.get('NEBIUS_API_KEY');
    if (!nebiusApiKey) {
      throw new Error('Nebius API key not configured');
    }

    // Create a prompt for fashion analysis in conversational style
    const prompt = `As a professional fashion stylist, analyze this outfit focusing on these aspects:

    - Overall Style Impression (score 1-10)
    - Color Coordination (score 1-10)
    - Fit and Proportion (score 1-10)
    - Accessorizing (score 1-10)
    - Trend Awareness (score 1-10)
    - Personal Style (score 1-10)
    
    For each category, provide a score and brief feedback in 1-2 sentences maximum.
    
    Also give 3-4 clear, actionable improvement tips for the outfit overall.
    
    Finally, provide 2-3 next-level style tips for taking their fashion game to the next level.
    
    End with a brief summary (2-3 sentences) of the overall impression and main recommendations.
    
    Keep your language natural, direct, and conversational.`;

    // Prepare the messages for the API request
    const messages = [
      {
        role: 'system',
        content: prompt
      },
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: "What do you think of this outfit? Please analyze it thoroughly."
          },
          {
            type: 'image_url',
            image_url: {
              url: image // Base64 image data
            }
          }
        ]
      }
    ];

    console.log('Calling Nebius API with Qwen model...');
    
    try {
      // Call the Nebius API with the Qwen model
      const response = await fetch('https://api.studio.nebius.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${nebiusApiKey}`,
          'Content-Type': 'application/json',
          'Accept': '*/*'
        },
        body: JSON.stringify({
          model: "Qwen/Qwen2.5-VL-72B-Instruct",
          temperature: 0.7,
          messages: messages,
          max_tokens: 1000
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Nebius API error:', errorText);
        throw new Error(`Nebius API returned status ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      
      if (!data.choices || !data.choices[0] || !data.choices[0].message) {
        throw new Error('Invalid response format from Nebius API');
      }

      // Extract the content from the response
      const analysisContent = data.choices[0].message.content;
      console.log('Raw analysis received, processing...');

      // Process the natural language response into structured format
      const analysisResult = processStyleAnalysis(analysisContent);
      console.log('Analysis processed successfully');

      return new Response(JSON.stringify(analysisResult), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
      
    } catch (apiError) {
      console.error('Error calling Nebius API:', apiError);
      throw apiError;
    }
    
  } catch (error) {
    console.error('Error in analyze-style function:', error);
    
    return new Response(JSON.stringify({ 
      error: error.message || 'Unknown error occurred',
      message: 'Failed to analyze style. Please try again later.'
    }), { 
      status: 500, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  }
});

// Function to process the AI's natural language response into structured format
function processStyleAnalysis(content) {
  // Initialize result structure
  const result = {
    fullAnalysis: content,
    totalScore: 0,
    categories: [],
    tips: [],
    nextLevelTips: [],
    summary: ""
  };
  
  try {
    // Extract categories and scores using regex
    const categoryPattern = /(Overall Style Impression|Overall Style|Color Coordination|Fit and Proportion|Accessorizing|Trend Awareness|Personal Style)[^:]*:\s*(\d+)\/10/gi;
    let match;
    let scoreCount = 0;
    let totalScoreSum = 0;
    
    while ((match = categoryPattern.exec(content)) !== null) {
      const category = standardizeCategory(match[1].trim());
      const score = parseInt(match[2], 10);
      
      // Find details that follow the score
      const startPos = match.index + match[0].length;
      let endPos = content.length;
      
      // Look for the next section heading
      const nextSectionMatch = /\n\s*(?:Overall Style|Color Coordination|Fit and Proportion|Accessorizing|Trend Awareness|Personal Style|Improvement Tips|Next-Level|Summary)/i.exec(content.substring(startPos));
      
      if (nextSectionMatch) {
        endPos = startPos + nextSectionMatch.index;
      }
      
      // Extract and clean details
      let details = content.substring(startPos, endPos).trim();
      details = details.replace(/\*\*Improvement Tips:\*\*/gi, '').trim();
      
      // Add to categories
      result.categories.push({
        name: category,
        score: score,
        details: details
      });
      
      totalScoreSum += score;
      scoreCount++;
    }
    
    // Calculate average score
    if (scoreCount > 0) {
      result.totalScore = Math.round(totalScoreSum / scoreCount);
    }
    
    // Extract tips
    // First look for labeled improvement tips sections
    const tipsMatch = /(?:\*\*Improvement Tips[^:]*:|Improvement Tips[^:]*:|\n\s*Tips[^:]*:)([^]*?)(?=\n\s*(?:Next|Summary|\*\*Next|\*\*Summary|$))/i.exec(content);
    
    if (tipsMatch) {
      const tipsText = tipsMatch[1].trim();
      const tipsLines = tipsText.split(/\d+\./).filter(Boolean);
      
      result.tips = tipsLines.map(tip => 
        tip.replace(/^\s*\*+\s*|\s*\*+\s*$|\n+/g, '').trim()
      ).filter(tip => tip.length > 5);
    }
    
    // If no specific tips section, look for individual advice lines
    if (result.tips.length === 0) {
      const adviceLines = content.match(/(?:Consider|Try|Add|Use|Opt for|Swap|Include)[^\.!?]+[\.!?]/gi);
      if (adviceLines) {
        result.tips = adviceLines.slice(0, 4).map(tip => tip.trim());
      }
    }
    
    // Extract next-level tips
    const nextLevelMatch = /(?:Next-Level[^:]*:|Next Level[^:]*:)([^]*?)(?=\n\s*(?:Summary|\*\*Summary|$))/i.exec(content);
    
    if (nextLevelMatch) {
      const nextLevelText = nextLevelMatch[1].trim();
      
      // Check if numbered list
      if (nextLevelText.match(/\d+\./)) {
        const nextLevelLines = nextLevelText.split(/\d+\./).filter(Boolean);
        result.nextLevelTips = nextLevelLines.map(tip => 
          tip.replace(/^\s*\*+\s*|\s*\*+\s*$|\n+/g, '').trim()
        ).filter(tip => tip.length > 5);
      } 
      // If points use ** or bullet points
      else if (nextLevelText.includes('**') || nextLevelText.includes('•')) {
        const nextLevelLines = nextLevelText.split(/\*\*|\n\s*•/).filter(Boolean);
        result.nextLevelTips = nextLevelLines.map(tip => 
          tip.replace(/^\s*\*+\s*|\s*\*+\s*$|\n+/g, '').trim()
        ).filter(tip => tip.length > 5);
      }
      // If simple paragraph, keep as is
      else {
        result.nextLevelTips = [nextLevelText.trim()];
      }
    }
    
    // Extract summary
    const summaryMatch = /(?:Summary[^:]*:|In summary)([^]*?)$/i.exec(content);
    
    if (summaryMatch) {
      result.summary = summaryMatch[1].trim();
    } else {
      // Use last paragraph as summary if no explicit summary
      const paragraphs = content.split(/\n\s*\n/);
      if (paragraphs.length > 0) {
        result.summary = paragraphs[paragraphs.length - 1].trim();
      }
    }
    
    // Ensure we have at least one tip
    if (result.tips.length === 0) {
      result.tips = ["Consider adding accessories to elevate your look."];
    }
    
    // Ensure we have at least one next-level tip
    if (result.nextLevelTips.length === 0) {
      result.nextLevelTips = ["Experiment with different textures to create more visual interest."];
    }

    // Map categories to breakdown format for compatibility
    result.breakdown = result.categories.map(cat => ({
      category: cat.name,
      score: cat.score,
      emoji: getCategoryEmoji(cat.name),
      details: cat.details
    }));
    
  } catch (error) {
    console.error('Error processing style analysis:', error);
    // If parsing fails, return a simplified structure with the raw content
    return {
      fullAnalysis: content,
      totalScore: 7,
      categories: defaultCategories(),
      tips: ["Try adding accessories to elevate your outfit."],
      nextLevelTips: ["Experiment with different textures to create more visual interest."],
      summary: "This outfit shows potential and could be enhanced with a few styling adjustments.",
      breakdown: defaultCategories().map(cat => ({
        category: cat.name,
        score: cat.score,
        emoji: getCategoryEmoji(cat.name),
        details: cat.details
      }))
    };
  }
  
  return result;
}

// Helper function to get standard category name
function standardizeCategory(category) {
  const lowerCategory = category.toLowerCase();
  
  if (lowerCategory.includes('overall') || lowerCategory.includes('style impression')) {
    return 'Overall Style';
  } else if (lowerCategory.includes('color')) {
    return 'Color Coordination';
  } else if (lowerCategory.includes('fit') || lowerCategory.includes('proportion')) {
    return 'Fit and Proportion';
  } else if (lowerCategory.includes('accessor')) {
    return 'Accessorizing';
  } else if (lowerCategory.includes('trend')) {
    return 'Trend Awareness';
  } else if (lowerCategory.includes('personal')) {
    return 'Personal Style';
  }
  
  // Return capitalized if no match
  return category.charAt(0).toUpperCase() + category.slice(1);
}

// Helper function to get emoji for category
function getCategoryEmoji(category) {
  const categoryLower = category.toLowerCase();
  if (categoryLower.includes('overall') || categoryLower.includes('style impression')) return '👑';
  if (categoryLower.includes('color')) return '🎨';
  if (categoryLower.includes('fit') || categoryLower.includes('proportion')) return '📏';
  if (categoryLower.includes('accessor')) return '⭐';
  if (categoryLower.includes('trend')) return '✨';
  if (categoryLower.includes('personal')) return '🪄';
  return '🪄';
}

// Default categories if parsing fails
function defaultCategories() {
  return [
    { name: "Overall Style", score: 7, details: "This outfit has an interesting mix of elements." },
    { name: "Color Coordination", score: 7, details: "The color palette works well together." },
    { name: "Fit and Proportion", score: 7, details: "The fit is generally flattering." },
    { name: "Accessorizing", score: 6, details: "Could benefit from more accessories." },
    { name: "Trend Awareness", score: 7, details: "Shows awareness of current trends." },
    { name: "Personal Style", score: 7, details: "Demonstrates personal style preferences." }
  ];
}
