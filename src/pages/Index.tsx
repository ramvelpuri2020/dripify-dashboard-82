
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DashboardView } from "@/components/DashboardView";
import { ScanView } from "@/components/ScanView";
import { TipsView } from "@/components/TipsView";
import { LayoutDashboard, Scan, MessageSquare, User } from "lucide-react";
import { motion } from "framer-motion";
import { Link, Routes, Route, useNavigate, useLocation } from "react-router-dom";
import { useEffect } from "react";
const Index = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const currentPath = location.pathname.split('/')[1] || 'dashboard';

  // Sync tab value with URL
  useEffect(() => {
    if (location.pathname === '/') {
      navigate('/dashboard');
    }
  }, [location.pathname, navigate]);
  const handleTabChange = (value: string) => {
    navigate(`/${value}`);
  };
  return <div className="min-h-screen bg-gradient-to-br from-[#1A1F2C] to-[#2C1F3D] relative pb-20">
      <div className="max-w-3xl mx-auto">
        <div className="flex justify-between items-center py-8 px-4">
          <h1 className="text-4xl font-bold text-center bg-gradient-to-r from-[#F97316] to-[#FB923C] text-transparent bg-clip-text">Gen Style</h1>
          <Link to="/profile" className="p-2 rounded-full hover:bg-white/10 transition-colors">
            <User className="w-6 h-6 text-white/80" />
          </Link>
        </div>
        
        <Tabs value={currentPath} onValueChange={handleTabChange} className="w-full">
          <Routes>
            <Route path="/dashboard" element={<DashboardView />} />
            <Route path="/scan" element={<ScanView />} />
            <Route path="/tips" element={<TipsView />} />
            <Route path="/" element={<DashboardView />} />
          </Routes>

          <motion.div initial={{
          y: 100
        }} animate={{
          y: 0
        }} className="fixed bottom-0 left-0 right-0 bg-black/30 backdrop-blur-lg border-t border-white/10">
            <TabsList className="w-full h-16 grid grid-cols-3 bg-transparent">
              <TabsTrigger value="dashboard" className="flex flex-col items-center justify-center gap-1 data-[state=active]:bg-white/10 rounded-none">
                <LayoutDashboard className="h-5 w-5" />
                <span className="text-xs">Dashboard</span>
              </TabsTrigger>
              <TabsTrigger value="scan" className="flex flex-col items-center justify-center gap-1 data-[state=active]:bg-white/10 rounded-none">
                <Scan className="h-5 w-5" />
                <span className="text-xs">Scan</span>
              </TabsTrigger>
              <TabsTrigger value="tips" className="flex flex-col items-center justify-center gap-1 data-[state=active]:bg-white/10 rounded-none">
                <MessageSquare className="h-5 w-5" />
                <span className="text-xs">Tips</span>
              </TabsTrigger>
            </TabsList>
          </motion.div>
        </Tabs>
      </div>
    </div>;
};
export default Index;
