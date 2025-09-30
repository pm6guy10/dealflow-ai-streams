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
            Your Live Chat is Leaking Money – Fix It with AI That Catches and Closes Sales Instantly
          </h1>
          <p className="text-xl text-gray-600 mb-2 max-w-2xl mx-auto font-semibold">
            DealFlow: Your AI Co-Host for Live Sales
          </p>
          <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
            Instantly flags, confirms, and queues every "SOLD!" or "I'll take it!" – even when chat scrolls too fast. No more missed buyers, oversold items, or lost revenue.
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
                  $387,420
                </div>
                <div className="text-sm opacity-75 uppercase tracking-wider">Revenue Recovered This Month</div>
                <div className="text-xs opacity-60">Across 500+ Sellers</div>
            </div>
            <div className="hidden md:block text-gray-600">|</div>
            <div>
                <div className="text-2xl font-bold text-green-400">One Simple Price</div>
                <div className="text-sm opacity-75 uppercase tracking-wider">Pays For Itself in Your First Stream</div>
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
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-6 tracking-tight">
            The Money You're Missing – Backed by Data
          </h2>
          <div className="bg-blue-50 rounded-lg p-6 mb-8 border border-blue-200">
            <p className="text-gray-700 mb-4">
              Live shopping crushes traditional e-commerce with conversion rates up to <strong>30%</strong> (vs. just 2-3% for standard online stores). But without automation, sellers miss <strong>20-40% of buying signals</strong> due to fast-scrolling chats and multitasking.
            </p>
            <p className="text-gray-700">
              AI changes that: Retailers using AI chat responders see sales increase by <strong>67%</strong>, with conversion lifts of <strong>23-70%</strong> across streams. Shoppers engaging with AI are <strong>4x more likely to buy</strong> (12.3% vs 3.1%).
            </p>
          </div>
          <p className="text-center text-gray-600 mb-8 font-medium">
            This is a real transcript from a live sale. See how much the seller lost in just 20 seconds:
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
                    You just left ${demoResults.revenue} on the table. But with DealFlow, every signal gets caught, confirmed, and queued – automatically.
                  </p>
                </div>
                
                <button
                  onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })}
                  className="w-full mt-6 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition-transform transform hover:scale-105"
                >
                  Stop Missing Sales → Start Closing Them All
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 md:py-24 px-4 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12 tracking-tight">
            How DealFlow Turns Alerts into Actual Sales
          </h2>
          
          <div className="space-y-8">
            <div className="flex items-start gap-6">
              <div className="flex-shrink-0 w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-xl">1</div>
              <div>
                <h3 className="font-semibold text-lg mb-2">Stream As Usual</h3>
                <p className="text-gray-600">Use your phone on TikTok, Instagram, Whatnot, Facebook, YouTube – no changes to your workflow.</p>
              </div>
            </div>
            
            <div className="flex items-start gap-6">
              <div className="flex-shrink-0 w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-xl">2</div>
              <div>
                <h3 className="font-semibold text-lg mb-2">Open DealFlow Beside You</h3>
                <p className="text-gray-600">Runs in your browser on any laptop or tablet. Watches your chat in real-time via simple integration.</p>
              </div>
            </div>
            
            <div className="flex items-start gap-6">
              <div className="flex-shrink-0 w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-xl">3</div>
              <div>
                <h3 className="font-semibold text-lg mb-2">Catch, Confirm, and Close Every Deal</h3>
                <ul className="space-y-2 text-gray-600">
                  <li><strong>Instant Alerts:</strong> Loud sound, popup, and phone notification for every buying signal.</li>
                  <li><strong>Auto-Confirm:</strong> Replies immediately – "Got it @buyer123! You're first in line for the blue one. DM incoming." Prevents overselling by locking the claim.</li>
                  <li><strong>Claims Queue:</strong> Live dashboard shows queued buyers with timestamps, usernames, and items – manage on your second screen without stopping your stream.</li>
                  <li><strong>Post-Stream Follow-Up:</strong> Auto-exports buyer list for easy DMs or emails.</li>
                </ul>
                <p className="text-gray-700 font-medium mt-3">Get an unmissable system that doesn't just detect – it <em>acts</em> to secure the sale.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Data-Backed Results */}
      <section className="py-20 md:py-24 px-4 bg-gradient-to-b from-blue-50 to-white">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-6 tracking-tight">
            Data-Backed Results That'll Make You Say "Holy Crap"
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <div className="text-4xl font-bold text-blue-600 mb-2">67%</div>
              <p className="text-gray-700"><strong>More Sales Per Stream:</strong> AI responders boost revenue like clockwork.</p>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <div className="text-4xl font-bold text-green-600 mb-2">4x</div>
              <p className="text-gray-700"><strong>Higher Conversions:</strong> Engaged buyers convert at 12.3% with AI vs. 3.1% without.</p>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <div className="text-4xl font-bold text-yellow-600 mb-2">$8:$1</div>
              <p className="text-gray-700"><strong>ROI:</strong> Automation pays off fast – most sellers recover costs in hour 1.</p>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <div className="text-4xl font-bold text-purple-600 mb-2">$3,847</div>
              <p className="text-gray-700"><strong>Average Weekly Recovery:</strong> From caught signals, based on 500+ live sellers.</p>
            </div>
          </div>
          <p className="text-center text-gray-600 mt-8 text-lg">
            See your dashboard light up with recovered revenue – that's the "take my money" moment.
          </p>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 md:py-24 px-4">
        <div className="max-w-md mx-auto">
          <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-8 text-white text-center shadow-2xl">
            <h3 className="text-2xl font-bold mb-2">One Plan. Unlimited Sales.</h3>
            <div className="text-6xl font-bold my-4">$79<span className="text-3xl align-top">/mo</span></div>
            <p className="text-blue-200 mb-2">or $67/mo billed annually</p>
            <p className="text-blue-300 text-sm mb-8">(save 15%)</p>
            
            <ul className="text-left space-y-3 mb-10 text-blue-50">
              <li className="flex items-start gap-3"><Check className="w-5 h-5 mt-0.5 flex-shrink-0 text-green-400" /><span>Never miss a buying signal again</span></li>
              <li className="flex items-start gap-3"><Check className="w-5 h-5 mt-0.5 flex-shrink-0 text-green-400" /><span>Auto-confirms and queues claims in real-time</span></li>
              <li className="flex items-start gap-3"><Check className="w-5 h-5 mt-0.5 flex-shrink-0 text-green-400" /><span>Connects to any live platform (TikTok Shop, Whatnot, IG, FB, YouTube)</span></li>
              <li className="flex items-start gap-3"><Check className="w-5 h-5 mt-0.5 flex-shrink-0 text-green-400" /><span>Builds your customer list automatically</span></li>
              <li className="flex items-start gap-3"><Check className="w-5 h-5 mt-0.5 flex-shrink-0 text-green-400" /><span>Full access + analytics dashboard</span></li>
              <li className="flex items-start gap-3"><Check className="w-5 h-5 mt-0.5 flex-shrink-0 text-green-400" /><span>14-day free trial, risk-free</span></li>
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
              <p className="text-gray-600">No. DealFlow runs in your browser as a simple extension. Open it beside your streaming device.</p>
            </div>
            <div className="bg-white rounded-lg p-6 border border-gray-200">
              <h3 className="font-semibold text-lg mb-2">How fast will I see results?</h3>
              <p className="text-gray-600">On your very next stream. Sellers recover $79+ in the first hour, with 23-70% conversion boosts.</p>
            </div>
            <div className="bg-white rounded-lg p-6 border border-gray-200">
              <h3 className="font-semibold text-lg mb-2">What platforms does it work with?</h3>
              <p className="text-gray-600">All major ones: Whatnot, TikTok Shop, Instagram, Facebook, YouTube – anywhere you sell live.</p>
            </div>
            <div className="bg-white rounded-lg p-6 border border-gray-200">
              <h3 className="font-semibold text-lg mb-2">What if I oversell items?</h3>
              <p className="text-gray-600">Our claims queue locks first-come-first-served, auto-replies to confirm, and flags duplicates – no more chaos.</p>
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
            Stop guessing and start automating. It takes 2 minutes to get started.
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
