/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  HÀO KHÍ ĐẠI VIỆT — PHÚ XUÂN (KINH ĐÔ NHÀ NGUYỄN) 3D ENVIRONMENT
 * ═══════════════════════════════════════════════════════════════════════════
 *
 *  Visual Identity:
 *  - Sông Hương (Perfume River) flowing across middle-north (Row 1-2)
 *  - 2 Strategic Bridges:
 *      * Tây Kiều (Western Bridge) at X = -4.33
 *      * Đông Kiều (Eastern Bridge) at X = +4.33
 *  - Riverbanks with reeds, sandy edges, and small moored wooden sampans
 *  - Phú Xuân Citadel:
 *      * Thick stone defensive walls
 *      * Cổng Ngọ Môn (Main Imperial Gatehouse with multi-tier glazed tiled roof)
 *      * Corner Watchtowers
 *      * Imperial Courtyard (Sân Rồng) with royal flagstaff
 *      * Central Command Hall (Điện Thái Hòa)
 *  - Distant rolling green hills (Huế landscape) in northern backdrop (z <= -7.5)
 *
 *  STRICT ZERO OCCLUSION RULES:
 *  - Fixed Camera: [0, 18, 24] looking at [0, 0, 0], FOV 32.
 *  - No giant meshes or roofs that occlude the hex grid.
 *  - Base plane flat horizontal at Y = -0.25 (rotation.x = -Math.PI / 2).
 * ═══════════════════════════════════════════════════════════════════════════
 */

