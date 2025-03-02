
import { supabase } from '@/integrations/supabase/client';

export interface StyleAnalysisResult {
  totalScore: number;
  breakdown: {
    category: string;
    score: number;
    emoji: string;
    details?: string;
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

    console.log('Analysis response:', data);

    if (!data || !data.totalScore || !data.breakdown || !data.feedback) {
      console.error('Invalid response format:', data);
      throw new Error('Invalid response format from OpenAI');
    }

    return {
      totalScore: data.totalScore,
      breakdown: data.breakdown,
      feedback: data.feedback
    };

  } catch (error) {
    console.error('Error analyzing style:', error);
    throw error;
  }
};

// Function to generate style improvement tips based on category and score
export const generateTipsForCategory = (category: string, score: number): string[] => {
  const tips: Record<string, string[][]> = {
    "Color Coordination": [
      // Tips for scores 1-3
      [
        "Try using a color wheel to find complementary colors that work together.",
        "Stick to a monochromatic palette until you build confidence with color matching.",
        "Consider neutral basics (black, white, gray) with one accent color."
      ],
      // Tips for scores 4-6
      [
        "Add a complementary accent color through accessories to enhance your base colors.",
        "Try the 60-30-10 rule: 60% dominant color, 30% secondary color, 10% accent color.",
        "Experiment with different shades of the same color for a cohesive look."
      ],
      // Tips for scores 7-9
      [
        "Introduce subtle print mixing with colors from the same family.",
        "Try seasonal color palettes – jewel tones for winter, pastels for spring.",
        "Experiment with unexpected color combinations while keeping proportion in mind."
      ]
    ],
    "Fit & Proportion": [
      // Tips for scores 1-3
      [
        "Focus on finding clothes that fit your shoulders and chest/bust first.",
        "Consider visiting a tailor to adjust key pieces for a better fit.",
        "Learn your body type and research silhouettes that flatter your shape."
      ],
      // Tips for scores 4-6
      [
        "Balance volume – if wearing something loose on top, pair with a more fitted bottom.",
        "Pay attention to where hems hit (pants should break at the right point on shoes).",
        "Try cuffing sleeves or pant legs for a more intentional proportion."
      ],
      // Tips for scores 7-9
      [
        "Play with oversized pieces in a controlled way – one oversized item per outfit.",
        "Experiment with different tuck styles for tops to change your proportions.",
        "Consider the rule of thirds when creating outfits for more visually appealing proportions."
      ]
    ],
    "Style Coherence": [
      // Tips for scores 1-3
      [
        "Choose a single aesthetic to focus on rather than mixing too many styles.",
        "Create a mood board of styles you like to help define your personal aesthetic.",
        "Start with versatile basics that work across multiple style categories."
      ],
      // Tips for scores 4-6
      [
        "Ensure your accessories align with your clothing style for a cohesive look.",
        "Consider the occasion and context when putting together an outfit.",
        "Find balance between statement pieces and supporting basics."
      ],
      // Tips for scores 7-9
      [
        "Mix high and low pieces in a thoughtful way to create dimension.",
        "Try cross-style experiments that share a common element (color, texture, etc).",
        "Add personal touches that tell your story while maintaining a cohesive look."
      ]
    ],
    "Outfit Creativity": [
      // Tips for scores 1-3
      [
        "Add one unexpected element to a basic outfit, like unique socks or a bold accessory.",
        "Try wearing familiar pieces in new ways (button-up shirt as a light jacket).",
        "Experiment with simple color blocking in your outfits."
      ],
      // Tips for scores 4-6
      [
        "Introduce interesting textures to add depth to your look (silk, linen, knits).",
        "Try asymmetrical elements or unexpected layering techniques.",
        "Experiment with statement pieces from vintage or thrift stores for unique finds."
      ],
      // Tips for scores 7-9
      [
        "Explore subtle subversions of classic pieces (deconstructed shirts, reimagined basics).",
        "Mix patterns thoughtfully for a high-fashion creative look.",
        "Develop signature styling moves that become part of your personal brand."
      ]
    ],
    "Overall Style": [
      // Tips for scores 1-3
      [
        "Focus on building a foundation of well-fitting basics in neutral colors.",
        "Identify 2-3 style icons whose aesthetic resonates with you for inspiration.",
        "Work on creating a capsule wardrobe where all pieces work together."
      ],
      // Tips for scores 4-6
      [
        "Develop a signature accessory style (always wearing unique earrings, special watches, etc).",
        "Start introducing more adventurous pieces while maintaining your core style.",
        "Consider the details – quality over quantity for a more refined look."
      ],
      // Tips for scores 7-9
      [
        "Develop seasonal variations of your personal style while maintaining your core aesthetic.",
        "Consider how your environment and lifestyle intersect with your style choices.",
        "Refine your style by removing what doesn't serve your aesthetic rather than adding more."
      ]
    ],
    "Accessories": [
      // Tips for scores 1-3
      [
        "Start with versatile accessories that work with multiple outfits.",
        "Focus on quality over quantity – a few good pieces elevate any look.",
        "Consider scale – choose accessories proportional to your frame."
      ],
      // Tips for scores 4-6
      [
        "Create focal points with strategic accessory placement.",
        "Layer accessories thoughtfully – stacked rings or bracelets can create impact.",
        "Try balancing delicate and bold accessories in the same outfit."
      ],
      // Tips for scores 7-9
      [
        "Use accessories to tell a story or highlight your personality.",
        "Experiment with unexpected accessory placements or styling techniques.",
        "Consider vintage or artisanal accessories for unique conversation pieces."
      ]
    ],
    "Trend Alignment": [
      // Tips for scores 1-3
      [
        "Start incorporating trends through accessible accessories rather than major pieces.",
        "Follow fashion accounts focused on wearable interpretations of runway trends.",
        "Focus on one trend at a time rather than trying to incorporate multiple trends."
      ],
      // Tips for scores 4-6
      [
        "Choose trends that align with your existing style rather than drastically departing from it.",
        "Balance trendy pieces with classics for a more grounded look.",
        "Consider which trends actually flatter your body type and personal style."
      ],
      // Tips for scores 7-9
      [
        "Focus on early-adoption of emerging trends that align with your aesthetic.",
        "Put your personal spin on trends rather than wearing them exactly as shown.",
        "Develop an eye for which trends will have longevity vs. flash-in-the-pan."
      ]
    ],
    "Style Expression": [
      // Tips for scores 1-3
      [
        "Identify elements that feel authentic to you and incorporate them consistently.",
        "Start a style journal to track outfits that make you feel most like yourself.",
        "Experiment in low-pressure settings to build confidence in your personal style."
      ],
      // Tips for scores 4-6
      [
        "Develop signature combinations that feel uniquely you.",
        "Consider how your values and interests can be reflected in your style choices.",
        "Get comfortable breaking small style 'rules' that don't serve your self-expression."
      ],
      // Tips for scores 7-9
      [
        "Refine your personal style narrative to be both authentic and aspirational.",
        "Challenge yourself with pieces or combinations that push your comfort zone.",
        "Consider how your style evolution reflects your personal growth."
      ]
    ]
  };

  // Determine which tier of tips to use based on score
  let tierIndex = 0;
  if (score >= 4 && score <= 6) {
    tierIndex = 1;
  } else if (score >= 7) {
    tierIndex = 2;
  }

  // If category not found, use Overall Style tips
  const categoryTips = tips[category] || tips["Overall Style"];
  return categoryTips[tierIndex];
};
