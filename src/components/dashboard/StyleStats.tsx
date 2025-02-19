
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Trophy, TrendingUp, Flame } from "lucide-react";

interface StyleStatsProps {
  hasScans: boolean;
  stats: {
    averageScore: number;
    bestScore: number;
    streak: number;
  };
}

export const StyleStats = ({ hasScans, stats }: StyleStatsProps) => {
  const styleStats = [{
    title: "Style Score",
    value: hasScans ? `${stats.averageScore}` : "--",
    icon: Trophy,
    color: "text-[#9b87f5]",
    emptyState: "Take your first style scan!"
  }, {
    title: "Best Score",
    value: hasScans ? `${stats.bestScore}` : "--",
    icon: TrendingUp,
    color: "text-[#7E69AB]",
    emptyState: "Start scanning outfits"
  }, {
    title: "Style Streak",
    value: hasScans ? `${stats.streak} ${stats.streak === 1 ? 'day' : 'days'}` : "--",
    icon: Flame,
    color: "text-[#D6BCFA]",
    emptyState: "Start your streak"
  }];

  return (
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
              {hasScans ? (
                <p className={cn("text-lg font-bold", stat.color)}>{stat.value}</p>
              ) : (
                <p className="text-xs text-[#C8C8C9] text-center">{stat.emptyState}</p>
              )}
              <p className="text-xs text-[#C8C8C9] text-center">{stat.title}</p>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
};
