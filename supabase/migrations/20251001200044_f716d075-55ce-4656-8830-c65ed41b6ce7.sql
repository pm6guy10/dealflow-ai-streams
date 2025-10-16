-- Create chat_messages table for storing all live chat messages
CREATE TABLE IF NOT EXISTS public.chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stream_session_id UUID NOT NULL REFERENCES public.stream_sessions(id) ON DELETE CASCADE,
  username TEXT NOT NULL,
  message TEXT NOT NULL,
  platform TEXT NOT NULL DEFAULT 'whatnot',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Create policy for users to see messages from their own streams
CREATE POLICY "Users can view their own stream chat messages"
  ON public.chat_messages
  FOR SELECT
  USING (
    stream_session_id IN (
      SELECT id FROM public.stream_sessions WHERE user_id = auth.uid()
    )
  );

-- Create policy for the service to insert messages
CREATE POLICY "Service can insert chat messages"
  ON public.chat_messages
  FOR INSERT
  WITH CHECK (true);

-- Create index for faster queries
CREATE INDEX idx_chat_messages_stream_session ON public.chat_messages(stream_session_id, created_at DESC);

-- Enable realtime for chat messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;