import React, { useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { ControlPointState } from '../../../../types';

interface PhuXuanEnvironment3DProps {
  controlPoints?: ControlPointState[];
}

/**
 * Procedural Huế-style Traditional Curved Roof (Mái đao cung đình)
 */
const HueImperialRoof: React.FC<{
  width: number;
  length: number;
  height: number;
  tier?: number;
}> = ({ width, length, height, tier = 1 }) => {
  return (
    <group>
      {/* Main Hip-and-Gable Roof Pyramid */}
      <mesh position={[0, height * 0.45, 0]} castShadow>
        <coneGeometry args={[Math.max(width, length) * 0.72, height, 4]} />
        <meshStandardMaterial
          color="#a3361e" // Terracotta glazed tile (Ngói liệt son)
          roughness={0.65}
          metalness={0.15}
        />
      </mesh>
      {/* Golden Ridge Ornament (Kìm nóc / Bờ nóc thếp vàng) */}
      <mesh position={[0, height * 0.95, 0]}>
        <boxGeometry args={[width * 0.4, 0.08, 0.1]} />
        <meshStandardMaterial color="#eab308" metalness={0.8} roughness={0.25} />
      </mesh>
      {/* Second Eaves Tier if specified */}
      {tier > 1 && (
        <mesh position={[0, height * 0.15, 0]} castShadow>
          <coneGeometry args={[Math.max(width, length) * 0.9, height * 0.5, 4]} />
          <meshStandardMaterial color="#8b2612" roughness={0.7} metalness={0.1} />
        </mesh>
      )}
    </group>
  );
};

/**
 * Strategic Bridge Model (Tây Kiều / Đông Kiều)
 * Wooden & stone bridge deck spanning Sông Hương with railing & control banner
 */
const StrategicBridge3D: React.FC<{
  position: [number, number, number];
  name: string;
  owner: 'player' | 'enemy' | 'neutral';
}> = ({ position, name, owner }) => {
  const bannerColor =
    owner === 'player' ? '#f59e0b' : owner === 'enemy' ? '#dc2626' : '#94a3b8';

  return (
    <group position={position}>
      {/* Stone Pillars / Piers in Water */}
      {[-0.8, 0.8].map((pz, idx) => (
        <group key={idx} position={[0, -0.15, pz]}>
          <mesh position={[-0.45, 0, 0]} castShadow>
            <cylinderGeometry args={[0.12, 0.15, 0.5, 6]} />
            <meshStandardMaterial color="#475569" roughness={0.9} />
          </mesh>
          <mesh position={[0.45, 0, 0]} castShadow>
            <cylinderGeometry args={[0.12, 0.15, 0.5, 6]} />
            <meshStandardMaterial color="#475569" roughness={0.9} />
          </mesh>
        </group>
      ))}

      {/* Main Bridge Deck (Wood Planks & Stone Curbs) */}
      <mesh position={[0, 0.08, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.35, 0.12, 2.3]} />
        <meshStandardMaterial color="#5c3a21" roughness={0.85} />
      </mesh>

      {/* Stone Curbs along sides */}
      {[-0.64, 0.64].map((cx, idx) => (
        <mesh key={idx} position={[cx, 0.16, 0]}>
          <boxGeometry args={[0.1, 0.08, 2.3]} />
          <meshStandardMaterial color="#64748b" roughness={0.8} />
        </mesh>
      ))}

      {/* Bridge Balustrade Posts & Railings */}
      {[-0.64, 0.64].map((rx, idx) => (
        <group key={idx}>
          {[-0.9, 0, 0.9].map((pz, pidx) => (
            <mesh key={pidx} position={[rx, 0.32, pz]}>
              <cylinderGeometry args={[0.035, 0.04, 0.35, 6]} />
              <meshStandardMaterial color="#94a3b8" metalness={0.4} />
            </mesh>
          ))}
          <mesh position={[rx, 0.45, 0]}>
            <boxGeometry args={[0.04, 0.04, 2.2]} />
            <meshStandardMaterial color="#78350f" roughness={0.8} />
          </mesh>
        </group>
      ))}

      {/* Control Banner Pole on Bridge Center */}
      <group position={[0.75, 0, 0]}>
        <mesh position={[0, 0.7, 0]}>
          <cylinderGeometry args={[0.02, 0.025, 1.4, 6]} />
          <meshStandardMaterial color="#451a03" />
        </mesh>
        {/* Owner Flag */}
        <mesh position={[0.22, 1.15, 0]} castShadow>
          <planeGeometry args={[0.42, 0.55]} />
          <meshStandardMaterial
            color={bannerColor}
            side={THREE.DoubleSide}
            roughness={0.6}
          />
        </mesh>
        {/* Banner Finial */}
        <mesh position={[0, 1.42, 0]}>
          <sphereGeometry args={[0.045, 8, 8]} />
          <meshStandardMaterial color="#fbbf24" metalness={0.9} roughness={0.2} />
        </mesh>
      </group>
    </group>
  );
};

/**
 * Small Traditional Vietnamese River Sampan (Thuyền nan Sông Hương)
 * Moored environment prop along riverbanks
 */
const MooredSampan: React.FC<{ position: [number, number, number]; rotationY: number }> = ({
  position,
  rotationY,
}) => (
  <group position={position} rotation={[0, rotationY, 0]}>
    {/* Boat Hull */}
    <mesh position={[0, 0.02, 0]} castShadow>
      <boxGeometry args={[0.45, 0.16, 1.25]} />
      <meshStandardMaterial color="#451a03" roughness={0.9} />
    </mesh>
    {/* Bamboo Roof Canopy (Mui thuyền lá) */}
    <mesh position={[0, 0.18, -0.1]}>
      <cylinderGeometry args={[0.24, 0.24, 0.65, 8, 1, false, 0, Math.PI]} />
      <meshStandardMaterial color="#a16207" roughness={0.85} side={THREE.DoubleSide} />
    </mesh>
    {/* Mooring Wooden Post */}
    <mesh position={[0.3, 0.1, 0.55]}>
      <cylinderGeometry args={[0.03, 0.03, 0.45, 6]} />
      <meshStandardMaterial color="#292524" />
    </mesh>
  </group>
);

/**
 * Cổng Ngọ Môn & Lầu Ngũ Phụng (Phú Xuân Imperial Main Gate & 5-Phoenix Pavilion)
 * Authentic Huế Citadel architecture:
 * - 3 Arched stone portals (Ngọ Môn chính môn + Tả/Hữu Giáp môn)
 * - Multi-tiered Lầu Ngũ Phụng upper pavilion with vermilion pillars
 * - Controlled traditional terracotta glazed tile roof (Strictly Z-bounded, zero occlusion)
 * - Royal banners, stone steps, and golden lanterns
 */
const PhuXuanNgoMonGate: React.FC<{
  position: [number, number, number];
  owner?: 'player' | 'enemy' | 'neutral';
}> = ({ position, owner = 'player' }) => {
  const gateBannerColor =
    owner === 'player' ? '#f59e0b' : owner === 'enemy' ? '#dc2626' : '#94a3b8';
  const gateIndicatorColor =
    owner === 'player' ? '#f59e0b' : owner === 'enemy' ? '#dc2626' : '#fbbf24';

  return (
    <group position={position} name="PhuXuanNgoMonGate">
      {/* ── 1. Front Stone Approach Steps (Bậc tam cấp cẩm thạch) ────────── */}
      <mesh position={[0, 0.12, 1.15]} castShadow receiveShadow>
        <boxGeometry args={[4.2, 0.24, 0.55]} />
        <meshStandardMaterial color="#645e54" roughness={0.88} />
      </mesh>
      <mesh position={[0, 0.05, 1.45]} castShadow receiveShadow>
        <boxGeometry args={[4.6, 0.12, 0.4]} />
        <meshStandardMaterial color="#544e45" roughness={0.9} />
      </mesh>

      {/* Subtle Main Gate Control Indicator Ring (Section 13) */}
      <mesh position={[0, 0.02, 1.5]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.55, 0.72, 24]} />
        <meshBasicMaterial
          color={gateIndicatorColor}
          transparent
          opacity={0.55}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* ── 2. Massive Lower Stone Foundation Base (Đài Ngọ Môn) ─────────── */}
      <mesh position={[0, 1.2, 0]} castShadow receiveShadow>
        <boxGeometry args={[5.3, 2.4, 1.8]} />
        <meshStandardMaterial color="#4d473f" roughness={0.88} metalness={0.12} />
      </mesh>

      {/* Decorative Granite Base Plinth Molding */}
      <mesh position={[0, 0.2, 0]} castShadow receiveShadow>
        <boxGeometry args={[5.45, 0.4, 1.95]} />
        <meshStandardMaterial color="#3a352e" roughness={0.94} />
      </mesh>

      {/* ── 3. Three Arched Portals Through the Base ─────────────────────── */}
      {/* Central Emperor's Portal (Ngọ Môn Chính Môn) */}
      <mesh position={[0, 0.95, 0.05]}>
        <boxGeometry args={[1.5, 1.9, 1.85]} />
        <meshStandardMaterial color="#1a140e" roughness={0.96} />
      </mesh>
      {/* Central Vermilion & Iron-Studded Wooden Gates (Slightly Ajar) */}
      <mesh position={[-0.38, 0.95, 0.1]} rotation={[0, 0.22, 0]} castShadow>
        <boxGeometry args={[0.7, 1.8, 0.08]} />
        <meshStandardMaterial color="#7f1d1d" roughness={0.7} metalness={0.2} />
      </mesh>
      <mesh position={[0.38, 0.95, 0.1]} rotation={[0, -0.22, 0]} castShadow>
        <boxGeometry args={[0.7, 1.8, 0.08]} />
        <meshStandardMaterial color="#7f1d1d" roughness={0.7} metalness={0.2} />
      </mesh>

      {/* Flanking Side Portals (Tả Giáp Môn & Hữu Giáp Môn) */}
      {[-1.8, 1.8].map((px, idx) => (
        <group key={idx} position={[px, 0.75, 0.05]}>
          <mesh>
            <boxGeometry args={[0.7, 1.5, 1.85]} />
            <meshStandardMaterial color="#1f1812" roughness={0.95} />
          </mesh>
          <mesh position={[0, 0, 0.08]}>
            <boxGeometry args={[0.65, 1.45, 0.06]} />
            <meshStandardMaterial color="#6b2121" roughness={0.75} />
          </mesh>
        </group>
      ))}

      {/* ── 4. Promenade & Upper Terrace (Sân Lầu Ngũ Phụng) ─────────────── */}
      <mesh position={[0, 2.45, 0]} castShadow receiveShadow>
        <boxGeometry args={[5.5, 0.12, 2.0]} />
        <meshStandardMaterial color="#423b32" roughness={0.85} />
      </mesh>

      {/* Promenade Balustrade & Stone Dragon Carvings */}
      {[-2.6, 2.6].map((bx, idx) => (
        <mesh key={idx} position={[bx, 2.68, 0]}>
          <boxGeometry args={[0.12, 0.38, 1.9]} />
          <meshStandardMaterial color="#4a443a" roughness={0.8} />
        </mesh>
      ))}

      {/* ── 5. Upper Pavilion Body (Lầu Ngũ Phụng) ───────────────────────── */}
      <mesh position={[0, 3.08, 0]} castShadow>
        <boxGeometry args={[4.2, 1.15, 1.4]} />
        <meshStandardMaterial color="#701a1a" roughness={0.7} metalness={0.1} />
      </mesh>

      {/* Vermilion Wooden Columns (Cột son cung đình) */}
      {[-1.9, -0.95, 0, 0.95, 1.9].map((cx, idx) => (
        <mesh key={idx} position={[cx, 3.08, 0.72]} castShadow>
          <cylinderGeometry args={[0.055, 0.065, 1.15, 6]} />
          <meshStandardMaterial color="#991b1b" roughness={0.55} />
        </mesh>
      ))}

      {/* ── 6. Two-Tier Traditional Glazed Roof (Mái ngói Ngũ Phụng) ──────── */}
      {/* Lower Eaves Tier */}
      <group position={[0, 3.75, 0]}>
        <HueImperialRoof width={4.9} length={1.9} height={0.55} tier={1} />
      </group>
      {/* Upper Pavilion Clerestory */}
      <mesh position={[0, 4.15, 0]} castShadow>
        <boxGeometry args={[2.8, 0.45, 1.1]} />
        <meshStandardMaterial color="#5e1515" roughness={0.65} />
      </mesh>
      {/* Top Eaves & Gold Dragon Ridge Crest (Kìm nóc thếp vàng) */}
      <group position={[0, 4.5, 0]}>
        <HueImperialRoof width={3.6} length={1.5} height={0.7} tier={1} />
      </group>

      {/* ── 7. Imperial Embellishments (Cờ hiệu, Đèn lồng, Biển bảng) ──────── */}
      {/* Royal Plaque (Biển chữ vàng "NGỌ MÔN") */}
      <mesh position={[0, 3.3, 0.72]}>
        <boxGeometry args={[0.9, 0.28, 0.02]} />
        <meshStandardMaterial color="#b45309" roughness={0.3} metalness={0.8} />
      </mesh>

      {/* Imperial Silk Lanterns (Đèn lồng lục giác) */}
      {[-2.0, -1.0, 1.0, 2.0].map((lx, idx) => (
        <group key={idx} position={[lx, 3.65, 0.88]}>
          <mesh>
            <sphereGeometry args={[0.075, 8, 8]} />
            <meshStandardMaterial
              color="#fbbf24"
              emissive="#f59e0b"
              emissiveIntensity={0.65}
              roughness={0.25}
            />
          </mesh>
          <pointLight color="#fbbf24" intensity={0.4} distance={2.5} />
        </group>
      ))}

      {/* Flanking Imperial War Banners on Promenade */}
      {[-2.4, 2.4].map((bx, idx) => (
        <group key={idx} position={[bx, 2.5, 0.8]}>
          <mesh position={[0, 0.8, 0]}>
            <cylinderGeometry args={[0.022, 0.03, 1.6, 6]} />
            <meshStandardMaterial color="#2d1b0d" />
          </mesh>
          <mesh position={[0.26, 1.25, 0]} castShadow>
            <planeGeometry args={[0.48, 0.65]} />
            <meshStandardMaterial color={gateBannerColor} side={THREE.DoubleSide} roughness={0.6} />
          </mesh>
          <mesh position={[0, 1.65, 0]}>
            <coneGeometry args={[0.05, 0.15, 4]} />
            <meshStandardMaterial color="#fbbf24" metalness={0.9} />
          </mesh>
        </group>
      ))}
    </group>
  );
};

