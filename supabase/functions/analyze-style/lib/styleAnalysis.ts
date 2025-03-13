
import { extractJsonFromResponse } from "./jsonExtractor.ts";
import { createDefaultAnalysisResult } from "./defaultResults.ts";

export async function analyzeStyle(imageData: string, apiKey: string) {
  try {
    // First analysis for overall style assessment
    const styleAnalysisResponse = await fetch('https://api.together.xyz/v1/chat/completions', {
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
            content: `You're a fashion expert who analyzes outfits with brutal honesty. 
            Analyze the outfit as if you're a real fashion expert who is direct and uses slang and industry terms naturally.
            Provide scores between 1-10 for each category. Sound authentic and conversational, not like AI.
            
            You MUST ONLY respond with valid JSON containing no extra text, no markdown, and no explanations outside of the JSON.
            Use this exact JSON format and do not deviate from it. 
            DO NOT INCLUDE ANYTHING BEFORE OR AFTER THE JSON.
            JUST RESPOND WITH THE RAW JSON OBJECT, NOTHING ELSE:

            {
              "totalScore": 7,
              "breakdown": [
                {
                  "category": "Overall Style",
                  "score": 8,
                  "emoji": "👑",
                  "details": "brief explanation"
                },
                {
                  "category": "Color Coordination",
                  "score": 6,
                  "emoji": "🎨",
                  "details": "brief explanation"
                },
                {
                  "category": "Fit & Proportion",
                  "score": 7,
                  "emoji": "📏",
                  "details": "brief explanation"
                },
                {
                  "category": "Accessories",
                  "score": 5,
                  "emoji": "⭐",
                  "details": "brief explanation"
                },
                {
                  "category": "Trend Alignment",
                  "score": 7,
                  "emoji": "✨",
                  "details": "brief explanation"
                },
                {
                  "category": "Style Expression",
                  "score": 8,
                  "emoji": "🪄",
                  "details": "brief explanation"
                }
              ],
              "feedback": "overall feedback about the outfit"
            }`
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `Analyze this outfit and provide a detailed style assessment. IMPORTANT: Your ENTIRE response must be ONLY the valid JSON object with no additional text, markdown, or explanation. Just the raw JSON. If you can't see or analyze the image clearly, use placeholder values but maintain valid JSON format.`
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

    const styleData = await styleAnalysisResponse.json();
    console.log('Style Analysis Response:', styleData);

    // Extract and validate style analysis JSON
    let parsedStyleResponse;
    if (styleData.choices && styleData.choices[0]?.message?.content) {
      parsedStyleResponse = extractJsonFromResponse(styleData.choices[0].message.content);
    } else {
      console.log('Invalid style analysis response format');
      parsedStyleResponse = createDefaultAnalysisResult();
    }

    return parsedStyleResponse;
  } catch (error) {
    console.error('Error in style analysis:', error);
    return createDefaultAnalysisResult();
  }
}
