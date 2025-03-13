
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
            content: `You are a high-end fashion stylist who provides specific, actionable style improvement tips.
            Based on the style analysis provided, generate 3 specific improvement tips for each category.
            Be authentic, direct, and conversational - use fashion lingo and slang naturally.
            
            You MUST ONLY respond with valid JSON containing no extra text, no markdown, and no explanations outside of the JSON.
            Use this exact JSON format and do not deviate from it.
            DO NOT INCLUDE ANYTHING BEFORE OR AFTER THE JSON.
            JUST RESPOND WITH THE RAW JSON OBJECT, NOTHING ELSE:
            
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
            }`
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `Here's the style analysis of this outfit: ${JSON.stringify(analysisResult)}. 
                Generate specific improvement tips for each category based on this analysis and what you can see in the image. IMPORTANT: Your ENTIRE response must be ONLY the valid JSON object with no additional text, markdown, or explanation. Just the raw JSON.`
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
        top_p: 0.7,
        top_k: 50,
        max_tokens: 2048,
        repetition_penalty: 1,
        stop: ["<|eot_id|>", "<|eom_id|>"]
      }),
    });

    const tipsData = await tipsResponse.json();
    console.log('Tips Response:', tipsData);

    // Extract and validate tips JSON
    let parsedTipsResponse;
    if (tipsData.choices && tipsData.choices[0]?.message?.content) {
      parsedTipsResponse = extractJsonFromResponse(tipsData.choices[0].message.content);
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
