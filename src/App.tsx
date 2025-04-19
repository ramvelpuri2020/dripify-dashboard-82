import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { initializePurchases } from "@/utils/revenueCat";
import Index from "./pages/Index";
import Profile from "./pages/Profile";
import Auth from "./pages/Auth";
import PaywallScreen from "./components/PaywallScreen";

const queryClient = new QueryClient();

const App = () => {
  const [session, setSession] = useState<boolean | null>(null);

  useEffect(() => {
    initializePurchases();
    
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(!!session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(!!session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (session === null) {
    return null; // Loading state
  }

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/*" element={session ? <Index /> : <Navigate to="/auth" />} />
            <Route
              path="/profile"
              element={session ? <Profile /> : <Navigate to="/auth" />}
            />
            <Route
              path="/auth"
              element={!session ? <Auth /> : <Navigate to="/" />}
            />
            <Route path="/paywall" element={<PaywallScreen />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
