
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

    // Create a simpler prompt for fashion analysis to get more structured results
    const prompt = `Analyze this outfit and provide a style assessment with these categories:

    - Overall Style (score 1-10)
    - Color Coordination (score 1-10)
    - Fit and Proportion (score 1-10)
    - Accessorizing (score 1-10)
    - Trend Awareness (score 1-10)
    - Personal Style (score 1-10)
    
    For each category, provide a score and 1-2 sentences of feedback.
    
    Also give 4 clear, actionable improvement tips for the outfit.
    
    Provide 2 next-level style tips for elevating their fashion game.
    
    End with a brief summary (2-3 sentences) of the overall impression and recommendations.
    
    Format your response in clear sections with headings.`;

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
            text: "Please analyze this outfit and provide style feedback."
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
    const categoryPattern = /(Overall Style|Color Coordination|Fit and Proportion|Accessorizing|Trend Awareness|Personal Style)[^:]*:\s*(\d+)\/10/gi;
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
    
    // Extract improvement tips
    const tipsSection = /(?:improvement tips|tips|suggested improvements)[^:]*:([^]*?)(?=\n\s*(?:next|summary|\*\*next|\*\*summary|$))/i.exec(content);
    
    if (tipsSection) {
      // Extract numbered tips
      const tipsText = tipsSection[1].trim();
      const tipMatches = tipsText.match(/\d+\.\s+[^]*?(?=\d+\.|$)/g) || [];
      
      result.tips = tipMatches.map(tip => 
        tip.replace(/^\d+\.\s+/, '').trim()
      ).filter(tip => tip.length > 5);
      
      // If no numbered tips found, try extracting bullet points
      if (result.tips.length === 0) {
        const bulletMatches = tipsText.match(/(?:\*|\-|\•)\s+[^]*?(?=(?:\*|\-|\•)|$)/g) || [];
        result.tips = bulletMatches.map(tip => 
          tip.replace(/^(?:\*|\-|\•)\s+/, '').trim()
        ).filter(tip => tip.length > 5);
      }
      
      // If still no tips, try just using the whole section
      if (result.tips.length === 0 && tipsText.length > 10) {
        result.tips = [tipsText];
      }
    }
    
    // If still no tips, look for sentences that sound like tips
    if (result.tips.length === 0) {
      const tipSentences = content.match(/(?:Consider|Try|Add|Use|Opt for|Swap|Include|Choose)[^\.!?]+[\.!?]/gi) || [];
      result.tips = tipSentences.slice(0, 4).map(tip => tip.trim());
    }
    
    // Ensure we have at least some default tips
    if (result.tips.length === 0) {
      result.tips = [
        "Add accessories to complete your look.",
        "Consider exploring different color combinations.",
        "Pay attention to fit and proportion for a more polished look.",
        "Experiment with different textures to add visual interest."
      ];
    }
    
    // Extract next-level tips
    const nextLevelSection = /(?:next-level tips|next level|taking it further)[^:]*:([^]*?)(?=\n\s*(?:summary|\*\*summary|$))/i.exec(content);
    
    if (nextLevelSection) {
      const nextLevelText = nextLevelSection[1].trim();
      
      // Try to extract numbered or bulleted tips
      const nextLevelMatches = nextLevelText.match(/(?:\d+\.|(?:\*|\-|\•))\s+[^]*?(?=(?:\d+\.|(?:\*|\-|\•))|$)/g) || [];
      
      if (nextLevelMatches.length > 0) {
        result.nextLevelTips = nextLevelMatches.map(tip => 
          tip.replace(/^(?:\d+\.|\*|\-|\•)\s+/, '').trim()
        ).filter(tip => tip.length > 5);
      } else if (nextLevelText.length > 10) {
        // If no structured list found, use the whole text
        result.nextLevelTips = [nextLevelText];
      }
    }
    
    // Ensure we have default next-level tips
    if (result.nextLevelTips.length === 0) {
      result.nextLevelTips = [
        "Experiment with layering different textures and patterns for a more sophisticated look.",
        "Invest in statement accessories that can elevate even the simplest outfits."
      ];
    }
    
    // Extract summary
    const summaryMatch = /(?:summary|overall impression|in summary)[^:]*:([^]*?)$/i.exec(content);
    
    if (summaryMatch) {
      result.summary = summaryMatch[1].trim();
    } else {
      // Use last paragraph as summary if no explicit summary
      const paragraphs = content.split(/\n\s*\n/);
      if (paragraphs.length > 0) {
        result.summary = paragraphs[paragraphs.length - 1].trim();
      }
    }
    
    // If no summary found, create one from the scores
    if (!result.summary || result.summary.length < 10) {
      result.summary = `This outfit scores ${result.totalScore}/10 overall. The strongest areas are ${getTopCategories(result.categories)} while ${getWeakestCategories(result.categories)} could use improvement. Focus on the improvement tips for a more polished look.`;
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
      tips: ["Try adding accessories to elevate your outfit.", 
             "Experiment with different color combinations.", 
             "Pay attention to fit and proportion.", 
             "Consider adding layers for visual interest."],
      nextLevelTips: ["Experiment with different textures to create more visual interest.", 
                     "Invest in statement pieces that reflect your personal style."],
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

// Helper function to get top categories
function getTopCategories(categories) {
  if (!categories || categories.length === 0) return "style elements";
  
  const sortedCats = [...categories].sort((a, b) => b.score - a.score);
  const topCats = sortedCats.slice(0, 2).filter(cat => cat.score >= 7);
  
  if (topCats.length === 0) return "style elements";
  
  return topCats.map(cat => cat.name.toLowerCase()).join(" and ");
}

// Helper function to get weakest categories
function getWeakestCategories(categories) {
  if (!categories || categories.length === 0) return "some areas";
  
  const sortedCats = [...categories].sort((a, b) => a.score - b.score);
  const weakCats = sortedCats.slice(0, 2).filter(cat => cat.score <= 6);
  
  if (weakCats.length === 0) return "some areas";
  
  return weakCats.map(cat => cat.name.toLowerCase()).join(" and ");
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
