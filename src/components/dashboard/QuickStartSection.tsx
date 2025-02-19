
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles, Camera, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export const QuickStartSection = () => {
  const navigate = useNavigate();

  return (
    <Card className="bg-[#1A1F2C]/80 backdrop-blur-lg border-[#403E43]">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-white text-lg flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#9b87f5]" />
            Quick Start
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {[
            {
              title: "Work Style",
              description: "Professional looks that make an impact",
              icon: "👔"
            },
            {
              title: "Casual Vibes",
              description: "Effortless everyday outfits",
              icon: "✨"
            },
            {
              title: "Evening Out",
              description: "Make a statement after dark",
              icon: "🌙"
            }
          ].map((card, index) => (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="group cursor-pointer"
              onClick={() => navigate('/scan')}
            >
              <Card className="bg-[#222222] border-[#403E43] hover:bg-[#1A1F2C] transition-all duration-300">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-2xl">
                        {card.icon}
                      </div>
                      <div>
                        <p className="text-white font-medium group-hover:text-[#9b87f5] transition-colors">
                          {card.title}
                        </p>
                        <p className="text-[#C8C8C9] text-xs">{card.description}</p>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-purple-400 group-hover:translate-x-1 transition-transform" />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
