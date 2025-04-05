import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { History, ExternalLink, ChevronRight } from "lucide-react";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { StyleAnalysis, ScoreBreakdown } from "@/types/styleTypes";

const getImageUrl = (path: string) => {
  if (!path) return '/placeholder.svg';
  return path; // URLs from storage are already public
};

export const StyleAnalysesList = ({ analyses }: { analyses: StyleAnalysis[] }) => {
  const navigate = useNavigate();
  const [selectedAnalysis, setSelectedAnalysis] = useState<StyleAnalysis | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const handleViewDetails = (analysis: StyleAnalysis) => {
    setSelectedAnalysis(analysis);
  };

  const handleCloseDialog = () => {
    setSelectedAnalysis(null);
    setSelectedCategory(null);
  };

  const handleNewScan = () => {
    navigate('/scan');
  };
  
  const toggleCategory = (category: string) => {
    if (selectedCategory === category) {
      setSelectedCategory(null);
    } else {
      setSelectedCategory(category);
    }
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
                            {format(new Date(analysis.created_at || analysis.scan_date), 'MMM d, yyyy')}
                          </span>
                        </div>
                        <div className="mt-1 flex gap-2 flex-wrap">
                          {analysis.breakdown && analysis.breakdown.slice(0, 3).map((item, i) => (
                            <div key={i} className="flex items-center gap-1">
                              <span className="text-sm">{item.emoji}</span>
                              <span className="text-xs text-[#C8C8C9]">{item.score}</span>
                            </div>
                          ))}
                        </div>
                        <p className="text-[#C8C8C9] text-sm mt-2 line-clamp-2">
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
          <DialogContent className="bg-[#1A1F2C] border-[#403E43] text-white sm:max-w-lg max-h-[90vh] overflow-hidden">
            <DialogHeader>
              <DialogTitle className="text-white text-center">Style Analysis Details</DialogTitle>
            </DialogHeader>
            {selectedAnalysis && (
              <ScrollArea className="pr-4 max-h-[calc(90vh-120px)]">
                <div className="space-y-5 p-1">
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
                    <div className="relative inline-block">
                      <Avatar className="w-16 h-16 border-2 border-purple-500/30">
                        <AvatarImage src={getImageUrl(selectedAnalysis.image_url)} alt="Style" className="object-cover" />
                        <AvatarFallback className="bg-gradient-to-br from-purple-700 to-pink-500 text-white text-xl">👕</AvatarFallback>
                      </Avatar>
                      <div className="absolute -bottom-2 -right-2 bg-purple-500 text-white text-sm font-bold rounded-full w-7 h-7 flex items-center justify-center border-2 border-[#1A1F2C]">
                        {selectedAnalysis.total_score}
                      </div>
                    </div>
                    <h3 className="text-xl font-bold text-purple-400 mt-2">Score: {selectedAnalysis.total_score}/10</h3>
                    <p className="text-sm text-[#C8C8C9] mt-1">
                      {format(new Date(selectedAnalysis.created_at || selectedAnalysis.scan_date), 'MMMM d, yyyy')}
                    </p>
                  </div>
                  
                  <div className="space-y-2 bg-black/20 rounded-lg p-4">
                    <h4 className="font-medium text-white/90">Feedback</h4>
                    <p className="text-sm text-[#C8C8C9] leading-relaxed">{selectedAnalysis.feedback}</p>
                  </div>
                  
                  {selectedAnalysis.breakdown && selectedAnalysis.breakdown.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="font-medium text-white/90 mb-2">Breakdown</h4>
                      <div className="grid grid-cols-1 gap-3">
                        {selectedAnalysis.breakdown.map((item: any, i: number) => (
                          <Card 
                            key={i} 
                            className={`bg-black/20 border-white/5 p-4 cursor-pointer hover:bg-black/30 transition-colors ${
                              selectedCategory === item.category ? 'border-purple-500/30' : ''
                            }`}
                            onClick={() => toggleCategory(item.category)}
                          >
                            <div className="flex justify-between items-start">
                              <div className="flex items-center gap-2">
                                <div className="text-center text-xl">{item.emoji || "✓"}</div>
                                <div>
                                  <p className="text-sm font-medium text-white/90">
                                    {item.category}
                                  </p>
                                  <div className="flex items-center gap-2">
                                    <p className="text-xs text-white/60">
                                      Score: {item.score}/10
                                    </p>
                                    <div className={`text-xs px-1.5 py-0.5 rounded-full ${
                                      item.score >= 8 ? 'bg-green-500/20 text-green-400' : 
                                      item.score >= 6 ? 'bg-yellow-500/20 text-yellow-400' : 
                                      'bg-red-500/20 text-red-400'
                                    }`}>
                                      {item.score >= 8 ? 'Great' : item.score >= 6 ? 'Good' : 'Needs Work'}
                                    </div>
                                  </div>
                                </div>
                              </div>
                              <ChevronRight className={`w-4 h-4 text-white/40 transition-transform ${
                                selectedCategory === item.category ? 'rotate-90' : ''
                              }`} />
                            </div>
                            
                            {selectedCategory === item.category && item.details && (
                              <div className="mt-3 pt-3 border-t border-white/10">
                                <p className="text-xs text-[#C8C8C9] leading-relaxed">{item.details}</p>
                              </div>
                            )}
                          </Card>
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
              </ScrollArea>
            )}
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};