/**
 * Modular Stone Rampart Wall Segment (Đoạn Thành Lũy Đá Phú Xuân)
 * Multi-layer stone construction with battlements (lỗ châu mai) & walkway
 */
const WallSegment: React.FC<{
  position: [number, number, number];
  length: number;
  rotationY?: number;
}> = ({ position, length, rotationY = 0 }) => {
  const crenelCount = Math.max(2, Math.floor(length / 0.95));
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      {/* Stone Foundation Base Plinth */}
      <mesh position={[0, 0.25, 0]} castShadow receiveShadow>
        <boxGeometry args={[length + 0.1, 0.5, 1.4]} />
        <meshStandardMaterial color="#3c3731" roughness={0.92} metalness={0.08} />
      </mesh>

      {/* Main Stone Wall Mass (Huế imperial warm gray stone) */}
      <mesh position={[0, 1.35, 0]} castShadow receiveShadow>
        <boxGeometry args={[length, 1.7, 1.15]} />
        <meshStandardMaterial color="#544f46" roughness={0.88} metalness={0.1} />
      </mesh>

      {/* Rampart Walkway along top */}
      <mesh position={[0, 2.24, 0]} receiveShadow>
        <boxGeometry args={[length + 0.05, 0.08, 1.25]} />
        <meshStandardMaterial color="#443f38" roughness={0.85} />
      </mesh>

      {/* Front Parapet Crenellations (Lỗ châu mai) */}
      {Array.from({ length: crenelCount }).map((_, i) => {
        const offset = -length * 0.5 + (i + 0.5) * (length / crenelCount);
        return (
          <mesh key={i} position={[offset, 2.44, 0.52]} castShadow receiveShadow>
            <boxGeometry args={[length / crenelCount * 0.55, 0.32, 0.16]} />
            <meshStandardMaterial color="#4c473f" roughness={0.84} />
          </mesh>
        );
      })}
    </group>
  );
};

