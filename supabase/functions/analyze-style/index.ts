import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import { Configuration, OpenAIApi } from "https://esm.sh/openai@3.3.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { image, style } = await req.json();

    // Initialize OpenAI
    const configuration = new Configuration({
      apiKey: Deno.env.get("OPENAI_API_KEY"),
    });
    const openai = new OpenAIApi(configuration);

    console.log('Analyzing image with OpenAI...');

    // Analyze the image
    const response = await openai.createChatCompletion({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are a fashion expert. Analyze outfits and provide concise, specific feedback. Focus on key elements that make the outfit work (or not). Be direct and clear."
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Analyze this outfit and provide a brief, focused assessment. Rate these categories from 1-10:\n- Color Coordination\n- Fit & Proportion\n- Style Coherence\n- Outfit Creativity\n\nProvide a 2-3 sentence explanation focusing on the key strengths or areas for improvement. Format as JSON with: totalScore (average), breakdown (array with category/score/emoji), and feedback (string)."
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

    console.log('OpenAI response:', completion);

    // Parse the JSON response
    const result = JSON.parse(completion);

    // Validate the response format
    if (!result.totalScore || !Array.isArray(result.breakdown) || !result.feedback) {
      console.error('Invalid response format:', result);
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