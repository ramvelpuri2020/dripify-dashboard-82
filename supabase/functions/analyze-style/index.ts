
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

    // Check if Nebius API key is available
    const nebiusApiKey = Deno.env.get('NEBIUS_API_KEY');
    
    if (!nebiusApiKey) {
      console.error('Nebius API key not configured');
      throw new Error('API key not configured');
    }
    
    // Optimized prompt for speed and positive feedback
    const stylePrompt = `You're a friendly fashion stylist analyzing outfits. Give positive, encouraging feedback with realistic scores between 6-10 (don't use lower scores).

YOUR RESPONSE MUST FOLLOW THIS EXACT FORMAT WITH NUMBERS FOR SCORES:

**Overall Score:** [number 6-10]

**Color Coordination:** [number 6-10]
[Brief specific feedback about color choices]

**Fit & Proportion:** [number 6-10]
[Brief specific feedback about fit and proportion]

**Style Coherence:** [number 6-10]
[Brief specific feedback about style cohesion]

**Accessories:** [number 6-10]
[Brief specific feedback about accessories]

**Outfit Creativity:** [number 6-10]
[Brief specific feedback about creativity]

**Trend Awareness:** [number 6-10]
[Brief specific feedback about trend alignment]

**Summary:**
[2-3 sentences with positive feedback]

**Color Coordination Tips:**
* [Quick tip]
* [Quick tip]

**Fit & Proportion Tips:**
* [Quick tip]
* [Quick tip]

**Style Coherence Tips:**
* [Quick tip]
* [Quick tip]

**Accessories Tips:**
* [Quick tip]
* [Quick tip]

**Outfit Creativity Tips:**
* [Quick tip]
* [Quick tip]

**Trend Awareness Tips:**
* [Quick tip]
* [Quick tip]

**Next Level Tips:**
* [Advanced tip]
* [Advanced tip]

IMPORTANT:
- Score MUST be a NUMBER between 6-10 (not text)
- Be encouraging and positive
- Keep feedback brief and direct
- Start directly with "**Overall Score:**"`;

    console.log('Calling Nebius API with optimized parameters...');
    
    // Call the Nebius API with highly optimized parameters for speed
    const response = await fetch('https://api.studio.nebius.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${nebiusApiKey}`,
        'Content-Type': 'application/json',
        'Accept': '*/*'
      },
      body: JSON.stringify({
        model: "Qwen/Qwen2.5-VL-72B-Instruct",
        temperature: 0.1, // Reduced for faster, more consistent results
        top_p: 0.7,        // Optimized for speed
        max_tokens: 800,   // Reduced for faster response
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
                text: "Analyze this outfit and provide positive feedback."
              },
              {
                type: 'image_url',
                image_url: {
                  url: image
                }
              }
            ]
          }
        ]
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Nebius API error:', errorText);
      throw new Error(`Nebius API error: ${errorText}`);
    }

    const data = await response.json();
    console.log('Style analysis completed');
      
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      console.error('Invalid response format from Nebius API');
      throw new Error('Invalid response format from Nebius API');
    }

    // Extract the content
    const markdownContent = data.choices[0].message.content;
    
    // Return the raw markdown feedback
    return new Response(JSON.stringify({ feedback: markdownContent }), { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });

  } catch (error) {
    console.error('Error in analyze-style function:', error);
    
    // Return error message in a format the client can handle
    return new Response(JSON.stringify({ 
      error: error.message,
      feedback: "**Overall Score:** 8\n\n**Color Coordination:** 7\nPlease try again with a clearer image for better results.\n\n**Fit & Proportion:** 8\nThe system encountered a temporary issue processing your image.\n\n**Style Coherence:** 8\nTry uploading a different picture for more accurate results.\n\n**Accessories:** 7\nTry again in a moment for a complete analysis.\n\n**Outfit Creativity:** 8\nYour style shows potential. Please retry for detailed feedback.\n\n**Trend Awareness:** 8\nLoading trend analysis...\n\n**Summary:**\nWe encountered a temporary issue analyzing your outfit. For best results, try uploading again with good lighting. Error: " + error.message
    }), { 
      status: 200, // Return 200 with a message client can display
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  }
});
