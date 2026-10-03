/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  HÀO KHÍ ĐẠI VIỆT — 3D WATER PLANE & PANORAMIC RIVER HORIZON
 * ═══════════════════════════════════════════════════════════════════════════
 *
 *  Cinematic river environment for Bạch Đằng 1288:
 *  - Alluvial sandbar island base supporting the battlefield
 *  - Expansive animated river water with tide bobbing & golden sheen
 *  - Distant Tràng Kênh limestone karst mountain silhouettes
 *  - Sunset river twilight horizon backdrop (eliminating any black void)
 * ═══════════════════════════════════════════════════════════════════════════
 */

import React, { useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';

export const WaterPlane3D: React.FC<{ tideTurnsLeft: number }> = ({ tideTurnsLeft }) => {
  const waterRef = useRef<THREE.Mesh>(null);
  const foamRef = useRef<THREE.Mesh>(null);

  // Gentle river tide and surface current animation
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    const tideOffset = tideTurnsLeft <= 1 ? -0.09 : 0.0;

    if (waterRef.current) {
      waterRef.current.position.y = -0.32 + Math.sin(t * 1.2) * 0.015 + tideOffset;
    }
    if (foamRef.current) {
      foamRef.current.position.y = -0.31 + Math.cos(t * 1.5) * 0.01 + tideOffset;
    }
  });

  return (
    <group>
      {/* ── 1. ALLUVIAL SANDBAR ISLAND BED (Bãi bồi phù sa nâng đỡ lưới hex) ── */}
      <mesh position={[0, -0.42, 0]} receiveShadow>
        <cylinderGeometry args={[13.8, 14.8, 0.45, 36]} />
        <meshStandardMaterial
          color="#33271c"
          roughness={0.92}
          metalness={0.06}
        />
      </mesh>
      {/* Sandbar shoreline fringe */}
      <mesh position={[0, -0.22, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[13.2, 14.6, 36]} />
        <meshStandardMaterial
          color="#423425"
          roughness={0.96}
          transparent
          opacity={0.7}
        />
      </mesh>

      {/* ── 2. PRIMARY EXPANSIVE BẠCH ĐẰNG RIVER SURFACE (130m × 95m) ── */}
      <mesh ref={waterRef} position={[0, -0.32, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[130, 95, 48, 48]} />
        <meshStandardMaterial
          color="#12354a"
          roughness={0.16}
          metalness={0.78}
          transparent
          opacity={0.92}
        />
      </mesh>

      {/* Surface current shimmer / sunset golden reflection */}
      <mesh ref={foamRef} position={[0, -0.31, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[128, 92, 16, 16]} />
        <meshBasicMaterial
          color="#f59e0b"
          transparent
          opacity={0.07}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* ── 3. DISTANT LIMESTONE KARST MOUNTAINS (Dãy núi Tràng Kênh) ── */}
      <group position={[0, 0, -26]}>
        {/* Layer 1: Foreground limestone peaks */}
        {[
          [-18, 2.5, 0, 6, 8],
          [-9, 3.8, -2, 7, 11],
          [2, 3.2, -1, 6.5, 9.5],
          [12, 4.2, -3, 8, 12],
          [22, 2.8, 0, 6, 8.5],
        ].map(([px, py, pz, r, h], idx) => (
          <mesh key={idx} position={[px, py, pz]}>
            <coneGeometry args={[r, h, 6]} />
            <meshStandardMaterial
              color="#0e2330"
              roughness={0.95}
              metalness={0.05}
            />
          </mesh>
        ))}

        {/* Layer 2: Misty background peaks */}
        {[
          [-24, 4.5, -6, 9, 13],
          [-4, 5.2, -7, 10, 15],
          [7, 4.8, -8, 9.5, 14],
          [19, 5.0, -7, 10, 14.5],
        ].map(([px, py, pz, r, h], idx) => (
          <mesh key={idx} position={[px, py, pz]}>
            <coneGeometry args={[r, h, 5]} />
            <meshStandardMaterial
              color="#0a1924"
              roughness={0.98}
              transparent
              opacity={0.85}
            />
          </mesh>
        ))}
      </group>

      {/* ── 4. ATMOSPHERIC SUNSET HORIZON BACKDROP (Loại bỏ khoảng đen) ── */}
      <mesh position={[0, 8, -36]}>
        <planeGeometry args={[140, 36]} />
        <meshBasicMaterial
          color="#18364c"
          transparent
          opacity={0.95}
        />
      </mesh>
      {/* Warm evening horizon glow strip right above water line */}
      <mesh position={[0, 1.8, -35.5]}>
        <planeGeometry args={[140, 7]} />
        <meshBasicMaterial
          color="#d97736"
          transparent
          opacity={0.32}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    </group>
  );
};
