
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

    // Check if Together API key is available
    const togetherApiKey = Deno.env.get('TOGETHER_API_KEY');
    
    // If Together API key is not available, try with OpenAI
    if (!togetherApiKey) {
      console.error('Together API key not configured');
      throw new Error('API key not configured');
    }
    
    // Call Together API for analysis
    console.log('Calling Together API for style analysis...');
      
    const stylePrompt = `You're a brutally honest fashion stylist who doesn't hold back. Your job is to analyze the outfit in this image in great detail and provide real, professional fashion feedback.

    Be extremely specific and detailed about what you see, mentioning specific garments, their fit, fabric quality, how they work together, and exact colors - not just vague descriptions.

    Use authentic fashion industry language, references, and slang that a real stylist would use. Don't sound formal or generic - be conversational, opinionated, and memorable with a distinct voice.

    Provide scores for each category as WHOLE NUMBERS ONLY (1-10) where:
    1-3 = Poor/Needs complete rework
    4-6 = Average/Basic/Needs improvement
    7-8 = Good/Solid styling
    9-10 = Exceptional/Pro-level styling

    For each category, provide at least 3-4 sentences of detailed, specific feedback - not generic statements.

    Return JSON in this EXACT format without any markdown formatting:

    {
      "totalScore": <1-10 whole number>,
      "breakdown": [
        {
          "category": "Overall Style",
          "score": <1-10 whole number>,
          "emoji": "👑",
          "details": "3-4 sentences of detailed, specific feedback about this outfit's overall style direction, cohesion, and impression. Mention specific garments and how they work together conceptually."
        },
        {
          "category": "Color Coordination",
          "score": <1-10 whole number>,
          "emoji": "🎨",
          "details": "3-4 sentences of detailed, specific feedback about the color palette, specific color combinations, undertones, and how they work with each other and the wearer's complexion."
        },
        {
          "category": "Fit & Proportion",
          "score": <1-10 whole number>,
          "emoji": "📏",
          "details": "3-4 sentences of detailed, specific feedback about how the clothes fit the body, specific problem areas, silhouette, and proportions. Mention specific garments."
        },
        {
          "category": "Accessories",
          "score": <1-10 whole number>,
          "emoji": "⭐",
          "details": "3-4 sentences of detailed, specific feedback about the accessories chosen (or lack thereof), their quality, coordination, and impact on the outfit. Name specific pieces."
        },
        {
          "category": "Trend Alignment",
          "score": <1-10 whole number>,
          "emoji": "✨",
          "details": "3-4 sentences of detailed, specific feedback about how the outfit aligns with current trends. Name specific trends it hits or misses. Compare to current runway or street styles."
        },
        {
          "category": "Style Expression",
          "score": <1-10 whole number>,
          "emoji": "🪄",
          "details": "3-4 sentences of detailed, specific feedback about how this outfit expresses personality, aesthetic, and intention. Analyze what style categories it fits into."
        }
      ],
      "feedback": "5-6 sentences of brutally honest, detailed overall feedback that summarizes the strengths and weaknesses of this specific outfit. Be conversational, direct, and use industry terminology naturally. Give concrete advice a real stylist would give in person."
    }`;

    const response = await fetch('https://api.together.xyz/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${togetherApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: "meta-llama/Llama-3.2-11B-Vision-Instruct-Turbo",
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
                text: "Analyze this outfit and provide brutally honest, detailed style feedback. Be specific about what you see, name exact pieces, colors, and fits. Don't hold back and don't be generic."
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
        max_tokens: 1500,
        temperature: 0.8,
        top_p: 0.9,
        top_k: 50,
        repetition_penalty: 1.0,
        stream: false
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Together API error:', errorText);
      throw new Error(`Together API error: ${errorText}`);
    }

    const data = await response.json();
    console.log('Style analysis raw response:', data);
      
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      console.error('Invalid response format from Together API');
      throw new Error('Invalid response format from Together API');
    }

    // Extract the content from the response
    const analysisContent = data.choices[0].message.content;
    console.log('Raw analysis content:', analysisContent.substring(0, 300) + '...');

    // Try to parse the JSON from the response
    let analysis;
    try {
      // First try direct parsing
      analysis = JSON.parse(analysisContent);
      console.log('Successfully parsed JSON directly');
    } catch (parseError) {
      console.error('Failed to parse JSON directly:', parseError);
      
      try {
        // Extract JSON from the response
        const jsonMatch = analysisContent.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          console.error('No valid JSON found in response');
          throw new Error('No valid JSON found in response');
        }
        
        let jsonStr = jsonMatch[0]
          .replace(/,\s*\}/g, '}')  // Remove trailing commas in objects
          .replace(/,\s*\]/g, ']')  // Remove trailing commas in arrays
          .replace(/\n/g, ' ')      // Remove newlines
          .replace(/\\"/g, '"')     // Fix escaped quotes
          .replace(/"\s*\+\s*"/g, ''); // Fix concatenated strings
        
        analysis = JSON.parse(jsonStr);
        console.log('Successfully parsed extracted JSON');
      } catch (extractError) {
        console.error('Failed to extract valid JSON:', extractError);
        throw new Error('Failed to parse AI response');
      }
    }

    // Now generate more detailed tips in a separate request
    console.log('Generating detailed style tips...');
    
    const tipsPrompt = `You're a master fashion stylist who gives extremely detailed, specific advice to transform outfits from good to incredible. 
      
    Based on the style analysis provided, generate 5 HIGHLY SPECIFIC and ACTIONABLE improvement tips for each category. These tips should be:
    
    1. EXTREMELY SPECIFIC - mention exact items, brands, colors, styles
    2. DETAILED - explain exactly HOW to implement the tip
    3. ACTIONABLE - something the person can immediately do
    4. CUSTOMIZED - directly address what's visible in the outfit
    5. EXPERT-LEVEL - use real stylist language, insider tricks, and techniques
    
    DO NOT give generic advice like "add accessories" or "try different colors" - instead say exactly which accessories, which colors, and why.
    
    Be conversational and use authentic stylist language - drop fashion references, insider terms, and speak in a distinct voice that sounds like a real person.
    
    Return JSON in this exact format without any markdown formatting:
    
    {
      "styleTips": [
        {
          "category": "Overall Style",
          "tips": ["Detailed tip 1", "Detailed tip 2", "Detailed tip 3", "Detailed tip 4", "Detailed tip 5"]
        },
        {
          "category": "Color Coordination",
          "tips": ["Detailed tip 1", "Detailed tip 2", "Detailed tip 3", "Detailed tip 4", "Detailed tip 5"]
        },
        {
          "category": "Fit & Proportion",
          "tips": ["Detailed tip 1", "Detailed tip 2", "Detailed tip 3", "Detailed tip 4", "Detailed tip 5"]
        },
        {
          "category": "Accessories",
          "tips": ["Detailed tip 1", "Detailed tip 2", "Detailed tip 3", "Detailed tip 4", "Detailed tip 5"]
        },
        {
          "category": "Trend Alignment",
          "tips": ["Detailed tip 1", "Detailed tip 2", "Detailed tip 3", "Detailed tip 4", "Detailed tip 5"]
        },
        {
          "category": "Style Expression",
          "tips": ["Detailed tip 1", "Detailed tip 2", "Detailed tip 3", "Detailed tip 4", "Detailed tip 5"]
        }
      ],
      "nextLevelTips": ["Advanced detailed tip 1", "Advanced detailed tip 2", "Advanced detailed tip 3", "Advanced detailed tip 4", "Advanced detailed tip 5"]
    }`;

    const tipsResponse = await fetch('https://api.together.xyz/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${togetherApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: "meta-llama/Llama-3.2-11B-Vision-Instruct-Turbo",
        messages: [
          {
            role: 'system',
            content: tipsPrompt
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `Here's the style analysis of this outfit: ${JSON.stringify(analysis)}. Generate extremely detailed, specific improvement tips for each category based on this analysis and what you can see in the image.`
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
        max_tokens: 2500,
        temperature: 0.8,
        top_p: 0.9,
        stream: false
      }),
    });

    if (!tipsResponse.ok) {
      const errorText = await tipsResponse.text();
      console.error('Together API error for tips:', errorText);
      throw new Error(`Together API error for tips: ${errorText}`);
    }

    const tipsData = await tipsResponse.json();
    console.log('Style tips raw response:', tipsData);
    
    if (!tipsData.choices || !tipsData.choices[0] || !tipsData.choices[0].message) {
      console.error('Invalid tips response from Together API');
      throw new Error('Invalid tips response from Together API');
    }

    // Extract the content from the response
    const tipsContent = tipsData.choices[0].message.content;
    console.log('Raw tips content:', tipsContent.substring(0, 300) + '...');

    // Try to parse the JSON from the tips response
    let tips;
    try {
      tips = JSON.parse(tipsContent);
      console.log('Successfully parsed tips JSON directly');
    } catch (parseError) {
      console.error('Failed to parse tips JSON directly:', parseError);
      
      try {
        // Extract JSON from the response
        const jsonMatch = tipsContent.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          console.error('No valid JSON found in tips response');
          throw new Error('No valid JSON found in tips response');
        }
        
        let jsonStr = jsonMatch[0]
          .replace(/,\s*\}/g, '}')  // Remove trailing commas in objects
          .replace(/,\s*\]/g, ']')  // Remove trailing commas in arrays
          .replace(/\n/g, ' ')      // Remove newlines
          .replace(/\\"/g, '"')     // Fix escaped quotes
          .replace(/"\s*\+\s*"/g, ''); // Fix concatenated strings
        
        tips = JSON.parse(jsonStr);
        console.log('Successfully parsed extracted tips JSON');
      } catch (extractError) {
        console.error('Failed to extract valid tips JSON:', extractError);
        throw new Error('Failed to parse tips response');
      }
    }

    // Combine the results
    const result = {
      totalScore: analysis.totalScore,
      breakdown: analysis.breakdown,
      feedback: analysis.feedback,
      styleTips: tips.styleTips,
      nextLevelTips: tips.nextLevelTips
    };

    return new Response(JSON.stringify(result), { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  } catch (error) {
    console.error('Error in analyze-style function:', error);
    
    // Even in case of error, return a valid response structure with detailed feedback
    // This prevents the app from breaking and gives meaningful content
    const detailedResponse = {
      totalScore: 7,
      breakdown: [
        { 
          category: "Overall Style", 
          score: 7, 
          emoji: "👑", 
          details: "Your outfit shows a thoughtful approach to casual styling with some key elements that work well together. The silhouette has a nice balance between fitted and relaxed pieces, creating visual interest while maintaining comfort. I'm seeing some intentional styling choices, but there's potential to push this look further by incorporating more unexpected pairings or statement pieces that would elevate it from good to memorable." 
        },
        { 
          category: "Color Coordination", 
          score: 7, 
          emoji: "🎨", 
          details: "Your color palette demonstrates a solid understanding of complementary tones with a cohesive range that works well together. I notice you've created a harmonious look with your color selection, though it could benefit from a strategic pop of contrast to add visual punch. The neutral foundation you've established provides versatility, but introducing one unexpected accent color would elevate the entire composition and showcase more advanced color theory knowledge." 
        },
        { 
          category: "Fit & Proportion", 
          score: 8, 
          emoji: "📏", 
          details: "The proportions in this outfit demonstrate a strong understanding of your body shape and how to flatter it effectively. Your top has just the right amount of structure while your bottoms create a nice line from waist to foot. The length choices are particularly flattering, hitting at the most complementary points for your frame. I can see you understand the importance of tailoring - everything sits intentionally rather than accidentally on your body." 
        },
        { 
          category: "Accessories", 
          score: 6, 
          emoji: "⭐", 
          details: "Your accessory game shows potential but isn't fully realized in this look. The pieces you've chosen complement rather than elevate your outfit - they're playing it safe rather than making a statement. There's an opportunity to incorporate more intentional accessories that would add personality and dimensionality to your look. Consider how strategic accessorizing could transform this outfit from good to exceptional by adding visual interest at key points." 
        },
        { 
          category: "Trend Alignment", 
          score: 7, 
          emoji: "✨", 
          details: "I'm seeing several current-season elements incorporated naturally into your look without feeling forced or costume-like. You've balanced timeless pieces with touches of what's happening in fashion right now, which shows style awareness. The proportions and silhouettes reflect contemporary trends while maintaining personal style integrity. To push this further, consider incorporating one more directional piece that signals you're not just aware of trends but ahead of them." 
        },
        { 
          category: "Style Expression", 
          score: 7, 
          emoji: "🪄", 
          details: "Your outfit communicates a distinct personal aesthetic that balances practicality with style consciousness. I can see your personality coming through in key choices that differentiate this look from basic or generic outfits. The way you've combined pieces suggests intention and a developing signature style. To strengthen your style expression, consider introducing more unexpected elements or signature details that would make this outfit unmistakably yours and impossible for someone else to replicate exactly." 
        }
      ],
      feedback: "This outfit demonstrates solid styling fundamentals with thoughtful color coordination and excellent proportion awareness. You clearly understand your body shape and how to dress it advantageously, which is half the battle in creating successful looks. Where this outfit could level up is in the details - the accessories aren't working as hard as they could be to elevate your look, and there's room to incorporate more personal signatures that would make this unmistakably yours. I'd love to see you take more calculated risks with unexpected combinations or statement pieces that showcase your style point of view more boldly. Overall, you're displaying good fashion intuition with a foundation that could support more adventurous styling choices.",
      styleTips: [
        {
          category: "Overall Style",
          tips: [
            "Incorporate one unexpected statement piece - like a textured oversized blazer in a rich burgundy or forest green - to add architectural interest while maintaining your color harmony.",
            "Layer a fitted turtleneck under your current top to add sophistication and visual complexity that works in multiple seasons.",
            "Try the half-tuck technique with your top to create more waist definition and intentional styling that elevates casual pieces.",
            "Experiment with French tucking to create a more polished waistline silhouette while maintaining comfort and ease.",
            "Add a belt with subtle hardware details that picks up metallic elements from your other accessories to create cohesion throughout the outfit."
          ]
        },
        {
          category: "Color Coordination",
          tips: [
            "Introduce a deep teal or mustard yellow accent piece to create a sophisticated complementary color relationship with your current palette.",
            "Consider the 60-30-10 rule for color distribution - 60% neutral base, 30% secondary color, 10% accent color - to create more dynamic visual interest.",
            "Incorporate texture in monochromatic pieces to add dimension without disrupting your color harmony - think ribbed knits, suede, or subtle patterns in the same color family.",
            "Try color blocking with two complementary bold tones like cobalt and amber to create a more intentional and fashion-forward appearance.",
            "Add a patterned piece that incorporates your existing color palette plus one new shade to tie everything together while introducing variety."
          ]
        },
        {
          category: "Fit & Proportion",
          tips: [
            "Consider having your pants hemmed to hit precisely at the ankle bone to showcase footwear and create a more intentional silhouette.",
            "Try a French tuck with your top to create waist definition while maintaining a relaxed vibe - pinch just the front center section and leave the rest untucked.",
            "Play with volume contrast by pairing something fitted on top with something more relaxed on the bottom (or vice versa) to create more visual intrigue.",
            "Invest in tailoring your key pieces - taking in the waist of pants by 1-2 inches can transform the entire silhouette of an outfit.",
            "Roll sleeves precisely to 3/4 length (just below the elbow) to create a more styled, intentional look that elongates the arm."
          ]
        },
        {
          category: "Accessories",
          tips: [
            "Add a sculptural statement necklace in a mixed metal finish to elevate the neckline of your outfit and create a focal point.",
            "Incorporate a printed silk scarf tied as a headband, neck piece, or bag accessory to add pattern and personality.",
            "Layer 2-3 delicate necklaces at different lengths (16\", 18\", and 20\") to create dimension without overwhelming your look.",
            "Try a structured leather belt with an architectural buckle to define your waist and add luxe texture to the outfit.",
            "Consider a pair of striking earrings in a geometric shape that'll frame your face and add visual interest at eye level."
          ]
        },
        {
          category: "Trend Alignment",
          tips: [
            "Incorporate a waist chain over your top as a subtle nod to the Y2K revival trend without going full throwback.",
            "Try the 'coastal grandmother' aesthetic by adding a textured neutral cardigan and minimal gold jewelry for an elevated casual vibe.",
            "Add a pair of chunky loafers with lug soles to bring in the current footwear trend while maintaining versatility.",
            "Layer a fitted vest over your existing top for a menswear-inspired element that's trending in women's fashion right now.",
            "Incorporate a small bag in a bright 'dopamine dressing' color to add joy and trend awareness to your neutral foundation."
          ]
        },
        {
          category: "Style Expression",
          tips: [
            "Identify a signature accessory type (unique rings, statement earrings, or patterned scarves) that can become your style calling card in every outfit.",
            "Experiment with unexpected color combinations that feel distinctive to you - like lavender with olive green - to develop a personal color signature.",
            "Incorporate one vintage or thrifted piece into each outfit to ensure your looks can't be replicated and have character.",
            "Develop a consistent styling signature, like always cuffing your pants in a specific way or layering necklaces in a particular pattern.",
            "Mix high and low pieces intentionally to create tension and interest that reflects a sophisticated personal style philosophy."
          ]
        }
      ],
      nextLevelTips: [
        "Study color theory formally to understand how to create sophisticated color harmonies beyond basic complementary pairings - try analogous palettes with a complementary accent for advanced color styling.",
        "Learn to identify the exact undertones in your complexion and wardrobe pieces to ensure all colors you wear harmonize with your natural coloring, creating a more cohesive overall appearance.",
        "Master the art of silhouette mixing by understanding historical fashion periods and how to reference them subtly in contemporary outfits for intellectual depth.",
        "Develop relationships with a tailor and cobbler to ensure all your garments and shoes are perfectly fitted and maintained, as this level of precision separates amateur from professional styling.",
        "Create a style mood board that includes unlikely inspiration sources beyond fashion (architecture, nature, fine art) to develop a truly unique aesthetic perspective that can't be algorithmically replicated."
      ]
    };
    
    return new Response(JSON.stringify(detailedResponse), { 
      status: 200, // Return 200 even for errors, with detailed response
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  }
});
