
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { History, ExternalLink } from "lucide-react";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface StyleAnalysis {
  id: string;
  total_score: number;
  feedback: string;
  image_url: string;
  thumbnail_url?: string;
  created_at: string;
  breakdown?: any;
}

const getImageUrl = (path: string) => {
  if (!path) return '/placeholder.svg';
  return path; // URLs from storage are already public
};

export const StyleAnalysesList = ({ analyses }: { analyses: StyleAnalysis[] }) => {
  const navigate = useNavigate();
  const [selectedAnalysis, setSelectedAnalysis] = useState<StyleAnalysis | null>(null);

  const handleViewDetails = (analysis: StyleAnalysis) => {
    setSelectedAnalysis(analysis);
  };

  const handleCloseDialog = () => {
    setSelectedAnalysis(null);
  };

  const handleNewScan = () => {
    navigate('/scan');
  };

  if (!analyses || analyses.length === 0) {
    return (
      <Card className="bg-[#1A1F2C]/80 backdrop-blur-lg border-[#403E43]">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-white text-lg flex items-center gap-2">
              <History className="w-4 h-4 text-[#9b87f5]" />
              Recent Style Analyses
            </CardTitle>
            <Button 
              onClick={handleNewScan}
              size="sm" 
              className="bg-gradient-to-r from-[#9b87f5] to-[#b192ef] hover:from-[#8a77e0] hover:to-[#9e82da] border-none text-white"
            >
              New Scan
            </Button>
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
          <Button 
            onClick={handleNewScan}
            size="sm" 
            className="bg-gradient-to-r from-[#9b87f5] to-[#b192ef] hover:from-[#8a77e0] hover:to-[#9e82da] border-none text-white"
          >
            New Scan
          </Button>
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
                <Card 
                  className="bg-[#222222] border-[#403E43] hover:bg-[#1A1F2C] transition-all duration-300 cursor-pointer"
                  onClick={() => handleViewDetails(analysis)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <div className="w-20 h-20 rounded-lg overflow-hidden bg-purple-500/10 flex-shrink-0">
                        <img
                          src={getImageUrl(analysis.thumbnail_url || analysis.image_url)}
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
                        <div className="flex justify-end mt-2">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-xs text-purple-400 hover:text-purple-300 p-0 h-auto flex items-center gap-1"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleViewDetails(analysis);
                            }}
                          >
                            <span>View details</span>
                            <ExternalLink className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </ScrollArea>

        {/* Details Dialog */}
        <Dialog open={!!selectedAnalysis} onOpenChange={(open) => !open && handleCloseDialog()}>
          <DialogContent className="bg-[#1A1F2C] border-[#403E43] text-white sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-white text-center">Style Analysis Details</DialogTitle>
            </DialogHeader>
            {selectedAnalysis && (
              <div className="space-y-4">
                <div className="aspect-square max-h-[300px] rounded-md overflow-hidden mx-auto">
                  <img 
                    src={getImageUrl(selectedAnalysis.image_url)} 
                    alt="Outfit" 
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const img = e.target as HTMLImageElement;
                      img.src = '/placeholder.svg';
                    }}
                  />
                </div>
                
                <div className="text-center">
                  <h3 className="text-xl font-bold text-purple-400">Score: {selectedAnalysis.total_score}/10</h3>
                  <p className="text-sm text-[#C8C8C9] mt-1">
                    {format(new Date(selectedAnalysis.created_at), 'MMMM d, yyyy')}
                  </p>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-medium text-white/90">Feedback</h4>
                  <p className="text-sm text-[#C8C8C9]">{selectedAnalysis.feedback}</p>
                </div>
                
                {selectedAnalysis.breakdown && selectedAnalysis.breakdown.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-medium text-white/90">Breakdown</h4>
                    <div className="grid grid-cols-1 gap-2">
                      {selectedAnalysis.breakdown.map((item: any, i: number) => (
                        <div key={i} className="flex items-start gap-2">
                          <div className="min-w-[24px] text-center">{item.emoji || "✓"}</div>
                          <div>
                            <p className="text-sm font-medium text-white/90">
                              {item.category}: {item.score}/10
                            </p>
                            <p className="text-xs text-[#C8C8C9]">{item.details}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                <Button 
                  onClick={handleNewScan} 
                  className="w-full bg-gradient-to-r from-[#9b87f5] to-[#b192ef] hover:from-[#8a77e0] hover:to-[#9e82da]"
                >
                  Analyze Another Outfit
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};
