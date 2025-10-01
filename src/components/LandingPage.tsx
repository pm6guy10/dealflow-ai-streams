import React, { useState, useEffect } from 'react';
import { Check, AlertCircle, TrendingUp } from 'lucide-react';

interface LandingPageProps {
  onStartTrial: (email?: string) => void;
}

interface ChatMessage {
  user: string;
  message: string;
  type: 'buyer' | 'question';
  delay: number;
}

export default function LandingPage({ onStartTrial }: LandingPageProps) {
  const [missedSales, setMissedSales] = useState(387420);
  const [demoChat, setDemoChat] = useState<ChatMessage[]>([]);
  const [demoResults, setDemoResults] = useState<{
    buyers: number;
    questions: number;
    revenue: number;
    confirmed: string[];
    queued: number;
    flagged: number;
  } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [hoveredFeature, setHoveredFeature] = useState<number | null>(null);
  const [emailInput, setEmailInput] = useState('');
  const [whatnotUrl, setWhatnotUrl] = useState('');
  const [isScrapingLive, setIsScrapingLive] = useState(false);
  const [liveMessages, setLiveMessages] = useState<Array<{username: string, message: string}>>([]);
  const [liveError, setLiveError] = useState<string | null>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setMissedSales(prev => prev + Math.floor(Math.random() * 21) + 10);
    }, 3500);
    return () => clearInterval(interval);
  }, []);

  const chatMessages: ChatMessage[] = [
    { user: '@buyer123', message: 'I\'ll take the blue one!', type: 'buyer', delay: 0 },
    { user: '@sarah_shop', message: 'how much for shipping?', type: 'question', delay: 500 },
    { user: '@mike', message: 'is this still available?', type: 'question', delay: 1000 },
    { user: '@katie', message: 'SOLD!! I want it', type: 'buyer', delay: 1500 }
  ];

  const handleStartTrial = () => {
    window.location.href = '/auth';
  };

  const runDemo = async () => {
    setDemoChat([]);
    setDemoResults(null);
    setIsProcessing(true);
    
    // Animate chat messages appearing
    for (let i = 0; i < chatMessages.length; i++) {
      await new Promise(resolve => setTimeout(resolve, chatMessages[i].delay));
      setDemoChat(prev => [...prev, chatMessages[i]]);
    }
    
    // Show processing animation
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Show results with animation
    setDemoResults({
      buyers: 2,
      questions: 2,
      revenue: 140,
      confirmed: ['@katie', '@buyer123'],
      queued: 2,
      flagged: 2
    });
    setIsProcessing(false);
  };

  const handleLiveDemo = async () => {
    if (!whatnotUrl.trim()) {
      setLiveError('Please enter a Whatnot URL');
      return;
    }

    setIsScrapingLive(true);
    setLiveError(null);
    setLiveMessages([]);

    try {
      const { supabase } = await import('@/integrations/supabase/client');
      
      const { data, error } = await supabase.functions.invoke('monitor-whatnot-stream', {
        body: {
          streamUrl: whatnotUrl,
          streamSessionId: null // Demo mode, no session
        }
      });

      if (error) throw error;

      if (data?.messages && data.messages.length > 0) {
        setLiveMessages(data.messages);
      } else {
        setLiveError('No messages found. Make sure your stream is live and has chat activity.');
      }
    } catch (error: any) {
      console.error('Live demo error:', error);
      setLiveError(error.message || 'Failed to scrape messages. Please try again.');
    } finally {
      setIsScrapingLive(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Animated Hero Section */}
      <header className="bg-gradient-to-br from-blue-50 via-white to-purple-50 px-4 py-12 md:py-16 relative overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-blue-200 rounded-full opacity-20 floating"></div>
          <div className="absolute top-1/2 -left-10 w-32 h-32 bg-purple-200 rounded-full opacity-20 floating" style={{animationDelay: '1s'}}></div>
          <div className="absolute bottom-10 right-1/4 w-24 h-24 bg-green-200 rounded-full opacity-20 floating" style={{animationDelay: '2s'}}></div>
        </div>
        
        <div className="max-w-4xl mx-auto relative z-10">
          {/* Immediate CTA */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 bg-yellow-100 text-yellow-800 px-4 py-2 rounded-full text-sm font-semibold mb-4 animate-fade-in">
              <TrendingUp className="w-4 h-4" />
              Live Demo • No Signup Required
            </div>
            <h1 className="text-3xl md:text-5xl font-bold text-gray-900 mb-3 tracking-tight">
              See DealFlow Work on <span className="gradient-text">Your Stream</span> Right Now
            </h1>
            <p className="text-lg md:text-xl text-gray-600 mb-6">
              Paste your Whatnot URL below and watch AI catch buyers in real-time
            </p>
          </div>
          
          {/* Live URL Input - PROMINENT */}
          <div className="bg-white rounded-2xl shadow-2xl border-4 border-blue-500 p-6 md:p-8 mb-8 animate-scale-in">
            <div className="flex flex-col sm:flex-row gap-3 mb-4">
              <input
                type="url"
                placeholder="https://www.whatnot.com/live/your-stream"
                value={whatnotUrl}
                onChange={(e) => setWhatnotUrl(e.target.value)}
                className="flex-1 px-6 py-5 rounded-xl border-2 border-gray-300 focus:border-blue-500 focus:outline-none text-lg font-medium"
              />
              <button
                onClick={handleLiveDemo}
                disabled={isScrapingLive}
                className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 disabled:opacity-50 text-white font-bold px-10 py-5 rounded-xl transition-all transform hover:scale-105 shadow-xl whitespace-nowrap text-lg"
              >
                {isScrapingLive ? (
                  <span className="flex items-center gap-2 justify-center">
                    <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Scanning...
                  </span>
                ) : (
                  '🚀 Try It Live'
                )}
              </button>
            </div>
            
            {liveError && (
              <div className="p-4 bg-red-50 border-2 border-red-200 rounded-xl text-red-700 animate-fade-in">
                {liveError}
              </div>
            )}
            
            {liveMessages.length > 0 && (
              <div className="bg-gradient-to-br from-green-50 to-blue-50 rounded-xl border-2 border-green-500 p-6 animate-fade-in">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                  <h3 className="font-bold text-xl text-green-700">✅ Live Chat Messages Detected!</h3>
                </div>
                <div className="space-y-2 max-h-80 overflow-y-auto bg-white rounded-lg p-4">
                  {liveMessages.map((msg, idx) => (
                    <div key={idx} className="bg-gray-50 rounded-lg p-3 flex items-start gap-2 hover:bg-gray-100 transition-colors">
                      <span className="font-semibold text-blue-600">{msg.username}:</span>
                      <span className="text-gray-700">{msg.message}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-4 p-5 bg-gradient-to-r from-green-500 to-blue-500 rounded-xl text-center text-white">
                  <p className="font-bold text-lg">
                    🎯 AI is analyzing these for buying signals right now!
                  </p>
                  <p className="text-sm mt-2 opacity-90">
                    Sign up to get instant alerts when buyers appear in your chat
                  </p>
                </div>
              </div>
            )}
            
            {!liveMessages.length && !liveError && (
              <div className="text-center text-gray-500 text-sm">
                ⚡ Instant results • Works with any live Whatnot stream
              </div>
            )}
          </div>
          
          {/* Secondary info */}
          <div className="text-center">
            <p className="text-gray-600 mb-4">
              Your Whatnot chat is leaking money. DealFlow catches every buyer instantly.
            </p>
            <div className="flex flex-wrap justify-center items-center gap-6 text-sm text-gray-700">
              <div className="flex items-center gap-2">
                <Check className="w-5 h-5 text-green-600" />
                <span className="font-semibold">67% Sales Increase</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-5 h-5 text-green-600" />
                <span className="font-semibold">2-Minute Setup</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-5 h-5 text-green-600" />
                <span className="font-semibold">14-Day Free Trial</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Animated Social Proof Bar */}
      <section className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 text-white py-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 via-purple-600/10 to-blue-600/10 animate-pulse"></div>
        <div className="max-w-6xl mx-auto px-4 relative z-10">
          <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16 text-center">
            <div className="transform hover:scale-110 transition-transform">
              <div className="text-3xl font-bold text-yellow-400 animate-pulse">
                ${missedSales.toLocaleString()}
              </div>
              <div className="text-xs uppercase tracking-wider opacity-75 mt-1">Recovered This Month</div>
            </div>
            <div className="hidden md:block text-gray-600">|</div>
            <div className="transform hover:scale-110 transition-transform">
              <div className="text-3xl font-bold text-green-400">67% Sales Lift</div>
              <div className="text-xs uppercase tracking-wider opacity-75 mt-1">With AI Co-Host</div>
            </div>
            <div className="hidden md:block text-gray-600">|</div>
            <div className="transform hover:scale-110 transition-transform">
              <div className="text-3xl font-bold text-blue-400">2 Minutes</div>
              <div className="text-xs uppercase tracking-wider opacity-75 mt-1">To Setup</div>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Demo Section */}
      <section id="demo" className="py-20 md:py-24 px-4 bg-gradient-to-b from-white to-gray-50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4 tracking-tight">
            Stop Finding Problems. <span className="gradient-text">Start Closing Sales.</span>
          </h2>
          <p className="text-center text-gray-600 mb-12 text-lg">
            Watch how AI turns chaos into closed deals in real-time
          </p>
          
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
            {/* Demo Header */}
            <div className="bg-gradient-to-r from-gray-900 to-gray-800 text-white p-4">
              <div className="flex items-center gap-2">
                <div className="flex gap-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                </div>
                <span className="text-sm font-medium ml-4">Whatnot Live Chat Simulator</span>
              </div>
            </div>
            
            <div className="p-8">
              {!demoResults ? (
                <div className="text-center">
                  {demoChat.length === 0 ? (
                    <button
                      onClick={runDemo}
                      className="group bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-bold py-4 px-10 rounded-xl transition-all transform hover:scale-105 shadow-xl"
                    >
                      <span className="flex items-center gap-3">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Run Live Demo
                      </span>
                    </button>
                  ) : (
                    <div className="space-y-3">
                      {/* Animated Chat Messages */}
                      <div className="bg-gray-100 rounded-lg p-4 max-w-md mx-auto">
                        {demoChat.map((msg, index) => (
                          <div 
                            key={index} 
                            className="chat-message mb-2 flex items-start gap-2"
                            style={{animationDelay: `${index * 0.1}s`}}
                          >
                            <span className={`font-semibold ${
                              msg.type === 'buyer' ? 'text-green-600' : 
                              msg.type === 'question' ? 'text-blue-600' : 'text-gray-600'
                            }`}>
                              {msg.user}:
                            </span>
                            <span className="text-gray-700">{msg.message}</span>
                            {msg.type === 'buyer' && (
                              <span className="ml-auto text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                                💰 Buyer
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                      
                      {isProcessing && (
                        <div className="mt-6">
                          <div className="flex items-center justify-center gap-2 text-blue-600">
                            <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            <span className="font-medium">AI Co-Host Processing...</span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Results Dashboard */}
                  <div className="bg-gradient-to-br from-green-50 to-blue-50 rounded-xl p-6 border-2 border-green-200">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                      <h3 className="font-bold text-lg text-gray-800">AI Co-Host Analysis Complete</h3>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                      <div className="bg-white rounded-lg p-3 text-center transform hover:scale-105 transition-transform">
                        <div className="text-2xl font-bold text-green-600">{demoResults.buyers}</div>
                        <div className="text-xs text-gray-600">Buyers Caught</div>
                      </div>
                      <div className="bg-white rounded-lg p-3 text-center transform hover:scale-105 transition-transform">
                        <div className="text-2xl font-bold text-blue-600">{demoResults.confirmed.length}</div>
                        <div className="text-xs text-gray-600">Auto-Confirmed</div>
                      </div>
                      <div className="bg-white rounded-lg p-3 text-center transform hover:scale-105 transition-transform">
                        <div className="text-2xl font-bold text-purple-600">{demoResults.queued}</div>
                        <div className="text-xs text-gray-600">Sales Queued</div>
                      </div>
                      <div className="bg-white rounded-lg p-3 text-center transform hover:scale-105 transition-transform">
                        <div className="text-2xl font-bold text-yellow-600">${demoResults.revenue}</div>
                        <div className="text-xs text-gray-600">Revenue Secured</div>
                      </div>
                    </div>
                    
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-green-600" />
                        <span className="text-gray-700">
                          <span className="font-semibold">CAUGHT:</span> {demoResults.buyers} buying signals detected instantly
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-blue-600" />
                        <span className="text-gray-700">
                          <span className="font-semibold">CONFIRMED:</span> Auto-replied to {demoResults.confirmed.join(' & ')}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-purple-600" />
                        <span className="text-gray-700">
                          <span className="font-semibold">QUEUED:</span> {demoResults.queued} sales added to dashboard
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-yellow-600" />
                        <span className="text-gray-700">
                          <span className="font-semibold">FLAGGED:</span> {demoResults.flagged} questions for your review
                        </span>
                      </div>
                    </div>
                    
                    <div className="mt-6 p-4 bg-gradient-to-r from-green-100 to-blue-100 rounded-lg text-center">
                      <p className="text-lg font-bold text-gray-800">
                        💰 You just secured ${demoResults.revenue} without lifting a finger
                      </p>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })}
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold py-4 rounded-xl transition-all transform hover:scale-105 shadow-xl"
                  >
                    Get My AI Co-Host Now →
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Enhanced Features Section */}
      <section className="py-20 md:py-24 px-4 bg-white">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4 tracking-tight">
            The Secret Sauce: <span className="gradient-text">Your AI Co-Host in Action</span>
          </h2>
          <p className="text-center text-gray-600 mb-12 text-lg">
            Three simple steps to never miss a sale again
          </p>
          
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: '1',
                title: 'CATCH',
                subtitle: 'Never Miss a Signal',
                description: 'DealFlow monitors chat for 50+ buying phrases. Loud alerts + popups mean you literally can\'t miss a sale.',
                color: 'green',
                icon: '🎯'
              },
              {
                step: '2',
                title: 'CONFIRM',
                subtitle: 'Instantly Secure Claims',
                description: 'Your AI auto-replies: "Got it, you\'re first in line!" Locks in commitment and prevents overselling.',
                color: 'blue',
                icon: '✅'
              },
              {
                step: '3',
                title: 'QUEUE',
                subtitle: 'Automate Your Workflow',
                description: 'Sales added to live dashboard with username, item, timestamp. Export buyer list post-stream.',
                color: 'purple',
                icon: '📊'
              }
            ].map((feature, index) => (
              <div 
                key={index}
                className={`relative bg-white rounded-xl border-2 p-6 transform transition-all hover:scale-105 hover:shadow-2xl cursor-pointer ${
                  hoveredFeature === index ? `border-${feature.color}-400 shadow-2xl` : 'border-gray-200'
                }`}
                onMouseEnter={() => setHoveredFeature(index)}
                onMouseLeave={() => setHoveredFeature(null)}
              >
                <div className={`absolute -top-4 -right-4 text-4xl transform transition-transform ${
                  hoveredFeature === index ? 'scale-125 rotate-12' : ''
                }`}>
                  {feature.icon}
                </div>
                
                <div className={`text-5xl font-bold mb-3 text-${feature.color}-500`}>
                  {feature.step}
                </div>
                <h3 className={`font-bold text-xl mb-1 text-${feature.color}-600`}>
                  {feature.title}
                </h3>
                <p className="font-semibold text-gray-800 mb-3">
                  {feature.subtitle}
                </p>
                <p className="text-gray-600 text-sm leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Enhanced Pricing Section */}
      <section id="pricing" className="py-20 md:py-24 px-4 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-md mx-auto">
          <div className="relative">
            {/* Glow effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-400 rounded-2xl blur-xl opacity-20"></div>
            
            <div className="relative bg-white border-2 border-blue-500 rounded-2xl p-8 shadow-2xl">
              <div className="absolute -top-5 left-1/2 -translate-x-1/2">
                <span className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-2 rounded-full text-sm font-bold uppercase tracking-wider">
                  Limited Time Launch Price
                </span>
              </div>
              
              <h3 className="text-2xl font-bold text-center mb-2 mt-4">
                One Plan. Unlimited Sales.
              </h3>
              <p className="text-center text-gray-600 mb-6">
                Pays for itself in your first recovered sale
              </p>
              
              <div className="text-center mb-8">
                <span className="text-6xl font-bold">$99</span>
                <span className="text-3xl text-gray-500">.99</span>
                <span className="text-gray-500">/mo</span>
              </div>
              
              <ul className="space-y-4 mb-8">
                {[
                  'Your own AI Co-Host watching every stream',
                  '"Catch, Confirm, Queue" full automation',
                  'Works with TikTok, Instagram, Whatnot, FB, YouTube',
                  'Automated buyer list export & follow-up',
                  'Real-time dashboard & analytics',
                  '14-day free trial'
                ].map((item, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">{item}</span>
                  </li>
                ))}
              </ul>
              
              <div className="space-y-3">
                <input
                  type="email"
                  placeholder="Enter your email"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button 
                  onClick={() => onStartTrial(emailInput)}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold py-4 rounded-lg transition-all transform hover:scale-105 text-lg shadow-xl"
                >
                  Start My 14-Day Free Trial →
                </button>
              </div>
              
              <p className="text-center text-sm text-gray-500 mt-4">
                Cancel anytime • Setup in 2 minutes
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Enhanced FAQ */}
      <section className="py-20 md:py-24 px-4 bg-white">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 tracking-tight">
            Your Questions, <span className="gradient-text">Answered</span>
          </h2>
          
          <div className="space-y-4">
            {[
              {
                q: 'Do I need to install anything complex?',
                a: 'No. DealFlow is a simple browser extension. You open it in a new tab beside your stream. That\'s it. Takes 2 minutes.'
              },
              {
                q: 'How fast will I see results?',
                a: 'On your very next stream. Most sellers recover the $99.99 cost within the first hour. Average recovery is $140 per stream.'
              },
              {
                q: 'What happens if I oversell an item?',
                a: 'Your AI Co-Host prevents this. The "Confirm & Queue" system works first-come, first-served, automatically securing items and notifying others they\'re next in line.'
              },
              {
                q: 'Does it work with my platform?',
                a: 'Yes! Works with TikTok Shop, Instagram Live, Whatnot, Facebook Live, YouTube Live, and any platform with a chat.'
              }
            ].map((faq, index) => (
              <div key={index} className="bg-gray-50 rounded-xl p-6 border border-gray-100 hover:shadow-lg transition-shadow">
                <h3 className="font-bold text-lg mb-2 text-gray-800">{faq.q}</h3>
                <p className="text-gray-600">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Enhanced Final CTA */}
      <section className="py-24 px-4 bg-gradient-to-br from-blue-600 to-purple-600 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-black opacity-10"></div>
        <div className="max-w-3xl mx-auto text-center relative z-10">
          <h2 className="text-4xl md:text-5xl font-bold mb-6 tracking-tight">
            You're One Stream Away From 67% Higher Sales
          </h2>
          <p className="text-xl mb-8 opacity-95">
            Stop leaving money on the table. Let your AI Co-Host handle the chaos.
          </p>
          <button 
            onClick={() => onStartTrial()}
            className="bg-white text-blue-600 hover:bg-gray-100 text-lg font-bold py-4 px-12 rounded-xl shadow-2xl transition-all transform hover:scale-105"
          >
            Start My 14-Day Free Trial
          </button>
          <p className="text-sm mt-4 opacity-75">
            Join 500+ sellers already using AI
          </p>
        </div>
      </section>
    </div>
  );
}
