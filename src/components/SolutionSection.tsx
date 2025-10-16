import solutionUI from "@/assets/solution-ui.jpg";

const SolutionSection = () => {
  return (
    <section className="py-section bg-background">
      <div className="max-w-content mx-auto px-6">
        <div className="space-y-16">
          {/* Section Header */}
          <div className="text-center space-y-6">
            <h2 className="text-heading text-foreground">
              Your $99.99/mo AI Assistant
            </h2>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              DealFlow silently captures every critical moment of your live sale and transforms it into your competitive advantage. It's the memory and context you need, without the manual work.
            </p>
          </div>

          {/* Solution UI Mockup */}
          <div className="relative">
            <div className="relative overflow-hidden rounded-2xl shadow-premium bg-gradient-to-br from-primary-light to-background p-1">
              <img 
                src={solutionUI} 
                alt="DealFlow dashboard showing structured live stream analytics and customer insights"
                className="w-full h-auto object-cover rounded-xl"
              />
            </div>
          </div>

          {/* Value Proposition */}
          <div className="bg-gradient-to-r from-primary-light to-accent-light rounded-2xl p-8 text-center">
            <h3 className="text-subheading text-foreground mb-4">
              This isn't a chatbot. It's your new Deal Flow Engine.
            </h3>
          </div>
        </div>
      </div>
    </section>
  );
};

export default SolutionSection;