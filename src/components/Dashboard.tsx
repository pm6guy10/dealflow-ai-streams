import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Check, Download, AlertCircle } from 'lucide-react';
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

interface Claim {
  id: string;
  username: string;
  item: string;
  price: number;
  timestamp: string;
}

interface ChatMessage {
  id: string;
  username: string;
  message: string;
  timestamp: string;
}

export default function Dashboard() {
  const { toast } = useToast();
  const [claims, setClaims] = useState<Claim[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [streamTime, setStreamTime] = useState(0);
  const [showEndDialog, setShowEndDialog] = useState(false);
  const [showClearDialog, setShowClearDialog] = useState(false);

  // Stream timer
  useEffect(() => {
    const interval = setInterval(() => {
      setStreamTime(prev => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Simulate chat messages
  useEffect(() => {
    const sampleMessages = [
      { username: 'buyer123', message: 'How much for the blue one?' },
      { username: 'shopper_jane', message: 'SOLD! I\'ll take it' },
      { username: 'collector99', message: 'Can you hold it for me?' },
      { username: 'deal_hunter', message: '$50 for the set?' },
    ];

    const addMessage = () => {
      const msg = sampleMessages[Math.floor(Math.random() * sampleMessages.length)];
      const newMessage: ChatMessage = {
        id: Date.now().toString(),
        username: msg.username,
        message: msg.message,
        timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      };
      
      setChatMessages(prev => [newMessage, ...prev].slice(0, 50));
    };

    const interval = setInterval(addMessage, 5000);
    addMessage();

    return () => clearInterval(interval);
  }, []);

  // Keyboard shortcut for export
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'e') {
        e.preventDefault();
        if (claims.length > 0) {
          handleExport();
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [claims]);

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const simulateClaim = () => {
    const items = ['Vintage T-Shirt', 'Nike Sneakers', 'Supreme Hoodie', 'Trading Cards Set', 'Collectible Figure'];
    const usernames = ['buyer123', 'shopper_jane', 'collector99', 'deal_hunter', 'reseller_pro'];
    
    const newClaim: Claim = {
      id: Date.now().toString(),
      username: usernames[Math.floor(Math.random() * usernames.length)],
      item: items[Math.floor(Math.random() * items.length)],
      price: Math.floor(Math.random() * 100) + 20,
      timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
    };

    setClaims(prev => [newClaim, ...prev]);
    
    toast({
      title: "Claim Captured!",
      description: `@${newClaim.username} - ${newClaim.item}`,
    });
  };

  const handleExport = () => {
    const csvContent = [
      ['Username', 'Item', 'Price', 'Timestamp', 'Stream_Date'],
      ...claims.map(claim => [
        claim.username,
        claim.item,
        claim.price.toString(),
        claim.timestamp,
        new Date().toLocaleDateString(),
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dealflow_export_${new Date().toISOString().split('T')[0]}_${Date.now()}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    toast({
      title: "Export Successful!",
      description: `${claims.length} claims exported successfully!`,
    });
  };

  const handleEndStream = () => {
    setShowEndDialog(false);
    const duration = formatTime(streamTime);
    const claimCount = claims.length;
    
    setClaims([]);
    setStreamTime(0);
    setChatMessages([]);
    
    toast({
      title: "Stream Ended",
      description: `${claimCount} claims captured in ${duration}`,
    });
  };

  const handleClearAll = () => {
    setShowClearDialog(false);
    setClaims([]);
    toast({
      title: "Claims Cleared",
      description: "All claims have been removed",
    });
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Top Bar */}
      <header className="border-b bg-card">
        <div className="px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-8">
            <h1 className="text-2xl font-bold gradient-text">Deal Flow</h1>
            <div className="flex items-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">Stream Timer:</span>
                <span className="font-mono text-lg font-semibold">{formatTime(streamTime)}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">Total Claims:</span>
                <span className="font-semibold text-lg">{claims.length}</span>
              </div>
            </div>
          </div>
          <div className="flex gap-3">
            <Button 
              onClick={() => setShowEndDialog(true)}
              variant="destructive"
            >
              End Stream
            </Button>
            <Button onClick={handleSignOut} variant="outline">
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <div className="flex h-[calc(100vh-73px)]">
        {/* Left Column - Chat Monitor */}
        <div className="w-[40%] border-r bg-muted/30 flex flex-col">
          <div className="p-4 border-b bg-card">
            <h2 className="text-lg font-semibold">Live Chat Monitor</h2>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {chatMessages.map(msg => (
              <div key={msg.id} className="bg-card p-3 rounded-lg border animate-fade-in">
                <div className="flex justify-between items-start mb-1">
                  <span className="font-semibold text-sm">@{msg.username}</span>
                  <span className="text-xs text-muted-foreground">{msg.timestamp}</span>
                </div>
                <p className="text-sm">{msg.message}</p>
              </div>
            ))}
          </div>

          {/* Dev Mode - Simulate Claim Button */}
          <div className="p-4 border-t bg-card">
            <Button 
              onClick={simulateClaim}
              className="w-full"
              variant="secondary"
            >
              Simulate Claim (Dev)
            </Button>
          </div>
        </div>

        {/* Right Column - Captured Claims */}
        <div className="flex-1 flex flex-col bg-background">
          <div className="p-4 border-b bg-card flex justify-between items-center">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold">Captured Claims</h2>
              {claims.length > 0 && (
                <span className="bg-primary text-primary-foreground text-xs font-bold px-2 py-1 rounded-full">
                  {claims.length}
                </span>
              )}
            </div>
            {claims.length > 0 && (
              <Button 
                onClick={() => setShowClearDialog(true)}
                variant="ghost"
                size="sm"
              >
                Clear All
              </Button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            {claims.length === 0 ? (
              <div className="h-full flex items-center justify-center">
                <div className="text-center text-muted-foreground">
                  <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-semibold">No claims captured yet.</p>
                  <p className="text-sm">Start your stream!</p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {claims.map((claim, index) => (
                  <Card 
                    key={claim.id}
                    className={`p-4 border-l-4 border-l-primary ${index === 0 ? 'animate-scale-in' : ''}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-primary">@{claim.username}</span>
                          <Check className="h-4 w-4 text-green-600" />
                        </div>
                        <p className="text-sm font-medium mb-1">{claim.item}</p>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span>{claim.timestamp}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xl font-bold text-green-600">
                          ${claim.price.toFixed(2)}
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Export Button */}
          {claims.length > 0 && (
            <div className="p-6 border-t bg-card">
              <Button 
                onClick={handleExport}
                className="w-full h-14 text-lg font-semibold bg-primary hover:bg-primary/90 animate-pulse"
                size="lg"
              >
                <Download className="mr-2 h-5 w-5" />
                Export to CSV ({claims.length} claims)
              </Button>
              <p className="text-xs text-center text-muted-foreground mt-2">
                Keyboard shortcut: Ctrl/Cmd + E
              </p>
            </div>
          )}
        </div>
      </div>

      {/* End Stream Dialog */}
      <AlertDialog open={showEndDialog} onOpenChange={setShowEndDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will clear all claims. Make sure you've exported first!
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleEndStream}>
              End Stream
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Clear All Dialog */}
      <AlertDialog open={showClearDialog} onOpenChange={setShowClearDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clear all claims?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove all {claims.length} captured claims. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleClearAll}>
              Clear All
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
