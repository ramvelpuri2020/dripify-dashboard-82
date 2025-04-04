
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { image, style } = await req.json();
    console.log('Analyzing style for: ', style);

    const nebiusApiKey = Deno.env.get('NEBIUS_API_KEY');
    if (!nebiusApiKey) {
      throw new Error('Nebius API key not configured');
    }

    // Create a structured prompt for fashion analysis
    const stylePrompt = `You're a professional fashion stylist who analyzes outfits with honest, human-like feedback.
    
    Please analyze this outfit in detail, focusing on these aspects:
    - Overall style impression
    - Color coordination
    - Fit and proportion
    - Accessorizing
    - Trend awareness
    - Personal style expression
    
    For each aspect, give a score from 1-10 and specific feedback. Be conversational and use natural language.
    
    Also provide 2-3 specific improvement tips for each category and 3-4 next-level style tips for taking their fashion to the next level.
    
    End with a summary of your overall impression and main recommendations.`;

    // Messages array for the API request
    const messages = [
      {
        role: 'system',
        content: stylePrompt
      },
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: "What do you think of this outfit? Please provide a detailed style assessment focusing on the aspects I mentioned."
          },
          {
            type: 'image_url',
            image_url: {
              url: image
            }
          }
        ]
      }
    ];

    // Call Nebius API with the Qwen model
    console.log('Calling Nebius API with Qwen model...');
    const response = await fetch('https://api.studio.nebius.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${nebiusApiKey}`,
        'Content-Type': 'application/json',
        'Accept': '*/*'
      },
      body: JSON.stringify({
        model: "Qwen/Qwen2.5-VL-72B-Instruct",
        temperature: 0.7,
        messages: messages
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Nebius API error:', errorText);
      throw new Error(`Nebius API returned status ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    console.log('API Response:', data);

    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      throw new Error('Invalid response format from Nebius API');
    }

    // Extract the content from the response
    const analysisContent = data.choices[0].message.content;
    console.log('Raw analysis content:', analysisContent);

    // Parse the natural language response to extract scores and feedback
    const analysisResult = processAnalysisContent(analysisContent);
    console.log('Processed analysis result:', analysisResult);

    return new Response(JSON.stringify(analysisResult), { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  } catch (error) {
    console.error('Error in analyze-style function:', error);
    return new Response(JSON.stringify({ 
      error: error.message || 'An error occurred during style analysis'
    }), { 
      status: 500, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  }
});

// Function to process the AI's natural language response into structured format
function processAnalysisContent(content) {
  // Basic structure for the result
  const result = {
    fullAnalysis: content,
    categories: [],
    tips: [],
    nextLevelTips: [],
    totalScore: 0
  };

  // Extract categories and scores
  const categoryRegex = /(Overall style|Color coordination|Fit and proportion|Accessori[a-z]+|Trend [a-z]+|Style expression|Personal style)[^\d]*(\d+)\/10/gi;
  let categoryMatch;
  let scoreCount = 0;
  let scoreSum = 0;

  while ((categoryMatch = categoryRegex.exec(content)) !== null) {
    const categoryName = categoryMatch[1].trim();
    const score = parseInt(categoryMatch[2]);
    
    // Find the description after the score until the next heading or section
    const startPos = categoryMatch.index + categoryMatch[0].length;
    const nextSectionRegex = /(Overall style|Color coordination|Fit and proportion|Accessori[a-z]+|Trend [a-z]+|Style expression|Personal style|Improvement tips|Next-level tips)/gi;
    nextSectionRegex.lastIndex = startPos;
    const nextMatch = nextSectionRegex.exec(content);
    const endPos = nextMatch ? nextMatch.index : content.length;
    
    let details = content.substring(startPos, endPos).trim();
    // Clean up the details to remove any score mentions
    details = details.replace(/(\d+)\/10/g, '').trim();

    // Add to categories array
    result.categories.push({
      name: categoryName,
      score: score,
      details: details
    });

    // Add to score totals
    scoreCount++;
    scoreSum += score;
  }

  // Calculate average score
  if (scoreCount > 0) {
    result.totalScore = Math.round(scoreSum / scoreCount);
  }

  // Extract improvement tips
  const tipsRegex = /Improvement tips[^:]*:([^]*?)(?=Next-level tips|$)/i;
  const tipsMatch = tipsRegex.exec(content);
  if (tipsMatch) {
    const tipsText = tipsMatch[1].trim();
    // Split by bullet points or numbers
    const tipsList = tipsText.split(/•|-|\d+\.\s+/).filter(tip => tip.trim().length > 0);
    result.tips = tipsList.map(tip => tip.trim());
  }

  // Extract next-level tips
  const nextLevelRegex = /Next-level tips[^:]*:([^]*?)(?=Overall impression|Summary|$)/i;
  const nextLevelMatch = nextLevelRegex.exec(content);
  if (nextLevelMatch) {
    const nextLevelText = nextLevelMatch[1].trim();
    // Split by bullet points or numbers
    const nextLevelList = nextLevelText.split(/•|-|\d+\.\s+/).filter(tip => tip.trim().length > 0);
    result.nextLevelTips = nextLevelList.map(tip => tip.trim());
  }

  // Extract overall impression/summary
  const summaryRegex = /(Overall impression|Summary)[^:]*:([^]*?)$/i;
  const summaryMatch = summaryRegex.exec(content);
  if (summaryMatch) {
    result.summary = summaryMatch[2].trim();
  } else {
    // If no formal summary section, use the last paragraph
    const paragraphs = content.split('\n\n');
    result.summary = paragraphs[paragraphs.length - 1].trim();
  }

  return result;
}
