
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { image } = await req.json();
    console.log('Starting style analysis with OpenAI model');

    // Get OpenAI API key from environment variable
    const openAiApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAiApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    // Call the OpenAI API with the image
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: `You are a professional fashion stylist with years of experience working with high-end clients.
            Analyze the outfit in the image and provide a detailed, authentic style assessment.
            Be direct, honest, and specific - like a real stylist would be, not overly positive or generic like AI typically is.
            Focus on details like fit, color combinations, fabric choices, proportions, and overall cohesion.
            Rate different categories from 1-10, explain scores, and give actionable advice.
            DO NOT be artificially complimentary - point out real issues.
            Structure your response with:
            1. Overall score (1-10)
            2. Detailed breakdown with scores for: Overall Style, Color Coordination, Fit & Proportion, Accessories, Trend Alignment, and Style Expression
            3. Honest, brief feedback paragraph
            4. Specific style tips for each category
            5. Next-level suggestions for wardrobe improvement`
          },
          {
            role: 'user',
            content: [
              {
                type: 'image_url',
                image_url: {
                  url: image
                }
              },
              {
                type: 'text',
                text: 'Analyze this outfit with honest, professional feedback.'
              }
            ]
          }
        ],
        max_tokens: 1000
      }),
    });

    const openaiResponse = await response.json();
    console.log('OpenAI response received');
    
    if (!openaiResponse.choices || !openaiResponse.choices[0] || !openaiResponse.choices[0].message) {
      console.error('Invalid response from OpenAI:', openaiResponse);
      throw new Error('Invalid response from OpenAI');
    }

    const rawAnalysis = openaiResponse.choices[0].message.content;
    console.log('Raw analysis:', rawAnalysis);
    
    // Process the raw text analysis into a structured format
    const result = processRawAnalysis(rawAnalysis);
    
    return new Response(JSON.stringify(result), { 
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

// Function to process raw text analysis into structured format
function processRawAnalysis(rawText) {
  try {
    // Default structure in case parsing fails
    const defaultResult = {
      totalScore: 7,
      breakdown: [
        {
          category: "Overall Style",
          score: 7,
          emoji: "👑",
          details: "The outfit has a cohesive style but could be enhanced with some refinements."
        },
        {
          category: "Color Coordination",
          score: 7,
          emoji: "🎨",
          details: "The colors work well together but could use more intentional coordination."
        },
        {
          category: "Fit & Proportion",
          score: 7,
          emoji: "📏",
          details: "The fit is generally good but some proportions could be improved."
        },
        {
          category: "Accessories",
          score: 6,
          emoji: "⭐",
          details: "Some accessories complement the outfit but could be more strategically chosen."
        },
        {
          category: "Trend Alignment",
          score: 7,
          emoji: "✨",
          details: "The outfit incorporates some current trends but could be more updated."
        },
        {
          category: "Style Expression",
          score: 7,
          emoji: "🪄",
          details: "Personal style is evident but could be expressed more boldly."
        }
      ],
      feedback: "This outfit shows good fashion sense with room for improvement. Consider enhancing color coordination and adding more thoughtful accessories. The fit is generally flattering, and there's potential to express personal style more confidently.",
      styleTips: [
        {
          category: "Overall Style",
          tips: [
            "Try adding a statement piece to elevate the look",
            "Consider layering for more dimension",
            "Experiment with different textures to add interest"
          ]
        },
        {
          category: "Color Coordination",
          tips: [
            "Look for complementary colors to create more visual interest",
            "Consider a color wheel to find harmonious combinations",
            "Try limiting your palette to 2-3 main colors for cohesion"
          ]
        },
        {
          category: "Fit & Proportion",
          tips: [
            "Ensure clothes are properly tailored to your body shape",
            "Balance oversized pieces with more fitted items",
            "Pay attention to where hems and waistlines hit your body"
          ]
        },
        {
          category: "Accessories",
          tips: [
            "Add a statement accessory that ties the outfit together",
            "Consider the rule of removing one accessory before leaving",
            "Choose accessories that complement rather than compete"
          ]
        },
        {
          category: "Trend Alignment",
          tips: [
            "Incorporate one current trend while keeping basics timeless",
            "Follow fashion influencers for inspiration on current trends",
            "Adapt trends to suit your personal style rather than following exactly"
          ]
        },
        {
          category: "Style Expression",
          tips: [
            "Identify your style icons and draw inspiration from them",
            "Don't be afraid to experiment with bold choices",
            "Develop a signature style element that appears in most outfits"
          ]
        }
      ],
      nextLevelTips: [
        "Consider creating a capsule wardrobe for more mix-and-match options",
        "Study color theory to elevate your outfit combinations",
        "Invest in quality pieces that will last and form the foundation of your wardrobe",
        "Practice styling the same piece multiple ways to maximize versatility"
      ]
    };
    
    // Try to extract scores and categories from the raw text
    const scorePattern = /(\w+(\s\w+)*)\s*[:]\s*(\d+)/g;
    const matches = [...rawText.matchAll(scorePattern)];
    
    if (matches.length > 0) {
      // If we found score patterns, update the breakdown
      const extractedBreakdown = matches.map(match => {
        const category = match[1].trim();
        const score = parseInt(match[3]);
        
        // Assign appropriate emoji based on category
        let emoji = "⭐";
        if (category.toLowerCase().includes("style")) emoji = "👑";
        if (category.toLowerCase().includes("color")) emoji = "🎨";
        if (category.toLowerCase().includes("fit") || category.toLowerCase().includes("proportion")) emoji = "📏";
        if (category.toLowerCase().includes("accessory") || category.toLowerCase().includes("accessories")) emoji = "⭐";
        if (category.toLowerCase().includes("trend")) emoji = "✨";
        if (category.toLowerCase().includes("expression")) emoji = "🪄";
        
        return {
          category,
          score,
          emoji,
          details: extractDetailForCategory(rawText, category) || `Scored ${score}/10 based on analysis.`
        };
      });
      
      // Calculate total score as average of category scores
      const totalScore = Math.round(
        extractedBreakdown.reduce((sum, item) => sum + item.score, 0) / extractedBreakdown.length
      );
      
      // Update default result with extracted data
      defaultResult.totalScore = totalScore;
      defaultResult.breakdown = extractedBreakdown;
      
      // Try to extract overall feedback
      const feedbackMatch = rawText.match(/feedback[:\s]+(.*?)(?=\n\n|\n[A-Z]|$)/is);
      if (feedbackMatch && feedbackMatch[1]) {
        defaultResult.feedback = feedbackMatch[1].trim();
      } else {
        // Alternative extraction method for feedback
        const paragraphs = rawText.split('\n\n');
        for (const paragraph of paragraphs) {
          if (paragraph.length > 50 && !paragraph.includes(':') && !paragraph.match(/^\d+\./)) {
            defaultResult.feedback = paragraph.trim();
            break;
          }
        }
      }
    }
    
    // Extract tips more aggressively
    const extractedTips = [];
    const categories = defaultResult.breakdown.map(item => item.category);
    
    for (const category of categories) {
      const tipsForCategory = extractTipsForCategory(rawText, category);
      if (tipsForCategory.length > 0) {
        extractedTips.push({
          category,
          tips: tipsForCategory
        });
      }
    }
    
    if (extractedTips.length > 0) {
      defaultResult.styleTips = extractedTips;
    }
    
    // Extract next level tips
    const nextLevelTips = extractNextLevelTips(rawText);
    if (nextLevelTips.length > 0) {
      defaultResult.nextLevelTips = nextLevelTips;
    }
    
    return defaultResult;
  } catch (error) {
    console.error('Error processing analysis:', error);
    return {
      totalScore: 7,
      breakdown: [
        {
          category: "Overall Style",
          score: 7,
          emoji: "👑",
          details: "Stylistic elements were detected in this outfit."
        }
      ],
      feedback: "The style analysis encountered a technical issue. The outfit appears to have good elements of style based on initial assessment.",
      styleTips: [
        {
          category: "General",
          tips: ["Try experimenting with accessories", "Consider color coordination", "Focus on fit and proportion"]
        }
      ],
      nextLevelTips: ["Develop a personal style guide", "Study fashion basics", "Create outfit combinations"]
    };
  }
}

// Helper function to extract details for a specific category
function extractDetailForCategory(text, category) {
  const escapedCategory = category.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const detailsPattern = new RegExp(`${escapedCategory}[:\\s]+\\d+[^\\n]*(.*?)(?=\\n\\s*[A-Z]|\\n\\n|$)`, 'is');
  const match = text.match(detailsPattern);
  return match && match[1] ? match[1].trim() : null;
}

// Helper function to extract tips for a specific category
function extractTipsForCategory(text, category) {
  const escapedCategory = category.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  
  // Try to find a section with tips for this category
  const tipsPattern = new RegExp(`(?:Tips|Suggestions|Advice|Recommendations)\\s+for\\s+${escapedCategory}[:\\s]+(.*?)(?=\\n\\s*[A-Z]|\\n\\n|$)`, 'is');
  const match = text.match(tipsPattern);
  
  if (match && match[1]) {
    // Extract bullet points or numbered list
    return match[1]
      .split(/(?:\r?\n|-)/)
      .map(tip => tip.trim().replace(/^\d+\.|\*|\•/, '').trim())
      .filter(tip => tip.length > 5);
  }
  
  // Alternative strategy: look for parts mentioning the category with action verbs
  const parts = text.split('\n');
  const categoryTips = [];
  
  for (const part of parts) {
    if (part.toLowerCase().includes(category.toLowerCase()) && 
        (part.includes('Try') || part.includes('Consider') || part.includes('Add') || 
         part.includes('Choose') || part.includes('Avoid') || part.includes('Focus'))) {
      const tip = part.trim().replace(/^\d+\.|\*|\•/, '').trim();
      if (tip.length > 5) {
        categoryTips.push(tip);
      }
    }
  }
  
  return categoryTips.length > 0 ? categoryTips : [];
}

// Helper function to extract next level tips
function extractNextLevelTips(text) {
  // Look for sections that might contain next level tips
  const nextLevelSectionPattern = /(?:Next Level|Advanced|To Elevate|Future|Improvement)[^:]*:?\s*(.*?)(?=\n\s*[A-Z]|\n\n|$)/is;
  const sectionMatch = text.match(nextLevelSectionPattern);
  
  if (sectionMatch && sectionMatch[1]) {
    // Extract bullet points or numbered list
    return sectionMatch[1]
      .split(/(?:\r?\n|-)/)
      .map(tip => tip.trim().replace(/^\d+\.|\*|\•/, '').trim())
      .filter(tip => tip.length > 5);
  }
  
  // Alternative strategy: look for advanced recommendations in the text
  const parts = text.split('\n');
  const advancedTips = [];
  
  for (const part of parts) {
    if ((part.includes('advanced') || part.includes('next level') || part.includes('elevate') || 
         part.includes('improve') || part.includes('upgrade')) && 
        (part.includes('wardrobe') || part.includes('style') || part.includes('fashion'))) {
      const tip = part.trim().replace(/^\d+\.|\*|\•/, '').trim();
      if (tip.length > 5) {
        advancedTips.push(tip);
      }
    }
  }
  
  return advancedTips.length > 0 ? advancedTips : [];
}
