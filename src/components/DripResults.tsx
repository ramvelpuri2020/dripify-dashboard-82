import { Share2, Save } from "lucide-react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { motion } from "framer-motion";
import { Avatar, AvatarImage, AvatarFallback } from "./ui/avatar";

interface ScoreBreakdown {
  category: string;
  score: number;
  emoji: string;
}

interface DripResultsProps {
  totalScore: number;
  breakdown: ScoreBreakdown[];
  feedback: string;
  onShare: () => void;
  onSave?: () => void;
  profileImage?: string;
}

export const DripResults = ({
  totalScore,
  breakdown,
  feedback,
  onShare,
  onSave,
  profileImage,
}: DripResultsProps) => {
  return (
    <div className="w-full max-w-md mx-auto space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <Avatar className="w-24 h-24 mx-auto border-4 border-purple-500/20 mb-6">
          <AvatarImage src={profileImage} alt="Profile" />
          <AvatarFallback>👤</AvatarFallback>
        </Avatar>
        <div className="space-y-2">
          <h2 className="text-5xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            You're a {totalScore}
          </h2>
          <p className="text-xl font-medium text-yellow-500">Top Drip</p>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-black/30 backdrop-blur-lg border-white/10 rounded-lg p-6"
      >
        <p className="text-white/90 text-lg leading-relaxed text-center">
          {feedback}
        </p>
      </motion.div>

      <div className="grid grid-cols-2 gap-4">
        {breakdown.map((item, index) => (
          <motion.div
            key={item.category}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 + 0.3 }}
          >
            <Card className="bg-black/30 backdrop-blur-lg border-white/10 p-4">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{item.emoji}</span>
                  <span className="text-sm font-medium bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                    {item.category}
                  </span>
                </div>
                <div className="relative h-3 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="absolute top-0 left-0 h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-1000"
                    style={{ width: `${item.score * 10}%` }}
                  />
                </div>
                <span className="text-2xl font-bold text-white">{item.score}</span>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="flex justify-center gap-4"
      >
        <Button
          variant="outline"
          size="lg"
          className="rounded-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white border-none"
          onClick={onSave}
        >
          <Save className="w-5 h-5 mr-2" />
          Save
        </Button>
        <Button
          variant="outline"
          size="lg"
          className="rounded-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white border-none"
          onClick={onShare}
        >
          <Share2 className="w-5 h-5 mr-2" />
          Share
        </Button>
      </motion.div>
    </div>
  );
};