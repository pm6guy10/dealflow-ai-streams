import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, TrendingUp, ShoppingCart, Clock } from 'lucide-react';

export default function Dashboard() {
  const { toast } = useToast();
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('get-analytics');
      
      if (error) throw error;
      
      setAnalytics(data);
    } catch (error: any) {
      toast({
        title: 'Error loading analytics',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCheckout = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('create-checkout-session');
      
      if (error) throw error;
      
      if (data?.url) {
        window.open(data.url, '_blank');
      }
    } catch (error: any) {
      toast({
        title: 'Error creating checkout',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  const subscriptionStatus = analytics?.subscription?.status || 'none';
  const needsSubscription = !['trial', 'active'].includes(subscriptionStatus);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold gradient-text">DealFlow</h1>
          <div className="flex gap-4 items-center">
            {needsSubscription ? (
              <Button onClick={handleCheckout} className="bg-green-600 hover:bg-green-700">
                Start Your 14-Day Free Trial
              </Button>
            ) : (
              <div className="flex gap-2 items-center">
                <span className="text-sm px-3 py-1 bg-green-100 text-green-700 rounded-full font-semibold">
                  {subscriptionStatus === 'trial' ? `Trial Active` : 'Active'}
                </span>
              </div>
            )}
            <Button onClick={handleSignOut} variant="outline">
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {needsSubscription ? (
          <Card className="mb-8 border-yellow-300 bg-yellow-50">
            <CardHeader>
              <CardTitle className="text-yellow-800">Activate Your Subscription</CardTitle>
              <CardDescription>
                Start your 14-day free trial to begin capturing sales from your live streams
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={handleCheckout} className="bg-blue-600 hover:bg-blue-700">
                Start Free Trial - $19.99/mo after
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Today's Revenue</CardTitle>
                  <DollarSign className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">${analytics?.today?.revenue?.toFixed(2) || '0.00'}</div>
                  <p className="text-xs text-muted-foreground">
                    {analytics?.today?.sales_count || 0} sales
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">This Week</CardTitle>
                  <TrendingUp className="h-4 w-4 text-blue-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">${analytics?.week?.revenue?.toFixed(2) || '0.00'}</div>
                  <p className="text-xs text-muted-foreground">
                    {analytics?.week?.sales_count || 0} sales
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">This Month</CardTitle>
                  <ShoppingCart className="h-4 w-4 text-purple-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">${analytics?.month?.revenue?.toFixed(2) || '0.00'}</div>
                  <p className="text-xs text-muted-foreground">
                    {analytics?.month?.sales_count || 0} sales
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Streams</CardTitle>
                  <Clock className="h-4 w-4 text-orange-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{analytics?.stream_count || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    all time
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Recent Sales */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Sales Captured</CardTitle>
                <CardDescription>
                  Latest sales detected by your Chrome extension
                </CardDescription>
              </CardHeader>
              <CardContent>
                {analytics?.recent_sales?.length > 0 ? (
                  <div className="space-y-4">
                    {analytics.recent_sales.slice(0, 10).map((sale: any) => (
                      <div key={sale.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div>
                          <div className="font-semibold">{sale.buyer_username}</div>
                          <div className="text-sm text-gray-600">{sale.message_text}</div>
                          <div className="text-xs text-gray-500 mt-1">
                            {sale.platform} • {new Date(sale.captured_at).toLocaleString()}
                          </div>
                        </div>
                        {sale.estimated_value && (
                          <div className="text-lg font-bold text-green-600">
                            ${sale.estimated_value}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <p className="text-lg font-semibold mb-2">No sales captured yet</p>
                    <p className="text-sm">Install the Chrome extension and start streaming to begin capturing sales</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Chrome Extension Instructions */}
            <Card className="mt-8">
              <CardHeader>
                <CardTitle>Chrome Extension Setup</CardTitle>
                <CardDescription>
                  Install the DealFlow Chrome extension to start capturing sales
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ol className="list-decimal list-inside space-y-2 text-sm">
                  <li>Install the DealFlow Chrome Extension from the Chrome Web Store</li>
                  <li>Click the extension icon and sign in with your DealFlow account</li>
                  <li>Start your live stream on TikTok, Instagram, Whatnot, or any platform</li>
                  <li>The extension will automatically detect and capture sales in real-time</li>
                  <li>View all captured sales here in your dashboard</li>
                </ol>
              </CardContent>
            </Card>
          </>
        )}
      </main>
    </div>
  );
}
