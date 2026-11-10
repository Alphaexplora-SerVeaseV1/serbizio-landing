import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import {
  Html,
  RoundedBox,
  Sparkles,
} from '@react-three/drei';
import * as THREE from 'three';
import gsap from 'gsap';
import { StageWord } from '../types';
import { WORD_STAGES } from '../data/services';
import { PorcelainWaveFloor } from './PorcelainWaveFloor';
import { ConfettiBurst3D } from './ConfettiBurst';

interface SerbizioHomeSceneProps {
  currentWord: StageWord;
  pulseTick: number;
  isSubmitted: boolean;
  submittedEmail: string | null;
  celebrationTick: number;
  onAdvanceWord: () => void;
  onReplayConfetti: () => void;
  onStepOutside: () => void;
}

interface NeighborHouseSpec {
  id: number;
  pos: [number, number, number];
  rotY: number;
  scale: number;
  roofColor: string;
  minStageHouses: number;
}

const SanctuaryContent: React.FC<SerbizioHomeSceneProps> = ({
  currentWord,
  pulseTick,
  isSubmitted,
  submittedEmail,
  celebrationTick,
  onAdvanceWord,
  onReplayConfetti,
  onStepOutside,
}) => {
  const { camera, size } = useThree();
  const isMobile = size.width <= 960;

  const stageOffsetRef = useRef<THREE.Group>(null);
  const houseRootRef = useRef<THREE.Group>(null);
  const doorPivotRef = useRef<THREE.Group>(null);
  const doorLightRef = useRef<THREE.PointLight>(null);
  const interiorLightRef = useRef<THREE.PointLight>(null);
  const vanRef = useRef<THREE.Group>(null);
  const steamRefs = useRef<(THREE.Mesh | null)[]>([]);
  const neighborRefs = useRef<(THREE.Group | null)[]>([]);
  const lookAtTarget = useRef<THREE.Vector3>(
    new THREE.Vector3(isMobile ? 0 : -1.25, 0.08, 0)
  );

  const [isDragging, setIsDragging] = useState(false);
  const [boostedHouses, setBoostedHouses] = useState<Record<number, boolean>>({});
  const dragStartX = useRef(0);
  const userRotationOffset = useRef(0);

  const neighborSpecs = useMemo<NeighborHouseSpec[]>(
    () => [
      {
        id: 1,
        pos: [-1.85, -0.32, 0.35],
        rotY: 0.25,
        scale: 0.62,
        roofColor: '#159947',
        minStageHouses: 3,
      },
      {
        id: 2,
        pos: [1.95, -0.32, -0.25],
        rotY: -0.3,
        scale: 0.65,
        roofColor: '#0A4528',
        minStageHouses: 3,
      },
      {
        id: 3,
        pos: [-1.35, -0.32, -1.55],
        rotY: 0.55,
        scale: 0.58,
        roofColor: '#0F6839',
        minStageHouses: 5,
      },
      {
        id: 4,
        pos: [1.45, -0.32, -1.62],
        rotY: -0.48,
        scale: 0.56,
        roofColor: '#159947',
        minStageHouses: 5,
      },
      {
        id: 5,
        pos: [-0.05, -0.32, -1.95],
        rotY: 0.05,
        scale: 0.64,
        roofColor: '#07361F',
        minStageHouses: 7,
      },
      {
        id: 6,
        pos: [1.85, -0.32, 1.28],
        rotY: -0.65,
        scale: 0.52,
        roofColor: '#159947',
        minStageHouses: 7,
      },
    ],
    []
  );

  // 1. Dedicated Camera Transition for Entering / Exiting the House (ONLY runs when isSubmitted changes!)
  useEffect(() => {
    if (isSubmitted) {
      userRotationOffset.current = 0;

      if (stageOffsetRef.current) {
        gsap.to(stageOffsetRef.current.position, {
          x: 0,
          y: -0.18,
          z: 0,
          duration: 0.9,
          ease: 'power3.inOut',
        });
        gsap.to(stageOffsetRef.current.scale, {
          x: 1,
          y: 1,
          z: 1,
          duration: 0.9,
          ease: 'power3.inOut',
        });
      }

      if (houseRootRef.current) {
        gsap.to(houseRootRef.current.rotation, {
          x: 0,
          y: 0,
          z: 0,
          duration: 0.85,
          ease: 'power3.inOut',
        });
      }

      // Swing the emerald front door wide open
      if (doorPivotRef.current) {
        gsap.to(doorPivotRef.current.rotation, {
          y: -1.65,
          duration: 0.85,
          delay: 0.1,
          ease: 'back.out(1.6)',
        });
      }

      // Two-stage GSAP camera flight: line up with the open front door, then glide THROUGH the doorway into the living room!
      const camTl = gsap.timeline();
      camTl
        .to(camera.position, {
          x: -0.11,
          y: -0.04,
          z: 2.85,
          duration: 0.6,
          ease: 'power2.inOut',
        })
        .to(camera.position, {
          x: -0.11,
          y: 0.02,
          z: 0.78,
          duration: 1.1,
          ease: 'power3.inOut',
        });

      gsap.to(lookAtTarget.current, {
        x: -0.11,
        y: -0.24,
        z: -1.15,
        duration: 1.4,
        ease: 'power3.inOut',
      });

      if (doorLightRef.current) {
        gsap.to(doorLightRef.current, {
          intensity: 2.2,
          duration: 0.9,
        });
      }
      if (interiorLightRef.current) {
        gsap.to(interiorLightRef.current, {
          intensity: 3.4,
          duration: 1.0,
        });
      }
      return;
    }

    // Stepping back outside the house
    if (stageOffsetRef.current) {
      gsap.to(stageOffsetRef.current.position, {
        x: isMobile ? 0 : 0.72,
        y: -0.18,
        z: 0,
        duration: 0.9,
        ease: 'power3.out',
      });
      gsap.to(stageOffsetRef.current.scale, {
        x: isMobile ? 0.58 : 0.58,
        y: isMobile ? 0.58 : 0.58,
        z: isMobile ? 0.58 : 0.58,
        duration: 0.9,
        ease: 'power3.out',
      });
    }

    const baseCamX = isMobile ? 0.2 : 0.5;
    const baseCamY = isMobile ? 2.35 : 2.75;
    const baseCamZ = isMobile ? 6.2 : 7.3;

    gsap.to(camera.position, {
      x: baseCamX,
      y: baseCamY,
      z: baseCamZ,
      duration: 1.15,
      ease: 'power3.out',
    });

    gsap.to(lookAtTarget.current, {
      x: isMobile ? 0 : -1.25,
      y: isMobile ? -0.05 : 0.08,
      z: 0,
      duration: 1.15,
      ease: 'power3.out',
    });

    if (houseRootRef.current) {
      gsap.to(houseRootRef.current.rotation, {
        y: -0.22 + userRotationOffset.current,
        duration: 0.9,
        ease: 'power2.out',
      });
    }

    if (doorPivotRef.current) {
      gsap.to(doorPivotRef.current.rotation, {
        y: -0.85,
        duration: 0.9,
        ease: 'power2.out',
      });
    }

    if (doorLightRef.current) {
      gsap.to(doorLightRef.current, {
        intensity: 1.4,
        duration: 0.6,
      });
    }
    if (interiorLightRef.current) {
      gsap.to(interiorLightRef.current, {
        intensity: 1.2,
        duration: 0.6,
      });
    }
  }, [isSubmitted, isMobile, camera]);

  // 2. Neighboring houses pop in/out when cycling words outside (never moves the camera!)
  useEffect(() => {
    if (isSubmitted) return;
    const stage =
      WORD_STAGES.find((s) => s.word === currentWord) || WORD_STAGES[0];

    neighborSpecs.forEach((spec, idx) => {
      const grp = neighborRefs.current[idx];
      if (!grp) return;
      const visible = stage.visibleHouses >= spec.minStageHouses;
      const targetScale = visible ? spec.scale : 0.001;
      gsap.to(grp.scale, {
        x: targetScale,
        y: targetScale,
        z: targetScale,
        duration: visible ? 0.65 : 0.35,
        delay: visible ? idx * 0.06 : 0,
        ease: 'power2.out',
      });
    });
  }, [currentWord, isSubmitted, neighborSpecs]);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    camera.lookAt(lookAtTarget.current);

    // Gentle rising steam puffs from the warm welcome cup on the coffee table
    steamRefs.current.forEach((steam, i) => {
      if (!steam) return;
      const cycle = (t * 0.55 + i * 0.33) % 1;
      steam.position.y = 0.14 + cycle * 0.18;
      steam.position.x = Math.sin(t * 2 + i) * 0.015;
      const s = Math.sin(cycle * Math.PI) * 0.024;
      steam.scale.set(s, s, s);
    });

    // Miniature white-and-emerald Serbizio dispatch van orbiting the street
    if (vanRef.current) {
      const angle = t * 0.65;
      const radius = 2.02;
      vanRef.current.position.x = Math.cos(angle) * radius;
      vanRef.current.position.z = Math.sin(angle) * radius;
      vanRef.current.rotation.y = -angle;
    }
  });

  const handlePointerDown = (e: any) => {
    if (isSubmitted) return;
    e.stopPropagation();
    setIsDragging(true);
    dragStartX.current = e.clientX ?? 0;
  };

  const handlePointerMove = (e: any) => {
    if (isSubmitted || !isDragging || !houseRootRef.current) return;
    const clientX = e.clientX ?? 0;
    const deltaX = (clientX - dragStartX.current) * 0.011;
    dragStartX.current = clientX;
    userRotationOffset.current += deltaX;
    houseRootRef.current.rotation.y += deltaX;
  };

  const handlePointerUp = () => {
    setIsDragging(false);
  };

  const handleBounceHouse = (_targetGroup: THREE.Group | null, id: number) => {
    if (isSubmitted) {
      onReplayConfetti();
      return;
    }
    setBoostedHouses((prev) => ({ ...prev, [id]: !prev[id] }));
    onAdvanceWord();
  };

  return (
    <>
      <ambientLight intensity={1.45} />
      <directionalLight
        position={[5.5, 8.5, 6.0]}
        intensity={1.85}
        color="#FFFFFF"
        castShadow
      />
      <directionalLight
        position={[-5.0, 4.0, -3.5]}
        intensity={0.8}
        color="#6EE7B7"
      />
      <group
        ref={stageOffsetRef}
        position={isMobile ? [0, -0.18, 0] : [0.72, -0.18, 0]}
        scale={0.58}
      >
        <pointLight
          ref={doorLightRef}
          position={[0, 0.3, 1.35]}
          intensity={1.4}
          color="#34D399"
          distance={4.0}
        />
        <pointLight
          ref={interiorLightRef}
          position={[-0.11, 0.42, -0.15]}
          intensity={1.2}
          color="#FDE68A"
          distance={4.2}
        />

        {/* Interactive White Porcelain Wave Floor */}
        <PorcelainWaveFloor
          pulseTick={pulseTick}
          onTileClick={() => {
            if (!isSubmitted) onAdvanceWord();
          }}
        />

        {/* Grounded, Steady Sanctuary Neighborhood Assembly */}
        <group
          ref={houseRootRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
        >
          {/* Layered White Porcelain Architectural Plinth */}
          <RoundedBox
            args={[4.7, 0.22, 4.3]}
            radius={0.1}
            smoothness={4}
            position={[0, -0.82, 0]}
            receiveShadow
          >
            <meshStandardMaterial
              color="#FFFFFF"
              roughness={0.16}
              metalness={0.04}
            />
          </RoundedBox>

          {/* Soft Mint Lawn / Terrace Pad */}
          <RoundedBox
            args={[4.3, 0.12, 3.9]}
            radius={0.08}
            smoothness={4}
            position={[0, -0.68, 0]}
            receiveShadow
          >
            <meshStandardMaterial
              color="#E6F7EE"
              roughness={0.4}
              metalness={0.02}
            />
          </RoundedBox>

          {/* Miniature White & Emerald Serbizio Van Gliding Around the Street */}
          <group ref={vanRef} position={[2.0, -0.52, 0]}>
            <RoundedBox args={[0.26, 0.18, 0.44]} radius={0.04}>
              <meshStandardMaterial color="#FFFFFF" roughness={0.18} />
            </RoundedBox>
            <RoundedBox
              args={[0.27, 0.05, 0.45]}
              radius={0.02}
              position={[0, -0.03, 0]}
            >
              <meshStandardMaterial
                color="#159947"
                emissive="#10B981"
                emissiveIntensity={0.4}
              />
            </RoundedBox>
          </group>

          {/* Main Architectural Hollow White House with Furnished Living Room Inside */}
          <group
            onClick={(e) => {
              e.stopPropagation();
              handleBounceHouse(houseRootRef.current, 0);
            }}
          >
            {/* Deepened Back Wall so the Living Room is Spacious */}
            <RoundedBox
              args={[2.05, 1.42, 0.12]}
              radius={0.03}
              position={[-0.12, 0.1, -1.18]}
              castShadow
              receiveShadow
            >
              <meshStandardMaterial color="#FFFDF8" roughness={0.24} />
            </RoundedBox>

            {/* Left Wall */}
            <RoundedBox
              args={[0.12, 1.42, 2.22]}
              radius={0.03}
              position={[-1.08, 0.1, -0.12]}
              castShadow
              receiveShadow
            >
              <meshStandardMaterial color="#FFFFFF" roughness={0.2} />
            </RoundedBox>

            {/* Right Wall */}
            <RoundedBox
              args={[0.12, 1.42, 2.22]}
              radius={0.03}
              position={[0.84, 0.1, -0.12]}
              castShadow
              receiveShadow
            >
              <meshStandardMaterial color="#FFFFFF" roughness={0.2} />
            </RoundedBox>

            {/* Front Wall - Left of Doorway */}
            <RoundedBox
              args={[0.76, 1.42, 0.12]}
              radius={0.03}
              position={[-0.76, 0.1, 0.96]}
              castShadow
              receiveShadow
            >
              <meshStandardMaterial color="#FFFFFF" roughness={0.18} />
            </RoundedBox>

            {/* Front Wall - Right of Doorway */}
            <RoundedBox
              args={[0.76, 1.42, 0.12]}
              radius={0.03}
              position={[0.52, 0.1, 0.96]}
              castShadow
              receiveShadow
            >
              <meshStandardMaterial color="#FFFFFF" roughness={0.18} />
            </RoundedBox>

            {/* Front Wall - Top Lintel Above Doorway */}
            <RoundedBox
              args={[0.58, 0.56, 0.12]}
              radius={0.02}
              position={[-0.12, 0.53, 0.96]}
              castShadow
              receiveShadow
            >
              <meshStandardMaterial color="#FFFFFF" roughness={0.18} />
            </RoundedBox>

            {/* Interior Ceiling & Gable Closure Slab */}
            <RoundedBox
              args={[2.04, 0.12, 2.22]}
              radius={0.03}
              position={[-0.12, 0.82, -0.12]}
              castShadow
              receiveShadow
            >
              <meshStandardMaterial color="#FFFFFF" roughness={0.2} />
            </RoundedBox>

            {/* === FURNISHED LIVING ROOM INTERIOR INSIDE THE HOUSE === */}
            <group position={[-0.12, -0.56, -0.25]}>
              {/* Warm Interior Floor */}
              <RoundedBox
                args={[1.84, 0.04, 2.08]}
                radius={0.01}
                position={[0, 0, 0]}
                receiveShadow
              >
                <meshStandardMaterial color="#EEDCC5" roughness={0.32} />
              </RoundedBox>

              {/* Soft Mint Woven Area Rug */}
              <RoundedBox
                args={[1.28, 0.02, 1.05]}
                radius={0.01}
                position={[0, 0.025, -0.12]}
              >
                <meshStandardMaterial color="#D1FAE5" roughness={0.6} />
              </RoundedBox>

              {/* Warm Wooden Architectural Accent Slats on Left & Right Back Wall */}
              {[-0.82, -0.75, -0.68, 0.68, 0.75, 0.82].map((sx, idx) => (
                <RoundedBox
                  key={idx}
                  args={[0.035, 1.28, 0.04]}
                  radius={0.01}
                  position={[sx, 0.64, -0.86]}
                >
                  <meshStandardMaterial color="#D9A066" roughness={0.35} />
                </RoundedBox>
              ))}

              {/* Cozy Modern Sofa Against Back Wall */}
              <group position={[0, 0.11, -0.64]}>
                {/* Sofa Seat */}
                <RoundedBox args={[0.96, 0.16, 0.36]} radius={0.05} position={[0, 0, 0]}>
                  <meshStandardMaterial color="#FFFFFF" roughness={0.3} />
                </RoundedBox>
                {/* Sofa Backrest */}
                <RoundedBox args={[0.96, 0.32, 0.12]} radius={0.05} position={[0, 0.14, -0.14]}>
                  <meshStandardMaterial color="#F8FAFC" roughness={0.3} />
                </RoundedBox>
                {/* Left & Right Armrests */}
                <RoundedBox args={[0.12, 0.25, 0.38]} radius={0.04} position={[-0.46, 0.05, 0]}>
                  <meshStandardMaterial color="#FFFFFF" roughness={0.3} />
                </RoundedBox>
                <RoundedBox args={[0.12, 0.25, 0.38]} radius={0.04} position={[0.46, 0.05, 0]}>
                  <meshStandardMaterial color="#FFFFFF" roughness={0.3} />
                </RoundedBox>
                {/* Emerald & Gold Throw Pillows */}
                <RoundedBox
                  args={[0.17, 0.17, 0.08]}
                  radius={0.04}
                  position={[-0.26, 0.12, -0.04]}
                  rotation={[0, 0, 0.18]}
                >
                  <meshStandardMaterial color="#159947" roughness={0.35} />
                </RoundedBox>
                <RoundedBox
                  args={[0.17, 0.17, 0.08]}
                  radius={0.04}
                  position={[0.26, 0.12, -0.04]}
                  rotation={[0, 0, -0.15]}
                >
                  <meshStandardMaterial color="#FBBF24" roughness={0.35} />
                </RoundedBox>
              </group>

              {/* Warm Oak Coffee Table & Steaming Welcome Cup in Foreground */}
              <group position={[0, 0.06, -0.26]}>
                <RoundedBox args={[0.52, 0.035, 0.24]} radius={0.02} position={[0, 0.06, 0]}>
                  <meshStandardMaterial color="#C68B59" roughness={0.28} />
                </RoundedBox>
                {/* Emerald Welcome Tray */}
                <RoundedBox args={[0.22, 0.015, 0.14]} radius={0.01} position={[0, 0.085, 0]}>
                  <meshStandardMaterial
                    color="#159947"
                    roughness={0.25}
                  />
                </RoundedBox>
                {/* Warm Ceramic Cup */}
                <mesh position={[-0.04, 0.115, 0]}>
                  <cylinderGeometry args={[0.032, 0.026, 0.055, 16]} />
                  <meshStandardMaterial color="#FFFFFF" roughness={0.15} />
                </mesh>
                {/* Golden Key Badge on Tray */}
                <mesh position={[0.05, 0.098, 0]} rotation={[Math.PI / 2, 0, 0.4]}>
                  <torusGeometry args={[0.022, 0.007, 10, 20]} />
                  <meshStandardMaterial color="#FBBF24" metalness={0.7} roughness={0.2} />
                </mesh>
                {/* Rising Steam Spheres */}
                {[0, 1, 2].map((stIdx) => (
                  <mesh
                    key={stIdx}
                    ref={(el) => {
                      steamRefs.current[stIdx] = el;
                    }}
                    position={[-0.04, 0.16, 0]}
                  >
                    <sphereGeometry args={[1, 10, 10]} />
                    <meshBasicMaterial color="#FFFFFF" transparent opacity={0.65} />
                  </mesh>
                ))}
              </group>

              {/* Warm Glowing Floor Lamp on Left */}
              <group position={[-0.64, 0.02, -0.58]}>
                <mesh position={[0, 0.28, 0]}>
                  <cylinderGeometry args={[0.02, 0.025, 0.56, 12]} />
                  <meshStandardMaterial color="#D97706" metalness={0.6} roughness={0.2} />
                </mesh>
                <mesh position={[0, 0.58, 0]}>
                  <cylinderGeometry args={[0.09, 0.14, 0.2, 20]} />
                  <meshStandardMaterial
                    color="#FEF3C7"
                    emissive="#FBBF24"
                    emissiveIntensity={1.35}
                  />
                </mesh>
              </group>

              {/* Indoor Potted Plant on Right */}
              <group position={[0.62, 0.08, -0.56]}>
                <mesh position={[0, 0.06, 0]}>
                  <cylinderGeometry args={[0.09, 0.07, 0.16, 16]} />
                  <meshStandardMaterial color="#FFFFFF" roughness={0.2} />
                </mesh>
                <mesh position={[0, 0.24, 0]}>
                  <sphereGeometry args={[0.15, 16, 16]} />
                  <meshStandardMaterial color="#159947" roughness={0.4} />
                </mesh>
              </group>

              {/* Sleek Split-Type Aircon Mounted on Right Interior Wall */}
              <RoundedBox
                args={[0.12, 0.14, 0.58]}
                radius={0.03}
                position={[0.86, 0.92, -0.45]}
              >
                <meshStandardMaterial color="#FFFFFF" roughness={0.15} />
              </RoundedBox>

              {/* === WALL-PAINTED WELCOME MURAL DIRECTLY ON THE 3D BACK WALL === */}
              {isSubmitted && submittedEmail && (
                <Html
                  transform
                  position={[0, 0.72, -0.85]}
                  distanceFactor={0.78}
                  zIndexRange={[10, 0]}
                >
                  <div
                    className="wall-painted-mural"
                    onPointerDown={(e) => e.stopPropagation()}
                  >
                    <div className="wall-painted-eyebrow">
                      ✦ TULOY PO KAYO · WELCOME HOME ✦
                    </div>

                    <h2 className="wall-painted-headline">
                      Make yourself at home.
                    </h2>

                    <p className="wall-painted-subtext">
                      The light is warm, the air is cool, and your front-door spot is saved.
                    </p>

                    <div className="wall-painted-divider" />

                    <div
                      className="wall-painted-notify"
                      onClick={(e) => {
                        e.stopPropagation();
                        onReplayConfetti();
                      }}
                      title="Click to pop confetti"
                    >
                      We&apos;ll notify{' '}
                      <span className="wall-painted-email">{submittedEmail}</span>{' '}
                      on launch day.
                    </div>

                    <div className="wall-painted-footer">
                      <span>One email on launch day. Nothing else.</span>
                      <span className="wall-painted-dot">·</span>
                      <button
                        type="button"
                        className="wall-painted-back-link"
                        onClick={(e) => {
                          e.stopPropagation();
                          onStepOutside();
                        }}
                      >
                        ← Step back outside
                      </button>
                    </div>
                  </div>
                </Html>
              )}
            </group>

            {/* Right Studio Wing */}
            <RoundedBox
              args={[0.92, 1.12, 1.45]}
              radius={0.05}
              smoothness={4}
              position={[0.98, -0.05, 0.2]}
              castShadow
              receiveShadow
            >
              <meshStandardMaterial
                color="#F6FCF9"
                roughness={0.22}
                metalness={0.03}
              />
            </RoundedBox>

            {/* Modern Pitched Roof - Left Slope */}
            <RoundedBox
              args={[1.48, 0.14, 2.45]}
              radius={0.04}
              smoothness={3}
              position={[-0.65, 1.06, -0.1]}
              rotation={[0, 0, 0.54]}
              castShadow
            >
              <meshStandardMaterial
                color="#07361F"
                roughness={0.32}
                metalness={0.12}
              />
            </RoundedBox>

            {/* Modern Pitched Roof - Right Slope */}
            <RoundedBox
              args={[1.48, 0.14, 2.45]}
              radius={0.04}
              smoothness={3}
              position={[0.42, 1.06, -0.1]}
              rotation={[0, 0, -0.54]}
              castShadow
            >
              <meshStandardMaterial
                color="#0A4528"
                roughness={0.32}
                metalness={0.12}
              />
            </RoundedBox>

            {/* Flat Roof Overhang on Studio Wing */}
            <RoundedBox
              args={[1.04, 0.1, 1.6]}
              radius={0.03}
              smoothness={3}
              position={[1.02, 0.54, 0.2]}
              castShadow
            >
              <meshStandardMaterial color="#159947" roughness={0.28} />
            </RoundedBox>

            {/* Front Porch Canopy & White Steps */}
            <RoundedBox
              args={[0.88, 0.08, 0.48]}
              radius={0.02}
              position={[-0.12, 0.34, 1.15]}
            >
              <meshStandardMaterial color="#159947" roughness={0.25} />
            </RoundedBox>
            <RoundedBox
              args={[0.84, 0.09, 0.46]}
              radius={0.03}
              position={[-0.12, -0.58, 1.2]}
            >
              <meshStandardMaterial color="#FFFFFF" roughness={0.2} />
            </RoundedBox>

            {/* 3D Confetti Bursting Out of the Open Front Doorway */}
            <ConfettiBurst3D
              active={isSubmitted}
              triggerTick={celebrationTick}
            />

            {/* Interactive Pivoted Front Door */}
            <group ref={doorPivotRef} position={[-0.37, -0.16, 1.02]}>
              <RoundedBox
                args={[0.5, 0.84, 0.06]}
                radius={0.02}
                position={[0.25, 0, 0]}
              >
                <meshStandardMaterial color="#159947" roughness={0.25} />
              </RoundedBox>
              <mesh position={[0.42, -0.02, 0.045]}>
                <sphereGeometry args={[0.035, 16, 16]} />
                <meshStandardMaterial
                  color="#FBBF24"
                  metalness={0.7}
                  roughness={0.2}
                />
              </mesh>
            </group>

            {/* Glowing Architectural Windows */}
            {[
              [-0.72, 0.14, 1.02],
              [0.48, 0.14, 1.02],
              [0.98, 0.04, 0.94],
            ].map((pos, idx) => (
              <group key={idx} position={pos as [number, number, number]}>
                <RoundedBox args={[0.42, 0.46, 0.04]} radius={0.02}>
                  <meshStandardMaterial color="#07361F" roughness={0.3} />
                </RoundedBox>
                <mesh position={[0, 0, 0.025]}>
                  <planeGeometry args={[0.32, 0.36]} />
                  <meshStandardMaterial
                    color={boostedHouses[0] ? '#34D399' : '#A7F3D0'}
                    emissive={boostedHouses[0] ? '#10B981' : '#6EE7B7'}
                    emissiveIntensity={0.75}
                    roughness={0.1}
                  />
                </mesh>
              </group>
            ))}
          </group>

          {/* Neighboring White Porcelain Houses (pop in for street / barangay / neighborhood) */}
          {neighborSpecs.map((spec, idx) => (
            <group
              key={spec.id}
              ref={(el) => {
                neighborRefs.current[idx] = el;
              }}
              position={spec.pos}
              rotation={[0, spec.rotY, 0]}
              scale={[0.001, 0.001, 0.001]}
              onClick={(e) => {
                e.stopPropagation();
                handleBounceHouse(neighborRefs.current[idx], spec.id);
              }}
            >
              <RoundedBox
                args={[1.25, 1.0, 1.1]}
                radius={0.05}
                smoothness={3}
                position={[0, 0.2, 0]}
                castShadow
                receiveShadow
              >
                <meshStandardMaterial color="#FFFFFF" roughness={0.2} />
              </RoundedBox>
              <RoundedBox
                args={[0.92, 0.12, 1.25]}
                radius={0.03}
                position={[-0.36, 0.84, 0]}
                rotation={[0, 0, 0.52]}
                castShadow
              >
                <meshStandardMaterial color={spec.roofColor} roughness={0.3} />
              </RoundedBox>
              <RoundedBox
                args={[0.92, 0.12, 1.25]}
                radius={0.03}
                position={[0.36, 0.84, 0]}
                rotation={[0, 0, -0.52]}
                castShadow
              >
                <meshStandardMaterial color={spec.roofColor} roughness={0.3} />
              </RoundedBox>
              <mesh position={[0, 0.18, 0.56]}>
                <planeGeometry args={[0.34, 0.34]} />
                <meshStandardMaterial
                  color="#A7F3D0"
                  emissive="#34D399"
                  emissiveIntensity={boostedHouses[spec.id] ? 1.1 : 0.6}
                />
              </mesh>
            </group>
          ))}

          {/* Landscaped Minimalist Emerald Trees / Shrubs */}
          {[
            [-1.25, -0.35, 1.25, 0.25],
            [1.25, -0.38, 1.18, 0.22],
            [-1.85, -0.32, -0.65, 0.28],
            [1.92, -0.34, -0.98, 0.24],
          ].map(([x, y, z, r], idx) => (
            <group key={idx} position={[x, y, z]}>
              <mesh position={[0, r * 0.6, 0]} castShadow>
                <sphereGeometry args={[r, 20, 20]} />
                <meshStandardMaterial color="#159947" roughness={0.45} />
              </mesh>
              <mesh position={[0, -0.1, 0]}>
                <cylinderGeometry args={[0.04, 0.05, 0.25, 10]} />
                <meshStandardMaterial color="#07361F" />
              </mesh>
            </group>
          ))}
        </group>

        {/* Ambient Emerald Sparkles around the Home */}
        <Sparkles
          count={isSubmitted ? 85 : 36}
          scale={[6.5, 3.5, 5.5]}
          size={isSubmitted ? 3.2 : 2.2}
          speed={isSubmitted ? 1.1 : 0.45}
          opacity={0.55}
          color="#159947"
        />

      </group>
    </>
  );
};

export const SerbizioHomeScene: React.FC<SerbizioHomeSceneProps> = (props) => {
  return (
    <div className="r3f-stage-wrapper" aria-label="Interactive 3D Serbizio Home Sanctuary">
      <Canvas
        shadows
        dpr={[1, 2]}
        camera={{ position: [3.2, 2.3, 4.7], fov: 36 }}
        gl={{ antialias: true, alpha: true }}
      >
        <SanctuaryContent {...props} />
      </Canvas>
    </div>
  );
};
