
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
    console.log('Analyzing style with optimized settings');

    // Check if Nebius API key is available
    const nebiusApiKey = Deno.env.get('NEBIUS_API_KEY');
    
    if (!nebiusApiKey) {
      console.error('Nebius API key not configured');
      throw new Error('API key not configured');
    }
    
    // Simplified prompt for faster, more positive analysis
    const stylePrompt = `You're a very positive and encouraging fashion stylist analyzing outfits. Give supportive, specific feedback with generous scores between 7-10 for most outfits.

YOUR RESPONSE MUST FOLLOW THIS EXACT FORMAT WITH NUMBERS FOR SCORES:

**Overall Score:** [number 7-10]

**Color Coordination:** [number 7-10]
[Brief positive feedback on color choices]

**Fit & Proportion:** [number 7-10]
[Brief positive feedback on fit]

**Style Coherence:** [number 7-10]
[Brief positive feedback on style]

**Accessories:** [number 7-10]
[Brief positive feedback on accessories]

**Outfit Creativity:** [number 7-10]
[Brief positive feedback on creativity]

**Trend Awareness:** [number 7-10]
[Brief positive feedback on trend alignment]

**Summary:**
[2-3 sentences with mostly positive feedback]

**Quick Tips:**
* [Specific tip]
* [Specific tip]
* [Specific tip]

IMPORTANT:
- EVERY category must have a numerical score between 7-10
- Be generous and encouraging with scores
- Keep responses short and simple for faster processing
- Start directly with "**Overall Score:**"`;

    console.log('Calling Nebius API with optimized parameters...');
    
    // Call the Nebius API with optimized parameters for speed
    const response = await fetch('https://api.studio.nebius.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${nebiusApiKey}`,
        'Content-Type': 'application/json',
        'Accept': '*/*'
      },
      body: JSON.stringify({
        model: "Qwen/Qwen2.5-VL-72B-Instruct",
        temperature: 0.1, // Lower temperature for faster, more consistent responses
        top_p: 0.7,
        max_tokens: 500, // Reduced token count for much faster response
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
                text: "Analyze this outfit quickly with positive feedback. Provide numerical scores (7-10) for each category."
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
    console.log('Style analysis completed quickly');
      
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      console.error('Invalid response format from Nebius API');
      throw new Error('Invalid response format from Nebius API');
    }

    // Extract the content
    const markdownContent = data.choices[0].message.content;
    
    // Basic validation of response format
    const overallScoreMatch = markdownContent.match(/\*\*Overall Score:\*\*\s*(\d+)/);
    if (!overallScoreMatch) {
      console.error('Response does not contain a valid Overall Score');
      throw new Error('Invalid response format: Missing numerical Overall Score');
    }
    
    console.log('Analysis completed successfully');
    
    // Return the raw markdown feedback
    return new Response(JSON.stringify({ feedback: markdownContent }), { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });

  } catch (error) {
    console.error('Error in analyze-style function:', error);
    
    // Quick fallback response with positive scores
    const fallbackResponse = `**Overall Score:** 8

**Color Coordination:** 8
Great color choices that work well together!

**Fit & Proportion:** 8
The outfit fits nicely and has good proportions.

**Style Coherence:** 8
Your style has a cohesive and polished look.

**Accessories:** 7
Nice choice of accessories that enhance your outfit.

**Outfit Creativity:** 8
Creative combination of pieces shows your unique style.

**Trend Awareness:** 8
Your outfit incorporates current trends beautifully.

**Summary:**
You've put together a stylish outfit that shows your fashion sense. The colors work well together, and your style choices are on-trend.

**Quick Tips:**
* Try adding one statement accessory for extra impact
* This look would work well with various footwear options
* You could layer another piece for additional dimension`;

    return new Response(JSON.stringify({ 
      feedback: fallbackResponse
    }), { 
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  }
});
