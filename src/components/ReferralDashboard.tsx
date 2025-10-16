import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Users, 
  DollarSign, 
  Copy, 
  Check,
  TrendingUp,
  Award,
  ExternalLink
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface ReferralData {
  id: string;
  referral_code: string;
  tier: 'founding_member' | 'early_access' | 'regular' | null;
  lifetime_earnings: number;
  referred_count: number;
  active_referrals: number;
}

export const ReferralDashboard = () => {
  const [referralData, setReferralData] = useState<ReferralData | null>(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const referralUrl = referralData 
    ? `https://dealflow.ai/signup?ref=${referralData.referral_code}`
    : '';

  useEffect(() => {
    const fetchReferralData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Check if user has a referral code
        let { data: referral, error } = await supabase
          .from('referrals')
          .select(`
            id,
            referral_code,
            tier,
            lifetime_earnings
          `)
          .eq('referrer_user_id', user.id)
          .single();

        if (error && error.code === 'PGRST116') {
          // No referral code exists, create one
          const code = `DEALFLOW${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
          
          const { data: newReferral, error: insertError } = await supabase
            .from('referrals')
            .insert({
              referrer_user_id: user.id,
              referral_code: code,
              tier: 'regular' // Default tier
            })
            .select()
            .single();

          if (insertError) throw insertError;
          referral = newReferral;
        }

        if (referral) {
          // Count referrals
          const { count: totalCount } = await supabase
            .from('referrals')
            .select('*', { count: 'exact', head: true })
            .eq('referrer_user_id', user.id)
            .not('referred_user_id', 'is', null);

          const { count: activeCount } = await supabase
            .from('referrals')
            .select('*', { count: 'exact', head: true })
            .eq('referrer_user_id', user.id)
            .eq('status', 'active');

          setReferralData({
            id: referral.id,
            referral_code: referral.referral_code,
            tier: referral.tier,
            lifetime_earnings: referral.lifetime_earnings || 0,
            referred_count: totalCount || 0,
            active_referrals: activeCount || 0
          });
        }
      } catch (err) {
        console.error('Error fetching referral data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchReferralData();
  }, []);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(referralUrl);
      setCopied(true);
      toast({
        title: "Link Copied!",
        description: "Your referral link has been copied to clipboard",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to copy link",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <Card className="p-6 bg-gray-900 border-gray-700">
        <p className="text-gray-400">Loading referral data...</p>
      </Card>
    );
  }

  const getTierBadge = () => {
    if (!referralData?.tier) return null;

    const tierConfig = {
      founding_member: {
        label: '🏆 FOUNDING MEMBER',
        className: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
      },
      early_access: {
        label: '⭐ EARLY ACCESS',
        className: 'bg-purple-500/20 text-purple-400 border-purple-500/30'
      },
      regular: {
        label: 'MEMBER',
        className: 'bg-blue-500/20 text-blue-400 border-blue-500/30'
      }
    };

    const config = tierConfig[referralData.tier];
    return (
      <Badge variant="outline" className={config.className}>
        {config.label}
      </Badge>
    );
  };

  const monthlyEarnings = referralData 
    ? (referralData.active_referrals * 79 * 0.5).toFixed(2)
    : '0.00';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Referral Program</h2>
          <p className="text-gray-400">Earn 50% revenue share on all referrals</p>
        </div>
        {getTierBadge()}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-6 bg-gradient-to-br from-green-900/50 to-green-800/30 border-green-500/30">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-500/20 rounded-lg">
              <DollarSign className="w-6 h-6 text-green-400" />
            </div>
            <div>
              <p className="text-gray-400 text-sm">Lifetime Earnings</p>
              <p className="text-2xl font-bold text-white">
                ${referralData?.lifetime_earnings.toFixed(2) || '0.00'}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-blue-900/50 to-blue-800/30 border-blue-500/30">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-500/20 rounded-lg">
              <Users className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <p className="text-gray-400 text-sm">Active Referrals</p>
              <p className="text-2xl font-bold text-white">
                {referralData?.active_referrals || 0}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-purple-900/50 to-purple-800/30 border-purple-500/30">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-purple-500/20 rounded-lg">
              <TrendingUp className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <p className="text-gray-400 text-sm">Monthly Recurring</p>
              <p className="text-2xl font-bold text-white">
                ${monthlyEarnings}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Referral Link */}
      <Card className="p-6 bg-gray-900 border-gray-700">
        <h3 className="text-lg font-semibold text-white mb-4">Your Referral Link</h3>
        <div className="flex gap-2">
          <Input
            value={referralUrl}
            readOnly
            className="bg-gray-950 border-gray-600 text-white font-mono"
          />
          <Button
            onClick={handleCopyLink}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 mr-2" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 mr-2" />
                Copy
              </>
            )}
          </Button>
        </div>
        <p className="text-sm text-gray-400 mt-3">
          Share this link to earn 50% revenue share ($40/mo per paying referral)
        </p>
      </Card>

      {/* How It Works */}
      <Card className="p-6 bg-gradient-to-br from-gray-900 to-gray-800 border-gray-700">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Award className="w-5 h-5 text-yellow-400" />
          How It Works
        </h3>
        <div className="space-y-3 text-gray-300">
          <div className="flex items-start gap-3">
            <span className="text-blue-400 font-bold">1.</span>
            <p>Share your unique referral link with other Whatnot sellers</p>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-blue-400 font-bold">2.</span>
            <p>When they sign up and subscribe ($79/mo), you earn 50% revenue share</p>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-blue-400 font-bold">3.</span>
            <p>Earn <strong className="text-white">$40/month</strong> for every active referral, paid out monthly</p>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-blue-400 font-bold">4.</span>
            <p>No cap on earnings - the more you refer, the more you earn</p>
          </div>
        </div>
      </Card>

      {/* Tier Benefits (if founding member) */}
      {referralData?.tier === 'founding_member' && (
        <Card className="p-6 bg-gradient-to-br from-yellow-900/50 to-orange-900/50 border-yellow-500/30">
          <h3 className="text-lg font-semibold text-yellow-400 mb-4 flex items-center gap-2">
            🏆 Founding Member Benefits
          </h3>
          <ul className="space-y-2 text-gray-300">
            <li className="flex items-center gap-2">
              <Check className="w-4 h-4 text-green-400" />
              FREE lifetime access to all features
            </li>
            <li className="flex items-center gap-2">
              <Check className="w-4 h-4 text-green-400" />
              50% revenue share on all referrals forever
            </li>
            <li className="flex items-center gap-2">
              <Check className="w-4 h-4 text-green-400" />
              Exclusive founding member badge
            </li>
            <li className="flex items-center gap-2">
              <Check className="w-4 h-4 text-green-400" />
              Priority support and feature requests
            </li>
          </ul>
        </Card>
      )}
    </div>
  );
};
