"use client";

import { useEffect, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";

/** Dev-only readout: renderer.info.render.calls — the metric Phase 3/4 verification tracks. */
export function DrawCallReadout() {
  const { gl } = useThree();
  const [calls, setCalls] = useState(0);
  const [triangles, setTriangles] = useState(0);

  useFrame(() => {
    setCalls(gl.info.render.calls);
    setTriangles(gl.info.render.triangles);
  });

  useEffect(() => {
    const el = document.createElement("div");
    el.id = "draw-call-readout";
    el.style.cssText =
      "position:fixed;top:4px;left:4px;z-index:1000;background:#000;color:#0f0;font-family:monospace;font-size:14px;padding:6px 10px;";
    document.body.appendChild(el);
    return () => {
      document.body.removeChild(el);
    };
  }, []);

  useEffect(() => {
    const el = document.getElementById("draw-call-readout");
    if (el) el.textContent = `draw calls: ${calls} | triangles: ${triangles.toLocaleString()}`;
  }, [calls, triangles]);

  return null;
}
