/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  HÀO KHÍ ĐẠI VIỆT — LAM SƠN 3D ENVIRONMENT (KHỞI NGHĨA LAM SƠN)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 *  A majestic Northern/Central Vietnamese Mountain Forest Diorama.
 *
 *  THEME:
 *  - Rugged Limestone Karst Mountain Ridges (Dãy núi đá vôi Thanh Hóa / Chi Lăng)
 *  - Dense Pine & Bamboo Forest Perimeter
 *  - Guerrilla Mountain Outpost & Warm Campfire (Doanh trại phục binh Lam Sơn)
 *  - Invading Minh Supply Depot (Trại lương thảo quân Minh viễn cảnh)
 *  - Rocky Stream Bed & Morning Mountain Mist — NO black void!
 *
 *  SAFETY & PLACEMENT CONTRACT:
 *  - All environmental assets sit strictly in the northern backdrop (z <= -7.0)
 *    or lateral flanks (|x| >= 12.0).
 *  - Playable battlefield grid (z = -5.2 to +5.2) is 100% visible and unobstructed.
 *  - Base plane lies flat horizontally: rotation.x = -Math.PI / 2 at y = -0.25.
 * ═══════════════════════════════════════════════════════════════════════════
 */

import React from 'react';
import * as THREE from 'three';

// ─────────────────────────────────────────────────────────────────────────
// 1. MOUNTAIN KARST PEAK (Núi Đá Vôi Lam Sơn)
// ─────────────────────────────────────────────────────────────────────────
const KarstMountainPeak: React.FC<{
  position: [number, number, number];
  height?: number;
  radius?: number;
}> = ({ position, height = 5.5, radius = 4.2 }) => {
  return (
    <group position={position}>
      {/* Lower rugged limestone body */}
      <mesh position={[0, height * 0.45, 0]} castShadow receiveShadow>
        <coneGeometry args={[radius, height, 6]} />
        <meshStandardMaterial color="#475246" roughness={0.92} metalness={0.08} />
      </mesh>
      {/* Vegetative moss & cliff foliage ring */}
      <mesh position={[0, height * 0.35, 0]}>
        <coneGeometry args={[radius * 1.05, height * 0.35, 6]} />
        <meshStandardMaterial color="#2d4229" roughness={0.95} />
      </mesh>
      {/* Upper jagged rock pinnacle */}
      <mesh position={[0, height * 0.85, 0]}>
        <coneGeometry args={[radius * 0.45, height * 0.35, 5]} />
        <meshStandardMaterial color="#556054" roughness={0.88} />
      </mesh>
    </group>
  );
};

// ─────────────────────────────────────────────────────────────────────────
// 2. MOUNTAIN PINE TREE (Cây Thông Rừng Già)
// ─────────────────────────────────────────────────────────────────────────
const MountainPineTree: React.FC<{
  position: [number, number, number];
  scale?: number;
}> = ({ position, scale = 1.0 }) => {
  return (
    <group position={position} scale={scale}>
      {/* Dark weathered timber trunk */}
      <mesh position={[0, 0.9, 0]} castShadow>
        <cylinderGeometry args={[0.08, 0.14, 1.8, 6]} />
        <meshStandardMaterial color="#352317" roughness={0.9} />
      </mesh>
      {/* 3 Tiered foliage cones */}
      <mesh position={[0, 1.7, 0]} castShadow>
        <coneGeometry args={[0.85, 1.1, 6]} />
        <meshStandardMaterial color="#1e3b20" roughness={0.85} />
      </mesh>
      <mesh position={[0, 2.3, 0]} castShadow>
        <coneGeometry args={[0.68, 0.9, 6]} />
        <meshStandardMaterial color="#254828" roughness={0.82} />
      </mesh>
      <mesh position={[0, 2.85, 0]} castShadow>
        <coneGeometry args={[0.48, 0.75, 5]} />
        <meshStandardMaterial color="#2f5732" roughness={0.8} />
      </mesh>
    </group>
  );
};

