
export function createDefaultAnalysisResult() {
  return {
    totalScore: 6,
    breakdown: [
      {
        category: "Overall Style",
        score: 6,
        emoji: "👑",
        details: "The outfit has some good elements but could use more cohesion."
      },
      {
        category: "Color Coordination",
        score: 6,
        emoji: "🎨",
        details: "The colors work together reasonably well."
      },
      {
        category: "Fit & Proportion",
        score: 7,
        emoji: "📏",
        details: "The fit is generally good with a few areas for improvement."
      },
      {
        category: "Accessories",
        score: 5,
        emoji: "⭐",
        details: "Accessories are minimal or could be better coordinated."
      },
      {
        category: "Trend Alignment",
        score: 6,
        emoji: "✨",
        details: "Some elements align with current trends."
      },
      {
        category: "Style Expression",
        score: 6,
        emoji: "🪄",
        details: "The outfit shows some personal style but could be more distinctive."
      }
    ],
    feedback: "This outfit has potential but could benefit from more thoughtful styling and accessories."
  };
}

export function createDefaultTipsResult(analysis: any) {
  return {
    styleTips: analysis.breakdown.map((item: any) => ({
      category: item.category,
      tips: [
        `Consider ways to improve your ${item.category.toLowerCase()}.`,
        `Look for inspiration to enhance your ${item.category.toLowerCase()}.`,
        `Work on developing your ${item.category.toLowerCase()}.`
      ]
    })),
    nextLevelTips: [
      "Consider consulting with a personal stylist for tailored advice.",
      "Invest in quality basics that will last longer and look better.",
      "Study current fashion trends to update your wardrobe strategically.",
      "Take photos of your outfits to review and refine your style choices."
    ]
  };
}
