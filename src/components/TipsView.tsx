import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";

export const TipsView = () => {
  const tips = [
    {
      category: "Color Theory",
      tips: [
        "Learn complementary colors",
        "Start with a neutral base",
        "Use the 60-30-10 rule",
        "Consider your skin tone"
      ]
    },
    {
      category: "Fit & Proportion",
      tips: [
        "Know your measurements",
        "Understand different cuts",
        "Balance proportions",
        "Get items tailored"
      ]
    },
    {
      category: "Style Development",
      tips: [
        "Create a mood board",
        "Build a capsule wardrobe",
        "Follow style influencers",
        "Document your outfits"
      ]
    }
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      {tips.map((section, index) => (
        <motion.div
          key={section.category}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.1 }}
        >
          <Card className="bg-white/5 border-white/10">
            <CardHeader>
              <CardTitle className="text-white">{section.category}</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {section.tips.map((tip, tipIndex) => (
                  <motion.li
                    key={tipIndex}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: (index * 0.1) + (tipIndex * 0.1) }}
                    className="text-white/80 flex items-center gap-2"
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-[#F97316]" />
                    {tip}
                  </motion.li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </motion.div>
  );
};