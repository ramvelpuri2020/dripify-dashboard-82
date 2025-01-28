import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

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

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are a professional fashion critic and stylist. Analyze outfits in detail, providing specific scores and actionable feedback. 
            Focus on these key areas:
            1. Color Coordination (how well colors work together)
            2. Fit & Proportion (how well the clothes fit and proportions work)
            3. Style Coherence (how well pieces work together)
            4. Style Expression (how well it expresses personal style)
            5. Outfit Creativity (uniqueness and creative combinations)
            
            For each category, provide a score between 0-100.
            Structure your response in this exact format:
            SCORES:
            Color Coordination: [score]
            Fit & Proportion: [score]
            Style Coherence: [score]
            Style Expression: [score]
            Outfit Creativity: [score]

            DETAILED_DESCRIPTION:
            [detailed outfit analysis]

            STRENGTHS:
            [specific positive aspects]

            IMPROVEMENTS:
            [actionable suggestions]`
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `Please analyze this outfit for ${style} style occasion. Provide detailed feedback about the color combinations, fit, style coherence, and potential improvements.`
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
        max_tokens: 1000,
      }),
    });

    const data = await response.json();
    console.log('OpenAI Response:', data);

    if (data.error) {
      throw new Error(data.error.message);
    }

    const analysis = data.choices[0].message.content;
    
    // Parse scores from the analysis
    const scores = {
      colorCoordination: extractScore(analysis, "Color Coordination"),
      fitProportion: extractScore(analysis, "Fit & Proportion"),
      styleCoherence: extractScore(analysis, "Style Coherence"),
      styleExpression: extractScore(analysis, "Style Expression"),
      outfitCreativity: extractScore(analysis, "Outfit Creativity")
    };

    // Extract sections
    const detailedDescription = extractSection(analysis, "DETAILED_DESCRIPTION");
    const strengths = extractSection(analysis, "STRENGTHS");
    const improvements = extractSection(analysis, "IMPROVEMENTS");

    // Calculate total score
    const totalScore = Math.round(
      Object.values(scores).reduce((acc, curr) => acc + curr, 0) / 5
    );

    const result = {
      totalScore,
      breakdown: [
        { category: "Color Coordination", score: scores.colorCoordination, emoji: "🎨" },
        { category: "Fit & Proportion", score: scores.fitProportion, emoji: "📏" },
        { category: "Style Coherence", score: scores.styleCoherence, emoji: "✨" },
        { category: "Style Expression", score: scores.styleExpression, emoji: "🎯" },
        { category: "Outfit Creativity", score: scores.outfitCreativity, emoji: "🌟" }
      ],
      feedback: `${detailedDescription}\n\nStrengths:\n${strengths}\n\nSuggested Improvements:\n${improvements}`
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
  return match ? parseInt(match[1]) : 70;
}

function extractSection(analysis: string, section: string): string {
  const regex = new RegExp(`${section}:\\s*(.+?)(?=\\n\\n|$)`, 's');
  const match = analysis.match(regex);
  return match ? match[1].trim() : '';
}