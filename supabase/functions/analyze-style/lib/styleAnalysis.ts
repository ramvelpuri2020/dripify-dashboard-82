
import { extractJsonFromResponse } from "./jsonExtractor.ts";

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
            content: `You're a fashion expert giving honest, varied feedback on outfits.
            Analyze the outfit image and score it on different categories.
            DO NOT use the same score for every category.
            VARY YOUR SCORES REALISTICALLY (use a mix of values from 1-10).
            
            YOU MUST RESPOND WITH VALID JSON ONLY. NO MARKDOWN, NO EXTRA TEXT.
            
            Your JSON must follow this structure:
            {
              "totalScore": number,
              "breakdown": [
                {
                  "category": "Overall Style",
                  "score": number,
                  "emoji": "👑",
                  "details": "specific observation about this outfit"
                },
                {
                  "category": "Color Coordination",
                  "score": number,
                  "emoji": "🎨",
                  "details": "specific observation about this outfit"
                },
                {
                  "category": "Fit & Proportion",
                  "score": number,
                  "emoji": "📏",
                  "details": "specific observation about this outfit"
                },
                {
                  "category": "Accessories",
                  "score": number,
                  "emoji": "⭐",
                  "details": "specific observation about this outfit"
                },
                {
                  "category": "Trend Alignment",
                  "score": number,
                  "emoji": "✨",
                  "details": "specific observation about this outfit"
                },
                {
                  "category": "Style Expression",
                  "score": number,
                  "emoji": "🪄",
                  "details": "specific observation about this outfit"
                }
              ],
              "feedback": "brief overall feedback with specific suggestions"
            }`
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `Analyze this outfit and provide a TRULY HONEST style assessment. 
                USE VARIED SCORES - don't just use 7/10 for everything.
                ACTUALLY LOOK at the outfit and score accordingly - some outfits might deserve 9s, others might be 3s or 4s.
                BE SPECIFIC in your feedback about what you actually see.
                
                YOUR RESPONSE MUST BE VALID JSON ONLY. No additional text.`
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
        temperature: 0.85, // Increased for more variety
        top_p: 0.95,
        top_k: 40,
        max_tokens: 800,
        repetition_penalty: 1.1,
        stop: ["<|eot_id|>", "<|eom_id|>"]
      }),
    });

    const styleData = await styleAnalysisResponse.json();
    console.log('Style Analysis Response:', styleData);

    // Extract and validate style analysis JSON
    let parsedStyleResponse;
    if (styleData.choices && styleData.choices[0]?.message?.content) {
      try {
        // Parse the AI response as JSON
        parsedStyleResponse = extractJsonFromResponse(styleData.choices[0].message.content);
        
        // Calculate total score if not provided
        if (parsedStyleResponse && parsedStyleResponse.breakdown && !parsedStyleResponse.totalScore) {
          const scores = parsedStyleResponse.breakdown.map(item => item.score);
          parsedStyleResponse.totalScore = Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length);
        }
        
        console.log('Parsed style response:', parsedStyleResponse);
        
        // If we have a valid response, return it
        if (parsedStyleResponse && parsedStyleResponse.breakdown) {
          return parsedStyleResponse;
        }
        
        // If not valid, throw error to retry or handle error case
        throw new Error('Invalid response format from AI');
        
      } catch (error) {
        console.log('Error parsing style response:', error);
        throw error; // Let the calling function handle this error
      }
    } else {
      console.log('Invalid style analysis response format');
      throw new Error('Invalid response from AI service');
    }
  } catch (error) {
    console.error('Error in style analysis:', error);
    throw error; // Let the calling function handle this error
  }
}
