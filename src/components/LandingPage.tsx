import React, { useState, useEffect } from 'react';
import { Check } from 'lucide-react';

interface LandingPageProps {
  onStartTrial: () => void;
}

export default function LandingPage({ onStartTrial }: LandingPageProps) {
  const [missedSales, setMissedSales] = useState(12847);
  const [demoChat, setDemoChat] = useState('');
  const [demoResults, setDemoResults] = useState<{
    buyers: number;
    questions: number;
    revenue: number;
  } | null>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setMissedSales(prev => prev + Math.floor(Math.random() * 5) + 1);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const runDemo = () => {
    const sample = `@buyer123: I'll take the blue one!
@sarah_shop: how much for shipping?
@mike: is this still available?
@katie: SOLD!! I want it`;
    
    setDemoChat(sample);
    setDemoResults({
      buyers: 2,
      questions: 1,
      revenue: 140
    });
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <header className="bg-gradient-to-b from-gray-50 to-white px-4 py-16 md:py-24">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4 tracking-tighter">
            Your Live Chat is Leaking Money.
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            DealFlow sits beside your stream and instantly flags every "I'll take it!" or "SOLD!" you miss.
          </p>
          <button 
            onClick={() => document.getElementById('demo')?.scrollIntoView({ behavior: 'smooth' })}
            className="bg-blue-600 hover:bg-blue-700 text-white text-lg font-semibold py-4 px-8 rounded-lg shadow-lg transition-all transform hover:scale-105"
          >
            See Exactly How It Works
          </button>
          <p className="text-sm text-gray-500 mt-4">1-click demo • No signup required</p>
        </div>
      </header>

      {/* Social Proof Bar */}
      <section className="bg-gray-900 text-white py-6">
        <div className="max-w-5xl mx-auto px-4">
          <div className="flex flex-wrap justify-center items-center gap-8 md:gap-12 text-center">
            <div>
              <div className="text-2xl font-bold text-yellow-400">
                ${missedSales.toLocaleString()}
              </div>
              <div className="text-sm opacity-75 uppercase tracking-wider">Revenue Recovered Today</div>
            </div>
            <div className="hidden md:block text-gray-600">|</div>
            <div>
              <div className="text-2xl font-bold text-green-400">One Simple Price</div>
              <div className="text-sm opacity-75 uppercase tracking-wider">Pays For Itself Instantly</div>
            </div>
            <div className="hidden md:block text-gray-600">|</div>
            <div>
              <div className="text-2xl font-bold text-blue-400">2 Minutes</div>
              <div className="text-sm opacity-75 uppercase tracking-wider">To Setup</div>
            </div>
          </div>
        </div>
      </section>

      {/* Demo Section */}
      <section id="demo" className="py-20 md:py-24 px-4">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-4 tracking-tight">
            See the Money You're Missing in 1 Click
          </h2>
          <p className="text-center text-gray-600 mb-12">
            This is a real chat transcript from a live sale. Click below to see how much money the seller lost in just 20 seconds.
          </p>
          
          <div className="bg-gray-50 rounded-xl p-6 border border-gray-200 shadow-sm">
            {!demoResults ? (
              <div className="text-center">
                <button
                  onClick={runDemo}
                  className="bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-8 rounded-lg transition-transform transform hover:scale-105"
                >
                  Run Demo Analysis
                </button>
              </div>
            ) : (
              <div>
                <div className="bg-white rounded-lg p-4 mb-6 font-mono text-sm text-gray-600 border border-gray-200">
                  <pre>{demoChat}</pre>
                </div>
                
                <div className="bg-gradient-to-r from-red-50 to-yellow-50 rounded-lg p-6 border border-red-200">
                  <h3 className="font-bold text-lg mb-4 text-gray-800">🚨 Here's What You Missed:</h3>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="text-3xl font-bold text-red-600">{demoResults.buyers}</div>
                      <div className="text-sm text-gray-600 font-medium">Ready Buyers</div>
                    </div>
                    <div>
                      <div className="text-3xl font-bold text-yellow-600">{demoResults.questions}</div>
                      <div className="text-sm text-gray-600 font-medium">Urgent Question</div>
                    </div>
                    <div>
                      <div className="text-3xl font-bold text-green-600">${demoResults.revenue}</div>
                      <div className="text-sm text-gray-600 font-medium">Lost Revenue</div>
                    </div>
                  </div>
                  
                  <p className="text-center mt-6 text-gray-800 font-semibold text-lg">
                    You just left ${demoResults.revenue} on the table.
                  </p>
                </div>
                
                <button
                  onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })}
                  className="w-full mt-6 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition-transform transform hover:scale-105"
                >
                  Stop Missing Sales →
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 md:py-24 px-4 bg-gray-50">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12 tracking-tight">
            Get Paid for Every "SOLD!"
          </h2>
          
          <div className="space-y-8">
            <div className="flex items-center gap-6">
              <div className="flex-shrink-0 w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-xl">1</div>
              <div>
                <h3 className="font-semibold text-lg mb-1">Stream As Usual</h3>
                <p className="text-gray-600">Use your phone and your favorite platform. No changes to your workflow.</p>
              </div>
            </div>
            
            <div className="flex items-center gap-6">
              <div className="flex-shrink-0 w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-xl">2</div>
              <div>
                <h3 className="font-semibold text-lg mb-1">Open DealFlow Beside You</h3>
                <p className="text-gray-600">It runs in a browser on any tablet or laptop, watches your chat, and alerts you.</p>
              </div>
            </div>
            
            <div className="flex items-center gap-6">
              <div className="flex-shrink-0 w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-xl">3</div>
              <div>
                <h3 className="font-semibold text-lg mb-1">Close Every Deal</h3>
                <p className="text-gray-600">Get an unmissable alert for every "I want it!" or "SOLD!". Never miss a sale again.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 md:py-24 px-4">
        <div className="max-w-md mx-auto">
          <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-8 text-white text-center shadow-2xl">
            <h3 className="text-2xl font-bold mb-2">One Plan. Unlimited Sales.</h3>
            <div className="text-6xl font-bold my-4">$19<span className="text-4xl align-top">.99</span></div>
            <p className="text-blue-200 mb-8">per month</p>
            
            <ul className="text-left space-y-3 mb-10 text-blue-50">
              <li className="flex items-start gap-3"><Check className="w-5 h-5 mt-0.5 flex-shrink-0 text-green-400" /><span>Never miss a buying signal again</span></li>
              <li className="flex items-start gap-3"><Check className="w-5 h-5 mt-0.5 flex-shrink-0 text-green-400" /><span>Connects to any live platform (TikTok, Whatnot, IG)</span></li>
              <li className="flex items-start gap-3"><Check className="w-5 h-5 mt-0.5 flex-shrink-0 text-green-400" /><span>Automatically build your customer list</span></li>
              <li className="flex items-start gap-3"><Check className="w-5 h-5 mt-0.5 flex-shrink-0 text-green-400" /><span>Full access for 14 days, risk-free</span></li>
            </ul>
            
            <button 
              onClick={onStartTrial}
              className="w-full bg-white text-blue-600 font-bold py-4 rounded-lg hover:bg-gray-100 transition-all text-lg transform hover:scale-105"
            >
              Start My 14-Day Free Trial
            </button>
            <p className="font-semibold text-white mt-4">No credit card required. Cancel anytime.</p>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 md:py-24 px-4 bg-gray-50">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12 tracking-tight">Frequently Asked Questions</h2>
          <div className="space-y-6">
            <div className="bg-white rounded-lg p-6 border border-gray-200">
              <h3 className="font-semibold text-lg mb-2">Do I need to install anything?</h3>
              <p className="text-gray-600">No. DealFlow runs in your browser. Open it on any device beside your streaming phone.</p>
            </div>
            <div className="bg-white rounded-lg p-6 border border-gray-200">
              <h3 className="font-semibold text-lg mb-2">How fast will I see results?</h3>
              <p className="text-gray-600">On your very next stream. Most sellers recover the $19.99 cost within the first hour.</p>
            </div>
            <div className="bg-white rounded-lg p-6 border border-gray-200">
              <h3 className="font-semibold text-lg mb-2">What platforms does it work with?</h3>
              <p className="text-gray-600">All of them. Whatnot, TikTok Shop, Instagram, Facebook, YouTube... anywhere you sell live.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-6 tracking-tighter">
            You're One Stream Away From Higher Sales.
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Stop guessing and start selling more. It takes 2 minutes to get started.
          </p>
          <button 
            onClick={onStartTrial}
            className="bg-blue-600 hover:bg-blue-700 text-white text-lg font-semibold py-4 px-10 rounded-lg shadow-lg transition-all transform hover:scale-105"
          >
            Start My 14-Day Free Trial
          </button>
          <p className="text-sm text-gray-500 mt-4">
            Risk-Free 14-Day Trial • No Credit Card Needed
          </p>
        </div>
      </section>
    </div>
  );
}
