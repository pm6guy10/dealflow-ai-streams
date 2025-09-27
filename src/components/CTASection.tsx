import { Button } from "@/components/ui/button";

const CTASection = () => {
  return (
    <section className="py-section bg-gradient-to-b from-background to-muted/30">
      <div className="max-w-content mx-auto px-6">
        <div className="bg-gradient-to-r from-primary/5 via-background to-accent/5 rounded-3xl p-12 text-center space-y-8 shadow-premium border border-primary/10">
          <div className="space-y-6">
            <h2 className="text-heading text-foreground">
              Ready to Stop Losing Money in Your Chat?
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Join live streamers who've transformed their follow-up process and increased their revenue per stream.
            </p>
          </div>

          <div className="space-y-4">
            <Button variant="premium" size="hero" className="text-xl px-12 py-4 h-16">
              Start Your 14-Day Free Trial
            </Button>
            <p className="text-sm text-muted-foreground">
              No credit card required. See your ROI in your first stream.
            </p>
          </div>

          {/* Trust Indicators */}
          <div className="pt-8 border-t border-muted space-y-4">
            <div className="flex justify-center items-center gap-8 text-muted-foreground text-sm">
              <div className="flex items-center gap-2">
                <span className="text-accent">✓</span>
                <span>14-day free trial</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-accent">✓</span>
                <span>No setup fees</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-accent">✓</span>
                <span>Cancel anytime</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTASection;