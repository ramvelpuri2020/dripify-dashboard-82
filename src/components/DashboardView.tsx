import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";
import { useState } from "react";
import { Sparkles, Flame, Trophy, TrendingUp, Calendar as CalendarIcon, Star } from "lucide-react";
import { cn } from "@/lib/utils";

export const DashboardView = () => {
  const [date, setDate] = useState<Date | undefined>(new Date());

  const styleStats = [
    { title: "Style Score", value: "8.5", icon: Trophy, color: "text-yellow-500" },
    { title: "Trending", value: "+15%", icon: TrendingUp, color: "text-green-500" },
    { title: "Style Streak", value: "7 days", icon: Flame, color: "text-orange-500" },
  ];

  const styleInsights = {
    strengths: ["Color coordination", "Accessorizing", "Proportions"],
    suggestions: ["Try layering pieces", "Experiment with textures", "Add statement accessories"]
  };

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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {styleStats.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="bg-black/30 backdrop-blur-lg border-white/10 hover:bg-black/40 transition-all">
              <CardContent className="p-6 flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm text-white/60">{stat.title}</p>
                  <p className={cn("text-2xl font-bold", stat.color)}>{stat.value}</p>
                </div>
                <stat.icon className={cn("w-8 h-8", stat.color)} />
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Style Insights */}
      <Card className="bg-black/30 backdrop-blur-lg border-white/10">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-400" />
            Style Insights
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-white/60">Your Strengths</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {styleInsights.strengths.map((strength, index) => (
                <motion.div
                  key={strength}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white/5 rounded-lg p-3 flex items-center gap-2"
                >
                  <Star className="w-4 h-4 text-yellow-400" />
                  <span className="text-white/80 text-sm">{strength}</span>
                </motion.div>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-medium text-white/60">Style Suggestions</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {styleInsights.suggestions.map((suggestion, index) => (
                <motion.div
                  key={suggestion}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-lg p-3"
                >
                  <p className="text-white/80 text-sm">{suggestion}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Calendar & Events */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
      </div>
    </motion.div>
  );
};