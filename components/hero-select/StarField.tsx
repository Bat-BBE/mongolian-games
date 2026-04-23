"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

interface StarFieldProps {
  color: string;
}

export function StarField({ color }: StarFieldProps) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;

    // WebGL context creation can fail when the browser has run out of
    // concurrent contexts (each hero card + the map already take one).
    // Bail out gracefully so the rest of the page still renders.
    let renderer: THREE.WebGLRenderer | null = null;
    try {
      renderer = new THREE.WebGLRenderer({
        canvas,
        alpha: true,
        antialias: false,
        powerPreference: "low-power",
        stencil: false,
        depth: false,
      });
    } catch {
      return;
    }
    if (!renderer || !renderer.getContext()) {
      renderer?.dispose();
      return;
    }
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 1;

    const N = 1200;
    const pos = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) {
      pos[i * 3]     = (Math.random() - 0.5) * 30;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 30;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 15 - 3;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    const mat = new THREE.PointsMaterial({
      color: new THREE.Color(color),
      size: 0.022,
      transparent: true,
      opacity: 0.35,
      sizeAttenuation: true,
    });
    const stars = new THREE.Points(geo, mat);
    scene.add(stars);

    let f = 0;
    let id: number;
    const loop = () => {
      id = requestAnimationFrame(loop);
      f++;
      stars.rotation.y = f * 0.0002;
      stars.rotation.x = f * 0.00007;
      mat.color.set(new THREE.Color(color));
      try {
        renderer!.render(scene, camera);
      } catch {
        cancelAnimationFrame(id);
      }
    };
    loop();

    const onResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer!.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(id);
      window.removeEventListener("resize", onResize);
      renderer?.dispose();
    };
  }, [color]);

  return (
    <canvas
      ref={ref}
      className="fixed inset-0 w-full h-full pointer-events-none"
      style={{ zIndex: 0 }}
    />
  );
}