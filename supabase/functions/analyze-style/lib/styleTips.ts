
import { extractJsonFromResponse } from "./jsonExtractor.ts";
import { createDefaultTipsResult } from "./defaultResults.ts";

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
            content: `You are a friendly, supportive fashion advisor. Give clear, specific, and actionable style tips.
            Your tips should be easy to understand and implement - like advice from a helpful friend.
            
            IMPORTANT: Your tips should be brief (1-2 sentences each) and very specific.
            
            You MUST respond ONLY with valid JSON containing no extra text.
            The JSON should follow this exact format:
            
            {
              "styleTips": [
                {
                  "category": "Overall Style",
                  "tips": ["simple tip 1", "simple tip 2", "simple tip 3"]
                },
                {
                  "category": "Color Coordination",
                  "tips": ["simple tip 1", "simple tip 2", "simple tip 3"]
                },
                {
                  "category": "Fit & Proportion",
                  "tips": ["simple tip 1", "simple tip 2", "simple tip 3"]
                },
                {
                  "category": "Accessories",
                  "tips": ["simple tip 1", "simple tip 2", "simple tip 3"]
                },
                {
                  "category": "Trend Alignment",
                  "tips": ["simple tip 1", "simple tip 2", "simple tip 3"]
                },
                {
                  "category": "Style Expression",
                  "tips": ["simple tip 1", "simple tip 2", "simple tip 3"]
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
                text: `Here's the style analysis of this outfit: ${JSON.stringify(analysisResult)}. 
                Give 3 simple, specific, and actionable tips for each category based on what you see in the image.
                Keep tips brief and easy to follow. ONLY respond with the valid JSON object.`
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
        top_p: 0.8,
        top_k: 40,
        max_tokens: 1024, // Reduced for faster responses
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
        
        // Quick validation
        if (!parsedTipsResponse || !parsedTipsResponse.styleTips) {
          console.log('Invalid tips format, using default');
          parsedTipsResponse = createDefaultTipsResult(analysisResult);
        }
      } catch (error) {
        console.log('Error parsing tips:', error);
        parsedTipsResponse = createDefaultTipsResult(analysisResult);
      }
    } else {
      console.log('Invalid tips response format');
      parsedTipsResponse = createDefaultTipsResult(analysisResult);
    }

    return parsedTipsResponse;
  } catch (error) {
    console.error('Error in generating tips:', error);
    return createDefaultTipsResult(analysisResult);
  }
}
