import React from 'react';

export default function Navbar() {
  return (
    <nav className="fixed top-0 w-full glass border-b border-primary/10 z-50">
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <span className="text-3xl font-display font-black text-primary tracking-tighter">
            JMT
          </span>
          <div className="h-8 w-px bg-primary/20 mx-2" />
          <span className="font-heritage text-xs tracking-[0.3em] uppercase text-primary/80">
            Journey Through Mongolian Time
          </span>
        </div>
      </div>
    </nav>
  );
}