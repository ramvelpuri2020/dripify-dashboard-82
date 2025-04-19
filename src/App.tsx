import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SubscriptionProvider } from "@/contexts/SubscriptionContext";
import { initializePurchases } from "@/utils/revenueCat";
import Index from "./pages/Index";
import Profile from "./pages/Profile";
import Auth from "./pages/Auth";
import { Session } from "@supabase/supabase-js";

const queryClient = new QueryClient();

const App = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    console.log('App component mounted');
    
    const checkSession = async () => {
      try {
        console.log('Checking session...');
        const { data: { session }, error } = await supabase.auth.getSession();
        console.log('Session check result:', { session: !!session, error });
        setSession(session);
        if (error) {
          console.error('Session check error:', error);
          setError(error.message);
        }
      } catch (err) {
        console.error('Unexpected error during session check:', err);
        setError('Failed to check session');
      }
    };

    const initializeApp = async () => {
      try {
        await checkSession();
        if (session?.user) {
          await initializePurchases(session.user.id);
        }
        setIsInitialized(true);
      } catch (err) {
        console.error('Failed to initialize app:', err);
        setError('Failed to initialize app');
      }
    };

    initializeApp();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', { event, session: !!session });
      setSession(session);
      if (event === 'SIGNED_IN' && session?.user) {
        await initializePurchases(session.user.id);
      }
    });

    return () => {
      console.log('App component unmounting');
      subscription.unsubscribe();
    };
  }, []);

  console.log('Current render state:', { session: !!session, error, isInitialized });

  if (!isInitialized) {
    console.log('Showing loading state');
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
          {error && <p className="mt-2 text-red-500">Error: {error}</p>}
        </div>
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <SubscriptionProvider>
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
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </SubscriptionProvider>
    </QueryClientProvider>
  );
};

export default App;
