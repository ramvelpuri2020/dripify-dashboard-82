
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
            
            Structure your response with:
            **Total Score:** [number]
            
            **Breakdown:**
            * **Overall Style**: [number]
              * [specific details about style]
            * **Color Coordination**: [number]
              * [specific details about colors]
            * **Fit & Proportion**: [number]
              * [specific details about fit]
            * **Accessories**: [number]
              * [specific details about accessories]
            * **Trend Alignment**: [number]
              * [specific details about trends]
            * **Style Expression**: [number]
              * [specific details about expression]
            
            **Feedback:** [brief overall feedback with specific suggestions]`
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `Analyze this outfit and provide a TRULY HONEST style assessment. 
                USE VARIED SCORES - don't just use 7/10 for everything.
                ACTUALLY LOOK at the outfit and score accordingly - some outfits might deserve 9s, others might be 3s or 4s.
                BE SPECIFIC in your feedback about what you actually see.`
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

    // Extract and validate style analysis 
    if (styleData.choices && styleData.choices[0]?.message?.content) {
      try {
        // Parse the AI response
        const content = styleData.choices[0].message.content;
        console.log('Raw response content:', content);
        
        // Parse the AI response as JSON or markdown
        const parsedStyleResponse = extractJsonFromResponse(content);
        
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
