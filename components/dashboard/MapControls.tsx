export function MapControls() {
  return (
    <div className="absolute bottom-4 right-4 z-30 pointer-events-none">
      <div className="backdrop-blur-md bg-black/35 px-3 py-2 rounded-lg border border-white/10 shadow text-xs text-white/55 space-y-0.5">
        <div>🖱 Drag — эргүүлэх</div>
        <div>⚙ Right drag — шилжүүлэх</div>
        <div>🔍 Scroll — томруулах</div>
      </div>
    </div>
  );
}