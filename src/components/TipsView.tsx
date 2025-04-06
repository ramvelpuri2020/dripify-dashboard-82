
import React, { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Camera, 
  Lightbulb,
  ChevronDown,
  ChevronUp,
  Sparkles
} from "lucide-react";
import { useScanStore } from "@/store/scanStore";
import { Button } from "./ui/button";
import { useNavigate } from "react-router-dom";
import { StyleTip } from "@/types/styleTypes";

export const TipsView = () => {
  const latestScan = useScanStore((state) => state.latestScan);
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [expandedTips, setExpandedTips] = useState<string[]>([]);

  const toggleCategory = (category: string) => {
    if (selectedCategory === category) {
      setSelectedCategory(null);
    } else {
      setSelectedCategory(category);
    }
  };

  const toggleTipExpand = (tipId: string) => {
    if (expandedTips.includes(tipId)) {
      setExpandedTips(expandedTips.filter(id => id !== tipId));
    } else {
      setExpandedTips([...expandedTips, tipId]);
    }
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

  // Get unique categories from tips
  const categories = latestScan.tips ? 
    Array.from(new Set(latestScan.tips.map(tip => tip.category))) : [];

  // Filter tips by selected category if there is one
  const filteredTips = selectedCategory && latestScan.tips ? 
    latestScan.tips.filter(tip => tip.category === selectedCategory) : 
    latestScan.tips || [];

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
            <h2 className="text-2xl font-bold text-white/90 tracking-tight mb-2">Style Tips</h2>
            <p className="text-white/80">
              Based on your style score of <span className="font-bold text-purple-400">{latestScan.overallScore}/10</span>, 
              here are personalized tips to improve your outfit.
            </p>
          </div>
          
          {categories.length > 0 && (
            <div className="flex gap-2 flex-wrap mb-4">
              <button
                onClick={() => setSelectedCategory(null)}
                className={`text-xs rounded-full px-3 py-1 ${
                  selectedCategory === null 
                    ? 'bg-purple-500 text-white' 
                    : 'bg-white/10 text-white/70 hover:bg-white/20'
                }`}
              >
                All
              </button>
              {categories.map(category => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`text-xs rounded-full px-3 py-1 ${
                    selectedCategory === category 
                      ? 'bg-purple-500 text-white' 
                      : 'bg-white/10 text-white/70 hover:bg-white/20'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          )}
          
          <ScrollArea className="h-[70vh] pr-4">
            <div className="space-y-5">
              {filteredTips.length > 0 ? (
                filteredTips.map((tip, index) => (
                  <motion.div
                    key={`${tip.category}-${index}`}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card className={`
                      backdrop-blur-lg border-white/10 transition-all duration-300 
                      hover:shadow-lg hover:border-purple-500/20
                      ${tip.level === 'advanced' 
                        ? 'bg-gradient-to-br from-purple-900/20 to-pink-900/20 border-purple-500/20' 
                        : 'bg-gradient-to-br from-[#1A1F2C]/90 to-[#2C1F3D]/90 border-white/10'}
                    `}>
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <div className={`p-2 rounded-full flex-shrink-0 ${
                            tip.level === 'advanced' 
                              ? 'bg-pink-500/20' 
                              : tip.level === 'beginner'
                                ? 'bg-blue-500/20'
                                : 'bg-purple-500/20'
                          }`}>
                            {tip.level === 'advanced' ? (
                              <Sparkles className="w-4 h-4 text-pink-400" />
                            ) : (
                              <Lightbulb className="w-4 h-4 text-purple-400" />
                            )}
                          </div>
                          <div className="flex-1">
                            <p className="text-sm text-white/90 leading-relaxed">{tip.tip}</p>
                            <div className="flex items-center mt-2">
                              <span className="text-xs text-white/50">{tip.category}</span>
                              <div className="ml-auto">
                                <span className={`text-xs px-2 py-0.5 rounded-full ${
                                  tip.level === 'advanced'
                                    ? 'bg-pink-500/20 text-pink-300'
                                    : tip.level === 'beginner'
                                      ? 'bg-blue-500/20 text-blue-300'
                                      : 'bg-purple-500/20 text-purple-300'
                                }`}>
                                  {tip.level}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))
              ) : (
                <div className="text-center py-8 text-white/50">
                  {selectedCategory 
                    ? `No tips available for ${selectedCategory}`
                    : 'No style tips available'
                  }
                </div>
              )}
              
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
