import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const logStep = (step: string, details?: any) => {
  console.log(`[GET-ANALYTICS] ${step}`, details ? JSON.stringify(details) : '');
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep('Fetching analytics');

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    logStep('User authenticated', { userId: user.id });

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(todayStart);
    weekStart.setDate(weekStart.getDate() - 7);
    const monthStart = new Date(todayStart);
    monthStart.setDate(monthStart.getDate() - 30);

    // Get today's stats
    const { data: todaySales } = await supabase
      .from('sales_captured')
      .select('estimated_value')
      .eq('user_id', user.id)
      .gte('captured_at', todayStart.toISOString());

    const todayRevenue = todaySales?.reduce((sum, sale) => sum + (sale.estimated_value || 0), 0) || 0;
    const todayCount = todaySales?.length || 0;

    // Get week's stats
    const { data: weekSales } = await supabase
      .from('sales_captured')
      .select('estimated_value')
      .eq('user_id', user.id)
      .gte('captured_at', weekStart.toISOString());

    const weekRevenue = weekSales?.reduce((sum, sale) => sum + (sale.estimated_value || 0), 0) || 0;
    const weekCount = weekSales?.length || 0;

    // Get month's stats
    const { data: monthSales } = await supabase
      .from('sales_captured')
      .select('estimated_value')
      .eq('user_id', user.id)
      .gte('captured_at', monthStart.toISOString());

    const monthRevenue = monthSales?.reduce((sum, sale) => sum + (sale.estimated_value || 0), 0) || 0;
    const monthCount = monthSales?.length || 0;

    // Get recent sales (last 50)
    const { data: recentSales } = await supabase
      .from('sales_captured')
      .select('*')
      .eq('user_id', user.id)
      .order('captured_at', { ascending: false })
      .limit(50);

    // Get stream sessions count
    const { count: streamCount } = await supabase
      .from('stream_sessions')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);

    // Get profile for subscription info
    const { data: profile } = await supabase
      .from('profiles')
      .select('subscription_status, trial_ends_at, subscription_ends_at')
      .eq('id', user.id)
      .single();

    logStep('Analytics calculated', {
      todayRevenue,
      weekRevenue,
      monthRevenue,
    });

    return new Response(
      JSON.stringify({
        today: {
          revenue: todayRevenue,
          sales_count: todayCount,
        },
        week: {
          revenue: weekRevenue,
          sales_count: weekCount,
        },
        month: {
          revenue: monthRevenue,
          sales_count: monthCount,
        },
        recent_sales: recentSales || [],
        stream_count: streamCount || 0,
        subscription: profile ? {
          status: profile.subscription_status,
          trial_ends_at: profile.trial_ends_at,
          subscription_ends_at: profile.subscription_ends_at,
        } : null,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error: any) {
    logStep('ERROR', { message: error.message });
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
