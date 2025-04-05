
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Camera, 
  Lightbulb
} from "lucide-react";
import { useScanStore } from "@/store/scanStore";
import { Button } from "./ui/button";
import { useNavigate } from "react-router-dom";
import ReactMarkdown from 'react-markdown';

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
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-white/90 tracking-tight mb-2">Style Analysis</h2>
            <p className="text-white/80">
              Based on your style score of <span className="font-bold text-purple-400">{latestScan.overallScore}/10</span>, 
              here are insights for your outfit.
            </p>
          </div>
          
          <ScrollArea className="h-[70vh] pr-4">
            <div className="space-y-5">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
              >
                <Card className="bg-gradient-to-br from-[#1A1F2C]/90 to-[#2C1F3D]/90 backdrop-blur-lg border-white/10 transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/10 hover:border-purple-500/20">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 bg-purple-500/30 rounded-full">
                        <Lightbulb className="w-5 h-5 text-purple-400" />
                      </div>
                      <h3 className="text-lg font-semibold text-white/90 tracking-tight">
                        Detailed Feedback
                      </h3>
                    </div>
                    
                    <div className="prose prose-invert max-w-none prose-pre:bg-black/30 prose-pre:border prose-pre:border-white/10">
                      <ReactMarkdown>
                        {latestScan.rawAnalysis}
                      </ReactMarkdown>
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
