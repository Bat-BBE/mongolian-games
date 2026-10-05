"use client";

import { useRef } from "react";
import * as THREE from "three";
import { MapCanvas } from "@/components/map3d-r3f/MapCanvas";
import { RemotePeersLayer } from "@/components/map3d-r3f/hero/RemotePeersLayer";
import { MockPeers } from "./MockPeers";
import type { MapPresencePeer } from "@/hooks/useMapPresence";
import { SkyAndLighting } from "@/components/map3d-r3f/scene/SkyAndLighting";
import { Terrain } from "@/components/map3d-r3f/scene/Terrain";
import { GrassInstances } from "@/components/map3d-r3f/scene/GrassInstances";
import { Roads } from "@/components/map3d-r3f/scene/Roads";
import { DrawCallReadout } from "@/components/map3d-r3f/scene/DrawCallReadout";
import { MapDecor } from "@/components/map3d-r3f/decor/MapDecor";
import { MapCameraRig, type CameraTarget } from "@/components/map3d-r3f/controls/MapCameraRig";
import { LocalHero } from "@/components/map3d-r3f/controls/LocalHero";
import { createHeroKinematic } from "@/components/map3d-r3f/controls/heroKinematic";
import { STATION_CONFIGS, WORLD_SCALE, STATION_SPREAD } from "@/components/dashboard/mapConstants";
import { terrainHeight } from "@/components/dashboard/sceneHelpers";
import type { UrtuuStation } from "@/components/dashboard/UrtuuNode";

function buildPreviewStations(): UrtuuStation[] {
  return Object.keys(STATION_CONFIGS).map((id) => ({
    id,
    name: id,
    gameName: "",
    gameDesc: "",
    reward: "",
    available: true,
    pos: { left: "0%", top: "0%" },
  }));
}

export default function MapR3FPreviewPage() {
  if (process.env.NODE_ENV === "production") {
    return <div style={{ padding: 24 }}>Dev-only tool.</div>;
  }
  return <MapR3FPreview />;
}

function MapR3FPreview() {
  const stations = buildPreviewStations();
  const kinematicRef = useRef(createHeroKinematic());
  const remotePeersRef = useRef<MapPresencePeer[]>([]);

  const ubCfg = STATION_CONFIGS.ulaanbaatar!;
  const startX = ubCfg.wx * WORLD_SCALE * STATION_SPREAD + 10;
  const startZ = ubCfg.wz * WORLD_SCALE * STATION_SPREAD + 10;
  const startPosition = new THREE.Vector3(startX, terrainHeight(startX, startZ) + 0.02, startZ);

  const initialTarget: CameraTarget = {
    lookAt: new THREE.Vector3(startX, terrainHeight(startX, startZ) + 2.5, startZ),
    distance: 38,
    phi: 0.44,
    theta: 0.15,
  };

  return (
    <div style={{ width: "100vw", height: "100vh", background: "#111" }}>
      <div
        style={{
          position: "fixed",
          bottom: 4,
          left: 4,
          zIndex: 1000,
          color: "#0f0",
          fontFamily: "monospace",
          fontSize: 12,
          background: "#000",
          padding: "4px 8px",
        }}
      >
        WASD/arrows to move, Shift to run, drag to orbit, wheel/pinch to zoom
      </div>
      <MapCanvas cameraFar={6000}>
        <SkyAndLighting />
        <Terrain />
        <GrassInstances count={800} />
        <Roads stations={stations} />
        <MapDecor stations={stations} />
        <LocalHero modelPath="/models/hero1.glb" startPosition={startPosition} kinematicRef={kinematicRef} />
        <MapCameraRig initialTarget={initialTarget} heroKinematicRef={kinematicRef} />
        <MockPeers count={30} centerX={startX} centerZ={startZ} remotePeersRef={remotePeersRef} />
        <RemotePeersLayer remotePeersRef={remotePeersRef} heroKinematicRef={kinematicRef} />
        <DrawCallReadout />
      </MapCanvas>
    </div>
  );
}
