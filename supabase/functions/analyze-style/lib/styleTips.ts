
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
            
            JSON structure:
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
                
                YOUR RESPONSE MUST BE VALID JSON ONLY.`
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
        parsedTipsResponse = extractJsonFromResponse(tipsData.choices[0].message.content);
        
        // Quick validation - just return what we've got if it has styleTips
        if (parsedTipsResponse && parsedTipsResponse.styleTips) {
          return parsedTipsResponse;
        }
        
        throw new Error('Invalid tips format from AI');
        
      } catch (error) {
        console.log('Error parsing tips:', error);
        throw error; // Let the calling function handle this error
      }
    } else {
      console.log('Invalid tips response format');
      throw new Error('Invalid response from AI service');
    }
  } catch (error) {
    console.error('Error in generating tips:', error);
    throw error; // Let the calling function handle this error
  }
}
