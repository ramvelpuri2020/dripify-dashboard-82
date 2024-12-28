import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { image, style } = await req.json()

    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
      },
      body: JSON.stringify({
        model: "gpt-4-vision-preview",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `Analyze this outfit for the ${style} style category. Focus on:

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
                3. IMPROVEMENTS: [Specific suggestions for improvement]`
              },
              {
                type: "image_url",
                image_url: image
              }
            ]
          }
        ],
        max_tokens: 1000
      })
    })

    const data = await openaiResponse.json()
    console.log('OpenAI Response:', data)

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})