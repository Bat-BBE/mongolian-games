"use client";

import React, { useState } from 'react';
import { X, Cloud } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import HeroCard from './HeroCard';

interface HeroModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: (playerName: string, heroType: string) => void;
}

const heroes = [
  {
    id: 1,
    name: "Shikhikhutag",
    title: "The Judge",
    imageUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuBN1zFT6L8i3Yf5A5uZOyAfGIcwjio6h-in5xePSGBWb4Xa1CfRutgVZ8ZVt05B70PjdPypiONl2l30uDXl3dsmn4FpW91OhpkGzVBCgkoqFZlVqW75bS5uRK2LtrOfyLTXaZbnh6-YHRnWCKeaKGwxBk22tqMDr8mypGRkXQruWQwgyi-kPQK8fNmxje9v7TiosQVfs_tKVr_a7UHlAtAZTn5ijPm-ar9zpoCdZbaN0wBSu0_k_locWH4y2pDBi_R8Bx7Xe9-TfzgY",
    available: true,
  },
  {
    id: 2,
    name: "Tatatunga",
    title: "The Scribe",
    imageUrl: "",
    icon: "edit_note",
    available: false,
  },
  {
    id: 3,
    name: "Subutai",
    title: "The General",
    imageUrl: "",
    icon: "shield",
    available: false,
  },
  {
    id: 4,
    name: "Rashid-al-Din",
    title: "The Historian",
    imageUrl: "",
    icon: "menu_book",
    available: false,
  },
];

export default function HeroModal({ isOpen, onClose, onLogin }: HeroModalProps) {
  const [playerName, setPlayerName] = useState('');
  const [selectedHero, setSelectedHero] = useState(1);

  const handleGoogleLogin = () => {
    if (playerName.trim()) {
      const hero = heroes.find(h => h.id === selectedHero);
      onLogin(playerName, hero?.name || 'Shikhikhutag');
    }
  };

  const handleGuestLogin = () => {
    const hero = heroes.find(h => h.id === selectedHero);
    onLogin(playerName || 'Guest', hero?.name || 'Shikhikhutag');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl glass rounded-[2.5rem] border border-primary/30 overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.8)]">
        {/* Background effects */}
        <div className="absolute top-0 left-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-32 h-32 bg-accent-red/5 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />

        <div className="p-8 md:p-12 relative z-10">
          {/* Header */}
          <div className="text-center mb-10">
            <h2 className="font-display text-4xl font-bold mb-2 tracking-wide text-white">
              Enter the Realm
            </h2>
            <div className="h-0.5 w-16 bg-gradient-to-r from-transparent via-primary to-transparent mx-auto" />
          </div>

          {/* Player Name Input */}
          <div className="mb-10">
            <label className="block text-xs font-bold uppercase tracking-[0.2em] text-primary/80 mb-4 ml-1">
              Identity of the Hero
            </label>
            <Input
              placeholder="Enter Player Name..."
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-white placeholder:text-slate-600 focus:border-primary/50 focus:ring-1 focus:ring-primary/30 font-heritage text-lg h-14"
            />
          </div>

          {/* Hero Selection */}
          <div className="mb-10">
            <label className="block text-xs font-bold uppercase tracking-[0.2em] text-primary/80 mb-6 ml-1">
              Choose Your Archetype
            </label>
            <div className="hero-carousel flex gap-4 overflow-x-auto pb-6 -mx-2 px-2 snap-x">
              {heroes.map((hero) => (
                <HeroCard
                  key={hero.id}
                  name={hero.name}
                  title={hero.title}
                  imageUrl={hero.imageUrl}
                  selected={selectedHero === hero.id}
                  locked={!hero.available}
                  icon={hero.icon}
                  onClick={() => hero.available && setSelectedHero(hero.id)}
                />
              ))}
            </div>
          </div>

          {/* Buttons */}
          <div className="flex flex-col gap-4">
            <Button
              onClick={handleGoogleLogin}
              className="w-full py-5 bg-primary text-black font-black text-sm uppercase tracking-[0.2em] rounded-2xl hover:bg-white shadow-[0_10px_30px_rgba(212,175,55,0.3)] h-14"
            >
              Play with Google
            </Button>
            
            <Button
              onClick={handleGuestLogin}
              variant="outline"
              className="w-full py-5 bg-white/5 border border-white/10 text-slate-300 font-bold text-sm uppercase tracking-[0.2em] rounded-2xl hover:bg-white/10 h-14"
            >
              Continue as Guest
            </Button>
          </div>

          {/* Save Progress Info */}
          <div className="mt-8 flex items-center justify-center gap-2 text-slate-500">
            <Cloud className="h-4 w-4" />
            <p className="text-[10px] uppercase tracking-widest">
              Your progress and high scores will be automatically saved
            </p>
          </div>
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 text-slate-500 hover:text-white transition-colors"
        >
          <X className="h-6 w-6" />
        </button>
      </div>
    </div>
  );
}