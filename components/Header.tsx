"use client";

import { Button } from "@/components/ui/button";
import { ModeToggle } from "./ui/mode-toggle";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function Header() {
  const router = useRouter();

  const handleGameClick = () => {
    router.push("/register");
  };

  return (
    <header className="fixed top-0 w-full z-50 bg-gray-900/90 backdrop-blur-md border-b border-primary/10 px-6 py-4 flex justify-between items-center">
      <Link href="/" className="flex items-center space-x-4 hover:opacity-80 transition-opacity">
        <span className="text-2xl font-display text-primary font-black">MTGA</span>
        <span className="hidden lg:block font-heritage text-base text-primary/80">
          Mongolian Traditional Games Adventure
        </span>
      </Link>
      
      <div className="flex items-center gap-4">
        <Button 
          className="bg-primary hover:bg-primary-dark text-black font-bold px-6"
          onClick={handleGameClick}
        >
          PLAY NOW
        </Button>
        
        <ModeToggle />
      </div>
    </header>
  );
}