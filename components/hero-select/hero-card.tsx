'use client';

import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';
import { cn } from '@/lib/utils';

interface HeroCardProps {
  name: string;
  title: string;
  imageUrl: string;
  modelPath?: string;
  selected?: boolean;
  locked?: boolean;
  icon?: string;
  accentColor?: string;
  onClick?: () => void;
}

// ─── Mini 3D Viewer (embedded) ───────────────────────────────────────────────
function HeroViewer({
  modelPath,
  accentColor = '#3b82f6',
  active,
}: {
  modelPath: string;
  accentColor?: string;
  active: boolean;
}) {
  const mountRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const rafRef = useRef<number>(0);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!mountRef.current) return;
    const el = mountRef.current;

    const W = el.clientWidth;
    const H = el.clientHeight;

    // Scene
    const scene = new THREE.Scene();
    scene.background = null; // transparent — card bg shows through

    // Camera
    const camera = new THREE.PerspectiveCamera(40, W / H, 0.1, 500);
    camera.position.set(0, 1.4, 5.5);
    camera.lookAt(0, 0.9, 0);

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(W, H);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.3;
    el.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Lights
    scene.add(new THREE.AmbientLight(0x8899bb, 1.2));

    const key = new THREE.DirectionalLight(0xffffff, 2.2);
    key.position.set(3, 8, 5);
    key.castShadow = true;
    key.shadow.mapSize.setScalar(1024);
    scene.add(key);

    const fill = new THREE.DirectionalLight(0xffbb88, 0.9);
    fill.position.set(-4, 2, 3);
    scene.add(fill);

    // Accent rim light (hero color)
    const rim = new THREE.DirectionalLight(new THREE.Color(accentColor), 1.4);
    rim.position.set(0, 3, -6);
    scene.add(rim);

    // Ground disc
    const disc = new THREE.Mesh(
      new THREE.CircleGeometry(2.5, 48),
      new THREE.MeshStandardMaterial({
        color: new THREE.Color(accentColor).multiplyScalar(0.12),
        roughness: 0.9,
        metalness: 0.1,
        transparent: true,
        opacity: 0.55,
      })
    );
    disc.rotation.x = -Math.PI / 2;
    disc.position.y = -1.02;
    disc.receiveShadow = true;
    scene.add(disc);

    // Glowing ring on ground
    const ringGeo = new THREE.RingGeometry(1.15, 1.35, 64);
    const ringMat = new THREE.MeshBasicMaterial({
      color: new THREE.Color(accentColor),
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.45,
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = -1.0;
    scene.add(ring);

    // OrbitControls (auto-rotate only, no user interaction on card)
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableZoom = false;
    controls.enablePan = false;
    controls.enableRotate = false;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 1.8;
    controls.target.set(0, 0.9, 0);

    // Load model
    const loader = new FBXLoader();
    let mixer: THREE.AnimationMixer | null = null;
    const clock = new THREE.Clock();

    loader.load(modelPath, (obj) => {
      obj.scale.setScalar(0.018);
      obj.position.set(0, -1, 0);
      obj.traverse((c) => {
        if (c instanceof THREE.Mesh) {
          c.castShadow = true;
          c.receiveShadow = true;
        }
      });
      scene.add(obj);

      mixer = new THREE.AnimationMixer(obj);

      // Try to load idle animation
      loader.load('/models/standing idle 01.fbx', (animObj) => {
        if (animObj.animations[0]) {
          mixer!.clipAction(animObj.animations[0]).play();
        }
        setReady(true);
      });
    });

    // Animate
    const animate = () => {
      rafRef.current = requestAnimationFrame(animate);
      const dt = clock.getDelta();
      mixer?.update(dt);
      controls.update();
      // Pulse ring opacity
      ringMat.opacity = 0.3 + 0.2 * Math.sin(clock.elapsedTime * 2);
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(rafRef.current);
      renderer.dispose();
      if (el.contains(renderer.domElement)) el.removeChild(renderer.domElement);
    };
  }, [modelPath, accentColor]);

  return (
    <div ref={mountRef} className="absolute inset-0 w-full h-full">
      {!ready && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div
            className="w-6 h-6 rounded-full border-2 border-t-transparent animate-spin"
            style={{ borderColor: `${accentColor}88`, borderTopColor: 'transparent' }}
          />
        </div>
      )}
    </div>
  );
}

