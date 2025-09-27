const BenefitsSection = () => {
  const benefits = [
    {
      title: "Replace Your Manual Chat Logger",
      feature: "Silent Context Capture",
      value: "DealFlow acts as your dedicated assistant, logging every question, objection, and custom request.",
      roi: "Save over $15 per hour",
      icon: "📝"
    },
    {
      title: "Never Miss a Follow-Up Again", 
      feature: "Discrepancy Detection",
      value: "Automatically generates a task list of missed opportunities, like a buyer who asked for a bundle but never checked out.",
      roi: "Recover lost sales",
      icon: "🎯"
    },
    {
      title: "Eliminate Post-Show Admin",
      feature: "Structured CRM Export", 
      value: "Turns a 4-hour raw chat log into a 1-minute, perfectly formatted data export for your CRM or email list.",
      roi: "Reclaim your time and end burnout",
      icon: "⚡"
    }
  ];

  return (
    <section className="py-section bg-muted/20">
      <div className="max-w-content mx-auto px-6">
        <div className="space-y-16">
          {/* Section Header */}
          <div className="text-center space-y-6">
            <h2 className="text-heading text-foreground">
              Direct Financial Impact
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Every feature is designed around measurable ROI for your live streaming business
            </p>
          </div>

          {/* Benefits Grid */}
          <div className="grid lg:grid-cols-3 gap-8">
            {benefits.map((benefit, index) => (
              <div 
                key={index}
                className="bg-card rounded-2xl p-8 shadow-card hover:shadow-premium transition-all duration-300 hover:-translate-y-1"
              >
                <div className="space-y-6">
                  {/* Icon */}
                  <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center text-2xl">
                    {benefit.icon}
                  </div>

                  {/* Title */}
                  <div className="space-y-2">
                    <h3 className="text-subheading text-foreground">
                      {benefit.title}
                    </h3>
                    <p className="text-sm font-medium text-primary bg-primary/10 px-3 py-1 rounded-full inline-block">
                      {benefit.feature}
                    </p>
                  </div>

                  {/* Value Description */}
                  <p className="text-muted-foreground leading-relaxed">
                    {benefit.value}
                  </p>

                  {/* ROI Highlight */}
                  <div className="bg-accent-light border-l-4 border-accent rounded-lg p-4">
                    <p className="font-semibold text-accent text-sm">
                      ROI: {benefit.roi}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default BenefitsSection;