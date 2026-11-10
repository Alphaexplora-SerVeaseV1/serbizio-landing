import React, { useMemo, useRef } from 'react';
import { useFrame, ThreeEvent } from '@react-three/fiber';
import { RoundedBox } from '@react-three/drei';
import * as THREE from 'three';

interface PorcelainWaveFloorProps {
  pulseTick: number;
  onTileClick?: () => void;
}

interface TileData {
  id: string;
  gx: number;
  gz: number;
  x: number;
  z: number;
  dist: number;
  phase: number;
}

export const PorcelainWaveFloor: React.FC<PorcelainWaveFloorProps> = ({
  pulseTick,
  onTileClick,
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const tileRefs = useRef<(THREE.Mesh | null)[]>([]);
  const hoveredIndex = useRef<number | null>(null);
  const rippleOrigin = useRef<{ x: number; z: number; time: number }>({
    x: 0,
    z: 0,
    time: -100,
  });
  const lastPulseRef = useRef<number>(pulseTick);

  const tiles = useMemo<TileData[]>(() => {
    const list: TileData[] = [];
    const cols = 6;
    const rows = 6;
    const spacing = 0.88;
    for (let ix = 0; ix < cols; ix++) {
      for (let iz = 0; iz < rows; iz++) {
        const x = (ix - (cols - 1) / 2) * spacing;
        const z = (iz - (rows - 1) / 2) * spacing;
        const dist = Math.hypot(x, z);
        if (dist > 2.65) continue;
        list.push({
          id: `${ix}-${iz}`,
          gx: ix,
          gz: iz,
          x,
          z,
          dist,
          phase: dist * 0.85 + ix * 0.25,
        });
      }
    }
    return list;
  }, []);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();

    if (pulseTick !== lastPulseRef.current) {
      lastPulseRef.current = pulseTick;
      rippleOrigin.current = { x: 0, z: 0, time: t };
    }

    const pointerX = state.pointer.x * 4.2;
    const pointerZ = -state.pointer.y * 3.2;
    const elapsedSinceRipple = t - rippleOrigin.current.time;

    tiles.forEach((tile, idx) => {
      const mesh = tileRefs.current[idx];
      if (!mesh) return;

      // Ambient architectural porcelain wave
      const ambientWave = Math.sin(t * 1.75 - tile.phase) * 0.06;

      // Interactive pointer proximity lift
      const dPointer = Math.hypot(tile.x - pointerX, tile.z - pointerZ);
      const pointerLift = Math.max(0, 1 - dPointer / 2.35) * 0.28;
      const hoverBoost = hoveredIndex.current === idx ? 0.16 : 0;

      // Click / dispatch ripple wave
      let rippleWave = 0;
      if (elapsedSinceRipple >= 0 && elapsedSinceRipple < 2.6) {
        const dRipple = Math.hypot(
          tile.x - rippleOrigin.current.x,
          tile.z - rippleOrigin.current.z
        );
        const waveFront = elapsedSinceRipple * 3.8;
        const band = Math.exp(-Math.pow(dRipple - waveFront, 2) * 2.2);
        rippleWave =
          band *
          Math.sin((dRipple - waveFront) * 4.5) *
          0.28 *
          (1 - elapsedSinceRipple / 2.6);
      }

      const targetY = -1.24 + ambientWave + pointerLift + hoverBoost + rippleWave;
      mesh.position.y = THREE.MathUtils.lerp(mesh.position.y, targetY, 0.16);

      const targetRotX = (pointerLift * 0.25 + ambientWave * 0.4) * Math.cos(t + tile.gx);
      const targetRotZ = (pointerLift * 0.25 + ambientWave * 0.4) * Math.sin(t + tile.gz);
      mesh.rotation.x = THREE.MathUtils.lerp(mesh.rotation.x, targetRotX, 0.14);
      mesh.rotation.z = THREE.MathUtils.lerp(mesh.rotation.z, targetRotZ, 0.14);
    });
  });

  const handleTileClick = (e: ThreeEvent<MouseEvent>, tile: TileData) => {
    e.stopPropagation();
    rippleOrigin.current = {
      x: tile.x,
      z: tile.z,
      time: performance.now() / 1000,
    };
    if (onTileClick) onTileClick();
  };

  return (
    <group ref={groupRef} position={[0, 0, -0.25]}>
      {tiles.map((tile, index) => {
        const isCenterRing = tile.dist < 2.3 && tile.dist > 1.25;
        return (
          <RoundedBox
            key={tile.id}
            ref={(el) => {
              tileRefs.current[index] = el;
            }}
            args={[0.84, 0.12, 0.84]}
            radius={0.04}
            smoothness={3}
            position={[tile.x, -1.24, tile.z]}
            receiveShadow
            onClick={(e) => handleTileClick(e, tile)}
            onPointerOver={(e) => {
              e.stopPropagation();
              hoveredIndex.current = index;
            }}
            onPointerOut={() => {
              if (hoveredIndex.current === index) hoveredIndex.current = null;
            }}
          >
            <meshStandardMaterial
              color={isCenterRing ? '#F6FCF9' : '#FFFFFF'}
              roughness={0.18}
              metalness={0.05}
              emissive="#34D399"
              emissiveIntensity={isCenterRing ? 0.08 : 0.02}
            />
          </RoundedBox>
        );
      })}
    </group>
  );
};
