import { CheckCheckIcon } from "lucide-react";
export default function Features() {
  const features = [
    "Learn Mongolian culture",
    "Develop logic & skill", 
    "Discover traditions"
  ];

  return (
    <section className="py-24 px-6 bg-[#07090C] border-y border-white/5">
      <div className="max-w-7xl mx-auto">
        <div className="grid md:grid-cols-3 gap-12">
          {features.map((feature, index) => (
            <div key={index} className="flex items-center gap-6">
              <span className="material-symbols-outlined text-5xl text-emerald-500 font-black">
                <CheckCheckIcon/>
              </span>
              <span className="font-display text-xl font-semibold">{feature}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}