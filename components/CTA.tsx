import { CheckCheckIcon } from "lucide-react";
export default function CTA() {
  return (
    <section className="py-40 px-6 text-center relative overflow-hidden bg-[#050608]">
      <div className="absolute inset-0 bg-gradient-to-t from-[#8B0000]/20 to-transparent pointer-events-none"></div>
      <div className="max-w-4xl mx-auto relative z-10">
        <h2 className="font-display text-5xl md:text-7xl font-black mb-12 leading-tight">
          Start Your Mongolian<br/>
          Adventure Today
        </h2>
        <button className="group relative px-16 py-8 bg-white text-black font-black text-xl rounded-full hover:scale-110 transition-transform shadow-[0_20px_60px_rgba(212,175,55,0.2)] flex items-center gap-4 mx-auto">
          <span className="material-symbols-outlined text-3xl"></span>
          <span>Start Playing</span>
        </button>
        <p className="mt-12 text-slate-500 uppercase tracking-[0.5em] text-[10px] font-bold">
          Free access for beta explorers
        </p>
      </div>
    </section>
  );
}