import { pipeline } from '@huggingface/transformers';
import { analyzeOutfit } from '@/services/openai';

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

    // Get detailed analysis from OpenAI
    const analysisResponse = await analyzeOutfit(base64Image, "casual");
    const analysis = analysisResponse.choices[0].message.content;
    console.log("OpenAI Analysis:", analysis);

    // Parse scores from the analysis
    const scores = {
      colorCoordination: extractScore(analysis, "Color Coordination"),
      fitProportion: extractScore(analysis, "Fit & Proportion"),
      styleCoherence: extractScore(analysis, "Style Coherence"),
      accessories: extractScore(analysis, "Accessories"),
      outfitCreativity: extractScore(analysis, "Outfit Creativity"),
      trendAwareness: extractScore(analysis, "Trend Awareness")
    };

    // Calculate total score
    const totalScore = Math.round(
      Object.values(scores).reduce((acc, curr) => acc + curr, 0) / 6
    );

    return {
      totalScore,
      breakdown: [
        { category: "Color Coordination", score: scores.colorCoordination, emoji: "🎨" },
        { category: "Fit & Proportion", score: scores.fitProportion, emoji: "📏" },
        { category: "Style Coherence", score: scores.styleCoherence, emoji: "✨" },
        { category: "Accessories", score: scores.accessories, emoji: "💍" },
        { category: "Outfit Creativity", score: scores.outfitCreativity, emoji: "🎯" },
        { category: "Trend Awareness", score: scores.trendAwareness, emoji: "🌟" }
      ],
      feedback: analysis
    };
  } catch (error) {
    console.error('Error analyzing style:', error);
    throw error;
  }
};

const extractScore = (analysis: string, category: string): number => {
  const regex = new RegExp(`${category}:?\\s*(\\d+)`, 'i');
  const match = analysis.match(regex);
  return match ? parseInt(match[1]) : 70; // Default score if not found
};