import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChevronRight, Star, Palette, Ruler, Crown, Sparkles, Wand2 } from "lucide-react";

const getIconForCategory = (category: string) => {
  switch (category) {
    case "Overall Style":
      return Crown;
    case "Color Coordination":
      return Palette;
    case "Fit & Proportion":
      return Ruler;
    case "Accessories":
      return Star;
    case "Trend Alignment":
      return Sparkles;
    case "Style Expression":
      return Wand2;
    default:
      return Crown;
  }
};

export const TipsView = () => {
  const styleAnalysis = [
    {
      category: "Overall Style",
      score: 85,
      level: "Strong",
      advice: "Focus on creating cohesive outfits that reflect your personal style",
      color: "from-purple-500 to-pink-500"
    },
    {
      category: "Color Coordination",
      score: 88,
      level: "Excellent",
      advice: "Master color theory to create striking combinations",
      color: "from-blue-500 to-blue-300"
    },
    {
      category: "Fit & Proportion",
      score: 92,
      level: "Outstanding",
      advice: "Understanding body proportions enhances outfit balance",
      color: "from-green-500 to-green-300"
    },
    {
      category: "Accessories",
      score: 85,
      level: "Strong",
      advice: "Strategic accessorizing can elevate any outfit",
      color: "from-yellow-500 to-yellow-300"
    },
    {
      category: "Trend Alignment",
      score: 90,
      level: "Excellent",
      advice: "Stay current while maintaining authenticity",
      color: "from-red-500 to-red-300"
    },
    {
      category: "Style Expression",
      score: 87,
      level: "Strong",
      advice: "Your unique style voice sets you apart",
      color: "from-indigo-500 to-indigo-300"
    }
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6 px-4 pb-20"
    >
      <Card className="bg-gradient-to-br from-[#1A1F2C]/80 to-[#2C1F3D]/80 backdrop-blur-lg border-white/10 shadow-xl">
        <CardContent className="p-6">
          <h2 className="text-2xl font-bold mb-6 text-white/90 tracking-tight">Style Analysis</h2>
          <ScrollArea className="h-[70vh] pr-4">
            <div className="grid gap-4">
              {styleAnalysis.map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="group"
                >
                  <Card className="bg-gradient-to-br from-[#1A1F2C]/90 to-[#2C1F3D]/90 backdrop-blur-lg border-white/10 transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/10 hover:border-purple-500/20">
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-3">
                          {React.createElement(getIconForCategory(item.category), {
                            className: "w-6 h-6 text-purple-400"
                          })}
                          <div>
                            <h3 className="text-lg font-semibold text-white/90 tracking-tight">
                              {item.category}
                            </h3>
                            <p className="text-sm text-white/60">
                              {item.level}
                            </p>
                          </div>
                        </div>
                        <div className="flex flex-col items-end">
                          <span className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 text-transparent bg-clip-text">
                            {item.score}
                          </span>
                        </div>
                      </div>
                      
                      <div className="space-y-4">
                        <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${item.score}%` }}
                            transition={{ delay: index * 0.1 + 0.3, duration: 0.5 }}
                            className={`h-full bg-gradient-to-r ${item.color}`}
                          />
                        </div>
                        
                        <div className="flex justify-between items-center">
                          <p className="text-sm text-white/70 max-w-[70%]">
                            {item.advice}
                          </p>
                          <button className="flex items-center gap-1 text-sm text-purple-400 hover:text-purple-300 transition-colors group">
                            <span>Details</span>
                            <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                          </button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </motion.div>
  );
};