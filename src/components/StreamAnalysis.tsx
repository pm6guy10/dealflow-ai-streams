import { useState, useEffect } from "react";
import { IntentCard } from "./IntentCard";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  TrendingUp, 
  Users, 
  DollarSign, 
  ArrowLeft,
  Download,
  Loader2,
  AlertCircle,
  CheckCircle2
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
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

interface StreamAnalysisProps {
  analysisId: string;
  intents: BuyerIntent[];
  totalIntents: number;
  estimatedValue: number;
  streamUrl: string;
  onBack?: () => void;
}

export const StreamAnalysis = ({
  analysisId,
  intents: initialIntents,
  totalIntents,
  estimatedValue,
  streamUrl,
  onBack
}: StreamAnalysisProps) => {
  const [intents, setIntents] = useState<BuyerIntent[]>(initialIntents);
  const { toast } = useToast();

  const pendingCount = intents.filter(i => i.status === 'pending').length;
  const approvedCount = intents.filter(i => i.status === 'approved').length;
  const skippedCount = intents.filter(i => i.status === 'skipped').length;

  const handleApprove = async (username: string, editedMessage?: string) => {
    try {
      const { error } = await supabase.functions.invoke('update-message-status', {
        body: {
          analysisId,
          username,
          status: 'approved',
          editedMessage
        }
      });

      if (error) throw error;

      // Update local state
      setIntents(prev => prev.map(intent => 
        intent.username === username 
          ? { ...intent, status: 'approved' as const, drafted_message: editedMessage || intent.drafted_message }
          : intent
      ));
    } catch (error) {
      console.error('Error approving message:', error);
      throw error;
    }
  };

  const handleSkip = async (username: string) => {
    try {
      const { error } = await supabase.functions.invoke('update-message-status', {
        body: {
          analysisId,
          username,
          status: 'skipped'
        }
      });

      if (error) throw error;

      // Update local state
      setIntents(prev => prev.map(intent => 
        intent.username === username 
          ? { ...intent, status: 'skipped' as const }
          : intent
      ));
    } catch (error) {
      console.error('Error skipping message:', error);
      throw error;
    }
  };

  const handleExportCSV = () => {
    const csvContent = [
      ['Username', 'Timestamp', 'Comment', 'Item Wanted', 'Details', 'Message', 'Status'].join(','),
      ...intents.map(intent => [
        intent.username,
        intent.timestamp,
        `"${intent.comment.replace(/"/g, '""')}"`,
        `"${intent.item_wanted.replace(/"/g, '""')}"`,
        `"${intent.details.replace(/"/g, '""')}"`,
        `"${intent.drafted_message.replace(/"/g, '""')}"`,
        intent.status
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `whatnot-buyers-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    toast({
      title: "Exported!",
      description: `Downloaded CSV with ${intents.length} buyer intents`,
    });
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6">
      {/* Header */}
      <div className="mb-8">
        {onBack && (
          <Button
            variant="ghost"
            onClick={onBack}
            className="mb-4 text-gray-400 hover:text-white"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
        )}

        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2">
              🎯 Post-Stream Report
            </h1>
            <p className="text-gray-400 text-lg">
              AI-drafted messages for buyers you would have missed
            </p>
            {streamUrl && (
              <p className="text-gray-500 text-sm mt-2">
                Stream: {streamUrl}
              </p>
            )}
          </div>
          
          <Button
            onClick={handleExportCSV}
            variant="outline"
            className="border-gray-600 text-gray-300 hover:bg-gray-800"
          >
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card className="p-6 bg-gradient-to-br from-blue-900/50 to-blue-800/30 border-blue-500/30">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-500/20 rounded-lg">
              <Users className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <p className="text-gray-400 text-sm">Total Intents</p>
              <p className="text-3xl font-bold">{totalIntents}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-green-900/50 to-green-800/30 border-green-500/30">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-500/20 rounded-lg">
              <CheckCircle2 className="w-6 h-6 text-green-400" />
            </div>
            <div>
              <p className="text-gray-400 text-sm">Approved</p>
              <p className="text-3xl font-bold">{approvedCount}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-yellow-900/50 to-yellow-800/30 border-yellow-500/30">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-yellow-500/20 rounded-lg">
              <AlertCircle className="w-6 h-6 text-yellow-400" />
            </div>
            <div>
              <p className="text-gray-400 text-sm">Pending</p>
              <p className="text-3xl font-bold">{pendingCount}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-purple-900/50 to-purple-800/30 border-purple-500/30">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-purple-500/20 rounded-lg">
              <DollarSign className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <p className="text-gray-400 text-sm">Est. Value</p>
              <p className="text-3xl font-bold">${estimatedValue}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Progress Banner */}
      {pendingCount > 0 && (
        <Card className="p-4 mb-8 bg-gradient-to-r from-blue-900/50 to-purple-900/50 border-blue-500/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <TrendingUp className="w-5 h-5 text-blue-400" />
              <div>
                <p className="font-semibold">
                  {pendingCount} {pendingCount === 1 ? 'message' : 'messages'} waiting for review
                </p>
                <p className="text-sm text-gray-400">
                  Click APPROVE to copy to clipboard, then paste in Whatnot DMs
                </p>
              </div>
            </div>
            <Badge variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/30">
              {Math.round((approvedCount / totalIntents) * 100)}% Complete
            </Badge>
          </div>
        </Card>
      )}

      {/* All Done Banner */}
      {pendingCount === 0 && totalIntents > 0 && (
        <Card className="p-6 mb-8 bg-gradient-to-r from-green-900/50 to-emerald-900/50 border-green-500/30">
          <div className="flex items-center gap-4">
            <CheckCircle2 className="w-8 h-8 text-green-400" />
            <div>
              <p className="text-xl font-bold text-green-400">All Done! 🎉</p>
              <p className="text-gray-300">
                You've reviewed all {totalIntents} buyer intents. {approvedCount} messages approved and ready to send.
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Intent Cards */}
      <div className="space-y-4">
        {intents.length === 0 ? (
          <Card className="p-12 text-center bg-gray-900/50 border-gray-700">
            <AlertCircle className="w-12 h-12 mx-auto mb-4 text-gray-500" />
            <h3 className="text-xl font-semibold mb-2">No Buyer Intents Found</h3>
            <p className="text-gray-400">
              No buying intent was detected in this stream. Try analyzing a stream with more viewer engagement.
            </p>
          </Card>
        ) : (
          <>
            {/* Pending first */}
            {intents
              .filter(intent => intent.status === 'pending')
              .map((intent) => (
                <IntentCard
                  key={intent.username}
                  intent={intent}
                  onApprove={handleApprove}
                  onSkip={handleSkip}
                />
              ))}
            
            {/* Then approved/skipped */}
            {intents
              .filter(intent => intent.status !== 'pending')
              .map((intent) => (
                <IntentCard
                  key={intent.username}
                  intent={intent}
                  onApprove={handleApprove}
                  onSkip={handleSkip}
                />
              ))}
          </>
        )}
      </div>
    </div>
  );
};
