import { Share2, Instagram, MessageCircle, Send } from "lucide-react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Progress } from "./ui/progress";

interface ScoreBreakdown {
  category: string;
  score: number;
  emoji: string;
}

interface DripResultsProps {
  totalScore: number;
  breakdown: ScoreBreakdown[];
  onShare: () => void;
}

export const DripResults = ({ totalScore, breakdown, onShare }: DripResultsProps) => {
  return (
    <div className="w-full max-w-md mx-auto animate-fade-in">
      <Card className="bg-gradient-to-b from-orange-400 to-pink-500 p-6 text-white rounded-3xl">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold mb-2">You're a {totalScore}</h2>
          <p className="text-sm opacity-90">Share and compare with your friends</p>
        </div>

        <div className="space-y-4">
          {breakdown.map((item) => (
            <div key={item.category} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-lg">{item.emoji}</span>
                <span className="font-medium">{item.category}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-bold">{item.score}/10</span>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <div className="flex justify-center gap-4 mt-6">
        <Button
          variant="outline"
          size="lg"
          className="rounded-full bg-[#25D366] hover:bg-[#25D366]/90 text-white border-none"
          onClick={onShare}
        >
          <MessageCircle className="w-5 h-5" />
        </Button>
        <Button
          variant="outline"
          size="lg"
          className="rounded-full bg-[#E4405F] hover:bg-[#E4405F]/90 text-white border-none"
          onClick={onShare}
        >
          <Instagram className="w-5 h-5" />
        </Button>
        <Button
          variant="outline"
          size="lg"
          className="rounded-full bg-[#FFFC00] hover:bg-[#FFFC00]/90 text-black border-none"
          onClick={onShare}
        >
          <Send className="w-5 h-5" />
        </Button>
      </div>
    </div>
  );
};