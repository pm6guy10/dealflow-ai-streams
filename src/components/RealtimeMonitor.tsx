import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Play, Square, Loader2, Zap } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Message {
  username: string;
  message: string;
  timestamp: string;
  isBuyer: boolean;
  confidence: number;
}

interface Buyer {
  username: string;
  message: string;
  confidence: number;
  timestamp: string;
  buyerNumber: number;
}

export const RealtimeMonitor = () => {
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [streamUrl, setStreamUrl] = useState('');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [buyers, setBuyers] = useState<Buyer[]>([]);
  const [stats, setStats] = useState({ totalMessages: 0, totalBuyers: 0 });
  const wsRef = useRef<WebSocket | null>(null);
  const { toast } = useToast();

  const SCRAPER_URL = import.meta.env.VITE_REALTIME_SCRAPER_URL || 'http://localhost:3001';
  const SCRAPER_WS = import.meta.env.VITE_REALTIME_SCRAPER_WS || 'ws://localhost:3001';

  useEffect(() => {
    // Cleanup on unmount
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  const startMonitoring = async () => {
    if (!streamUrl || !streamUrl.includes('whatnot.com')) {
      toast({
        title: 'Invalid URL',
        description: 'Please enter a valid Whatnot stream URL',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsMonitoring(true);

      // 1. Create stream session in database
      const { data: session, error: sessionError } = await supabase
        .from('stream_sessions')
        .insert({
          platform: 'whatnot',
        })
        .select()
        .single();

      if (sessionError) throw sessionError;
      setSessionId(session.id);

      // 2. Start the realtime scraper
      const response = await fetch(`${SCRAPER_URL}/api/start-monitoring`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: streamUrl,
          sessionId: session.id,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to start monitoring');
      }

      // 3. Connect to WebSocket for live updates
      const ws = new WebSocket(SCRAPER_WS);

      ws.onopen = () => {
        console.log('📡 WebSocket connected');
        toast({
          title: '🎉 Monitoring Started',
          description: 'Now watching for buyer messages...',
        });
      };

      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);

        // Only process messages for our session
        if (data.sessionId !== session.id) return;

        if (data.type === 'buyer_detected') {
          console.log('🔥 Buyer detected:', data.buyer);
          setBuyers((prev) => [data.buyer, ...prev].slice(0, 50)); // Keep last 50
          setStats(data.stats);

          toast({
            title: '🔥 Buyer Detected!',
            description: `${data.buyer.username}: "${data.buyer.message}"`,
          });
        }

        if (data.type === 'new_message') {
          setMessages((prev) => [data.message, ...prev].slice(0, 100)); // Keep last 100
        }

        if (data.type === 'stream_selected') {
          console.log('Stream:', data.stream);
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        toast({
          title: 'Connection Error',
          description: 'Lost connection to monitoring service',
          variant: 'destructive',
        });
      };

      ws.onclose = () => {
        console.log('WebSocket disconnected');
      };

      wsRef.current = ws;

      // 4. Subscribe to database updates (backup channel)
      const messagesChannel = supabase
        .channel(`chat_messages_${session.id}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'chat_messages',
            filter: `stream_session_id=eq.${session.id}`,
          },
          (payload) => {
            console.log('New message from DB:', payload.new);
          }
        )
        .subscribe();

      const buyersChannel = supabase
        .channel(`sales_captured_${session.id}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'sales_captured',
            filter: `stream_session_id=eq.${session.id}`,
          },
          (payload) => {
            console.log('🎉 New buyer captured in DB:', payload.new);
          }
        )
        .subscribe();
    } catch (error: any) {
      console.error('Failed to start monitoring:', error);
      toast({
        title: 'Failed to Start',
        description: error.message || 'Could not start monitoring',
        variant: 'destructive',
      });
      setIsMonitoring(false);
    }
  };

  const stopMonitoring = async () => {
    try {
      if (sessionId) {
        // Stop the scraper
        await fetch(`${SCRAPER_URL}/api/stop-monitoring`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId }),
        });

        // Update session end time
        await supabase
          .from('stream_sessions')
          .update({ ended_at: new Date().toISOString() })
          .eq('id', sessionId);
      }

      // Close WebSocket
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }

      setIsMonitoring(false);
      setSessionId(null);

      toast({
        title: 'Monitoring Stopped',
        description: `Captured ${buyers.length} buyers`,
      });
    } catch (error: any) {
      console.error('Failed to stop monitoring:', error);
      toast({
        title: 'Error',
        description: 'Failed to stop monitoring',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
          <Zap className="w-6 h-6 text-yellow-500" />
          Real-Time Stream Monitoring
        </h2>

        <div className="space-y-4">
          <div>
            <Input
              type="text"
              placeholder="https://www.whatnot.com/live/stream-url"
              value={streamUrl}
              onChange={(e) => setStreamUrl(e.target.value)}
              disabled={isMonitoring}
              className="w-full"
            />
          </div>

          <div className="flex gap-2">
            {!isMonitoring ? (
              <Button onClick={startMonitoring} className="flex-1" size="lg">
                <Play className="w-5 h-5 mr-2" />
                Start Monitoring
              </Button>
            ) : (
              <Button
                onClick={stopMonitoring}
                variant="destructive"
                className="flex-1"
                size="lg"
              >
                <Square className="w-5 h-5 mr-2" />
                Stop Monitoring
              </Button>
            )}
          </div>

          {isMonitoring && (
            <div className="flex items-center gap-2 text-sm text-green-600">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Monitoring active...</span>
            </div>
          )}
        </div>
      </Card>

      {/* Stats */}
      {isMonitoring && (
        <div className="grid grid-cols-3 gap-4">
          <Card className="p-4">
            <div className="text-sm text-gray-500">Total Messages</div>
            <div className="text-2xl font-bold">{messages.length}</div>
          </Card>
          <Card className="p-4">
            <div className="text-sm text-gray-500">Buyers Detected</div>
            <div className="text-2xl font-bold text-green-600">{buyers.length}</div>
          </Card>
          <Card className="p-4">
            <div className="text-sm text-gray-500">Estimated Value</div>
            <div className="text-2xl font-bold">${stats.totalBuyers * 50}</div>
          </Card>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        {/* Buyers */}
        <Card className="p-4">
          <h3 className="font-bold mb-3 flex items-center gap-2">
            🔥 Buyers ({buyers.length})
          </h3>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {buyers.length === 0 ? (
              <p className="text-gray-500 text-sm">No buyers detected yet...</p>
            ) : (
              buyers.map((buyer, i) => (
                <div key={i} className="p-3 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold">#{buyer.buyerNumber} {buyer.username}</span>
                    <Badge variant="default">{Math.round(buyer.confidence * 100)}%</Badge>
                  </div>
                  <p className="text-sm text-gray-700">{buyer.message}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(buyer.timestamp).toLocaleTimeString()}
                  </p>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* All Messages */}
        <Card className="p-4">
          <h3 className="font-bold mb-3">💬 Live Chat ({messages.length})</h3>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {messages.length === 0 ? (
              <p className="text-gray-500 text-sm">Waiting for messages...</p>
            ) : (
              messages.map((msg, i) => (
                <div
                  key={i}
                  className={`p-2 rounded-lg ${
                    msg.isBuyer ? 'bg-green-50 border border-green-200' : 'bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-sm">{msg.username}</span>
                    {msg.isBuyer && (
                      <Badge variant="secondary" className="text-xs">
                        {Math.round(msg.confidence * 100)}%
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm">{msg.message}</p>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};
