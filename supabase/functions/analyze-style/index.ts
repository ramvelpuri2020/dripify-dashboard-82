
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
    
    // Improved prompt for more consistent, faster responses with strict formatting
    const stylePrompt = `You're a fashion stylist analyzing outfits. Give honest, specific feedback with realistic scores.

YOUR RESPONSE MUST FOLLOW THIS EXACT FORMAT WITH NUMBERS FOR SCORES:

**Overall Score:** [number 1-10]

**Color Coordination:** [number 1-10]
[2-3 specific sentences about color choices]

**Fit & Proportion:** [number 1-10]
[2-3 specific sentences about fit and proportion]

**Style Coherence:** [number 1-10]
[2-3 specific sentences about style cohesion]

**Accessories:** [number 1-10]
[2-3 specific sentences about accessories]

**Outfit Creativity:** [number 1-10]
[2-3 specific sentences about creativity]

**Trend Awareness:** [number 1-10]
[2-3 specific sentences about trend alignment]

**Summary:**
[3-4 sentences with balanced critique and positives]

**Color Coordination Tips:**
* [Specific tip]
* [Specific tip]
* [Specific tip]

**Fit & Proportion Tips:**
* [Specific tip]
* [Specific tip]
* [Specific tip]

**Style Coherence Tips:**
* [Specific tip]
* [Specific tip]
* [Specific tip]

**Accessories Tips:**
* [Specific tip]
* [Specific tip]
* [Specific tip]

**Outfit Creativity Tips:**
* [Specific tip]
* [Specific tip]
* [Specific tip]

**Trend Awareness Tips:**
* [Specific tip]
* [Specific tip]
* [Specific tip]

**Next Level Tips:**
* [Advanced tip]
* [Advanced tip]
* [Advanced tip]
* [Advanced tip]

IMPORTANT:
- Score must be a NUMBER between 1-10 (not text, not a range)
- Use the full range from 1-10 based on actual outfit quality
- EVERY category must have a numerical score
- Be specific and actionable with feedback
- Start directly with "**Overall Score:**" - don't add any extra text

DO NOT add any extra headers or sections.`;

    console.log('Calling Nebius API with Qwen 2.5 for style analysis...');
    
    // Optimize API parameters for faster response
    const response = await fetch('https://api.studio.nebius.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${nebiusApiKey}`,
        'Content-Type': 'application/json',
        'Accept': '*/*'
      },
      body: JSON.stringify({
        model: "Qwen/Qwen2.5-VL-72B-Instruct",
        temperature: 0.5, // Lower temperature for more consistent formatting
        top_p: 0.8,
        max_tokens: 1000, // Reduced token count for faster response
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
                text: "Analyze this outfit precisely according to the format. Provide a numerical score (not text) for each category and make sure feedback is specific and actionable."
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
    
    // Verify the response has numerical scores before returning
    const overallScoreMatch = markdownContent.match(/\*\*Overall Score:\*\*\s*(\d+)/);
    if (!overallScoreMatch) {
      console.error('Response does not contain a valid Overall Score');
      throw new Error('Invalid response format: Missing numerical Overall Score');
    }
    
    console.log('Analysis content sample:', markdownContent.substring(0, 100) + '...');
    
    // Return the raw markdown feedback
    return new Response(JSON.stringify({ feedback: markdownContent }), { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });

  } catch (error) {
    console.error('Error in analyze-style function:', error);
    
    return new Response(JSON.stringify({ 
      error: error.message,
      feedback: `**Overall Score:** 5\n\n**Color Coordination:** 5\nWe could not fully analyze your outfit due to a technical issue. Please try again with a clearer image.\n\n**Fit & Proportion:** 5\nThe system encountered an error while processing the image details.\n\n**Style Coherence:** 5\nTry uploading a different picture with better lighting for more accurate results.\n\n**Accessories:** 5\nWe apologize for the inconvenience, but we couldn't properly analyze your accessories.\n\n**Outfit Creativity:** 5\nPlease retry with a different image for a proper creativity assessment.\n\n**Trend Awareness:** 5\nOur system had difficulty evaluating trend alignment based on the provided image.\n\n**Summary:**\nWe encountered a technical issue while analyzing your outfit. For best results, try uploading a clearly lit, full-body image. Error: ${error.message}`
    }), { 
      status: 200, // Return 200 with a fallback analysis
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  }
});
