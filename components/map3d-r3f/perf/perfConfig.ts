import type { DeviceTier } from "./deviceTier";

export type PerfConfig = {
  dpr: [number, number];
  shadows: boolean;
  shadowMapSize: number;
  antialias: boolean;
  grassCount: number;
  maxRemotePeers: number;
};

export const PERF_CONFIG: Record<DeviceTier, PerfConfig> = {
  low: {
    dpr: [1, 1],
    shadows: false,
    shadowMapSize: 512,
    antialias: false,
    grassCount: 150,
    maxRemotePeers: 6,
  },
  medium: {
    dpr: [1, 1.5],
    shadows: true,
    shadowMapSize: 1024,
    antialias: true,
    grassCount: 500,
    maxRemotePeers: 12,
  },
  high: {
    dpr: [1, 1.32],
    shadows: true,
    shadowMapSize: 2048,
    antialias: true,
    grassCount: 1000,
    maxRemotePeers: 24,
  },
};