/**
 * Defensive Watchtower for Phú Xuân Citadel Corners (Tháp Canh Cung Đình)
 * Authentic Huế military architecture: Stone bastion base, timber pavilion, curved roof & flag
 */
const PhuXuanWatchTower: React.FC<{
  position: [number, number, number];
  name?: string;
}> = ({ position }) => {
  return (
    <group position={position}>
      {/* Stone Bastion Foundation Plinth */}
      <mesh position={[0, 0.9, 0]} castShadow receiveShadow>
        <boxGeometry args={[2.0, 1.8, 2.0]} />
        <meshStandardMaterial color="#48433b" roughness={0.88} metalness={0.1} />
      </mesh>

      {/* 4 Timber Corner Support Pillars */}
      {[
        [-0.72, -0.72],
        [0.72, -0.72],
        [-0.72, 0.72],
        [0.72, 0.72],
      ].map(([px, pz], idx) => (
        <mesh key={idx} position={[px, 2.35, pz]} castShadow>
          <cylinderGeometry args={[0.065, 0.08, 1.1, 6]} />
          <meshStandardMaterial color="#3b2316" roughness={0.82} />
        </mesh>
      ))}

      {/* Observation Deck Platform */}
      <mesh position={[0, 1.85, 0]} castShadow receiveShadow>
        <boxGeometry args={[2.2, 0.12, 2.2]} />
        <meshStandardMaterial color="#301c10" roughness={0.8} />
      </mesh>

      {/* Wooden Guard Railings */}
      {[-0.95, 0.95].map((rx, idx) => (
        <mesh key={idx} position={[rx, 2.15, 0]}>
          <boxGeometry args={[0.08, 0.48, 1.9]} />
          <meshStandardMaterial color="#4a2c17" roughness={0.85} />
        </mesh>
      ))}

      {/* Traditional Curved Roof */}
      <group position={[0, 2.9, 0]}>
        <HueImperialRoof width={2.3} length={2.3} height={0.7} tier={1} />
      </group>

      {/* Signal Beacon Torch */}
      <mesh position={[0, 2.05, 0]}>
        <cylinderGeometry args={[0.08, 0.05, 0.28, 6]} />
        <meshStandardMaterial color="#292524" metalness={0.8} />
      </mesh>
      <mesh position={[0, 2.28, 0]}>
        <sphereGeometry args={[0.08, 8, 8]} />
        <meshBasicMaterial color="#f97316" />
      </mesh>
      <pointLight position={[0, 2.32, 0]} color="#f97316" intensity={0.5} distance={3.0} />

      {/* Tower Imperial Yellow-Red Banner */}
      <group position={[0.7, 2.9, 0.7]}>
        <mesh position={[0, 0.65, 0]}>
          <cylinderGeometry args={[0.02, 0.025, 1.3, 6]} />
          <meshStandardMaterial color="#2d1a0e" />
        </mesh>
        <mesh position={[0.22, 1.05, 0]} castShadow>
          <planeGeometry args={[0.42, 0.52]} />
          <meshStandardMaterial
            color="#dc2626"
            side={THREE.DoubleSide}
            roughness={0.55}
          />
        </mesh>
        <mesh position={[0, 1.32, 0]}>
          <coneGeometry args={[0.045, 0.12, 4]} />
          <meshStandardMaterial color="#f59e0b" metalness={0.9} />
        </mesh>
      </group>
    </group>
  );
};

/**
 * Complete Modular Imperial Citadel Walls for Phú Xuân
 * Positioned in North background: Front wall at Z = -8.2, Flanks at X = ±12.5, Rear at Z = -13.5
 */
const PhuXuanCitadelWalls: React.FC = () => {
  return (
    <group name="PhuXuanCitadelWalls">
      {/* Front Wall West Flank (X from -12.5 to -2.7) */}
      <WallSegment position={[-7.6, 0, -8.2]} length={9.8} />

      {/* Front Wall East Flank (X from 2.7 to 12.5) */}
      <WallSegment position={[7.6, 0, -8.2]} length={9.8} />

      {/* West Flank Wall (Connecting front corner to rear corner) */}
      <WallSegment position={[-12.5, 0, -10.85]} length={5.3} rotationY={Math.PI / 2} />

      {/* East Flank Wall (Connecting front corner to rear corner) */}
      <WallSegment position={[12.5, 0, -10.85]} length={5.3} rotationY={Math.PI / 2} />

      {/* Rear Northern Wall (Behind Imperial Palace) */}
      <WallSegment position={[0, 0, -13.5]} length={25.0} />
    </group>
  );
};

/**
 * Sân Rồng Hoàng Thành & Đường Ngự Đạo (Phú Xuân Imperial Courtyard & Processional Way)
 * - Paved imperial courtyard behind Ngọ Môn (Z = -9.0 to -12.6)
 * - Central Royal Way (Đường Dũng Đạo) paved in granitic stone
 * - Stone dragon balustrades, bronze incense urns, stone lanterns & bonsai trees
 * - Front Stone Approach Road (Đường lát đá kết nối cổng thành và chiến trường)
 */
