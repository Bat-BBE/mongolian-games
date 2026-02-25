"use client";
// CornerDecos.tsx — four corner bracket decorations for a panel

interface CornerDecosProps {
  color: string; // hex — matches the active hero color
}

export function CornerDecos({ color }: CornerDecosProps) {
  return (
    <>
      <span className="absolute top-0 left-0 w-4 h-4 opacity-40 border-t border-l" style={{ borderColor: color }} />
      <span className="absolute top-0 right-0 w-4 h-4 opacity-40 border-t border-r" style={{ borderColor: color }} />
      <span className="absolute bottom-0 left-0 w-4 h-4 opacity-40 border-b border-l" style={{ borderColor: color }} />
      <span className="absolute bottom-0 right-0 w-4 h-4 opacity-40 border-b border-r" style={{ borderColor: color }} />
    </>
  );
}