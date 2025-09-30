import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import LiveStreamDashboard from "@/components/LiveStreamDashboard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Brain, 
  Zap, 
  TrendingUp, 
  MessageSquare,
  Play,
  BarChart3,
  Users,
  DollarSign,
  Sparkles,
  ArrowRight,
  CheckCircle
} from "lucide-react";

const Index = () => {
  const { toast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [showAuth, setShowAuth] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Update page title and meta description for SEO
    document.title = "DealFlow AI - Real-Time Chat Analysis for Live Stream Sellers | Turn Viewers Into Revenue";
    
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', 'DealFlow AI analyzes live stream chats in real-time to identify high-intent buyers and generate instant follow-up messages. Boost your conversion rate with AI-powered sales intelligence.');
    }

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        
        toast({
          title: "Welcome back!",
          description: "Successfully signed in to DealFlow AI",
        });
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/`
          }
        });
        if (error) throw error;
        
        toast({
          title: "Account created!",
          description: "Welcome to DealFlow AI - let's start analyzing your streams",
        });
      }
    } catch (error: any) {
      toast({
        title: "Authentication Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast({
      title: "Signed out",
      description: "Come back soon!",
    });
  };

  // If user is authenticated, show the dashboard
  if (user) {
    return <LiveStreamDashboard />;
  }

  // Show landing page for unauthenticated users
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 text-white">
      {/* Header */}
      <header className="border-b border-slate-700/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              DealFlow AI
            </h1>
          </div>
          <Button 
            onClick={() => setShowAuth(true)}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          >
            Get Started Free
          </Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-12">
        {/* Hero Section */}
        <section className="text-center mb-20">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-center mb-6">
              <div className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 px-4 py-2 rounded-full border border-blue-500/30">
                <span className="text-blue-400 text-sm font-medium">🔴 LIVE AI-Powered Chat Analysis</span>
              </div>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-white via-blue-100 to-purple-100 bg-clip-text text-transparent leading-tight">
              Stop Losing Sales in Your <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">Live Chat</span>
            </h1>
            
            <p className="text-xl md:text-2xl text-slate-300 mb-8 leading-relaxed">
              DealFlow AI instantly analyzes every chat message during your live streams, identifies high-intent buyers, and generates personalized follow-up messages that convert.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
              <Button 
                size="lg"
                onClick={() => setShowAuth(true)}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-lg px-8 py-4"
              >
                <Play className="w-5 h-5 mr-2" />
                Start 14-Day Free Trial
              </Button>
              <div className="text-slate-400 text-sm">
                No credit card required • Setup in 2 minutes
              </div>
            </div>

            {/* Live Demo Preview */}
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700 p-8 mb-12">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                <span className="text-red-400 font-medium">LIVE DEMO</span>
              </div>
              
              <div className="space-y-3 text-left">
                <div className="bg-slate-700/50 rounded-lg p-3 flex items-center justify-between">
                  <div>
                    <span className="text-blue-400 font-medium">@sneakerfan:</span>
                    <span className="text-white ml-2">"I'll take the blue hoodie if it's under $50"</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="bg-red-100 text-red-800 px-2 py-1 rounded text-xs">Buy Intent (89%)</div>
                    <Zap className="w-4 h-4 text-yellow-400" />
                  </div>
                </div>
                
                <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3">
                  <div className="text-green-400 text-sm font-medium mb-1">🤖 AI Generated Follow-up:</div>
                  <div className="text-white">"Hey sneakerfan! That blue hoodie is $45 - perfect for you! I can hold it for 30 minutes. Ready to claim it?"</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* The Problem */}
        <section className="mb-20">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-red-400 to-orange-400 bg-clip-text text-transparent">
              The $1,000/Hour Problem
            </h2>
            <p className="text-xl text-slate-300">You're leaving money on the table every single stream</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
              <CardHeader>
                <div className="w-12 h-12 bg-red-500/20 rounded-lg flex items-center justify-center mb-4">
                  <MessageSquare className="w-6 h-6 text-red-400" />
                </div>
                <CardTitle className="text-white">Chaotic Chat Overload</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-300">
                  You're getting hundreds of messages per stream but only catching 20% of the real buyers. The rest slip through the cracks.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
              <CardHeader>
                <div className="w-12 h-12 bg-orange-500/20 rounded-lg flex items-center justify-center mb-4">
                  <Users className="w-6 h-6 text-orange-400" />
                </div>
                <CardTitle className="text-white">Manual Follow-ups Fail</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-300">
                  By the time you finish your stream and manually review chat logs, your hot leads have already bought from someone else.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
              <CardHeader>
                <div className="w-12 h-12 bg-yellow-500/20 rounded-lg flex items-center justify-center mb-4">
                  <DollarSign className="w-6 h-6 text-yellow-400" />
                </div>
                <CardTitle className="text-white">Revenue Hemorrhaging</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-300">
                  Every missed "I'll take it" message is $50-500 lost. Over a month, that's thousands in lost revenue.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* The Solution */}
        <section className="mb-20">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              Your AI Sales Assistant That Never Sleeps
            </h2>
            <p className="text-xl text-slate-300">Turn every chat message into revenue with real-time AI analysis</p>
          </div>

          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Brain className="w-6 h-6 text-blue-400" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white mb-2">Instant Intent Detection</h3>
                  <p className="text-slate-300">
                    AI analyzes every message in real-time, scoring purchase intent from 0-100% and flagging high-value opportunities instantly.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-6 h-6 text-green-400" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white mb-2">Smart Follow-up Generation</h3>
                  <p className="text-slate-300">
                    Automatically creates personalized DM templates for each buyer, including their specific product interests and urgency level.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <TrendingUp className="w-6 h-6 text-purple-400" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white mb-2">Revenue Tracking & Attribution</h3>
                  <p className="text-slate-300">
                    Track which messages convert to sales, optimize your strategy, and see your ROI grow stream after stream.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-2xl border border-blue-500/30 p-8">
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-green-400 font-medium">Real-time Analysis Active</span>
                </div>
                
                <div className="bg-slate-800/50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-blue-400 text-sm">High Intent Messages Today</span>
                    <span className="text-white font-bold">47</span>
                  </div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-green-400 text-sm">Auto-Generated Follow-ups</span>
                    <span className="text-white font-bold">47</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-yellow-400 text-sm">Revenue Attributed</span>
                    <span className="text-white font-bold">$2,847</span>
                  </div>
                </div>
                
                <div className="text-center pt-4">
                  <div className="text-3xl font-bold text-white mb-1">6.2x</div>
                  <div className="text-slate-400 text-sm">Average ROI Increase</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Key Benefits */}
        <section className="mb-20">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4 text-white">The DealFlow Difference</h2>
            <p className="text-xl text-slate-300">Replace manual work with AI precision</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-2xl border border-blue-500/30 p-8 text-center">
              <div className="w-16 h-16 bg-blue-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Zap className="w-8 h-8 text-blue-400" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">Replace Your $15/Hour Assistant</h3>
              <p className="text-slate-300 mb-6">
                Stop paying someone to manually log chat messages. DealFlow captures everything automatically with 99% accuracy.
              </p>
              <div className="text-green-400 font-bold">Save $600/month</div>
            </div>

            <div className="bg-gradient-to-br from-green-500/10 to-blue-500/10 rounded-2xl border border-green-500/30 p-8 text-center">
              <div className="w-16 h-16 bg-green-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <ArrowRight className="w-8 h-8 text-green-400" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">Never Miss a Follow-up Again</h3>
              <p className="text-slate-300 mb-6">
                Get instant notifications for high-intent messages and AI-generated follow-up templates ready to copy & paste.
              </p>
              <div className="text-green-400 font-bold">30% more conversions</div>
            </div>

            <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-2xl border border-purple-500/30 p-8 text-center">
              <div className="w-16 h-16 bg-purple-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <BarChart3 className="w-8 h-8 text-purple-400" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">Eliminate Post-Show Admin</h3>
              <p className="text-slate-300 mb-6">
                Turn 4 hours of manual chat review into a 1-minute organized lead report with contact info and follow-up templates.
              </p>
              <div className="text-green-400 font-bold">Reclaim 20 hours/week</div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="text-center bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-2xl border border-blue-500/30 p-12">
          <h2 className="text-4xl font-bold mb-4 text-white">
            Ready to 10x Your Live Stream Revenue?
          </h2>
          <p className="text-xl text-slate-300 mb-8">
            Join 1,000+ sellers already using DealFlow AI to turn every viewer into a buyer
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
            <Button 
              size="lg"
              onClick={() => setShowAuth(true)}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-lg px-12 py-4"
            >
              Start Your Free Trial
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </div>

          <div className="flex items-center justify-center gap-8 text-slate-400 text-sm">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-400" />
              14-day free trial
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-400" />
              No credit card required
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-400" />
              Setup in 2 minutes
            </div>
          </div>
        </section>
      </main>

      {/* Auth Modal */}
      {showAuth && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white text-center">
                {isLogin ? 'Welcome Back' : 'Start Your Free Trial'}
              </CardTitle>
              <CardDescription className="text-center">
                {isLogin 
                  ? 'Sign in to your DealFlow AI account' 
                  : 'Create your account and start analyzing streams in 2 minutes'
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAuth} className="space-y-4">
                <div>
                  <Label htmlFor="email" className="text-white">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    className="bg-slate-700 border-slate-600 text-white"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="password" className="text-white">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="bg-slate-700 border-slate-600 text-white"
                    required
                  />
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                  disabled={isLoading}
                >
                  {isLoading ? 'Please wait...' : (isLogin ? 'Sign In' : 'Start Free Trial')}
                </Button>
              </form>
              
              <div className="mt-4 text-center">
                <button
                  onClick={() => setIsLogin(!isLogin)}
                  className="text-blue-400 hover:text-blue-300 text-sm"
                >
                  {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
                </button>
              </div>
              
              <div className="mt-4 text-center">
                <button
                  onClick={() => setShowAuth(false)}
                  className="text-slate-400 hover:text-slate-300 text-sm"
                >
                  Close
                </button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default Index;