const PhuXuanImperialCourtyard: React.FC<{
  owner?: 'player' | 'enemy' | 'neutral';
}> = ({ owner = 'player' }) => {
  const courtyardIndicatorColor =
    owner === 'player' ? '#f59e0b' : owner === 'enemy' ? '#dc2626' : '#fbbf24';

  return (
    <group name="PhuXuanImperialCourtyard">
      {/* ── 1. Front Stone Approach Road (Đường lát đá tiến vào cổng Ngọ Môn) ── */}
      {/* Runs from Gate threshold (Z = -7.3) down towards North hex edge (Z = -5.5) */}
      <mesh position={[0, -0.22, -6.4]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[3.8, 2.0]} />
        <meshStandardMaterial color="#554e45" roughness={0.88} metalness={0.06} />
      </mesh>
      {/* Approach Road Stone Curbs */}
      {[-1.95, 1.95].map((cx, idx) => (
        <mesh key={idx} position={[cx, -0.18, -6.4]}>
          <boxGeometry args={[0.12, 0.08, 2.0]} />
          <meshStandardMaterial color="#3a352e" roughness={0.9} />
        </mesh>
      ))}

      {/* ── 2. Main Courtyard Paved Plaza (Sân Rồng Đại Triều) ─────────────── */}
      {/* Sits between Main Gate and Imperial Palace (Z = -9.1 to -12.5) */}
      <mesh position={[0, -0.22, -10.8]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[20.0, 3.8]} />
        <meshStandardMaterial color="#49443c" roughness={0.86} metalness={0.08} />
      </mesh>

      {/* ── 3. Central Royal Processional Way (Đường Dũng Đạo) ─────────────── */}
      <mesh position={[0, -0.21, -10.8]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[3.4, 3.8]} />
        <meshStandardMaterial color="#686156" roughness={0.82} metalness={0.1} />
      </mesh>

      {/* Imperial Courtyard Strategic Seal / Control Indicator (Section 12) */}
      <group position={[0, -0.19, -10.8]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[1.1, 1.35, 32]} />
          <meshBasicMaterial
            color={courtyardIndicatorColor}
            transparent
            opacity={0.65}
            side={THREE.DoubleSide}
          />
        </mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.55, 0.72, 24]} />
          <meshBasicMaterial
            color="#fbbf24"
            transparent
            opacity={0.4}
            side={THREE.DoubleSide}
          />
        </mesh>
      </group>

      {/* Low Stone Dragon Balustrades along Royal Way */}
      {[-1.75, 1.75].map((bx, idx) => (
        <group key={idx} position={[bx, -0.12, -10.8]}>
          <mesh castShadow receiveShadow>
            <boxGeometry args={[0.14, 0.16, 3.6]} />
            <meshStandardMaterial color="#3f3a33" roughness={0.8} />
          </mesh>
          {/* Dragon Head finials on ends */}
          {[-1.7, 1.7].map((fz, fidx) => (
            <mesh key={fidx} position={[0, 0.12, fz]}>
              <sphereGeometry args={[0.07, 6, 6]} />
              <meshStandardMaterial color="#b45309" metalness={0.6} />
            </mesh>
          ))}
        </group>
      ))}

      {/* ── 4. Traditional Bronze Urns / Cauldrons (Cặp Vạc Đồng Thời Nguyễn) ─ */}
      {[-2.7, 2.7].map((vx, idx) => (
        <group key={idx} position={[vx, -0.05, -10.2]}>
          {/* Stone Pedestal */}
          <mesh position={[0, 0.08, 0]} castShadow receiveShadow>
            <cylinderGeometry args={[0.32, 0.36, 0.16, 8]} />
            <meshStandardMaterial color="#3d3730" roughness={0.9} />
          </mesh>
          {/* Bronze Cauldron Body */}
          <mesh position={[0, 0.28, 0]} castShadow>
            <cylinderGeometry args={[0.3, 0.22, 0.28, 8]} />
            <meshStandardMaterial color="#78350f" metalness={0.8} roughness={0.3} />
          </mesh>
          {/* Bronze Ring Handles */}
          {[-0.32, 0.32].map((hx, hidx) => (
            <mesh key={hidx} position={[hx, 0.32, 0]}>
              <torusGeometry args={[0.06, 0.02, 6, 8]} />
              <meshStandardMaterial color="#d97706" metalness={0.85} roughness={0.2} />
            </mesh>
          ))}
        </group>
      ))}

      {/* ── 5. Ornamental Royal Gardens & Bonsai (Vườn Ngự Uyển Sân Rồng) ──── */}
      {[-6.2, 6.2].map((gx, idx) => (
        <group key={idx} position={[gx, -0.15, -10.8]}>
          {/* Rectangular Stone Planter */}
          <mesh position={[0, 0.1, 0]} castShadow receiveShadow>
            <boxGeometry args={[3.2, 0.2, 2.4]} />
            <meshStandardMaterial color="#423c34" roughness={0.88} />
          </mesh>
          <mesh position={[0, 0.21, 0]}>
            <boxGeometry args={[3.0, 0.02, 2.2]} />
            <meshStandardMaterial color="#2d3b28" roughness={0.95} />
          </mesh>

          {/* Miniature Imperial Bonsai / Dwarf Frangipani Trees */}
          {[-0.8, 0.8].map((tx, tidx) => (
            <group key={tidx} position={[tx, 0.2, 0]}>
              <mesh position={[0, 0.45, 0]} castShadow>
                <cylinderGeometry args={[0.04, 0.07, 0.9, 5]} />
                <meshStandardMaterial color="#382415" roughness={0.9} />
              </mesh>
              <mesh position={[0, 0.95, 0]} castShadow>
                <dodecahedronGeometry args={[0.42, 0]} />
                <meshStandardMaterial color="#2d5229" roughness={0.8} />
              </mesh>
            </group>
          ))}

          {/* Stone Pagoda Lanterns */}
          <mesh position={[0, 0.45, 0.8]} castShadow>
            <cylinderGeometry args={[0.1, 0.14, 0.5, 4]} />
            <meshStandardMaterial color="#554e44" roughness={0.85} />
          </mesh>
          <pointLight position={[0, 0.55, 0.8]} color="#fde047" intensity={0.3} distance={2.0} />
        </group>
      ))}
    </group>
  );
};