// ─── Main HeroCard ────────────────────────────────────────────────────────────
export default function HeroCard({
  name,
  title,
  imageUrl,
  modelPath,
  selected = false,
  locked = false,
  icon,
  accentColor = '#3b82f6',
  onClick,
}: HeroCardProps) {
  const [hovered, setHovered] = useState(false);
  const show3D = (hovered || selected) && !!modelPath && !locked;

  return (
    <div
      className={cn(
        'snap-start flex-shrink-0 w-36 group cursor-pointer transition-all duration-300 select-none',
        locked && 'opacity-50 cursor-not-allowed',
        selected && !locked && 'scale-105 -translate-y-2',
        !selected && !locked && 'hover:scale-[1.03] hover:-translate-y-1',
      )}
      onClick={!locked ? onClick : undefined}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* ── Card frame ── */}
      <div
        className="relative aspect-[3/4] rounded-2xl overflow-hidden transition-all duration-300"
        style={{
          border: selected
            ? `2px solid ${accentColor}`
            : '1.5px solid rgba(255,255,255,0.08)',
          boxShadow: selected
            ? `0 0 24px 4px ${accentColor}44, 0 0 6px 1px ${accentColor}33`
            : hovered && !locked
            ? `0 0 14px 2px ${accentColor}22`
            : 'none',
          background: 'linear-gradient(160deg, #0f172a 0%, #1e293b 100%)',
        }}
      >
        {/* Locked state */}
        {locked ? (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-900">
            <div
              className="flex flex-col items-center gap-2 opacity-40"
              style={{ color: accentColor }}
            >
              <span className="material-symbols-outlined text-4xl">{icon || 'lock'}</span>
              <span className="text-[9px] uppercase tracking-widest font-bold opacity-70">Locked</span>
            </div>
          </div>
        ) : (
          <>
            {/* Static image (shown when not hovered/selected) */}
            <img
              src={imageUrl}
              alt={name}
              className={cn(
                'absolute inset-0 w-full h-full object-cover transition-opacity duration-500',
                show3D ? 'opacity-0' : 'opacity-100'
              )}
            />

            {/* 3D viewer (shown on hover/select) */}
            {modelPath && (hovered || selected) && (
              <div
                className={cn(
                  'absolute inset-0 transition-opacity duration-500',
                  show3D ? 'opacity-100' : 'opacity-0'
                )}
              >
                <HeroViewer
                  modelPath={modelPath}
                  accentColor={accentColor}
                  active={show3D}
                />
              </div>
            )}

            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent pointer-events-none" />

            {/* Selected corner accent */}
            {selected && (
              <div
                className="absolute top-2 right-2 w-2 h-2 rounded-full animate-pulse"
                style={{ background: accentColor, boxShadow: `0 0 6px 2px ${accentColor}` }}
              />
            )}

            {/* Title badge */}
            <div className="absolute bottom-3 left-0 right-0 text-center px-1 pointer-events-none">
              <span
                className="text-[9px] font-bold uppercase tracking-widest transition-colors duration-300"
                style={{ color: selected ? accentColor : 'rgba(255,255,255,0.38)' }}
              >
                {title}
              </span>
            </div>
          </>
        )}
      </div>

      {/* Name */}
      <div className="mt-2.5 text-center px-1">
        <h4
          className="text-sm font-bold uppercase tracking-wide transition-colors duration-300 truncate"
          style={{
            fontFamily: "'Rajdhani', 'Exo 2', sans-serif",
            color: selected && !locked
              ? accentColor
              : hovered && !locked
              ? 'rgba(255,255,255,0.75)'
              : 'rgba(255,255,255,0.35)',
            textShadow: selected && !locked ? `0 0 10px ${accentColor}88` : 'none',
          }}
        >
          {name}
        </h4>
      </div>
    </div>
  );
}