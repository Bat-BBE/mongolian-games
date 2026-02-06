import { GamepadIcon } from "lucide-react";
export default function WhatIsSection() {
  const features = [
    {
      icon: GamepadIcon,
      title: "Play Traditional Games",
      description: "Master 3D physics-based challenges from the heart of the steppe."
    },
    {
      icon: GamepadIcon,
      title: "Travel through Örtöö stations",
      description: "Navigate the historic relay system across vast landscapes."
    },
    {
      icon: GamepadIcon,
      title: "Earn cultural rewards & badges",
      description: "Collect unique digital artifacts and unlock hero achievements."
    }
  ];

  return (
    <section className="py-24 px-6 bg-[#050608]" id="what-is">
      <div className="max-w-7xl mx-auto">
        <div className="grid md:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div 
              key={index}
              className="glass p-10 rounded-[2.5rem] text-center hover:border-primary/40 transition-all group"
            >
              <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-4xl text-primary">
                  <GamepadIcon/>
                </span>
              </div>
              <h3 className="font-display text-2xl font-bold mb-3">{feature.title}</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}