export default function GamesSection() {
  const games = [
    { name: "Shagai Games", icon: "casino", desc: "Teach physics & probability." },
    { name: "Archery", icon: "target", desc: "Master precision and focus." },
    { name: "Horse Racing", icon: "speed", desc: "Learn endurance and speed." },
    { name: "Festivals", icon: "military_tech", desc: "Community challenges." },
  ];

  return (
    <section className="py-32 px-6" id="games">
      <div className="max-w-7xl mx-auto grid md:grid-cols-2 lg:grid-cols-4 gap-8">
        {games.map((game) => (
          <div key={game.name} className="glass p-8 rounded-3xl glow-hover transition-all">
            <div className="w-14 h-14 mb-6 flex items-center justify-center bg-primary/10 rounded-2xl">
              <span className="material-symbols-outlined text-primary">{game.icon}</span>
            </div>
            <h3 className="font-display text-xl mb-3">{game.name}</h3>
            <p className="text-sm text-slate-400">{game.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
