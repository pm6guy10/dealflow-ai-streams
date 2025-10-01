import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import Dashboard from '@/components/Dashboard';

interface StreamSession {
  id: string;
  started_at: string;
  platform: string;
}

interface Claim {
  id: string;
  buyer_username: string;
  item_description: string;
  estimated_value: number;
  captured_at: string;
  message_text: string;
}

const DashboardPage = () => {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [activeSession, setActiveSession] = useState<StreamSession | null>(null);
  const [claims, setClaims] = useState<Claim[]>([]);
  const [loading, setLoading] = useState(true);
  const [autoSimulating, setAutoSimulating] = useState(false);

  useEffect(() => {
    if (user) {
      loadActiveSession();
      subscribeToNewClaims();
    }
  }, [user]);

  // Auto-simulate claims every 8-15 seconds when session is active
  useEffect(() => {
    if (!activeSession || !autoSimulating) return;

    const simulateRandomClaim = () => {
      const delay = Math.random() * 7000 + 8000; // 8-15 seconds
      return setTimeout(() => {
        handleSimulateClaim();
      }, delay);
    };

    const timeout = simulateRandomClaim();
    return () => clearTimeout(timeout);
  }, [activeSession, claims.length, autoSimulating]);

  const loadActiveSession = async () => {
    try {
      const { data, error } = await supabase
        .from('stream_sessions')
        .select('*')
        .is('ended_at', null)
        .eq('user_id', user?.id)
        .order('started_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      
      setActiveSession(data);
      
      if (data) {
        loadSessionClaims(data.id);
      }
    } catch (error: any) {
      console.error('Error loading session:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadSessionClaims = async (sessionId: string) => {
    try {
      const { data, error } = await supabase
        .from('sales_captured')
        .select('*')
        .eq('stream_session_id', sessionId)
        .order('captured_at', { ascending: false });

      if (error) throw error;
      setClaims(data || []);
    } catch (error: any) {
      console.error('Error loading claims:', error);
    }
  };

  const subscribeToNewClaims = () => {
    const channel = supabase
      .channel('sales_captured_changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'sales_captured',
          filter: `user_id=eq.${user?.id}`
        },
        (payload) => {
          setClaims(prev => [payload.new as Claim, ...prev]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const handleStartStream = async (platform: string = "whatnot") => {
    try {
      const { data, error } = await supabase
        .from('stream_sessions')
        .insert({
          user_id: user?.id,
          platform: platform,
          started_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      setActiveSession(data);
      setClaims([]);
      setAutoSimulating(true); // Start auto-simulation
      
      toast({
        title: "Demo Started",
        description: "Watch as the AI detects purchase intent in real-time!"
      });

      // Generate first claim after 3 seconds
      setTimeout(() => handleSimulateClaim(), 3000);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const handleEndStream = async () => {
    if (!activeSession) return;

    try {
      setAutoSimulating(false); // Stop auto-simulation
      
      const { error } = await supabase
        .from('stream_sessions')
        .update({ ended_at: new Date().toISOString() })
        .eq('id', activeSession.id);

      if (error) throw error;

      toast({
        title: "Demo Ended",
        description: `${claims.length} claims captured`
      });

      setActiveSession(null);
      setClaims([]);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const handleSimulateClaim = async () => {
    if (!activeSession) {
      toast({
        title: "No Active Demo",
        description: "Start a demo first",
        variant: "destructive"
      });
      return;
    }

    const usernames = ['@SneakerHead23', '@CollectorKate', '@MikeTheReseller', '@ShopperSarah', '@VintageVibes', '@CardKing', '@DealHunter99'];
    const messages = [
      'I need that one!',
      'Sold! How much?',
      'I\'ll take it',
      'Can I get that?',
      'Put me down for one',
      'I want it!',
      'Mine please',
      'Sold to me!',
      'I\'ll buy that',
      'How much for that?'
    ];
    const items = ['Vintage Nike Air Max', 'Pokemon Card Bundle', 'Designer Handbag', 'Limited Edition Sneakers', 'Rare Vinyl Record', 'Collectible Figure', 'Vintage Watch', 'Sports Memorabilia'];
    const prices = [149, 89, 299, 199, 79, 129, 249, 179, 99];

    const randomUsername = usernames[Math.floor(Math.random() * usernames.length)];
    const randomMessage = messages[Math.floor(Math.random() * messages.length)];
    const randomItem = items[Math.floor(Math.random() * items.length)];
    const randomPrice = prices[Math.floor(Math.random() * prices.length)];

    try {
      const { error } = await supabase
        .from('sales_captured')
        .insert({
          user_id: user?.id,
          stream_session_id: activeSession.id,
          buyer_username: randomUsername,
          item_description: randomItem,
          estimated_value: randomPrice,
          message_text: randomMessage,
          platform: activeSession.platform,
          captured_at: new Date().toISOString()
        });

      if (error) throw error;

    } catch (error: any) {
      console.error('Error simulating claim:', error);
    }
  };

  const handleExport = () => {
    if (claims.length === 0) {
      toast({
        title: "No Claims",
        description: "No claims to export",
        variant: "destructive"
      });
      return;
    }

    const headers = ['Username', 'Item', 'Price', 'Timestamp', 'Stream_Date'];
    const rows = claims.map(claim => [
      claim.buyer_username,
      claim.item_description,
      `$${claim.estimated_value}`,
      new Date(claim.captured_at).toLocaleTimeString(),
      new Date(claim.captured_at).toLocaleDateString()
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dealflow_export_${new Date().toISOString().split('T')[0]}_${Date.now()}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    toast({
      title: "Success",
      description: `${claims.length} claims exported successfully!`
    });
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <Dashboard
      activeSession={activeSession}
      claims={claims}
      onStartStream={handleStartStream}
      onEndStream={handleEndStream}
      onSimulateClaim={handleSimulateClaim}
      onExport={handleExport}
      onSignOut={handleSignOut}
    />
  );
};

export default DashboardPage;
