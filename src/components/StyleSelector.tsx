import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface StyleOption {
  id: string;
  label: string;
  description: string;
}

interface StyleSelectorProps {
  selected: string;
  onSelect: (id: string) => void;
}

const styleOptions: StyleOption[] = [
  {
    id: "casual",
    label: "Casual",
    description: "Everyday comfortable wear",
  },
  {
    id: "formal",
    label: "Formal",
    description: "Business or special occasions",
  },
  {
    id: "streetwear",
    label: "Streetwear",
    description: "Urban and trendy style",
  },
  {
    id: "athletic",
    label: "Athletic",
    description: "Sports and activewear",
  },
];

export const StyleSelector = ({ selected, onSelect }: StyleSelectorProps) => {
  return (
    <div className="grid grid-cols-2 gap-4 w-full max-w-2xl mx-auto">
      {styleOptions.map((option) => (
        <button
          key={option.id}
          onClick={() => onSelect(option.id)}
          className={cn(
            "flex flex-col items-start p-4 rounded-lg border-2 transition-all",
            selected === option.id
              ? "border-drip-primary bg-drip-accent/10"
              : "border-gray-200 hover:border-gray-300"
          )}
        >
          <div className="flex items-center justify-between w-full">
            <span className="font-medium">{option.label}</span>
            {selected === option.id && (
              <Check className="w-5 h-5 text-drip-primary" />
            )}
          </div>
          <span className="text-sm text-gray-500 mt-1">{option.description}</span>
        </button>
      ))}
    </div>
  );
};