// ─────────────────────────────────────────────────────────────────────────
// 3. BAMBOO GROVE (Khóm Tre Rừng Nứa)
// ─────────────────────────────────────────────────────────────────────────
const MountainBambooCluster: React.FC<{
  position: [number, number, number];
}> = ({ position }) => {
  const stalks = [
    [-0.25, -0.2, 2.2, 0.035],
    [0.2, -0.15, 2.5, 0.04],
    [-0.1, 0.25, 2.0, 0.03],
    [0.25, 0.2, 2.3, 0.035],
  ];

  return (
    <group position={position}>
      {stalks.map(([sx, sz, sh, sr], idx) => (
        <group key={idx} position={[sx, 0, sz]}>
          <mesh position={[0, sh * 0.5, 0]} castShadow>
            <cylinderGeometry args={[sr * 0.8, sr, sh, 5]} />
            <meshStandardMaterial color="#4d7c2a" roughness={0.7} />
          </mesh>
          {/* Foliage cluster */}
          <mesh position={[0, sh + 0.15, 0]}>
            <sphereGeometry args={[0.35, 6, 6]} />
            <meshStandardMaterial color="#3b681f" roughness={0.8} />
          </mesh>
        </group>
      ))}
    </group>
  );
};

// ─────────────────────────────────────────────────────────────────────────
// 4. GUERRILLA CAMPFIRE & OUTPOST (Tiền Đồn Phục Binh Lam Sơn)
// ─────────────────────────────────────────────────────────────────────────
const LamSonGuerrillaCamp: React.FC<{
  position: [number, number, number];
}> = ({ position }) => {
  return (
    <group position={position}>
      {/* Rustic thatched wooden lean-to shelter */}
      <mesh position={[0, 1.1, 0]} castShadow receiveShadow>
        <boxGeometry args={[2.4, 0.1, 1.8]} />
        <meshStandardMaterial color="#4a3321" roughness={0.9} />
      </mesh>
      {/* 4 Support poles */}
      {[
        [-1.0, -0.7, 1.0],
        [1.0, -0.7, 1.0],
        [-1.0, 0.7, 1.4],
        [1.0, 0.7, 1.4],
      ].map(([px, pz, ph], idx) => (
        <mesh key={idx} position={[px, ph * 0.5, pz]} castShadow>
          <cylinderGeometry args={[0.04, 0.05, ph, 5]} />
          <meshStandardMaterial color="#2d1c12" roughness={0.9} />
        </mesh>
      ))}

      {/* Campfire stone ring */}
      <group position={[0, 0, 1.8]}>
        {[0, 1, 2, 3, 4, 5].map((i) => {
          const ang = (i / 6) * Math.PI * 2;
          return (
            <mesh key={i} position={[Math.cos(ang) * 0.35, 0.06, Math.sin(ang) * 0.35]}>
              <sphereGeometry args={[0.08, 6, 6]} />
              <meshStandardMaterial color="#504a43" roughness={0.85} />
            </mesh>
          );
        })}
        {/* Burning Embers */}
        <mesh position={[0, 0.12, 0]}>
          <coneGeometry args={[0.16, 0.28, 6]} />
          <meshBasicMaterial color="#ea580c" />
        </mesh>
        {/* Warm campfire light */}
        <pointLight position={[0, 0.35, 0]} color="#f97316" intensity={0.9} distance={4.5} />
      </group>

      {/* Resistance banner */}
      <group position={[-1.2, 0, 0]}>
        <mesh position={[0, 1.3, 0]}>
          <cylinderGeometry args={[0.03, 0.04, 2.6, 5]} />
          <meshStandardMaterial color="#352317" />
        </mesh>
        <mesh position={[0.3, 2.1, 0]}>
          <planeGeometry args={[0.55, 0.7]} />
          <meshStandardMaterial color="#1b4324" side={THREE.DoubleSide} />
        </mesh>
      </group>
    </group>
  );
};

// ─────────────────────────────────────────────────────────────────────────
// 5. ENEMY SUPPLY DEPOT (Trại Hậu Cần Quân Minh — Viễn Cảnh)
// ─────────────────────────────────────────────────────────────────────────
const MinhSupplyDepot: React.FC<{
  position: [number, number, number];
}> = ({ position }) => {
  return (
    <group position={position}>
      {/* Imperial military pavilion tent */}
      <mesh position={[0, 1.0, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.1, 1.4, 2.0, 6]} />
        <meshStandardMaterial color="#7f1d1d" roughness={0.7} />
      </mesh>
      {/* Gold crest */}
      <mesh position={[0, 2.08, 0]}>
        <sphereGeometry args={[0.1, 8, 8]} />
        <meshStandardMaterial color="#d97706" metalness={0.8} />
      </mesh>

      {/* Wooden supply crates & barrels */}
      {[-1.2, 1.1].map((cx, idx) => (
        <group key={idx} position={[cx, 0, 0.8]}>
          <mesh position={[0, 0.3, 0]} castShadow>
            <boxGeometry args={[0.6, 0.6, 0.6]} />
            <meshStandardMaterial color="#54371f" roughness={0.85} />
          </mesh>
          <mesh position={[0.2, 0.72, 0]} castShadow>
            <boxGeometry args={[0.45, 0.35, 0.45]} />
            <meshStandardMaterial color="#452c18" roughness={0.85} />
          </mesh>
        </group>
      ))}

      {/* Minh army military standard */}
      <group position={[1.4, 0, -0.6]}>
        <mesh position={[0, 1.4, 0]}>
          <cylinderGeometry args={[0.03, 0.04, 2.8, 5]} />
          <meshStandardMaterial color="#2d1c12" />
        </mesh>
        <mesh position={[-0.32, 2.2, 0]}>
          <planeGeometry args={[0.6, 0.75]} />
          <meshStandardMaterial color="#991b1b" side={THREE.DoubleSide} />
        </mesh>
      </group>
    </group>
  );
};

