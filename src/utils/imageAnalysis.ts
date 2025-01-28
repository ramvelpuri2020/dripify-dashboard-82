import { supabase } from '@/integrations/supabase/client';

export interface StyleAnalysisResult {
  totalScore: number;
  breakdown: {
    category: string;
    score: number;
    emoji: string;
  }[];
  feedback: string;
}

export const analyzeStyle = async (imageFile: File): Promise<StyleAnalysisResult> => {
  try {
    // Convert image to base64
    const base64Image = await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(imageFile);
    });

    console.log('Calling analyze-style function...');
    const { data, error } = await supabase.functions.invoke('analyze-style', {
      body: { image: base64Image, style: "casual" }
    });

    if (error) {
      console.error('Supabase function error:', error);
      throw new Error('Failed to analyze image');
    }

    console.log('OpenAI Response:', data);

    // Check if we have a valid response with choices
    if (!data?.choices?.[0]?.message?.content) {
      throw new Error('Invalid response format from OpenAI');
    }

    const analysis = data.choices[0].message.content;

    // Parse scores from the analysis
    const scores = {
      colorCoordination: extractScore(analysis, "Color Coordination") || 70,
      fitProportion: extractScore(analysis, "Fit & Proportion") || 70,
      styleCoherence: extractScore(analysis, "Style Coherence") || 70,
      styleExpression: extractScore(analysis, "Style Expression") || 70,
      outfitCreativity: extractScore(analysis, "Outfit Creativity") || 70
    };

    // Extract sections with fallbacks
    const detailedDescription = extractSection(analysis, "DETAILED_DESCRIPTION") || "No detailed description available.";
    const strengths = extractSection(analysis, "STRENGTHS") || "No strengths identified.";
    const improvements = extractSection(analysis, "IMPROVEMENTS") || "No improvements suggested.";

    // Calculate total score
    const totalScore = Math.round(
      Object.values(scores).reduce((acc, curr) => acc + curr, 0) / 5
    );

    // Prepare feedback with proper formatting
    const feedback = `${detailedDescription}\n\nStrengths:\n${strengths}\n\nSuggested Improvements:\n${improvements}`;

    // Create the result object with default values where needed
    const result: StyleAnalysisResult = {
      totalScore,
      breakdown: [
        { category: "Color Coordination", score: scores.colorCoordination, emoji: "🎨" },
        { category: "Fit & Proportion", score: scores.fitProportion, emoji: "📏" },
        { category: "Style Coherence", score: scores.styleCoherence, emoji: "✨" },
        { category: "Style Expression", score: scores.styleExpression, emoji: "🎯" },
        { category: "Outfit Creativity", score: scores.outfitCreativity, emoji: "🌟" }
      ],
      feedback
    };

    console.log('Analysis response:', result);
    return result;

  } catch (error) {
    console.error('Error analyzing style:', error);
    throw error;
  }
};

const extractScore = (analysis: string, category: string): number => {
  const regex = new RegExp(`${category}:?\\s*(\\d+)`, 'i');
  const match = analysis.match(regex);
  return match ? parseInt(match[1]) : 70;
};

const extractSection = (analysis: string, section: string): string => {
  const regex = new RegExp(`${section}:\\s*(.+?)(?=\\n\\n|$)`, 's');
  const match = analysis.match(regex);
  return match ? match[1].trim() : '';
};