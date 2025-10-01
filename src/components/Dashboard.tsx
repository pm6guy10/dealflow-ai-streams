import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertCircle, Download, Power, Play, LogOut } from "lucide-react";
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
  const [streamTime, setStreamTime] = useState(0);
  const [showEndDialog, setShowEndDialog] = useState(false);
  const [showStartDialog, setShowStartDialog] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState("Whatnot");

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
