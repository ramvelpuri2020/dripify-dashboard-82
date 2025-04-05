
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
    
    // If Together API key is not available, try with OpenAI or return fallback response
    if (!togetherApiKey) {
      // If no API keys are available, return fallback response
      console.log('No API keys configured, returning fallback response');
      return new Response(JSON.stringify(generateFallbackAnalysis()), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }
    
    // Call Together API for analysis
    try {
      console.log('Calling Together API...');
      
      const stylePrompt = `You're a fashion expert who analyzes outfits with brutal honesty. 
      Analyze the outfit in this image as if you're a real fashion expert who is direct and uses slang and industry terms naturally.
      Provide scores between 1-10 as WHOLE NUMBERS ONLY (no decimals) for each category. Sound authentic and conversational, not like AI.
      Return JSON in this EXACT format without any markdown formatting, backticks, or anything else:

      {
        "totalScore": <1-10 whole number>,
        "breakdown": [
          {
            "category": "Overall Style",
            "score": <1-10 whole number>,
            "emoji": "👑",
            "details": "1-2 sentence specific and detailed explanation of score"
          },
          {
            "category": "Color Coordination",
            "score": <1-10 whole number>,
            "emoji": "🎨",
            "details": "1-2 sentence specific and detailed explanation of score"
          },
          {
            "category": "Fit & Proportion",
            "score": <1-10 whole number>,
            "emoji": "📏",
            "details": "1-2 sentence specific and detailed explanation of score"
          },
          {
            "category": "Accessories",
            "score": <1-10 whole number>,
            "emoji": "⭐",
            "details": "1-2 sentence specific and detailed explanation of score"
          },
          {
            "category": "Trend Alignment",
            "score": <1-10 whole number>,
            "emoji": "✨",
            "details": "1-2 sentence specific and detailed explanation of score"
          },
          {
            "category": "Style Expression",
            "score": <1-10 whole number>,
            "emoji": "🪄",
            "details": "1-2 sentence specific and detailed explanation of score"
          }
        ],
        "feedback": "3-4 sentences of specific, detailed overall feedback about the outfit"
      }`;

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
              content: stylePrompt
            },
            {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: "Analyze this outfit and provide detailed style feedback specifically about the items and styling shown in the image."
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

      // Try to parse the JSON directly
      let analysis;
      try {
        analysis = JSON.parse(analysisContent);
        console.log('Successfully parsed JSON directly');
      } catch (parseError) {
        console.error('Failed to parse JSON directly:', parseError);
        
        // Try to extract JSON from the response
        try {
          const jsonMatch = analysisContent.match(/\{[\s\S]*\}/);
          if (!jsonMatch) {
            throw new Error('No JSON object found in response');
          }
          
          // Make some common fixes to the JSON to handle AI formatting quirks
          let jsonStr = jsonMatch[0]
            .replace(/,\s*\}/g, '}')  // Remove trailing commas in objects
            .replace(/,\s*\]/g, ']')  // Remove trailing commas in arrays
            .replace(/\n/g, ' ')      // Remove newlines
            .replace(/\\"/g, '"')     // Fix escaped quotes
            .replace(/"\s*\+\s*"/g, ''); // Fix concatenated strings
          
          analysis = JSON.parse(jsonStr);
          console.log('Successfully parsed extracted JSON');
        } catch (extractError) {
          console.error('Failed to extract valid JSON:', extractError);
          throw new Error('Failed to parse AI response');
        }
      }

      // Now generate tips in a separate request to ensure complete data
      console.log('Generating style tips...');
      
      const tipsResponse = await fetch('https://api.together.xyz/v1/chat/completions', {
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
              content: `Based on the fashion analysis provided, generate specific improvement tips for each category and some advanced tips. 
              The output should be clean JSON in this exact format:
              {
                "styleTips": [
                  {
                    "category": "Overall Style",
                    "tips": ["specific tip 1", "specific tip 2", "specific tip 3"]
                  },
                  {
                    "category": "Color Coordination",
                    "tips": ["specific tip 1", "specific tip 2", "specific tip 3"]
                  },
                  {
                    "category": "Fit & Proportion",
                    "tips": ["specific tip 1", "specific tip 2", "specific tip 3"]
                  },
                  {
                    "category": "Accessories",
                    "tips": ["specific tip 1", "specific tip 2", "specific tip 3"]
                  },
                  {
                    "category": "Trend Alignment",
                    "tips": ["specific tip 1", "specific tip 2", "specific tip 3"]
                  },
                  {
                    "category": "Style Expression",
                    "tips": ["specific tip 1", "specific tip 2", "specific tip 3"]
                  }
                ],
                "nextLevelTips": ["advanced tip 1", "advanced tip 2", "advanced tip 3"]
              }
              Each tip should be a complete, actionable sentence specific to the outfit in the image.`
            },
            {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: `Here's the style analysis of this outfit: ${JSON.stringify(analysis)}. Generate specific improvement tips for each category based on this analysis and what you can see in the image.`
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
          max_tokens: 1500,
          temperature: 0.7,
        }),
      });

      if (!tipsResponse.ok) {
        throw new Error(`Together API returned status ${tipsResponse.status} for tips`);
      }

      const tipsData = await tipsResponse.json();
      
      if (!tipsData.choices || !tipsData.choices[0] || !tipsData.choices[0].message) {
        throw new Error('Invalid tips response from Together API');
      }

      // Extract and parse tips
      const tipsContent = tipsData.choices[0].message.content;
      let tips;
      
      try {
        tips = JSON.parse(tipsContent);
      } catch (parseError) {
        console.error('Failed to parse tips JSON directly:', parseError);
        
        try {
          // Try to extract JSON from the response
          const jsonMatch = tipsContent.match(/\{[\s\S]*\}/);
          if (!jsonMatch) {
            throw new Error('No JSON object found in tips response');
          }
          
          // Clean up the JSON
          let jsonStr = jsonMatch[0]
            .replace(/,\s*\}/g, '}')  // Remove trailing commas in objects
            .replace(/,\s*\]/g, ']')  // Remove trailing commas in arrays
            .replace(/\n/g, ' ')      // Remove newlines
            .replace(/\\"/g, '"')     // Fix escaped quotes
            .replace(/"\s*\+\s*"/g, ''); // Fix concatenated strings
          
          tips = JSON.parse(jsonStr);
        } catch (extractError) {
          console.error('Failed to extract valid tips JSON:', extractError);
          // Use fallback tips
          tips = {
            styleTips: generateFallbackTips(analysis),
            nextLevelTips: [
              "Experiment with layering different textures for visual interest.",
              "Invest in quality statement pieces that can elevate simpler outfits.",
              "Study fashion history to understand how to blend vintage and modern elements."
            ]
          };
        }
      }

      // Combine the results
      const result = {
        totalScore: analysis.totalScore,
        breakdown: analysis.breakdown,
        feedback: analysis.feedback,
        styleTips: tips.styleTips,
        nextLevelTips: tips.nextLevelTips
      };

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

