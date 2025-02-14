import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";
import { useState } from "react";
import { Trophy, TrendingUp, Flame, Camera, History, ArrowRight, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./ui/button";
import { useNavigate } from "react-router-dom";
export const DashboardView = () => {
  const navigate = useNavigate();
  const [hasScans] = useState(false); // This will be connected to real data later

  const styleStats = [{
    title: "Style Score",
    value: hasScans ? "8.5" : "--",
    icon: Trophy,
    color: "text-[#9b87f5]",
    emptyState: "Take your first style scan!"
  }, {
    title: "Trending",
    value: hasScans ? "+15%" : "--",
    icon: TrendingUp,
    color: "text-[#7E69AB]",
    emptyState: "Track your progress"
  }, {
    title: "Style Streak",
    value: hasScans ? "7 days" : "--",
    icon: Flame,
    color: "text-[#D6BCFA]",
    emptyState: "Start your streak"
  }];
  const quickStartCards = [{
    title: "Work Style",
    description: "Professional looks that make an impact",
    icon: "👔"
  }, {
    title: "Casual Vibes",
    description: "Effortless everyday outfits",
    icon: "✨"
  }, {
    title: "Evening Out",
    description: "Make a statement after dark",
    icon: "🌙"
  }];
  return <motion.div initial={{
    opacity: 0,
    y: 20
  }} animate={{
    opacity: 1,
    y: 0
  }} transition={{
    duration: 0.5
  }} className="space-y-6 px-4 pb-20 max-w-2xl mx-auto">
      {/* Welcome Section */}
      <motion.div initial={{
      opacity: 0,
      y: 20
    }} animate={{
      opacity: 1,
      y: 0
    }} className="py-6">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-[#9b87f5] to-[#D6BCFA] text-transparent bg-clip-text">
          Welcome to DripCheck
        </h1>
        <p className="text-[#C8C8C9] text-sm mt-1">Let's discover your unique style</p>
      </motion.div>

      {/* Getting Started Guide */}
      <Card className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-purple-500/20">
        <CardContent className="p-6 bg-slate-900 hover:bg-slate-800">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-400" />
              <h3 className="text-lg font-semibold text-slate-50">Getting Started</h3>
            </div>
            <Button onClick={() => navigate('/scan')} className="bg-purple-500 hover:bg-purple-600 transition-colors group rounded">
              <Camera className="w-4 h-4 mr-2" />
              New Scan
              <motion.div animate={{
              x: [0, 4, 0]
            }} transition={{
              repeat: Infinity,
              duration: 1.5
            }}>
                <ArrowRight className="w-4 h-4 ml-2" />
              </motion.div>
            </Button>
          </div>
          <div className="grid gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center">
                1
              </div>
              <p className="text-white/80">Take a photo of your outfit</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center">
                2
              </div>
              <p className="text-white/80">Get instant style feedback</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center">
                3
              </div>
              <p className="text-white/80">Build your style profile</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Overview */}
      <div className="grid grid-cols-3 gap-3">
        {styleStats.map((stat, index) => <motion.div key={stat.title} initial={{
        opacity: 0,
        y: 20
      }} animate={{
        opacity: 1,
        y: 0
      }} transition={{
        delay: index * 0.1
      }}>
            <Card className="bg-[#1A1F2C]/80 backdrop-blur-lg border-[#403E43] hover:border-[#9b87f5]/50 transition-all duration-300">
              <CardContent className="p-4 flex flex-col items-center justify-center space-y-2">
                <stat.icon className={cn("w-5 h-5", stat.color)} />
                {hasScans ? <p className={cn("text-lg font-bold", stat.color)}>{stat.value}</p> : <p className="text-xs text-[#C8C8C9] text-center">{stat.emptyState}</p>}
                <p className="text-xs text-[#C8C8C9] text-center">{stat.title}</p>
              </CardContent>
            </Card>
          </motion.div>)}
      </div>

      {/* Quick Start Section */}
      <Card className="bg-[#1A1F2C]/80 backdrop-blur-lg border-[#403E43]">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-white text-lg flex items-center gap-2">
              <History className="w-4 h-4 text-[#9b87f5]" />
              Quick Start
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {quickStartCards.map((card, index) => <motion.div key={card.title} initial={{
            opacity: 0,
            x: -20
          }} animate={{
            opacity: 1,
            x: 0
          }} transition={{
            delay: index * 0.1
          }} className="group cursor-pointer" onClick={() => navigate('/scan')}>
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
              </motion.div>)}
          </div>
        </CardContent>
      </Card>
    </motion.div>;
};