
import { extractJsonFromResponse } from "./jsonExtractor.ts";

export async function generateStyleTips(imageData: string, analysisResult: any, apiKey: string) {
  try {
    // Generate improvement tips based on the analysis
    const tipsResponse = await fetch('https://api.together.xyz/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "meta-llama/Llama-3.2-11B-Vision-Instruct-Turbo",
        messages: [
          {
            role: 'system',
            content: `You are a supportive fashion advisor. Give specific, actionable style tips based on the outfit you see.
            Your tips should be brief (1-2 sentences each) and very specific to this outfit.
            
            IMPORTANT: YOU MUST RESPOND WITH VALID JSON ONLY. NO MARKDOWN OR EXPLANATORY TEXT.
            
            Your response must follow this structure exactly:
            {
              "styleTips": [
                {
                  "category": "Overall Style",
                  "tips": ["specific tip for this outfit", "another specific tip", "third specific tip"]
                },
                {
                  "category": "Color Coordination",
                  "tips": ["specific tip for this outfit", "another specific tip", "third specific tip"]
                },
                {
                  "category": "Fit & Proportion",
                  "tips": ["specific tip for this outfit", "another specific tip", "third specific tip"]
                },
                {
                  "category": "Accessories",
                  "tips": ["specific tip for this outfit", "another specific tip", "third specific tip"]
                },
                {
                  "category": "Trend Alignment",
                  "tips": ["specific tip for this outfit", "another specific tip", "third specific tip"]
                },
                {
                  "category": "Style Expression",
                  "tips": ["specific tip for this outfit", "another specific tip", "third specific tip"]
                }
              ],
              "nextLevelTips": ["quick tip 1", "quick tip 2", "quick tip 3", "quick tip 4"]
            }`
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `Based on this outfit and the style analysis: ${JSON.stringify(analysisResult)}, 
                give 3 SPECIFIC and ACTIONABLE tips for each category based ONLY on what you see in this image.
                
                YOUR RESPONSE MUST BE VALID JSON ONLY. NO MARKDOWN OR EXPLANATORY TEXT.`
              },
              {
                type: 'image_url',
                image_url: {
                  url: imageData
                }
              }
            ]
          }
        ],
        temperature: 0.7,
        top_p: 0.9,
        top_k: 40,
        max_tokens: 1024,
        repetition_penalty: 1.1,
        stop: ["<|eot_id|>", "<|eom_id|>"]
      }),
    });

    const tipsData = await tipsResponse.json();
    console.log('Tips Response:', tipsData);

    // Extract and validate tips JSON
    let parsedTipsResponse;
    if (tipsData.choices && tipsData.choices[0]?.message?.content) {
      try {
        // Log the raw response
        console.log('Raw tips response content:', tipsData.choices[0].message.content);
        
        parsedTipsResponse = extractJsonFromResponse(tipsData.choices[0].message.content);
        
        // Quick validation - just return what we've got if it has styleTips
        if (parsedTipsResponse && parsedTipsResponse.styleTips) {
          return parsedTipsResponse;
        }
        
        // As a fallback, try to generate minimal valid format
        if (!parsedTipsResponse || !parsedTipsResponse.styleTips) {
          console.log("Creating fallback tips response");
          return createFallbackTipsResponse();
        }
        
      } catch (error) {
        console.log('Error parsing tips:', error);
        // Return a fallback response
        return createFallbackTipsResponse();
      }
    } else {
      console.log('Invalid tips response format');
      return createFallbackTipsResponse();
    }
  } catch (error) {
    console.error('Error in generating tips:', error);
    // Return a minimal valid response
    return createFallbackTipsResponse();
  }
}

function createFallbackTipsResponse() {
  return {
    styleTips: [
      {
        category: "Overall Style",
        tips: ["Consider the overall balance of your outfit.", "Think about the occasion you're dressing for.", "Pay attention to how the pieces work together."]
      },
      {
        category: "Color Coordination",
        tips: ["Try incorporating complementary colors.", "Consider the season when choosing your palette.", "Balance neutral tones with bolder accents."]
      },
      {
        category: "Fit & Proportion",
        tips: ["Ensure your clothes fit well at the shoulders.", "Pay attention to the length of your bottoms.", "Consider the silhouette created by your outfit."]
      },
      {
        category: "Accessories",
        tips: ["Choose accessories that enhance your outfit.", "Consider one statement piece to elevate your look.", "Think about the metals and materials in your accessories."]
      },
      {
        category: "Trend Alignment",
        tips: ["Incorporate one trendy element into classic outfits.", "Look for modern updates to timeless pieces.", "Consider current color trends in your accessories."]
      },
      {
        category: "Style Expression",
        tips: ["Let your personality shine through your clothing choices.", "Experiment with pieces that make you feel confident.", "Develop a signature element in your personal style."]
      }
    ],
    nextLevelTips: [
      "Quality over quantity - invest in well-made basics.",
      "Consider the power of tailoring for a perfect fit.",
      "Build a versatile wardrobe with mix-and-match pieces.",
      "Pay attention to fabric choices for different seasons."
    ]
  };
}
