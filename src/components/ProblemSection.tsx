import problemIcons from "@/assets/problem-icons.jpg";

const ProblemSection = () => {
  return (
    <section className="py-section bg-muted/20">
      <div className="max-w-content mx-auto px-6">
        <div className="text-center space-y-16">
          {/* Section Header */}
          <div className="space-y-6">
            <h2 className="text-heading text-foreground">
              The Post-Show Nightmare
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Right now, you're doing it the hard way
            </p>
          </div>

          {/* Problem Icons */}
          <div className="relative">
            <img 
              src={problemIcons} 
              alt="Manual work problems: spreadsheets, notepads, and time waste"
              className="w-full max-w-4xl mx-auto rounded-xl shadow-card"
            />
          </div>

          {/* Problem Points */}
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="space-y-4 text-center">
              <div className="w-12 h-12 bg-destructive/10 rounded-lg flex items-center justify-center mx-auto">
                <span className="text-destructive text-xl font-bold">$</span>
              </div>
              <h3 className="text-subheading text-foreground">Hiring Assistants</h3>
              <p className="text-muted-foreground leading-relaxed">
                Paying someone $15/hour to manually log questions and bids.
              </p>
            </div>

            <div className="space-y-4 text-center">
              <div className="w-12 h-12 bg-destructive/10 rounded-lg flex items-center justify-center mx-auto">
                <span className="text-destructive text-xl font-bold">?</span>
              </div>
              <h3 className="text-subheading text-foreground">Relying on Memory</h3>
              <p className="text-muted-foreground leading-relaxed">
                Missing personalized upsells and forgetting crucial follow-ups.
              </p>
            </div>

            <div className="space-y-4 text-center">
              <div className="w-12 h-12 bg-destructive/10 rounded-lg flex items-center justify-center mx-auto">
                <span className="text-destructive text-xl font-bold">⏰</span>
              </div>
              <h3 className="text-subheading text-foreground">Wasting Hours</h3>
              <p className="text-muted-foreground leading-relaxed">
                Drowning in messy spreadsheets and platform analytics that arrive too late.
              </p>
            </div>
          </div>

          <div className="bg-destructive/5 border-l-4 border-destructive rounded-lg p-6 max-w-3xl mx-auto">
            <p className="text-lg font-medium text-foreground">
              You're leaving money on the table because you can't track context at scale.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ProblemSection;