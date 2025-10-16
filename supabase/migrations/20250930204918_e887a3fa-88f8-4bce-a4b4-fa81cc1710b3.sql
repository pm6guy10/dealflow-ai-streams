-- Fix security warnings by adding search_path to functions
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Create profile
  INSERT INTO public.profiles (id, email, subscription_status)
  VALUES (NEW.id, NEW.email, 'none');
  
  -- Create default settings
  INSERT INTO public.user_settings (user_id)
  VALUES (NEW.id);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;