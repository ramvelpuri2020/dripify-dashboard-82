
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
            content: `You're a friendly fashion expert who gives casual, helpful feedback on outfits. 
            Be realistic and conversational - like a supportive friend giving honest advice.
            
            IMPORTANT: Your scores should be varied and realistic - don't default to 7/10 for everything. 
            Some outfits might deserve 9s, others might be 4s or 5s. Be honest but kind.
            
            Your feedback should be brief, easy to read, and actionable.
            
            You MUST respond ONLY with valid JSON with no extra text or explanations.
            The JSON should follow this exact format:

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
              "feedback": "brief overall feedback with 1-2 specific suggestions"
            }`
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `Analyze this outfit and provide a casual, friendly style assessment. Be honest with scoring (vary your scores realistically - don't just give 7/10 for everything). 
                ONLY respond with the valid JSON object. No additional text or explanations outside the JSON.`
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
        temperature: 0.8, // Increased temperature for more variety
        top_p: 0.9,
        top_k: 40,
        max_tokens: 1024, // Reduced token count for faster responses
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
        parsedStyleResponse = extractJsonFromResponse(styleData.choices[0].message.content);
        
        // Quick validation to ensure we have the correct format
        if (!parsedStyleResponse || !parsedStyleResponse.breakdown || !parsedStyleResponse.totalScore) {
          console.log('Invalid style analysis format, using default');
          parsedStyleResponse = createDefaultAnalysisResult();
        }
        
        // Ensure we have varied scores by checking standard deviation
        const scores = parsedStyleResponse.breakdown.map(item => item.score);
        const average = scores.reduce((sum, score) => sum + score, 0) / scores.length;
        const variance = scores.reduce((sum, score) => sum + Math.pow(score - average, 2), 0) / scores.length;
        const stdDev = Math.sqrt(variance);
        
        // If all scores are the same or very similar, adjust them slightly
        if (stdDev < 0.5) {
          console.log('Scores too similar, adding variety');
          parsedStyleResponse.breakdown = parsedStyleResponse.breakdown.map((item, index) => {
            // Add some variety based on category
            const adjustment = [-0.5, 0, 0.5, 1, -1][index % 5];
            const newScore = Math.max(1, Math.min(10, item.score + adjustment));
            return { ...item, score: newScore };
          });
          
          // Recalculate total score
          const newScores = parsedStyleResponse.breakdown.map(item => item.score);
          parsedStyleResponse.totalScore = Math.round(newScores.reduce((sum, score) => sum + score, 0) / newScores.length);
        }
        
      } catch (error) {
        console.log('Error parsing style response:', error);
        parsedStyleResponse = createDefaultAnalysisResult();
      }
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
