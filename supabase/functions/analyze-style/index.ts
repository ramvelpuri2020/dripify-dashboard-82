
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
    
    // Improved prompt for more consistent, faster responses with strict formatting
    const stylePrompt = `You're a fashion stylist analyzing outfits. Give honest, specific feedback with realistic scores between 1-10.

YOUR RESPONSE MUST FOLLOW THIS EXACT FORMAT WITH NUMBERS FOR SCORES:

**Overall Score:** [number 1-10]

**Color Coordination:** [number 1-10]
[2-3 specific sentences about color choices]

**Fit & Proportion:** [number 1-10]
[2-3 specific sentences about fit and proportion]

**Style Coherence:** [number 1-10]
[2-3 specific sentences about style cohesion]

**Accessories:** [number 1-10]
[2-3 specific sentences about accessories]

**Outfit Creativity:** [number 1-10]
[2-3 specific sentences about creativity]

**Trend Awareness:** [number 1-10]
[2-3 specific sentences about trend alignment]

**Summary:**
[3-4 sentences with balanced critique and positives]

**Color Coordination Tips:**
* [Specific tip]
* [Specific tip]
* [Specific tip]

**Fit & Proportion Tips:**
* [Specific tip]
* [Specific tip]
* [Specific tip]

**Style Coherence Tips:**
* [Specific tip]
* [Specific tip]
* [Specific tip]

**Accessories Tips:**
* [Specific tip]
* [Specific tip]
* [Specific tip]

**Outfit Creativity Tips:**
* [Specific tip]
* [Specific tip]
* [Specific tip]

**Trend Awareness Tips:**
* [Specific tip]
* [Specific tip]
* [Specific tip]

**Next Level Tips:**
* [Advanced tip]
* [Advanced tip]
* [Advanced tip]
* [Advanced tip]

IMPORTANT:
- Score MUST be a NUMBER between 1-10 (not text, not a range)
- Use the full range from 1-10 based on actual outfit quality
- EVERY category must have a numerical score
- Be specific and actionable with feedback
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
                text: "Analyze this outfit precisely according to the format. Provide a numerical score (not text) for each category and make sure feedback is specific and actionable."
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
    
    // Create a fallback response that matches the expected format
    const fallbackResponse = `**Overall Score:** 5

**Color Coordination:** 5
We could not fully analyze your outfit due to a technical issue. Please try again with a clearer image of your outfit colors.

**Fit & Proportion:** 5
The system encountered an error while processing the image details. We recommend uploading a full-body image for better assessment.

**Style Coherence:** 5
Try uploading a different picture with better lighting for more accurate style coherence results.

**Accessories:** 5
We apologize for the inconvenience, but we couldn't properly analyze your accessories due to technical difficulties.

**Outfit Creativity:** 5
Please retry with a different image for a proper creativity assessment.

**Trend Awareness:** 5
Our system had difficulty evaluating trend alignment based on the provided image.

**Summary:**
We encountered a technical issue while analyzing your outfit. For best results, try uploading a clearly lit, full-body image showing all outfit components. Error: ${error.message}

**Color Coordination Tips:**
* Ensure good lighting when taking outfit photos for better color analysis
* Try photographing your outfit against a neutral background
* Make sure all clothing items are visible in the frame

**Fit & Proportion Tips:**
* Take a full-body photo to help analyze proportions
* Stand in a neutral pose for better fit assessment
* Ensure the camera captures your entire outfit from head to toe

**Style Coherence Tips:**
* Try uploading from a different angle
* Make sure all clothing elements are visible in the image
* Consider using natural lighting for clearer images

**Accessories Tips:**
* Ensure accessories are clearly visible in the photo
* Try a closer shot of detailed accessories
* Use good lighting to help show accessory details

**Outfit Creativity Tips:**
* Re-upload with better lighting for creativity assessment
* Make sure unique details are visible in the photo
* Try a different angle that showcases outfit creativity

**Trend Awareness Tips:**
* Try uploading a clearer image to assess trend alignment
* Make sure current seasonal items are visible
* Use natural lighting for better trend assessment

**Next Level Tips:**
* Use a tripod for stable, clear outfit photos
* Try photographing in natural daylight for best results
* Consider getting a friend to take your outfit photo
* Use the timer feature on your camera for better full-body shots`;

    return new Response(JSON.stringify({ 
      error: error.message,
      feedback: fallbackResponse
    }), { 
      status: 200, // Return 200 with a fallback analysis
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  }
});
