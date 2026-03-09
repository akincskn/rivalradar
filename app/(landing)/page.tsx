import { Hero } from "@/components/landing/Hero";
import { Features } from "@/components/landing/Features";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { Pricing } from "@/components/landing/Pricing";
import { Footer } from "@/components/landing/Footer";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "RivalRadar — AI Competitor Analysis in 60 Seconds",
  description:
    "Enter your company and sector. AI finds your competitors, compares pricing, builds a SWOT analysis, and delivers strategic recommendations in 60 seconds.",
};

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-background">
      <Hero />
      <Features />
      <HowItWorks />
      <Pricing />
      <Footer />
    </main>
  );
}
