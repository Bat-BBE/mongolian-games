import { Button } from "@/components/ui/button";

export default function Hero() {
  return (
    <section className="h-screen relative flex items-center justify-center bg-cover bg-center hero-bg">
      <div className="text-center z-10 px-6">
        <h1 className="font-display text-6xl md:text-8xl font-black text-white mb-4">
          MONGOLIAN <br />
          <span className="text-gradient-gold">TRADITIONAL GAMES</span>
        </h1>
        <p className="text-slate-300 max-w-2xl mx-auto mb-8 font-heritage">
          Embark on a 3D journey through Mongolia’s heritage.
        </p>
        <Button size={"lg"} className="bg-primary hover:bg-yellow-700 text-2xl px-4 px-10">Play</Button>
      </div>
    </section>
  );
}
