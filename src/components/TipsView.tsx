import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { WhatsappIcon, InstagramIcon, MessagesSquare, Snapchat } from "lucide-react";

export const TipsView = () => {
  const styleAnalysis = [
    {
      category: "Overall",
      score: 95,
      emoji: "🎯"
    },
    {
      category: "Potential",
      score: 100,
      emoji: "🚀"
    },
    {
      category: "Jawline",
      score: 95,
      emoji: "👨"
    },
    {
      category: "Masculinity",
      score: 95,
      emoji: "💪"
    },
    {
      category: "Skin Quality",
      score: 95,
      emoji: "✨"
    },
    {
      category: "Cheekbones",
      score: 90,
      emoji: "👤"
    },
    {
      category: "Eyes",
      score: 95,
      emoji: "👁️"
    }
  ];

  const shareOptions = [
    { icon: WhatsappIcon, color: "text-green-500", name: "WhatsApp" },
    { icon: InstagramIcon, color: "text-pink-500", name: "Instagram" },
    { icon: MessagesSquare, color: "text-blue-500", name: "Messenger" },
    { icon: Snapchat, color: "text-yellow-500", name: "Snapchat" }
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6 px-4 pb-20"
    >
      <Card className="bg-black/30 backdrop-blur-lg border-white/10">
        <CardContent className="p-6">
          <div className="flex flex-col items-center space-y-4">
            <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-800">
              <img 
                src="/placeholder.svg"
                alt="Profile"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="text-center">
              <h2 className="text-2xl font-bold text-white">You're a 10</h2>
              <p className="text-green-400">Top 5% of users</p>
            </div>
          </div>

          <Carousel className="w-full mt-8">
            <CarouselContent>
              {styleAnalysis.map((item, index) => (
                <CarouselItem key={index} className="md:basis-1/2 lg:basis-1/3">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="p-2"
                  >
                    <Card className="bg-black/50 backdrop-blur-lg border-white/10">
                      <CardContent className="flex items-center justify-between p-4">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{item.emoji}</span>
                          <span className="text-white">{item.category}</span>
                        </div>
                        <span className="text-xl font-bold text-white">{item.score}</span>
                      </CardContent>
                    </Card>
                  </motion.div>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="hidden md:flex" />
            <CarouselNext className="hidden md:flex" />
          </Carousel>

          <div className="flex justify-center gap-6 mt-8">
            {shareOptions.map((option, index) => (
              <motion.button
                key={index}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className={`p-3 rounded-full bg-white/10 backdrop-blur-lg ${option.color}`}
              >
                <option.icon className="w-6 h-6" />
              </motion.button>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};