
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
            
            For example:
            {
              "styleTips": [
                {
                  "category": "Overall Style",
                  "tips": ["Try adding a denim jacket for more dimension", "A statement belt would define your waist", "Consider a bold color accent"]
                },
                {
                  "category": "Color Coordination",
                  "tips": ["Add a pop of red to brighten this outfit", "Try pairing with navy blue accessories", "Green would complement this color palette"]
                }
              ],
              "nextLevelTips": ["Invest in quality accessories", "Try statement shoes with simple outfits", "Consider layering for added interest"]
            }`
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `Based on this outfit, give me 3 SPECIFIC and ACTIONABLE tips for each category:
                - Overall Style
                - Color Coordination
                - Fit & Proportion
                - Accessories
                - Trend Alignment
                - Style Expression
                
                Also provide 3-4 "next level" general fashion tips.
                
                RESPOND WITH VALID JSON IN THE SPECIFIED FORMAT.`
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
    if (tipsData.choices && tipsData.choices[0]?.message?.content) {
      try {
        console.log('Raw tips content:', tipsData.choices[0].message.content);
        const parsedTipsResponse = extractJsonFromResponse(tipsData.choices[0].message.content);
        
        console.log('Parsed tips response:', parsedTipsResponse);
        
        // If we have a valid response with styleTips, return it
        if (parsedTipsResponse && parsedTipsResponse.styleTips) {
          return parsedTipsResponse;
        }
        
        // If we have a response without proper structure, try to create a basic structure
        if (parsedTipsResponse) {
          const categories = ['Overall Style', 'Color Coordination', 'Fit & Proportion', 
                            'Accessories', 'Trend Alignment', 'Style Expression'];
          
          // Create a basic structure if needed
          const structuredResponse = { 
            styleTips: [],
            nextLevelTips: parsedTipsResponse.nextLevelTips || []
          };
          
          // Try to extract category tips if available
          for (const category of categories) {
            if (parsedTipsResponse[category.toLowerCase().replace(/ /g, '_')] || 
                parsedTipsResponse[category]) {
              const tips = parsedTipsResponse[category.toLowerCase().replace(/ /g, '_')] || 
                         parsedTipsResponse[category];
              
              structuredResponse.styleTips.push({
                category,
                tips: Array.isArray(tips) ? tips : [tips]
              });
            }
          }
          
          if (structuredResponse.styleTips.length > 0) {
            return structuredResponse;
          }
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
    // Return a simplified response with just the analysis
    return { 
      styleTips: [],
      nextLevelTips: [] 
    };
  }
}
