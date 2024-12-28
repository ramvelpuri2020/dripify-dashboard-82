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
              text: `Analyze this outfit for the ${style} style category. Provide a detailed analysis with scores out of 100 for the following categories:

              1. Color Coordination: Evaluate how well the colors complement each other
              2. Fit & Proportion: Assess how well the clothes fit and their proportions
              3. Style Coherence: Rate how well the pieces work together
              4. Accessories: Evaluate the choice and use of accessories
              5. Outfit Creativity: Rate the uniqueness and creativity
              6. Trend Awareness: Assess alignment with current trends

              Format the scores like this:
              Color Coordination: 85
              Fit & Proportion: 90
              Style Coherence: 88
              Accessories: 82
              Outfit Creativity: 87
              Trend Awareness: 85

              Then provide specific, detailed feedback about:
              1. What works well in the outfit
              2. Areas for improvement
              3. Specific style tips based on the image
              4. Suggestions for enhancing the look

              Be very specific about what you see in the image and why you gave each score.`
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