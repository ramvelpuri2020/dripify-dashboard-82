import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";
import { Palette, Ruler, Sparkles, Lightbulb, Shirt, ShoppingBag } from "lucide-react";

export const TipsView = () => {
  const tips = [
    {
      category: "Color Theory",
      icon: Palette,
      color: "text-pink-500",
      tips: [
        "Master the color wheel for foolproof combinations",
        "Use the 60-30-10 rule for balanced outfits",
        "Consider your skin undertone when choosing colors",
        "Create contrast with complementary colors"
      ]
    },
    {
      category: "Fit & Proportion",
      icon: Ruler,
      color: "text-blue-500",
      tips: [
        "Know your body measurements and silhouette",
        "Balance loose and fitted pieces",
        "Use the rule of thirds for proportions",
        "Tailor key pieces for perfect fit"
      ]
    },
    {
      category: "Style Development",
      icon: Sparkles,
      color: "text-purple-500",
      tips: [
        "Build a versatile capsule wardrobe",
        "Mix high and low-end pieces",
        "Develop your signature style elements",
        "Document successful outfit combinations"
      ]
    },
    {
      category: "Trend Integration",
      icon: Lightbulb,
      color: "text-yellow-500",
      tips: [
        "Adapt trends to your personal style",
        "Invest in timeless foundation pieces",
        "Follow fashion influencers for inspiration",
        "Experiment with seasonal trends mindfully"
      ]
    },
    {
      category: "Wardrobe Management",
      icon: Shirt,
      color: "text-green-500",
      tips: [
        "Regular wardrobe audits and organization",
        "Create outfit formulas for easy styling",
        "Maintain a wish list for thoughtful additions",
        "Practice sustainable fashion habits"
      ]
    },
    {
      category: "Shopping Strategy",
      icon: ShoppingBag,
      color: "text-orange-500",
      tips: [
        "Research before making major purchases",
        "Focus on quality over quantity",
        "Know your style before shopping",
        "Wait 24 hours before impulse buys"
      ]
    }
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6 px-4 pb-20"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {tips.map((section, index) => (
          <motion.div
            key={section.category}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="bg-black/30 backdrop-blur-lg border-white/10 overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-black/50 to-transparent">
                <CardTitle className="text-white flex items-center gap-2">
                  <section.icon className={section.color} />
                  {section.category}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 mt-4">
                  {section.tips.map((tip, tipIndex) => (
                    <motion.li
                      key={tipIndex}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: (index * 0.1) + (tipIndex * 0.1) }}
                      className="flex items-start gap-3 text-white/80"
                    >
                      <div className="h-1.5 w-1.5 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 mt-2" />
                      <span className="text-sm">{tip}</span>
                    </motion.li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};