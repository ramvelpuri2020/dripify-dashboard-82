
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
    
    // Call Nebius Qwen 2.5 API for analysis
    console.log('Calling Nebius API with Qwen 2.5 for style analysis...');
      
    const stylePrompt = `You're a cool, authentic fashion stylist with 15 years of experience. You give honest but encouraging feedback. Your job is to analyze the outfit in this image and provide detailed, professional fashion feedback.

Be specific about what you see, mentioning garments, their fit, colors, and how they work together - be conversational and friendly.

YOU MUST PROVIDE YOUR ANALYSIS IN THIS MARKDOWN FORMAT (do not deviate from this structure):

**Overall Score:** [1-10] (be realistic and fair, use a range of scores, not just 7s)

**Color Coordination:** [1-10]
[3-4 sentences of detailed but encouraging feedback about the color palette and how it works or could be improved]

**Fit & Proportion:** [1-10]
[3-4 sentences of detailed but constructive feedback about how the clothes fit, with specific improvements]

**Style Coherence:** [1-10]
[3-4 sentences of detailed feedback about the outfit's overall style direction, being positive about what works]

**Accessories:** [1-10]
[3-4 sentences of detailed feedback about the accessories chosen or suggestions for what could work well]

**Outfit Creativity:** [1-10]
[3-4 sentences of detailed feedback about creativity, highlighting unique elements and suggesting enhancements]

**Trend Awareness:** [1-10]
[3-4 sentences of detailed feedback about how the outfit aligns with current trends, being constructive rather than critical]

**Summary:**
[5-6 sentences of overall feedback that balances constructive critique with genuine positives. Be honest but not harsh.]

**Color Coordination Tips:**
* [Specific actionable tip]
* [Specific actionable tip]
* [Specific actionable tip]

**Fit & Proportion Tips:**
* [Specific actionable tip]
* [Specific actionable tip]
* [Specific actionable tip]

**Style Coherence Tips:**
* [Specific actionable tip]
* [Specific actionable tip]
* [Specific actionable tip]

**Accessories Tips:**
* [Specific actionable tip]
* [Specific actionable tip]
* [Specific actionable tip]

**Outfit Creativity Tips:**
* [Specific actionable tip]
* [Specific actionable tip]
* [Specific actionable tip]

**Trend Awareness Tips:**
* [Specific actionable tip]
* [Specific actionable tip]
* [Specific actionable tip]

**Next Level Tips:**
* [Advanced tip that's exciting and aspirational]
* [Advanced tip that's exciting and aspirational]
* [Advanced tip that's exciting and aspirational]
* [Advanced tip that's exciting and aspirational]

DO NOT explain the scoring system. DO NOT begin with "As a fashion stylist" or any other introduction. Start directly with the analysis.

IMPORTANT: Be varied in your scoring - don't just give everything a 7/10. Use the full range from 1-10 based on the actual outfit quality. Be realistic but encouraging!`;

    // Make request to Nebius API
    const response = await fetch('https://api.studio.nebius.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${nebiusApiKey}`,
        'Content-Type': 'application/json',
        'Accept': '*/*'
      },
      body: JSON.stringify({
        model: "Qwen/Qwen2.5-VL-72B-Instruct", 
        temperature: 0.85, // Slightly higher temperature for more variation
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
                text: "Analyze this outfit and provide detailed style feedback following the exact format specified. Remember to be encouraging and honest, use a range of scores - not just 7s. The person is looking for genuine but constructive feedback."
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
    console.log('Style analysis raw response:', data);
      
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      console.error('Invalid response format from Nebius API');
      throw new Error('Invalid response format from Nebius API');
    }

    // Extract the markdown content - no longer trying to parse as JSON
    const markdownContent = data.choices[0].message.content;
    console.log('Analysis content (first 300 chars):', markdownContent.substring(0, 300) + '...');
    
    // Simply return the raw markdown feedback
    return new Response(JSON.stringify({ feedback: markdownContent }), { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });

  } catch (error) {
    console.error('Error in analyze-style function:', error);
    
    // Return a fallback response with error details
    return new Response(JSON.stringify({ 
      error: error.message,
      feedback: `# Style Analysis\n\nWe couldn't analyze your outfit at this time due to a technical issue. Please try again later.\n\n**Error:** ${error.message}`
    }), { 
      status: 200, // Return 200 even for errors to make client handling easier
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  }
});
