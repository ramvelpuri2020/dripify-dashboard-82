import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";
import { useState } from "react";
import { Sparkles, Flame, Trophy, TrendingUp, Calendar as CalendarIcon, Star, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { DripScore } from "./DripScore";

export const DashboardView = () => {
  const [date, setDate] = useState<Date | undefined>(new Date());

  const recentAnalyses = [
    {
      date: "2024-03-15",
      score: 95,
      image: "/lovable-uploads/c66bd2c7-afe7-4e2b-bc68-7739960140cd.png",
      title: "Evening Look"
    },
    {
      date: "2024-03-14",
      score: 88,
      image: "/lovable-uploads/137c02b0-edb2-489d-a400-f827af28d139.png",
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
      className="space-y-6 px-4"
    >
      {/* Stats Overview */}
      <div className="grid grid-cols-3 gap-4">
        {styleStats.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="bg-black/30 backdrop-blur-lg border-white/10 hover:bg-black/40 transition-all">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm text-white/60">{stat.title}</p>
                  <p className={cn("text-2xl font-bold", stat.color)}>{stat.value}</p>
                </div>
                <stat.icon className={cn("w-6 h-6", stat.color)} />
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Calendar Section */}
      <Card className="bg-black/30 backdrop-blur-lg border-white/10">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-blue-400" />
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
        </CardContent>
      </Card>

      {/* Recent Analyses */}
      <Card className="bg-black/30 backdrop-blur-lg border-white/10">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Star className="w-5 h-5 text-yellow-400" />
            Recent Style Analyses
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentAnalyses.map((analysis, index) => (
              <motion.div
                key={analysis.date}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center justify-between p-4 rounded-lg bg-white/5 hover:bg-white/10 transition-all cursor-pointer"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full overflow-hidden">
                    <img src={analysis.image} alt={analysis.title} className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <p className="text-white font-medium">{analysis.title}</p>
                    <p className="text-white/60 text-sm">{analysis.date}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-green-400 font-bold">{analysis.score}</span>
                  <ChevronRight className="w-5 h-5 text-white/60" />
                </div>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Upcoming Events */}
      <Card className="bg-black/30 backdrop-blur-lg border-white/10">
        <CardHeader>
          <CardTitle className="text-white">Upcoming Events</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {upcomingEvents.map((event, index) => (
              <motion.div
                key={event.date}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center justify-between p-3 rounded-lg bg-white/5"
              >
                <span className="text-white/80">{event.event}</span>
                <span className="text-sm text-white/60">{new Date(event.date).toLocaleDateString()}</span>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};