// ─────────────────────────────────────────────────────────────────────────
// 6. BASE TERRAIN & DISTANT MOUNTAIN BACKDROP
// ─────────────────────────────────────────────────────────────────────────
const LamSonBaseTerrain: React.FC = () => {
  return (
    <group>
      {/* Broad Forest Base Terrain — flat horizontal mossy earth plane beneath all hexes */}
      <mesh position={[0, -0.25, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[90, 70]} />
        <meshStandardMaterial color="#293923" roughness={0.95} metalness={0.02} />
      </mesh>

      {/* Rocky Cliff Ridges along the northern backdrop (z = -8.5 to -10.5) */}
      {[-8.5, 0, 8.5].map((cx, idx) => (
        <mesh key={idx} position={[cx, 0.9, -9.2]} castShadow receiveShadow>
          <boxGeometry args={[7.2, 2.2, 2.4]} />
          <meshStandardMaterial color="#414a3f" roughness={0.92} metalness={0.06} />
        </mesh>
      ))}

      {/* Layered Limestone Karst Peaks in deep northern background (z = -20 to -26) */}
      <KarstMountainPeak position={[-20, 0, -24]} height={8.5} radius={5.8} />
      <KarstMountainPeak position={[-10, 0, -22]} height={7.2} radius={5.0} />
      <KarstMountainPeak position={[0, 0, -25]} height={9.0} radius={6.2} />
      <KarstMountainPeak position={[11, 0, -23]} height={7.8} radius={5.2} />
      <KarstMountainPeak position={[21, 0, -25]} height={8.2} radius={5.5} />
    </group>
  );
};

// ─────────────────────────────────────────────────────────────────────────
// 7. MASTER LAM SƠN ENVIRONMENT EXPORT
// ─────────────────────────────────────────────────────────────────────────
export const LamSonEnvironment3D: React.FC = () => {
  return (
    <group name="LamSonEnvironment">
      {/* ── Level 1: Flat Base Ground & Distant Mountain Karsts ───── */}
      <LamSonBaseTerrain />

      {/* ── Level 2: Northern Ridge Pine Trees & Bamboo ───────────── */}
      <MountainPineTree position={[-11.5, 0, -8.2]} scale={1.2} />
      <MountainPineTree position={[-6.2, 0, -8.0]} scale={1.0} />
      <MountainPineTree position={[-2.5, 0, -8.5]} scale={1.1} />
      <MountainPineTree position={[2.5, 0, -8.5]} scale={1.05} />
      <MountainPineTree position={[6.5, 0, -8.0]} scale={1.15} />
      <MountainPineTree position={[11.5, 0, -8.2]} scale={1.2} />

      <MountainBambooCluster position={[-4.5, 0, -7.8]} />
      <MountainBambooCluster position={[4.5, 0, -7.8]} />

      {/* ── Level 3: Flank Outposts & Tents (Strictly |x| >= 12.0) ─── */}
      {/* West Flank: Lam Sơn Resistance Staging Camp */}
      <LamSonGuerrillaCamp position={[-12.8, 0, -1.5]} />
      <MountainPineTree position={[-13.5, 0, 2.5]} scale={1.1} />
      <MountainBambooCluster position={[-12.2, 0, 4.0]} />

      {/* East Flank: Invading Minh Supply Depot */}
      <MinhSupplyDepot position={[12.6, 0, -2.5]} />
      <MountainPineTree position={[13.5, 0, 1.8]} scale={1.1} />
      <MountainBambooCluster position={[12.2, 0, 4.2]} />
    </group>
  );
};
