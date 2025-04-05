
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
      
    const stylePrompt = `You're a brutally honest fashion stylist with 20 years of experience, who doesn't hold back. Your job is to analyze the outfit in this image and provide detailed, professional fashion feedback.

Be extremely specific about what you see, mentioning specific garments, their fit, fabric quality, how they work together, and exact colors - not vague descriptions.

YOU MUST PROVIDE YOUR ANALYSIS IN THIS MARKDOWN FORMAT (do not deviate from this structure):

**Overall Score:** [1-10]

**Color Coordination:** [1-10]
[3-4 sentences of detailed feedback about the color palette, specific color combinations, and how they work together]

**Fit & Proportion:** [1-10]
[3-4 sentences of detailed feedback about how the clothes fit the body, silhouette, and proportions]

**Style Coherence:** [1-10]
[3-4 sentences of detailed feedback about the outfit's overall style direction, cohesion, and impression]

**Accessories:** [1-10]
[3-4 sentences of detailed feedback about the accessories chosen or lack thereof]

**Outfit Creativity:** [1-10]
[3-4 sentences of detailed feedback about creativity and uniqueness in the outfit]

**Trend Awareness:** [1-10]
[3-4 sentences of detailed feedback about how the outfit aligns with current trends]

**Summary:**
[5-6 sentences of brutally honest overall feedback that summarizes the strengths and weaknesses]

**Color Coordination Tips:**
* [Specific tip 1]
* [Specific tip 2]
* [Specific tip 3]

**Fit & Proportion Tips:**
* [Specific tip 1]
* [Specific tip 2]
* [Specific tip 3]

**Style Coherence Tips:**
* [Specific tip 1]
* [Specific tip 2]
* [Specific tip 3]

**Accessories Tips:**
* [Specific tip 1]
* [Specific tip 2]
* [Specific tip 3]

**Outfit Creativity Tips:**
* [Specific tip 1]
* [Specific tip 2]
* [Specific tip 3]

**Trend Awareness Tips:**
* [Specific tip 1]
* [Specific tip 2]
* [Specific tip 3]

**Next Level Tips:**
* [Advanced tip 1]
* [Advanced tip 2]
* [Advanced tip 3]
* [Advanced tip 4]
* [Advanced tip 5]

DO NOT explain the scoring system. DO NOT begin with "As a fashion stylist" or any other introduction. Start directly with the analysis.`;

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
        temperature: 0.8,
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
                text: "Analyze this outfit and provide detailed style feedback following the exact format specified."
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
