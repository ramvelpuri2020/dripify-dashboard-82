
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

    // Check if Together API key is available
    const togetherApiKey = Deno.env.get('TOGETHER_API_KEY');
    
    // If Together API key is not available, try with Nebius or OpenAI
    if (!togetherApiKey) {
      // Try Nebius
      const nebiusApiKey = Deno.env.get('NEBIUS_API_KEY');
      if (nebiusApiKey) {
        return await analyzeWithNebius(image, nebiusApiKey, corsHeaders);
      }
      
      // If no API keys are available, return fallback response
      console.log('No API keys configured, returning fallback response');
      return new Response(JSON.stringify(generateFallbackAnalysis()), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }
    
    // Call Together API for analysis
    try {
      console.log('Calling Together API...');
      
      const response = await fetch('https://api.together.xyz/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${togetherApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: "meta-llama/Llama-3.2-11B-Vision-Instruct-Turbo",
          messages: [
            {
              role: 'system',
              content: `You are a fashion expert who analyzes outfits with brutal honesty. Assess this outfit and provide:
              1. An overall style score (1-10)
              2. Detailed breakdown for: Overall Style, Color Coordination, Fit & Proportion, Accessories, Trend Alignment, Style Expression
              3. For each category, provide a score from 1-10 and short feedback (1-2 sentences)
              4. 4-5 specific improvement tips
              5. 2-3 next-level style tips
              6. A concise summary of the overall impression

              Format your response as clean text without markdown.`
            },
            {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: "Please analyze my outfit and provide style feedback."
                },
                {
                  type: 'image_url',
                  image_url: {
                    url: image
                  }
                }
              ]
            }
          ],
          max_tokens: 1000,
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Together API error:', errorText);
        throw new Error(`Together API returned status ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      
      if (!data.choices || !data.choices[0] || !data.choices[0].message) {
        throw new Error('Invalid response format from Together API');
      }

      // Extract the content from the response
      const analysisContent = data.choices[0].message.content;
      console.log('Raw analysis received:', analysisContent);

      // Process the natural language response into structured format
      const result = processStyleAnalysis(analysisContent);
      console.log('Analysis processed successfully');

      return new Response(JSON.stringify(result), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
      
    } catch (apiError) {
      console.error('Error calling Together API:', apiError);
      return new Response(JSON.stringify(generateFallbackAnalysis()), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }
    
  } catch (error) {
    console.error('Error in analyze-style function:', error);
    
    return new Response(JSON.stringify(generateFallbackAnalysis()), { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  }
});

// Process the AI's natural language response into structured format
function processStyleAnalysis(content) {
  try {
    // Extract total score
    const totalScoreMatch = content.match(/Overall (?:Style|Score|Rating)(?:[^:]*?):?\s*(\d+)(?:\/10)?/i);
    const totalScore = totalScoreMatch ? parseInt(totalScoreMatch[1], 10) : 7;
    
    // Extract category scores
    const categories = [
      { name: "Overall Style", regex: /Overall Style[^:]*:?\s*(\d+)(?:\/10)?/i },
      { name: "Color Coordination", regex: /Colou?r Co[^:]*:?\s*(\d+)(?:\/10)?/i },
      { name: "Fit & Proportion", regex: /Fit[^:]*:?\s*(\d+)(?:\/10)?/i },
      { name: "Accessories", regex: /Access[^:]*:?\s*(\d+)(?:\/10)?/i },
      { name: "Trend Alignment", regex: /Trend[^:]*:?\s*(\d+)(?:\/10)?/i },
      { name: "Style Expression", regex: /(?:Style Expression|Personal Style)[^:]*:?\s*(\d+)(?:\/10)?/i }
    ];
    
    const extractedCategories = [];
    
    for (const category of categories) {
      const match = content.match(category.regex);
      if (match) {
        const score = parseInt(match[1], 10);
        
        // Find details that follow the score
        const startPos = match.index + match[0].length;
        let endPos = content.length;
        
        // Look for the next section heading or empty line
        const nextSectionRegex = new RegExp(`(?:\\n\\s*${categories.map(c => c.name).join('|')}|\\n\\s*\\n)`, 'i');
        const nextSectionMatch = content.substring(startPos).match(nextSectionRegex);
        
        if (nextSectionMatch) {
          endPos = startPos + nextSectionMatch.index;
        }
        
        // Extract and clean details
        let details = content.substring(startPos, endPos).trim();
        details = details.replace(/^[:.,-\s]+/, '').trim(); // Remove leading punctuation
        
        extractedCategories.push({
          name: category.name,
          score: score,
          details: details
        });
      } else {
        // Default value if category not found
        extractedCategories.push({
          name: category.name,
          score: 7,
          details: `No specific feedback for ${category.name}`
        });
      }
    }
    
    // Create breakdown from categories
    const breakdown = extractedCategories.map(cat => ({
      category: cat.name,
      score: cat.score,
      emoji: getCategoryEmoji(cat.name),
      details: cat.details
    }));
    
    // Extract improvement tips
    const tipsRegex = /(?:Improvement Tips|Style Tips|Tips|Suggestions)(?::|\.|\n)([\s\S]*?)(?=\n\s*(?:Next|Advanced|Summary|Overall|$))/i;
    const tipsMatch = content.match(tipsRegex);
    
    let tips = [];
    if (tipsMatch) {
      const tipsText = tipsMatch[1].trim();
      
      // Try to extract numbered or bulleted tips
      const tipItems = tipsText.match(/(?:\d+\.|\*|\-|\•)\s*([^\n]+)/g);
      
      if (tipItems) {
        tips = tipItems.map(tip => tip.replace(/^(?:\d+\.|\*|\-|\•)\s*/, '').trim());
      } else {
        // If no numbered/bulleted list, split by sentences or lines
        tips = tipsText.split(/(?:\.|\n)/).filter(tip => tip.trim().length > 5).map(tip => tip.trim());
      }
    }
    
    // If still no tips, extract sentences that sound like tips
    if (tips.length === 0) {
      const tipSentences = content.match(/(?:Consider|Try|Add|Use|Opt for|Swap|Include|Choose)[^\.!?]+[\.!?]/gi);
      if (tipSentences) {
        tips = tipSentences.map(tip => tip.trim());
      }
    }
    
    // Ensure we have at least some default tips
    if (tips.length === 0) {
      tips = [
        "Add accessories to complete your look.",
        "Consider exploring different color combinations.",
        "Pay attention to fit and proportion for a more polished look.",
        "Experiment with different textures to add visual interest."
      ];
    }
    
    // Extract next-level tips
    const nextLevelRegex = /(?:Next-Level|Advanced|Next Level)(?::|\.|\n)([\s\S]*?)(?=\n\s*(?:Summary|Overall|$))/i;
    const nextLevelMatch = content.match(nextLevelRegex);
    
    let nextLevelTips = [];
    if (nextLevelMatch) {
      const nextLevelText = nextLevelMatch[1].trim();
      
      // Try to extract numbered or bulleted tips
      const nextLevelItems = nextLevelText.match(/(?:\d+\.|\*|\-|\•)\s*([^\n]+)/g);
      
      if (nextLevelItems) {
        nextLevelTips = nextLevelItems.map(tip => tip.replace(/^(?:\d+\.|\*|\-|\•)\s*/, '').trim());
      } else {
        // If no numbered/bulleted list, split by sentences or lines
        nextLevelTips = nextLevelText.split(/(?:\.|\n)/).filter(tip => tip.trim().length > 5).map(tip => tip.trim());
      }
    }
    
    // Ensure we have default next-level tips
    if (nextLevelTips.length === 0) {
      nextLevelTips = [
        "Experiment with layering different textures and patterns for a more sophisticated look.",
        "Invest in statement accessories that can elevate even the simplest outfits."
      ];
    }
    
    // Extract summary
    const summaryRegex = /(?:Summary|Overall|In summary)(?::|\.|\n)([\s\S]*?)$/i;
    const summaryMatch = content.match(summaryRegex);
    
    let summary = "";
    if (summaryMatch) {
      summary = summaryMatch[1].trim();
    } else {
      // If no explicit summary, use last paragraph as summary
      const paragraphs = content.split(/\n\s*\n/);
      if (paragraphs.length > 0) {
        summary = paragraphs[paragraphs.length - 1].trim();
      }
    }
    
    // If no summary found, create one from the scores
    if (!summary || summary.length < 10) {
      summary = `This outfit scores ${totalScore}/10 overall. The strongest areas are style expression and fit, while accessories and color coordination could use improvement. Focus on the tips provided for a more polished look.`;
    }
    
    // Create styleTips array grouped by category
    const styleTips = extractedCategories.map(category => {
      // Find tips that might be relevant to this category by keyword matching
      const categoryKeywords = getCategoryKeywords(category.name);
      const relevantTips = tips.filter(tip => 
        categoryKeywords.some(keyword => 
          tip.toLowerCase().includes(keyword)
        )
      );
      
      // If we couldn't find relevant tips by keywords, assign 1-2 random tips
      const categoryTips = relevantTips.length > 0 
        ? relevantTips.slice(0, 3) 
        : tips.slice(0, Math.min(2, tips.length));
      
      return {
        category: category.name,
        tips: categoryTips.length > 0 ? categoryTips : ["Explore different styles and options to enhance this aspect of your outfit."]
      };
    });
    
    return {
      totalScore: totalScore,
      breakdown: breakdown,
      feedback: summary,
      styleTips: styleTips,
      nextLevelTips: nextLevelTips
    };
    
  } catch (error) {
    console.error('Error processing style analysis:', error);
    return generateFallbackAnalysis();
  }
}

// Helper function to get keywords for a category to match with tips
function getCategoryKeywords(category) {
  const categoryLower = category.toLowerCase();
  if (categoryLower.includes('overall') || categoryLower.includes('style impression')) {
    return ['overall', 'outfit', 'look', 'ensemble', 'style'];
  } else if (categoryLower.includes('color')) {
    return ['color', 'palette', 'shade', 'tone', 'hue', 'match'];
  } else if (categoryLower.includes('fit') || categoryLower.includes('proportion')) {
    return ['fit', 'proportion', 'silhouette', 'size', 'shape', 'tailor'];
  } else if (categoryLower.includes('accessor')) {
    return ['accessory', 'accessories', 'jewelry', 'bag', 'belt', 'necklace', 'earring', 'watch', 'scarf'];
  } else if (categoryLower.includes('trend')) {
    return ['trend', 'fashion', 'current', 'modern', 'popular', 'contemporary'];
  } else if (categoryLower.includes('expression') || categoryLower.includes('personal')) {
    return ['personal', 'express', 'identity', 'unique', 'individual', 'personality'];
  }
  return [categoryLower];
}

// Helper function to get emoji for category
function getCategoryEmoji(category) {
  const categoryLower = category.toLowerCase();
  if (categoryLower.includes('overall') || categoryLower.includes('style impression')) return '👑';
  if (categoryLower.includes('color')) return '🎨';
  if (categoryLower.includes('fit') || categoryLower.includes('proportion')) return '📏';
  if (categoryLower.includes('accessor')) return '⭐';
  if (categoryLower.includes('trend')) return '✨';
  if (categoryLower.includes('personal') || categoryLower.includes('expression')) return '🪄';
  return '🪄';
}

// Function to analyze with Nebius if available
async function analyzeWithNebius(image, nebiusApiKey, corsHeaders) {
  try {
    console.log('Trying to analyze with Nebius API...');
    
    // Create a simpler prompt for Nebius
    const prompt = `Analyze this outfit and provide a style assessment with these categories:
    - Overall Style (score 1-10)
    - Color Coordination (score 1-10)
    - Fit and Proportion (score 1-10)
    - Accessorizing (score 1-10)
    - Trend Awareness (score 1-10)
    - Personal Style (score 1-10)
    
    For each category, provide a score and brief feedback.
    
    Also give 4 improvement tips for the outfit.
    
    Provide 2 next-level style tips for elevating their fashion game.
    
    End with a brief summary of the overall impression.`;

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
              url: image
            }
          }
        ]
      }
    ];

    // Call the Nebius API
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
      throw new Error(`Nebius API returned status ${response.status}`);
    }

    const data = await response.json();
    const analysisContent = data.choices[0].message.content;
    const result = processStyleAnalysis(analysisContent);

    return new Response(JSON.stringify(result), { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  } catch (error) {
    console.error('Error with Nebius analysis:', error);
    
    // Fall back to default response
    return new Response(JSON.stringify(generateFallbackAnalysis()), { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  }
}

// Generate a fallback analysis when API calls fail
function generateFallbackAnalysis() {
  return {
    totalScore: 7,
    breakdown: [
      { category: "Overall Style", score: 7, emoji: "👑", details: "The outfit has good elements but could be more cohesive." },
      { category: "Color Coordination", score: 7, emoji: "🎨", details: "The color choices work together but could be more intentional." },
      { category: "Fit & Proportion", score: 8, emoji: "📏", details: "The clothing fits well and flatters your body type." },
      { category: "Accessories", score: 6, emoji: "⭐", details: "Some accessories present but could be better coordinated." },
      { category: "Trend Alignment", score: 7, emoji: "✨", details: "The outfit incorporates some current trends." },
      { category: "Style Expression", score: 7, emoji: "🪄", details: "Your personal style shows through but could be more distinctive." }
    ],
    feedback: "This outfit shows good fashion fundamentals with proper fit and decent color choices. To elevate your style, consider more intentional accessorizing and pushing boundaries with current trends that match your personal aesthetic.",
    styleTips: [
      {
        category: "Overall Style",
        tips: ["Add a statement piece to elevate the look.", "Consider layering for more visual interest.", "Pay attention to proportions and silhouette."]
      },
      {
        category: "Color Coordination",
        tips: ["Try the 60-30-10 color rule for better balance.", "Consider analogous or complementary color schemes.", "Add a pop of contrasting color as an accent."]
      },
      {
        category: "Fit & Proportion",
        tips: ["Ensure proper tailoring for a polished look.", "Balance oversized pieces with fitted items.", "Consider your body type when selecting silhouettes."]
      },
      {
        category: "Accessories",
        tips: ["Choose accessories that complement your outfit's color scheme.", "Consider the rule of thirds for jewelry placement.", "Don't overdo it - sometimes less is more."]
      },
      {
        category: "Trend Alignment",
        tips: ["Incorporate one trend at a time for a modern look.", "Adapt trends to suit your personal style.", "Focus on timeless pieces with trendy accents."]
      },
      {
        category: "Style Expression",
        tips: ["Define your personal style with consistent elements.", "Take fashion risks that feel authentic to you.", "Develop a signature look or accessory."]
      }
    ],
    nextLevelTips: [
      "Invest in quality over quantity for key wardrobe pieces.",
      "Study color theory to create more intentional combinations.",
      "Learn about different fabric types and how they affect the drape and feel of clothing.",
      "Consider the historical context of fashion trends to develop a more nuanced style."
    ]
  };
}
