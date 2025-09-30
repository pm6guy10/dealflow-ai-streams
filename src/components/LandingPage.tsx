import React, { useState, useEffect } from 'react';
import { Check } from 'lucide-react';

interface LandingPageProps {
  onStartTrial: () => void;
}

export default function LandingPage({ onStartTrial }: LandingPageProps) {
  const [missedSales, setMissedSales] = useState(387420);
  const [demoChat, setDemoChat] = useState('');
  const [demoResults, setDemoResults] = useState<{
    buyers: number;
    questions: number;
    revenue: number;
  } | null>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setMissedSales(prev => prev + Math.floor(Math.random() * 21) + 1);
    }, 5500);
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
          <h2 className="text-2xl md:text-3xl text-blue-600 font-semibold mb-6">Meet DealFlow, Your New AI Co-Host.</h2>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            It doesn't just find buyers in your chat. It instantly <span className="font-bold">catches</span> their claim, <span className="font-bold">confirms</span> their spot, and <span className="font-bold">queues</span> the sale for you—all in milliseconds.
          </p>
          <button 
            onClick={() => document.getElementById('demo')?.scrollIntoView({ behavior: 'smooth' })}
            className="bg-blue-600 hover:bg-blue-700 text-white text-lg font-semibold py-4 px-8 rounded-lg shadow-lg transition-all transform hover:scale-105"
          >
            See Your AI Co-Host in Action
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
              <div className="text-sm opacity-75 uppercase tracking-wider">Recovered By Sellers This Month</div>
            </div>
            <div className="hidden md:block text-gray-600">|</div>
            <div>
              <div className="text-2xl font-bold text-green-400">Up to 67% Sales Lift</div>
              <div className="text-sm opacity-75 uppercase tracking-wider">With an AI Co-Host</div>
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
            Stop Finding Problems. Start Closing Sales.
          </h2>
          <p className="text-center text-gray-600 mb-12">
            This is a real chat transcript. Click below to see how an AI Co-Host turns chaos into closed deals.
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
                
                <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-6 border border-green-200">
                  <h3 className="font-bold text-lg mb-4 text-gray-800">✅ Co-Host Analysis: Sale Secured</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                    <p className="text-gray-700"><span className="font-bold text-green-600">CAUGHT:</span> 2 buying signals ("I'll take it", "SOLD!!").</p>
                    <p className="text-gray-700"><span className="font-bold text-blue-600">CONFIRMED:</span> Auto-replied to @katie & @buyer123.</p>
                    <p className="text-gray-700"><span className="font-bold text-purple-600">QUEUED:</span> Both sales added to your dashboard.</p>
                    <p className="text-gray-700"><span className="font-bold text-yellow-600">FLAGGED:</span> 1 question for your review.</p>
                  </div>
                  <p className="text-center mt-6 text-gray-800 font-semibold text-lg">
                    You just secured $140 in revenue without lifting a finger.
                  </p>
                </div>
                
                <button
                  onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })}
                  className="w-full mt-6 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition-transform transform hover:scale-105"
                >
                  Get My AI Co-Host Now →
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Secret Sauce Section */}
      <section className="py-20 md:py-24 px-4 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12 tracking-tight">
            The Secret Sauce: Your AI Co-Host in Action
          </h2>
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <div className="text-3xl font-bold text-green-500 mb-2">1. CATCH</div>
              <h3 className="font-semibold text-lg mb-2">Never Miss a Signal</h3>
              <p className="text-gray-600">DealFlow monitors the chat for over 50 buying phrases. A loud alert and a popup on your second screen means you literally can't miss a sale.</p>
            </div>
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <div className="text-3xl font-bold text-blue-500 mb-2">2. CONFIRM</div>
              <h3 className="font-semibold text-lg mb-2">Instantly Secure the Claim</h3>
              <p className="text-gray-600">Your AI Co-Host auto-replies in chat: "Got it, you're first in line!" This locks in the buyer's commitment and prevents you from overselling.</p>
            </div>
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <div className="text-3xl font-bold text-purple-500 mb-2">3. QUEUE</div>
              <h3 className="font-semibold text-lg mb-2">Automate Your Workflow</h3>
              <p className="text-gray-600">The confirmed sale is added to a live dashboard. Username, item, timestamp—all recorded. Export your buyer list post-stream for easy invoicing.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 md:py-24 px-4">
        <div className="max-w-md mx-auto">
          <div className="border border-blue-600 rounded-2xl p-8 text-center shadow-2xl relative">
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-blue-600 text-white px-4 py-1 rounded-full text-sm font-semibold">BEST FOR LAUNCH</div>
            <h3 className="text-2xl font-bold mb-2">One Plan. Unlimited Sales.</h3>
            <p className="text-gray-600 mb-6">Pays for itself in your first recovered sale.</p>
            <div className="text-6xl font-bold my-4">$19<span className="text-4xl text-gray-500">.99</span><span className="text-xl text-gray-500">/mo</span></div>
            
            <ul className="text-left space-y-3 mb-10 text-gray-700">
              <li className="flex items-start gap-3"><Check className="w-5 h-5 mt-0.5 flex-shrink-0 text-blue-500" /><span>Your own AI Co-Host</span></li>
              <li className="flex items-start gap-3"><Check className="w-5 h-5 mt-0.5 flex-shrink-0 text-blue-500" /><span>"Catch, Confirm, Queue" automation</span></li>
              <li className="flex items-start gap-3"><Check className="w-5 h-5 mt-0.5 flex-shrink-0 text-blue-500" /><span>Connects to any live platform</span></li>
              <li className="flex items-start gap-3"><Check className="w-5 h-5 mt-0.5 flex-shrink-0 text-blue-500" /><span>Automated buyer list export</span></li>
              <li className="flex items-start gap-3"><Check className="w-5 h-5 mt-0.5 flex-shrink-0 text-blue-500" /><span>Full access for 14 days, risk-free</span></li>
            </ul>
            
            <button 
              onClick={onStartTrial}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-lg transition-all text-lg transform hover:scale-105"
            >
              Start My 14-Day Free Trial
            </button>
            <p className="font-semibold text-gray-500 mt-4 text-sm">No credit card required. Cancel anytime.</p>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 md:py-24 px-4 bg-gray-50">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12 tracking-tight">Your Questions, Answered</h2>
          <div className="space-y-6">
            <div className="bg-white rounded-lg p-6 border border-gray-200">
              <h3 className="font-semibold text-lg mb-2">Do I need to install anything complex?</h3>
              <p className="text-gray-600">No. DealFlow is a simple browser extension. You open it in a new tab beside your stream. That's it.</p>
            </div>
            <div className="bg-white rounded-lg p-6 border border-gray-200">
              <h3 className="font-semibold text-lg mb-2">How fast will I see results?</h3>
              <p className="text-gray-600">On your very next stream. Most sellers recover the cost of the subscription within the first hour of their first stream with DealFlow running.</p>
            </div>
            <div className="bg-white rounded-lg p-6 border border-gray-200">
              <h3 className="font-semibold text-lg mb-2">What happens if I oversell an item?</h3>
              <p className="text-gray-600">Your AI Co-Host prevents this. The "Confirm & Queue" system works on a first-come, first-served basis, automatically securing the item for the first claimant and letting others know they're next in line.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-6 tracking-tighter">
            You're One Stream Away From 67% Higher Sales.
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Stop leaving money on the table. Let your AI Co-Host handle the chaos.
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
