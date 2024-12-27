import { cn } from "@/lib/utils";

interface DripScoreProps {
  score: number;
  feedback: string;
}

export const DripScore = ({ score, feedback }: DripScoreProps) => {
  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-green-500";
    if (score >= 70) return "text-yellow-500";
    return "text-red-500";
  };

  return (
    <div className="flex flex-col items-center space-y-4 animate-fade-in">
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