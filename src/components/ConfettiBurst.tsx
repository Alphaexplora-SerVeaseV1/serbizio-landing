import React, { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const CONFETTI_COLORS = [
  '#159947',
  '#34D399',
  '#56C490',
  '#FBBF24',
  '#062D1B',
  '#A7F3D0',
  '#FFFFFF',
];

interface Particle3D {
  vx: number;
  vy: number;
  vz: number;
  rx: number;
  ry: number;
  rz: number;
  color: string;
  scale: [number, number, number];
}

export const ConfettiBurst3D: React.FC<{ active: boolean; triggerTick: number }> = ({
  active,
  triggerTick,
}) => {
  const meshRefs = useRef<(THREE.Mesh | null)[]>([]);
  const startTimeRef = useRef<number>(0);

  const particles = useMemo<Particle3D[]>(() => {
    return Array.from({ length: 55 }, (_, i) => {
      const angle = (Math.random() - 0.5) * Math.PI * 1.2;
      const speed = 1.2 + Math.random() * 2.6;
      return {
        vx: Math.sin(angle) * speed * 0.9,
        vy: 2.2 + Math.random() * 2.8,
        vz: 1.1 + Math.cos(angle) * speed,
        rx: (Math.random() - 0.5) * 8,
        ry: (Math.random() - 0.5) * 8,
        rz: (Math.random() - 0.5) * 8,
        color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
        scale: [
          0.015 + Math.random() * 0.012,
          0.028 + Math.random() * 0.016,
          0.003,
        ],
      };
    });
  }, []);

  useEffect(() => {
    if (active) {
      startTimeRef.current = performance.now() / 1000;
    }
  }, [active, triggerTick]);

  useFrame(() => {
    if (!active) return;
    const now = performance.now() / 1000;
    const elapsed = now - startTimeRef.current;

    particles.forEach((p, idx) => {
      const mesh = meshRefs.current[idx];
      if (!mesh) return;
      if (elapsed > 3.2) {
        mesh.scale.set(0, 0, 0);
        return;
      }
      const gravity = -3.4;
      mesh.position.x = -0.11 + p.vx * elapsed * 0.42;
      mesh.position.y = -0.18 + p.vy * elapsed * 0.48 + 0.5 * gravity * elapsed * elapsed * 0.45;
      mesh.position.z = -0.55 + (p.vz - 1.8) * elapsed * 0.15;

      mesh.rotation.x = p.rx * elapsed;
      mesh.rotation.y = p.ry * elapsed;
      mesh.rotation.z = p.rz * elapsed;

      const fade = Math.max(0, 1 - elapsed / 3.1);
      mesh.scale.set(
        p.scale[0] * fade,
        p.scale[1] * fade,
        p.scale[2] * fade
      );
    });
  });

  if (!active) return null;

  return (
    <group>
      {particles.map((p, i) => (
        <mesh
          key={i}
          ref={(el) => {
            meshRefs.current[i] = el;
          }}
          position={[-0.12, -0.1, 1.05]}
        >
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial
            color={p.color}
            emissive={p.color}
            emissiveIntensity={0.35}
            roughness={0.2}
          />
        </mesh>
      ))}
    </group>
  );
};

export const ConfettiOverlay2D: React.FC<{ triggerTick: number }> = ({
  triggerTick,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (triggerTick === 0) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const width = window.innerWidth;
    const height = window.innerHeight;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    const pieces = Array.from({ length: 110 }, (_, i) => {
      const fromLeft = i % 2 === 0;
      const originX = fromLeft ? width * 0.28 : width * 0.68;
      const originY = height * 0.58;
      const angle = -Math.PI / 2 + (Math.random() - 0.5) * 1.35;
      const speed = 7 + Math.random() * 13;
      return {
        x: originX,
        y: originY,
        vx: Math.cos(angle) * speed + (Math.random() - 0.5) * 4,
        vy: Math.sin(angle) * speed - Math.random() * 4,
        w: 6 + Math.random() * 7,
        h: 10 + Math.random() * 8,
        color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
        rot: Math.random() * Math.PI * 2,
        vRot: (Math.random() - 0.5) * 0.22,
        opacity: 1,
      };
    });

    let rafId = 0;
    let frame = 0;
    const render = () => {
      frame++;
      ctx.clearRect(0, 0, width, height);
      let alive = false;
      for (const p of pieces) {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.32; // gravity
        p.vx *= 0.99;
        p.rot += p.vRot;
        if (frame > 95) {
          p.opacity = Math.max(0, p.opacity - 0.022);
        }
        if (p.opacity > 0 && p.y < height + 40) {
          alive = true;
          ctx.save();
          ctx.globalAlpha = p.opacity;
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rot);
          ctx.fillStyle = p.color;
          ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
          ctx.restore();
        }
      }
      if (alive && frame < 180) {
        rafId = requestAnimationFrame(render);
      } else {
        ctx.clearRect(0, 0, width, height);
      }
    };

    rafId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(rafId);
  }, [triggerTick]);

  if (triggerTick === 0) return null;

  return (
    <canvas
      ref={canvasRef}
      className="confetti-overlay-canvas"
      aria-hidden="true"
    />
  );
};