/**
 * Điện Thái Hòa (Phú Xuân Grand Imperial Palace & Throne Hall)
 * The majestic centerpiece of Kinh Thành Phú Xuân:
 * - Raised 2-tier carved marble/granite terrace with imperial dragon steps
 * - Vermilion lacquered columns and gilded ceremonial throne doors
 * - Traditional "Trùng thiềm điệp ốc" double-tiered terracotta roof with golden dragons
 * - Gilded imperial plaque ("ĐIỆN THÁI HÒA") and royal banners
 * - Strict background bounding box (Z = -14.4 to -10.6), zero occlusion
 */
const PhuXuanDienThaiHoa: React.FC<{ position: [number, number, number] }> = ({ position }) => {
  return (
    <group position={position} name="PhuXuanDienThaiHoa">
      {/* ── 1. Raised Two-Tier Granite Terrace Platform (Bệ đá Đại Triều) ─── */}
      {/* Lower Platform */}
      <mesh position={[0, 0.18, 0]} castShadow receiveShadow>
        <boxGeometry args={[13.2, 0.36, 4.2]} />
        <meshStandardMaterial color="#4a443b" roughness={0.88} metalness={0.1} />
      </mesh>
      {/* Upper Platform */}
      <mesh position={[0, 0.48, 0]} castShadow receiveShadow>
        <boxGeometry args={[11.8, 0.28, 3.6]} />
        <meshStandardMaterial color="#585147" roughness={0.85} metalness={0.12} />
      </mesh>

      {/* Front Central Imperial Steps (Bậc tam cấp rồng) */}
      <mesh position={[0, 0.15, 2.0]} castShadow receiveShadow>
        <boxGeometry args={[3.2, 0.3, 0.6]} />
        <meshStandardMaterial color="#665f54" roughness={0.84} />
      </mesh>
      {/* Stone Dragon Balustrades on Steps */}
      {[-1.65, 1.65].map((sx, idx) => (
        <group key={idx} position={[sx, 0.28, 2.0]}>
          <mesh castShadow>
            <boxGeometry args={[0.14, 0.22, 0.65]} />
            <meshStandardMaterial color="#3b362f" roughness={0.8} />
          </mesh>
          <mesh position={[0, 0.12, 0.32]}>
            <sphereGeometry args={[0.07, 6, 6]} />
            <meshStandardMaterial color="#b45309" metalness={0.7} />
          </mesh>
        </group>
      ))}

      {/* ── 2. Palace Main Hall Body (Thân Điện) ─────────────────────────── */}
      <mesh position={[0, 1.35, 0]} castShadow receiveShadow>
        <boxGeometry args={[10.2, 1.5, 2.8]} />
        <meshStandardMaterial color="#5c1616" roughness={0.72} metalness={0.1} />
      </mesh>

      {/* Vermilion Wooden Columns Array along Facade (Hàng cột gỗ sơn son) */}
      {[-4.6, -3.2, -1.8, -0.6, 0.6, 1.8, 3.2, 4.6].map((cx, idx) => (
        <mesh key={idx} position={[cx, 1.35, 1.44]} castShadow>
          <cylinderGeometry args={[0.065, 0.08, 1.5, 8]} />
          <meshStandardMaterial color="#991b1b" roughness={0.5} metalness={0.15} />
        </mesh>
      ))}

      {/* Gilded Ceremonial Doors (Cửa thượng song hạ bản thếp vàng) */}
      {[-3.9, -2.5, -1.2, 0, 1.2, 2.5, 3.9].map((dx, idx) => (
        <mesh key={idx} position={[dx, 1.2, 1.42]} castShadow>
          <boxGeometry args={[0.85, 1.2, 0.04]} />
          <meshStandardMaterial color="#78350f" roughness={0.4} metalness={0.55} />
        </mesh>
      ))}
      {/* Central Golden Throne Screen Glow (Cung son ngai vàng) */}
      <mesh position={[0, 1.25, 1.35]}>
        <boxGeometry args={[1.0, 1.1, 0.02]} />
        <meshStandardMaterial
          color="#d97706"
          emissive="#b45309"
          emissiveIntensity={0.5}
          metalness={0.8}
          roughness={0.2}
        />
      </mesh>

      {/* Gilded Plaque ("ĐIỆN THÁI HÒA") */}
      <mesh position={[0, 1.95, 1.45]}>
        <boxGeometry args={[1.2, 0.32, 0.03]} />
        <meshStandardMaterial color="#d4af37" metalness={0.9} roughness={0.25} />
      </mesh>

      {/* ── 3. Double-Tiered Traditional Roof (Mái trùng thiềm điệp ốc) ────── */}
      {/* Lower Eaves Roof Tier */}
      <group position={[0, 2.25, 0]}>
        <HueImperialRoof width={11.2} length={3.6} height={0.8} tier={1} />
      </group>

      {/* Upper Clerestory Band (Cổ diêm) */}
      <mesh position={[0, 2.75, 0]} castShadow>
        <boxGeometry args={[7.6, 0.5, 2.2]} />
        <meshStandardMaterial color="#501212" roughness={0.65} />
      </mesh>

      {/* Grand Top Roof with Imperial Dragons */}
      <group position={[0, 3.15, 0]}>
        <HueImperialRoof width={8.5} length={2.8} height={0.95} tier={1} />
      </group>

      {/* Imperial Dragon Crest on Top Ridge (Lưỡng Long Chầu Nguyệt) */}
      <group position={[0, 4.15, 0]}>
        {/* Center Pearl / Sun */}
        <mesh position={[0, 0.08, 0]}>
          <sphereGeometry args={[0.14, 8, 8]} />
          <meshStandardMaterial
            color="#fbbf24"
            emissive="#f59e0b"
            emissiveIntensity={0.8}
            metalness={0.9}
          />
        </mesh>
        {/* Flanking Golden Dragons */}
        {[-0.8, 0.8].map((rx, idx) => (
          <mesh key={idx} position={[rx, 0.06, 0]} castShadow>
            <boxGeometry args={[1.1, 0.16, 0.12]} />
            <meshStandardMaterial color="#eab308" metalness={0.85} roughness={0.25} />
          </mesh>
        ))}
      </group>

      {/* ── 4. Royal War Banners Flanking Terrace ─────────────────────────── */}
      {[-5.8, 5.8].map((fx, idx) => (
        <group key={idx} position={[fx, 0.48, 1.8]}>
          <mesh position={[0, 1.3, 0]}>
            <cylinderGeometry args={[0.03, 0.04, 2.6, 6]} />
            <meshStandardMaterial color="#2d1b0d" />
          </mesh>
          <mesh position={[0.38, 2.05, 0]} castShadow>
            <planeGeometry args={[0.65, 0.85]} />
            <meshStandardMaterial
              color="#b91c1c"
              side={THREE.DoubleSide}
              roughness={0.55}
            />
          </mesh>
          <mesh position={[0, 2.65, 0]}>
            <coneGeometry args={[0.06, 0.18, 4]} />
            <meshStandardMaterial color="#eab308" metalness={0.9} />
          </mesh>
        </group>
      ))}

      {/* Soft Palace Interior Glow */}
      <pointLight position={[0, 1.4, 0.8]} color="#fbbf24" intensity={0.7} distance={5.0} />
    </group>
  );
};

