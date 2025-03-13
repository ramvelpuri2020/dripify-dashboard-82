
import { Share2, Save, ChevronRight } from "lucide-react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { motion } from "framer-motion";
import { Avatar, AvatarImage, AvatarFallback } from "./ui/avatar";
import { ScrollArea } from "./ui/scroll-area";

interface ScoreBreakdown {
  category: string;
  score: number;
  emoji: string;
}

interface Tip {
  category: string;
  suggestion: string;
  priority: 'high' | 'medium' | 'low';
}

interface DripResultsProps {
  totalScore: number;
  breakdown: ScoreBreakdown[];
  feedback: string;
  onShare: () => void;
  onSave?: () => void;
  profileImage?: string;
  tips?: Tip[];
}

export const DripResults = ({
  totalScore,
  breakdown,
  feedback,
  onShare,
  onSave,
  profileImage,
  tips = []
}: DripResultsProps) => {
  return (
    <div className="w-full max-w-md mx-auto space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-4"
      >
        <Avatar className="w-20 h-20 mx-auto border-2 border-white/20">
          <AvatarImage src={profileImage} alt="Profile" />
          <AvatarFallback>👤</AvatarFallback>
        </Avatar>
        <div className="space-y-2">
          <h2 className="text-4xl font-bold text-white">{totalScore}/10</h2>
          <p className="text-xl text-green-400">Style Score</p>
          <p className="text-sm text-white/60">Based on fit, color coordination, and style elements</p>
        </div>
      </motion.div>

      <div className="grid grid-cols-2 gap-4">
        {breakdown.map((item, index) => (
          <motion.div
            key={item.category}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="bg-black/30 backdrop-blur-lg border-white/10 p-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{item.emoji}</span>
                  <span className="text-sm text-white/80">{item.category}</span>
                </div>
                <div className="relative h-2 bg-white/10 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(item.score / 10) * 100}%` }}
                    className="absolute top-0 left-0 h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"
                    transition={{ duration: 1 }}
                  />
                </div>
                <span className="text-lg font-bold text-white">{item.score}</span>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-black/30 backdrop-blur-lg border-white/10 rounded-lg p-6"
      >
        <h3 className="text-lg font-semibold text-white mb-4">Style Tips</h3>
        <ScrollArea className="h-[200px] pr-4">
          <div className="space-y-4">
            {tips.map((tip, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="bg-black/20 border-white/5 p-4">
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-full ${
                      tip.priority === 'high' ? 'bg-red-500/20' :
                      tip.priority === 'medium' ? 'bg-yellow-500/20' :
                      'bg-green-500/20'
                    }`}>
                      <ChevronRight className={`w-4 h-4 ${
                        tip.priority === 'high' ? 'text-red-500' :
                        tip.priority === 'medium' ? 'text-yellow-500' :
                        'text-green-500'
                      }`} />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white/90">{tip.category}</p>
                      <p className="text-sm text-white/60">{tip.suggestion}</p>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </ScrollArea>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="flex justify-center gap-4"
      >
        <Button
          variant="outline"
          size="lg"
          className="rounded-full bg-white hover:bg-white/90 text-black border-none"
          onClick={onSave}
        >
          <Save className="w-5 h-5 mr-2" />
          Save
        </Button>
        <Button
          variant="outline"
          size="lg"
          className="rounded-full bg-white hover:bg-white/90 text-black border-none"
          onClick={onShare}
        >
          <Share2 className="w-5 h-5 mr-2" />
          Share
        </Button>
      </motion.div>
    </div>
  );
};
