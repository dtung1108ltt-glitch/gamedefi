/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  HÀO KHÍ ĐẠI VIỆT — THĂNG LONG CITADEL 3D ENVIRONMENT (KINH ĐÔ NHÀ LÝ)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 *  A balanced, historically authentic Vietnamese medieval imperial capital
 *  diorama backdrop.
 *
 *  KEY PRINCIPLES:
 *  1. ZERO GRID OCCLUSION: All buildings sit in the northern backdrop (z <= -7.2)
 *     and lateral flanks (|x| >= 12.0). The playable hex grid (z = -5.2 to +5.2)
 *     and all units are 100% visible and unobstructed.
 *  2. REASONABLE GAME-WORLD SCALE:
 *     - Soldier height: ~1.8 units
 *     - City wall: ~3.2 units high
 *     - Watch towers: ~5.5 units high
 *     - Gatehouse: ~4.8 units high
 *     - Palace: ~6.2 units high, ~13 units wide (in deep backdrop z = -14.5)
 *  3. MUTED HISTORICAL COLORS:
 *     - Stone: warm gray (#5a5247, #4d463d)
 *     - Wood: dark brown timber (#3a2518, #452b1b)
 *     - Roofs: muted terracotta / dark red (#7c2d12, #853729) — NO #FF0000!
 *     - Accents: muted antique gold (#c59b27, #b8860b)
 *  4. 90° UPRIGHT GROUNDING:
 *     - All structures stand strictly perpendicular (rotation.x = 0, rotation.z = 0)
 *     - Ground plane lies flat horizontally with rotation.x = -Math.PI / 2
 * ═══════════════════════════════════════════════════════════════════════════
 */

import React from 'react';
import * as THREE from 'three';

// ─────────────────────────────────────────────────────────────────────────
// 1. VIETNAMESE HISTORICAL ROOF (Mái ngói cổ truyền thời Lý)
// ─────────────────────────────────────────────────────────────────────────
const HistoricalRoof: React.FC<{
  width: number;
  length: number;
  height: number;
  tileColor?: string;
  ridgeColor?: string;
}> = ({
  width,
  length,
  height,
  tileColor = '#7c2d12',
  ridgeColor = '#c59b27',
}) => {
  const roofRadius = Math.max(width, length) * 0.55;
  return (
    <group>
      {/* Main hip roof mass — 4-sided pyramid rotated 45 deg to align with X/Z */}
      <mesh
        position={[0, height * 0.45, 0]}
        rotation={[0, Math.PI / 4, 0]}
        castShadow
        receiveShadow
      >
        <cylinderGeometry
          args={[
            roofRadius * 0.28, // top ridge flat
            roofRadius,        // eaves spread
            height,
            4,
          ]}
        />
        <meshStandardMaterial color={tileColor} roughness={0.72} metalness={0.1} />
      </mesh>

      {/* Main roof ridge beam */}
      <mesh position={[0, height * 0.95, 0]} castShadow>
        <boxGeometry args={[width * 0.72, 0.14, 0.18]} />
        <meshStandardMaterial color={ridgeColor} roughness={0.4} metalness={0.65} />
      </mesh>

      {/* Center finial jewel / dragon crest */}
      <mesh position={[0, height + 0.1, 0]} castShadow>
        <sphereGeometry args={[0.12, 8, 8]} />
        <meshStandardMaterial color={ridgeColor} roughness={0.35} metalness={0.8} />
      </mesh>
    </group>
  );
};

// ─────────────────────────────────────────────────────────────────────────
// 2. ROYAL BANNER (Cờ Đại Việt)
// ─────────────────────────────────────────────────────────────────────────
const RoyalBanner: React.FC<{
  position: [number, number, number];
  height?: number;
  color?: string;
  accentColor?: string;
}> = ({ position, height = 2.8, color = '#1e3a8a', accentColor = '#d97706' }) => {
  return (
    <group position={position}>
      {/* Wooden flagpole */}
      <mesh position={[0, height * 0.5, 0]} castShadow>
        <cylinderGeometry args={[0.035, 0.045, height, 6]} />
        <meshStandardMaterial color="#352317" roughness={0.85} />
      </mesh>
      {/* Gold spearhead */}
      <mesh position={[0, height + 0.12, 0]} castShadow>
        <coneGeometry args={[0.07, 0.24, 4]} />
        <meshStandardMaterial color="#c59b27" metalness={0.85} roughness={0.25} />
      </mesh>
      {/* Silk banner */}
      <mesh position={[0.36, height - 0.45, 0]} castShadow>
        <boxGeometry args={[0.65, 0.8, 0.02]} />
        <meshStandardMaterial color={color} roughness={0.7} />
      </mesh>
      {/* Gold border */}
      <mesh position={[0.36, height - 0.45, 0.012]}>
        <boxGeometry args={[0.69, 0.84, 0.008]} />
        <meshStandardMaterial color={accentColor} roughness={0.5} metalness={0.5} />
      </mesh>
    </group>
  );
};

// ─────────────────────────────────────────────────────────────────────────
// 3. DEFENSIVE WATCHTOWER (Tháp Canh Thăng Long)
// ─────────────────────────────────────────────────────────────────────────
const WatchTower: React.FC<{
  position: [number, number, number];
}> = ({ position }) => {
  return (
    <group position={position}>
      {/* Stone base plinth */}
      <mesh position={[0, 0.6, 0]} castShadow receiveShadow>
        <boxGeometry args={[2.0, 1.2, 2.0]} />
        <meshStandardMaterial color="#544c42" roughness={0.85} metalness={0.1} />
      </mesh>
      {/* 4 Wooden support pillars */}
      {[
        [-0.7, -0.7],
        [0.7, -0.7],
        [-0.7, 0.7],
        [0.7, 0.7],
      ].map(([px, pz], i) => (
        <mesh key={i} position={[px, 2.2, pz]} castShadow>
          <cylinderGeometry args={[0.07, 0.09, 2.0, 6]} />
          <meshStandardMaterial color="#382415" roughness={0.85} />
        </mesh>
      ))}
      {/* Upper guard platform */}
      <mesh position={[0, 3.2, 0]} castShadow receiveShadow>
        <boxGeometry args={[2.2, 0.16, 2.2]} />
        <meshStandardMaterial color="#4a301d" roughness={0.8} />
      </mesh>
      {/* Parapet railing */}
      {[-1.0, 1.0].map((x, i) => (
        <mesh key={i} position={[x, 3.5, 0]}>
          <boxGeometry args={[0.08, 0.45, 2.0]} />
          <meshStandardMaterial color="#3d2717" roughness={0.85} />
        </mesh>
      ))}
      {/* Tower Roof */}
      <group position={[0, 4.3, 0]}>
        <HistoricalRoof width={2.4} length={2.4} height={0.8} tileColor="#7c2d12" />
      </group>
      {/* Flaming torch beacon */}
      <mesh position={[0, 3.35, 0]}>
        <cylinderGeometry args={[0.1, 0.06, 0.3, 6]} />
        <meshStandardMaterial color="#2d1f14" metalness={0.7} />
      </mesh>
      <mesh position={[0, 3.58, 0]}>
        <sphereGeometry args={[0.1, 8, 8]} />
        <meshBasicMaterial color="#f97316" />
      </mesh>
      <pointLight position={[0, 3.65, 0]} color="#ff8833" intensity={0.8} distance={4.0} />
    </group>
  );
};

// ─────────────────────────────────────────────────────────────────────────
// 4. CITADEL WALL SEGMENT (Tường Thành)
// ─────────────────────────────────────────────────────────────────────────
const CitadelWall: React.FC<{
  position: [number, number, number];
  width: number;
}> = ({ position, width }) => {
  return (
    <group position={position}>
      {/* Stone wall mass */}
      <mesh position={[0, 1.5, 0]} castShadow receiveShadow>
        <boxGeometry args={[width, 3.0, 1.4]} />
        <meshStandardMaterial color="#585045" roughness={0.85} metalness={0.1} />
      </mesh>
      {/* Rampart top walkway */}
      <mesh position={[0, 3.05, 0]} receiveShadow>
        <boxGeometry args={[width + 0.05, 0.1, 1.5]} />
        <meshStandardMaterial color="#4a4238" roughness={0.85} />
      </mesh>
      {/* Battlements / Crenellations facing front */}
      {Array.from({ length: Math.floor(width / 1.1) }).map((_, i) => {
        const cx = -width * 0.5 + 0.55 + i * 1.1;
        return (
          <mesh key={i} position={[cx, 3.3, 0.65]} castShadow receiveShadow>
            <boxGeometry args={[0.5, 0.4, 0.18]} />
            <meshStandardMaterial color="#50483e" roughness={0.8} />
          </mesh>
        );
      })}
    </group>
  );
};

// ─────────────────────────────────────────────────────────────────────────
// 5. GRAND IMPERIAL GATEHOUSE (Đoan Môn — Cổng Chính Hoàng Thành)
// ─────────────────────────────────────────────────────────────────────────
const DoanMonGate: React.FC<{
  position: [number, number, number];
}> = ({ position }) => {
  return (
    <group position={position}>
      {/* Massive lower stone fortress base */}
      <mesh position={[0, 1.7, 0]} castShadow receiveShadow>
        <boxGeometry args={[6.4, 3.4, 2.2]} />
        <meshStandardMaterial color="#524a3f" roughness={0.88} metalness={0.1} />
      </mesh>
      {/* Central arched entrance portal cutout (dark interior) */}
      <mesh position={[0, 1.25, 0.05]} castShadow>
        <boxGeometry args={[2.2, 2.5, 2.3]} />
        <meshStandardMaterial color="#1a140e" roughness={0.95} />
      </mesh>
      {/* Timber gate doors slightly ajar */}
      <mesh position={[-0.55, 1.2, 0.05]} rotation={[0, 0.25, 0]} castShadow>
        <boxGeometry args={[1.0, 2.3, 0.1]} />
        <meshStandardMaterial color="#2d180d" roughness={0.85} metalness={0.2} />
      </mesh>
      <mesh position={[0.55, 1.2, 0.05]} rotation={[0, -0.25, 0]} castShadow>
        <boxGeometry args={[1.0, 2.3, 0.1]} />
        <meshStandardMaterial color="#2d180d" roughness={0.85} metalness={0.2} />
      </mesh>

      {/* First-tier promenade */}
      <mesh position={[0, 3.45, 0]} castShadow receiveShadow>
        <boxGeometry args={[6.6, 0.12, 2.4]} />
        <meshStandardMaterial color="#4a4238" roughness={0.8} />
      </mesh>

      {/* Second-tier upper pavilion (Lầu gác vọng lâu) */}
      <mesh position={[0, 4.15, 0]} castShadow>
        <boxGeometry args={[4.2, 1.2, 1.8]} />
        <meshStandardMaterial color="#4d1f16" roughness={0.7} metalness={0.12} />
      </mesh>

      {/* Pavilion timber pillars */}
      {[-1.8, -0.9, 0, 0.9, 1.8].map((px, idx) => (
        <mesh key={idx} position={[px, 4.15, 0.85]} castShadow>
          <cylinderGeometry args={[0.06, 0.06, 1.2, 6]} />
          <meshStandardMaterial color="#3b150f" roughness={0.6} />
        </mesh>
      ))}

      {/* Gatehouse Upper Roof */}
      <group position={[0, 4.85, 0]}>
        <HistoricalRoof width={4.8} length={2.2} height={1.0} tileColor="#7c2d12" />
      </group>

      {/* Two royal banners flanking gatehouse */}
      <RoyalBanner position={[-2.8, 3.5, 0.8]} height={2.5} color="#1e3a8a" accentColor="#d97706" />
      <RoyalBanner position={[2.8, 3.5, 0.8]} height={2.5} color="#1e3a8a" accentColor="#d97706" />
    </group>
  );
};

// ─────────────────────────────────────────────────────────────────────────
// 6. GRAND IMPERIAL PALACE (Điện Càn Nguyên / Thiên An — In Deep Backdrop)
// ─────────────────────────────────────────────────────────────────────────
const ImperialPalaceBackdrop: React.FC<{
  position: [number, number, number];
}> = ({ position }) => {
  return (
    <group position={position}>
      {/* Stone terrace base */}
      <mesh position={[0, 0.6, 0]} castShadow receiveShadow>
        <boxGeometry args={[13.0, 1.2, 4.8]} />
        <meshStandardMaterial color="#585045" roughness={0.8} metalness={0.12} />
      </mesh>

      {/* Palace Main Hall body */}
      <mesh position={[0, 2.1, 0]} castShadow receiveShadow>
        <boxGeometry args={[10.5, 1.8, 3.8]} />
        <meshStandardMaterial color="#4a1d17" roughness={0.65} metalness={0.1} />
      </mesh>

      {/* Gilded ceremonial doors */}
      {[-3.5, -1.75, 0, 1.75, 3.5].map((dx, idx) => (
        <mesh key={idx} position={[dx, 2.0, 1.92]} castShadow>
          <boxGeometry args={[1.0, 1.4, 0.04]} />
          <meshStandardMaterial color="#854d0e" roughness={0.4} metalness={0.5} />
        </mesh>
      ))}

      {/* Lower Palace Roof */}
      <group position={[0, 3.1, 0]}>
        <HistoricalRoof width={11.5} length={4.4} height={0.9} tileColor="#7c2d12" />
      </group>

      {/* Upper Clerestory */}
      <mesh position={[0, 4.0, 0]} castShadow>
        <boxGeometry args={[7.2, 0.8, 2.8]} />
        <meshStandardMaterial color="#541f18" roughness={0.65} />
      </mesh>

      {/* Grand Top Roof */}
      <group position={[0, 4.5, 0]}>
        <HistoricalRoof width={8.5} length={3.4} height={1.2} tileColor="#853729" ridgeColor="#c59b27" />
      </group>

      {/* Royal Banners flanking terrace */}
      <RoyalBanner position={[-5.8, 1.2, 2.2]} height={3.2} color="#7f1d1d" accentColor="#d97706" />
      <RoyalBanner position={[5.8, 1.2, 2.2]} height={3.2} color="#7f1d1d" accentColor="#d97706" />
    </group>
  );
};

// ─────────────────────────────────────────────────────────────────────────
// 7. BASE TERRAIN, MOAT & MOUNTAIN BACKDROP
// ─────────────────────────────────────────────────────────────────────────
const ThangLongBaseTerrain: React.FC = () => {
  return (
    <group>
      {/* Broad Imperial Base Terrain — lying flat horizontally under all hexes */}
      <mesh position={[0, -0.25, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[90, 70]} />
        <meshStandardMaterial color="#3f4d38" roughness={0.94} metalness={0.02} />
      </mesh>

      {/* Paved Imperial Courtyard strip between Gate and Palace (z = -9.5 to -14.0) */}
      <mesh position={[0, -0.23, -11.8]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[14, 4.8]} />
        <meshStandardMaterial color="#5a5247" roughness={0.8} metalness={0.08} />
      </mesh>

      {/* Outer Defensive Moat / Canal (North boundary at z = -7.2) */}
      <mesh position={[0, -0.24, -7.2]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[42, 2.0]} />
        <meshStandardMaterial color="#2d4a58" roughness={0.25} metalness={0.65} />
      </mesh>

      {/* Stone Arch Bridge crossing the moat in front of the gate */}
      <mesh position={[0, -0.15, -7.2]} castShadow receiveShadow>
        <boxGeometry args={[3.2, 0.2, 2.4]} />
        <meshStandardMaterial color="#685f54" roughness={0.8} />
      </mesh>
      {/* Bridge stone railings */}
      {[-1.5, 1.5].map((rx, idx) => (
        <mesh key={idx} position={[rx, 0.05, -7.2]} castShadow>
          <boxGeometry args={[0.14, 0.25, 2.4]} />
          <meshStandardMaterial color="#524a40" roughness={0.8} />
        </mesh>
      ))}

      {/* Distant Misty Mountain Silhouettes in far background (z = -25) */}
      {[-24, -12, 12, 24].map((dx, idx) => (
        <mesh key={idx} position={[dx, 2.5, -25]} castShadow>
          <coneGeometry args={[6.5, 6.0, 5]} />
          <meshStandardMaterial color="#3a4a3b" roughness={0.95} opacity={0.55} transparent />
        </mesh>
      ))}
    </group>
  );
};

// ─────────────────────────────────────────────────────────────────────────
// 8. MASTER THĂNG LONG ENVIRONMENT EXPORT
// ─────────────────────────────────────────────────────────────────────────
export const ThangLongEnvironment3D: React.FC = () => {
  return (
    <group name="ThangLongEnvironment">
      {/* ── Level 1: Flat Base Ground, Moat & Distant Mountains ────── */}
      <ThangLongBaseTerrain />

      {/* ── Level 2 & 3: Defensive Wall Line & Gate (At z = -9.0) ──── */}
      {/* Left Wall Segment */}
      <CitadelWall position={[-7.5, 0, -9.0]} width={7.0} />

      {/* Left Watch Tower (Tháp Canh Tây) */}
      <WatchTower position={[-11.8, 0, -9.0]} />

      {/* Grand Central Gatehouse (Đoan Môn) */}
      <DoanMonGate position={[0, 0, -9.0]} />

      {/* Right Watch Tower (Tháp Canh Đông) */}
      <WatchTower position={[11.8, 0, -9.0]} />

      {/* Right Wall Segment */}
      <CitadelWall position={[7.5, 0, -9.0]} width={7.0} />

      {/* ── Level 4: Grand Imperial Palace Hall (Deep backdrop z = -14.5) ── */}
      <ImperialPalaceBackdrop position={[0, 0, -14.5]} />

      {/* ── Level 6: Flanking Ornamental Bonsai Trees & Lanterns ───── */}
      {[-13.5, 13.5].map((gx, idx) => (
        <group key={idx} position={[gx, 0, 0]}>
          {/* Ancient pine tree */}
          <mesh position={[0, 1.0, 0]} castShadow>
            <cylinderGeometry args={[0.09, 0.14, 2.0, 6]} />
            <meshStandardMaterial color="#332216" roughness={0.9} />
          </mesh>
          <mesh position={[0, 2.2, 0]} castShadow>
            <dodecahedronGeometry args={[1.0, 1]} />
            <meshStandardMaterial color="#284a27" roughness={0.8} />
          </mesh>
          {/* Stone pagoda lantern */}
          <mesh position={[0, 0.35, 1.2]} castShadow>
            <cylinderGeometry args={[0.12, 0.16, 0.7, 4]} />
            <meshStandardMaterial color="#5a544b" roughness={0.8} />
          </mesh>
        </group>
      ))}
    </group>
  );
};
