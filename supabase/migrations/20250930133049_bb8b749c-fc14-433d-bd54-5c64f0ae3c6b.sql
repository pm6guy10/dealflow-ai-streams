-- Add new columns for sophisticated intent analysis
ALTER TABLE public.chat_messages
ADD COLUMN IF NOT EXISTS confidence_level text,
ADD COLUMN IF NOT EXISTS signals jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS action_recommended text,
ADD COLUMN IF NOT EXISTS user_pattern text;

-- Update existing score column to be more flexible if needed
COMMENT ON COLUMN public.chat_messages.ai_intent_score IS 'Score from 0-100 indicating buy intent';
COMMENT ON COLUMN public.chat_messages.confidence_level IS 'high, medium, low, minimal, or none';
COMMENT ON COLUMN public.chat_messages.signals IS 'Array of detected signals like direct_buy, subtle_commitment, etc';
COMMENT ON COLUMN public.chat_messages.action_recommended IS 'Suggested action like Contact immediately or Follow up within 2 hours';
COMMENT ON COLUMN public.chat_messages.user_pattern IS 'User behavior pattern: researcher, impulse_buyer, negotiator, window_shopper';