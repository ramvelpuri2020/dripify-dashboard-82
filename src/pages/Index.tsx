import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DashboardView } from "@/components/DashboardView";
import { ScanView } from "@/components/ScanView";
import { TipsView } from "@/components/TipsView";

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1A1F2C] to-[#2C1F3D] py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-4xl font-bold text-center bg-gradient-to-r from-[#F97316] to-[#FB923C] text-transparent bg-clip-text mb-8">
          DripCheck
        </h1>
        
        <Tabs defaultValue="dashboard" className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-white/10 rounded-xl p-1">
            <TabsTrigger 
              value="dashboard"
              className="data-[state=active]:bg-[#F97316] data-[state=active]:text-white"
            >
              Dashboard
            </TabsTrigger>
            <TabsTrigger 
              value="scan"
              className="data-[state=active]:bg-[#F97316] data-[state=active]:text-white"
            >
              Scan
            </TabsTrigger>
            <TabsTrigger 
              value="tips"
              className="data-[state=active]:bg-[#F97316] data-[state=active]:text-white"
            >
              Tips
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="mt-6">
            <DashboardView />
          </TabsContent>

          <TabsContent value="scan" className="mt-6">
            <ScanView />
          </TabsContent>

          <TabsContent value="tips" className="mt-6">
            <TipsView />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Index;