"use client";

import { useEffect, useRef, useState } from "react";
import type { DashStrings } from "./dashboard-strings";
import { UrtuuNode, type UrtuuStation } from "./UrtuuNode";
import { StationPopup } from "./StationPopup";
import { ChallengeCard } from "./ChallengeCard";
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { useTheme } from "next-themes";

const STATION_POSITIONS: Record<string, { left: string; top: string; icon: string; lat: number; lng: number }> = {
  kharakhorum: { left: "28%", top: "68%", icon: "🏛️", lat: 47.2, lng: 102.8 },
  orkhon:      { left: "48%", top: "48%", icon: "🌊", lat: 47.5, lng: 103.5 },
  erdenet:     { left: "62%", top: "36%", icon: "⛏️", lat: 49.0, lng: 104.0 },
  altai:       { left: "76%", top: "28%", icon: "⛰️", lat: 48.5, lng: 96.5 },
  gobi:        { left: "88%", top: "55%", icon: "🏜️", lat: 43.5, lng: 105.0 },
};

const MONGOLIA_BOUNDS = {
  minLat: 41.5,
  maxLat: 52.0,
  minLng: 87.5,
  maxLng: 119.5,
};

interface MapAreaProps {
  t: DashStrings;
  currentStationId: string;
  doneStationIds: string[];
}

