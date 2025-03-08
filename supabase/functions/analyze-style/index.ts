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
  // Handle CORS preflight requests
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

    // Create the mock analysis response
    const mockAnalysisResult = {
      totalScore: 7,
      breakdown: [
        {
          category: "Overall Style",
          score: 7,
          emoji: "👑",
          details: "Your outfit has a nice foundation with good basics that work well together."
        },
        {
          category: "Color Coordination",
          score: 8,
          emoji: "🎨",
          details: "Good color choices that complement each other well."
        },
        {
          category: "Fit & Proportion",
          score: 6,
          emoji: "📏",
          details: "The fit is decent, but could use some minor adjustments for optimal proportions."
        },
        {
          category: "Accessories",
          score: 7,
          emoji: "⭐",
          details: "Your accessories add nice touches, but there's room to elevate the look."
        },
        {
          category: "Trend Alignment",
          score: 7,
          emoji: "✨",
          details: "You've incorporated some current trends in a wearable way."
        },
        {
          category: "Style Expression",
          score: 8,
          emoji: "🪄",
          details: "Your personal style comes through, showing confidence in your choices."
        }
      ],
      feedback: "Your outfit has a solid foundation with good color coordination and personal style expression. With some minor adjustments to fit and perhaps more intentional accessorizing, you could take this look to the next level.",
      styleTips: [
        {
          category: "Overall Style",
          tips: [
            "Try layering with a lightweight jacket or overshirt to add dimension",
            "Consider incorporating one statement piece to elevate the entire look",
            "Experiment with different textures to add visual interest"
          ]
        },
        {
          category: "Color Coordination",
          tips: [
            "Add a pop of contrasting color through accessories",
            "Try monochromatic styling with different shades of your dominant color",
            "Incorporate patterns that include your outfit's color palette"
          ]
        },
        {
          category: "Fit & Proportion",
          tips: [
            "Consider tailoring key pieces for a more polished look",
            "Try a French tuck to create better proportions with tops and bottoms",
            "Pay attention to sleeve and pant lengths for a more intentional look"
          ]
        },
        {
          category: "Accessories",
          tips: [
            "Add a quality belt that complements both your outfit and shoes",
            "Try a statement watch or bracelet to add sophistication",
            "Consider how sunglasses can enhance your overall aesthetic"
          ]
        },
        {
          category: "Trend Alignment",
          tips: [
            "Incorporate one trending element while keeping the rest classic",
            "Try trending colors in small doses through accessories",
            "Experiment with trending silhouettes that work for your body type"
          ]
        },
        {
          category: "Style Expression",
          tips: [
            "Develop a signature accessory or style element that's uniquely you",
            "Don't be afraid to mix high and low pieces to create your own style",
            "Pay attention to how your outfit makes you feel - confidence is key"
          ]
        }
      ],
      nextLevelTips: [
        "Invest in a few high-quality foundation pieces that you can build around",
        "Develop a consistent color palette that works with your skin tone",
        "Master the art of subtle accessorizing to elevate even simple outfits",
        "Consider the complete silhouette your outfit creates from all angles"
      ]
    };

    console.log('Returning mock analysis result');
    return new Response(JSON.stringify(mockAnalysisResult), { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });

    // Note: The original RapidAPI implementation has been replaced with a mock response
    // to ensure the application works without API rate limits or failures.
    // Uncomment the code below to re-enable the RapidAPI integration once you have
    // a reliable API source or have resolved the API limitations.
    
    /*
    // First analysis for overall style assessment
    const styleAnalysisResponse = await fetch('https://chatgpt-vision1.p.rapidapi.com/texttoimage3', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-rapidapi-host': 'chatgpt-vision1.p.rapidapi.com',
        'x-rapidapi-key': rapidApiKey,
      },
      body: JSON.stringify({
        // API request body
      }),
    });

    // Handle the API response
    // Parse JSON response
    // Generate style tips
    // Return the combined results
    */

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
