"use client";

import { useGLTF } from "@react-three/drei";
import { LANDMARK_BY_STATION } from "./landmarkRegistry";
import { STATION_CONFIGS, WORLD_SCALE, STATION_SPREAD } from "@/components/dashboard/mapConstants";

/** Each unique landmark is placed once (not instanced) — loaded via useGLTF's
 * own cache, so visiting the same type twice costs nothing extra. */
function OneLandmark({ stationId, type }: { stationId: string; type: string }) {
  const cfg = STATION_CONFIGS[stationId];
  const gltf = useGLTF(`/models/map/${type}.glb`);
  if (!cfg) return null;
  const x = cfg.wx * WORLD_SCALE * STATION_SPREAD;
  const z = cfg.wz * WORLD_SCALE * STATION_SPREAD;
  return <primitive object={gltf.scene.clone()} position={[x, 0, z]} />;
}

export function StationLandmarks() {
  return (
    <>
      {Object.entries(LANDMARK_BY_STATION).map(([stationId, type]) => (
        <OneLandmark key={stationId} stationId={stationId} type={type} />
      ))}
    </>
  );
}
