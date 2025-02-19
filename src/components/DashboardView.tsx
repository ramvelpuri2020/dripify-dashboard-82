import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { Trophy, TrendingUp, Flame, Camera, History, ArrowRight, Sparkles, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./ui/button";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ScrollArea } from "./ui/scroll-area";
import { format } from "date-fns";
import { useToast } from "./ui/use-toast";

interface StyleAnalysis {
  id: string;
  total_score: number;
  feedback: string;
  image_url: string;
  thumbnail_url: string;
  created_at: string;
  streak_count: number;
  last_scan_date: string;
}

const getImageUrl = (path: string) => {
  if (!path) return '/placeholder.svg';
  if (path.startsWith('http')) return path;
  const { data } = supabase.storage
    .from('style-images')
    .getPublicUrl(path);
  return data?.publicUrl || '/placeholder.svg';
};

export const DashboardView = () => {
  const navigate = useNavigate();
  const [analyses, setAnalyses] = useState<StyleAnalysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    averageScore: 0,
    streak: 0,
    totalScans: 0,
    bestScore: 0
  });
  const { toast } = useToast();

  useEffect(() => {
    const fetchAnalyses = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          navigate('/auth');
          return;
        }

        const { data, error } = await supabase
          .from('style_analyses')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(10);

        if (error) throw error;

        if (data && data.length > 0) {
          const processedData = data.map(analysis => ({
            ...analysis,
            image_url: analysis.thumbnail_url || analysis.image_url
          }));
          
          setAnalyses(processedData);
          
          const scores = data.map(a => a.total_score);
          const averageScore = scores.reduce((a, b) => a + b, 0) / scores.length;
          const bestScore = Math.max(...scores);
          const currentStreak = data[0].streak_count || 0;

          setStats({
            averageScore: Math.round(averageScore * 10) / 10,
            streak: currentStreak,
            totalScans: data.length,
            bestScore: bestScore
          });
        }
      } catch (error) {
        console.error('Error fetching analyses:', error);
        toast({
          title: "Error loading analyses",
          description: "Failed to load your style analyses.",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    const subscription = supabase
      .channel('style_analyses_changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'style_analyses' 
        }, 
        () => {
          fetchAnalyses();
        }
      )
      .subscribe();

    fetchAnalyses();

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate, toast]);

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      toast({
        title: "Signed out successfully",
        description: "You have been signed out of your account."
      });
      navigate('/auth');
    } catch (error) {
      toast({
        title: "Error signing out",
        description: "An error occurred while signing out.",
        variant: "destructive"
      });
    }
  };

  const hasScans = analyses.length > 0;

  const styleStats = [{
    title: "Style Score",
    value: hasScans ? `${stats.averageScore}` : "--",
    icon: Trophy,
    color: "text-[#9b87f5]",
    emptyState: "Take your first style scan!"
  }, {
    title: "Best Score",
    value: hasScans ? `${stats.bestScore}` : "--",
    icon: TrendingUp,
    color: "text-[#7E69AB]",
    emptyState: "Start scanning outfits"
  }, {
    title: "Style Streak",
    value: hasScans ? `${stats.streak} ${stats.streak === 1 ? 'day' : 'days'}` : "--",
    icon: Flame,
    color: "text-[#D6BCFA]",
    emptyState: "Start your streak"
  }];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white" />
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6 px-4 pb-20 max-w-2xl mx-auto"
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="py-6 flex justify-between items-center"
      >
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-[#9b87f5] to-[#D6BCFA] text-transparent bg-clip-text">
            {hasScans ? `Welcome Back!` : 'Welcome to DripCheck'}
          </h1>
          <p className="text-[#C8C8C9] text-sm mt-1">
            {hasScans 
              ? `You've completed ${stats.totalScans} style ${stats.totalScans === 1 ? 'scan' : 'scans'}!` 
              : "Let's discover your unique style"}
          </p>
        </div>
        <Button 
          variant="ghost" 
          size="icon"
          onClick={handleSignOut}
          className="hover:bg-white/10"
        >
          <LogOut className="h-5 w-5 text-white/60" />
        </Button>
      </motion.div>

      {!hasScans ? (
        <Card className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-purple-500/20">
          <CardContent className="p-6 bg-slate-900/50">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-400" />
                <h3 className="text-lg font-semibold text-slate-50">Getting Started</h3>
              </div>
              <Button 
                onClick={() => navigate('/scan')} 
                className="bg-purple-500 hover:bg-purple-600 transition-colors group rounded"
              >
                <Camera className="w-4 h-4 mr-2" />
                New Scan
                <motion.div
                  animate={{ x: [0, 4, 0] }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                >
                  <ArrowRight className="w-4 h-4 ml-2" />
                </motion.div>
              </Button>
            </div>
            <div className="grid gap-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center">
                  1
                </div>
                <p className="text-white/80">Take a photo of your outfit</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center">
                  2
                </div>
                <p className="text-white/80">Get instant style feedback</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center">
                  3
                </div>
                <p className="text-white/80">Build your style profile</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : null}

      <div className="grid grid-cols-3 gap-3">
        {styleStats.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="bg-[#1A1F2C]/80 backdrop-blur-lg border-[#403E43] hover:border-[#9b87f5]/50 transition-all duration-300">
              <CardContent className="p-4 flex flex-col items-center justify-center space-y-2">
                <stat.icon className={cn("w-5 h-5", stat.color)} />
                {hasScans ? (
                  <p className={cn("text-lg font-bold", stat.color)}>{stat.value}</p>
                ) : (
                  <p className="text-xs text-[#C8C8C9] text-center">{stat.emptyState}</p>
                )}
                <p className="text-xs text-[#C8C8C9] text-center">{stat.title}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {hasScans && (
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
                            <p className="text-[#C8C8C9] text-sm mt-1">
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
      )}

      {hasScans && (
        <Card className="bg-[#1A1F2C]/80 backdrop-blur-lg border-[#403E43]">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-white text-lg flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#9b87f5]" />
                Quick Start
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                {
                  title: "Work Style",
                  description: "Professional looks that make an impact",
                  icon: "👔"
                },
                {
                  title: "Casual Vibes",
                  description: "Effortless everyday outfits",
                  icon: "✨"
                },
                {
                  title: "Evening Out",
                  description: "Make a statement after dark",
                  icon: "🌙"
                }
              ].map((card, index) => (
                <motion.div
                  key={card.title}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="group cursor-pointer"
                  onClick={() => navigate('/scan')}
                >
                  <Card className="bg-[#222222] border-[#403E43] hover:bg-[#1A1F2C] transition-all duration-300">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-full bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-2xl">
                            {card.icon}
                          </div>
                          <div>
                            <p className="text-white font-medium group-hover:text-[#9b87f5] transition-colors">
                              {card.title}
                            </p>
                            <p className="text-[#C8C8C9] text-xs">{card.description}</p>
                          </div>
                        </div>
                        <ArrowRight className="w-4 h-4 text-purple-400 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </motion.div>
  );
};
