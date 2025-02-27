import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChevronRight, Star, Palette, Ruler, Crown, Sparkles, Wand2, Camera } from "lucide-react";
import { useScanStore } from "@/store/scanStore";
import { Button } from "./ui/button";
import { useNavigate } from "react-router-dom";

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
  const latestScan = useScanStore((state) => state.latestScan);
  const navigate = useNavigate();

  if (!latestScan) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] p-4">
        <div className="text-center space-y-4">
          <Camera className="w-12 h-12 text-purple-400 mx-auto" />
          <h2 className="text-xl font-semibold text-white">No Style Analysis Yet</h2>
          <p className="text-white/60 max-w-sm">
            Take your first style scan to get personalized tips and insights about your outfit
          </p>
          <Button 
            onClick={() => navigate('/scan')}
            className="bg-purple-500 hover:bg-purple-600"
          >
            Take a Style Scan
          </Button>
        </div>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6 px-4 pb-20"
    >
      <Card className="bg-gradient-to-br from-[#1A1F2C]/80 to-[#2C1F3D]/80 backdrop-blur-lg border-white/10 shadow-xl">
        <CardContent className="p-6">
          {latestScan.feedback && (
            <div className="mb-6">
              <p className="text-white/80">{latestScan.feedback}</p>
            </div>
          )}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white/90 tracking-tight">Style Analysis</h2>
            <div className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 text-transparent bg-clip-text">
              {latestScan.totalScore}/10
            </div>
          </div>
          
          <ScrollArea className="h-[70vh] pr-4">
            <div className="grid gap-4">
              {latestScan.breakdown.map((item, index) => (
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
                              Score: {item.score}/10
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="space-y-4">
                        <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${(item.score / 10) * 100}%` }}
                            transition={{ delay: index * 0.1 + 0.3, duration: 0.5 }}
                            className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
                          />
                        </div>
                        
                        <div className="text-sm text-white/70">
                          {item.details}
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

export default TipsView;
