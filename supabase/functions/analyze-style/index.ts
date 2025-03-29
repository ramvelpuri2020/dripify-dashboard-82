
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
      Provide scores between 1-10 as WHOLE NUMBERS ONLY (no decimals) for each category. Sound authentic and conversational, not like AI.
      Return JSON in this EXACT format without any markdown formatting, backticks, or anything else:

      {
        "totalScore": <1-10 whole number>,
        "breakdown": [
          {
            "category": "Overall Style",
            "score": <1-10 whole number>,
            "emoji": "👑",
            "details": "1-2 sentence explanation of score"
          },
          {
            "category": "Color Coordination",
            "score": <1-10 whole number>,
            "emoji": "🎨",
            "details": "1-2 sentence explanation of score"
          },
          {
            "category": "Fit & Proportion",
            "score": <1-10 whole number>,
            "emoji": "📏",
            "details": "1-2 sentence explanation of score"
          },
          {
            "category": "Accessories",
            "score": <1-10 whole number>,
            "emoji": "⭐",
            "details": "1-2 sentence explanation of score"
          },
          {
            "category": "Trend Alignment",
            "score": <1-10 whole number>,
            "emoji": "✨",
            "details": "1-2 sentence explanation of score"
          },
          {
            "category": "Style Expression",
            "score": <1-10 whole number>,
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
            text: `Analyze this outfit and provide a detailed style assessment as raw JSON without any markdown formatting. USE ONLY WHOLE NUMBERS for scores (no decimals).`
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

    // Extract and sanitize JSON from the response
    let parsedStyleResponse = extractAndSanitizeJson(styleContent);
    
    // Ensure all scores are integers (whole numbers)
    sanitizeScores(parsedStyleResponse);
    
    console.log('Parsed style response:', parsedStyleResponse);

    // Fix the feedback if it ended up in the breakdown array
    fixFeedbackStructure(parsedStyleResponse);

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
    let parsedTipsResponse = extractAndSanitizeJson(tipsContent);
    
    // Create a fallback if parsing failed
    if (!parsedTipsResponse || Object.keys(parsedTipsResponse).length === 0) {
      parsedTipsResponse = createFallbackTips(parsedStyleResponse);
    }
    
    console.log('Parsed tips response:', parsedTipsResponse);

    // Validate and ensure the response has the expected structure
    if (!parsedTipsResponse.styleTips) {
      console.warn('Tips response missing styleTips property, creating default structure');
      parsedTipsResponse.styleTips = createDefaultTips(parsedStyleResponse);
    }
    
    if (!parsedTipsResponse.nextLevelTips) {
      console.warn('Tips response missing nextLevelTips property, creating default');
      parsedTipsResponse.nextLevelTips = [
        "Consider consulting with a personal stylist for more tailored advice.",
        "Build a versatile wardrobe with high-quality basic pieces you can mix and match.",
        "Study current fashion trends while staying true to your personal style.",
        "Invest in proper clothing care to maintain the quality of your outfits."
      ];
    }

    // Combine both results
    const result = {
      totalScore: parsedStyleResponse.totalScore || 7,
      breakdown: parsedStyleResponse.breakdown || [],
      feedback: parsedStyleResponse.feedback || "No feedback available.",
      styleTips: parsedTipsResponse.styleTips || [],
      nextLevelTips: parsedTipsResponse.nextLevelTips || []
    };

    return new Response(JSON.stringify(result), { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  } catch (error) {
    console.error('Error in analyze-style function:', error);
    return new Response(JSON.stringify({ 
      error: error.message || 'An error occurred during style analysis',
      defaultResponse: {
        totalScore: 7,
        breakdown: [
          { category: "Overall Style", score: 7, emoji: "👑", details: "This is a reasonably well-coordinated outfit with good basics." },
          { category: "Color Coordination", score: 7, emoji: "🎨", details: "The color choices work well together but could be more intentional." },
          { category: "Fit & Proportion", score: 8, emoji: "📏", details: "The clothing fits well and flatters your body type." },
          { category: "Accessories", score: 6, emoji: "⭐", details: "Some accessories present but could be better coordinated." },
          { category: "Trend Alignment", score: 7, emoji: "✨", details: "The outfit incorporates some current trends but isn't cutting-edge." },
          { category: "Style Expression", score: 7, emoji: "🪄", details: "Your personal style shows through but could be more distinctive." }
        ],
        feedback: "This outfit shows good fashion fundamentals with proper fit and decent color choices. To elevate your style, consider more intentional accessorizing and pushing boundaries with current trends that match your personal aesthetic.",
        styleTips: [
          {
            category: "Overall Style",
            tips: ["Add a statement piece to elevate the look.", "Consider layering for more visual interest.", "Pay attention to proportions and silhouette."]
          },
          {
            category: "Color Coordination",
            tips: ["Try the 60-30-10 color rule for better balance.", "Consider analogous or complementary color schemes.", "Add a pop of contrasting color as an accent."]
          },
          {
            category: "Fit & Proportion",
            tips: ["Ensure proper tailoring for a polished look.", "Balance oversized pieces with fitted items.", "Consider your body type when selecting silhouettes."]
          },
          {
            category: "Accessories",
            tips: ["Choose accessories that complement your outfit's color scheme.", "Consider the rule of thirds for jewelry placement.", "Don't overdo it - sometimes less is more."]
          },
          {
            category: "Trend Alignment",
            tips: ["Incorporate one trend at a time for a modern look.", "Adapt trends to suit your personal style.", "Focus on timeless pieces with trendy accents."]
          },
          {
            category: "Style Expression",
            tips: ["Define your personal style with consistent elements.", "Take fashion risks that feel authentic to you.", "Develop a signature look or accessory."]
          }
        ],
        nextLevelTips: [
          "Invest in quality over quantity for key wardrobe pieces.",
          "Study color theory to create more intentional combinations.",
          "Learn about different fabric types and how they affect the drape and feel of clothing.",
          "Consider the historical context of fashion trends to develop a more nuanced style."
        ]
      }
    }), { 
      status: 200, // Return 200 even for errors, with default response
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  }
});

// Helper functions for JSON extraction and sanitization
function extractAndSanitizeJson(content) {
  try {
    // First try direct parsing
    return JSON.parse(content);
  } catch (e) {
    console.log('Direct JSON parsing failed, attempting to extract JSON...');
    
    try {
      // Extract anything between curly braces (including nested objects)
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        console.error('No JSON object found in response');
        return {};
      }
      
      let jsonText = jsonMatch[0];
      
      // Fix common issues in the JSON response
      jsonText = jsonText.replace(/,\s*\]/g, ']'); // Remove trailing commas in arrays
      jsonText = jsonText.replace(/,\s*\}/g, '}'); // Remove trailing commas in objects
      jsonText = jsonText.replace(/:\s*'([^']*)'/g, ': "$1"'); // Replace single quotes with double quotes
      jsonText = jsonText.replace(/\\/g, ''); // Remove escape characters
      jsonText = jsonText.replace(/\n/g, ' '); // Remove newlines
      
      // Fix issue with feedback being incorrectly formatted
      jsonText = jsonText.replace(/\{"feedback":\s+"([^"]+)"\}/g, '"feedback": "$1"');
      
      // Fix issue with improperly closed arrays
      const openBrackets = (jsonText.match(/\[/g) || []).length;
      const closeBrackets = (jsonText.match(/\]/g) || []).length;
      if (openBrackets > closeBrackets) {
        jsonText = jsonText + ']'.repeat(openBrackets - closeBrackets);
      }
      
      // Fix issue with improperly closed objects
      const openCurly = (jsonText.match(/\{/g) || []).length;
      const closeCurly = (jsonText.match(/\}/g) || []).length;
      if (openCurly > closeCurly) {
        jsonText = jsonText + '}'.repeat(openCurly - closeCurly);
      }
      
      return JSON.parse(jsonText);
    } catch (innerError) {
      console.error('Error parsing extracted JSON:', innerError);
      return {};
    }
  }
}

