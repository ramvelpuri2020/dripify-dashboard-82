import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { image, style } = await req.json();
    console.log('Analyzing style for occasion:', style);

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: `You are a fashion expert. Analyze the outfit image and provide:
            1. A brief, focused description (2-3 sentences max)
            2. A clear explanation of the style score (1-2 sentences)
            3. Specific scores for key categories
            
            Keep all feedback concise and direct. Focus on the most important aspects.
            
            Format your response exactly like this:
            BRIEF_DESCRIPTION: [2-3 sentences describing what you see]
            SCORE_EXPLANATION: [1-2 sentences explaining the overall score]
            
            SCORES:
            Color Coordination: [score]
            Fit & Proportion: [score]
            Style Coherence: [score]
            Outfit Creativity: [score]`
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `Analyze this outfit and provide a concise, focused feedback.`
              },
              {
                type: 'image_url',
                image_url: {
                  url: image
                }
              }
            ]
          }
        ],
        max_tokens: 500,
      }),
    });

    const data = await response.json();
    console.log('OpenAI Response:', data);

    if (!data.choices?.[0]?.message?.content) {
      throw new Error('Invalid response from OpenAI');
    }

    const analysis = data.choices[0].message.content;
    
    // Extract sections
    const briefDescription = analysis.match(/BRIEF_DESCRIPTION:\s*(.*?)(?=\n|$)/s)?.[1]?.trim() || "No description available.";
    const scoreExplanation = analysis.match(/SCORE_EXPLANATION:\s*(.*?)(?=\n|$)/s)?.[1]?.trim() || "No explanation available.";
    
    // Parse scores
    const scores = {
      colorCoordination: extractScore(analysis, "Color Coordination"),
      fitProportion: extractScore(analysis, "Fit & Proportion"),
      styleCoherence: extractScore(analysis, "Style Coherence"),
      outfitCreativity: extractScore(analysis, "Outfit Creativity")
    };

    // Calculate total score
    const totalScore = Math.round(
      Object.values(scores).reduce((acc, curr) => acc + curr, 0) / 4
    );

    const result = {
      totalScore,
      breakdown: [
        { category: "Color Coordination", score: scores.colorCoordination, emoji: "🎨" },
        { category: "Fit & Proportion", score: scores.fitProportion, emoji: "📏" },
        { category: "Style Coherence", score: scores.styleCoherence, emoji: "✨" },
        { category: "Outfit Creativity", score: scores.outfitCreativity, emoji: "🎯" }
      ],
      feedback: `${briefDescription}\n\n${scoreExplanation}`
    };

    return new Response(JSON.stringify(result), {
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

function extractScore(analysis: string, category: string): number {
  const regex = new RegExp(`${category}:?\\s*(\\d+)`, 'i');
  const match = analysis.match(regex);
  return match ? parseInt(match[1]) : 70; // Default score if not found
}