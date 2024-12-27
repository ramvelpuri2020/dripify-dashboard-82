import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";
import { useState } from "react";

export const DashboardView = () => {
  const [date, setDate] = useState<Date | undefined>(new Date());

  const dailyTips = {
    Monday: "Focus on color coordination - try matching accessories with your outfit",
    Tuesday: "Experiment with layering different pieces",
    Wednesday: "Clean and maintain your shoes",
    Thursday: "Plan your outfits for the weekend",
    Friday: "Try mixing patterns thoughtfully",
    Saturday: "Shop for essential pieces you're missing",
    Sunday: "Organize your wardrobe for the week ahead"
  };

  const getDayTip = (date: Date | undefined) => {
    if (!date) return "";
    const day = date.toLocaleDateString('en-US', { weekday: 'long' });
    return dailyTips[day as keyof typeof dailyTips] || "Take time to experiment with your style";
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6 px-4"
    >
      <Card className="bg-black/30 backdrop-blur-lg border-white/10">
        <CardHeader>
          <CardTitle className="text-white">Daily Style Reminder</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-white/80">{getDayTip(date)}</p>
        </CardContent>
      </Card>

      <Card className="bg-black/30 backdrop-blur-lg border-white/10">
        <CardHeader>
          <CardTitle className="text-white">Style Calendar</CardTitle>
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
    </motion.div>
  );
};