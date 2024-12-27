import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";
import { useState } from "react";
import { Trophy, TrendingUp, Flame, Calendar as CalendarIcon, Settings, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { DripScore } from "./DripScore";
import { Button } from "./ui/button";

export const DashboardView = () => {
  const [date, setDate] = useState<Date | undefined>(new Date());

  const recentAnalyses = [
    {
      date: "2024-03-15",
      score: 95,
      title: "Evening Look"
    },
    {
      date: "2024-03-14",
      score: 88,
      title: "Casual Friday"
    }
  ];

  const styleStats = [
    { title: "Style Score", value: "8.5", icon: Trophy, color: "text-yellow-500" },
    { title: "Trending", value: "+15%", icon: TrendingUp, color: "text-green-500" },
    { title: "Style Streak", value: "7 days", icon: Flame, color: "text-orange-500" },
  ];

  const upcomingEvents = [
    { date: "2024-03-20", event: "Spring Fashion Week" },
    { date: "2024-03-25", event: "Networking Event" },
    { date: "2024-04-01", event: "Fashion Workshop" }
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6 px-4 pb-20"
    >
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-white">GenStyle</h1>
        <Button variant="ghost" size="icon" className="text-white">
          <Settings className="w-5 h-5" />
        </Button>
      </div>

      {/* Stats Overview in a single row */}
      <div className="flex justify-between gap-2">
        {styleStats.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="flex-1"
          >
            <Card className="bg-black/30 backdrop-blur-lg border-white/10 hover:bg-black/40 transition-all">
              <CardContent className="p-4">
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <stat.icon className={cn("w-4 h-4", stat.color)} />
                    <p className={cn("text-lg font-bold", stat.color)}>{stat.value}</p>
                  </div>
                  <p className="text-xs text-white/60">{stat.title}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Calendar Section */}
      <Card className="bg-black/30 backdrop-blur-lg border-white/10">
        <CardHeader className="pb-2">
          <CardTitle className="text-white flex items-center gap-2 text-lg">
            <CalendarIcon className="w-4 h-4 text-blue-400" />
            Style Calendar
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Calendar
            mode="single"
            selected={date}
            onSelect={setDate}
            className="text-white rounded-md border border-white/10"
          />
          <div className="mt-4 space-y-2">
            {upcomingEvents.map((event, index) => (
              <motion.div
                key={event.date}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center justify-between p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-all"
              >
                <span className="text-white/80 text-sm">{event.event}</span>
                <span className="text-xs text-white/60">{new Date(event.date).toLocaleDateString()}</span>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Analyses */}
      <Card className="bg-black/30 backdrop-blur-lg border-white/10">
        <CardHeader className="pb-2">
          <CardTitle className="text-white text-lg">Recent Style Analyses</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {recentAnalyses.map((analysis, index) => (
              <motion.div
                key={analysis.date}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center justify-between p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-all cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center">
                    <span className="text-xs text-white/60">Style</span>
                  </div>
                  <div>
                    <p className="text-white text-sm font-medium">{analysis.title}</p>
                    <p className="text-white/60 text-xs">{analysis.date}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-green-400 text-sm font-bold">{analysis.score}</span>
                  <ChevronRight className="w-4 h-4 text-white/60" />
                </div>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};