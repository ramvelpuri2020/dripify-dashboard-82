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
    colorCoordination: parseInt(analysis.match(/Color Coordination:?\s*(\d+)/i)?.[1] || "7"),
    fitProportion: parseInt(analysis.match(/Fit & Proportion:?\s*(\d+)/i)?.[1] || "7"),
    styleCoherence: parseInt(analysis.match(/Style Coherence:?\s*(\d+)/i)?.[1] || "7"),
    accessories: parseInt(analysis.match(/Accessories:?\s*(\d+)/i)?.[1] || "7"),
    outfitCreativity: parseInt(analysis.match(/Outfit Creativity:?\s*(\d+)/i)?.[1] || "7"),
    trendAwareness: parseInt(analysis.match(/Trend Awareness:?\s*(\d+)/i)?.[1] || "7")
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