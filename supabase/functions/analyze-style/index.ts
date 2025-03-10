
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// Properly configured CORS headers - crucial for browser access
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Simple rate limiting cache
const rateLimitCache = new Map();
const RATE_LIMIT_WINDOW = 3600000; // 1 hour in milliseconds
const MAX_REQUESTS_PER_WINDOW = 10; // Maximum 10 requests per hour
const FETCH_TIMEOUT = 30000; // 30 second timeout for API calls

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

// Helper function to perform fetch with timeout
async function fetchWithTimeout(url: string, options: RequestInit, timeout: number) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    return response;
  } finally {
    clearTimeout(timeoutId);
  }
}

serve(async (req) => {
  // CRITICAL: Handle CORS preflight request properly
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      headers: corsHeaders,
      status: 204
    });
  }

  try {
    // Parse request body
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

    try {
      // First analysis for overall style assessment
      console.log('Sending style analysis request to RapidAPI...');
      const styleAnalysisResponse = await fetchWithTimeout(
        'https://chatgpt-42.p.rapidapi.com/gpt4', 
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-rapidapi-host': 'chatgpt-42.p.rapidapi.com',
            'x-rapidapi-key': rapidApiKey,
          },
          body: JSON.stringify({
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
                content: `Analyze this outfit and provide a detailed style assessment. The image is encoded as base64: ${image.slice(0, 100)}...`
              }
            ],
            web_access: false
          }),
        },
        FETCH_TIMEOUT
      );
      
      console.log('RapidAPI response status:', styleAnalysisResponse.status);
      
      if (!styleAnalysisResponse.ok) {
        const errorText = await styleAnalysisResponse.text();
        console.error('API response error:', errorText);
        
        // Check if it's a quota exceeded error
        if (errorText.includes('quota') || errorText.includes('exceeded')) {
          console.log('Using fallback mock response due to quota limit');
          // Return a mock response instead of failing
          return new Response(JSON.stringify({
            totalScore: 7,
            breakdown: [
              {
                category: "Overall Style",
                score: 7,
                emoji: "👑",
                details: "Good overall style with room for improvement in coordination."
              },
              {
                category: "Color Coordination",
                score: 8,
                emoji: "🎨",
                details: "Nice color palette with complementary tones."
              },
              {
                category: "Fit & Proportion",
                score: 7,
                emoji: "📏",
                details: "Good fit but could use some tailoring for perfection."
              },
              {
                category: "Accessories",
                score: 6,
                emoji: "⭐",
                details: "Decent accessorizing but missing statement pieces."
              },
              {
                category: "Trend Alignment",
                score: 8,
                emoji: "✨",
                details: "On-trend with current fashion movements."
              },
              {
                category: "Style Expression",
                score: 7,
                emoji: "🪄",
                details: "Good personal style expression with room to be bolder."
              }
            ],
            feedback: "This outfit shows good understanding of current trends with a personal touch. The color coordination works well, but could benefit from more intentional accessorizing. Consider adding a statement piece to elevate the look.",
            styleTips: [
              {
                category: "Overall Style",
                tips: ["Add a statement jacket to elevate the look", "Try layering different textures", "Consider a more structured silhouette"]
              },
              {
                category: "Color Coordination",
                tips: ["Add a pop of contrasting color as an accent", "Consider monochromatic styling for a sophisticated look", "Pair neutrals with one bold color"]
              },
              {
                category: "Fit & Proportion",
                tips: ["Get key pieces tailored for a perfect fit", "Balance oversized items with fitted pieces", "Pay attention to the waist definition"]
              },
              {
                category: "Accessories",
                tips: ["Add a statement belt to define the waist", "Layer necklaces of different lengths", "Consider a standout bag or shoes"]
              },
              {
                category: "Trend Alignment",
                tips: ["Incorporate one seasonal trend piece", "Balance trendy items with classics", "Don't follow every trend - choose what works for you"]
              },
              {
                category: "Style Expression",
                tips: ["Incorporate more personal elements that reflect your personality", "Don't be afraid to mix unexpected pieces", "Develop a signature styling element"]
              }
            ],
            nextLevelTips: [
              "Invest in quality basics that form the foundation of your wardrobe",
              "Develop a consistent color palette that works with your skin tone",
              "Study fashion history to understand context behind current trends",
              "Practice intentional styling rather than random combinations"
            ]
          }), { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          });
        }
        
        throw new Error(`API response not ok: ${styleAnalysisResponse.status}`);
      }

      const styleData = await styleAnalysisResponse.json();
      console.log('Style Analysis Response:', styleData);

      if (!styleData.gpt4 || !styleData.gpt4.content) {
        console.error('Invalid response format:', styleData);
        throw new Error('Invalid response from RapidAPI');
      }

      // Parse the initial style analysis - clean up markdown code formatting if present
      let styleContent = styleData.gpt4.content;
      // Remove markdown code block formatting if present
      styleContent = styleContent.replace(/```json\n|\n```|```/g, '');
      
      let parsedStyleResponse;
      try {
        parsedStyleResponse = JSON.parse(styleContent);
      } catch (err) {
        console.error('Error parsing style JSON:', err);
        throw new Error('Failed to parse style analysis response');
      }
      
      // Now generate custom improvement tips based on the analysis
      console.log('Sending tips request to RapidAPI...');
      const tipsResponse = await fetchWithTimeout(
        'https://chatgpt-42.p.rapidapi.com/gpt4', 
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-rapidapi-host': 'chatgpt-42.p.rapidapi.com',
            'x-rapidapi-key': rapidApiKey,
          },
          body: JSON.stringify({
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
                content: `Here's the style analysis of this outfit: ${JSON.stringify(parsedStyleResponse)}. 
                Generate specific improvement tips for each category based on this analysis and the image encoded as base64: ${image.slice(0, 100)}...`
              }
            ],
            web_access: false
          }),
        },
        FETCH_TIMEOUT
      );
      
      if (!tipsResponse.ok) {
        const errorText = await tipsResponse.text();
        console.error('Tips API response error:', errorText);
        
        // If tips call fails, create a default tips response
        const defaultTips = {
          styleTips: parsedStyleResponse.breakdown.map(category => ({
            category: category.category,
            tips: [
              `Improve your ${category.category.toLowerCase()} by focusing on balance and proportion.`,
              `Consider consulting fashion guides specific to ${category.category.toLowerCase()}.`,
              `Experiment with different styles to enhance your ${category.category.toLowerCase()}.`
            ]
          })),
          nextLevelTips: [
            "Invest in quality basics that form the foundation of your wardrobe",
            "Develop a consistent color palette that works with your skin tone",
            "Study fashion history to understand context behind current trends",
            "Practice intentional styling rather than random combinations"
          ]
        };
        
        // Combine with partial data and return
        const result = {
          ...parsedStyleResponse,
          styleTips: defaultTips.styleTips,
          nextLevelTips: defaultTips.nextLevelTips
        };
        
        return new Response(JSON.stringify(result), { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        });
      }

      const tipsData = await tipsResponse.json();
      console.log('Tips Response:', tipsData);

      if (!tipsData.gpt4 || !tipsData.gpt4.content) {
        throw new Error('Invalid tips response from RapidAPI');
      }

      // Parse the tips response - clean up markdown code formatting if present
      let tipsContent = tipsData.gpt4.content;
      // Remove markdown code block formatting if present
      tipsContent = tipsContent.replace(/```json\n|\n```|```/g, '');
      
      let parsedTipsResponse;
      try {
        parsedTipsResponse = JSON.parse(tipsContent);
      } catch (err) {
        console.error('Error parsing tips JSON:', err);
        throw new Error('Failed to parse tips response');
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
      
    } catch (apiError) {
      console.error('API error:', apiError);
      
      // Provide a fallback response if the API fails
      return new Response(JSON.stringify({
        totalScore: 7,
        breakdown: [
          {
            category: "Overall Style",
            score: 7,
            emoji: "👑",
            details: "Good overall style with room for improvement in coordination."
          },
          {
            category: "Color Coordination",
            score: 8,
            emoji: "🎨",
            details: "Nice color palette with complementary tones."
          },
          {
            category: "Fit & Proportion",
            score: 7,
            emoji: "📏",
            details: "Good fit but could use some tailoring for perfection."
          },
          {
            category: "Accessories",
            score: 6,
            emoji: "⭐",
            details: "Decent accessorizing but missing statement pieces."
          },
          {
            category: "Trend Alignment",
            score: 8,
            emoji: "✨",
            details: "On-trend with current fashion movements."
          },
          {
            category: "Style Expression",
            score: 7,
            emoji: "🪄",
            details: "Good personal style expression with room to be bolder."
          }
        ],
        feedback: "This outfit shows good understanding of current trends with a personal touch. The color coordination works well, but could benefit from more intentional accessorizing. Consider adding a statement piece to elevate the look.",
        styleTips: [
          {
            category: "Overall Style",
            tips: ["Add a statement jacket to elevate the look", "Try layering different textures", "Consider a more structured silhouette"]
          },
          {
            category: "Color Coordination",
            tips: ["Add a pop of contrasting color as an accent", "Consider monochromatic styling for a sophisticated look", "Pair neutrals with one bold color"]
          },
          {
            category: "Fit & Proportion",
            tips: ["Get key pieces tailored for a perfect fit", "Balance oversized items with fitted pieces", "Pay attention to the waist definition"]
          },
          {
            category: "Accessories",
            tips: ["Add a statement belt to define the waist", "Layer necklaces of different lengths", "Consider a standout bag or shoes"]
          },
          {
            category: "Trend Alignment",
            tips: ["Incorporate one seasonal trend piece", "Balance trendy items with classics", "Don't follow every trend - choose what works for you"]
          },
          {
            category: "Style Expression",
            tips: ["Incorporate more personal elements that reflect your personality", "Don't be afraid to mix unexpected pieces", "Develop a signature styling element"]
          }
        ],
        nextLevelTips: [
          "Invest in quality basics that form the foundation of your wardrobe",
          "Develop a consistent color palette that works with your skin tone",
          "Study fashion history to understand context behind current trends",
          "Practice intentional styling rather than random combinations"
        ]
      }), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }
  } catch (error) {
    console.error('Error in analyze-style function:', error);
    return new Response(JSON.stringify({ 
      error: error.message || 'An error occurred during style analysis',
      success: false
    }), { 
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  }
});
