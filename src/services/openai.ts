export const analyzeOutfit = async (imageBase64: string, style: string) => {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: "gpt-4-vision-preview",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Analyze this outfit for the ${style} style category. Provide a detailed analysis with scores out of 10 for the following categories:
              1. Color Coordination
              2. Fit & Proportion
              3. Style Coherence
              4. Accessories
              5. Outfit Creativity
              6. Trend Awareness
              
              Also provide specific feedback and suggestions for improvement.`
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