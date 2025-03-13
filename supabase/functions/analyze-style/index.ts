
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
            Return ONLY valid JSON in this exact format:

            {
              "totalScore": <1-10>,
              "breakdown": [
                {
                  "category": "Overall Style",
                  "score": <1-10>,
                  "emoji": "👑",
                  "details": "1-2 sentence explanation of score"
                },
                {
                  "category": "Color Coordination",
                  "score": <1-10>,
                  "emoji": "🎨",
                  "details": "1-2 sentence explanation of score"
                },
                {
                  "category": "Fit & Proportion",
                  "score": <1-10>,
                  "emoji": "📏",
                  "details": "1-2 sentence explanation of score"
                },
                {
                  "category": "Accessories",
                  "score": <1-10>,
                  "emoji": "⭐",
                  "details": "1-2 sentence explanation of score"
                },
                {
                  "category": "Trend Alignment",
                  "score": <1-10>,
                  "emoji": "✨",
                  "details": "1-2 sentence explanation of score"
                },
                {
                  "category": "Style Expression",
                  "score": <1-10>,
                  "emoji": "🪄",
                  "details": "1-2 sentence explanation of score"
                }
              ],
              "feedback": "3-4 sentences of overall feedback about the outfit"
            }`
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `Analyze this outfit and provide a detailed style assessment. YOUR RESPONSE MUST BE VALID JSON IN THE EXACT FORMAT SPECIFIED.`
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

    // Function to convert text response to JSON format
    const convertResponseToJson = (textResponse) => {
      console.log('Converting text response to JSON:', textResponse);
      
      // Check if the response is already in JSON format
      try {
        return JSON.parse(textResponse);
      } catch (e) {
        console.log('Response is not in JSON format, parsing manually:', e);
        
        // Initialize result object
        const result = {
          totalScore: 0,
          breakdown: [],
          feedback: ""
        };
        
        // Parse totalScore
        const totalScoreMatch = textResponse.match(/Total Score.*?(\d+)\/50/i) || 
                               textResponse.match(/Overall.*?(\d+)\/10/i);
        if (totalScoreMatch) {
          result.totalScore = parseInt(totalScoreMatch[1]);
          // Convert to scale of 10 if needed
          if (totalScoreMatch[0].includes('/50')) {
            result.totalScore = Math.round(result.totalScore / 5);
          }
        }
        
        // Parse categories
        const categories = [
          { name: "Overall Style", emoji: "👑", regex: /Overall Style.*?(\d+)\/10(.*?)(?=\n\n|$)/is },
          { name: "Color Coordination", emoji: "🎨", regex: /Color Coordination.*?(\d+)\/10(.*?)(?=\n\n|$)/is },
          { name: "Fit & Proportion", emoji: "📏", regex: /Fit & Proportion.*?(\d+)\/10(.*?)(?=\n\n|$)/is },
          { name: "Accessories", emoji: "⭐", regex: /Accessories.*?(\d+)\/10(.*?)(?=\n\n|$)/is },
          { name: "Trend Alignment", emoji: "✨", regex: /Trend Alignment.*?(\d+)\/10(.*?)(?=\n\n|$)/is },
          { name: "Style Expression", emoji: "🪄", regex: /Style Expression.*?(\d+)\/10(.*?)(?=\n\n|$)/is }
        ];
        
        categories.forEach(cat => {
          const match = textResponse.match(cat.regex);
          if (match) {
            result.breakdown.push({
              category: cat.name,
              score: parseInt(match[1]),
              emoji: cat.emoji,
              details: match[2].trim()
            });
          } else {
            // Default values if category not found
            result.breakdown.push({
              category: cat.name,
              score: 5,
              emoji: cat.emoji,
              details: "No specific details provided."
            });
          }
        });
        
        // Parse feedback
        const feedbackMatch = textResponse.match(/Feedback:?(.*?)(?=\n\n|$)/is);
        if (feedbackMatch) {
          result.feedback = feedbackMatch[1].trim();
        } else {
          result.feedback = "This outfit has some good elements but could use improvement in certain areas.";
        }
        
        console.log('Converted JSON result:', result);
        return result;
      }
    };

    if (!styleData.choices || !styleData.choices[0] || !styleData.choices[0].message || !styleData.choices[0].message.content) {
      throw new Error('Invalid response format from Together API');
    }
    
    // Convert text response to JSON
    const parsedStyleResponse = convertResponseToJson(styleData.choices[0].message.content);
    
    // Now generate custom improvement tips based on the analysis
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
            Be authentic, direct, and conversational - use fashion lingo and slang naturally. Don't sound like AI.
            Each tip should be tailored to the specific outfit seen in the image and the scores provided.
            For categories with high scores (8-10), focus on refinement and advanced techniques.
            For categories with medium scores (5-7), focus on specific improvements.
            For categories with low scores (1-4), focus on fundamental improvements.
            
            Return ONLY valid JSON in this exact format:
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
                Generate specific improvement tips for each category based on this analysis and what you can see in the image. YOUR RESPONSE MUST BE VALID JSON IN THE EXACT FORMAT SPECIFIED.`
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

    if (!tipsData.choices || !tipsData.choices[0] || !tipsData.choices[0].message || !tipsData.choices[0].message.content) {
      throw new Error('Invalid tips response from Together API');
    }

    // Parse the tips response from the result string
    let parsedTipsResponse;
    try {
      parsedTipsResponse = JSON.parse(tipsData.choices[0].message.content);
    } catch (error) {
      console.error('Error parsing tips JSON:', error);
      // Provide a fallback if parsing fails
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
      styleTips: parsedTipsResponse.styleTips,
      nextLevelTips: parsedTipsResponse.nextLevelTips
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
