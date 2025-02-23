import { createClient } from '@supabase/supabase-js';
import { serve } from '@vercel/node';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

export default serve(async (req, res) => {
  if (req.method === 'OPTIONS') {
    return res.status(200).json({ body: null, headers: corsHeaders });
  }

  try {
    const { image, style } = req.body;
    console.log('Analyzing drip for style:', style);

    // Get OpenAI key from environment variable
    const openAIApiKey = process.env.OPENAI_API_KEY;
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4-vision-preview', // Using vision model since gpt-4o-mini isn't available yet
        messages: [
          {
            role: 'system',
            content: `You're a streetwear expert with an attitude. Keep it real and use street culture slang naturally. 
            You must ALWAYS return scores between 1-10 (never default to any number).
            Analyze fits using this exact format:

            {
              "first_impression": "2-3 sentences with your immediate reaction, keep it street",
              "final_verdict": "1-2 sentences explaining if they ate or need help",
              "scores": {
                "drip_level": <1-10>, // Overall impact and swagger
                "color_game": <1-10>, // How the colors work together
                "fit_check": <1-10>, // How the proportions and sizing hit
                "trend_radar": <1-10>, // Balance of trends and timeless pieces
                "unique_sauce": <1-10> // Personal style and originality
              },
              "detailed_thoughts": {
                "drip_level": "one line explaining score",
                "color_game": "one line explaining score",
                "fit_check": "one line explaining score",
                "trend_radar": "one line explaining score",
                "unique_sauce": "one line explaining score"
              }
            }
            
            IMPORTANT: Never default to 70 or any other number. Analyze the image carefully and provide accurate scores between 1 and 10.`
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `Rate this fit and keep it a buck - they need the real feedback 💯`
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
        response_format: { type: "json_object" },
        max_tokens: 1000,
        temperature: 0.7
      }),
    });

    const data = await response.json();
    console.log('AI Response:', data);

    if (!data.choices?.[0]?.message?.content) {
      throw new Error('Invalid response from AI');
    }

    const parsedResponse = JSON.parse(data.choices[0].message.content);

    // Validate scores are between 1-10
    Object.entries(parsedResponse.scores).forEach(([key, value]) => {
      if (typeof value !== 'number' || value < 1 || value > 10) {
        throw new Error(`Invalid score for ${key}: must be between 1 and 10`);
      }
    });

    // Calculate overall drip score
    const scores = parsedResponse.scores;
    const dripScore = Math.round(
      (scores.drip_level + 
       scores.color_game + 
       scores.fit_check + 
       scores.trend_radar + 
       scores.unique_sauce) / 5
    );

    const result = {
      totalScore: dripScore,
      breakdown: [
        { 
          category: "Drip Level", 
          score: scores.drip_level, 
          emoji: "🔥",
          details: parsedResponse.detailed_thoughts.drip_level
        },
        { 
          category: "Color Game", 
          score: scores.color_game, 
          emoji: "🎨",
          details: parsedResponse.detailed_thoughts.color_game
        },
        { 
          category: "Fit Check", 
          score: scores.fit_check, 
          emoji: "👕",
          details: parsedResponse.detailed_thoughts.fit_check
        },
        { 
          category: "Trend Radar", 
          score: scores.trend_radar, 
          emoji: "📈",
          details: parsedResponse.detailed_thoughts.trend_radar
        },
        { 
          category: "Unique Sauce", 
          score: scores.unique_sauce, 
          emoji: "✨",
          details: parsedResponse.detailed_thoughts.unique_sauce
        }
      ],
      feedback: `${parsedResponse.first_impression}\n\n${parsedResponse.final_verdict}`
    };

    return res.status(200).json({ ...result, headers: corsHeaders });
  } catch (error) {
    console.error('Error in drip-check function:', error);
    return res.status(500).json({ 
      error: error.message,
      headers: corsHeaders 
    });
  }
});