export function MapArea({ t, currentStationId, doneStationIds }: MapAreaProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const terrainRef = useRef<THREE.Mesh | null>(null);
  const starsRef = useRef<THREE.Points | null>(null);
  const { theme, resolvedTheme } = useTheme();

  const currentTheme = mounted ? (theme === 'dark' || resolvedTheme === 'dark' ? 'dark' : 'light') : 'light';

  useEffect(() => {
    setMounted(true);
  }, []);

  const stations: UrtuuStation[] = t.stations.map((s) => ({
    ...s,
    pos: STATION_POSITIONS[s.id] ?? { left: "50%", top: "20%" },
    icon: STATION_POSITIONS[s.id]?.icon ?? "location_on",
    isCurrent: s.id === currentStationId,
    isDone: doneStationIds.includes(s.id),
  }));

  const selectedStation = stations.find((s) => s.id === selectedId) ?? null;

  const latLngToPosition = (lat: number, lng: number, radius: number = 5) => {
    const x = (lng - MONGOLIA_BOUNDS.minLng) / (MONGOLIA_BOUNDS.maxLng - MONGOLIA_BOUNDS.minLng) * 12 - 6;
    const y = (lat - MONGOLIA_BOUNDS.minLat) / (MONGOLIA_BOUNDS.maxLat - MONGOLIA_BOUNDS.minLat) * 8 - 4;
    return new THREE.Vector3(x, 0, y);
  };

  const getThemeColors = () => {
    if (currentTheme === 'dark') {
      return {
        background: 0x0a0f1a,
        fog: 0x0a0f1a,
        terrainLow: 0x2a3a2a,
        terrainMid: 0x3a4a3a,
        terrainHigh: 0x4a5a4a,
        terrainSnow: 0x8a9a8a,
        water: 0x2a4a7a,
        starColor: 0xffffff,
        ambientLight: 0x404060,
        sunLight: 0xffeedd,
        gridColor: 0x334455,
      };
    } else {
      return {
        background: 0xe0e8f0,
        fog: 0xe0e8f0,
        terrainLow: 0x8ba88b,
        terrainMid: 0x6b8e6b,
        terrainHigh: 0x4a6b4a,
        terrainSnow: 0xffffff,
        water: 0x4a90e2,
        starColor: 0x334455,
        ambientLight: 0xa0b0c0,
        sunLight: 0xfff0e0,
        gridColor: 0xaabbcc,
      };
    }
  };

  const createTerrain = (colors: ReturnType<typeof getThemeColors>) => {
    const width = 16;
    const depth = 12;
    const segments = 128;
    
    const geometry = new THREE.PlaneGeometry(width, depth, segments, segments);
    geometry.rotateX(-Math.PI / 2);
    
    const positionAttribute = geometry.attributes.position;
    const vertex = new THREE.Vector3();
    
    for (let i = 0; i < positionAttribute.count; i++) {
      vertex.fromBufferAttribute(positionAttribute, i);
      
      const x = vertex.x;
      const z = vertex.y;
      
      const altaiMountains = Math.exp(-(Math.pow(x - 3, 2) + Math.pow(z - 2, 2)) / 8) * 1.2;
      const khangaiMountains = Math.exp(-(Math.pow(x + 1, 2) + Math.pow(z + 1, 2)) / 6) * 1.0;
      const khentiiMountains = Math.exp(-(Math.pow(x - 4, 2) + Math.pow(z - 3, 2)) / 5) * 0.8;
      
      const gobiDesert = Math.exp(-(Math.pow(x + 2, 2) + Math.pow(z + 3, 2)) / 15) * -0.3;
      
      vertex.y = altaiMountains + khangaiMountains + khentiiMountains + gobiDesert;
      vertex.y = Math.max(-0.2, Math.min(1.5, vertex.y));
      
      positionAttribute.setY(i, vertex.y);
    }
    
    geometry.computeVertexNormals();
    const material = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: 0x000000,
      roughness: 0.7,
      metalness: 0.1,
      flatShading: false,
      vertexColors: true,
    });
    
    const terrain = new THREE.Mesh(geometry, material);
    terrain.position.set(0, -1, 0);
    terrain.receiveShadow = true;
    terrain.castShadow = false;
    
    const colors_array = [];
    for (let i = 0; i < positionAttribute.count; i++) {
      vertex.fromBufferAttribute(positionAttribute, i);
      
      let r, g, b;
      const height = vertex.y;
      
      if (height < 0.1) {
        const color = new THREE.Color(colors.terrainLow);
        r = color.r; g = color.g; b = color.b;
      } else if (height < 0.4) {
        const color = new THREE.Color(colors.terrainMid);
        r = color.r; g = color.g; b = color.b;
      } else if (height < 0.8) {
        const color = new THREE.Color(colors.terrainHigh);
        r = color.r; g = color.g; b = color.b;
      } else {
        const color = new THREE.Color(colors.terrainSnow);
        r = color.r; g = color.g; b = color.b;
      }
      
      colors_array.push(r, g, b);
    }
    
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors_array, 3));
    
    return terrain;
  };

  const createRivers = (colors: ReturnType<typeof getThemeColors>) => {
    const points = [];
    for (let t = 0; t <= 1; t += 0.02) {
      const x = -2 + t * 5;
      const z = -1.5 + Math.sin(t * Math.PI * 3) * 0.8;
      points.push(new THREE.Vector3(x, 0.05, z));
    }
    
    const curve = new THREE.CatmullRomCurve3(points);
    const tubeGeometry = new THREE.TubeGeometry(curve, 64, 0.12, 8, false);
    const riverMaterial = new THREE.MeshPhongMaterial({
      color: colors.water,
      emissive: currentTheme === 'dark' ? 0x112233 : 0x224466,
      transparent: true,
      opacity: 0.7,
    });
    
    const river = new THREE.Mesh(tubeGeometry, riverMaterial);
    return river;
  };

  const createSky = (colors: ReturnType<typeof getThemeColors>) => {
    const starsGeometry = new THREE.BufferGeometry();
    const starsCount = currentTheme === 'dark' ? 2000 : 500;
    const starsPositions = new Float32Array(starsCount * 3);
    
    for (let i = 0; i < starsCount * 3; i += 3) {
      const radius = 25;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      
      starsPositions[i] = radius * Math.sin(phi) * Math.cos(theta);
      starsPositions[i + 1] = radius * Math.sin(phi) * Math.sin(theta);
      starsPositions[i + 2] = radius * Math.cos(phi);
    }
    
    starsGeometry.setAttribute('position', new THREE.BufferAttribute(starsPositions, 3));
    
    const starsMaterial = new THREE.PointsMaterial({
      color: colors.starColor,
      size: currentTheme === 'dark' ? 0.1 : 0.15,
      transparent: true,
      opacity: currentTheme === 'dark' ? 0.8 : 0.3,
    });
    
    const stars = new THREE.Points(starsGeometry, starsMaterial);
    return stars;
  };

  const createStationMarkers = () => {
    const markers: THREE.Mesh[] = [];
    
    stations.forEach((station) => {
      const posData = STATION_POSITIONS[station.id];
      if (!posData) return;
      
      const position = latLngToPosition(posData.lat, posData.lng);
      
      const geometry = new THREE.SphereGeometry(0.18, 24, 24);
      const material = new THREE.MeshStandardMaterial({
        color: station.isDone ? 0xffd700 : (station.isCurrent ? 0x44ff44 : 0xff8844),
        emissive: station.isCurrent ? 0x226622 : 0x442200,
        emissiveIntensity: 0.5,
      });
      
      const sphere = new THREE.Mesh(geometry, material);
      sphere.position.copy(position);
      sphere.position.y += 0.4;
      
      const glowGeometry = new THREE.SphereGeometry(0.25, 16, 16);
      const glowMaterial = new THREE.MeshBasicMaterial({
        color: station.isDone ? 0xffaa00 : (station.isCurrent ? 0x44ff44 : 0xff6600),
        transparent: true,
        opacity: 0.2,
      });
      const glow = new THREE.Mesh(glowGeometry, glowMaterial);
      glow.position.copy(position);
      glow.position.y += 0.4;
      
      markers.push(sphere);
      markers.push(glow);
    });
    
    return markers;
  };

  const createGridHelper = (colors: ReturnType<typeof getThemeColors>) => {
    const gridHelper = new THREE.GridHelper(20, 20, colors.gridColor, colors.gridColor);
    gridHelper.position.y = -1;
    gridHelper.material.opacity = currentTheme === 'dark' ? 0.2 : 0.3;
    gridHelper.material.transparent = true;
    return gridHelper;
  };

  const updateSceneForTheme = (colors: ReturnType<typeof getThemeColors>) => {
    if (!sceneRef.current) return;
    
    sceneRef.current.background = new THREE.Color(colors.background);
    sceneRef.current.fog = new THREE.Fog(colors.background, 10, 30);
    
    if (terrainRef.current) {
      sceneRef.current.remove(terrainRef.current);
      const newTerrain = createTerrain(colors);
      terrainRef.current = newTerrain;
      sceneRef.current.add(newTerrain);
    }
    
    if (starsRef.current) {
      sceneRef.current.remove(starsRef.current);
      const newStars = createSky(colors);
      starsRef.current = newStars;
      sceneRef.current.add(newStars);
    }
  };

  useEffect(() => {
    if (!containerRef.current || !mounted) return;

    const colors = getThemeColors();

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(colors.background);
    scene.fog = new THREE.Fog(colors.background, 10, 30);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(
      45,
      containerRef.current.clientWidth / containerRef.current.clientHeight,
      0.1,
      1000
    );
    camera.position.set(8, 6, 12);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ 
      antialias: true, 
      alpha: false,
      powerPreference: "high-performance"
    });
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxPolarAngle = Math.PI / 2.2;
    controls.minDistance = 5;
    controls.maxDistance = 25;
    controls.enablePan = true;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.5;
    controlsRef.current = controls;

    const ambientLight = new THREE.AmbientLight(colors.ambientLight);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(colors.sunLight, 1.2);
    sunLight.position.set(10, 20, 5);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 1024;
    sunLight.shadow.mapSize.height = 1024;
    sunLight.shadow.camera.near = 0.5;
    sunLight.shadow.camera.far = 50;
    sunLight.shadow.camera.left = -10;
    sunLight.shadow.camera.right = 10;
    sunLight.shadow.camera.top = 10;
    sunLight.shadow.camera.bottom = -10;
    scene.add(sunLight);

    const fillLight = new THREE.DirectionalLight(0x446688, 0.4);
    fillLight.position.set(-5, 5, 10);
    scene.add(fillLight);

    const backLight = new THREE.DirectionalLight(0x885566, 0.2);
    backLight.position.set(0, 5, -10);
    scene.add(backLight);

    const terrain = createTerrain(colors);
    terrainRef.current = terrain;
    scene.add(terrain);

    const rivers = createRivers(colors);
    scene.add(rivers);

    const stars = createSky(colors);
    starsRef.current = stars;
    scene.add(stars);

    const grid = createGridHelper(colors);
    scene.add(grid);

    const markers = createStationMarkers();
    markers.forEach(marker => scene.add(marker));

    const animate = () => {
      requestAnimationFrame(animate);
      
      if (controlsRef.current) {
        controlsRef.current.update();
      }
      
      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
    };
    
    animate();

    const handleResize = () => {
      if (!containerRef.current || !cameraRef.current || !rendererRef.current) return;
      
      cameraRef.current.aspect = containerRef.current.clientWidth / containerRef.current.clientHeight;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    };
    
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (containerRef.current && rendererRef.current) {
        containerRef.current.removeChild(rendererRef.current.domElement);
      }
      rendererRef.current?.dispose();
    };
  }, [mounted]);

  useEffect(() => {
    if (!sceneRef.current || !mounted) return;
    
    const colors = getThemeColors();
    updateSceneForTheme(colors);

    sceneRef.current.children.forEach(child => {
      if (child instanceof THREE.DirectionalLight) {
        if (child.color.getHex() === 0xffeedd || child.color.getHex() === 0xfff0e0) {
          child.color.setHex(colors.sunLight);
        }
      }
    });
    
  }, [currentTheme, mounted]);

  useEffect(() => {
    if (!sceneRef.current || !mounted) return;
    sceneRef.current.children = sceneRef.current.children.filter(child => {
      if (child instanceof THREE.Mesh && child.material instanceof THREE.MeshStandardMaterial) {
        const isMarker = child.material.emissive && child.geometry.type === 'SphereGeometry';
        return !isMarker;
      }
      return true;
    });

    const markers = createStationMarkers();
    markers.forEach(marker => sceneRef.current?.add(marker));
  }, [stations, currentTheme, mounted]);

  if (!mounted) {
    return (
      <main className="flex-1 relative overflow-hidden bg-background">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="animate-pulse text-muted-foreground">Loading map...</div>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 relative overflow-hidden bg-background">
      <div ref={containerRef} className="absolute inset-0" />
      
      <div className="absolute inset-0 z-10 pointer-events-none">
        {stations.map((station) => (
          <UrtuuNode
            key={station.id}
            station={station}
            isSelected={selectedId === station.id}
            onSelect={(id) => setSelectedId(id === selectedId ? null : id)}
            lockedLabel={t.locked}
          />
        ))}

        <StationPopup
          station={selectedStation}
          onClose={() => setSelectedId(null)}
          onPlay={(id) => console.log("Play:", id)}
          loreLabel={t.lore}
          minigameLabel={t.minigame}
        />

        <div className="absolute bottom-4 left-4 z-30 text-[9px] text-foreground/50 uppercase tracking-widest flex gap-4 backdrop-blur-sm bg-background/20 p-2 rounded-lg border border-border/30">
          <span>Х: 47.9°N</span>
          <span>У: 106.9°E</span>
          <span>{t.currentLocation}: {t.stations.find(s => s.id === currentStationId)?.name}</span>
        </div>
      </div>
    </main>
  );
}