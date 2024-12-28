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
      styleAppropriateness: extractScore(analysis, "Style Appropriateness"),
      outfitCreativity: extractScore(analysis, "Outfit Creativity")
    };

    // Extract sections
    const detailedDescription = extractSection(analysis, "DETAILED_DESCRIPTION");
    const strengths = extractSection(analysis, "STRENGTHS");
    const improvements = extractSection(analysis, "IMPROVEMENTS");

    // Calculate total score
    const totalScore = Math.round(
      Object.values(scores).reduce((acc, curr) => acc + curr, 0) / 5
    );

    // Prepare feedback
    const feedback = `${detailedDescription}\n\nStrengths:\n${strengths}\n\nSuggested Improvements:\n${improvements}`;

    return {
      totalScore,
      breakdown: [
        { category: "Color Coordination", score: scores.colorCoordination, emoji: "🎨" },
        { category: "Fit & Proportion", score: scores.fitProportion, emoji: "📏" },
        { category: "Style Coherence", score: scores.styleCoherence, emoji: "✨" },
        { category: "Style Appropriateness", score: scores.styleAppropriateness, emoji: "🎯" },
        { category: "Outfit Creativity", score: scores.outfitCreativity, emoji: "🌟" }
      ],
      feedback
    };
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