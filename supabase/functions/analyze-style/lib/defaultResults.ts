
// Create more varied default results with realistic scores
export function createDefaultAnalysisResult() {
  return {
    totalScore: 6,
    breakdown: [
      {
        category: "Overall Style",
        score: 6,
        emoji: "👑",
        details: "Nice outfit with some good elements. A few tweaks could make it even better."
      },
      {
        category: "Color Coordination",
        score: 7,
        emoji: "🎨",
        details: "The colors work well together. Good eye for matching tones."
      },
      {
        category: "Fit & Proportion",
        score: 5,
        emoji: "📏",
        details: "The fit could be more flattering. Consider tailoring for a better silhouette."
      },
      {
        category: "Accessories",
        score: 4,
        emoji: "⭐",
        details: "Your accessories are minimal. Adding a statement piece would elevate the look."
      },
      {
        category: "Trend Alignment",
        score: 8,
        emoji: "✨",
        details: "You've incorporated current trends nicely without going overboard."
      },
      {
        category: "Style Expression",
        score: 6,
        emoji: "🪄",
        details: "Your personal style is coming through, but could be more defined."
      }
    ],
    feedback: "Overall, you've put together a nice outfit. Try adding a statement accessory and consider tailoring for a more flattering fit."
  };
}

export function createDefaultTipsResult(analysis: any) {
  return {
    styleTips: [
      {
        category: "Overall Style",
        tips: [
          "Try adding one statement piece to create a focal point.",
          "Consider the occasion and dress appropriately for the setting.",
          "Build your outfit around your favorite piece."
        ]
      },
      {
        category: "Color Coordination",
        tips: [
          "Stick to 2-3 colors that complement each other.",
          "Use the color wheel to find complementary colors.",
          "When in doubt, neutrals always work well together."
        ]
      },
      {
        category: "Fit & Proportion",
        tips: [
          "Invest in tailoring to make even inexpensive clothes look high-end.",
          "Balance loose and fitted items for a proportional look.",
          "Make sure the clothes fit your current body, not the size you want to be."
        ]
      },
      {
        category: "Accessories",
        tips: [
          "One statement accessory is often better than many small ones.",
          "Match metals for a cohesive look.",
          "Consider your accessories' scale in relation to your body type."
        ]
      },
      {
        category: "Trend Alignment",
        tips: [
          "Incorporate trends through accessories rather than major pieces.",
          "Only follow trends that work for your body and style.",
          "Classic pieces with trendy accents create a balanced look."
        ]
      },
      {
        category: "Style Expression",
        tips: [
          "Incorporate one piece that reflects your personality.",
          "Build a signature style element you wear regularly.",
          "Don't be afraid to break fashion 'rules' to express yourself."
        ]
      }
    ],
    nextLevelTips: [
      "Take photos of outfits you love to reference later.",
      "Invest in quality basics that will last for years.",
      "Play with texture mixing for visual interest.",
      "Consider the silhouette as a whole when putting together an outfit."
    ]
  };
}
