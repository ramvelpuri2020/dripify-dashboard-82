import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface StyleOption {
  id: string;
  label: string;
  description: string;
  icon: string;
}

interface StyleSelectorProps {
  selected: string;
  onSelect: (id: string) => void;
}

const styleOptions: StyleOption[] = [
  {
    id: "casual",
    label: "Casual",
    description: "Everyday wear",
    icon: "👕",
  },
  {
    id: "formal",
    label: "Formal",
    description: "Business attire",
    icon: "👔",
  },
  {
    id: "streetwear",
    label: "Street",
    description: "Urban style",
    icon: "🧢",
  },
  {
    id: "athletic",
    label: "Athletic",
    description: "Sports wear",
    icon: "🏃",
  },
];

export const StyleSelector = ({ selected, onSelect }: StyleSelectorProps) => {
  return (
    <div className="grid grid-cols-4 gap-3 w-full max-w-2xl mx-auto">
      {styleOptions.map((option) => (
        <button
          key={option.id}
          onClick={() => onSelect(option.id)}
          className={cn(
            "flex flex-col items-center p-3 rounded-xl border transition-all duration-200",
            selected === option.id
              ? "border-[#F97316] bg-[#F97316]/10 text-white"
              : "border-white/10 hover:border-white/20 text-gray-400 hover:text-white"
          )}
        >
          <span className="text-2xl mb-1">{option.icon}</span>
          <span className="text-sm font-medium">{option.label}</span>
        </button>
      ))}
    </div>
  );
};