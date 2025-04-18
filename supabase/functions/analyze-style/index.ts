
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

    // Check if Nebius API key is available
    const nebiusApiKey = Deno.env.get('NEBIUS_API_KEY');
    
    if (!nebiusApiKey) {
      console.error('Nebius API key not configured');
      throw new Error('API key not configured');
    }
    
    // Modified prompt to be more encouraging and positive with higher scores
    const stylePrompt = `You're a supportive, upbeat fashion stylist analyzing outfits. Give encouraging, positive feedback with generous scores between 1-10, leaning toward 8-10 for most outfits unless there are major issues.

YOUR RESPONSE MUST FOLLOW THIS EXACT FORMAT WITH NUMBERS FOR SCORES:

**Overall Score:** [number 1-10]

**Color Coordination:** [number 1-10]
[2-3 specific sentences about color choices with an encouraging tone]

**Fit & Proportion:** [number 1-10]
[2-3 specific sentences about fit and proportion with a positive spin]

**Style Coherence:** [number 1-10]
[2-3 specific sentences about style cohesion, highlighting what works well]

**Accessories:** [number 1-10]
[2-3 specific sentences about accessories, being generous with your assessment]

**Outfit Creativity:** [number 1-10]
[2-3 specific sentences about creativity, emphasizing the unique aspects]

**Trend Awareness:** [number 1-10]
[2-3 specific sentences about trend alignment, focusing on what's fashionable]

**Summary:**
[3-4 enthusiastic sentences with mostly positives and gentle suggestions]

**Color Coordination Tips:**
* [Specific positive tip]
* [Specific positive tip]
* [Specific positive tip]

**Fit & Proportion Tips:**
* [Specific positive tip]
* [Specific positive tip]
* [Specific positive tip]

**Style Coherence Tips:**
* [Specific positive tip]
* [Specific positive tip]
* [Specific positive tip]

**Accessories Tips:**
* [Specific positive tip]
* [Specific positive tip]
* [Specific positive tip]

**Outfit Creativity Tips:**
* [Specific positive tip]
* [Specific positive tip]
* [Specific positive tip]

**Trend Awareness Tips:**
* [Specific positive tip]
* [Specific positive tip]
* [Specific positive tip]

**Next Level Tips:**
* [Friendly advanced tip]
* [Friendly advanced tip]
* [Friendly advanced tip]
* [Friendly advanced tip]

IMPORTANT:
- Score MUST be a NUMBER between 1-10 (not text, not a range)
- For good outfits, use scores between 8-10 for most categories
- Be generous with your assessment and focus on the positives
- EVERY category must have a numerical score
- Be specific but uplifting with feedback
- Start directly with "**Overall Score:**" - don't add any extra text

DO NOT add any extra headers or sections.`;

    console.log('Calling Nebius API with Gemma for style analysis...');
    
    // Call the Nebius API with Gemma model instead of Qwen
    const response = await fetch('https://api.studio.nebius.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${nebiusApiKey}`,
        'Content-Type': 'application/json',
        'Accept': '*/*'
      },
      body: JSON.stringify({
        model: "google/gemma-3-27b-it",
        temperature: 0.7,
        top_p: 0.9,
        top_k: 50,
        max_tokens: 1000,
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
                text: "Analyze this outfit with an encouraging and positive perspective. Give generous numerical scores (not text) for each category and make sure feedback is specific but uplifting."
              },
              {
                type: 'image_url',
                image_url: {
                  url: image
                }
              }
            ]
          }
        ]
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Nebius API error:', errorText);
      throw new Error(`Nebius API error: ${errorText}`);
    }

    const data = await response.json();
    console.log('Style analysis completed');
      
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      console.error('Invalid response format from Nebius API');
      throw new Error('Invalid response format from Nebius API');
    }

    // Extract the content
    const markdownContent = data.choices[0].message.content;
    
    // Verify the response has numerical scores before returning
    const overallScoreMatch = markdownContent.match(/\*\*Overall Score:\*\*\s*(\d+)/);
    if (!overallScoreMatch) {
      console.error('Response does not contain a valid Overall Score');
      throw new Error('Invalid response format: Missing numerical Overall Score');
    }
    
    // Verify all required categories have numerical scores
    const requiredCategories = [
      "Color Coordination", 
      "Fit & Proportion", 
      "Style Coherence", 
      "Accessories", 
      "Outfit Creativity", 
      "Trend Awareness"
    ];
    
    let missingCategories = [];
    for (const category of requiredCategories) {
      const regex = new RegExp(`\\*\\*${category}:\\*\\*\\s*(\\d+)`, 'i');
      if (!regex.test(markdownContent)) {
        missingCategories.push(category);
      }
    }
    
    if (missingCategories.length > 0) {
      console.error(`Response missing scores for categories: ${missingCategories.join(', ')}`);
      throw new Error(`Invalid response format: Missing numerical scores for ${missingCategories.join(', ')}`);
    }
    
    console.log('Analysis content sample:', markdownContent.substring(0, 100) + '...');
    
    // Return the raw markdown feedback
    return new Response(JSON.stringify({ feedback: markdownContent }), { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });

  } catch (error) {
    console.error('Error in analyze-style function:', error);
    
    // Create a fallback response that matches the expected format but with more positive tone
    const fallbackResponse = `**Overall Score:** 8

**Color Coordination:** 8
We couldn't fully analyze your outfit's colors due to a technical hiccup. Your color choices likely work well together though! Try uploading again with clearer lighting.

**Fit & Proportion:** 8
The system had trouble processing the image details. From what we can see, your outfit proportions appear balanced! A full-body shot would help us give better feedback.

**Style Coherence:** 8
Your style direction looks promising! For a more detailed analysis, try uploading with different lighting or from another angle.

**Accessories:** 8
Your accessories choices seem thoughtful! We'd love to see them more clearly - try an image with better lighting next time.

**Outfit Creativity:** 8
Your creative expression shows through even with our technical difficulties! We'd love to see more details in another image.

**Trend Awareness:** 8
Your outfit appears to align well with current trends! Upload again for more specific feedback.

**Summary:**
We hit a small technical bump analyzing your outfit, but what we can see looks great! Your style choices show promise and creativity. For a complete analysis, try uploading a well-lit, full-body image. Error: ${error.message}

**Color Coordination Tips:**
* Natural lighting helps showcase your outfit's true colors
* Consider a neutral background for your next outfit photo
* Make sure all clothing items are visible for a complete color analysis

**Fit & Proportion Tips:**
* A full-body mirror selfie gives the best view of your proportions
* Stand naturally to help us assess how the clothes fit your frame
* Include shoes in the frame for a complete proportion analysis

**Style Coherence Tips:**
* Your style direction looks promising - keep developing it!
* Try capturing your outfit from multiple angles
* Good lighting really helps show how pieces work together

**Accessories Tips:**
* Your accessory choices seem well-considered
* Close-up shots can help highlight detailed accessories
* Natural light helps show the true color and texture of accessories

**Outfit Creativity Tips:**
* We see your creative potential - keep expressing yourself!
* Different angles show off unique styling choices
* Clear photos help us appreciate your creative decisions

**Trend Awareness Tips:**
* Your trend awareness seems on point
* Clear images help us see how you've interpreted current trends
* Natural lighting shows off trending colors and textures best

**Next Level Tips:**
* Try a timer or tripod for the clearest outfit photos
* Morning or late afternoon light gives the most flattering results
* Minimal backgrounds keep the focus on your amazing outfit
* Consider taking photos in different settings to show versatility`;

    return new Response(JSON.stringify({ 
      error: error.message,
      feedback: fallbackResponse
    }), { 
      status: 200, // Return 200 with a fallback analysis
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  }
});
