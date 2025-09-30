-- Create tables for DealFlow's real-time chat analysis
CREATE TABLE public.live_streams (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  platform TEXT NOT NULL CHECK (platform IN ('whatnot', 'tiktok_shop', 'instagram', 'facebook', 'youtube')),
  stream_title TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ended_at TIMESTAMP WITH TIME ZONE,
  total_messages INTEGER NOT NULL DEFAULT 0,
  high_intent_leads INTEGER NOT NULL DEFAULT 0,
  revenue_generated DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for real-time chat messages
CREATE TABLE public.chat_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  stream_id UUID NOT NULL REFERENCES public.live_streams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  platform_user_id TEXT NOT NULL,
  platform_username TEXT,
  message_text TEXT NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ai_intent_score DECIMAL(3,2) DEFAULT 0 CHECK (ai_intent_score >= 0 AND ai_intent_score <= 1),
  ai_intent_type TEXT CHECK (ai_intent_type IN ('buy_intent', 'question', 'price_inquiry', 'shipping_question', 'availability_check', 'chatter', 'unknown')),
  ai_extracted_item TEXT,
  ai_extracted_price DECIMAL(10,2),
  ai_urgency_level TEXT CHECK (ai_urgency_level IN ('low', 'medium', 'high', 'critical')),
  ai_sentiment TEXT CHECK (ai_sentiment IN ('positive', 'neutral', 'negative')),
  follow_up_status TEXT NOT NULL DEFAULT 'pending' CHECK (follow_up_status IN ('pending', 'contacted', 'converted', 'ignored')),
  follow_up_sent_at TIMESTAMP WITH TIME ZONE,
  revenue_attributed DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for AI-generated follow-up messages
CREATE TABLE public.follow_up_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  template_name TEXT NOT NULL,
  template_content TEXT NOT NULL,
  placeholders TEXT[] DEFAULT ARRAY['{{username}}', '{{item}}', '{{price}}', '{{link}}'],
  intent_type TEXT NOT NULL,
  usage_count INTEGER NOT NULL DEFAULT 0,
  success_rate DECIMAL(3,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for live stream analytics
CREATE TABLE public.stream_analytics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  stream_id UUID NOT NULL REFERENCES public.live_streams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  hour_bucket TIMESTAMP WITH TIME ZONE NOT NULL,
  messages_count INTEGER NOT NULL DEFAULT 0,
  buy_intent_count INTEGER NOT NULL DEFAULT 0,
  question_count INTEGER NOT NULL DEFAULT 0,
  unique_viewers INTEGER NOT NULL DEFAULT 0,
  avg_intent_score DECIMAL(3,2) DEFAULT 0,
  peak_activity_time TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(stream_id, hour_bucket)
);

-- Enable Row Level Security
ALTER TABLE public.live_streams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follow_up_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stream_analytics ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for live_streams
CREATE POLICY "Users can view their own streams" 
ON public.live_streams 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own streams" 
ON public.live_streams 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own streams" 
ON public.live_streams 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create RLS policies for chat_messages
CREATE POLICY "Users can view messages from their streams" 
ON public.chat_messages 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create messages for their streams" 
ON public.chat_messages 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update messages from their streams" 
ON public.chat_messages 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create RLS policies for follow_up_templates
CREATE POLICY "Users can view their own templates" 
ON public.follow_up_templates 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own templates" 
ON public.follow_up_templates 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own templates" 
ON public.follow_up_templates 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create RLS policies for stream_analytics
CREATE POLICY "Users can view their own analytics" 
ON public.stream_analytics 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own analytics" 
ON public.stream_analytics 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX idx_chat_messages_stream_id ON public.chat_messages(stream_id);
CREATE INDEX idx_chat_messages_user_id ON public.chat_messages(user_id);
CREATE INDEX idx_chat_messages_timestamp ON public.chat_messages(timestamp);
CREATE INDEX idx_chat_messages_intent_score ON public.chat_messages(ai_intent_score DESC);
CREATE INDEX idx_chat_messages_intent_type ON public.chat_messages(ai_intent_type);
CREATE INDEX idx_chat_messages_follow_up_status ON public.chat_messages(follow_up_status);
CREATE INDEX idx_live_streams_user_id ON public.live_streams(user_id);
CREATE INDEX idx_live_streams_is_active ON public.live_streams(is_active);
CREATE INDEX idx_stream_analytics_stream_id ON public.stream_analytics(stream_id);

-- Create function to update updated_at timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_live_streams_updated_at
BEFORE UPDATE ON public.live_streams
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_chat_messages_updated_at
BEFORE UPDATE ON public.chat_messages
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_follow_up_templates_updated_at
BEFORE UPDATE ON public.follow_up_templates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for critical tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.live_streams;
ALTER PUBLICATION supabase_realtime ADD TABLE public.stream_analytics;