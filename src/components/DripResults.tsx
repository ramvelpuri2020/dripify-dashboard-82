
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
  details?: string;
}

interface StyleTip {
  category: string;
  tips: string[];
}

interface DripResultsProps {
  totalScore: number;
  breakdown: ScoreBreakdown[];
  feedback: string;
  onShare: () => void;
  onSave?: () => void;
  profileImage?: string;
  styleTips?: StyleTip[];
  nextLevelTips?: string[];
}

export const DripResults = ({
  totalScore,
  breakdown = [],
  feedback = "",
  onShare,
  onSave,
  profileImage,
  styleTips = [],
  nextLevelTips = []
}: DripResultsProps) => {
  // Ensure totalScore is a number and round it
  const displayScore = typeof totalScore === 'number' ? Math.round(totalScore) : 7;

  // Ensure breakdown items have valid scores
  const validBreakdown = breakdown.map(item => ({
    ...item,
    score: typeof item.score === 'number' ? Math.round(item.score) : 7,
    emoji: item.emoji || "⭐",
    details: item.details || `Score: ${item.score}/10`
  }));

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
          <h2 className="text-4xl font-bold text-white">{displayScore}/10</h2>
          <p className="text-xl text-green-400">Style Score</p>
          <p className="text-sm text-white/60">Based on fit, color coordination, and style elements</p>
        </div>
      </motion.div>

      <div className="grid grid-cols-2 gap-4">
        {validBreakdown.map((item, index) => (
          <motion.div
            key={`${item.category}-${index}`}
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
                {item.details && (
                  <p className="text-xs text-white/70 mt-1">{item.details}</p>
                )}
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
            {styleTips && styleTips.length > 0 ? (
              styleTips.map((categoryTips, categoryIndex) => (
                <div key={`category-${categoryIndex}`} className="space-y-2">
                  <h4 className="text-md font-medium text-white/90">{categoryTips.category}</h4>
                  {Array.isArray(categoryTips.tips) ? (
                    categoryTips.tips.map((tip, tipIndex) => (
                      <motion.div
                        key={`tip-${categoryIndex}-${tipIndex}`}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: tipIndex * 0.1 }}
                      >
                        <Card className="bg-black/20 border-white/5 p-3">
                          <div className="flex items-start gap-3">
                            <div className="p-2 rounded-full bg-purple-500/20">
                              <ChevronRight className="w-3 h-3 text-purple-500" />
                            </div>
                            <p className="text-sm text-white/80">{tip}</p>
                          </div>
                        </Card>
                      </motion.div>
                    ))
                  ) : (
                    <Card className="bg-black/20 border-white/5 p-3">
                      <div className="flex items-start gap-3">
                        <div className="p-2 rounded-full bg-purple-500/20">
                          <ChevronRight className="w-3 h-3 text-purple-500" />
                        </div>
                        <p className="text-sm text-white/80">Consider exploring different styles and combinations to enhance your look.</p>
                      </div>
                    </Card>
                  )}
                </div>
              ))
            ) : (
              <Card className="bg-black/20 border-white/5 p-3">
                <p className="text-sm text-white/80">
                  Explore different styles and color combinations to enhance your look.
                </p>
              </Card>
            )}
            
            {Array.isArray(nextLevelTips) && nextLevelTips.length > 0 && (
              <div className="mt-4 pt-4 border-t border-white/10">
                <h4 className="text-md font-medium text-white/90 mb-2">Next Level Tips</h4>
                {nextLevelTips.map((tip, index) => (
                  <motion.div
                    key={`next-level-tip-${index}`}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card className="bg-black/20 border-white/5 p-3 mb-2">
                      <div className="flex items-start gap-3">
                        <div className="p-2 rounded-full bg-pink-500/20">
                          <ChevronRight className="w-3 h-3 text-pink-500" />
                        </div>
                        <p className="text-sm text-white/80">{tip}</p>
                      </div>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}
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
