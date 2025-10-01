import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, Download, Power, Play, LogOut, Settings } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Claim {
  id: string;
  buyer_username: string;
  item_description: string;
  estimated_value: number;
  captured_at: string;
  message_text: string;
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
  const [selectedPlatform, setSelectedPlatform] = useState("whatnot");
  const [isPortalLoading, setIsPortalLoading] = useState(false);

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
            className="bg-gray-800 text-white border-gray-600 hover:bg-gray-700 hover:text-white"
          >
            <Settings className="w-4 h-4 mr-2" />
            {isPortalLoading ? "Loading..." : "Manage"}
          </Button>
          {activeSession ? (
            <Button
              onClick={onEndStream}
              variant="destructive"
              size="sm"
            >
              <Power className="w-4 h-4 mr-2" />
              End
            </Button>
          ) : (
            <Button
              onClick={() => {
                if (selectedPlatform.includes('whatnot.com')) {
                  onStartStream(selectedPlatform);
                }
              }}
              className="bg-green-600 hover:bg-green-700"
              size="sm"
              disabled={!selectedPlatform.includes('whatnot.com')}
            >
              <Play className="w-4 h-4 mr-2" />
              Start
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

      <div className="p-6">
        {/* Whatnot URL Input - only show when no active session */}
        {!activeSession && (
          <div className="mb-6">
            <div className="bg-gradient-to-r from-blue-900/50 to-purple-900/50 rounded-lg p-6 border border-blue-500/30">
              <div className="flex gap-4">
                <input
                  type="text"
                  placeholder="Paste your Whatnot live stream URL here..."
                  className="flex-1 bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={selectedPlatform === "whatnot" ? "" : selectedPlatform}
                  onChange={(e) => setSelectedPlatform(e.target.value)}
                />
                <Button
                  onClick={() => {
                    if (selectedPlatform.includes('whatnot.com')) {
                      onStartStream(selectedPlatform);
                    } else {
                      onStartStream("whatnot");
                    }
                  }}
                  className="bg-green-600 hover:bg-green-700 px-8"
                  size="lg"
                >
                  <Play className="w-5 h-5 mr-2" />
                  Start
                </Button>
              </div>
            </div>
          </div>
        )}
        
        {/* Two-Pane Layout */}
        <div className="grid grid-cols-2 gap-6">
          {/* Left - Live Chat */}
          <div className="bg-gray-800 rounded-lg p-6 flex flex-col h-[calc(100vh-220px)]">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Live Chat</h2>
              {activeSession && (
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-sm text-green-400">Monitoring</span>
                </div>
              )}
            </div>

            <div className="flex-1 bg-gray-900 rounded-lg p-4 overflow-y-auto space-y-2">
              {!activeSession ? (
                <div className="text-center text-gray-500 mt-8">
                  <p>Paste your Whatnot URL above to start</p>
                </div>
              ) : claims.length === 0 ? (
                <div className="text-center text-gray-500 mt-8">
                  <p>Watching for messages...</p>
                </div>
              ) : (
                claims.slice(0, 10).map((claim) => (
                  <div
                    key={claim.id}
                    className="bg-gray-800 rounded p-3"
                  >
                    <div className="flex items-start gap-2">
                      <span className="text-blue-400 font-semibold">
                        {claim.buyer_username}
                      </span>
                      <span className="text-gray-300">{claim.message_text}</span>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {new Date(claim.captured_at).toLocaleTimeString()}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Right - Captured Sales */}
          <div className="bg-gray-800 rounded-lg p-6 flex flex-col h-[calc(100vh-220px)]">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold flex items-center gap-2">
                Captured Sales
                <span className="bg-green-600 text-white px-2 py-1 rounded-full text-sm">
                  {claims.length}
                </span>
              </h2>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 mb-4">
              {claims.length === 0 ? (
                <div className="text-center text-gray-500 mt-8">
                  <AlertCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p className="font-semibold">No sales yet</p>
                  <p className="text-sm mt-2">
                    Purchase commitments will appear here
                  </p>
                </div>
              ) : (
                claims.map((claim) => (
                  <div
                    key={claim.id}
                    className="bg-gray-900 rounded-lg p-4 border border-green-500/30"
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
              Export ({claims.length})
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
