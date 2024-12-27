import { cn } from "@/lib/utils";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

interface DripScoreProps {
  score: number;
  feedback: string;
  profileImage?: string;
}

export const DripScore = ({ score, feedback, profileImage }: DripScoreProps) => {
  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-green-500";
    if (score >= 70) return "text-yellow-500";
    return "text-red-500";
  };

  return (
    <div className="flex flex-col items-center space-y-4 animate-fade-in">
      <Avatar className="w-16 h-16 border-2 border-white/20">
        <AvatarImage src={profileImage} alt="Profile" />
        <AvatarFallback>👤</AvatarFallback>
      </Avatar>
      <div className="relative h-48 w-4">
        <div className="absolute -top-8 left-1/2 -translate-x-1/2">
          <span className={cn("text-2xl font-bold", getScoreColor(score))}>
            {score}
          </span>
        </div>
        <div className="h-full w-full bg-gray-200 rounded-full overflow-hidden">
          <div 
            className={cn("w-full transition-all duration-1000", getScoreColor(score))}
            style={{ 
              height: `${score}%`,
              background: `linear-gradient(to top, ${getScoreColor(score)}, ${getScoreColor(score)}88)`
            }}
          />
        </div>
      </div>
      <p className="text-center text-gray-700 max-w-md text-sm">{feedback}</p>
    </div>
  );
};