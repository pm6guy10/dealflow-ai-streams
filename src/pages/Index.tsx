import Header from "@/components/Header";
import Hero from "@/components/Hero";
import ProblemSection from "@/components/ProblemSection";
import SolutionSection from "@/components/SolutionSection";
import BenefitsSection from "@/components/BenefitsSection";
import HowItWorksSection from "@/components/HowItWorksSection";
import CTASection from "@/components/CTASection";
import { useEffect } from "react";

const Index = () => {
  useEffect(() => {
    // Update page title and meta description for SEO
    document.title = "DealFlow - AI Sales Assistant for Live Stream Sellers | Turn Chat Into Revenue";
    
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', 'DealFlow transforms chaotic live stream chats into revenue opportunities. AI-powered sales assistant for Whatnot & TikTok Shop sellers. 14-day free trial.');
    }
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <Hero />
        <ProblemSection />
        <SolutionSection />
        <BenefitsSection />
        <HowItWorksSection />
        <CTASection />
      </main>
    </div>
  );
};

export default Index;
