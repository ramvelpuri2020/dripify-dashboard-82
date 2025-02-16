
import { useState, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { Edit, Camera, User } from "lucide-react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

interface StyleAnalysis {
  id: string;
  user_id: string;
  total_score: number;
  created_at: string;
  image_url: string;
  breakdown: Array<{
    category: string;
    score: number;
    emoji: string;
  }>;
  streak_count: number;
}

const Profile = () => {
  const [profile, setProfile] = useState<{
    username: string; 
    avatar_url: string | null;
    style_preferences: string[];
    favorite_brands: string[];
    budget_range: string;
    color_preferences: string[];
  } | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [newUsername, setNewUsername] = useState("");
  const [recentScans, setRecentScans] = useState<StyleAnalysis[]>([]);
  const [styleStats, setStyleStats] = useState({
    totalScans: 0,
    averageScore: 0,
    bestCategory: "",
    styleStreak: 0
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchProfile();
    fetchStyleStats();
    fetchRecentScans();
  }, []);

  const fetchProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error) {
      console.error('Error fetching profile:', error);
      return;
    }

    setProfile(data);
    setNewUsername(data?.username || "");
  };

  const fetchStyleStats = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: analyses, error } = await supabase
      .from('style_analyses')
      .select('*')
      .eq('user_id', user.id);

    if (error) {
      console.error('Error fetching style analyses:', error);
      return;
    }

    if (analyses) {
      const scores = analyses.map(a => a.total_score);
      const averageScore = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
      
      // Calculate best category
      const categories: {[key: string]: number[]} = {};
      analyses.forEach((analysis: StyleAnalysis) => {
        if (Array.isArray(analysis.breakdown)) {
          analysis.breakdown.forEach((b) => {
            if (!categories[b.category]) categories[b.category] = [];
            categories[b.category].push(b.score);
          });
        }
      });

      let bestCategory = "";
      let bestScore = 0;
      Object.entries(categories).forEach(([category, scores]) => {
        const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
        if (avg > bestScore) {
          bestScore = avg;
          bestCategory = category;
        }
      });

      setStyleStats({
        totalScans: analyses.length,
        averageScore,
        bestCategory,
        styleStreak: analyses[0]?.streak_count || 0
      });
    }
  };

  const fetchRecentScans = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('style_analyses')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(3);

    if (error) {
      console.error('Error fetching recent scans:', error);
      return;
    }

    setRecentScans(data || []);
  };

  const handleUpdateProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from('profiles')
      .update({ 
        username: newUsername,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id);

    if (error) {
      toast({
        title: "Error updating profile",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    setProfile(prev => ({ ...prev!, username: newUsername }));
    setIsEditing(false);
    toast({
      title: "Profile updated",
      description: "Your profile has been updated successfully.",
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
                <Button
                  size="icon"
                  variant="outline"
                  className="absolute bottom-0 right-0 rounded-full bg-purple-500 hover:bg-purple-600 border-none"
                >
                  <Camera className="h-4 w-4" />
                </Button>
              </div>

              <div className="space-y-4 w-full max-w-sm">
                {isEditing ? (
                  <div className="space-y-2">
                    <Label htmlFor="username">Username</Label>
                    <Input
                      id="username"
                      value={newUsername}
                      onChange={(e) => setNewUsername(e.target.value)}
                      className="bg-white/5 border-white/10"
                      placeholder="Enter your username"
                    />
                    <div className="flex gap-2 justify-end mt-4">
                      <Button
                        variant="outline"
                        onClick={() => setIsEditing(false)}
                      >
                        Cancel
                      </Button>
                      <Button onClick={handleUpdateProfile}>
                        Save Changes
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-white/60">Username</Label>
                      <p className="text-xl font-semibold text-white">
                        {profile?.username || "Set your username"}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setIsEditing(true)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="bg-black/20 backdrop-blur-lg border-white/10">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-4 text-white/90">Style Stats</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-white/60">Total Scans</span>
                  <span className="text-white font-semibold">{styleStats.totalScans}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-white/60">Average Score</span>
                  <span className="text-white font-semibold">{styleStats.averageScore}/10</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-white/60">Best Category</span>
                  <span className="text-white font-semibold">{styleStats.bestCategory}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-white/60">Style Streak</span>
                  <span className="text-white font-semibold">{styleStats.styleStreak} days</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-black/20 backdrop-blur-lg border-white/10">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-4 text-white/90">Recent Scans</h3>
              <div className="space-y-4">
                {recentScans.map((scan, index) => (
                  <div key={scan.id} className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg overflow-hidden bg-purple-500/10">
                      <img
                        src={scan.image_url}
                        alt={`Scan ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-medium truncate">
                        Score: {scan.total_score}/10
                      </p>
                      <p className="text-white/60 text-sm">
                        {format(new Date(scan.created_at), 'MMM d')}
                      </p>
                    </div>
                  </div>
                ))}
                {recentScans.length === 0 && (
                  <p className="text-white/60 text-center">No scans yet</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </motion.div>
    </div>
  );
};

export default Profile;
