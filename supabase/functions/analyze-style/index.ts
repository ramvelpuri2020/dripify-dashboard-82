
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

    // Create a prompt for fashion analysis in conversational style
    const prompt = `You're a professional fashion stylist who analyzes outfits with honest, human-like feedback.
    
    Analyze this outfit in detail, focusing on these aspects:
    - Overall style impression (score 1-10)
    - Color coordination (score 1-10)
    - Fit and proportion (score 1-10)
    - Accessorizing (score 1-10)
    - Trend awareness (score 1-10)
    - Personal style expression (score 1-10)
    
    For each aspect, give a score and conversational feedback. Use natural language and talk like a real stylist would.
    
    Also provide specific improvement tips for each category and 3-4 next-level style tips for taking their fashion to the next level.
    
    End with a brief summary of the overall impression and main recommendations.`;

    // Prepare the messages for the API request
    const messages = [
      {
        role: 'system',
        content: prompt
      },
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: "What do you think of this outfit? Please provide a detailed style assessment."
          },
          {
            type: 'image_url',
            image_url: {
              url: image // Base64 image data
            }
          }
        ]
      }
    ];

    console.log('Calling Nebius API with Qwen model...');
    
    // Call the Nebius API with the Qwen model
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
    console.log('API Response received');

    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      throw new Error('Invalid response format from Nebius API');
    }

    // Extract the content from the response
    const analysisContent = data.choices[0].message.content;
    console.log('Raw analysis content received');

    // Process the natural language response into structured format
    const analysisResult = processStyleAnalysis(analysisContent);
    console.log('Analysis processed successfully');

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
function processStyleAnalysis(content) {
  const categories = [];
  const tips = [];
  const nextLevelTips = [];
  let totalScore = 0;
  let scoreCount = 0;
  let summary = "";

  // Regular expressions to extract information
  const categoryScoreRegex = /(Overall Style|Style Impression|Color Coordination|Fit and Proportion|Accessorizing|Trend|Personal Style)[^:]*:?\s*(\d+)\/10/gi;
  const summaryRegex = /Summary[\s\n]*([^]*?)(?:$)/i;
  
  // Extract categories and scores
  let match;
  while ((match = categoryScoreRegex.exec(content)) !== null) {
    const categoryName = getStandardCategoryName(match[1].trim());
    const score = parseInt(match[2], 10);
    
    // Find the description - start after this match and end before next category or section
    const startPos = match.index + match[0].length;
    const sectionEndRegex = /(Overall Style|Style Impression|Color Coordination|Fit|Accessorizing|Trend|Personal Style|Improvement Tips|Next-Level Tips|Summary)/gi;
    sectionEndRegex.lastIndex = startPos;
    const nextMatch = sectionEndRegex.exec(content);
    const endPos = nextMatch ? nextMatch.index : content.length;
    
    let details = content.substring(startPos, endPos).trim();
    // Clean up the details
    details = details.replace(/(\d+)\/10/g, '').trim();
    
    categories.push({
      name: categoryName,
      score: score,
      details: details
    });
    
    totalScore += score;
    scoreCount++;
  }
  
  // Calculate average score (rounded)
  if (scoreCount > 0) {
    totalScore = Math.round(totalScore / scoreCount);
  }
  
  // Extract summary
  const summaryMatch = summaryRegex.exec(content);
  if (summaryMatch) {
    summary = summaryMatch[1].trim();
  }
  
  // Extract tips and next-level tips (simple approach)
  const improvementTipsMatch = /Improvement Tips[:\s]*([^]*?)(?=Next-Level Tips|$)/i.exec(content);
  if (improvementTipsMatch) {
    const tipsText = improvementTipsMatch[1];
    const tipsList = tipsText.split(/\d+\.\s+/).filter(Boolean).map(tip => tip.trim());
    tips.push(...tipsList);
  }
  
  const nextLevelTipsMatch = /Next-Level Tips[:\s]*([^]*?)(?=Summary|$)/i.exec(content);
  if (nextLevelTipsMatch) {
    const nextLevelText = nextLevelTipsMatch[1];
    const nextLevelList = nextLevelText.split(/\d+\.\s+/).filter(Boolean).map(tip => tip.trim());
    nextLevelTips.push(...nextLevelList);
  }
  
  // If no explicit tips were found, extract points from the content
  if (tips.length === 0) {
    const extractedTips = extractKeyPoints(content, 'tips');
    tips.push(...extractedTips);
  }
  
  if (nextLevelTips.length === 0) {
    const extractedNextLevel = extractKeyPoints(content, 'next level');
    nextLevelTips.push(...extractedNextLevel);
  }
  
  // If no explicit summary was found, use the last paragraph
  if (!summary) {
    const paragraphs = content.split('\n\n');
    summary = paragraphs[paragraphs.length - 1].trim();
  }

  return {
    fullAnalysis: content,
    totalScore: totalScore,
    categories: categories,
    tips: tips,
    nextLevelTips: nextLevelTips,
    summary: summary
  };
}

// Helper function to extract key points from text
function extractKeyPoints(text, pointType) {
  const points = [];
  const lines = text.split('\n');
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.match(/^\d+\.\s/) && 
        (pointType === 'tips' && !line.toLowerCase().includes('next level')) || 
        (pointType === 'next level' && line.toLowerCase().includes('next level'))) {
      points.push(line.replace(/^\d+\.\s/, '').trim());
    }
  }
  
  return points;
}

// Helper function to standardize category names
function getStandardCategoryName(categoryText) {
  categoryText = categoryText.toLowerCase();
  
  if (categoryText.includes('overall') || categoryText.includes('style impression')) {
    return 'Overall Style';
  } else if (categoryText.includes('color')) {
    return 'Color Coordination';
  } else if (categoryText.includes('fit')) {
    return 'Fit and Proportion';
  } else if (categoryText.includes('accessor')) {
    return 'Accessorizing';
  } else if (categoryText.includes('trend')) {
    return 'Trend Awareness';
  } else if (categoryText.includes('personal')) {
    return 'Personal Style';
  }
  
  return categoryText.charAt(0).toUpperCase() + categoryText.slice(1);
}
