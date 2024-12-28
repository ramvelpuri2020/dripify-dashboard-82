export const analyzeOutfit = async (imageBase64: string, style: string) => {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: "gpt-4-vision-preview",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Analyze this outfit for the ${style} style category. I need a detailed analysis of what the person is wearing and how well it works. Focus on:

              1. What specific items are they wearing? Describe the outfit in detail.
              2. How well do the colors work together? (score /100)
              3. How well do the pieces fit and their proportions? (score /100)
              4. How cohesive is the overall style? (score /100)
              5. How appropriate is it for the ${style} style? (score /100)
              6. How creative and unique is the outfit? (score /100)

              Format the scores exactly like this:
              Color Coordination: [score]
              Fit & Proportion: [score]
              Style Coherence: [score]
              Style Appropriateness: [score]
              Outfit Creativity: [score]

              Then provide three sections:
              1. DETAILED_DESCRIPTION: [Detailed description of what they're wearing]
              2. STRENGTHS: [What works well in this outfit]
              3. IMPROVEMENTS: [Specific suggestions for improvement]

              Be very specific about what you see in the image and provide actionable feedback.`
            },
            {
              type: "image_url",
              image_url: imageBase64
            }
          ]
        }
      ],
      max_tokens: 1000
    })
  });

  if (!response.ok) {
    throw new Error("Failed to analyze image");
  }

  return response.json();
};

export const getTipsAnalysis = async (imageBase64: string) => {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: "gpt-4-vision-preview",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Analyze this outfit and provide detailed style tips. Focus on:

              1. Overall Style Analysis (score /100)
              2. Color Coordination (score /100)
              3. Fit & Proportion (score /100)
              4. Accessories (score /100)
              5. Trend Alignment (score /100)
              6. Style Expression (score /100)

              For each category, provide:
              1. Current score
              2. What's working well
              3. Specific improvement suggestions
              4. Actionable tips for enhancement

              Format each category exactly like this:
              [Category Name]: [score]
              STRENGTHS: [What works well]
              IMPROVEMENTS: [Areas for improvement]
              TIPS: [Specific, actionable advice]

              Be very specific and detailed in your analysis.`
            },
            {
              type: "image_url",
              image_url: imageBase64
            }
          ]
        }
      ],
      max_tokens: 1000
    })
  });

  if (!response.ok) {
    throw new Error("Failed to analyze image for tips");
  }

  return response.json();
};