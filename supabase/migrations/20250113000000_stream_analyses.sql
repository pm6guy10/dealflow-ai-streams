-- Stream Analyses table for post-stream reports
CREATE TABLE IF NOT EXISTS stream_analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stream_url TEXT NOT NULL,
  total_comments INTEGER DEFAULT 0,
  total_intents INTEGER DEFAULT 0,
  intents_data JSONB DEFAULT '[]'::jsonb,
  analyzed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Message approvals tracking
CREATE TABLE IF NOT EXISTS message_approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  analysis_id UUID NOT NULL REFERENCES stream_analyses(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT NOT NULL,
  original_message TEXT NOT NULL,
  edited_message TEXT,
  status TEXT NOT NULL CHECK (status IN ('pending', 'approved', 'skipped')),
  approved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Referral tracking
CREATE TABLE IF NOT EXISTS referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  referred_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  referral_code TEXT UNIQUE NOT NULL,
  referred_email TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'inactive')),
  tier TEXT CHECK (tier IN ('founding_member', 'early_access', 'regular')),
  lifetime_earnings DECIMAL(10, 2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Referral earnings tracking
CREATE TABLE IF NOT EXISTS referral_earnings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referral_id UUID NOT NULL REFERENCES referrals(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL,
  period_start TIMESTAMP WITH TIME ZONE NOT NULL,
  period_end TIMESTAMP WITH TIME ZONE NOT NULL,
  paid_out BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_stream_analyses_user_id ON stream_analyses(user_id);
CREATE INDEX IF NOT EXISTS idx_stream_analyses_analyzed_at ON stream_analyses(analyzed_at DESC);
CREATE INDEX IF NOT EXISTS idx_message_approvals_analysis_id ON message_approvals(analysis_id);
CREATE INDEX IF NOT EXISTS idx_message_approvals_user_id ON message_approvals(user_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referrer_user_id ON referrals(referrer_user_id);
CREATE INDEX IF NOT EXISTS idx_referrals_code ON referrals(referral_code);
CREATE INDEX IF NOT EXISTS idx_referral_earnings_referral_id ON referral_earnings(referral_id);

-- RLS Policies
ALTER TABLE stream_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE referral_earnings ENABLE ROW LEVEL SECURITY;

-- Users can only see their own analyses
CREATE POLICY "Users can view own stream analyses"
  ON stream_analyses FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own stream analyses"
  ON stream_analyses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can manage their own message approvals
CREATE POLICY "Users can view own message approvals"
  ON message_approvals FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own message approvals"
  ON message_approvals FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own message approvals"
  ON message_approvals FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can view their own referral data
CREATE POLICY "Users can view own referrals"
  ON referrals FOR SELECT
  USING (auth.uid() = referrer_user_id);

CREATE POLICY "Users can create own referrals"
  ON referrals FOR INSERT
  WITH CHECK (auth.uid() = referrer_user_id);

-- Users can view their own referral earnings
CREATE POLICY "Users can view own referral earnings"
  ON referral_earnings FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM referrals 
    WHERE referrals.id = referral_earnings.referral_id 
    AND referrals.referrer_user_id = auth.uid()
  ));
