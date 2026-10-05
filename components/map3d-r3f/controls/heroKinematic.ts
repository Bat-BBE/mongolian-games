import * as THREE from "three";

/** Shared between LocalHero (writer) and MapCameraRig (reader, for follow-blend). */
export type HeroKinematic = {
  pos: THREE.Vector3;
  ry: number;
  has: boolean;
  moving: boolean;
  /** performance.now() timestamp until which the camera should keep following
   * even after movement input stops (mirrors followHeroUntilRef in useThreeScene). */
  followUntil: number;
};

export function createHeroKinematic(): HeroKinematic {
  return {
    pos: new THREE.Vector3(),
    ry: 0,
    has: false,
    moving: false,
    followUntil: 0,
  };
}
