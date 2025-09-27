import { Button } from "@/components/ui/button";
import heroImage from "@/assets/hero-dealflow.jpg";

const Hero = () => {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-background via-background to-muted/30">
      <div className="max-w-content mx-auto px-6 py-section">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Content */}
          <div className="space-y-8">
            <div className="space-y-6">
              <h1 className="text-hero text-foreground leading-tight">
                Stop Losing Sales in Your Chat.
              </h1>
              <p className="text-xl text-muted-foreground leading-relaxed max-w-lg">
                DealFlow is your AI sales assistant for live streams. It turns chaotic chat logs into revenue-generating opportunities, automatically.
              </p>
            </div>
            
            <div className="space-y-4">
              <Button variant="premium" size="hero" className="w-full sm:w-auto">
                Start Your 14-Day Free Trial
              </Button>
              <p className="text-sm text-muted-foreground">
                No credit card required. See your ROI in your first stream.
              </p>
            </div>
          </div>

          {/* Hero Image */}
          <div className="relative">
            <div className="relative overflow-hidden rounded-2xl shadow-premium">
              <img 
                src={heroImage} 
                alt="DealFlow AI dashboard transforming live chat into structured sales data"
                className="w-full h-auto object-cover"
              />
            </div>
            {/* Floating elements for visual interest */}
            <div className="absolute -top-4 -right-4 w-20 h-20 bg-primary/10 rounded-full blur-xl"></div>
            <div className="absolute -bottom-6 -left-6 w-32 h-32 bg-accent/10 rounded-full blur-xl"></div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;