/**
 * Distant Northern Rolling Hills & Imperial Capital Silhouettes (Hậu Cảnh Núi Ngự Bình & Kinh Đô)
 * Positioned in deep backdrop (Z = -15.5 to -24.0), perfectly framing the Citadel with ZERO OCCLUSION.
 */
const PhuXuanBackgroundLandscape: React.FC = () => {
  return (
    <group position={[0, 0, 0]} name="PhuXuanBackgroundLandscape">
      {/* ── 1. Forbidden City Rooftop Silhouettes Behind Citadel Wall (Z = -15.5) ── */}
      {[-8.5, -4.2, 4.2, 8.5].map((sx, idx) => (
        <group key={idx} position={[sx, 0, -15.5]}>
          <mesh position={[0, 1.2, 0]} castShadow>
            <boxGeometry args={[3.2, 1.2, 2.0]} />
            <meshStandardMaterial color="#401414" roughness={0.8} />
          </mesh>
          <group position={[0, 1.8, 0]}>
            <HueImperialRoof width={3.6} length={2.2} height={0.65} tier={1} />
          </group>
        </group>
      ))}

      {/* ── 2. Distant Imperial Pines along Citadel Rear Periphery (Z = -17.0) ── */}
      {[-16.0, -14.0, 14.0, 16.0].map((px, idx) => (
        <group key={idx} position={[px, 0, -16.0]}>
          <mesh position={[0, 1.1, 0]}>
            <cylinderGeometry args={[0.08, 0.12, 2.2, 5]} />
            <meshStandardMaterial color="#2d1c10" roughness={0.9} />
          </mesh>
          <mesh position={[0, 2.4, 0]}>
            <dodecahedronGeometry args={[1.2, 0]} />
            <meshStandardMaterial color="#1e3a1f" roughness={0.85} />
          </mesh>
        </group>
      ))}

      {/* ── 3. Distant Rolling Green Karst Hills of Huế (Núi Ngự Bình) (Z = -22.0) ── */}
      {/* Central Majestic Flat-Topped Mountain (Ngự Bình) */}
      <mesh position={[0, 2.8, -22.0]}>
        <coneGeometry args={[11.0, 5.8, 7]} />
        <meshStandardMaterial color="#243828" roughness={0.95} />
      </mesh>
      {/* West Rolling Ridge */}
      <mesh position={[-12.5, 2.2, -21.0]}>
        <coneGeometry args={[9.5, 4.8, 6]} />
        <meshStandardMaterial color="#1f3022" roughness={0.95} />
      </mesh>
      {/* East Rolling Ridge */}
      <mesh position={[12.5, 2.4, -21.0]}>
        <coneGeometry args={[10.0, 5.0, 6]} />
        <meshStandardMaterial color="#1d2e20" roughness={0.95} />
      </mesh>
      {/* Far Distant Mist Ridges */}
      {[-24.0, 24.0].map((mx, idx) => (
        <mesh key={idx} position={[mx, 2.0, -25.0]}>
          <coneGeometry args={[12.0, 4.5, 5]} />
          <meshStandardMaterial color="#19281c" roughness={0.98} opacity={0.7} transparent />
        </mesh>
      ))}
    </group>
  );
};

/**
 * Sông Hương Water Surface Strip
 * Flowing across Rows 1 & 2 (Z between -2.6 and -0.4, X from -14 to 14)
 */
const SongHuongWaterSurface: React.FC = () => {
  const waterRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (waterRef.current) {
      // Subtle water shimmer
      const t = clock.getElapsedTime();
      (waterRef.current.material as THREE.MeshStandardMaterial).roughness =
        0.18 + Math.sin(t * 1.5) * 0.04;
    }
  });

  return (
    <group position={[0, -0.19, -1.5]}>
      {/* River Bed Plane */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[30, 2.8]} />
        <meshStandardMaterial color="#0c2333" roughness={0.95} />
      </mesh>

      {/* Reflective Water Surface */}
      <mesh ref={waterRef} position={[0, 0.015, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[30, 2.75]} />
        <meshStandardMaterial
          color="#164e63" // Perfume River blue-teal
          metalness={0.75}
          roughness={0.2}
          transparent
          opacity={0.88}
        />
      </mesh>

      {/* Riverbank Sandy Edges (North & South) */}
      <mesh position={[0, 0.02, -1.35]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[30, 0.35]} />
        <meshStandardMaterial color="#5c503d" roughness={0.9} />
      </mesh>
      <mesh position={[0, 0.02, 1.35]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[30, 0.35]} />
        <meshStandardMaterial color="#5c503d" roughness={0.9} />
      </mesh>
    </group>
  );
};

