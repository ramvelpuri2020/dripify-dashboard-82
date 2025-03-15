
interface Scores {
  colorCoordination: number;
  fitProportion: number;
  styleCoherence: number;
  accessories: number;
  outfitCreativity: number;
  trendAwareness: number;
}

export const parseAnalysis = (analysis: string) => {
  const scores: Scores = {
    colorCoordination: Math.round(parseFloat(analysis.match(/Color Coordination:?\s*(\d+\.?\d*)/i)?.[1] || "7")),
    fitProportion: Math.round(parseFloat(analysis.match(/Fit & Proportion:?\s*(\d+\.?\d*)/i)?.[1] || "7")),
    styleCoherence: Math.round(parseFloat(analysis.match(/Style Coherence:?\s*(\d+\.?\d*)/i)?.[1] || "7")),
    accessories: Math.round(parseFloat(analysis.match(/Accessories:?\s*(\d+\.?\d*)/i)?.[1] || "7")),
    outfitCreativity: Math.round(parseFloat(analysis.match(/Outfit Creativity:?\s*(\d+\.?\d*)/i)?.[1] || "7")),
    trendAwareness: Math.round(parseFloat(analysis.match(/Trend Awareness:?\s*(\d+\.?\d*)/i)?.[1] || "7"))
  };

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
      { category: "Trend Awareness", score: scores.trendAwareness, emoji: "🌟" },
    ],
    feedback: analysis
  };
};
