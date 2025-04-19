
import { serve } from "https://deno.fresh.dev/std@0.192.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const publicKey = Deno.env.get('REVENUECAT_PUBLIC_KEY');
    
    // For debugging
    console.log("RevenueCat public key retrieved:", publicKey ? "Found key" : "Key not found");
    
    if (!publicKey) {
      throw new Error('RevenueCat public key not configured');
    }

    return new Response(
      JSON.stringify({ publicKey }),
      { 
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      },
    );
  } catch (error) {
    console.error("Error in revenuecat-config function:", error.message);
    
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      },
    );
  }
});
