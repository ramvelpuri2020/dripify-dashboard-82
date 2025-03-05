
import { useState, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { User } from "lucide-react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useIsMobile } from "@/hooks/use-mobile";
import { useToast } from "@/components/ui/use-toast";

const Profile = () => {
  const [profile, setProfile] = useState<{ username: string; avatar_url: string | null } | null>(null);
  const [styleStats, setStyleStats] = useState({
    totalScans: 0,
    averageScore: 0,
    bestCategory: '',
    lastScan: '',
    improvedCategories: 0,
    styleStreak: 0,
  });
  const isMobile = useIsMobile();
  const { toast } = useToast();

  useEffect(() => {
    fetchProfile();
    fetchStyleStats();
  }, []);

  const fetchProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('profiles')
      .select('username, avatar_url')
      .eq('id', user.id)
      .single();

    if (error) {
      console.error('Error fetching profile:', error);
      toast({
        title: "Error loading profile",
        description: "Could not load profile information",
        variant: "destructive",
      });
      return;
    }

    setProfile(data);
  };

  const fetchStyleStats = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Get total scan count
    const { count: totalScans, error: countError } = await supabase
      .from('style_analyses')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);

    if (countError) {
      console.error('Error fetching scan count:', countError);
      return;
    }

    // Get average score
    const { data: scoreData, error: scoreError } = await supabase
      .from('style_analyses')
      .select('total_score')
      .eq('user_id', user.id);

    if (scoreError) {
      console.error('Error fetching scores:', scoreError);
      return;
    }

    let averageScore = 0;
    if (scoreData && scoreData.length > 0) {
      averageScore = Math.round(
        scoreData.reduce((acc, curr) => acc + curr.total_score, 0) / scoreData.length
      );
    }

    // Get best category
    const { data: analyses, error: analysesError } = await supabase
      .from('style_analyses')
      .select('breakdown')
      .eq('user_id', user.id);

    if (analysesError) {
      console.error('Error fetching analyses:', analysesError);
      return;
    }

    let bestCategory = '';
    if (analyses && analyses.length > 0) {
      // Process breakdown data to find best category
      const categoryScores = {};
      
      analyses.forEach(analysis => {
        if (analysis.breakdown && Array.isArray(analysis.breakdown)) {
          analysis.breakdown.forEach(item => {
            if (item.category && item.score) {
              if (!categoryScores[item.category]) {
                categoryScores[item.category] = { total: 0, count: 0 };
              }
              categoryScores[item.category].total += item.score;
              categoryScores[item.category].count += 1;
            }
          });
        }
      });

      let highestAvg = 0;
      Object.entries(categoryScores).forEach(([category, data]) => {
        const avg = data.total / data.count;
        if (avg > highestAvg) {
          highestAvg = avg;
          bestCategory = category;
        }
      });
    }

    // Get last scan date and streak
    const { data: latestScan, error: latestError } = await supabase
      .from('style_analyses')
      .select('scan_date, streak_count')
      .eq('user_id', user.id)
      .order('scan_date', { ascending: false })
      .limit(1)
      .single();

    let lastScan = '';
    let styleStreak = 0;

    if (!latestError && latestScan) {
      // Format date as "X days ago"
      const scanDate = new Date(latestScan.scan_date);
      const now = new Date();
      const diffTime = Math.abs(now.getTime() - scanDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      lastScan = diffDays <= 1 ? 'today' : `${diffDays} days ago`;
      styleStreak = latestScan.streak_count || 0;
    }

    // Set improved categories (this is a placeholder - would need more data to calculate properly)
    const improvedCategories = Math.min(3, Math.floor(totalScans / 4)); // Just a placeholder calculation

    setStyleStats({
      totalScans: totalScans || 0,
      averageScore,
      bestCategory,
      lastScan,
      improvedCategories,
      styleStreak,
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1A1F2C] to-[#2C1F3D] py-8 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl mx-auto space-y-6"
      >
        <Card className="bg-black/20 backdrop-blur-lg border-white/10">
          <CardContent className="p-6">
            <div className="flex flex-col items-center space-y-4">
              <div className="relative">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={profile?.avatar_url || ""} />
                  <AvatarFallback>
                    <User className="h-12 w-12 text-white/60" />
                  </AvatarFallback>
                </Avatar>
              </div>

              <div className="space-y-4 w-full max-w-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white/60">Username</p>
                    <p className="text-xl font-semibold text-white">
                      {profile?.username || "Loading..."}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className={`grid ${isMobile ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2'} gap-4`}>
          <Card className="bg-black/20 backdrop-blur-lg border-white/10">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-4 text-white/90">Style Stats</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <p className="text-white/60">Total Scans:</p>
                  <p className="text-white font-medium">{styleStats.totalScans}</p>
                </div>
                <div className="flex justify-between items-center">
                  <p className="text-white/60">Average Score:</p>
                  <p className="text-white font-medium">{styleStats.averageScore}</p>
                </div>
                <div className="flex justify-between items-center">
                  <p className="text-white/60">Best Category:</p>
                  <p className="text-white font-medium">{styleStats.bestCategory || "N/A"}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-black/20 backdrop-blur-lg border-white/10">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-4 text-white/90">Recent Activity</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <p className="text-white/60">Last Scan:</p>
                  <p className="text-white font-medium">{styleStats.lastScan || "No scans yet"}</p>
                </div>
                <div className="flex justify-between items-center">
                  <p className="text-white/60">Improved Categories:</p>
                  <p className="text-white font-medium">{styleStats.improvedCategories}</p>
                </div>
                <div className="flex justify-between items-center">
                  <p className="text-white/60">Style Streak:</p>
                  <p className="text-white font-medium">{styleStats.styleStreak} days</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </motion.div>
    </div>
  );
};

export default Profile;
