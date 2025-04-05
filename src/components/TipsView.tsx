
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  ChevronRight, 
  Star, 
  Palette, 
  Ruler, 
  Crown, 
  Sparkles, 
  Wand2, 
  Camera, 
  Lightbulb,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { useScanStore } from "@/store/scanStore";
import { Button } from "./ui/button";
import { useNavigate } from "react-router-dom";
import { useState } from "react";

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
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});
  
  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

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

  // Find matching tips for each category
  const getCategoryTips = (category: string) => {
    if (!latestScan.styleTips) return [];
    
    const categoryTips = latestScan.styleTips.find(item => item.category === category);
    return categoryTips ? categoryTips.tips : [];
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6 px-4 pb-20"
    >
      <Card className="bg-gradient-to-br from-[#1A1F2C]/80 to-[#2C1F3D]/80 backdrop-blur-lg border-white/10 shadow-xl">
        <CardContent className="p-6">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-white/90 tracking-tight mb-2">Style Improvement Tips</h2>
            <p className="text-white/80">
              Based on your style score of <span className="font-bold text-purple-400">{latestScan.totalScore}/10</span>, 
              here are personalized recommendations to elevate your look.
            </p>
          </div>
          
          <ScrollArea className="h-[70vh] pr-4">
            <div className="space-y-5">
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
                            <div className="flex items-center gap-2">
                              <p className="text-sm text-white/60">
                                Current Score: {item.score}/10
                              </p>
                              <div className={`text-xs px-2 py-0.5 rounded-full ${
                                item.score >= 8 ? 'bg-green-500/20 text-green-400' : 
                                item.score >= 6 ? 'bg-yellow-500/20 text-yellow-400' : 
                                'bg-red-500/20 text-red-400'
                              }`}>
                                {item.score >= 8 ? 'Great' : item.score >= 6 ? 'Good' : 'Needs Work'}
                              </div>
                            </div>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-white/60 hover:text-white hover:bg-white/10"
                          onClick={() => toggleCategory(item.category)}
                        >
                          {expandedCategories[item.category] ? (
                            <ChevronUp className="h-5 w-5" />
                          ) : (
                            <ChevronDown className="h-5 w-5" />
                          )}
                        </Button>
                      </div>
                      
                      <div className="space-y-4">
                        <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${(item.score / 10) * 100}%` }}
                            transition={{ delay: index * 0.1 + 0.3, duration: 0.5 }}
                            className={`h-full ${
                              item.score >= 8 ? 'bg-gradient-to-r from-green-500 to-green-400' : 
                              item.score >= 6 ? 'bg-gradient-to-r from-yellow-500 to-yellow-400' : 
                              'bg-gradient-to-r from-red-500 to-red-400'
                            }`}
                          />
                        </div>
                        
                        {item.details && (
                          <div className="text-sm text-white/80 mb-3 leading-relaxed">
                            {item.details}
                          </div>
                        )}
                        
                        <div className="bg-black/20 rounded-lg p-4 space-y-2">
                          <div className="flex items-center gap-2 text-purple-400 font-medium mb-3">
                            <Lightbulb className="w-4 h-4" />
                            <span>Improvement Tips</span>
                          </div>
                          
                          <div className={expandedCategories[item.category] ? "" : "space-y-2"}>
                            {getCategoryTips(item.category).length > 0 ? (
                              expandedCategories[item.category] ? (
                                // Show all tips when expanded
                                getCategoryTips(item.category).map((tip, i) => (
                                  <div key={i} className="flex gap-2 items-start mb-3">
                                    <ChevronRight className="w-4 h-4 text-purple-400 mt-1 flex-shrink-0" />
                                    <p className="text-sm text-white/80 leading-relaxed">{tip}</p>
                                  </div>
                                ))
                              ) : (
                                // Show only first 2 tips when collapsed
                                <>
                                  {getCategoryTips(item.category).slice(0, 2).map((tip, i) => (
                                    <div key={i} className="flex gap-2 items-start">
                                      <ChevronRight className="w-4 h-4 text-purple-400 mt-1 flex-shrink-0" />
                                      <p className="text-sm text-white/80 leading-relaxed">{tip}</p>
                                    </div>
                                  ))}
                                  {getCategoryTips(item.category).length > 2 && (
                                    <div className="mt-2 text-center">
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="text-xs text-purple-400 hover:text-purple-300"
                                        onClick={() => toggleCategory(item.category)}
                                      >
                                        Show {getCategoryTips(item.category).length - 2} more tips
                                        <ChevronDown className="ml-1 h-3 w-3" />
                                      </Button>
                                    </div>
                                  )}
                                </>
                              )
                            ) : (
                              <div className="flex gap-2 items-start">
                                <ChevronRight className="w-4 h-4 text-purple-400 mt-0.5 flex-shrink-0" />
                                <p className="text-sm text-white/80 italic">
                                  Personalized tips are being generated for this category.
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}

              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: latestScan.breakdown.length * 0.1 }}
                className="mt-4"
              >
                <Card className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 backdrop-blur-lg border-purple-500/30 transition-all duration-300">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 bg-purple-500/30 rounded-full">
                        <Wand2 className="w-5 h-5 text-purple-400" />
                      </div>
                      <h3 className="text-lg font-semibold text-white/90 tracking-tight">
                        Next Level Style
                      </h3>
                    </div>
                    
                    <p className="text-white/80 text-sm mb-4">
                      Ready to take your style to a perfect 10? Try these overall recommendations:
                    </p>
                    
                    <div className="space-y-3">
                      {latestScan.nextLevelTips && latestScan.nextLevelTips.length > 0 ? (
                        latestScan.nextLevelTips.map((tip, i) => (
                          <div key={i} className="flex gap-2 items-start">
                            <ChevronRight className="w-4 h-4 text-purple-400 mt-1 flex-shrink-0" />
                            <p className="text-sm text-white/80 leading-relaxed">{tip}</p>
                          </div>
                        ))
                      ) : (
                        // Fallback tips if nextLevelTips aren't available
                        [
                          "Experiment with layering to add depth and visual interest to simple pieces.",
                          "Consider adding statement accessories that reflect your personality.",
                          "Try incorporating one trend piece with your timeless basics for a modern edge.",
                          "Focus on fabric quality - even simple pieces look elevated in premium materials."
                        ].map((tip, i) => (
                          <div key={i} className="flex gap-2 items-start">
                            <ChevronRight className="w-4 h-4 text-purple-400 mt-0.5 flex-shrink-0" />
                            <p className="text-sm text-white/80">{tip}</p>
                          </div>
                        ))
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
              
              <div className="flex justify-center mt-6">
                <Button 
                  onClick={() => navigate('/scan')}
                  className="bg-purple-500 hover:bg-purple-600"
                >
                  Analyze Another Outfit
                </Button>
              </div>
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default TipsView;
