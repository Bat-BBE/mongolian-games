"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { MapCanvas } from "@/components/map3d-r3f/MapCanvas";
import { SkyAndLighting } from "@/components/map3d-r3f/scene/SkyAndLighting";
import { Terrain } from "@/components/map3d-r3f/scene/Terrain";
import { GrassInstances } from "@/components/map3d-r3f/scene/GrassInstances";
import { Roads } from "@/components/map3d-r3f/scene/Roads";
import { DrawCallReadout } from "@/components/map3d-r3f/scene/DrawCallReadout";
import { MapDecor } from "@/components/map3d-r3f/decor/MapDecor";
import { MapCameraRig, type CameraTarget } from "@/components/map3d-r3f/controls/MapCameraRig";
import { LocalHero } from "@/components/map3d-r3f/controls/LocalHero";
import { createHeroKinematic } from "@/components/map3d-r3f/controls/heroKinematic";
import { RemotePeersLayer } from "@/components/map3d-r3f/hero/RemotePeersLayer";
import { useMapPresence } from "@/hooks/useMapPresence";
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

export default function MapR3FPreviewLivePage() {
  if (process.env.NODE_ENV === "production") {
    return <div style={{ padding: 24 }}>Dev-only tool.</div>;
  }
  return <MapR3FPreviewLive />;
}

function MapR3FPreviewLive() {
  const stations = buildPreviewStations();
  const kinematicRef = useRef(createHeroKinematic());
  const myIdRef = useRef(`tester-${Math.random().toString(36).slice(2, 8)}`);

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

  const { remotePeersRef, publishPose } = useMapPresence({
    displayName: myIdRef.current,
    homeKey: "preview-live",
    enabled: true,
    heroModelPath: "/models/hero1.glb",
    gerLevel: 1,
    livestock: { sheep: 0, goat: 0, cow: 0, horse: 0, camel: 0 },
  });

  useEffect(() => {
    const id = setInterval(() => {
      const kin = kinematicRef.current;
      if (kin.has) publishPose(kin.pos.x, kin.pos.z, kin.ry);
    }, 180);
    return () => clearInterval(id);
  }, [publishPose]);

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
        LIVE multiplayer test — id: {myIdRef.current} — open this URL in a 2nd tab to test peer sync
      </div>
      <MapCanvas cameraFar={6000}>
        <SkyAndLighting />
        <Terrain />
        <GrassInstances count={800} />
        <Roads stations={stations} />
        <MapDecor stations={stations} />
        <LocalHero modelPath="/models/hero1.glb" startPosition={startPosition} kinematicRef={kinematicRef} />
        <MapCameraRig initialTarget={initialTarget} heroKinematicRef={kinematicRef} />
        <RemotePeersLayer remotePeersRef={remotePeersRef} heroKinematicRef={kinematicRef} />
        <DrawCallReadout />
      </MapCanvas>
    </div>
  );
}