/**
 * Main 3D Scene Component for Phú Xuân Battlefield
 */
export const PhuXuanEnvironment3D: React.FC<PhuXuanEnvironment3DProps> = ({
  controlPoints = [],
}) => {
  const westOwner =
    controlPoints.find((cp) => cp.id === 'west_bridge')?.owner || 'neutral';
  const eastOwner =
    controlPoints.find((cp) => cp.id === 'east_bridge')?.owner || 'neutral';
  const courtyardOwner =
    controlPoints.find((cp) => cp.id === 'imperial_courtyard')?.owner || 'player';

  return (
    <group name="PhuXuanEnvironment">
      {/* ───────────────────────────────────────────────────────────── */}
      {/* 1. HORIZONTAL GROUND PLANE (SA BÀN NỀN PHÚ XUÂN)              */}
      {/* Flat at Y = -0.25 (rotation.x = -Math.PI / 2)                */}
      {/* ───────────────────────────────────────────────────────────── */}
      <mesh position={[0, -0.25, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[38, 30]} />
        <meshStandardMaterial
          color="#33442e" // Huế grass & stone foundation
          roughness={0.9}
          metalness={0.03}
        />
      </mesh>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* 2. SÔNG HƯƠNG (PERFUME RIVER)                                 */}
      {/* ───────────────────────────────────────────────────────────── */}
      <SongHuongWaterSurface />

      {/* ───────────────────────────────────────────────────────────── */}
      {/* 3. TWO STRATEGIC BRIDGES (TÂY KIỀU & ĐÔNG KIỀU)               */}
      {/* Col 3: X ≈ -4.33; Col 8: X ≈ +4.33; Row 2: Z ≈ -1.5          */}
      {/* ───────────────────────────────────────────────────────────── */}
      <StrategicBridge3D
        position={[-4.33, 0, -1.5]}
        name="Tây Kiều"
        owner={westOwner}
      />
      <StrategicBridge3D
        position={[4.33, 0, -1.5]}
        name="Đông Kiều"
        owner={eastOwner}
      />

      {/* ───────────────────────────────────────────────────────────── */}
      {/* 4. ENVIRONMENT PROPS ALONG SÔNG HƯƠNG RIVERBANK               */}
      {/* ───────────────────────────────────────────────────────────── */}
      <MooredSampan position={[-8.2, -0.12, -0.75]} rotationY={0.35} />
      <MooredSampan position={[8.4, -0.12, -0.75]} rotationY={-0.28} />
      <MooredSampan position={[-0.2, -0.12, -2.1]} rotationY={0.08} />

      {/* Small Reeds and Rocks along Riverbanks */}
      {[-6.2, -2.1, 2.1, 6.2].map((rx, idx) => (
        <group key={idx} position={[rx, -0.12, -0.45]}>
          <mesh>
            <cylinderGeometry args={[0.015, 0.02, 0.45, 5]} />
            <meshStandardMaterial color="#4d7c0f" roughness={0.8} />
          </mesh>
          <mesh position={[0.08, -0.05, 0.05]}>
            <dodecahedronGeometry args={[0.08]} />
            <meshStandardMaterial color="#64748b" roughness={0.9} />
          </mesh>
        </group>
      ))}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* 5. PHÚ XUÂN CITADEL: KINH THÀNH PHÚ XUÂN (STEP 3 TO 10)       */}
      {/* ───────────────────────────────────────────────────────────── */}
      {/* City Rampart Walls (Step 3) */}
      <PhuXuanCitadelWalls />

      {/* 4 Corner Watchtowers (Step 4) */}
      {/* 1. Bottom-Left / Tây Tiền Tiêu */}
      <PhuXuanWatchTower position={[-12.5, 0, -8.2]} name="Tháp Tiền Tiêu Tây" />
      {/* 2. Bottom-Right / Đông Tiền Tiêu */}
      <PhuXuanWatchTower position={[12.5, 0, -8.2]} name="Tháp Tiền Tiêu Đông" />
      {/* 3. Top-Left / Tây Hậu Vệ */}
      <PhuXuanWatchTower position={[-12.5, 0, -13.5]} name="Tháp Hậu Vệ Tây" />
      {/* 4. Top-Right / Đông Hậu Vệ */}
      <PhuXuanWatchTower position={[12.5, 0, -13.5]} name="Tháp Hậu Vệ Đông" />

      {/* Cổng Ngọ Môn & Lầu Ngũ Phụng (Step 5, 6, 10) */}
      <PhuXuanNgoMonGate position={[0, 0, -8.2]} owner={courtyardOwner} />

      {/* Sân Rồng Hoàng Thành & Đường Ngự Đạo (Step 7 & 10) */}
      <PhuXuanImperialCourtyard owner={courtyardOwner} />

      {/* Điện Thái Hòa (Step 8 — Grand Imperial Palace Hall) */}
      <PhuXuanDienThaiHoa position={[0, 0, -12.2]} />

      {/* ───────────────────────────────────────────────────────────── */}
      {/* 7. DISTANT NORTHERN ROLLING HILLS & FORBIDDEN CITY (STEP 9)   */}
      {/* ───────────────────────────────────────────────────────────── */}
      <PhuXuanBackgroundLandscape />
    </group>
  );
};

