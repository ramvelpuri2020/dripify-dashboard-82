
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

    if (!image) {
      throw new Error('No image provided');
    }

    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    console.log('Calling OpenAI API...');
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
            4. Three specific, actionable style tips
            
            Keep all feedback concise and direct. Focus on the most important aspects.
            
            Format your response exactly like this:
            BRIEF_DESCRIPTION: [2-3 sentences describing what you see]
            SCORE_EXPLANATION: [1-2 sentences explaining the overall score]
            
            SCORES:
            Color Coordination: [score]
            Fit & Proportion: [score]
            Style Coherence: [score]
            Outfit Creativity: [score]
            
            STYLE_TIPS:
            1. [First tip with category and priority]
            2. [Second tip with category and priority]
            3. [Third tip with category and priority]`
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `Analyze this outfit and provide concise, focused feedback.`
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

    console.log('OpenAI response status:', response.status);
    const data = await response.json();
    console.log('OpenAI raw response:', JSON.stringify(data));

    if (!data.choices?.[0]?.message?.content) {
      console.error('Invalid OpenAI response:', data);
      throw new Error('Invalid response format from OpenAI');
    }

    const analysis = data.choices[0].message.content;
    
    // Extract sections
    const briefDescription = analysis.match(/BRIEF_DESCRIPTION:\s*(.*?)(?=\n|$)/s)?.[1]?.trim() || "No description available.";
    const scoreExplanation = analysis.match(/SCORE_EXPLANATION:\s*(.*?)(?=\n|$)/s)?.[1]?.trim() || "No explanation available.";
    
    // Parse scores with better error handling
    const scores = {
      colorCoordination: extractScore(analysis, "Color Coordination"),
      fitProportion: extractScore(analysis, "Fit & Proportion"),
      styleCoherence: extractScore(analysis, "Style Coherence"),
      outfitCreativity: extractScore(analysis, "Outfit Creativity")
    };

    // Extract style tips with validation
    const styleTips = [];
    const tipsSection = analysis.match(/STYLE_TIPS:\n([\s\S]*?)(?=\n\n|$)/)?.[1];
    if (tipsSection) {
      const tips = tipsSection.split('\n').filter(tip => tip.trim());
      for (const tip of tips) {
        const cleanTip = tip.replace(/^\d+\.\s*/, '').trim();
        if (cleanTip) {
          const priority = determinePriority(cleanTip);
          const category = determineCategory(cleanTip);
          styleTips.push({
            category,
            suggestion: cleanTip,
            priority
          });
        }
      }
    }

    if (styleTips.length === 0) {
      styleTips.push({
        category: "General",
        suggestion: "Consider having your outfit professionally evaluated for more specific recommendations.",
        priority: "medium"
      });
    }

    // Calculate total score with validation
    let totalScore = Math.round(
      Object.values(scores).reduce((acc, curr) => acc + curr, 0) / 4
    );

    // Ensure total score is within bounds
    totalScore = Math.max(1, Math.min(10, totalScore));

    const result = {
      totalScore,
      breakdown: [
        { category: "Color Coordination", score: scores.colorCoordination, emoji: "🎨" },
        { category: "Fit & Proportion", score: scores.fitProportion, emoji: "📏" },
        { category: "Style Coherence", score: scores.styleCoherence, emoji: "✨" },
        { category: "Outfit Creativity", score: scores.outfitCreativity, emoji: "🎯" }
      ],
      feedback: `${briefDescription}\n\n${scoreExplanation}`,
      tips: styleTips
    };

    console.log('Processed analysis result:', JSON.stringify(result));

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in analyze-style function:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      details: error.stack
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function extractScore(analysis: string, category: string): number {
  try {
    const regex = new RegExp(`${category}:?\\s*(\\d+)`, 'i');
    const match = analysis.match(regex);
    const score = match ? parseInt(match[1]) : 7;
    return Math.max(1, Math.min(10, score)); // Ensure score is between 1 and 10
  } catch (error) {
    console.error(`Error extracting score for ${category}:`, error);
    return 7; // Default score if parsing fails
  }
}

function determinePriority(tip: string): 'high' | 'medium' | 'low' {
  const lowPriorityKeywords = ['consider', 'might', 'could', 'optional'];
  const highPriorityKeywords = ['should', 'need', 'must', 'important', 'essential'];
  
  const tipLower = tip.toLowerCase();
  
  if (highPriorityKeywords.some(word => tipLower.includes(word))) {
    return 'high';
  } else if (lowPriorityKeywords.some(word => tipLower.includes(word))) {
    return 'low';
  }
  return 'medium';
}

function determineCategory(tip: string): string {
  const categories = {
    color: 'Color & Pattern',
    fit: 'Fit & Proportion',
    accessory: 'Accessories',
    style: 'Style Elements',
    trend: 'Trends',
    proportion: 'Fit & Proportion',
    pattern: 'Color & Pattern',
    texture: 'Texture & Material',
    material: 'Texture & Material',
    layering: 'Styling Technique'
  };
  
  const tipLower = tip.toLowerCase();
  for (const [keyword, category] of Object.entries(categories)) {
    if (tipLower.includes(keyword)) {
      return category;
    }
  }
  
  return 'Style Elements';
}
