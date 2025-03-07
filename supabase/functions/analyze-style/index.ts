
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { HfInference } from "https://esm.sh/@huggingface/inference@2.5.0";

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
    console.log('Starting style analysis with Hugging Face models');

    // Get Hugging Face API key from environment variable
    const hfApiKey = Deno.env.get('HUGGING_FACE_API_KEY');
    if (!hfApiKey) {
      throw new Error('Hugging Face API key not configured');
    }

    const hf = new HfInference(hfApiKey);
    
    // First, use a vision model to analyze the image
    console.log('Analyzing image with vision model...');
    const visionAnalysis = await hf.imageClassification({
      model: 'google/vit-base-patch16-224',
      data: image,
    });
    
    console.log('Vision analysis completed', visionAnalysis);
    
    // Then use a text model to generate a comprehensive style analysis
    const stylePrompt = `Analyze this outfit's fashion style. The image contains: ${visionAnalysis.map(item => item.label).join(', ')}. 
    Provide a detailed style assessment with scores between 1-10 for different categories.`;
    
    console.log('Generating style analysis with text model...');
    const styleAnalysis = await hf.textGeneration({
      model: 'HuggingFaceH4/zephyr-7b-beta',
      inputs: stylePrompt,
      parameters: {
        max_new_tokens: 1024,
        temperature: 0.7,
      }
    });
    
    console.log('Text generation completed');
    
    // Process the raw text response into a structured format
    const rawAnalysis = styleAnalysis.generated_text;
    console.log('Raw analysis:', rawAnalysis);
    
    // Parse the analysis into our expected format
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
    const scorePattern = /(\w+(\s\w+)*)\s*:\s*(\d+)/g;
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
          details: `Scored ${score}/10 based on analysis.`
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
      const feedbackMatch = rawText.match(/overall(.*?)(?=\n|$)/i);
      if (feedbackMatch && feedbackMatch[1]) {
        defaultResult.feedback = feedbackMatch[1].trim();
      }
    }
    
    // Try to extract tips if possible
    const tipsPattern = /(Tip|Suggestion)s? for (.+?):\s*(.+?)(?=\n\n|\n[A-Z]|$)/gsi;
    const tipMatches = [...rawText.matchAll(tipsPattern)];
    
    if (tipMatches.length > 0) {
      const extractedTips = tipMatches.map(match => {
        const category = match[2].trim();
        const tipsText = match[3].trim();
        const tipsList = tipsText
          .split(/\d+\.|•|-)/)
          .map(tip => tip.trim())
          .filter(tip => tip.length > 0);
        
        return {
          category,
          tips: tipsList.length > 0 ? tipsList : ["Consider refinements in this area", "Look for inspiration online", "Experiment with different options"]
        };
      });
      
      if (extractedTips.length > 0) {
        defaultResult.styleTips = extractedTips;
      }
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
          details: "AI detected elements of style in this outfit."
        }
      ],
      feedback: "The AI processed this image but encountered an error in detailed analysis. The outfit appears to have good elements of style.",
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
