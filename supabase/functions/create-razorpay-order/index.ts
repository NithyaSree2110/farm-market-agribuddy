import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { amount, cropId, quantity } = await req.json();
    
    const razorpayKeyId = Deno.env.get('Razorpay_apikey');
    const razorpayKeySecret = Deno.env.get('Razorpay_key_secret');

    // If secret is not configured, return a simulated order for test mode
    // This prevents crashes when RAZORPAY_KEY_SECRET is missing
    if (!razorpayKeyId || !razorpayKeySecret) {
      console.warn('Razorpay credentials not configured - returning simulated order');
      return new Response(
        JSON.stringify({ 
          error: 'RAZORPAY_NOT_CONFIGURED',
          message: 'Razorpay credentials not configured. Using simulated payment mode.',
        }),
        { 
          status: 200, // Return 200 so frontend can handle gracefully
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const orderData = {
      amount: amount * 100, // Razorpay expects amount in paise
      currency: 'INR',
      receipt: `order_${Date.now()}`,
      notes: {
        cropId,
        quantity,
      },
    };

    const credentials = btoa(`${razorpayKeyId}:${razorpayKeySecret}`);
    
    console.log('Creating Razorpay order with amount:', orderData.amount);
    
    const response = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${credentials}`,
      },
      body: JSON.stringify(orderData),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Razorpay API error:', errorText);
      throw new Error('Failed to create Razorpay order');
    }

    const order = await response.json();
    console.log('Razorpay order created:', order.id);

    return new Response(JSON.stringify(order), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error:', errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
