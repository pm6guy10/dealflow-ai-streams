import React, { useState, useEffect } from 'react';
import { AlertCircle, TrendingUp, DollarSign, Users, Zap, MessageSquare, Bell, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface LandingPageProps {
  onStartTrial: () => void;
}

export default function LandingPage({ onStartTrial }: LandingPageProps) {
  const [lostRevenue, setLostRevenue] = useState(47892);
  const [missedMessages, setMissedMessages] = useState(892);
  const [demoInput, setDemoInput] = useState('');
  const [demoResults, setDemoResults] = useState<{
    hotBuyers: number;
    questions: number;
    revenue: number;
    messages: number;
  } | null>(null);
  const [showExitPopup, setShowExitPopup] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  const [scrollBanner, setScrollBanner] = useState(false);

  // Live counters
  useEffect(() => {
    const revenueInterval = setInterval(() => {
      setLostRevenue(prev => prev + Math.floor(Math.random() * 7) + 3);
    }, 3000);

    const messageInterval = setInterval(() => {
      setMissedMessages(prev => prev + 1);
    }, 8000);

    // Show notification after 10 seconds
    setTimeout(() => setShowNotification(true), 10000);

    // Track scroll for banner
    const handleScroll = () => {
      if (window.scrollY > 800 && !scrollBanner) {
        setScrollBanner(true);
      }
    };
    window.addEventListener('scroll', handleScroll);

    // Exit intent
    const handleMouseLeave = (e: MouseEvent) => {
      if (e.clientY <= 0 && !showExitPopup) {
        setShowExitPopup(true);
      }
    };
    document.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      clearInterval(revenueInterval);
      clearInterval(messageInterval);
      window.removeEventListener('scroll', handleScroll);
      document.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [scrollBanner, showExitPopup]);

  // Demo analyzer
  const analyzeDemo = () => {
    if (!demoInput.trim()) {
      // Load sample if empty
      const sample = `@katie_shops: I'll take the blue hoodie if it's under $50!
@buyernow: ship to NY?
@sarah: SOLD! I want both
@viewer123: nice stream
@anna_style: is this still available?
@mike_2024: how much for the bundle?
@randomuser: hey everyone
@boutique_babe: DM me please!!
@shopper99: do you take paypal?`;
      setDemoInput(sample);
      analyzeDemoText(sample);
    } else {
      analyzeDemoText(demoInput);
    }
  };

  const analyzeDemoText = (text: string) => {
    const lines = text.split('\n');
    let hotBuyers = 0;
    let questions = 0;
    let revenue = 0;

    lines.forEach(line => {
      const lower = line.toLowerCase();
      if (/\b(sold|i'll take|want|buy|dibs)\b/.test(lower)) {
        hotBuyers++;
        revenue += 50;
      } else if (/\?|how much|ship|available|paypal/.test(lower)) {
        questions++;
        revenue += 20;
      }
    });

    setDemoResults({
      hotBuyers,
      questions,
      revenue,
      messages: lines.length
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-black to-gray-900 text-white">
      {/* Floating Notification */}
      {showNotification && (
        <div className="fixed top-4 right-4 z-50 animate-slide-in">
          <div className="bg-red-600 text-white p-4 rounded-xl shadow-2xl max-w-sm">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                  <span className="font-bold">New buyer detected!</span>
                </div>
                <p className="text-sm opacity-90">@sarah_style just said "I'll take both!"</p>
                <button className="text-xs mt-2 underline">See How DealFlow Caught This →</button>
              </div>
              <button 
                onClick={() => setShowNotification(false)}
                className="text-white/60 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Exit Intent Popup */}
      {showExitPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="bg-gradient-to-br from-gray-900 to-gray-800 p-8 rounded-2xl max-w-md mx-4 border border-gray-700">
            <h3 className="text-2xl font-bold mb-4">Wait! 👋</h3>
            <p className="text-gray-300 mb-6">
              Want to see how much money you missed in your last stream?
            </p>
            <div className="flex gap-3">
              <button 
                onClick={() => {
                  setShowExitPopup(false);
                  document.getElementById('demo')?.scrollIntoView();
                }}
                className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 py-3 rounded-xl font-bold"
              >
                Quick Demo (10 sec)
              </button>
              <button 
                onClick={() => setShowExitPopup(false)}
                className="flex-1 bg-gray-700 py-3 rounded-xl"
              >
                No Thanks
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Scroll Banner */}
      {scrollBanner && (
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-gradient-to-r from-purple-600 to-blue-600 p-4">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="text-2xl">👀</div>
              <p className="font-semibold">
                Still reading? Your competition is already using this.
              </p>
            </div>
            <button 
              className="bg-white text-black px-6 py-2 rounded-lg font-bold hover:bg-gray-100"
              onClick={() => document.getElementById('cta')?.scrollIntoView()}
            >
              Start Free - No Card
            </button>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 to-purple-600/20 blur-3xl"></div>
        <div className="relative max-w-6xl mx-auto px-4 py-16 md:py-24">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Still Squinting at Chat While Selling? 
              <span className="text-3xl ml-2">🤦</span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-300 mb-8">
              You're losing $30-50 every time you miss a buyer's message. 
              <span className="text-yellow-400 font-semibold"> Here's proof.</span>
            </p>
            <Button
              onClick={() => document.getElementById('demo')?.scrollIntoView()}
              size="lg"
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:shadow-2xl hover:shadow-purple-500/25 text-lg px-8 py-6 h-auto"
            >
              See Your Missed Sales →
            </Button>
            <p className="text-sm text-gray-500 mt-4">Takes 10 seconds. No credit card.</p>
          </div>
        </div>
      </section>

      {/* Problem Agitation */}
      <section className="py-16 px-4 bg-black/50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">
            The Brutal Truth About Live Selling:
          </h2>
          
          <div className="bg-gradient-to-br from-red-900/20 to-red-800/10 rounded-2xl p-8 border border-red-500/30 mb-8">
            <h3 className="text-2xl font-bold mb-6 text-red-400">You can't do both.</h3>
            <p className="text-lg text-gray-300 mb-6">
              Either you're showing products OR you're reading chat. Never both.
            </p>
            
            <div className="space-y-4">
              <p className="text-gray-400">
                While you're holding up that jacket, explaining the details, making it look good...
              </p>
              <div className="space-y-2 pl-4 border-l-4 border-red-500/50">
                <p className="text-gray-300">
                  <span className="text-red-400">@katie_shops</span> just said "I'll take it!" 
                  <span className="text-red-500 font-bold"> (missed)</span>
                </p>
                <p className="text-gray-300">
                  <span className="text-red-400">@buyernow</span> asked "ship to NY?" 
                  <span className="text-red-500 font-bold"> (missed)</span>
                </p>
                <p className="text-gray-300">
                  <span className="text-red-400">@sarah</span> wrote "SOLD!" three times 
                  <span className="text-red-500 font-bold"> (missed)</span>
                </p>
              </div>
            </div>
            
            <div className="mt-8 p-4 bg-red-900/30 rounded-xl text-center">
              <p className="text-2xl font-bold text-red-400">Each missed message = $30-50 gone.</p>
              <p className="text-gray-400 mt-2">Do 3 streams a week? You're losing $400-900/month.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Live Demo */}
      <section id="demo" className="py-16 px-4 bg-gradient-to-b from-gray-900 to-black">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-4">See What You're Missing</h2>
          <p className="text-xl text-center text-gray-400 mb-12">
            <span className="text-yellow-400 font-bold">Paste any chat.</span> Watch the money appear.
          </p>
          
          <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-8 border border-gray-700">
            <textarea
              value={demoInput}
              onChange={(e) => setDemoInput(e.target.value)}
              placeholder="Paste your stream chat here (or click analyze to see a sample)"
              className="w-full h-40 p-4 bg-black/50 border border-gray-600 rounded-xl text-white placeholder-gray-500 font-mono text-sm resize-none focus:border-blue-500 focus:outline-none"
            />
            
            <Button
              onClick={analyzeDemo}
              className="w-full mt-4 py-6 bg-gradient-to-r from-blue-600 to-purple-600 hover:shadow-2xl hover:shadow-purple-500/25 text-lg h-auto"
            >
              Analyze Chat →
            </Button>
            
            {demoResults && (
              <div className="mt-8 space-y-4 animate-fade-in">
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-red-900/30 border border-red-500/50 rounded-xl p-4">
                    <div className="text-3xl font-bold text-red-400">{demoResults.hotBuyers}</div>
                    <div className="text-sm text-gray-400">Hot Buyers Ready</div>
                    <div className="text-lg text-red-300 mt-1">${demoResults.hotBuyers * 50}</div>
                  </div>
                  <div className="bg-yellow-900/30 border border-yellow-500/50 rounded-xl p-4">
                    <div className="text-3xl font-bold text-yellow-400">{demoResults.questions}</div>
                    <div className="text-sm text-gray-400">Questions Missed</div>
                    <div className="text-lg text-yellow-300 mt-1">${demoResults.questions * 20}</div>
                  </div>
                  <div className="bg-green-900/30 border border-green-500/50 rounded-xl p-4">
                    <div className="text-3xl font-bold text-green-400">${demoResults.revenue}</div>
                    <div className="text-sm text-gray-400">Total Missed</div>
                    <div className="text-lg text-green-300 mt-1">Per Stream!</div>
                  </div>
                </div>
                
                <div className="bg-gradient-to-r from-red-600/20 to-purple-600/20 rounded-xl p-6 border border-purple-500/30">
                  <p className="text-center text-lg">
                    <span className="text-2xl font-bold text-purple-400">The average seller misses 12 buyers per stream.</span>
                  </p>
                  <p className="text-center text-gray-400 mt-2">
                    That's $400+ walking away while you're looking at products instead of chat.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Solution Section */}
      <section className="py-16 px-4 bg-black/50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-4">Finally. A Second Set of Eyes.</h2>
          <p className="text-xl text-center text-gray-400 mb-12">
            <span className="text-blue-400 font-bold">DealFlow watches chat</span> so you don't have to.
          </p>
          
          <div className="bg-gradient-to-br from-blue-900/20 to-purple-900/20 rounded-2xl p-8 border border-blue-500/30 mb-8">
            <p className="text-xl text-center mb-8 text-gray-300">
              Stream on your phone. DealFlow on your tablet.
              <br />
              <span className="text-blue-400 font-bold">Never miss "I'll take it!" again.</span>
            </p>
            
            <div className="grid md:grid-cols-2 gap-4">
              {[
                { icon: Bell, title: "Instant Alerts", desc: "Big red banner when someone wants to buy" },
                { icon: Zap, title: "Smart Filtering", desc: 'Ignores spam, catches "SOLD!"' },
                { icon: DollarSign, title: "Revenue Tracking", desc: "Shows exactly what each message is worth" },
                { icon: MessageSquare, title: "Quick Replies", desc: 'One tap to say "DM sent!"' },
                { icon: Users, title: "Works Everywhere", desc: "Whatnot, TikTok, IG, anywhere you sell" },
                { icon: TrendingUp, title: "Growth Insights", desc: "See what products get asked about most" }
              ].map((feature, i) => (
                <div key={i} className="flex gap-3">
                  <feature.icon className="w-6 h-6 text-blue-400 flex-shrink-0 mt-1" />
                  <div>
                    <h4 className="font-semibold text-white">{feature.title}</h4>
                    <p className="text-sm text-gray-400">{feature.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Live Ticker */}
      <section className="py-8 bg-gradient-to-r from-red-900/20 to-purple-900/20 border-y border-red-500/30">
        <div className="max-w-6xl mx-auto px-4">
          <p className="text-center text-sm text-gray-400 mb-4">Right Now, Across All Platforms:</p>
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-3xl font-bold text-red-400">
                ${lostRevenue.toLocaleString()}
              </div>
              <div className="text-sm text-gray-400">lost to missed messages today</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-yellow-400">
                {missedMessages}
              </div>
              <div className="text-sm text-gray-400">"I'll take it" messages ignored</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-purple-400">
                2,847
              </div>
              <div className="text-sm text-gray-400">"Still available?" with no response</div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Do the Math. This Pays for Itself.</h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-gradient-to-br from-red-900/20 to-gray-900 rounded-2xl p-6 border border-red-500/30">
              <h3 className="text-xl font-bold mb-4 text-red-400 flex items-center">
                <X className="w-5 h-5 mr-2" />
                Without DealFlow:
              </h3>
              <ul className="space-y-3 text-gray-300">
                <li>• Miss 10+ buyers per stream</li>
                <li>• Lose $300-500 per stream</li>
                <li>• Buyers go to competitors</li>
                <li>• You never know what you missed</li>
              </ul>
            </div>
            
            <div className="bg-gradient-to-br from-green-900/20 to-gray-900 rounded-2xl p-6 border border-green-500/30">
              <h3 className="text-xl font-bold mb-4 text-green-400 flex items-center">
                <Check className="w-5 h-5 mr-2" />
                With DealFlow:
              </h3>
              <ul className="space-y-3 text-gray-300">
                <li>• Catch every buyer instantly</li>
                <li>• Save ONE sale = pays for itself</li>
                <li>• Follow up with interested viewers</li>
                <li>• See exactly what converts</li>
              </ul>
            </div>
          </div>
          
          <div className="mt-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 text-center">
            <div className="text-5xl font-bold mb-2">$19.99/month</div>
            <p className="text-xl opacity-90">Less than one missed sale</p>
            <p className="text-sm mt-4 opacity-75">14-day free trial • Cancel anytime • No BS</p>
          </div>
        </div>
      </section>

      {/* Objection Handling */}
      <section className="py-16 px-4 bg-gray-900/50">
        <div className="max-w-4xl mx-auto space-y-8">
          <div>
            <h3 className="text-xl font-bold mb-3 text-yellow-400">
              "Can't I just have someone watch for me?"
            </h3>
            <p className="text-gray-300">
              Sure. Pay someone $15/hour to watch your 3-hour streams.
              That's $45 per stream. $450/month if you stream 10 times.
              <br />
              <span className="text-blue-400 font-bold">Or pay $19.99 for software that never blinks.</span>
            </p>
          </div>
          
          <div>
            <h3 className="text-xl font-bold mb-3 text-yellow-400">
              "I'll just scroll back through chat after"
            </h3>
            <p className="text-gray-300">
              By then, buyers already bought from someone else.
              <br />
              <span className="text-red-400 font-bold">"Still available?" doesn't wait 20 minutes for an answer.</span>
            </p>
          </div>
          
          <div>
            <h3 className="text-xl font-bold mb-3 text-yellow-400">
              "My chat moves too fast"
            </h3>
            <p className="text-gray-300">
              <span className="text-green-400 font-bold">Exactly.</span> That's why you need this.
              <br />
              DealFlow processes 100 messages/second. Try doing that with your eyes.
            </p>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section id="cta" className="py-20 px-4 bg-gradient-to-b from-black to-gray-900">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-8">You Have Two Options:</h2>
          
          <div className="grid md:grid-cols-2 gap-6 mb-12">
            <div className="bg-red-900/20 rounded-2xl p-6 border border-red-500/30">
              <h3 className="text-xl font-bold mb-4 text-red-400">Option 1: Keep doing it manually</h3>
              <ul className="text-left space-y-2 text-gray-400">
                <li>• Squint at tiny chat text</li>
                <li>• Ask "did anyone want this?"</li>
                <li>• Miss sales every stream</li>
                <li>• Wonder why revenue isn't growing</li>
              </ul>
            </div>
            
            <div className="bg-green-900/20 rounded-2xl p-6 border border-green-500/30">
              <h3 className="text-xl font-bold mb-4 text-green-400">Option 2: Work smarter</h3>
              <ul className="text-left space-y-2 text-gray-300">
                <li>• See every buyer instantly</li>
                <li>• Never miss a sale</li>
                <li>• Make more money</li>
                <li>• Actually enjoy streaming again</li>
              </ul>
            </div>
          </div>
          
          <p className="text-2xl font-bold mb-8 text-blue-400">The choice is obvious.</p>
          
          <Button
            onClick={onStartTrial}
            size="lg"
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:shadow-2xl hover:shadow-purple-500/25 text-xl px-12 py-7 h-auto"
          >
            Start Free Trial - No Card Required
          </Button>
          
          <p className="text-gray-500 mt-8 text-sm">
            P.S. - While you read this page, 3 sellers just missed "I'll take it" messages. 
            <br />
            <span className="text-yellow-400">Don't be number 4.</span>
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 bg-black border-t border-gray-800">
        <div className="max-w-4xl mx-auto">
          <div className="grid md:grid-cols-4 gap-6 text-sm text-gray-400">
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-green-400" />
              <span>Works on all platforms</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-green-400" />
              <span>No app install needed</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-green-400" />
              <span>Cancel anytime</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-green-400" />
              <span>Your data = yours</span>
            </div>
          </div>
          
          <div className="text-center mt-8 text-gray-500">
            <p className="text-xs">
              Built by sellers tired of missing sales • If you sell live, you need this
              <br />
              Because "scroll back later" doesn't work
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
