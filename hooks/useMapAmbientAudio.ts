"use client";

import { useEffect, useMemo, useRef } from "react";

type AmbientBiome = "steppe" | "forest" | "gobi" | "mountain" | "lake";

function clamp01(v: number): number {
  return Math.max(0, Math.min(1, v));
}

function createNoiseBuffer(ctx: AudioContext, seconds = 2): AudioBuffer {
  const len = Math.floor(ctx.sampleRate * seconds);
  const buffer = ctx.createBuffer(1, len, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < len; i++) {
    data[i] = (Math.random() * 2 - 1) * 0.32;
  }
  return buffer;
}

function makeNoiseLayer(
  ctx: AudioContext,
  noiseBuffer: AudioBuffer,
  options: {
    hp?: number;
    lp?: number;
    gain: number;
  },
): GainNode {
  const src = ctx.createBufferSource();
  src.buffer = noiseBuffer;
  src.loop = true;

  let tail: AudioNode = src;
  if (options.hp) {
    const hp = ctx.createBiquadFilter();
    hp.type = "highpass";
    hp.frequency.value = options.hp;
    tail.connect(hp);
    tail = hp;
  }
  if (options.lp) {
    const lp = ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = options.lp;
    tail.connect(lp);
    tail = lp;
  }

  const gain = ctx.createGain();
  gain.gain.value = options.gain;
  tail.connect(gain);
  src.start();
  return gain;
}

export function useMapAmbientAudio({
  enabled,
  muted,
  volume,
  biome,
  daylightFactor,
}: {
  enabled: boolean;
  muted: boolean;
  volume: number;
  biome: string;
  daylightFactor?: number;
}) {
  const biomeNormalized = useMemo<AmbientBiome>(() => {
    if (biome === "forest") return "forest";
    if (biome === "gobi") return "gobi";
    if (biome === "mountain") return "mountain";
    if (biome === "lake") return "lake";
    return "steppe";
  }, [biome]);

  const ctxRef = useRef<AudioContext | null>(null);
  const masterRef = useRef<GainNode | null>(null);
  const layersRef = useRef<Record<AmbientBiome, GainNode> | null>(null);
  const initializedRef = useRef(false);
  const latestStateRef = useRef({
    enabled,
    muted,
    volume,
    biome: biomeNormalized,
    daylightFactor: daylightFactor ?? 1,
  });

  latestStateRef.current = {
    enabled,
    muted,
    volume,
    biome: biomeNormalized,
    daylightFactor: daylightFactor ?? 1,
  };

  const applyCurrentMixRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const applyCurrentMix = () => {
      const master = masterRef.current;
      const layers = layersRef.current;
      const ctx = ctxRef.current;
      if (!master || !layers || !ctx) return;
      const state = latestStateRef.current;
      const dayMul = 0.68 + clamp01(state.daylightFactor) * 0.42;
      const targetMaster =
        state.enabled && !state.muted ? clamp01(state.volume) * 0.52 * dayMul : 0;
      master.gain.setTargetAtTime(targetMaster, ctx.currentTime, 0.12);
      for (const k of Object.keys(layers) as AmbientBiome[]) {
        layers[k].gain.setTargetAtTime(
          k === state.biome ? 1 : 0,
          ctx.currentTime,
          0.28,
        );
      }
    };
    applyCurrentMixRef.current = applyCurrentMix;

    const init = () => {
      if (initializedRef.current) return;
      initializedRef.current = true;
      const ctx = new AudioContext();
      const master = ctx.createGain();
      master.gain.value = 0;
      master.connect(ctx.destination);

      const noise = createNoiseBuffer(ctx, 2.2);
      const steppe = makeNoiseLayer(ctx, noise, { hp: 210, lp: 1300, gain: 0.1 });
      const forest = makeNoiseLayer(ctx, noise, { hp: 460, lp: 3200, gain: 0.09 });
      const gobi = makeNoiseLayer(ctx, noise, { hp: 110, lp: 720, gain: 0.13 });
      const mountain = makeNoiseLayer(ctx, noise, {
        hp: 280,
        lp: 1800,
        gain: 0.09,
      });
      const lake = makeNoiseLayer(ctx, noise, { hp: 340, lp: 2300, gain: 0.07 });

      const layers: Record<AmbientBiome, GainNode> = {
        steppe,
        forest,
        gobi,
        mountain,
        lake,
      };

      for (const k of Object.keys(layers) as AmbientBiome[]) {
        const g = ctx.createGain();
        g.gain.value = 0;
        layers[k].connect(g);
        g.connect(master);
        layers[k] = g;
      }

      ctxRef.current = ctx;
      masterRef.current = master;
      layersRef.current = layers;
      applyCurrentMix();
    };

    const unlock = () => {
      init();
      const ctx = ctxRef.current;
      if (ctx && ctx.state === "suspended") void ctx.resume();
      applyCurrentMix();
    };

    window.addEventListener("pointerdown", unlock, { passive: true });
    window.addEventListener("keydown", unlock);
    window.addEventListener("touchstart", unlock, { passive: true });

    return () => {
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
      window.removeEventListener("touchstart", unlock);
      applyCurrentMixRef.current = null;
    };
  }, []);

  useEffect(() => {
    const master = masterRef.current;
    const ctx = ctxRef.current;
    if (!master || !ctx) return;
    const dayMul = 0.68 + clamp01(daylightFactor ?? 1) * 0.42;
    const target = enabled && !muted ? clamp01(volume) * 0.52 * dayMul : 0;
    master.gain.setTargetAtTime(target, ctx.currentTime, 0.2);
    applyCurrentMixRef.current?.();
  }, [enabled, muted, volume, daylightFactor]);

  useEffect(() => {
    const layers = layersRef.current;
    const ctx = ctxRef.current;
    if (!layers || !ctx) return;
    for (const k of Object.keys(layers) as AmbientBiome[]) {
      layers[k].gain.setTargetAtTime(k === biomeNormalized ? 1 : 0, ctx.currentTime, 0.45);
    }
    applyCurrentMixRef.current?.();
  }, [biomeNormalized]);

  useEffect(() => {
    return () => {
      const ctx = ctxRef.current;
      if (ctx) void ctx.close();
      ctxRef.current = null;
      layersRef.current = null;
      masterRef.current = null;
      initializedRef.current = false;
    };
  }, []);
}