function sanitizeScores(response) {
  if (!response) return;
  
  // Sanitize totalScore
  if (response.totalScore && typeof response.totalScore === 'number') {
    response.totalScore = Math.round(response.totalScore);
  }
  
  // Sanitize breakdown scores
  if (response.breakdown && Array.isArray(response.breakdown)) {
    response.breakdown.forEach(item => {
      if (item && item.score && typeof item.score === 'number') {
        item.score = Math.round(item.score);
      }
    });
  }
}

function fixFeedbackStructure(response) {
  if (!response) return;
  
  // Check if feedback is in the breakdown array
  if (response.breakdown && Array.isArray(response.breakdown)) {
    // Look for an object with a feedback property
    const feedbackItem = response.breakdown.find(item => item.feedback || item.category === 'feedback');
    
    if (feedbackItem) {
      // If we found a feedback item in the breakdown array
      if (!response.feedback) {
        response.feedback = feedbackItem.feedback || feedbackItem.details || '';
      }
      // Remove the feedback item from the breakdown array
      response.breakdown = response.breakdown.filter(item => !item.feedback && item.category !== 'feedback');
    }
  }
}

function createFallbackTips(styleResponse) {
  if (!styleResponse || !styleResponse.breakdown || !Array.isArray(styleResponse.breakdown)) {
    return {
      styleTips: [],
      nextLevelTips: []
    };
  }
  
  return {
    styleTips: styleResponse.breakdown.map(item => ({
      category: item.category,
      tips: [
        `Consider how to improve your ${item.category.toLowerCase()} based on your current score of ${item.score}/10.`,
        "Experiment with different combinations to find what works best for you.",
        "Focus on what makes you feel confident and comfortable."
      ]
    })),
    nextLevelTips: [
      "Consider consulting with a personal stylist for more tailored advice.",
      "Build a versatile wardrobe with high-quality basic pieces you can mix and match.",
      "Study current fashion trends while staying true to your personal style.",
      "Invest in proper clothing care to maintain the quality of your outfits."
    ]
  };
}

function createDefaultTips(styleResponse) {
  if (!styleResponse || !styleResponse.breakdown || !Array.isArray(styleResponse.breakdown)) {
    return [];
  }
  
  return styleResponse.breakdown.map(item => ({
    category: item.category,
    tips: [
      `Consider how to improve your ${item.category.toLowerCase()} based on your current score of ${item.score}/10.`,
      "Experiment with different combinations to find what works best for you.",
      "Focus on what makes you feel confident and comfortable."
    ]
  }));
}
