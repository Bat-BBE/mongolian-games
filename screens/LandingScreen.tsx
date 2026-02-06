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
      <GamesSection />
      {/* <section className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <h2 className="font-display text-4xl font-bold mb-12 text-center text-gradient-gold">
            Interactive 3D Map
          </h2>
          <div className="h-[600px] rounded-3xl overflow-hidden glass">
            <Map3D />
          </div>
        </div>
      </section> */}
      <Features />
      <CTA />
      <Footer />
    </main>
  );
}