
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import Index from "./pages/Index";
import Profile from "./pages/Profile";
import Auth from "./pages/Auth";
import { SubscriptionCheck } from "@/components/SubscriptionCheck";

// Create QueryClient outside of component to avoid re-creation on renders
const queryClient = new QueryClient();

const App = () => {
  const [session, setSession] = useState<boolean | null>(null);

  useEffect(() => {
    // Check initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(!!session);
    });

    // Set up auth state listener
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(!!session);
    });

    // Clean up subscription
    return () => subscription.unsubscribe();
  }, []);

  // Show loading state when session is null
  if (session === null) {
    return null;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <SubscriptionCheck>
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
            </Routes>
          </SubscriptionCheck>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
