export function MapControls() {
  return (
    <div className="absolute bottom-4 right-4 z-30 pointer-events-none">
      <div
        className="map-hud-pill px-3 py-2 text-xs space-y-0.5"
        style={{ color: "var(--map-ui-text-muted)" }}
      >
        <div>🖱 Drag — эргүүлэх</div>
        <div>⚙ Right drag — шилжүүлэх</div>
        <div>🔍 Scroll — томруулах</div>
      </div>
    </div>
  );
}