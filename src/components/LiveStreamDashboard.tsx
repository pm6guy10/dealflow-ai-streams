import React, { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Play, 
  Square, 
  TrendingUp, 
  MessageCircle, 
  DollarSign, 
  Users, 
  Clock,
  AlertTriangle,
  CheckCircle,
  Copy,
  Send
} from "lucide-react";

interface ChatMessage {
  id: string;
  platform_username: string;
  message_text: string;
  ai_intent_score: number;
  ai_intent_type: string;
  ai_extracted_item: string | null;
  ai_extracted_price: number | null;
  ai_urgency_level: string;
  ai_sentiment: string;
  follow_up_status: string;
  timestamp: string;
}

interface LiveStream {
  id: string;
  platform: string;
  stream_title: string;
  is_active: boolean;
  started_at: string;
  total_messages: number;
  high_intent_leads: number;
  revenue_generated: number;
}

const LiveStreamDashboard = () => {
  const { toast } = useToast();
  const [currentStream, setCurrentStream] = useState<LiveStream | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [platform, setPlatform] = useState('whatnot');
  const [streamTitle, setStreamTitle] = useState('');
  const [selectedMessage, setSelectedMessage] = useState<ChatMessage | null>(null);
  const [followUpOptions, setFollowUpOptions] = useState<any[]>([]);
  const [isGeneratingFollowUp, setIsGeneratingFollowUp] = useState(false);

  // Sample real-time chat simulation
  const simulateIncomingMessage = async () => {
    if (!currentStream) return;

    const sampleMessages = [
      { user: 'sneakerfan123', text: "I'll take the blue hoodie if it's under $50", intent: 'high' },
      { user: 'fashionlover', text: "What size is that jacket?", intent: 'medium' },
      { user: 'dealseeker', text: "Do you ship to California?", intent: 'medium' },
      { user: 'quickbuy', text: "SOLD! Take my money 💰", intent: 'high' },
      { user: 'browsing_now', text: "Nice stream! 👍", intent: 'low' },
      { user: 'price_checker', text: "How much for the sneakers?", intent: 'medium' },
      { user: 'ready_to_buy', text: "Hold that for me please!", intent: 'high' }
    ];

    const randomMessage = sampleMessages[Math.floor(Math.random() * sampleMessages.length)];
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const response = await supabase.functions.invoke('ai-chat-analysis', {
        body: {
          message: randomMessage.text,
          streamId: currentStream.id,
          platformUserId: `user_${Date.now()}`,
          platformUsername: randomMessage.user
        }
      });

      if (response.error) {
        console.error('Error analyzing message:', response.error);
      } else {
        // Refresh messages
        await fetchMessages();
      }
    } catch (error) {
      console.error('Error simulating message:', error);
    }
  };

  const startStream = async () => {
    if (!streamTitle.trim()) {
      toast({
        title: "Error",
        description: "Please enter a stream title",
        variant: "destructive"
      });
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Error",
          description: "Please log in to start streaming",
          variant: "destructive"
        });
        return;
      }

      const { data, error } = await supabase
        .from('live_streams')
        .insert({
          user_id: user.id,
          platform,
          stream_title: streamTitle,
          is_active: true
        })
        .select()
        .single();

      if (error) throw error;

      setCurrentStream(data);
      setIsStreaming(true);
      setMessages([]);

      // Start simulating messages every 3-8 seconds
      const interval = setInterval(() => {
        if (Math.random() > 0.3) { // 70% chance of message
          simulateIncomingMessage();
        }
      }, Math.random() * 5000 + 3000);

      // Store interval for cleanup
      (window as any).streamInterval = interval;

      toast({
        title: "Stream Started! 🔴",
        description: `AI is now analyzing chat for ${streamTitle}`,
      });

    } catch (error) {
      console.error('Error starting stream:', error);
      toast({
        title: "Error",
        description: "Failed to start stream",
        variant: "destructive"
      });
    }
  };

  const stopStream = async () => {
    if (!currentStream) return;

    try {
      const { error } = await supabase
        .from('live_streams')
        .update({ 
          is_active: false,
          ended_at: new Date().toISOString()
        })
        .eq('id', currentStream.id);

      if (error) throw error;

      setIsStreaming(false);
      setCurrentStream(null);
      
      // Clear simulation interval
      if ((window as any).streamInterval) {
        clearInterval((window as any).streamInterval);
        delete (window as any).streamInterval;
      }

      toast({
        title: "Stream Ended",
        description: "Chat analysis has been stopped",
      });

    } catch (error) {
      console.error('Error stopping stream:', error);
      toast({
        title: "Error",
        description: "Failed to stop stream",
        variant: "destructive"
      });
    }
  };

  const fetchMessages = async () => {
    if (!currentStream) return;

    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('stream_id', currentStream.id)
        .order('timestamp', { ascending: false })
        .limit(50);

      if (error) throw error;
      setMessages(data || []);

    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const generateFollowUp = async (message: ChatMessage) => {
    setSelectedMessage(message);
    setIsGeneratingFollowUp(true);

    try {
      const { data, error } = await supabase.functions.invoke('generate-follow-up', {
        body: {
          messageId: message.id,
          customInstructions: "Keep it conversational and sales-focused"
        }
      });

      if (error) throw error;

      setFollowUpOptions(data.follow_up_options || []);

    } catch (error) {
      console.error('Error generating follow-up:', error);
      toast({
        title: "Error",
        description: "Failed to generate follow-up messages",
        variant: "destructive"
      });
    } finally {
      setIsGeneratingFollowUp(false);
    }
  };

  const copyFollowUp = (template: string) => {
    navigator.clipboard.writeText(template);
    toast({
      title: "Copied!",
      description: "Follow-up message copied to clipboard",
    });
  };

  const getIntentColor = (intentType: string, score: number) => {
    if (score > 0.7) return 'bg-red-100 text-red-800 border-red-200';
    if (score > 0.4) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    return 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getUrgencyIcon = (urgency: string) => {
    switch (urgency) {
      case 'critical': return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case 'high': return <AlertTriangle className="w-4 h-4 text-orange-500" />;
      case 'medium': return <Clock className="w-4 h-4 text-yellow-500" />;
      default: return <CheckCircle className="w-4 h-4 text-green-500" />;
    }
  };

  useEffect(() => {
    if (currentStream) {
      fetchMessages();
      
      // Set up real-time subscription
      const channel = supabase
        .channel('chat_messages')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'chat_messages',
            filter: `stream_id=eq.${currentStream.id}`
          },
          () => {
            fetchMessages();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [currentStream]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 text-white p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              DealFlow AI Dashboard
            </h1>
            <p className="text-slate-300 mt-2">Real-time chat analysis and lead generation</p>
          </div>
          
          <div className="flex items-center gap-4">
            {isStreaming ? (
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                <span className="text-red-400 font-medium">LIVE</span>
              </div>
            ) : (
              <div className="text-slate-400">Offline</div>
            )}
          </div>
        </div>

        {!isStreaming ? (
          <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white">Start New Live Stream</CardTitle>
              <CardDescription>Connect your stream to start analyzing chat for sales opportunities</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="platform" className="text-white">Platform</Label>
                  <Select value={platform} onValueChange={setPlatform}>
                    <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="whatnot">Whatnot</SelectItem>
                      <SelectItem value="tiktok_shop">TikTok Shop</SelectItem>
                      <SelectItem value="instagram">Instagram Live</SelectItem>
                      <SelectItem value="facebook">Facebook Live</SelectItem>
                      <SelectItem value="youtube">YouTube Live</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="title" className="text-white">Stream Title</Label>
                  <Input
                    id="title"
                    value={streamTitle}
                    onChange={(e) => setStreamTitle(e.target.value)}
                    placeholder="Enter your stream title"
                    className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
                  />
                </div>
              </div>
              
              <Button 
                onClick={startStream} 
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                size="lg"
              >
                <Play className="w-5 h-5 mr-2" />
                Start AI-Powered Stream Analysis
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Tabs defaultValue="live-chat" className="space-y-6">
            <div className="flex items-center justify-between">
              <TabsList className="bg-slate-800 border-slate-700">
                <TabsTrigger value="live-chat" className="data-[state=active]:bg-blue-600">Live Chat</TabsTrigger>
                <TabsTrigger value="analytics" className="data-[state=active]:bg-blue-600">Analytics</TabsTrigger>
                <TabsTrigger value="follow-ups" className="data-[state=active]:bg-blue-600">Follow-ups</TabsTrigger>
              </TabsList>
              
              <Button 
                onClick={stopStream} 
                variant="destructive"
                className="bg-red-600 hover:bg-red-700"
              >
                <Square className="w-4 h-4 mr-2" />
                End Stream
              </Button>
            </div>

            {/* Stream Stats */}
            <div className="grid grid-cols-4 gap-4">
              <Card className="bg-slate-800/50 border-slate-700">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-slate-400 text-sm">Total Messages</p>
                      <p className="text-2xl font-bold text-white">{currentStream?.total_messages || 0}</p>
                    </div>
                    <MessageCircle className="w-8 h-8 text-blue-400" />
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-slate-800/50 border-slate-700">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-slate-400 text-sm">High Intent Leads</p>
                      <p className="text-2xl font-bold text-white">{currentStream?.high_intent_leads || 0}</p>
                    </div>
                    <TrendingUp className="w-8 h-8 text-green-400" />
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-slate-800/50 border-slate-700">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-slate-400 text-sm">Revenue Generated</p>
                      <p className="text-2xl font-bold text-white">${currentStream?.revenue_generated || 0}</p>
                    </div>
                    <DollarSign className="w-8 h-8 text-yellow-400" />
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-slate-800/50 border-slate-700">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-slate-400 text-sm">Conversion Rate</p>
                      <p className="text-2xl font-bold text-white">
                        {currentStream?.total_messages 
                          ? Math.round((currentStream.high_intent_leads / currentStream.total_messages) * 100)
                          : 0}%
                      </p>
                    </div>
                    <Users className="w-8 h-8 text-purple-400" />
                  </div>
                </CardContent>
              </Card>
            </div>

            <TabsContent value="live-chat" className="space-y-4">
              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white">Live Chat Analysis</CardTitle>
                  <CardDescription>AI-powered real-time intent detection and lead scoring</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {messages.map((message) => (
                      <div key={message.id} className="bg-slate-700/50 rounded-lg p-4 border border-slate-600">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <span className="font-semibold text-blue-400">@{message.platform_username}</span>
                              <Badge className={`${getIntentColor(message.ai_intent_type, message.ai_intent_score)} text-xs`}>
                                {message.ai_intent_type} ({Math.round(message.ai_intent_score * 100)}%)
                              </Badge>
                              {getUrgencyIcon(message.ai_urgency_level)}
                              <span className="text-xs text-slate-400">
                                {new Date(message.timestamp).toLocaleTimeString()}
                              </span>
                            </div>
                            <p className="text-white mb-2">{message.message_text}</p>
                            {(message.ai_extracted_item || message.ai_extracted_price) && (
                              <div className="flex gap-2 text-sm">
                                {message.ai_extracted_item && (
                                  <Badge variant="outline" className="text-green-400 border-green-400">
                                    Item: {message.ai_extracted_item}
                                  </Badge>
                                )}
                                {message.ai_extracted_price && (
                                  <Badge variant="outline" className="text-yellow-400 border-yellow-400">
                                    ${message.ai_extracted_price}
                                  </Badge>
                                )}
                              </div>
                            )}
                          </div>
                          
                          {message.ai_intent_score > 0.5 && (
                            <Button
                              size="sm"
                              onClick={() => generateFollowUp(message)}
                              className="bg-blue-600 hover:bg-blue-700 ml-4"
                            >
                              <Send className="w-4 h-4 mr-1" />
                              Follow Up
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                    
                    {messages.length === 0 && (
                      <div className="text-center py-8 text-slate-400">
                        <MessageCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>Waiting for chat messages...</p>
                        <p className="text-sm">AI will analyze each message for purchase intent</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="follow-ups" className="space-y-4">
              {selectedMessage && followUpOptions.length > 0 && (
                <Card className="bg-slate-800/50 border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-white">AI-Generated Follow-ups</CardTitle>
                    <CardDescription>
                      For @{selectedMessage.platform_username}: "{selectedMessage.message_text}"
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {followUpOptions.map((option, index) => (
                      <div key={index} className="bg-slate-700/50 rounded-lg p-4 border border-slate-600">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge className="bg-blue-600 text-white">{option.tone}</Badge>
                            </div>
                            <p className="text-white">{option.template}</p>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => copyFollowUp(option.template)}
                            className="ml-4 border-slate-600 text-white hover:bg-slate-600"
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}
              
              {!selectedMessage && (
                <Card className="bg-slate-800/50 border-slate-700">
                  <CardContent className="py-12 text-center">
                    <Send className="w-12 h-12 mx-auto mb-4 text-slate-400 opacity-50" />
                    <p className="text-slate-400">Select a high-intent message to generate follow-ups</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="analytics">
              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white">Stream Analytics</CardTitle>
                  <CardDescription>Real-time performance metrics and insights</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-12 text-slate-400">
                    <TrendingUp className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Analytics dashboard coming soon...</p>
                    <p className="text-sm">Track conversion rates, revenue attribution, and peak activity times</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
};

export default LiveStreamDashboard;