import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import { Avatar, AvatarImage, AvatarFallback } from "./ui/avatar";
import { Share2, Camera, Target, Sparkles, Droplet, User, Eye } from "lucide-react";
import { Button } from "./ui/button";

export const TipsView = () => {
  const analysisResults = [
    {
      category: "Overall",
      score: 95,
      emoji: "🎯"
    },
    {
      category: "Potential",
      score: 100,
      emoji: "🚀"
    },
    {
      category: "Jawline",
      score: 95,
      emoji: "👨"
    },
    {
      category: "Masculinity",
      score: 95,
      emoji: "💪"
    },
    {
      category: "Skin Quality",
      score: 95,
      emoji: "✨"
    },
    {
      category: "Cheekbones",
      score: 90,
      emoji: "👤"
    },
    {
      category: "Eyes",
      score: 95,
      emoji: "👁️"
    }
  ];

  const skinAdvice = [
    {
      title: "Drink Plenty of Water",
      description: "Proper hydration starts from within. Drink an adequate amount of water throughout the day to keep your body and skin hydrated.",
      icon: Droplet
    },
    {
      title: "Skincare Routine",
      description: "Use gentle, hydrating cleansers, moisturizers, and serums formulated with ingredients like hyaluronic acid, glycerin, ceramides, and aloe vera.",
      icon: Sparkles
    }
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6 px-4 pb-20 max-w-md mx-auto"
    >
      <Card className="bg-black/30 backdrop-blur-lg border-white/10">
        <CardContent className="p-6 space-y-6">
          <div className="text-center space-y-2">
            <Avatar className="w-24 h-24 mx-auto border-4 border-white/10">
              <AvatarImage src="/placeholder.svg" alt="Profile" />
              <AvatarFallback>
                <User className="w-12 h-12" />
              </AvatarFallback>
            </Avatar>
            <h2 className="text-3xl font-bold text-white">You're a 10</h2>
            <p className="text-green-400">Top 5% of users</p>
          </div>

          <div className="space-y-4">
            {analysisResults.map((item, index) => (
              <motion.div
                key={item.category}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center justify-between bg-white/5 p-3 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{item.emoji}</span>
                  <span className="text-white">{item.category}</span>
                </div>
                <span className="text-xl font-bold text-white">{item.score}</span>
              </motion.div>
            ))}
          </div>

          <div className="pt-4 space-y-4">
            {skinAdvice.map((advice, index) => (
              <motion.div
                key={advice.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 + (index * 0.1) }}
                className="bg-white/5 p-4 rounded-lg space-y-2"
              >
                <div className="flex items-center gap-2">
                  <advice.icon className="w-5 h-5 text-green-400" />
                  <h3 className="text-white font-medium">{advice.title}</h3>
                </div>
                <p className="text-white/70 text-sm leading-relaxed">
                  {advice.description}
                </p>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="flex justify-center gap-4 pt-4"
          >
            <Button
              variant="outline"
              size="lg"
              className="rounded-full bg-white/10 hover:bg-white/20 text-white border-none"
              onClick={() => {}}
            >
              <Share2 className="w-5 h-5 mr-2" />
              Share Results
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="rounded-full bg-white/10 hover:bg-white/20 text-white border-none"
              onClick={() => {}}
            >
              <Camera className="w-5 h-5 mr-2" />
              New Scan
            </Button>
          </motion.div>
        </CardContent>
      </Card>
    </motion.div>
  );
};