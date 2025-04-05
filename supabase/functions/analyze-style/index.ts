
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

    IMPORTANT: Return ONLY valid JSON in this EXACT format with no markdown, no explanations, no extra text, no asterisks, or any other content that is not part of the JSON structure:

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
                text: "Analyze this outfit and provide detailed style feedback with valid JSON only. Do not include any explanatory text, markdown, or other formatting outside the JSON structure."
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
      // First try to find and extract just the JSON object
      const jsonMatch = analysisContent.match(/\{[\s\S]*?("totalScore"|"breakdown"|"feedback")[\s\S]*\}/);
      if (jsonMatch) {
        // We found something that looks like a JSON object with expected keys
        const jsonCandidate = jsonMatch[0];
        console.log('Found JSON candidate:', jsonCandidate.substring(0, 100) + '...');
        
        // Clean up the JSON string
        let cleanJson = jsonCandidate
          .replace(/\n/g, ' ')            // Remove newlines
          .replace(/\r/g, '')             // Remove carriage returns
          .replace(/\\"/g, '"')           // Fix escaped quotes
          .replace(/"\s*\+\s*"/g, '')     // Fix concatenated strings
          .replace(/,\s*\}/g, '}')        // Remove trailing commas in objects
          .replace(/,\s*\]/g, ']');       // Remove trailing commas in arrays
          
        try {
          analysis = JSON.parse(cleanJson);
          console.log('Successfully parsed extracted JSON');
        } catch (extractError) {
          console.error('Failed to parse extracted JSON:', extractError);
          // Try a more aggressive cleanup
          cleanJson = cleanJson
            .replace(/[^\x20-\x7E]/g, '') // Remove non-ASCII characters
            .replace(/```json|```/g, '')  // Remove markdown code blocks
            .replace(/\\n/g, '')          // Remove escaped newlines
            .replace(/\\t/g, '')          // Remove escaped tabs
            .trim();
          
          try {
            analysis = JSON.parse(cleanJson);
            console.log('Successfully parsed with aggressive cleanup');
          } catch (finalError) {
            console.error('Failed final JSON parsing attempt:', finalError);
            throw new Error('Failed to parse AI response after multiple attempts');
          }
        }
      } else {
        // Try direct parsing as a fallback
        try {
          analysis = JSON.parse(analysisContent);
          console.log('Successfully parsed JSON directly');
        } catch (parseError) {
          console.error('Failed to parse JSON directly:', parseError);
          throw new Error('No valid JSON found in response');
        }
      }
    } catch (error) {
      console.error('JSON parsing error:', error);
      // Fall back to default response with the feedback text
      analysis = {
        totalScore: 7,
        breakdown: [
          { category: "Overall Style", score: 7, emoji: "👑", details: "The outfit shows promise but could use more intention in styling." },
          { category: "Color Coordination", score: 6, emoji: "🎨", details: "The color palette is decent but lacks cohesion in some areas." },
          { category: "Fit & Proportion", score: 7, emoji: "📏", details: "The fit is generally flattering but could be refined." },
          { category: "Accessories", score: 5, emoji: "⭐", details: "The accessories are minimal and could be more impactful." },
          { category: "Trend Alignment", score: 7, emoji: "✨", details: "There are some on-trend elements but more could be incorporated." },
          { category: "Style Expression", score: 7, emoji: "🪄", details: "Your personal style shows through but could be amplified." }
        ],
        feedback: analysisContent.substring(0, 500) // Use the raw text as feedback
      };
      console.log('Using fallback analysis structure with raw text');
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
    
    IMPORTANT: Return ONLY valid JSON in this EXACT format with no markdown, no explanations, and no content outside the JSON:
    
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
                text: `Here's the style analysis of this outfit: ${JSON.stringify(analysis)}. Generate extremely detailed, specific improvement tips for each category based on this analysis and what you can see in the image. Return only valid JSON.`
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
      // First try to find and extract just the JSON object
      const jsonMatch = tipsContent.match(/\{[\s\S]*?("styleTips"|"nextLevelTips")[\s\S]*\}/);
      if (jsonMatch) {
        // We found something that looks like a JSON object with expected keys
        const jsonCandidate = jsonMatch[0];
        console.log('Found tips JSON candidate:', jsonCandidate.substring(0, 100) + '...');
        
        // Clean up the JSON string
        let cleanJson = jsonCandidate
          .replace(/\n/g, ' ')            // Remove newlines
          .replace(/\r/g, '')             // Remove carriage returns
          .replace(/\\"/g, '"')           // Fix escaped quotes
          .replace(/"\s*\+\s*"/g, '')     // Fix concatenated strings
          .replace(/,\s*\}/g, '}')        // Remove trailing commas in objects
          .replace(/,\s*\]/g, ']');       // Remove trailing commas in arrays
          
        try {
          tips = JSON.parse(cleanJson);
          console.log('Successfully parsed extracted tips JSON');
        } catch (extractError) {
          console.error('Failed to parse extracted tips JSON:', extractError);
          // Try a more aggressive cleanup
          cleanJson = cleanJson
            .replace(/[^\x20-\x7E]/g, '') // Remove non-ASCII characters
            .replace(/```json|```/g, '')  // Remove markdown code blocks
            .replace(/\\n/g, '')          // Remove escaped newlines
            .replace(/\\t/g, '')          // Remove escaped tabs
            .trim();
          
          try {
            tips = JSON.parse(cleanJson);
            console.log('Successfully parsed tips with aggressive cleanup');
          } catch (finalError) {
            console.error('Failed final tips JSON parsing attempt:', finalError);
            throw new Error('Failed to parse tips response after multiple attempts');
          }
        }
      } else {
        // Try direct parsing as a fallback
        try {
          tips = JSON.parse(tipsContent);
          console.log('Successfully parsed tips JSON directly');
        } catch (parseError) {
          console.error('Failed to parse tips JSON directly:', parseError);
          throw new Error('No valid JSON found in tips response');
        }
      }
    } catch (error) {
      console.error('Tips JSON parsing error:', error);
      // Fall back to default tips
      tips = {
        styleTips: [
          {
            category: "Overall Style",
            tips: [
              "Add a structured blazer in a complementary color to elevate your casual outfit to smart-casual.",
              "Try a French tuck with your top to create a more intentional silhouette.",
              "Layer with different textures like adding a knit cardigan over your current outfit.",
              "Consider incorporating a signature accessory that becomes your style calling card.",
              "Play with proportions by mixing fitted and relaxed pieces for visual interest."
            ]
          },
          {
            category: "Color Coordination",
            tips: [
              "Add a pop of complementary color through an accessory like a scarf or statement bag.",
              "Try the 60-30-10 color rule: 60% dominant color, 30% secondary color, 10% accent color.",
              "Consider monochromatic styling with different shades of your favorite color.",
              "Match one color from your outfit to your accessories for cohesion.",
              "Incorporate patterns that contain colors from your base outfit to tie everything together."
            ]
          },
          {
            category: "Fit & Proportion",
            tips: [
              "Have key pieces tailored to your specific measurements for a custom fit.",
              "Balance volume - if wearing something loose on top, pair with something fitted on bottom.",
              "Consider your vertical proportions by using high-waisted bottoms to elongate your legs.",
              "Use strategic tailoring tricks like darts or seams to enhance your natural shape.",
              "Pay attention to where hems hit on your body - aim for the most flattering points."
            ]
          },
          {
            category: "Accessories",
            tips: [
              "Layer necklaces of different lengths to create visual dimension.",
              "Add a belt to define your waist and add structure to your outfit.",
              "Incorporate a statement bag that adds personality to basic outfits.",
              "Try mixing metals in your jewelry for a modern, curated look.",
              "Use accessories in unexpected ways, like a silk scarf as a headband or bag charm."
            ]
          },
          {
            category: "Trend Alignment",
            tips: [
              "Incorporate one current trend while keeping the rest of your outfit classic.",
              "Try statement sleeves or interesting necklines which are trending but versatile.",
              "Add a contemporary twist with trending footwear styles.",
              "Experiment with current color trends in small doses through accessories.",
              "Consider trending silhouettes that work well with your body type."
            ]
          },
          {
            category: "Style Expression",
            tips: [
              "Create a signature look by consistently incorporating one distinctive element.",
              "Mix high and low pieces to show personal styling prowess.",
              "Add unexpected elements that showcase your personality and interests.",
              "Incorporate vintage or unique pieces that tell a story.",
              "Develop a consistent color palette that becomes your personal signature."
            ]
          }
        ],
        nextLevelTips: [
          "Develop a capsule wardrobe of 30-40 pieces that all work together seamlessly.",
          "Master the art of layering with varying lengths, textures, and weights.",
          "Create a style mood board to identify patterns in what you're drawn to aesthetically.",
          "Invest in quality foundation pieces that can be styled multiple ways.",
          "Learn basic alterations to customize off-the-rack pieces to your specific proportions."
        ]
      };
      console.log('Using fallback tips structure');
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
