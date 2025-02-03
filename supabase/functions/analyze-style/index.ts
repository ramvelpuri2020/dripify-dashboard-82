import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import { Configuration, OpenAIApi } from "https://esm.sh/openai@3.3.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { image, style } = await req.json();

    // Initialize OpenAI
    const configuration = new Configuration({
      apiKey: Deno.env.get("OPENAI_API_KEY"),
    });
    const openai = new OpenAIApi(configuration);

    // Analyze the image
    const response = await openai.createChatCompletion({
      model: "gpt-4-vision-preview",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "You are a fashion expert. Analyze this outfit and provide a concise style assessment. Focus on the key elements that make the outfit work (or not work). Be specific but brief. Rate the outfit in these categories: Color Coordination, Fit & Proportion, Style Coherence, and Outfit Creativity. Each score should be from 1-10. The total score should be the average of these scores. Format your response as JSON with these fields: totalScore (number), breakdown (array of objects with category, score, and emoji), and feedback (string). The feedback should be 2-3 sentences max explaining the key strengths or areas for improvement.",
            },
            {
              type: "image_url",
              image_url: image,
            },
          ],
        },
      ],
      max_tokens: 1000,
    });

    const completion = response.data.choices[0]?.message?.content;
    if (!completion) {
      throw new Error("No completion received from OpenAI");
    }

    // Parse the JSON response
    const result = JSON.parse(completion);

    // Validate the response format
    if (!result.totalScore || !Array.isArray(result.breakdown) || !result.feedback) {
      throw new Error("Invalid response format from OpenAI");
    }

    // Return the analysis results
    return new Response(
      JSON.stringify(result),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );

  } catch (error) {
    console.error("Error:", error.message);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});