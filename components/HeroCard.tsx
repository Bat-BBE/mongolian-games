import React from 'react';
import { cn } from '@/lib/utils';

interface HeroCardProps {
  name: string;
  title: string;
  imageUrl: string;
  selected?: boolean;
  locked?: boolean;
  icon?: string;
  onClick?: () => void;
}

export default function HeroCard({
  name,
  title,
  imageUrl,
  selected = false,
  locked = false,
  icon,
  onClick,
}: HeroCardProps) {
  return (
    <div 
      className={cn(
        "snap-start flex-shrink-0 w-36 group cursor-pointer transition-all",
        locked && "opacity-50 hover:opacity-100"
      )}
      onClick={onClick}
    >
      <div className={cn(
        "relative aspect-[3/4] rounded-2xl overflow-hidden",
        selected 
          ? "border-2 border-primary ring-4 ring-primary/20" 
          : "border border-white/10"
      )}>
        {locked ? (
          <div className="absolute inset-0 bg-slate-800 flex items-center justify-center">
            <span className="material-symbols-outlined text-4xl text-primary/40">
              {icon || "lock"}
            </span>
          </div>
        ) : (
          <img 
            alt={name}
            className="w-full h-full object-cover"
            src={imageUrl}
          />
        )}
        
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
        
        <div className="absolute bottom-3 left-0 right-0 text-center">
          <span className={cn(
            "text-[10px] font-bold uppercase tracking-wider",
            selected ? "text-white" : "text-slate-400"
          )}>
            {title}
          </span>
        </div>
      </div>
      
      <h4 className={cn(
        "mt-3 text-center font-display text-sm font-bold",
        selected ? "text-primary" : "text-slate-400"
      )}>
        {name}
      </h4>
    </div>
  );
}