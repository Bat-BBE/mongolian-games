"use client";

import { useEffect, useState } from 'react';
import HeroModal from '@/components/HeroModal';
import { useRouter } from 'next/navigation';

export default function RegisterScreen() {
  const [showModal, setShowModal] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setShowModal(true);
  }, []);

  const handleLogin = (playerName: string, heroType: string) => {
    console.log('Logged in:', { playerName, heroType });
    setShowModal(false);
    // router.push('/dashboard');
  };

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="fixed inset-0 overflow-y-auto blur-md scale-[1.02] pointer-events-none brightness-50 z-0">
        <div className="min-h-screen flex items-center justify-center hero-bg">
          <div className="max-w-5xl text-center z-10 px-6">
            <h1 className="font-display text-6xl md:text-8xl lg:text-9xl font-black text-white leading-none tracking-tight mb-6">
              <span className="block">MONGOLIAN</span>
              <span className="text-gradient-gold">TIME</span>
            </h1>
          </div>
        </div>
      </div>
      <HeroModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onLogin={handleLogin}
      />
    </div>
  );
}