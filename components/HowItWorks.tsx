export default function HowItWorks() {
  const steps = [
    { number: "1", title: "Choose Hero", description: "Select your archetype and special abilities." },
    { number: "2", title: "Travel Örtöö Map", description: "Explore relay stations on the interactive 3D map." },
    { number: "3", title: "Play & Collect", description: "Master mini-games and earn your reputation." }
  ];

  return (
    <section className="py-24 px-6 relative bg-[#07090C]" id="how-it-works">
      <div className="max-w-7xl mx-auto relative">
        <div className="text-center mb-16">
          <h2 className="font-display text-4xl font-bold text-gradient-gold uppercase tracking-widest">
            How It Works
          </h2>
        </div>
        
        <div className="relative">
          <div className="hidden md:block absolute top-1/2 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-primary to-transparent -translate-y-1/2"></div>
          
          <div className="grid md:grid-cols-3 gap-12 relative z-10">
            {steps.map((step, index) => (
              <div key={index} className="text-center">
                <div className="w-16 h-16 rounded-full bg-slate-900 border-2 border-primary flex items-center justify-center mx-auto mb-6 font-display text-2xl font-bold text-primary">
                  {step.number}
                </div>
                <h4 className="font-display text-xl mb-2">{step.title}</h4>
                <p className="text-slate-500 text-sm">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}