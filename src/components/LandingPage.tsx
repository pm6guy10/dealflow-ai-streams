import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Brain, DollarSign, AlertCircle, ArrowRight, CheckCircle, Timer } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

interface LandingPageProps {
  onStartTrial: () => void;
}

export default function LandingPage({ onStartTrial }: LandingPageProps) {
  const { toast } = useToast();
  const [missedRevenue, setMissedRevenue] = useState(47892);
  const [demoText, setDemoText] = useState('');
  const [demoResults, setDemoResults] = useState<any>(null);

  // Live counter that increases
  useEffect(() => {
    const interval = setInterval(() => {
      setMissedRevenue(prev => prev + Math.floor(Math.random() * 5) + 2);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const analyzeDemoChat = () => {
    const lines = demoText.split('\n').filter(l => l.trim());
    const hotLeads: any[] = [];
    const questions: any[] = [];
    let totalValue = 0;

    lines.forEach(line => {
      const buyPattern = /\b(i'll take|sold|buy|want|mine|dibs)\b/i;
      const questionPattern = /\b(how much|price|cost|ship|available)\b/i;

      if (buyPattern.test(line)) {
        hotLeads.push(line);
        totalValue += 50;
      } else if (questionPattern.test(line)) {
        questions.push(line);
        totalValue += 30;
      }
    });

    setDemoResults({
      hotLeads: hotLeads.length,
      questions: questions.length,
      totalValue,
      messagesAnalyzed: lines.length
    });

    toast({
      title: "Analysis Complete!",
      description: `Found ${hotLeads.length} hot buyers and $${totalValue} in potential revenue`,
    });
  };

  const loadSample = () => {
    const sample = `@katie_shops: I'll take the blue hoodie!
@sarah_style: how much for shipping to NY?
@buyer_mike: SOLD on the sneakers!
@anna_fashion: is the jacket still available?
@shopaholic: want both the earrings and necklace
@trendy_buyer: price on the bundle?`;
    setDemoText(sample);
    setTimeout(() => analyzeDemoChat(), 500);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-content mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary-hover flex items-center justify-center">
              <Brain className="w-6 h-6 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">DealFlow</h1>
          </div>
          <Button 
            onClick={onStartTrial}
            className="bg-primary hover:bg-primary-hover"
          >
            Start Free Trial
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-6">
        <div className="max-w-content mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 text-foreground">
            Still Squinting at Chat<br />While Selling? 🤦
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-3xl mx-auto">
            You're losing $30-50 every time you miss a buyer's message.<br />
            <span className="text-foreground font-semibold">Here's proof.</span>
          </p>

          {/* Live Counter */}
          <div className="bg-card border border-border rounded-2xl p-8 mb-12 max-w-xl mx-auto shadow-card">
            <div className="flex items-center justify-center gap-2 mb-4">
              <AlertCircle className="w-5 h-5 text-destructive" />
              <span className="text-sm text-muted-foreground">Lost Today Across All Platforms</span>
            </div>
            <div className="text-5xl font-bold text-destructive mb-2">
              ${missedRevenue.toLocaleString()}
            </div>
            <div className="text-sm text-muted-foreground">
              in missed chat messages
            </div>
          </div>

          <Button 
            size="lg"
            onClick={onStartTrial}
            className="bg-primary hover:bg-primary-hover shadow-button"
          >
            See Your Missed Sales →
          </Button>
          <p className="text-sm text-muted-foreground mt-3">
            Takes 10 seconds. No credit card.
          </p>
        </div>
      </section>

      {/* Demo Section */}
      <section className="py-16 px-6 bg-muted/30">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4 text-foreground">
              See What You're Missing
            </h2>
            <p className="text-xl text-muted-foreground">
              Paste any chat. Watch the money appear.
            </p>
          </div>

          <div className="bg-card border border-border rounded-2xl p-8 shadow-card">
            <Textarea
              placeholder="Paste your stream chat here...

@katie: I'll take the blue one
@mike: how much for shipping?
@anna: is this available?"
              value={demoText}
              onChange={(e) => setDemoText(e.target.value)}
              className="min-h-[200px] mb-4 font-mono text-sm"
            />
            
            <div className="flex gap-3">
              <Button 
                onClick={analyzeDemoChat}
                disabled={!demoText.trim()}
                className="flex-1 bg-primary hover:bg-primary-hover"
              >
                Analyze Chat
              </Button>
              <Button 
                onClick={loadSample}
                variant="outline"
                className="flex-1"
              >
                Try Sample Chat
              </Button>
            </div>

            {demoResults && (
              <div className="mt-8 space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-destructive/10 border border-destructive/30 rounded-xl p-4 text-center">
                    <div className="text-3xl font-bold text-destructive mb-1">
                      {demoResults.hotLeads}
                    </div>
                    <div className="text-sm text-muted-foreground">Hot Buyers</div>
                  </div>
                  <div className="bg-primary/10 border border-primary/30 rounded-xl p-4 text-center">
                    <div className="text-3xl font-bold text-primary mb-1">
                      {demoResults.questions}
                    </div>
                    <div className="text-sm text-muted-foreground">Questions</div>
                  </div>
                  <div className="bg-accent/10 border border-accent/30 rounded-xl p-4 text-center">
                    <div className="text-3xl font-bold text-accent mb-1">
                      ${demoResults.totalValue}
                    </div>
                    <div className="text-sm text-muted-foreground">Potential</div>
                  </div>
                </div>
                
                <div className="bg-destructive/10 border border-destructive/30 rounded-xl p-6">
                  <p className="text-lg font-semibold text-foreground mb-2">
                    💡 You just found <span className="text-destructive">${demoResults.totalValue}</span> in one stream
                  </p>
                  <p className="text-muted-foreground">
                    The average seller misses 12 buyers per stream. That's $400+ walking away while you're looking at your products.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Problem Section */}
      <section className="py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4 text-foreground">
              The Brutal Truth About Live Selling
            </h2>
            <p className="text-xl text-muted-foreground">
              You can't do both.
            </p>
          </div>

          <div className="bg-card border border-border rounded-2xl p-8 mb-8 shadow-card">
            <p className="text-lg text-muted-foreground mb-6">
              Either you're showing products OR you're reading chat. Never both.
            </p>
            <p className="text-lg text-muted-foreground mb-6">
              While you're holding up that jacket, explaining the details, making it look good...
            </p>
            
            <div className="space-y-3 mb-6">
              <div className="flex items-center gap-3 text-muted-foreground">
                <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0" />
                <span>@katie_shops just said "I'll take it!" <span className="text-destructive">(missed)</span></span>
              </div>
              <div className="flex items-center gap-3 text-muted-foreground">
                <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0" />
                <span>@buyernow asked "ship to NY?" <span className="text-destructive">(missed)</span></span>
              </div>
              <div className="flex items-center gap-3 text-muted-foreground">
                <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0" />
                <span>@sarah wrote "SOLD!" three times <span className="text-destructive">(missed)</span></span>
              </div>
            </div>

            <div className="bg-destructive/10 border border-destructive/30 rounded-xl p-6">
              <p className="text-lg font-semibold text-foreground">
                Each missed message = $30-50 gone.
              </p>
              <p className="text-muted-foreground mt-2">
                Do 3 streams a week? You're losing $400-900/month.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Solution Section */}
      <section className="py-16 px-6 bg-muted/30">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4 text-foreground">
              Finally. A Second Set of Eyes.
            </h2>
            <p className="text-xl text-muted-foreground">
              DealFlow watches chat so you don't have to.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 mb-12">
            <div className="bg-card border border-border rounded-xl p-6 shadow-card">
              <div className="w-12 h-12 bg-destructive/10 rounded-lg flex items-center justify-center mb-4">
                <AlertCircle className="w-6 h-6 text-destructive" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-foreground">Instant Alerts</h3>
              <p className="text-muted-foreground">
                Big red banner when someone wants to buy. Never miss "I'll take it!" again.
              </p>
            </div>

            <div className="bg-card border border-border rounded-xl p-6 shadow-card">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <Brain className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-foreground">Smart Filtering</h3>
              <p className="text-muted-foreground">
                Ignores "nice stream" spam, catches "SOLD!" and price questions.
              </p>
            </div>

            <div className="bg-card border border-border rounded-xl p-6 shadow-card">
              <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center mb-4">
                <DollarSign className="w-6 h-6 text-accent" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-foreground">Revenue Tracking</h3>
              <p className="text-muted-foreground">
                Shows exactly how much each message is worth. See your ROI live.
              </p>
            </div>

            <div className="bg-card border border-border rounded-xl p-6 shadow-card">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <Timer className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-foreground">Quick Replies</h3>
              <p className="text-muted-foreground">
                One tap to say "DM sent!" or "Still available!" Auto-generated responses.
              </p>
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl p-8 text-center shadow-card">
            <p className="text-2xl font-bold mb-4 text-foreground">
              Works Everywhere
            </p>
            <p className="text-lg text-muted-foreground mb-6">
              Whatnot, TikTok, Instagram, anywhere you sell
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <div className="px-4 py-2 bg-muted rounded-lg text-sm font-medium">Whatnot</div>
              <div className="px-4 py-2 bg-muted rounded-lg text-sm font-medium">TikTok</div>
              <div className="px-4 py-2 bg-muted rounded-lg text-sm font-medium">Instagram</div>
              <div className="px-4 py-2 bg-muted rounded-lg text-sm font-medium">Facebook</div>
              <div className="px-4 py-2 bg-muted rounded-lg text-sm font-medium">YouTube</div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-16 px-6">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4 text-foreground">
              Do the Math. This Pays for Itself.
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-8 mb-8">
            <div className="bg-card border border-border rounded-xl p-6">
              <h3 className="text-xl font-bold mb-4 text-muted-foreground">Without DealFlow</h3>
              <ul className="space-y-3">
                <li className="flex items-start gap-2">
                  <span className="text-destructive mt-1">✗</span>
                  <span className="text-muted-foreground">Miss 10+ buyers per stream</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-destructive mt-1">✗</span>
                  <span className="text-muted-foreground">Lose $300-500 per stream</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-destructive mt-1">✗</span>
                  <span className="text-muted-foreground">Buyers go to competitors</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-destructive mt-1">✗</span>
                  <span className="text-muted-foreground">Never know what you missed</span>
                </li>
              </ul>
            </div>

            <div className="bg-accent/10 border border-accent/30 rounded-xl p-6">
              <h3 className="text-xl font-bold mb-4 text-foreground">With DealFlow</h3>
              <ul className="space-y-3">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-accent mt-1 flex-shrink-0" />
                  <span className="text-foreground">Catch every buyer instantly</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-accent mt-1 flex-shrink-0" />
                  <span className="text-foreground">Save ONE sale = pays for itself</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-accent mt-1 flex-shrink-0" />
                  <span className="text-foreground">Follow up with interested viewers</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-accent mt-1 flex-shrink-0" />
                  <span className="text-foreground">See exactly what converts</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="bg-card border-2 border-primary rounded-2xl p-8 text-center shadow-premium">
            <div className="text-5xl font-bold text-foreground mb-2">$19.99</div>
            <div className="text-xl text-muted-foreground mb-6">per month</div>
            <p className="text-lg text-muted-foreground mb-8">
              Less than one missed sale
            </p>
            <Button 
              size="lg"
              onClick={onStartTrial}
              className="w-full bg-primary hover:bg-primary-hover shadow-button"
            >
              Start 14-Day Free Trial
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
            <p className="text-sm text-muted-foreground mt-4">
              No credit card required • Cancel anytime • No setup fees
            </p>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 px-6 bg-primary/5">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-6 text-foreground">
            You Have Two Options
          </h2>
          
          <div className="grid md:grid-cols-2 gap-6 mb-12">
            <div className="bg-card border border-border rounded-xl p-6 text-left">
              <h3 className="text-xl font-bold mb-4 text-muted-foreground">Option 1: Keep Struggling</h3>
              <ul className="space-y-2 text-muted-foreground">
                <li>• Squint at tiny chat text</li>
                <li>• Ask "did anyone want this?"</li>
                <li>• Miss sales every stream</li>
                <li>• Wonder why revenue isn't growing</li>
              </ul>
            </div>

            <div className="bg-accent/10 border-2 border-accent rounded-xl p-6 text-left">
              <h3 className="text-xl font-bold mb-4 text-foreground">Option 2: Work Smarter</h3>
              <ul className="space-y-2 text-foreground">
                <li>✓ See every buyer instantly</li>
                <li>✓ Never miss a sale</li>
                <li>✓ Make more money</li>
                <li>✓ Actually enjoy streaming again</li>
              </ul>
            </div>
          </div>

          <Button 
            size="lg"
            onClick={onStartTrial}
            className="bg-primary hover:bg-primary-hover shadow-button px-12 py-6 text-lg"
          >
            The Choice is Obvious →
          </Button>

          <p className="text-sm text-muted-foreground mt-8">
            P.S. - While you read this page, 3 sellers just missed "I'll take it" messages. Don't be number 4.
          </p>
        </div>
      </section>
    </div>
  );
}
