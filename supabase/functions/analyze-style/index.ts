
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { image, style } = await req.json();
    console.log('Analyzing style for: ', style);

    const togetherApiKey = Deno.env.get('TOGETHER_API_KEY');
    if (!togetherApiKey) {
      throw new Error('Together API key not configured');
    }

    // First analysis for overall style assessment
    const styleAnalysisResponse = await fetch('https://api.together.xyz/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${togetherApiKey}`
      },
      body: JSON.stringify({
        model: "meta-llama/Llama-3.2-11B-Vision-Instruct-Turbo",
        messages: [
          {
            role: 'system',
            content: `You're a fashion expert who analyzes outfits with brutal honesty. 
            Analyze the outfit as if you're a real fashion expert who is direct and uses slang and industry terms naturally.
            Provide scores between 1-10 for each category. Sound authentic and conversational, not like AI.
            
            You MUST ONLY respond with valid JSON containing no extra text, no markdown, and no explanations outside of the JSON.
            Use this exact JSON format and do not deviate from it:

            {
              "totalScore": 7,
              "breakdown": [
                {
                  "category": "Overall Style",
                  "score": 8,
                  "emoji": "👑",
                  "details": "brief explanation"
                },
                {
                  "category": "Color Coordination",
                  "score": 6,
                  "emoji": "🎨",
                  "details": "brief explanation"
                },
                {
                  "category": "Fit & Proportion",
                  "score": 7,
                  "emoji": "📏",
                  "details": "brief explanation"
                },
                {
                  "category": "Accessories",
                  "score": 5,
                  "emoji": "⭐",
                  "details": "brief explanation"
                },
                {
                  "category": "Trend Alignment",
                  "score": 7,
                  "emoji": "✨",
                  "details": "brief explanation"
                },
                {
                  "category": "Style Expression",
                  "score": 8,
                  "emoji": "🪄",
                  "details": "brief explanation"
                }
              ],
              "feedback": "overall feedback about the outfit"
            }`
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `Analyze this outfit and provide a detailed style assessment. IMPORTANT: Your ENTIRE response must be valid JSON without ANY additional text, markdown, or explanation outside the JSON structure. If you can't see or analyze the image clearly, use placeholder values but maintain valid JSON format.`
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
        temperature: 0.7,
        top_p: 0.7,
        top_k: 50,
        max_tokens: 2048,
        repetition_penalty: 1,
        stop: ["<|eot_id|>", "<|eom_id|>"]
      }),
    });

    const styleData = await styleAnalysisResponse.json();
    console.log('Style Analysis Response:', styleData);

    // Function to extract JSON from response text
    const extractJsonFromText = (text) => {
      console.log('Extracting JSON from text:', text);
      
      try {
        // First, try to parse the entire response as JSON
        return JSON.parse(text);
      } catch (e) {
        console.log('Full text is not valid JSON, attempting to extract JSON portion:', e);
        
        // Look for JSON-like structure in the text (between curly braces)
        const jsonRegex = /{[\s\S]*}/;
        const match = text.match(jsonRegex);
        
        if (match && match[0]) {
          try {
            return JSON.parse(match[0]);
          } catch (e2) {
            console.log('Extracted portion is not valid JSON:', e2);
          }
        }
        
        // If we can't find valid JSON, create a default structure
        return createDefaultAnalysisResult();
      }
    };

    // Create a default analysis result with placeholder values
    const createDefaultAnalysisResult = () => {
      return {
        totalScore: 6,
        breakdown: [
          {
            category: "Overall Style",
            score: 6,
            emoji: "👑",
            details: "The outfit has some good elements but could use more cohesion."
          },
          {
            category: "Color Coordination",
            score: 6,
            emoji: "🎨",
            details: "The colors work together reasonably well."
          },
          {
            category: "Fit & Proportion",
            score: 7,
            emoji: "📏",
            details: "The fit is generally good with a few areas for improvement."
          },
          {
            category: "Accessories",
            score: 5,
            emoji: "⭐",
            details: "Accessories are minimal or could be better coordinated."
          },
          {
            category: "Trend Alignment",
            score: 6,
            emoji: "✨",
            details: "Some elements align with current trends."
          },
          {
            category: "Style Expression",
            score: 6,
            emoji: "🪄",
            details: "The outfit shows some personal style but could be more distinctive."
          }
        ],
        feedback: "This outfit has potential but could benefit from more thoughtful styling and accessories."
      };
    };

    // Extract style analysis JSON
    let parsedStyleResponse;
    if (styleData.choices && styleData.choices[0]?.message?.content) {
      parsedStyleResponse = extractJsonFromText(styleData.choices[0].message.content);
    } else {
      console.log('Invalid style analysis response format');
      parsedStyleResponse = createDefaultAnalysisResult();
    }
    
    // Generate improvement tips based on the analysis
    const tipsResponse = await fetch('https://api.together.xyz/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${togetherApiKey}`
      },
      body: JSON.stringify({
        model: "meta-llama/Llama-3.2-11B-Vision-Instruct-Turbo",
        messages: [
          {
            role: 'system',
            content: `You are a high-end fashion stylist who provides specific, actionable style improvement tips.
            Based on the style analysis provided, generate 3 specific improvement tips for each category.
            Be authentic, direct, and conversational - use fashion lingo and slang naturally.
            
            You MUST ONLY respond with valid JSON containing no extra text, no markdown, and no explanations outside of the JSON.
            Use this exact JSON format and do not deviate from it:
            
            {
              "styleTips": [
                {
                  "category": "Overall Style",
                  "tips": ["tip 1", "tip 2", "tip 3"]
                },
                {
                  "category": "Color Coordination",
                  "tips": ["tip 1", "tip 2", "tip 3"]
                },
                {
                  "category": "Fit & Proportion",
                  "tips": ["tip 1", "tip 2", "tip 3"]
                },
                {
                  "category": "Accessories",
                  "tips": ["tip 1", "tip 2", "tip 3"]
                },
                {
                  "category": "Trend Alignment",
                  "tips": ["tip 1", "tip 2", "tip 3"]
                },
                {
                  "category": "Style Expression",
                  "tips": ["tip 1", "tip 2", "tip 3"]
                }
              ],
              "nextLevelTips": ["advanced tip 1", "advanced tip 2", "advanced tip 3", "advanced tip 4"]
            }`
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `Here's the style analysis of this outfit: ${JSON.stringify(parsedStyleResponse)}. 
                Generate specific improvement tips for each category based on this analysis and what you can see in the image. IMPORTANT: Your ENTIRE response must be valid JSON without ANY additional text, markdown, or explanation outside the JSON structure.`
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
        temperature: 0.7,
        top_p: 0.7,
        top_k: 50,
        max_tokens: 2048,
        repetition_penalty: 1,
        stop: ["<|eot_id|>", "<|eom_id|>"]
      }),
    });

    const tipsData = await tipsResponse.json();
    console.log('Tips Response:', tipsData);

    // Extract tips JSON
    let parsedTipsResponse;
    if (tipsData.choices && tipsData.choices[0]?.message?.content) {
      parsedTipsResponse = extractJsonFromText(tipsData.choices[0].message.content);
    } else {
      console.log('Invalid tips response format');
      parsedTipsResponse = {
        styleTips: parsedStyleResponse.breakdown.map(item => ({
          category: item.category,
          tips: [
            `Consider ways to improve your ${item.category.toLowerCase()}.`,
            `Look for inspiration to enhance your ${item.category.toLowerCase()}.`,
            `Work on developing your ${item.category.toLowerCase()}.`
          ]
        })),
        nextLevelTips: [
          "Consider consulting with a personal stylist for tailored advice.",
          "Invest in quality basics that will last longer and look better.",
          "Study current fashion trends to update your wardrobe strategically.",
          "Take photos of your outfits to review and refine your style choices."
        ]
      };
    }

    // Combine both results
    const result = {
      ...parsedStyleResponse,
      styleTips: parsedTipsResponse.styleTips || [],
      nextLevelTips: parsedTipsResponse.nextLevelTips || []
    };

    return new Response(JSON.stringify(result), { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  } catch (error) {
    console.error('Error in analyze-style function:', error);
    return new Response(JSON.stringify({ 
      error: error.message || 'An error occurred during style analysis'
    }), { 
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  }
});
