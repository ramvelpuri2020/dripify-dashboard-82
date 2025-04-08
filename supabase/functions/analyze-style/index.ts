
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
    
    // Improved prompt for more human-like, varied feedback with realistic scoring
    const stylePrompt = `You're a friendly, authentic fashion stylist who gives honest but encouraging feedback. Analyze this outfit and provide detailed feedback.

YOUR ANALYSIS MUST BE STRUCTURED IN THIS EXACT FORMAT:

**Overall Score:** [Give a score from 1-10 that accurately reflects the outfit quality; do NOT default to 7]

**Color Coordination:** [Score 1-10]
[3-4 sentences of specific, constructive feedback about color choices]

**Fit & Proportion:** [Score 1-10]
[3-4 sentences about how the clothes fit and proportion]

**Style Coherence:** [Score 1-10]
[3-4 sentences about overall style cohesion]

**Accessories:** [Score 1-10]
[3-4 sentences about accessory choices or suggestions]

**Outfit Creativity:** [Score 1-10]
[3-4 sentences about creative elements]

**Trend Awareness:** [Score 1-10]
[3-4 sentences about trend alignment]

**Summary:**
[5-6 sentences balancing constructive critique with genuine positives]

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
* [Advanced tip]
* [Advanced tip]
* [Advanced tip]
* [Advanced tip]

IMPORTANT SCORING GUIDELINES:
- Use the FULL range from 1-10 based on outfit quality
- Be varied and realistic in your scoring - DO NOT default to 7s
- Ensure the Overall Score matches the individual category scores
- Low scores (1-4) for significant issues, mid scores (5-7) for average looks, high scores (8-10) for excellent outfits
- Scores should be consistent with your text feedback
- Be honest but encouraging - point out positives even in lower-scored categories
- NEVER give a score that doesn't match your text evaluation

DO NOT explain the scoring system. Start directly with the analysis.`;

    console.log('Calling Nebius API with Qwen 2.5 for style analysis...');
    
    // Make request to Nebius API with optimized parameters for better performance
    const response = await fetch('https://api.studio.nebius.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${nebiusApiKey}`,
        'Content-Type': 'application/json',
        'Accept': '*/*'
      },
      body: JSON.stringify({
        model: "Qwen/Qwen2.5-VL-72B-Instruct", 
        temperature: 0.65, // Lower temperature for more consistent output
        top_p: 0.9,
        max_tokens: 1500, // Ensure we get a complete response
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
                text: "Analyze this outfit and provide detailed style feedback following the exact format specified. Use a range of scores (not defaulting to 7), and make sure your overall score is consistent with the category scores. Be honest but encouraging."
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

    // Extract the markdown content
    const markdownContent = data.choices[0].message.content;
    console.log('Analysis content sample:', markdownContent.substring(0, 100) + '...');
    
    // Return the raw markdown feedback
    return new Response(JSON.stringify({ feedback: markdownContent }), { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });

  } catch (error) {
    console.error('Error in analyze-style function:', error);
    
    return new Response(JSON.stringify({ 
      error: error.message,
      feedback: `# Style Analysis Error\n\nWe couldn't analyze your outfit at this time due to a technical issue. Please try again later.\n\n**Error:** ${error.message}`
    }), { 
      status: 200, // Return 200 even for errors to make client handling easier
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  }
});
