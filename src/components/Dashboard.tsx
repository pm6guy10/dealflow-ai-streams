import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, Download, Power, Play, LogOut, Settings, Copy, Check } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { MessageTester } from "@/components/MessageTester";
import { SubscriptionPrompt } from "@/components/SubscriptionPrompt";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Claim {
  id: string;
  buyer_username: string;
  item_description: string;
  estimated_value: number;
  captured_at: string;
}

interface StreamSession {
  id: string;
  started_at: string;
  platform: string;
}

interface DashboardProps {
  activeSession: StreamSession | null;
  claims: Claim[];
  onStartStream: (platform: string) => void;
  onEndStream: () => void;
  onSimulateClaim: () => void;
  onExport: () => void;
  onSignOut: () => void;
}

const Dashboard = ({
  activeSession,
  claims,
  onStartStream,
  onEndStream,
  onSimulateClaim,
  onExport,
  onSignOut
}: DashboardProps) => {
  const { subscribed, subscriptionEnd } = useAuth();
  const { toast } = useToast();
  const [streamTime, setStreamTime] = useState(0);
  const [showEndDialog, setShowEndDialog] = useState(false);
  const [showStartDialog, setShowStartDialog] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState("Whatnot");
  const [isPortalLoading, setIsPortalLoading] = useState(false);
  const [authToken, setAuthToken] = useState<string>("");
  const [tokenCopied, setTokenCopied] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('sb-piqmyciivlcfxmcopeqk-auth-token');
    if (token) {
      setAuthToken(token);
    }
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (activeSession) {
      const startTime = new Date(activeSession.started_at).getTime();
      interval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        setStreamTime(elapsed);
      }, 1000);
    } else {
      setStreamTime(0);
    }
    return () => clearInterval(interval);
  }, [activeSession]);

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, "0")}:${mins
      .toString()
      .padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleStartStreamClick = () => {
    onStartStream(selectedPlatform);
    setShowStartDialog(false);
  };

  const handleEndStreamClick = () => {
    onEndStream();
    setShowEndDialog(false);
  };

  const handleManageSubscription = async () => {
    setIsPortalLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('customer-portal');
      
      if (error) throw error;
      
      if (data?.url) {
        window.open(data.url, '_blank');
      }
    } catch (error) {
      console.error('Error opening customer portal:', error);
      toast({
        title: "Error",
        description: "Could not open subscription management. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsPortalLoading(false);
    }
  };

  const copyTokenToClipboard = () => {
    navigator.clipboard.writeText(authToken);
    setTokenCopied(true);
    toast({
      title: "Token Copied!",
      description: "Auth token copied to clipboard. Paste it in the extension.",
    });
    setTimeout(() => setTokenCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Top Bar */}
      <div className="bg-gray-900 text-white px-6 py-4 flex items-center justify-between border-b border-gray-700">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold">Deal Flow</h1>
          <div className="text-sm opacity-75">
            Stream Timer: {formatTime(streamTime)}
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="bg-blue-600 px-3 py-1 rounded-full text-sm font-semibold">
            {claims.length} Claims
          </div>
          {subscribed && subscriptionEnd && (
            <div className="text-sm">
              <Badge variant="outline" className="bg-green-500/10 text-green-400 border-green-500/20">
                Active
              </Badge>
              <span className="ml-2 opacity-75">Renews {new Date(subscriptionEnd).toLocaleDateString()}</span>
            </div>
          )}
          {!subscribed && (
            <Badge variant="outline" className="bg-yellow-500/10 text-yellow-400 border-yellow-500/20">
              Trial
            </Badge>
          )}
          <Button 
            onClick={handleManageSubscription} 
            variant="outline" 
            size="sm"
            disabled={isPortalLoading}
            className="text-white border-gray-700 hover:bg-gray-800"
          >
            <Settings className="w-4 h-4 mr-2" />
            {isPortalLoading ? "Loading..." : "Manage"}
          </Button>
          {activeSession ? (
            <Button
              onClick={() => setShowEndDialog(true)}
              variant="destructive"
              size="sm"
            >
              <Power className="w-4 h-4 mr-2" />
              End Stream
            </Button>
          ) : (
            <Button
              onClick={() => setShowStartDialog(true)}
              className="bg-green-600 hover:bg-green-700"
              size="sm"
            >
              <Play className="w-4 h-4 mr-2" />
              Start Stream
            </Button>
          )}
          <Button
            onClick={onSignOut}
            variant="ghost"
            size="sm"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-[40%_60%] gap-6 p-6">
        {/* Show subscription prompt if not subscribed */}
        {!subscribed && (
          <div className="col-span-2 mb-4">
            <SubscriptionPrompt />
          </div>
        )}

        {/* Extension Setup Instructions - only show when no active session */}
        {!activeSession && (
          <div className="col-span-2">
            <div className="bg-gradient-to-r from-blue-900/50 to-purple-900/50 rounded-lg p-6 border border-blue-500/30">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Download className="w-5 h-5" />
                Quick Start: Install Chrome Extension
              </h3>

              {/* Auth Token Display */}
              {authToken && (
                <div className="bg-gray-900/70 rounded-lg p-4 mb-4 border border-green-500/30">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-green-400">Your Auth Token:</span>
                    <Button
                      onClick={copyTokenToClipboard}
                      size="sm"
                      variant="outline"
                      className="text-xs"
                    >
                      {tokenCopied ? (
                        <>
                          <Check className="w-3 h-3 mr-1" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3 mr-1" />
                          Copy Token
                        </>
                      )}
                    </Button>
                  </div>
                  <code className="text-xs bg-gray-800 px-2 py-1 rounded block overflow-x-auto text-gray-300 font-mono">
                    {authToken}
                  </code>
                </div>
              )}
              
              <div className="grid md:grid-cols-3 gap-4 mb-4">
                <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-700">
                  <div className="font-bold text-blue-400 mb-2">1. Load Extension</div>
                  <p className="text-sm text-gray-300">
                    Open <code className="bg-gray-800 px-1 rounded">chrome://extensions/</code>
                    <br />Enable Developer Mode
                    <br />Click "Load unpacked"
                    <br />Select <code className="bg-gray-800 px-1 rounded">chrome-extension</code> folder from your project
                  </p>
                </div>
                
                <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-700">
                  <div className="font-bold text-blue-400 mb-2">2. Copy Your Auth Token</div>
                  <p className="text-sm text-gray-300">
                    Click the "Copy Token" button above ☝️
                    <br />
                    <br />
                    The token is automatically displayed for easy access!
                  </p>
                </div>
                
                <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-700">
                  <div className="font-bold text-blue-400 mb-2">3. Start Monitoring</div>
                  <p className="text-sm text-gray-300">
                    Click DealFlow extension icon
                    <br />Paste your token
                    <br />Go to any Whatnot stream
                    <br />Click "Start Monitoring"
                  </p>
                </div>
              </div>
              
              <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-3">
                <p className="text-sm text-green-400">
                  💡 <strong>Ready to test?</strong> Go to{" "}
                  <a 
                    href="https://www.whatnot.com/live/b3a03169-cac1-4289-9ffc-e04b25390a61" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="underline hover:text-green-300"
                  >
                    Gary Vee's Whatnot stream
                  </a>
                  {" "}and watch it auto-capture sales in real-time!
                </p>
              </div>
            </div>
          </div>
        )}
        
        {/* AI Message Tester - only show when stream is active */}
        {activeSession && (
          <div className="col-span-2">
            <MessageTester 
              streamSessionId={activeSession.id} 
              platform={activeSession.platform}
            />
          </div>
        )}
        
        {/* Left Column - Chat Monitor */}
        <div className="bg-gray-800 rounded-lg p-6 flex flex-col h-[calc(100vh-180px)]">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">Live Chat Monitor</h2>
            {activeSession && (
              <Button
                onClick={onSimulateClaim}
                variant="outline"
                size="sm"
                className="text-xs"
              >
                Simulate Claim (Dev)
              </Button>
            )}
          </div>

          <div className="flex-1 bg-gray-900 rounded-lg p-4 overflow-y-auto space-y-2">
            {!activeSession ? (
              <div className="text-center text-gray-500 mt-8">
                <p>No active stream</p>
                <p className="text-sm mt-2">
                  Start a stream to begin monitoring chat
                </p>
              </div>
            ) : claims.length === 0 ? (
              <div className="text-center text-gray-500 mt-8">
                <p>Monitoring {activeSession.platform} chat...</p>
                <p className="text-sm mt-2">
                  Claims will appear here automatically
                </p>
              </div>
            ) : (
              claims.slice(0, 10).map((claim) => (
                <div
                  key={claim.id}
                  className="bg-gray-800 rounded p-3 hover:bg-gray-700 transition-colors"
                >
                  <div className="flex items-start gap-2">
                    <span className="text-blue-400 font-semibold">
                      {claim.buyer_username}
                    </span>
                    <span className="text-gray-300">{claim.item_description}</span>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {new Date(claim.captured_at).toLocaleTimeString()}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Column - Captured Claims */}
        <div className="bg-gray-800 rounded-lg p-6 flex flex-col h-[calc(100vh-180px)]">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold flex items-center gap-2">
              Captured Claims
              <span className="bg-green-600 text-white px-2 py-1 rounded-full text-sm">
                {claims.length}
              </span>
            </h2>
          </div>

          <div className="flex-1 overflow-y-auto space-y-3 mb-4">
            {claims.length === 0 ? (
              <div className="text-center text-gray-500 mt-8">
                <AlertCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p className="font-semibold">No claims captured yet</p>
                <p className="text-sm mt-2">
                  {activeSession ? "Claims will appear here automatically" : "Start your stream!"}
                </p>
              </div>
            ) : (
              claims.map((claim, index) => (
                <div
                  key={claim.id}
                  className={`bg-gray-900 rounded-lg p-4 border border-gray-700 hover:border-blue-500 transition-all ${
                    index === 0 ? "animate-pulse-once" : ""
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-blue-400 font-semibold">
                      {claim.buyer_username}
                    </span>
                    <span className="text-green-400 font-bold">
                      ${claim.estimated_value}
                    </span>
                  </div>
                  <div className="text-gray-300 text-sm mb-2">
                    {claim.item_description}
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>{new Date(claim.captured_at).toLocaleTimeString()}</span>
                    <span className="text-green-500">✓ captured</span>
                  </div>
                </div>
              ))
            )}
          </div>

          <Button
            onClick={onExport}
            className="w-full bg-blue-600 hover:bg-blue-700"
            disabled={claims.length === 0}
            size="lg"
          >
            <Download className="w-5 h-5 mr-2" />
            Export to CSV ({claims.length} claims)
          </Button>
        </div>
      </div>

      {/* Start Stream Dialog */}
      <AlertDialog open={showStartDialog} onOpenChange={setShowStartDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Start New Stream</AlertDialogTitle>
            <AlertDialogDescription>
              Select the platform you'll be streaming on:
              <div className="mt-4">
                <Select value={selectedPlatform} onValueChange={setSelectedPlatform}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Whatnot">Whatnot</SelectItem>
                    <SelectItem value="TikTok">TikTok Shop</SelectItem>
                    <SelectItem value="Instagram">Instagram Live</SelectItem>
                    <SelectItem value="Facebook">Facebook Live</SelectItem>
                    <SelectItem value="YouTube">YouTube Live</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleStartStreamClick}
              className="bg-green-600 hover:bg-green-700"
            >
              Start Stream
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* End Stream Confirmation Dialog */}
      <AlertDialog open={showEndDialog} onOpenChange={setShowEndDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>End Stream?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to end this stream?
              <div className="mt-4 p-3 bg-blue-900/20 rounded-lg">
                <p className="text-sm text-blue-400">
                  Stream duration: {formatTime(streamTime)}
                </p>
                <p className="text-sm text-blue-400">
                  Total claims captured: {claims.length}
                </p>
              </div>
              {claims.length > 0 && (
                <p className="mt-2 text-sm text-yellow-400">
                  💡 Don't forget to export your claims before ending!
                </p>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleEndStreamClick}
              className="bg-red-600 hover:bg-red-700"
            >
              End Stream
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Dashboard;
