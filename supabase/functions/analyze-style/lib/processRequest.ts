
import { corsHeaders } from "./cors.ts";
import { analyzeStyle } from "./styleAnalysis.ts";
import { generateStyleTips } from "./styleTips.ts";

export async function processRequest(req: Request): Promise<Response> {
  // Set up response timer to track performance
  const startTime = performance.now();
  
  try {
    const { image, style } = await req.json();
    console.log('Analyzing style for: ', style || 'general');

    const togetherApiKey = Deno.env.get('TOGETHER_API_KEY');
    if (!togetherApiKey) {
      throw new Error('Together API key not configured');
    }

    // Get style analysis
    const styleAnalysisResult = await analyzeStyle(image, togetherApiKey);
    
    // Generate improvement tips based on the analysis
    const tipsResult = await generateStyleTips(image, styleAnalysisResult, togetherApiKey);

    // Combine both results
    const result = {
      ...styleAnalysisResult,
      styleTips: tipsResult.styleTips || [],
      nextLevelTips: tipsResult.nextLevelTips || []
    };

    const endTime = performance.now();
    console.log(`Total analysis time: ${(endTime - startTime).toFixed(2)}ms`);

    return new Response(JSON.stringify(result), { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  } catch (error) {
    console.error('Error in processRequest:', error);
    
    // Provide a specific error message
    return new Response(JSON.stringify({ 
      error: 'We had trouble analyzing your outfit. Please try with a clearer photo.',
      details: error.message || 'Unknown error during style analysis'
    }), { 
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  }
}
