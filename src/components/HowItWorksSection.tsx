const HowItWorksSection = () => {
  const steps = [
    {
      number: "01",
      title: "Connect",
      description: "Link your live stream chat.",
      icon: "🔗"
    },
    {
      number: "02", 
      title: "Capture",
      description: "DealFlow's AI silently analyzes the conversation in real-time.",
      icon: "🤖"
    },
    {
      number: "03",
      title: "Convert", 
      description: "Receive a structured, actionable sales report the second your stream ends.",
      icon: "📊"
    }
  ];

  return (
    <section className="py-section bg-background">
      <div className="max-w-content mx-auto px-6">
        <div className="space-y-16">
          {/* Section Header */}
          <div className="text-center space-y-6">
            <h2 className="text-heading text-foreground">
              How It Works
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Three simple steps to transform your live streaming revenue
            </p>
          </div>

          {/* Steps */}
          <div className="relative">
            {/* Connection Lines */}
            <div className="hidden lg:block absolute top-24 left-1/2 transform -translate-x-1/2 w-full max-w-4xl">
              <div className="flex justify-between items-center px-32">
                <div className="w-32 h-0.5 bg-primary/30"></div>
                <div className="w-32 h-0.5 bg-primary/30"></div>
              </div>
            </div>

            <div className="grid lg:grid-cols-3 gap-12">
              {steps.map((step, index) => (
                <div key={index} className="text-center space-y-6">
                  {/* Step Number */}
                  <div className="relative">
                    <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mx-auto shadow-button">
                      <span className="text-2xl">{step.icon}</span>
                    </div>
                    <div className="absolute -top-2 -right-2 w-8 h-8 bg-accent text-accent-foreground rounded-full flex items-center justify-center text-sm font-bold">
                      {step.number}
                    </div>
                  </div>

                  {/* Step Content */}
                  <div className="space-y-3">
                    <h3 className="text-subheading text-foreground">
                      {step.title}
                    </h3>
                    <p className="text-muted-foreground leading-relaxed max-w-xs mx-auto">
                      {step.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;