import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChevronRight } from "lucide-react";

export const TipsView = () => {
  const styleAnalysis = [
    {
      category: "Overall",
      score: 70,
      level: "Average",
      advice: "You've got strong jawline, keep clean shave",
      color: "from-orange-500 to-orange-300"
    },
    {
      category: "Potential",
      score: 80,
      level: "High",
      advice: "Great potential for improvement",
      color: "from-green-500 to-green-300"
    },
    {
      category: "Jawline",
      score: 60,
      level: "Medium",
      advice: "Consider facial exercises",
      color: "from-orange-500 to-orange-300"
    },
    {
      category: "Masculinity",
      score: 75,
      level: "High",
      advice: "Strong masculine features",
      color: "from-blue-500 to-blue-300"
    }
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6 px-4 pb-20"
    >
      <Card className="bg-black/30 backdrop-blur-lg border-white/10">
        <CardContent className="p-6">
          <ScrollArea className="h-[70vh] pr-4">
            <div className="space-y-4">
              {styleAnalysis.map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="bg-black/50 backdrop-blur-lg border-white/10">
                    <CardContent className="p-4 space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-xl font-semibold text-white">{item.category}</span>
                        <span className="text-3xl font-bold text-white">{item.score}</span>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-400">{item.level}</span>
                          <span className="text-gray-400">Top 50% of men</span>
                        </div>
                        
                        <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                          <div 
                            className={`h-full bg-gradient-to-r ${item.color}`}
                            style={{ width: `${item.score}%` }}
                          />
                        </div>
                        
                        <div className="flex justify-between items-center text-sm mt-2">
                          <span className="text-gray-300">{item.advice}</span>
                          <button className="flex items-center text-gray-400 hover:text-white transition-colors">
                            View Advice
                            <ChevronRight className="w-4 h-4 ml-1" />
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