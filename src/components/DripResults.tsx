
import { Share2, Save, ChevronRight, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { motion } from "framer-motion";
import { Avatar, AvatarImage, AvatarFallback } from "./ui/avatar";
import { ScrollArea } from "./ui/scroll-area";
import { useState } from "react";
import ReactMarkdown from 'react-markdown';

interface ScoreBreakdown {
  category: string;
  score: number;
  emoji: string;
  details?: string;
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
  breakdown = [],
  feedback = "",
  onShare,
  onSave,
  profileImage,
}: DripResultsProps) => {
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  
  // Ensure totalScore is a number and round it
  const displayScore = typeof totalScore === 'number' ? Math.round(totalScore) : 7;

  // Extract a short summary from the feedback
  const summaryFeedback = feedback.split('\n').slice(0, 2).join(' ').substring(0, 200);
  
  const toggleCategory = (category: string) => {
    if (expandedCategory === category) {
      setExpandedCategory(null);
    } else {
      setExpandedCategory(category);
    }
  };

  // Essential categories we want to display (even if they're not in the breakdown)
  const essentialCategories = [
    { category: "Overall Style", emoji: "👑", score: totalScore },
    { category: "Color Coordination", emoji: "🎨", score: 7 },
    { category: "Fit & Proportion", emoji: "📏", score: 7 },
    { category: "Accessories", emoji: "💍", score: 6 }
  ];
  
  // Combine actual breakdown with essential categories, prioritizing actual data
  const displayBreakdown = essentialCategories.map(essentialCat => {
    const foundCategory = breakdown.find(item => 
      item.category.toLowerCase() === essentialCat.category.toLowerCase() ||
      item.category.toLowerCase().includes(essentialCat.category.toLowerCase().replace(' ', ''))
    );
    
    if (foundCategory) {
      return foundCategory;
    }
    
    return essentialCat;
  });

  return (
    <div className="w-full max-w-md mx-auto space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-4"
      >
        <Avatar className="w-24 h-24 mx-auto border-2 border-purple-500/30">
          <AvatarImage src={profileImage} alt="Profile" className="object-cover" />
          <AvatarFallback className="bg-gradient-to-br from-purple-700 to-pink-500 text-white text-2xl">👕</AvatarFallback>
        </Avatar>
        <div className="space-y-2">
          <h2 className="text-5xl font-bold bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">{displayScore}/10</h2>
          <p className="text-xl text-green-400 font-semibold">Style Score</p>
          <div className="h-1.5 w-32 mx-auto bg-gray-800 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${(displayScore / 10) * 100}%` }}
              transition={{ delay: 0.5, duration: 1.2 }}
              className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
            />
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-black/30 backdrop-blur-lg border-white/10 rounded-lg p-6"
      >
        <h3 className="text-lg font-semibold text-white mb-3">Overall Feedback</h3>
        <p className="text-white/80 text-sm leading-relaxed">{summaryFeedback}</p>
      </motion.div>

      <div className="grid grid-cols-2 gap-4">
        {displayBreakdown.map((item, index) => (
          <motion.div
            key={`${item.category}-${index}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="bg-black/30 backdrop-blur-lg border-white/10 p-4 h-full">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{item.emoji}</span>
                    <span className="text-sm text-white/80 font-medium">{item.category}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 rounded-full bg-white/5 text-white/60 hover:text-white hover:bg-white/10"
                    onClick={() => toggleCategory(item.category)}
                  >
                    {expandedCategory === item.category ? (
                      <ChevronUp className="h-3 w-3" />
                    ) : (
                      <ChevronDown className="h-3 w-3" />
                    )}
                  </Button>
                </div>
                <div className="relative h-2 bg-white/10 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(item.score / 10) * 100}%` }}
                    className={`absolute top-0 left-0 h-full rounded-full ${
                      item.score >= 8 ? 'bg-gradient-to-r from-green-500 to-green-400' : 
                      item.score >= 6 ? 'bg-gradient-to-r from-yellow-500 to-yellow-400' : 
                      'bg-gradient-to-r from-red-500 to-red-400'
                    }`}
                    transition={{ duration: 1 }}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-lg font-bold text-white">{item.score}</span>
                  <span className="text-xs text-white/60">out of 10</span>
                </div>
                {item.details && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ 
                      height: expandedCategory === item.category ? 'auto' : '0px',
                      opacity: expandedCategory === item.category ? 1 : 0
                    }}
                    className="overflow-hidden"
                  >
                    <p className="text-xs text-white/70 mt-2 leading-relaxed">
                      {item.details}
                    </p>
                  </motion.div>
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
        <h3 className="text-lg font-semibold text-white mb-4">Full Analysis</h3>
        <ScrollArea className="h-[300px] pr-4">
          <div className="prose prose-invert max-w-none prose-pre:bg-black/30 prose-pre:border prose-pre:border-white/10">
            <ReactMarkdown>
              {feedback}
            </ReactMarkdown>
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
