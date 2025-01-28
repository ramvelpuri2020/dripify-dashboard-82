import "https://deno.land/x/xhr@0.1.0/mod.ts";
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
    console.log('Analyzing style for occasion:', style);

    const openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `You are a professional fashion critic and stylist. Analyze outfits in detail, providing specific scores and actionable feedback. 
            Focus on these key areas:
            1. Color Coordination (how well colors work together)
            2. Fit & Proportion (how well the clothes fit and proportions work)
            3. Style Coherence (how well pieces work together)
            4. Style Expression (how well it expresses personal style)
            5. Outfit Creativity (uniqueness and creative combinations)
            
            For each category, provide a score between 0-100, avoiding generic scores like 70.
            Provide detailed explanations for each score.
            
            Structure your response with these sections:
            - SCORES (numerical ratings with explanations)
            - DETAILED_DESCRIPTION (thorough outfit analysis)
            - STRENGTHS (specific positive aspects)
            - IMPROVEMENTS (actionable suggestions)
            
            Be specific, detailed, and constructive in your feedback. Avoid generic responses.`
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `Please analyze this outfit for ${style} style occasion. Provide detailed feedback about the color combinations, fit, style coherence, and potential improvements. Be specific about what works and what could be enhanced. Include specific details about each element of the outfit.`
              },
              {
                type: "image_url",
                image_url: {
                  url: image
                }
              }
            ]
          }
        ],
        max_tokens: 1000,
      }),
    });

    const data = await openAIResponse.json();
    console.log('OpenAI Response:', data);

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in analyze-style function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});