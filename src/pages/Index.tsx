import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DashboardView } from "@/components/DashboardView";
import { ScanView } from "@/components/ScanView";
import { TipsView } from "@/components/TipsView";
import { LayoutDashboard, Scan, MessageSquare } from "lucide-react";
import { motion } from "framer-motion";

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1A1F2C] to-[#2C1F3D] relative pb-20">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-4xl font-bold text-center bg-gradient-to-r from-[#F97316] to-[#FB923C] text-transparent bg-clip-text py-8">
          DripCheck
        </h1>
        
        <Tabs defaultValue="dashboard" className="w-full">
          <TabsContent value="dashboard" className="mt-0">
            <DashboardView />
          </TabsContent>

          <TabsContent value="scan" className="mt-0">
            <ScanView />
          </TabsContent>

          <TabsContent value="tips" className="mt-0">
            <TipsView />
          </TabsContent>

          {/* Bottom Navigation */}
          <motion.div 
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            className="fixed bottom-0 left-0 right-0 bg-black/30 backdrop-blur-lg border-t border-white/10"
          >
            <TabsList className="w-full h-16 grid grid-cols-3 bg-transparent">
              <TabsTrigger 
                value="dashboard" 
                className="flex flex-col items-center justify-center gap-1 data-[state=active]:bg-white/10 rounded-none"
              >
                <LayoutDashboard className="h-5 w-5" />
                <span className="text-xs">Dashboard</span>
              </TabsTrigger>
              <TabsTrigger 
                value="scan" 
                className="flex flex-col items-center justify-center gap-1 data-[state=active]:bg-white/10 rounded-none"
              >
                <Scan className="h-5 w-5" />
                <span className="text-xs">Scan</span>
              </TabsTrigger>
              <TabsTrigger 
                value="tips" 
                className="flex flex-col items-center justify-center gap-1 data-[state=active]:bg-white/10 rounded-none"
              >
                <MessageSquare className="h-5 w-5" />
                <span className="text-xs">Tips</span>
              </TabsTrigger>
            </TabsList>
          </motion.div>
        </Tabs>
      </div>
    </div>
  );
};

export default Index;