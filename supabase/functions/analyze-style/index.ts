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
            content: `You are a professional fashion critic and stylist. Analyze outfits in detail, providing specific scores and natural, conversational feedback.
            First, describe what you see in the image in a clear, concise way.
            Then analyze these key areas:
            1. Color Coordination (how well colors work together)
            2. Fit & Proportion (how well the clothes fit)
            3. Style Coherence (how well pieces work together)
            4. Accessories (use of accessories and details)
            5. Outfit Creativity (uniqueness and creative combinations)
            
            For each category, provide a score between 0-100 based on your analysis.
            
            Structure your response exactly like this:
            IMAGE_DESCRIPTION:
            [brief description of what you see in the image]

            ANALYSIS:
            [natural, conversational analysis of the outfit explaining the scoring]

            SCORES:
            Color Coordination: [score]
            Fit & Proportion: [score]
            Style Coherence: [score]
            Accessories: [score]
            Outfit Creativity: [score]`
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `Please analyze this outfit for ${style} style occasion. First describe what you see, then provide detailed feedback about the style elements and scoring.`
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

    if (!data.choices?.[0]?.message?.content) {
      throw new Error('Invalid response from OpenAI');
    }

    const analysis = data.choices[0].message.content;
    
    // Extract sections
    const imageDescription = extractSection(analysis, "IMAGE_DESCRIPTION") || "No description available.";
    const analysisText = extractSection(analysis, "ANALYSIS") || "No analysis available.";
    
    // Parse scores
    const scores = {
      colorCoordination: extractScore(analysis, "Color Coordination"),
      fitProportion: extractScore(analysis, "Fit & Proportion"),
      styleCoherence: extractScore(analysis, "Style Coherence"),
      accessories: extractScore(analysis, "Accessories"),
      outfitCreativity: extractScore(analysis, "Outfit Creativity")
    };

    // Validate scores
    if (Object.values(scores).some(score => !score)) {
      console.error('Invalid scores detected:', scores);
      throw new Error('Failed to extract valid scores from the analysis');
    }

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
        { category: "Accessories", score: scores.accessories, emoji: "💍" },
        { category: "Outfit Creativity", score: scores.outfitCreativity, emoji: "🌟" }
      ],
      feedback: `${imageDescription}\n\n${analysisText}`
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
  return match ? parseInt(match[1]) : 0;
}

function extractSection(analysis: string, section: string): string {
  const regex = new RegExp(`${section}:\\s*(.+?)(?=\\n\\n|$)`, 's');
  const match = analysis.match(regex);
  return match ? match[1].trim() : '';
}