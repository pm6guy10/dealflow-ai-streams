import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Sparkles, CheckCircle2, XCircle } from "lucide-react";

interface MessageTesterProps {
  streamSessionId?: string;
  platform: string;
}

export const MessageTester = ({ streamSessionId, platform }: MessageTesterProps) => {
  const { toast } = useToast();
  const [message, setMessage] = useState("");
  const [username, setUsername] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [lastResult, setLastResult] = useState<any>(null);

  const analyzeMessage = async () => {
    if (!message.trim() || !username.trim()) {
      toast({
        title: "Missing information",
        description: "Please enter both username and message",
        variant: "destructive",
      });
      return;
    }

    setIsAnalyzing(true);
    setLastResult(null);

    try {
      const { data, error } = await supabase.functions.invoke('analyze-message', {
        body: {
          message: message.trim(),
          username: username.trim(),
          platform: platform.toLowerCase(),
          stream_session_id: streamSessionId,
        },
      });

      if (error) throw error;

      setLastResult(data);

      if (data.auto_captured) {
        toast({
          title: "🎉 Sale Detected & Captured!",
          description: `${username} wants to buy! (${Math.round(data.confidence * 100)}% confidence)`,
        });
      } else if (data.is_purchase) {
        toast({
          title: "⚠️ Possible Sale Detected",
          description: `Low confidence (${Math.round(data.confidence * 100)}%). Not auto-captured.`,
        });
      } else {
        toast({
          title: "Not a Purchase",
          description: "This message doesn't indicate purchase intent",
        });
      }

      // Clear inputs after successful analysis
      setMessage("");
    } catch (error) {
      console.error('Error analyzing message:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to analyze message",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const testWithExample = (exampleMessage: string, exampleUsername: string) => {
    setMessage(exampleMessage);
    setUsername(exampleUsername);
  };

  return (
    <Card className="border-purple-500/20 bg-gradient-to-br from-purple-500/5 to-blue-500/5">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-purple-400" />
          <CardTitle>AI Message Analyzer (Test the Brain)</CardTitle>
        </div>
        <CardDescription>
          Test the AI detection engine with real chat messages
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Username</label>
          <Input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="buyer_username"
            disabled={isAnalyzing}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Chat Message</label>
          <Input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="I'll take it!"
            disabled={isAnalyzing}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !isAnalyzing) {
                analyzeMessage();
              }
            }}
          />
        </div>

        <div className="flex gap-2 flex-wrap">
          <Button
            onClick={analyzeMessage}
            disabled={isAnalyzing || !message.trim() || !username.trim()}
            className="flex-1"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Analyze Message
              </>
            )}
          </Button>
        </div>

        {/* Quick Test Examples */}
        <div className="space-y-2 pt-2 border-t border-gray-700">
          <p className="text-xs text-muted-foreground">Quick test examples:</p>
          <div className="flex gap-2 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              onClick={() => testWithExample("I'll take it!", "john_doe")}
              className="text-xs"
            >
              "I'll take it!"
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => testWithExample("Sold to me please!", "jane_smith")}
              className="text-xs"
            >
              "Sold to me!"
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => testWithExample("How much is it?", "curious_buyer")}
              className="text-xs"
            >
              "How much?" (not a sale)
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => testWithExample("I need that vintage watch for $150!", "collector99")}
              className="text-xs"
            >
              With price mention
            </Button>
          </div>
        </div>

        {/* Analysis Result */}
        {lastResult && (
          <div className={`p-4 rounded-lg border ${
            lastResult.auto_captured 
              ? 'bg-green-500/10 border-green-500/30' 
              : lastResult.is_purchase
              ? 'bg-yellow-500/10 border-yellow-500/30'
              : 'bg-gray-500/10 border-gray-500/30'
          }`}>
            <div className="flex items-start gap-3">
              {lastResult.auto_captured ? (
                <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
              ) : lastResult.is_purchase ? (
                <XCircle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
              ) : (
                <XCircle className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
              )}
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant={lastResult.is_purchase ? "default" : "secondary"}>
                    {lastResult.is_purchase ? "Purchase Detected" : "Not a Purchase"}
                  </Badge>
                  <span className="text-sm">
                    Confidence: {Math.round(lastResult.confidence * 100)}%
                  </span>
                  {lastResult.auto_captured && (
                    <Badge className="bg-green-500">
                      Auto-Captured ✓
                    </Badge>
                  )}
                </div>
                {lastResult.item_description && (
                  <div className="text-sm">
                    <span className="text-muted-foreground">Item:</span> {lastResult.item_description}
                  </div>
                )}
                {lastResult.estimated_value > 0 && (
                  <div className="text-sm">
                    <span className="text-muted-foreground">Value:</span> ${lastResult.estimated_value}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
