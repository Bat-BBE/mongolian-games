import Header from "@/components/Header";
import Hero from "@/components/Hero";
import WhatIsSection from "@/components/WhatIsSection";
import HowItWorks from "@/components/HowItWorks";
import GamesSection from "@/components/GamesSection";
import Features from "@/components/Features";
import CTA from "@/components/CTA";
import Footer from "@/components/Footer";
import Map3D from "@/components/Map3D";

export default function HomePage() {
  return (
    <main>
      <Header />
      <Hero />
      <WhatIsSection />
      <HowItWorks />
      <Features />
      <GamesSection />
      {/* <CTA /> */}
      <Footer />
    </main>
  );
}