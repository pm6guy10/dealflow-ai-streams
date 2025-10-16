import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { StreamAnalysis } from "@/components/StreamAnalysis";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface BuyerIntent {
  username: string;
  timestamp: string;
  comment: string;
  item_wanted: string;
  details: string;
  drafted_message: string;
  status: 'pending' | 'approved' | 'skipped';
  confidence: number;
}

interface AnalysisData {
  id: string;
  stream_url: string;
  total_comments: number;
  total_intents: number;
  intents_data: BuyerIntent[];
  analyzed_at: string;
}

export const StreamReport = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [analysis, setAnalysis] = useState<AnalysisData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAnalysis = async () => {
      if (!id) {
        setError('No analysis ID provided');
        setLoading(false);
        return;
      }

      try {
        const { data, error: fetchError } = await supabase
          .from('stream_analyses')
          .select('*')
          .eq('id', id)
          .single();

        if (fetchError) throw fetchError;

        if (!data) {
          setError('Analysis not found');
          return;
        }

        setAnalysis(data as AnalysisData);
      } catch (err: any) {
        console.error('Error fetching analysis:', err);
        setError(err.message || 'Failed to load analysis');
      } finally {
        setLoading(false);
      }
    };

    fetchAnalysis();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-gray-400">Loading stream analysis...</p>
        </div>
      </div>
    );
  }

  if (error || !analysis) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center p-6">
        <Card className="p-12 max-w-md text-center bg-gray-900 border-gray-700">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Error Loading Report</h2>
          <p className="text-gray-400 mb-6">
            {error || 'Analysis not found'}
          </p>
          <Button
            onClick={() => navigate('/dashboard')}
            variant="outline"
            className="border-gray-600 text-gray-300"
          >
            Back to Dashboard
          </Button>
        </Card>
      </div>
    );
  }

  const estimatedValue = analysis.total_intents * 50;

  return (
    <StreamAnalysis
      analysisId={analysis.id}
      intents={analysis.intents_data}
      totalIntents={analysis.total_intents}
      estimatedValue={estimatedValue}
      streamUrl={analysis.stream_url}
      onBack={() => navigate('/dashboard')}
    />
  );
};
