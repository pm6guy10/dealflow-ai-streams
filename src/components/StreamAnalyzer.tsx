import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Loader2, Sparkles, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

interface Comment {
  username: string;
  message: string;
  timestamp?: string;
}

interface StreamAnalyzerProps {
  onAnalysisComplete?: (analysisId: string) => void;
}

export const StreamAnalyzer = ({ onAnalysisComplete }: StreamAnalyzerProps) => {
  const [streamUrl, setStreamUrl] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [progress, setProgress] = useState("");
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleAnalyze = async () => {
    if (!streamUrl || !streamUrl.includes('whatnot.com')) {
      toast({
        title: "Invalid URL",
        description: "Please enter a valid Whatnot stream URL",
        variant: "destructive",
      });
      return;
    }

    setIsAnalyzing(true);
    setProgress("Scraping stream comments...");

    try {
      // Step 1: Scrape the stream comments
      const scrapeResponse = await fetch('http://localhost:3001/api/scrape-stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: streamUrl })
      });

      if (!scrapeResponse.ok) {
        throw new Error('Failed to scrape stream');
      }

      const scrapeData = await scrapeResponse.json();
      const comments: Comment[] = scrapeData.messages || [];

      if (comments.length === 0) {
        toast({
          title: "No Comments Found",
          description: "This stream has no comments to analyze. Try a different stream URL.",
          variant: "destructive",
        });
        setIsAnalyzing(false);
        return;
      }

      setProgress(`Found ${comments.length} comments. Analyzing with AI...`);

      // Step 2: Analyze with AI
      const { data, error } = await supabase.functions.invoke('analyze-stream-intents', {
        body: {
          comments,
          streamUrl,
          sellerName: 'You',
          streamCategory: 'live shopping'
        }
      });

      if (error) throw error;

      setProgress("Analysis complete!");

      toast({
        title: "🎉 Analysis Complete!",
        description: `Found ${data.totalIntents} buyer intents worth ~$${data.estimatedValue}`,
      });

      // Navigate to the report
      if (data.analysisId) {
        if (onAnalysisComplete) {
          onAnalysisComplete(data.analysisId);
        } else {
          navigate(`/stream-report/${data.analysisId}`);
        }
      }

    } catch (error: any) {
      console.error('Analysis error:', error);
      toast({
        title: "Analysis Failed",
        description: error.message || "Failed to analyze stream. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
      setProgress("");
    }
  };

  return (
    <Card className="p-6 bg-gradient-to-br from-purple-900/50 to-blue-900/50 border-purple-500/30">
      <div className="flex items-center gap-3 mb-4">
        <Sparkles className="w-6 h-6 text-purple-400" />
        <div>
          <h3 className="text-xl font-bold text-white">Post-Stream Report</h3>
          <p className="text-gray-400 text-sm">
            Analyze past streams for missed buyer intents
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <Input
            type="text"
            placeholder="Paste Whatnot stream URL here..."
            value={streamUrl}
            onChange={(e) => setStreamUrl(e.target.value)}
            disabled={isAnalyzing}
            className="bg-gray-950 border-gray-600 text-white placeholder-gray-500"
          />
          <p className="text-xs text-gray-500 mt-2">
            Example: https://www.whatnot.com/live/username-stream-title
          </p>
        </div>

        {isAnalyzing && progress && (
          <div className="flex items-center gap-2 text-sm text-blue-400">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>{progress}</span>
          </div>
        )}

        <Button
          onClick={handleAnalyze}
          disabled={isAnalyzing || !streamUrl}
          className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-6"
          size="lg"
        >
          {isAnalyzing ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5 mr-2" />
              Analyze Stream with AI
            </>
          )}
        </Button>

        <div className="bg-gray-950/50 rounded-lg p-4 border border-gray-700">
          <h4 className="font-semibold text-white mb-2 text-sm">What you'll get:</h4>
          <ul className="text-sm text-gray-400 space-y-1">
            <li>✅ All viewers who showed buying intent</li>
            <li>✅ AI-drafted personalized messages for each</li>
            <li>✅ One-click approve & copy to clipboard</li>
            <li>✅ Estimated value of missed sales</li>
          </ul>
        </div>
      </div>
    </Card>
  );
};
