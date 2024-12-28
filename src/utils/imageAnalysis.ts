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
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1500));

  return {
    totalScore: 85,
    breakdown: [
      { category: "Color Coordination", score: 88, emoji: "🎨" },
      { category: "Fit & Proportion", score: 92, emoji: "📏" },
      { category: "Style Coherence", score: 85, emoji: "✨" },
      { category: "Style Expression", score: 82, emoji: "🎯" },
      { category: "Outfit Creativity", score: 78, emoji: "🌟" }
    ],
    feedback: "Your outfit shows great attention to color coordination and fit. The proportions are particularly well-balanced, creating a harmonious look. Consider experimenting with more unique accessories to add personal flair. The overall style is cohesive and appropriate for the occasion. To elevate further, try incorporating some trending elements while maintaining your authentic style."
  };
};