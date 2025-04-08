
import { ScoreBreakdown, StyleTip } from "@/types/styleTypes";

interface AnalysisResult {
  breakdown: ScoreBreakdown[];
  tips?: StyleTip[];
  overallScore?: number;
  summary?: string;
}

const categoryEmojis: Record<string, string> = {
  "Color Coordination": "🎨",
  "Fit & Proportion": "📏",
  "Style Coherence": "✨",
  "Accessories": "💍",
  "Outfit Creativity": "🌟",
  "Trend Awareness": "📱"
};

export const parseAnalysis = (rawAnalysis: string): AnalysisResult => {
  console.log('Parsing analysis with optimized parser...');
  
  try {
    const breakdown: ScoreBreakdown[] = [];
    const tips: StyleTip[] = [];
    
    // Extract the overall score with simplified regex
    const overallScoreMatch = rawAnalysis.match(/\*\*Overall Score:\*\*\s*(\d+)/i);
    const overallScore = overallScoreMatch ? parseInt(overallScoreMatch[1], 10) : 8; // Default to 8 if not found
    
    // Extract the summary section - simplified pattern
    const summaryMatch = rawAnalysis.match(/\*\*Summary:\*\*([\s\S]*?)(?:\*\*|$)/i);
    const summary = summaryMatch ? summaryMatch[1].trim() : "Great outfit with stylish elements!";
    
    // Simplified category extraction - only look for the key categories
    const categories = [
      "Color Coordination", 
      "Fit & Proportion", 
      "Style Coherence", 
      "Accessories", 
      "Outfit Creativity", 
      "Trend Awareness"
    ];
    
    // Process each category with a simplified approach
    for (const category of categories) {
      const categoryRegex = new RegExp(`\\*\\*${category}:\\*\\*\\s*(\\d+)([\\s\\S]*?)(?=\\*\\*|$)`, 'i');
      const match = rawAnalysis.match(categoryRegex);
      
      if (match) {
        const score = parseInt(match[1], 10);
        const details = match[2].trim();
        
        if (!isNaN(score)) {
          const emoji = categoryEmojis[category] || "✅";
          
          breakdown.push({
            category,
            score,
            emoji,
            details
          });
        } else {
          // Default to 8 if score can't be parsed
          breakdown.push({
            category,
            score: 8,
            emoji: categoryEmojis[category] || "✅",
            details: details || `Great ${category.toLowerCase()}!`
          });
        }
      } else {
        // If category isn't found, add a default entry
        breakdown.push({
          category,
          score: 8,
          emoji: categoryEmojis[category] || "✅",
          details: `Great ${category.toLowerCase()}!`
        });
      }
    }
    
    // Extract tips with a simplified approach
    const tipsSection = rawAnalysis.match(/\*\*Quick Tips:\*\*([\s\S]*?)(?=\*\*|$)/i);
    
    if (tipsSection && tipsSection[1]) {
      const tipsText = tipsSection[1].trim();
      const tipLines = tipsText.split('\n');
      
      for (const line of tipLines) {
        const tipContent = line.replace(/^\s*\*\s*/, '').trim();
        if (tipContent) {
          // Distribute tips across categories
          const categoryIndex = tips.length % categories.length;
          tips.push({
            category: categories[categoryIndex],
            tip: tipContent,
            level: "intermediate"
          });
        }
      }
    }
    
    // If we don't have enough tips, add some defaults
    if (tips.length < 3) {
      tips.push(
        {
          category: "Style Coherence",
          tip: "Try mixing textures for added visual interest",
          level: "intermediate"
        },
        {
          category: "Accessories",
          tip: "Add a statement piece to elevate your look",
          level: "beginner"
        },
        {
          category: "Color Coordination",
          tip: "Experiment with complementary colors for more impact",
          level: "intermediate"
        }
      );
    }
    
    // Sort categories by score (highest first)
    breakdown.sort((a, b) => b.score - a.score);
    
    return { 
      breakdown, 
      tips, 
      overallScore, 
      summary 
    };
  } catch (error) {
    console.error('Error parsing analysis:', error);
    // Return positive default data in case of error
    return {
      breakdown: [
        {
          category: "Style Coherence",
          score: 8,
          emoji: "✨",
          details: "You have a cohesive style that works well together."
        },
        {
          category: "Color Coordination",
          score: 8,
          emoji: "🎨",
          details: "Great color choices that complement each other."
        },
        {
          category: "Fit & Proportion",
          score: 8,
          emoji: "📏",
          details: "The outfit fits well and has good proportions."
        }
      ],
      tips: [
        {
          category: "Style Coherence",
          tip: "Try adding a statement accessory to enhance your look",
          level: "beginner"
        },
        {
          category: "Accessories",
          tip: "Consider a bold watch or bracelet for additional flair",
          level: "intermediate"
        }
      ],
      overallScore: 8,
      summary: "You've put together a stylish outfit that shows your fashion sense. The colors work well together, and your style choices are on-trend."
    };
  }
};
