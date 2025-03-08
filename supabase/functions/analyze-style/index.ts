
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Simple rate limiting cache
const rateLimitCache = new Map();
const RATE_LIMIT_WINDOW = 3600000; // 1 hour in milliseconds
const MAX_REQUESTS_PER_WINDOW = 10; // Maximum 10 requests per hour

// Function to check rate limit
function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const userRequests = rateLimitCache.get(userId) || [];
  
  // Filter out requests older than the rate limit window
  const recentRequests = userRequests.filter(time => now - time < RATE_LIMIT_WINDOW);
  
  // Check if user has exceeded the rate limit
  if (recentRequests.length >= MAX_REQUESTS_PER_WINDOW) {
    return false;
  }
  
  // Add current request time and update cache
  recentRequests.push(now);
  rateLimitCache.set(userId, recentRequests);
  return true;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { image, style, userId } = await req.json();
    console.log('Analyzing style for: ', style);

    // Check rate limit if userId is provided
    if (userId) {
      if (!checkRateLimit(userId)) {
        return new Response(JSON.stringify({ 
          error: 'Rate limit exceeded. Please try again later.' 
        }), { 
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        });
      }
    }

    // Get RapidAPI key from environment variable
    const rapidApiKey = Deno.env.get('RAPIDAPI_KEY');
    if (!rapidApiKey) {
      throw new Error('RapidAPI key not configured');
    }

    // First analysis for overall style assessment
    const styleAnalysisResponse = await fetch('https://cheapest-gpt-4-turbo-gpt-4-vision-chatgpt-openai-ai-api.p.rapidapi.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-rapidapi-host': 'cheapest-gpt-4-turbo-gpt-4-vision-chatgpt-openai-ai-api.p.rapidapi.com',
        'x-rapidapi-key': rapidApiKey,
      },
      body: JSON.stringify({
        model: 'gpt-4o',
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
                text: `Analyze this outfit and provide a detailed style assessment.`
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
        temperature: 0.8,
        max_tokens: 1000
      }),
    });

    const styleData = await styleAnalysisResponse.json();
    console.log('Style Analysis Response:', styleData);

    if (!styleData.choices?.[0]?.message?.content) {
      throw new Error('Invalid response from RapidAPI');
    }

    // Parse the initial style analysis - clean up markdown code formatting if present
    let styleContent = styleData.choices[0].message.content;
    // Remove markdown code block formatting if present
    styleContent = styleContent.replace(/```json\n|\n```|```/g, '');
    
    const parsedStyleResponse = JSON.parse(styleContent);
    
    // Now generate custom improvement tips based on the analysis
    const tipsResponse = await fetch('https://cheapest-gpt-4-turbo-gpt-4-vision-chatgpt-openai-ai-api.p.rapidapi.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-rapidapi-host': 'cheapest-gpt-4-turbo-gpt-4-vision-chatgpt-openai-ai-api.p.rapidapi.com',
        'x-rapidapi-key': rapidApiKey,
      },
      body: JSON.stringify({
        model: 'gpt-4o',
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
                Generate specific improvement tips for each category based on this analysis and what you can see in the image.`
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
        temperature: 0.8,
        max_tokens: 1500
      }),
    });

    const tipsData = await tipsResponse.json();
    console.log('Tips Response:', tipsData);

    if (!tipsData.choices?.[0]?.message?.content) {
      throw new Error('Invalid tips response from RapidAPI');
    }

    // Parse the tips response - clean up markdown code formatting if present
    let tipsContent = tipsData.choices[0].message.content;
    // Remove markdown code block formatting if present
    tipsContent = tipsContent.replace(/```json\n|\n```|```/g, '');
    
    const parsedTipsResponse = JSON.parse(tipsContent);

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
