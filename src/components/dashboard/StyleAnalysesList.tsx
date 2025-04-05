
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { History } from "lucide-react";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";

interface StyleAnalysis {
  id: string;
  total_score: number;
  feedback: string;
  image_url: string;
  created_at: string;
}

const getImageUrl = (path: string) => {
  if (!path) return '/placeholder.svg';
  return path; // URLs from storage are already public
};

export const StyleAnalysesList = ({ analyses }: { analyses: StyleAnalysis[] }) => {
  if (!analyses || analyses.length === 0) {
    return (
      <Card className="bg-[#1A1F2C]/80 backdrop-blur-lg border-[#403E43]">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-white text-lg flex items-center gap-2">
              <History className="w-4 h-4 text-[#9b87f5]" />
              Recent Style Analyses
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-[#C8C8C9]">
            No style analyses yet. Try scanning an outfit!
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-[#1A1F2C]/80 backdrop-blur-lg border-[#403E43]">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-white text-lg flex items-center gap-2">
            <History className="w-4 h-4 text-[#9b87f5]" />
            Recent Style Analyses
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-4">
            {analyses.map((analysis, index) => (
              <motion.div
                key={analysis.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="bg-[#222222] border-[#403E43] hover:bg-[#1A1F2C] transition-all duration-300">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <div className="w-20 h-20 rounded-lg overflow-hidden bg-purple-500/10 flex-shrink-0">
                        <img
                          src={getImageUrl(analysis.image_url)}
                          alt="Style analysis"
                          className="w-full h-full object-cover"
                          loading="lazy"
                          onError={(e) => {
                            const img = e.target as HTMLImageElement;
                            img.src = '/placeholder.svg';
                          }}
                        />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <p className="text-white font-medium">
                            Style Score: {analysis.total_score}/10
                          </p>
                          <span className="text-xs text-[#C8C8C9]">
                            {format(new Date(analysis.created_at), 'MMM d, yyyy')}
                          </span>
                        </div>
                        <p className="text-[#C8C8C9] text-sm mt-1 line-clamp-3">
                          {analysis.feedback}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
