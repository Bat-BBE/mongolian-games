import HeroActor from '@/components/hero-select/HeroActor';

export default function Home() {
  return (
    <main className="w-screen h-screen">
      <HeroActor 
        autoRotate={true}
        backgroundColor="#0a0a0a"
      />
    </main>
  );
}