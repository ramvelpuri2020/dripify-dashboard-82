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
      <div className="relative w-32 h-32">
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={cn("text-4xl font-bold", getScoreColor(score))}>
            {score}
          </span>
        </div>
        <svg className="w-32 h-32 transform -rotate-90">
          <circle
            cx="64"
            cy="64"
            r="60"
            fill="none"
            stroke="#e5e7eb"
            strokeWidth="8"
          />
          <circle
            cx="64"
            cy="64"
            r="60"
            fill="none"
            stroke="currentColor"
            strokeWidth="8"
            strokeDasharray={`${(score / 100) * 377} 377`}
            className={cn("transition-all duration-1000", getScoreColor(score))}
          />
        </svg>
      </div>
      <p className="text-center text-gray-700 max-w-md">{feedback}</p>
    </div>
  );
};