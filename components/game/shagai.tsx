// components/game/shagai.tsx
"use client";

import { useBox } from "@react-three/cannon";
import { useRef, useEffect, useState } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

export type ShagaiSide = 'horse' | 'sheep' | 'goat' | 'camel' | 'fallback';

export interface ShagaiResult {
  side: ShagaiSide;
  name: string;
  symbol: string;
  value: number;
  description: string;
  luck: string;
}

export const SHAgAI_SIDES: Record<ShagaiSide, ShagaiResult> = {
  horse: {
    side: 'horse',
    name: 'Морь',
    symbol: '🐴',
    value: 4,
    description: 'Морь - эрч хүч, хурд, сүлд хийморь бэлгэдэл.',
    luck: 'Эрч хүч сүлд хийморь, зорилгодоо хүрэх'
  },
  sheep: {
    side: 'sheep',
    name: 'Хонь',
    symbol: '🐑',
    value: 3,
    description: 'Хонь - элбэг дэлбэг байдал, нөхөрсөг зан, бүтээлч энергийн бэлгэдэл.',
    luck: 'Гэр бүлийн аз жаргал, эв нэгдэл'
  },
  goat: {
    side: 'goat',
    name: 'Ямаа',
    symbol: '🐐',
    value: 2,
    description: 'Ямаа - тэсвэр тэвчээр, бие даасан байдал, уулын сүр хүч авхаалч самбааны бэлгэдэл.',
    luck: 'Саад бэрхшээлийг даван туулах'
  },
  camel: {
    side: 'camel',
    name: 'Тэмээ',
    symbol: '🐫',
    value: 1,
    description: 'Тэмээ - тэвчээр, дасан зохицох чадвар, говийн их тэвчээрийн бэлгэдэл.',
    luck: 'Урт хугацааны хөрөнгө оруулалт, тогтвортой байдал'
  },
  fallback: {
    side: 'fallback',
    name: 'Тодорхойгүй',
    symbol: '❓',
    value: 0,
    description: 'Шагай тодорхойгүй байна. Дахин шиднэ үү.',
    luck: ''
  }
};

// Шагайн талыг тодорхойлох функц
export function detectShagaiSide(rotation: THREE.Euler): ShagaiSide {
  // Энгийн алгоритм - шагайны өнцгөөр талыг тодорхойлох
  const rx = Math.abs(rotation.x % Math.PI);
  const rz = Math.abs(rotation.z % Math.PI);
  
  if (rx < 0.5 && rz < 0.5) return "horse";
  if (rx > 2.5 && rz < 0.5) return "camel";
  if (rz > 2.5 && rx < 0.5) return "sheep";
  if (rx > 2.5 && rz > 2.5) return "goat";
  
  // Дундаж утгууд
  if (rx > 1.2 && rx < 2.0) return "sheep";
  if (rz > 1.2 && rz < 2.0) return "goat";
  
  return "horse"; // Fallback
}

// Энгийн шагай компонент
export default function Shagai({ 
  setResult,
  onResult 
}: { 
  setResult: (result: string) => void;
  onResult?: (side: ShagaiSide) => void;
}) {
  const mesh = useRef<THREE.Mesh | null>(null);
  const [isMoving, setIsMoving] = useState(false);
  const velocity = useRef<[number, number, number]>([0, 0, 0]);

  const [ref, api] = useBox(() => ({
    mass: 0.8,
    position: [0, 5, 0],
    args: [1.0, 0.8, 1.4],
    material: {
      friction: 0.7,
      restitution: 0.3
    },
    linearDamping: 0.4,
    angularDamping: 0.3,
  }));

  useEffect(() => {
    const unsub = api.velocity.subscribe((v) => {
      velocity.current = v;
    });
    return unsub;
  }, [api]);

  const throwShagai = () => {
    setResult("");
    setIsMoving(true);
    
    api.velocity.set(
      (Math.random() - 0.5) * 5,
      5 + Math.random() * 3,
      (Math.random() - 0.5) * 5
    );

    api.angularVelocity.set(
      (Math.random() - 0.5) * 12,
      (Math.random() - 0.5) * 12,
      (Math.random() - 0.5) * 12
    );
  };

  useFrame(() => {
    if (!mesh.current || !isMoving) return;

    const speed = Math.sqrt(
      velocity.current[0] ** 2 +
      velocity.current[1] ** 2 +
      velocity.current[2] ** 2
    );

    if (speed < 0.1) {
      setIsMoving(false);
      
      const side = detectShagaiSide(mesh.current.rotation);
      const result = SHAgAI_SIDES[side];
      
      setResult(`${result.symbol} ${result.name}`);
      if (onResult) onResult(side);
    }
  });

  return (
    <mesh
      ref={(node) => {
        if (node) {
          ref.current = node as any;
          mesh.current = node as any;
        }
      }}
      onClick={throwShagai}
      castShadow
      receiveShadow
    >
      <boxGeometry args={[1.0, 0.8, 1.4]} />
      <meshStandardMaterial color="#f0e6d2" roughness={0.6} />
    </mesh>
  );
}