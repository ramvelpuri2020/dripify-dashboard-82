
import { corsHeaders } from "./cors.ts";
import { analyzeStyle } from "./styleAnalysis.ts";
import { generateStyleTips } from "./styleTips.ts";
import { createDefaultResult } from "./defaultResults.ts";

export async function processRequest(req: Request): Promise<Response> {
  try {
    const { image, style } = await req.json();
    console.log('Analyzing style for: ', style);

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

    return new Response(JSON.stringify(result), { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  } catch (error) {
    console.error('Error in processRequest:', error);
    return new Response(JSON.stringify({ 
      error: error.message || 'An error occurred during style analysis'
    }), { 
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  }
}
