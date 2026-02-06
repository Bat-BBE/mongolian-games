export default function Footer() {
  return (
    <footer className="bg-[#050608] border-t border-white/5 py-12 px-6">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
        <div className="flex items-center space-x-3">
          <span className="text-2xl font-display font-black text-primary tracking-tighter">
            MTGA
          </span>
          <div className="h-6 w-px bg-primary/20 mx-2"></div>
          <span className="font-heritage text-[10px] tracking-[0.3em] uppercase text-primary/80">
            Mongolian Heritage Platform
          </span>
        </div>
        
        <div className="flex gap-10 text-[10px] text-slate-500 uppercase tracking-widest font-bold">
          <a href="#" className="hover:text-primary transition-colors">History</a>
          <a href="#" className="hover:text-primary transition-colors">Privacy</a>
          <a href="#" className="hover:text-primary transition-colors">Support</a>
        </div>
        
        <p className="text-[10px] text-slate-600 uppercase tracking-widest">
          © 2024 MTGA Studios
        </p>
      </div>
    </footer>
  );
}