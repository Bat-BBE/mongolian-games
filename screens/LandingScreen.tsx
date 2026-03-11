import Header from "@/components/Header";
import Hero from "@/components/Hero";
import WhatIsSection from "@/components/WhatIsSection";
import HowItWorks from "@/components/HowItWorks";
import Features from "@/components/Features";
import GamesSection from "@/components/GamesSection";
import Footer from "@/components/Footer";

export default function HomePage() {
  return (
    <main>
      <Header />
      <Hero />
      <WhatIsSection />
      <HowItWorks />
      <Features />
      <GamesSection />
      <Footer />
    </main>
  );
}