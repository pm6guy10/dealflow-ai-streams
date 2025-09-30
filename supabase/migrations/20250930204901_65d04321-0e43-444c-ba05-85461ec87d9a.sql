-- Create function to increment stream session stats
CREATE OR REPLACE FUNCTION public.increment_stream_stats(
  p_stream_id UUID,
  p_value DECIMAL DEFAULT 0
)
RETURNS VOID AS $$
BEGIN
  UPDATE public.stream_sessions
  SET 
    total_sales_caught = total_sales_caught + 1,
    total_revenue_recovered = total_revenue_recovered + p_value
  WHERE id = p_stream_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;