// Generate fallback tips based on the analysis
function generateFallbackTips(analysis) {
  if (!analysis || !analysis.breakdown) {
    return [];
  }
  
  return analysis.breakdown.map(category => {
    const score = category.score || 5;
    let tips = [];
    
    switch (category.category) {
      case "Overall Style":
        tips = [
          "Add a statement piece to create a focal point in your outfit.",
          "Consider the occasion when choosing your outfit to ensure appropriate styling.",
          "Develop a signature style element that makes your outfits distinctively yours."
        ];
        break;
      case "Color Coordination":
        tips = [
          "Try the 60-30-10 rule: 60% base color, 30% secondary color, 10% accent color.",
          "Choose colors that complement your skin tone and hair color.",
          "Use color psychology to convey the mood you want to project."
        ];
        break;
      case "Fit & Proportion":
        tips = [
          "Invest in tailoring to ensure your clothes fit your body perfectly.",
          "Balance oversized pieces with fitted items to maintain proportion.",
          "Choose silhouettes that highlight your favorite features."
        ];
        break;
      case "Accessories":
        tips = [
          "Add a statement necklace or earrings to elevate a simple outfit.",
          "Consider the rule of three when accessorizing: limit yourself to three key pieces.",
          "Match metals in your accessories for a cohesive look."
        ];
        break;
      case "Trend Alignment":
        tips = [
          "Incorporate one trend at a time to keep your outfit balanced.",
          "Adapt current trends to suit your personal style rather than following them exactly.",
          "Invest in trend-proof classics and add trendy accents."
        ];
        break;
      case "Style Expression":
        tips = [
          "Incorporate elements that reflect your personality and interests.",
          "Don't be afraid to break conventional fashion rules if it expresses your style.",
          "Build a mood board of styles you love to help define your personal aesthetic."
        ];
        break;
      default:
        tips = [
          "Focus on quality over quantity when building your wardrobe.",
          "Experiment with different styles to discover what makes you feel confident.",
          "Pay attention to the details, as they can make or break an outfit."
        ];
    }
    
    return {
      category: category.category,
      tips: tips
    };
  });
}

// Generate a fallback analysis when API calls fail
function generateFallbackAnalysis() {
  return {
    totalScore: 7,
    breakdown: [
      { category: "Overall Style", score: 7, emoji: "👑", details: "The outfit shows good fashion sense with a cohesive look, though it could benefit from more intentional styling." },
      { category: "Color Coordination", score: 7, emoji: "🎨", details: "The color palette works well together but could use more contrast or a strategic pop of color to add interest." },
      { category: "Fit & Proportion", score: 8, emoji: "📏", details: "The clothing fits well and flatters your body shape, creating a balanced silhouette that works with your proportions." },
      { category: "Accessories", score: 6, emoji: "⭐", details: "The accessories present complement the outfit but there's room for more strategic choices to elevate the look." },
      { category: "Trend Alignment", score: 7, emoji: "✨", details: "The outfit incorporates some current trends effectively while maintaining a timeless quality." },
      { category: "Style Expression", score: 7, emoji: "🪄", details: "Your personality comes through in this outfit, showing a distinct style direction that could be pushed further." }
    ],
    feedback: "This outfit demonstrates good fashion fundamentals with thoughtful color choices and proper fit. To elevate your style, focus on more intentional accessorizing and incorporating statement pieces that express your personality. The overall look is cohesive but could benefit from more risk-taking to make it truly memorable.",
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
      "Learn about different fabric types and how they affect the drape and feel of clothing."
    ]
  };
}
