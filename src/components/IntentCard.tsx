import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Check, X, Edit2, Copy, User, Clock, MessageSquare } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

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

interface IntentCardProps {
  intent: BuyerIntent;
  onApprove: (username: string, editedMessage?: string) => Promise<void>;
  onSkip: (username: string) => Promise<void>;
}

export const IntentCard = ({ intent, onApprove, onSkip }: IntentCardProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedMessage, setEditedMessage] = useState(intent.drafted_message);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleApprove = async () => {
    setIsLoading(true);
    try {
      // Copy to clipboard
      const messageToCopy = isEditing ? editedMessage : intent.drafted_message;
      await navigator.clipboard.writeText(messageToCopy);
      
      await onApprove(intent.username, isEditing ? editedMessage : undefined);
      
      toast({
        title: "✅ Message Copied!",
        description: "The message has been copied to your clipboard. Paste it in Whatnot DMs.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to approve message",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkip = async () => {
    setIsLoading(true);
    try {
      await onSkip(intent.username);
      toast({
        title: "Message Skipped",
        description: `Skipped message for @${intent.username}`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to skip message",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatTimestamp = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      return date.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      });
    } catch {
      return 'Unknown time';
    }
  };

  if (intent.status === 'approved') {
    return (
      <Card className="p-6 bg-green-950/30 border-green-500/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Check className="w-5 h-5 text-green-400" />
            <span className="text-green-400 font-semibold">@{intent.username}</span>
          </div>
          <span className="text-green-400 text-sm">✓ Approved & Copied</span>
        </div>
      </Card>
    );
  }

  if (intent.status === 'skipped') {
    return (
      <Card className="p-6 bg-gray-900/30 border-gray-700/30 opacity-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <X className="w-5 h-5 text-gray-400" />
            <span className="text-gray-400 font-semibold">@{intent.username}</span>
          </div>
          <span className="text-gray-400 text-sm">Skipped</span>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6 bg-gradient-to-br from-gray-900 to-gray-800 border-gray-700 hover:border-blue-500/50 transition-all">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <User className="w-5 h-5 text-blue-400" />
          <span className="text-xl font-bold text-blue-400">@{intent.username}</span>
        </div>
        <div className="flex items-center gap-2 text-gray-400 text-sm">
          <Clock className="w-4 h-4" />
          <span>{formatTimestamp(intent.timestamp)}</span>
        </div>
      </div>

      {/* Original Comment */}
      <div className="mb-4 p-4 bg-gray-950/50 rounded-lg border border-gray-700">
        <div className="flex items-start gap-2">
          <MessageSquare className="w-4 h-4 text-gray-400 mt-1 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-gray-300 italic">"{intent.comment}"</p>
            {intent.item_wanted && (
              <div className="mt-2 text-sm">
                <span className="text-gray-500">Wants: </span>
                <span className="text-white font-semibold">{intent.item_wanted}</span>
                {intent.details && (
                  <span className="text-gray-400"> • {intent.details}</span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Drafted Message */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide">
            📝 Drafted Message
          </h3>
          {!isEditing && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsEditing(true)}
              className="text-gray-400 hover:text-white"
            >
              <Edit2 className="w-4 h-4 mr-1" />
              Edit
            </Button>
          )}
        </div>
        
        {isEditing ? (
          <div className="space-y-2">
            <Textarea
              value={editedMessage}
              onChange={(e) => setEditedMessage(e.target.value)}
              className="bg-gray-950 border-gray-600 text-white min-h-[100px]"
              placeholder="Edit your message..."
            />
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setEditedMessage(intent.drafted_message);
                  setIsEditing(false);
                }}
                className="text-gray-400"
              >
                Cancel
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(false)}
                className="text-green-400 border-green-500/30 hover:bg-green-500/10"
              >
                Save Changes
              </Button>
            </div>
          </div>
        ) : (
          <div className="p-4 bg-blue-950/30 rounded-lg border border-blue-500/30">
            <p className="text-white leading-relaxed">
              {editedMessage}
            </p>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <Button
          onClick={handleApprove}
          disabled={isLoading}
          className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-6 text-lg"
          size="lg"
        >
          <Check className="w-5 h-5 mr-2" />
          {isLoading ? 'Copying...' : 'APPROVE & SEND'}
        </Button>
        
        <Button
          onClick={handleSkip}
          disabled={isLoading}
          variant="outline"
          className="border-gray-600 text-gray-400 hover:bg-gray-800 hover:text-white py-6 px-6"
          size="lg"
        >
          <X className="w-5 h-5" />
        </Button>
      </div>

      {/* Confidence Badge */}
      {intent.confidence > 0 && (
        <div className="mt-3 text-center">
          <span className="text-xs text-gray-500">
            Confidence: {Math.round(intent.confidence * 100)}%
          </span>
        </div>
      )}
    </Card>
  );
};
