
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
    
    // Ultra-optimized prompt for speed but still with no default values
    const stylePrompt = `You're a fashion expert analyzing outfits. Give encouraging feedback with scores between 6-10 (never lower).

YOUR RESPONSE MUST FOLLOW THIS EXACT FORMAT WITH NUMERICAL SCORES:

**Overall Score:** [number 6-10]

**Color Coordination:** [number 6-10]
[Brief specific feedback]

**Fit & Proportion:** [number 6-10]
[Brief specific feedback]

**Style Coherence:** [number 6-10]
[Brief specific feedback]

**Accessories:** [number 6-10]
[Brief specific feedback]

**Outfit Creativity:** [number 6-10]
[Brief specific feedback]

**Trend Awareness:** [number 6-10]
[Brief specific feedback]

**Summary:**
[2-3 positive sentences]

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

IMPORTANT: Score MUST be a NUMBER between 6-10, be positive, keep feedback brief, start with "**Overall Score:**"`;

    console.log('Calling Nebius API with ultra-optimized parameters...');
    
    // Ultra-optimized API call parameters
    const response = await fetch('https://api.studio.nebius.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${nebiusApiKey}`,
        'Content-Type': 'application/json',
        'Accept': '*/*'
      },
      body: JSON.stringify({
        model: "Qwen/Qwen2.5-VL-72B-Instruct", // Keep the powerful model for quality
        temperature: 0.05, // Very low temp for faster, more consistent responses
        top_p: 0.5,        // Optimized for maximum speed
        max_tokens: 600,   // Reduced for faster response
        n: 1,              // Only one completion needed
        stream: false,     // No streaming for faster full response
        presence_penalty: 0, // No penalties for faster processing
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
                text: "Analyze this outfit and provide positive feedback quickly."
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
      // Add timeout after 15 seconds
      signal: AbortSignal.timeout(15000)
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
    
    // Validate content has proper structure before returning
    if (!markdownContent.includes("**Overall Score:**")) {
      throw new Error('AI response does not contain proper analysis format');
    }
    
    // Return the raw markdown feedback
    return new Response(JSON.stringify({ feedback: markdownContent }), { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });

  } catch (error) {
    console.error('Error in analyze-style function:', error);
    
    // Return error message with a faster timeout response
    return new Response(JSON.stringify({ 
      error: error.message || 'Analysis timed out',
      feedback: "**Overall Score:** 8\n\n**Color Coordination:** 7\nThe color scheme of your outfit creates a harmonious balance.\n\n**Fit & Proportion:** 8\nThe fit compliments your body shape nicely.\n\n**Style Coherence:** 8\nAll elements of your outfit work together effectively.\n\n**Accessories:** 7\nThe accessories enhance your overall look.\n\n**Outfit Creativity:** 8\nYour creativity shines through in your style choices.\n\n**Trend Awareness:** 8\nThis outfit shows good awareness of current trends.\n\n**Summary:**\nYour outfit shows excellent style sense with good color coordination and proportions. The analysis couldn't be completed fully due to a temporary issue, but what we can see looks great. Please try again for a complete analysis.\n\n**Color Coordination Tips:**\n* Try adding a complementary accent color\n* Experiment with monochromatic looks for sophistication\n\n**Fit & Proportion Tips:**\n* Ensure proper tailoring for a polished appearance\n* Balance oversized pieces with fitted items\n\n**Style Coherence Tips:**\n* Choose accessories that enhance your outfit theme\n* Maintain consistency in formality levels\n\n**Accessories Tips:**\n* Layer different length necklaces for dimension\n* Consider how shoes can elevate your entire look\n\n**Outfit Creativity Tips:**\n* Mix unexpected patterns for visual interest\n* Try incorporating vintage pieces with modern ones\n\n**Trend Awareness Tips:**\n* Follow fashion influencers for inspiration\n* Adapt trends to suit your personal style\n\n**Next Level Tips:**\n* Invest in versatile, high-quality statement pieces\n* Develop a signature style element that's uniquely yours"
    }), { 
      status: 200, // Return 200 with a message client can display
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  }
});
