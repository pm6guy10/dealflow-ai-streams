-- Create function to atomically increment stream statistics
CREATE OR REPLACE FUNCTION public.increment_stream_stats(
  stream_id UUID,
  is_high_intent BOOLEAN DEFAULT false
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.live_streams
  SET 
    total_messages = total_messages + 1,
    high_intent_leads = CASE 
      WHEN is_high_intent THEN high_intent_leads + 1 
      ELSE high_intent_leads 
    END,
    updated_at = now()
  WHERE id = stream_id;
END;
$$;