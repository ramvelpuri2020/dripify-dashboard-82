import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";
import { useState } from "react";
import { Trophy, TrendingUp, Flame, Camera, History } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./ui/button";
import { useNavigate } from "react-router-dom";

export const DashboardView = () => {
  const navigate = useNavigate();
  
  const recentAnalyses = [
    {
      date: "2024-03-15",
      score: 95,
      title: "Evening Look",
      image: "/placeholder.svg"
    },
    {
      date: "2024-03-14",
      score: 88,
      title: "Casual Friday",
      image: "/placeholder.svg"
    }
  ];

  const styleStats = [
    { title: "Style Score", value: "8.5", icon: Trophy, color: "text-[#9b87f5]" },
    { title: "Trending", value: "+15%", icon: TrendingUp, color: "text-[#7E69AB]" },
    { title: "Style Streak", value: "7 days", icon: Flame, color: "text-[#D6BCFA]" },
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6 px-4 pb-20 max-w-2xl mx-auto"
    >
      {/* Header Section */}
      <div className="flex justify-between items-center py-6">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-[#9b87f5] to-[#D6BCFA] text-transparent bg-clip-text">
            GenStyle
          </h1>
          <p className="text-[#C8C8C9] text-sm mt-1">Your personal style assistant</p>
        </div>
        <Button 
          onClick={() => navigate('/scan')}
          className="bg-[#9b87f5] hover:bg-[#7E69AB] transition-colors"
        >
          <Camera className="w-4 h-4 mr-2" />
          New Scan
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-3 gap-3">
        {styleStats.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="bg-[#1A1F2C]/80 backdrop-blur-lg border-[#403E43] hover:border-[#9b87f5]/50 transition-all duration-300">
              <CardContent className="p-4 flex flex-col items-center justify-center space-y-2">
                <stat.icon className={cn("w-5 h-5", stat.color)} />
                <p className={cn("text-lg font-bold", stat.color)}>{stat.value}</p>
                <p className="text-xs text-[#C8C8C9] text-center">{stat.title}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Recent Analyses */}
      <Card className="bg-[#1A1F2C]/80 backdrop-blur-lg border-[#403E43]">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-white text-lg flex items-center gap-2">
              <History className="w-4 h-4 text-[#9b87f5]" />
              Recent Analyses
            </CardTitle>
            <Button variant="ghost" size="sm" className="text-[#9b87f5] hover:text-[#D6BCFA]">
              View All
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentAnalyses.map((analysis, index) => (
              <motion.div
                key={analysis.date}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="group cursor-pointer"
              >
                <Card className="bg-[#222222] border-[#403E43] hover:bg-[#1A1F2C] transition-all duration-300">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full overflow-hidden border border-[#403E43]">
                          <img 
                            src={analysis.image} 
                            alt={analysis.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div>
                          <p className="text-white font-medium group-hover:text-[#9b87f5] transition-colors">
                            {analysis.title}
                          </p>
                          <p className="text-[#C8C8C9] text-xs">{analysis.date}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[#9b87f5] font-bold">{analysis.score}</span>
                        <Trophy className="w-4 h-4 text-[#D6BCFA]" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};