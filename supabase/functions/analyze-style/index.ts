
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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
    console.log('Analyzing style for: ', style);

    const togetherApiKey = Deno.env.get('TOGETHER_API_KEY') || 'a9dbf7a05dc54a9ae5ce8bf4434eb40a9c6a6c78fc72da3a16e1b2db6e075aca';
    if (!togetherApiKey) {
      throw new Error('Together API key not configured');
    }

    // First analysis for overall style assessment
    const stylePrompt = `You're a fashion expert who analyzes outfits with brutal honesty. 
      Analyze the outfit in this image as if you're a real fashion expert who is direct and uses slang and industry terms naturally.
      Provide scores between 1-10 for each category. Sound authentic and conversational, not like AI.
      Return JSON in this EXACT format without any markdown formatting, backticks, or anything else:

      {
        "totalScore": <1-10>,
        "breakdown": [
          {
            "category": "Overall Style",
            "score": <1-10>,
            "emoji": "👑",
            "details": "1-2 sentence explanation of score"
          },
          {
            "category": "Color Coordination",
            "score": <1-10>,
            "emoji": "🎨",
            "details": "1-2 sentence explanation of score"
          },
          {
            "category": "Fit & Proportion",
            "score": <1-10>,
            "emoji": "📏",
            "details": "1-2 sentence explanation of score"
          },
          {
            "category": "Accessories",
            "score": <1-10>,
            "emoji": "⭐",
            "details": "1-2 sentence explanation of score"
          },
          {
            "category": "Trend Alignment",
            "score": <1-10>,
            "emoji": "✨",
            "details": "1-2 sentence explanation of score"
          },
          {
            "category": "Style Expression",
            "score": <1-10>,
            "emoji": "🪄",
            "details": "1-2 sentence explanation of score"
          }
        ],
        "feedback": "3-4 sentences of overall feedback about the outfit"
      }`;

    // Create the messages array for Together API
    const styleMessages = [
      {
        role: 'system',
        content: stylePrompt
      },
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: `Analyze this outfit and provide a detailed style assessment as raw JSON without any markdown.`
          },
          {
            type: 'image_url',
            image_url: {
              url: image
            }
          }
        ]
      }
    ];

    // Call Together.ai API for style analysis
    console.log('Calling Together API for style analysis...');
    const styleAnalysisResponse = await fetch('https://api.together.xyz/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${togetherApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: "meta-llama/Llama-3.2-11B-Vision-Instruct-Turbo",
        messages: styleMessages,
        max_tokens: 1000,
        temperature: 0.7,
        top_p: 0.7,
        top_k: 50,
        repetition_penalty: 1,
        stream: false
      }),
    });

    if (!styleAnalysisResponse.ok) {
      const errorText = await styleAnalysisResponse.text();
      console.error('Together API error:', errorText);
      throw new Error(`Together API returned status ${styleAnalysisResponse.status}: ${errorText}`);
    }

    const styleData = await styleAnalysisResponse.json();
    console.log('Style Analysis Response:', styleData);

    if (!styleData.choices || !styleData.choices[0] || !styleData.choices[0].message) {
      throw new Error('Invalid response format from Together API');
    }

    // Extract the content from the response
    const styleContent = styleData.choices[0].message.content;
    console.log('Raw style content:', styleContent);

    // Extract and parse JSON from the response
    let parsedStyleResponse;
    try {
      // First try direct parsing
      parsedStyleResponse = JSON.parse(styleContent);
    } catch (e) {
      // If direct parsing fails, try to extract JSON from the text
      console.log('Direct JSON parsing failed, attempting to extract JSON...');
      
      // Extract anything between curly braces (including nested objects)
      const jsonMatch = styleContent.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        console.error('No JSON object found in response');
        throw new Error('Could not extract JSON from response');
      }
      
      try {
        // Try to fix common JSON structure issues before parsing
        let jsonText = jsonMatch[0];
        
        // Fix issue where feedback is incorrectly added as a separate object in the breakdown array
        jsonText = jsonText.replace(/\{"feedback":/, '], "feedback":');
        
        parsedStyleResponse = JSON.parse(jsonText);
      } catch (innerError) {
        console.error('Error parsing extracted JSON:', innerError);
        throw new Error('Failed to parse extracted JSON: ' + innerError.message);
      }
    }
    
    console.log('Parsed style response:', parsedStyleResponse);

    // Now generate custom improvement tips based on the analysis
    const tipsPrompt = `You are a high-end fashion stylist who provides specific, actionable style improvement tips.
      Based on the style analysis provided, generate 3 specific improvement tips for each category.
      Be authentic, direct, and conversational - use fashion lingo and slang naturally. Don't sound like AI.
      Each tip should be tailored to the specific outfit seen in the image and the scores provided.
      For categories with high scores (8-10), focus on refinement and advanced techniques.
      For categories with medium scores (5-7), focus on specific improvements.
      For categories with low scores (1-4), focus on fundamental improvements.
      
      Return ONLY raw JSON without any markdown formatting, backticks, or anything else in this EXACT format:
      {
        "styleTips": [
          {
            "category": "Overall Style",
            "tips": ["tip 1", "tip 2", "tip 3"]
          },
          {
            "category": "Color Coordination",
            "tips": ["tip 1", "tip 2", "tip 3"]
          },
          {
            "category": "Fit & Proportion",
            "tips": ["tip 1", "tip 2", "tip 3"]
          },
          {
            "category": "Accessories",
            "tips": ["tip 1", "tip 2", "tip 3"]
          },
          {
            "category": "Trend Alignment",
            "tips": ["tip 1", "tip 2", "tip 3"]
          },
          {
            "category": "Style Expression",
            "tips": ["tip 1", "tip 2", "tip 3"]
          }
        ],
        "nextLevelTips": ["advanced tip 1", "advanced tip 2", "advanced tip 3", "advanced tip 4"]
      }`;

    // Create the messages array for tips
    const tipsMessages = [
      {
        role: 'system',
        content: tipsPrompt
      },
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: `Here's the style analysis of this outfit: ${JSON.stringify(parsedStyleResponse)}. 
              Generate specific improvement tips for each category based on this analysis and what you can see in the image.
              Return ONLY raw JSON without markdown formatting.`
          },
          {
            type: 'image_url',
            image_url: {
              url: image
            }
          }
        ]
      }
    ];

    // Call Together.ai API for tips
    console.log('Calling Together API for tips...');
    const tipsResponse = await fetch('https://api.together.xyz/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${togetherApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: "meta-llama/Llama-3.2-11B-Vision-Instruct-Turbo",
        messages: tipsMessages,
        max_tokens: 1500,
        temperature: 0.7,
        top_p: 0.7,
        top_k: 50,
        repetition_penalty: 1,
        stream: false
      }),
    });

    if (!tipsResponse.ok) {
      const errorText = await tipsResponse.text();
      console.error('Together API error for tips:', errorText);
      throw new Error(`Together API returned status ${tipsResponse.status} for tips: ${errorText}`);
    }

    const tipsData = await tipsResponse.json();
    console.log('Tips Response:', tipsData);

    if (!tipsData.choices || !tipsData.choices[0] || !tipsData.choices[0].message) {
      throw new Error('Invalid tips response from Together API');
    }

    // Extract the content from the response
    const tipsContent = tipsData.choices[0].message.content;
    console.log('Raw tips content:', tipsContent);

    // Extract and parse JSON from the tips response
    let parsedTipsResponse;
    try {
      // First try direct parsing
      parsedTipsResponse = JSON.parse(tipsContent);
    } catch (e) {
      // If direct parsing fails, try to extract JSON from the text
      console.log('Direct JSON parsing failed for tips, attempting to extract JSON...');
      
      // Extract anything between curly braces (including nested objects)
      const jsonMatch = tipsContent.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        console.error('No JSON object found in tips response');
        throw new Error('Could not extract JSON from tips response');
      }
      
      try {
        parsedTipsResponse = JSON.parse(jsonMatch[0]);
      } catch (innerError) {
        console.error('Error parsing extracted tips JSON:', innerError);
        throw new Error('Failed to parse extracted tips JSON: ' + innerError.message);
      }
    }
    
    console.log('Parsed tips response:', parsedTipsResponse);

    // Combine both results
    const result = {
      ...parsedStyleResponse,
      styleTips: parsedTipsResponse.styleTips,
      nextLevelTips: parsedTipsResponse.nextLevelTips
    };

    return new Response(JSON.stringify(result), { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  } catch (error) {
    console.error('Error in analyze-style function:', error);
    return new Response(JSON.stringify({ 
      error: error.message || 'An error occurred during style analysis'
    }), { 
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  }
});
