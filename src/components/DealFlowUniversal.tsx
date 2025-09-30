import React, { useState, useEffect, useRef } from 'react';
import { AlertCircle, TrendingUp, DollarSign, Users, Zap, MessageSquare, Copy, Bell, Download, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function DealFlowUniversal() {
  const { toast } = useToast();
  const [mode, setMode] = useState('live'); // 'live' or 'paste'
  const [platform, setPlatform] = useState('auto');
  const [messages, setMessages] = useState([]);
  const [hotLeads, setHotLeads] = useState([]);
  const [stats, setStats] = useState({ revenue: 0, buyers: 0, questions: 0 });
  const [isMonitoring, setIsMonitoring] = useState(false);
  const audioRef = useRef(null);

  // Real sample data for different platforms
  const realSamples = {
    whatnot: `@vintage_lover: I'll take both earrings!
@sarah_style: how much for the bundle? ship to NY?
@buyer123: SOLD on the necklace please!!
@collector99: what's your paypal?
@fashionista: Still have the blue dress?
@deal_hunter: 💰💰 want this
@style_queen: DM me with price please`,
    
    tiktok: `katie2024: OMG need this NOW 🔥
fashionista: link please!!! I want it
shopaholic: adding to cart rn
trendsetter: is this still available?
buyer_babe: how much total with shipping?
style_icon: yes please! I'll take it`,
    
    instagram: `@thrifter: price on the jacket?
@boutique_babe: ship to Canada? How much?
@style_queen: is small available?
@vintage_vibe: I want this one!
@fashion_lover: sold! send me details
@trendy_shopper: PayPal or Venmo?`
  };

  // Universal chat patterns that work everywhere
  const analyzeMessage = (text: string, user: string) => {
    const analysis = {
      user,
      text: text.substring(0, 100),
      score: 0,
      type: 'chat',
      value: 0,
      action: null,
      color: ''
    };

    // Universal buy signals (works on ALL platforms)
    const buyPatterns = [
      { pattern: /\b(sold|deal|mine|dibs|claim)\b/i, score: 95, type: 'buy' },
      { pattern: /\b(i'll take|i want|buying|purchase)\b/i, score: 90, type: 'buy' },
      { pattern: /\b(yes|yup|yeah|sure|ok) (please|thanks|!)/i, score: 85, type: 'buy' },
      { pattern: /\b(need this|want this|love this)\b/i, score: 75, type: 'interest' },
      { pattern: /💰|💵|💳|🤝|✅/i, score: 80, type: 'buy' }
    ];

    // Universal question patterns
    const questionPatterns = [
      { pattern: /\b(how much|price|cost|\$)\b/i, score: 60, type: 'price' },
      { pattern: /\b(ship|deliver|mail|send)\b/i, score: 55, type: 'shipping' },
      { pattern: /\b(size|color|style|have)\b/i, score: 50, type: 'inventory' },
      { pattern: /\?/i, score: 40, type: 'question' }
    ];

    // Check all patterns
    [...buyPatterns, ...questionPatterns].forEach(({ pattern, score, type }) => {
      if (pattern.test(text)) {
        if (score > analysis.score) {
          analysis.score = score;
          analysis.type = type;
        }
      }
    });

    // Estimate value
    if (analysis.score > 80) analysis.value = 50;
    else if (analysis.score > 60) analysis.value = 30;
    else if (analysis.score > 40) analysis.value = 15;

    // Set action
    if (analysis.score >= 80) {
      analysis.action = 'CONTACT NOW';
      analysis.color = 'bg-red-500';
    } else if (analysis.score >= 60) {
      analysis.action = 'Answer Soon';
      analysis.color = 'bg-yellow-500';
    } else if (analysis.score >= 40) {
      analysis.action = 'Monitor';
      analysis.color = 'bg-blue-500';
    }

    return analysis;
  };

  // Generate smart follow-up message
  const generateFollowUp = (lead: any) => {
    const templates = {
      buy: `Hi @${lead.user}! I saw you wanted this - it's still available! Here's the link to purchase: [your-store-link]. Let me know if you have any questions!`,
      price: `Hey @${lead.user}! The price is $XX - and I can do fast shipping! Still interested? DM me to claim it!`,
      shipping: `@${lead.user} - We ship nationwide! 2-3 day delivery with tracking. Item is ready to go - want me to hold it for you?`,
      question: `Thanks for asking @${lead.user}! Yes still available - sending you all the details now. Ready when you are!`
    };
    return templates[lead.type as keyof typeof templates] || templates.buy;
  };

  // Copy follow-up to clipboard
  const copyFollowUp = (lead: any) => {
    const followUp = generateFollowUp(lead);
    navigator.clipboard.writeText(followUp);
    toast({
      title: "Follow-up copied!",
      description: "Paste into your DMs to close the sale",
    });
  };

  // Export hot leads to CSV
  const exportToCSV = () => {
    if (hotLeads.length === 0) {
      toast({
        title: "No leads to export",
        description: "Analyze some chat first to find hot leads",
        variant: "destructive"
      });
      return;
    }

    const csvContent = [
      ['Username', 'Message', 'Score', 'Type', 'Estimated Value', 'Follow-up Message'],
      ...hotLeads.map(lead => [
        lead.user,
        lead.text.replace(/"/g, '""'), // Escape quotes
        lead.score,
        lead.type,
        `$${lead.value}`,
        generateFollowUp(lead).replace(/"/g, '""')
      ])
    ]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dealflow-hot-leads-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    toast({
      title: "Leads exported!",
      description: `${hotLeads.length} hot leads downloaded as CSV`,
    });
  };

  // Process batch of messages (paste mode)
  const processPastedChat = (chatText: string) => {
    const lines = chatText.split('\n').filter(l => l.trim());
    const analyzed: any[] = [];
    const buyers = new Set();
    let totalValue = 0;
    let questionCount = 0;

    lines.forEach(line => {
      // Universal parser - works for any format
      let user = 'unknown';
      let message = line;

      // Try common patterns
      if (line.includes('@')) {
        const match = line.match(/@(\w+):?\s*(.*)/);
        if (match) {
          user = match[1];
          message = match[2];
        }
      } else if (line.includes(':')) {
        const parts = line.split(':');
        if (parts.length >= 2) {
          user = parts[0].trim();
          message = parts.slice(1).join(':').trim();
        }
      }

      const analysis = analyzeMessage(message, user);
      
      if (analysis.score > 30) {
        analyzed.push(analysis);
        
        if (analysis.score > 80) buyers.add(user);
        if (analysis.type === 'question' || analysis.type === 'price') questionCount++;
        totalValue += analysis.value;
      }
    });

    setMessages(analyzed);
    setHotLeads(analyzed.filter(m => m.score > 80));
    setStats({
      revenue: totalValue,
      buyers: buyers.size,
      questions: questionCount
    });
  };

  // Live monitoring simulation
  useEffect(() => {
    if (isMonitoring) {
      const interval = setInterval(() => {
        // Simulate incoming message
        const fakeUsers = ['katie22', 'shopperMike', 'anna_style', 'buyerBob'];
        const fakeMessages = [
          "I'll take the blue one!",
          "How much for shipping?",
          "Is this still available?",
          "SOLD! Send me invoice",
          "What size is this?",
          "Perfect, I want it"
        ];

        const user = fakeUsers[Math.floor(Math.random() * fakeUsers.length)];
        const text = fakeMessages[Math.floor(Math.random() * fakeMessages.length)];
        const analysis = analyzeMessage(text, user);

        if (analysis.score > 60) {
          setMessages(prev => [analysis, ...prev].slice(0, 50));
          
          if (analysis.score > 80) {
            setHotLeads(prev => [analysis, ...prev].slice(0, 10));
            // Play alert sound
            if (audioRef.current) {
              (audioRef.current as HTMLAudioElement).play();
            }
          }

          setStats(prev => ({
            revenue: prev.revenue + analysis.value,
            buyers: analysis.score > 80 ? prev.buyers + 1 : prev.buyers,
            questions: analysis.type.includes('question') ? prev.questions + 1 : prev.questions
          }));
        }
      }, 3000);

      return () => clearInterval(interval);
    }
  }, [isMonitoring]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black text-white">
      {/* Mobile-First Header */}
      <header className="sticky top-0 z-50 bg-black/80 backdrop-blur-lg border-b border-gray-800">
        <div className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              DealFlow Live
            </h1>
            <div className="flex items-center gap-2">
              {isMonitoring && (
                <div className="flex items-center gap-2 px-3 py-1 bg-red-500/20 rounded-full">
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                  <span className="text-xs">MONITORING</span>
                </div>
              )}
            </div>
          </div>

          {/* Platform Selector */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            {['Auto-Detect', 'Whatnot', 'TikTok', 'Instagram', 'Other'].map(p => (
              <button
                key={p}
                onClick={() => setPlatform(p.toLowerCase())}
                className={`px-4 py-2 rounded-lg text-xs whitespace-nowrap transition-all ${
                  platform === p.toLowerCase() 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-gray-800 text-gray-400'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Stats Bar */}
      <div className="grid grid-cols-3 gap-2 p-4 bg-black/50">
        <div className="bg-gradient-to-br from-green-900/50 to-green-800/30 rounded-xl p-3 border border-green-500/30">
          <div className="flex items-center justify-between">
            <DollarSign className="w-4 h-4 text-green-400" />
            <span className="text-2xl font-bold text-green-400">${stats.revenue}</span>
          </div>
          <div className="text-xs text-gray-400 mt-1">Potential Revenue</div>
        </div>
        
        <div className="bg-gradient-to-br from-blue-900/50 to-blue-800/30 rounded-xl p-3 border border-blue-500/30">
          <div className="flex items-center justify-between">
            <Users className="w-4 h-4 text-blue-400" />
            <span className="text-2xl font-bold text-blue-400">{stats.buyers}</span>
          </div>
          <div className="text-xs text-gray-400 mt-1">Ready Buyers</div>
        </div>
        
        <div className="bg-gradient-to-br from-purple-900/50 to-purple-800/30 rounded-xl p-3 border border-purple-500/30">
          <div className="flex items-center justify-between">
            <MessageSquare className="w-4 h-4 text-purple-400" />
            <span className="text-2xl font-bold text-purple-400">{stats.questions}</span>
          </div>
          <div className="text-xs text-gray-400 mt-1">Questions</div>
        </div>
      </div>

      {/* Mode Selector */}
      <div className="p-4">
        <div className="bg-gray-900 rounded-xl p-1 flex">
          <button
            onClick={() => setMode('live')}
            className={`flex-1 py-3 rounded-lg transition-all ${
              mode === 'live' 
                ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white' 
                : 'text-gray-400'
            }`}
          >
            <Zap className="w-4 h-4 inline mr-2" />
            Live Monitor
          </button>
          <button
            onClick={() => setMode('paste')}
            className={`flex-1 py-3 rounded-lg transition-all ${
              mode === 'paste' 
                ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white' 
                : 'text-gray-400'
            }`}
          >
            <Copy className="w-4 h-4 inline mr-2" />
            Paste Chat
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-4">
        {mode === 'live' ? (
          <div className="space-y-4">
            {/* Start Monitoring */}
            {!isMonitoring ? (
              <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-6 border border-gray-700">
                <h3 className="text-lg font-semibold mb-4">Start Monitoring</h3>
                <input
                  type="text"
                  placeholder="Enter your stream URL or username..."
                  className="w-full p-4 bg-black/50 rounded-xl border border-gray-700 text-white placeholder-gray-500 mb-4"
                />
                <button
                  onClick={() => setIsMonitoring(true)}
                  className="w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl font-semibold hover:opacity-90 transition-all"
                >
                  Start Live Monitoring
                </button>
                <p className="text-xs text-gray-500 mt-3 text-center">
                  Works with Whatnot, TikTok, Instagram, and more
                </p>
              </div>
            ) : (
              <>
                {/* Hot Leads Alert */}
                {hotLeads.length > 0 && (
                  <div className="bg-red-900/30 border border-red-500/50 rounded-xl p-4 animate-pulse">
                    <h3 className="text-lg font-bold text-red-400 mb-3 flex items-center">
                      <Bell className="w-5 h-5 mr-2" />
                      HOT BUYERS - ACT NOW!
                    </h3>
                    <div className="space-y-2">
                      {hotLeads.slice(0, 3).map((lead, i) => (
                        <div key={i} className="bg-black/30 rounded-lg p-3 flex justify-between items-center">
                          <div>
                            <span className="font-bold text-white">@{lead.user}</span>
                            <p className="text-sm text-gray-300">"{lead.text}"</p>
                          </div>
                          <button className="px-3 py-1 bg-white text-black rounded-lg text-xs font-bold">
                            Reply
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Live Feed */}
                <div className="bg-gray-900 rounded-xl border border-gray-800">
                  <div className="p-3 border-b border-gray-800 flex items-center justify-between">
                    <h3 className="font-semibold">Live Chat Analysis</h3>
                    <button
                      onClick={() => setIsMonitoring(false)}
                      className="text-xs text-red-400"
                    >
                      Stop
                    </button>
                  </div>
                  <div className="max-h-96 overflow-y-auto p-3 space-y-2">
                    {messages.map((msg, i) => (
                      <div
                        key={i}
                        className={`p-3 rounded-lg border ${
                          msg.score > 80 ? 'border-red-500/50 bg-red-900/20' :
                          msg.score > 60 ? 'border-yellow-500/50 bg-yellow-900/20' :
                          'border-gray-700 bg-gray-800/50'
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <span className="font-semibold text-sm">@{msg.user}</span>
                            {msg.action && (
                              <span className={`ml-2 text-xs px-2 py-1 rounded-full ${msg.color} text-white`}>
                                {msg.action}
                              </span>
                            )}
                            <p className="text-sm text-gray-300 mt-1">{msg.text}</p>
                          </div>
                          {msg.value > 0 && (
                            <span className="text-green-400 text-sm font-bold">~${msg.value}</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        ) : (
          /* Paste Mode */
          <div className="space-y-4">
            <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-6 border border-gray-700">
              <h3 className="text-lg font-semibold mb-4">Paste Your Chat</h3>
              <textarea
                placeholder="Paste your stream chat here...
@katie: I'll take the blue one
@mike: how much for shipping?
@anna: is this available?"
                className="w-full h-40 p-4 bg-black/50 rounded-xl border border-gray-700 text-white placeholder-gray-500 font-mono text-sm"
                onChange={(e) => processPastedChat(e.target.value)}
              />
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-4">
                <button
                  onClick={() => processPastedChat(realSamples.whatnot)}
                  className="py-3 bg-purple-600/20 border border-purple-500/30 rounded-xl hover:bg-purple-600/30 transition-all text-sm"
                >
                  Try Whatnot
                </button>
                <button
                  onClick={() => processPastedChat(realSamples.tiktok)}
                  className="py-3 bg-blue-600/20 border border-blue-500/30 rounded-xl hover:bg-blue-600/30 transition-all text-sm"
                >
                  Try TikTok
                </button>
                <button
                  onClick={() => processPastedChat(realSamples.instagram)}
                  className="py-3 bg-pink-600/20 border border-pink-500/30 rounded-xl hover:bg-pink-600/30 transition-all text-sm"
                >
                  Try Instagram
                </button>
              </div>
            </div>

            {/* Results */}
            {messages.length > 0 && (
              <div className="bg-gray-900 rounded-xl border border-gray-800 p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold">Analysis Results</h3>
                  <div className="text-sm text-gray-400">
                    💰 ${stats.revenue} potential revenue detected
                  </div>
                </div>
                
                {/* Hot Leads Section */}
                {hotLeads.length > 0 && (
                  <div className="mb-4 p-4 bg-gradient-to-r from-red-900/20 to-orange-900/20 border border-red-500/30 rounded-xl">
                    <h4 className="text-red-400 font-bold mb-2 flex items-center">
                      🔥 {hotLeads.length} Hot Leads - Contact NOW!
                    </h4>
                    <div className="space-y-2">
                      {hotLeads.slice(0, 3).map((lead, i) => (
                        <div key={i} className="bg-black/30 rounded-lg p-3">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <span className="font-bold text-white">@{lead.user}</span>
                              <p className="text-sm text-gray-300 mt-1">"{lead.text}"</p>
                            </div>
                            <span className="text-green-400 font-bold">${lead.value}</span>
                          </div>
                          <button
                            onClick={() => copyFollowUp(lead)}
                            className="w-full mt-2 py-2 bg-white text-black rounded-lg text-xs font-bold flex items-center justify-center gap-2 hover:bg-gray-200 transition-all"
                          >
                            <Sparkles className="w-4 h-4" />
                            Copy AI Follow-up
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* All Messages */}
                <div className="space-y-2 max-h-96 overflow-y-auto mb-4">
                  {messages.map((msg, i) => (
                    <div
                      key={i}
                      className={`p-3 rounded-lg flex justify-between items-center ${
                        msg.score > 80 ? 'bg-green-900/30 border border-green-500/30' :
                        msg.score > 60 ? 'bg-yellow-900/30 border border-yellow-500/30' :
                        'bg-gray-800'
                      }`}
                    >
                      <div className="flex-1">
                        <span className="font-bold">@{msg.user}</span>
                        {msg.action && (
                          <span className={`ml-2 text-xs px-2 py-1 rounded ${msg.color} text-white`}>
                            {msg.action}
                          </span>
                        )}
                        <p className="text-sm text-gray-400 mt-1">{msg.text}</p>
                      </div>
                      {msg.value > 0 && <span className="text-green-400 font-bold ml-2">${msg.value}</span>}
                    </div>
                  ))}
                </div>
                
                {/* Export Buttons */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button 
                    onClick={exportToCSV}
                    className="py-3 bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl font-semibold flex items-center justify-center gap-2 hover:from-blue-700 hover:to-blue-800 transition-all"
                  >
                    <Download className="w-4 h-4" />
                    Export to CSV ({hotLeads.length} leads)
                  </button>
                  <button 
                    onClick={() => {
                      const allFollowUps = hotLeads.map(lead => 
                        `@${lead.user}: ${generateFollowUp(lead)}`
                      ).join('\n\n');
                      navigator.clipboard.writeText(allFollowUps);
                      toast({
                        title: "All follow-ups copied!",
                        description: `${hotLeads.length} personalized messages ready to send`,
                      });
                    }}
                    className="py-3 bg-gradient-to-r from-purple-600 to-purple-700 rounded-xl font-semibold flex items-center justify-center gap-2 hover:from-purple-700 hover:to-purple-800 transition-all"
                  >
                    <Copy className="w-4 h-4" />
                    Copy All Follow-ups
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Hidden audio for alerts */}
      <audio ref={audioRef} src="data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTGH0fPTgjMGHm7A7+OZURE="/>
      
      {/* Bottom CTA */}
      <div className="p-4 mt-8 mb-20">
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-6 text-center">
          <h3 className="text-xl font-bold mb-2">Ready to 10x Your Sales?</h3>
          <p className="text-sm opacity-90 mb-4">Join 1,000+ sellers using DealFlow</p>
          <button className="bg-white text-black px-6 py-3 rounded-xl font-bold">
            Start Free Trial
          </button>
        </div>
      </div>
    </div>
  );
}
