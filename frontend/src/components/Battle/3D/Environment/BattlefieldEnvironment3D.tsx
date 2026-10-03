/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  HÀO KHÍ ĐẠI VIỆT — 3D BATTLEFIELD ENVIRONMENT (BẠCH ĐẰNG 1288)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 *  Comprehensive Vietnamese medieval environment diorama for Bach Dang 1288.
 *
 *  FEATURES:
 *  - Watch Towers (Tháp canh gỗ) with flaming torches & warm point lights
 *  - Wooden Palisades (Hàng rào chông phòng thủ)
 *  - Military Tents & Supply Crates (Lều quân doanh & Rương lương thảo)
 *  - Bamboo Groves & Mangrove Trees (Khóm tre ngà & Cây ngập mặn)
 *  - River Stakes (Bãi cọc gỗ Bạch Đằng vạt nhọn) in river shallows
 *  - Distant Warships Fleet (Hạm đội chiến thuyền trên sông viễn cảnh)
 *  - Atmospheric Particles (Bụi vàng hoàng hôn bập bùng)
 *
 *  PLACEMENT RULES:
 *  - All objects stand 90° upright (rotation.x = 0, rotation.z = 0)
 *  - Placed strictly around the perimeter to keep the central battlefield readable!
 * ═══════════════════════════════════════════════════════════════════════════
 */

import React, { useRef, useMemo } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { MATERIALS } from '../../../../design/tokens';

// ─────────────────────────────────────────────────────────────────────────
// 1. WATCH TOWER (Tháp canh tiền tiêu Bạch Đằng)
// ─────────────────────────────────────────────────────────────────────────
export const WatchTower3D: React.FC<{
  position: [number, number, number];
  rotationY?: number;
}> = ({ position, rotationY = 0 }) => {
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      {/* 4 Wooden Support Posts */}
      {[
        [-0.5, -0.5],
        [0.5, -0.5],
        [-0.5, 0.5],
        [0.5, 0.5],
      ].map(([px, pz], i) => (
        <mesh key={i} position={[px, 1.3, pz]} castShadow>
          <cylinderGeometry args={[0.07, 0.09, 2.6, 6]} />
          <meshStandardMaterial color="#4a301a" roughness={0.9} />
        </mesh>
      ))}

      {/* Crossbeam braces */}
      <mesh position={[0, 0.8, 0]}>
        <boxGeometry args={[1.15, 0.08, 1.15]} />
        <meshStandardMaterial color="#382414" roughness={0.9} />
      </mesh>
      <mesh position={[0, 1.8, 0]}>
        <boxGeometry args={[1.15, 0.08, 1.15]} />
        <meshStandardMaterial color="#382414" roughness={0.9} />
      </mesh>

      {/* Platform Floor */}
      <mesh position={[0, 2.6, 0]} castShadow>
        <boxGeometry args={[1.5, 0.12, 1.5]} />
        <meshStandardMaterial color="#54371f" roughness={0.85} />
      </mesh>

      {/* Railings */}
      {[-0.65, 0.65].map((x, i) => (
        <mesh key={i} position={[x, 2.9, 0]}>
          <boxGeometry args={[0.06, 0.5, 1.4]} />
          <meshStandardMaterial color="#3d2817" roughness={0.9} />
        </mesh>
      ))}

      {/* Thatched / Tiled Watch Tower Roof */}
      <mesh position={[0, 3.7, 0]} castShadow>
        <coneGeometry args={[1.4, 0.7, 4]} />
        <meshStandardMaterial color="#854d0e" roughness={0.7} />
      </mesh>

      {/* Roof peak gold finial */}
      <mesh position={[0, 4.15, 0]}>
        <sphereGeometry args={[0.08, 8, 8]} />
        <meshStandardMaterial color="#f59e0b" metalness={0.8} roughness={0.2} />
      </mesh>

      {/* Flaming Beacon Torch */}
      <mesh position={[0, 2.85, 0]}>
        <cylinderGeometry args={[0.1, 0.06, 0.35, 6]} />
        <meshStandardMaterial color="#92400e" metalness={0.7} />
      </mesh>
      {/* Flame */}
      <mesh position={[0, 3.12, 0]}>
        <sphereGeometry args={[0.12, 8, 8]} />
        <meshBasicMaterial color="#f97316" />
      </mesh>
      {/* Torch Light */}
      <pointLight position={[0, 3.15, 0]} color="#ff8833" intensity={0.9} distance={4.5} />
    </group>
  );
};

// ─────────────────────────────────────────────────────────────────────────
// 2. WOODEN PALISADE WALL (Hàng rào chông phòng thủ)
// ─────────────────────────────────────────────────────────────────────────
export const WoodenPalisade3D: React.FC<{
  position: [number, number, number];
  length?: number;
  rotationY?: number;
}> = ({ position, length = 3.0, rotationY = 0 }) => {
  const stakeCount = Math.round(length / 0.28);
  const stakes = useMemo(() => {
    return Array.from({ length: stakeCount }).map((_, i) => ({
      x: (i - stakeCount / 2) * 0.28,
      h: 0.9 + (i % 3) * 0.15,
      r: 0.06 + (i % 2) * 0.015,
    }));
  }, [stakeCount]);

  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      {/* Horizontal binding beam */}
      <mesh position={[0, 0.45, 0]}>
        <boxGeometry args={[length, 0.08, 0.08]} />
        <meshStandardMaterial color="#3d2817" roughness={0.9} />
      </mesh>

      {/* Sharpened stakes */}
      {stakes.map((s, idx) => (
        <group key={idx} position={[s.x, 0, 0]}>
          <mesh position={[0, s.h * 0.45, 0]} castShadow>
            <cylinderGeometry args={[s.r * 0.8, s.r, s.h * 0.9, 5]} />
            <meshStandardMaterial color="#4a3520" roughness={0.9} />
          </mesh>
          <mesh position={[0, s.h * 0.9 + 0.1, 0]} castShadow>
            <coneGeometry args={[s.r * 0.8, 0.24, 5]} />
            <meshStandardMaterial color="#2d1c10" roughness={0.95} />
          </mesh>
        </group>
      ))}
    </group>
  );
};

// ─────────────────────────────────────────────────────────────────────────
// 3. SUPPLY CRATES & RICE BARRELS (Rương thùng lương thảo & Binh khí)
// ─────────────────────────────────────────────────────────────────────────
export const SupplyCrates3D: React.FC<{
  position: [number, number, number];
  rotationY?: number;
}> = ({ position, rotationY = 0 }) => {
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      {/* Bottom Large Crate */}
      <mesh position={[0, 0.25, 0]} castShadow>
        <boxGeometry args={[0.7, 0.5, 0.7]} />
        <meshStandardMaterial color="#54371f" roughness={0.85} />
      </mesh>
      {/* Iron band on crate */}
      <mesh position={[0, 0.25, 0]}>
        <boxGeometry args={[0.71, 0.06, 0.71]} />
        <meshStandardMaterial color="#334155" metalness={0.8} roughness={0.3} />
      </mesh>

      {/* Top smaller crate */}
      <mesh position={[0.08, 0.65, 0.05]} rotation={[0, 0.2, 0]} castShadow>
        <boxGeometry args={[0.5, 0.35, 0.5]} />
        <meshStandardMaterial color="#6a4527" roughness={0.8} />
      </mesh>

      {/* Rice / Water Barrel */}
      <mesh position={[-0.55, 0.3, 0.15]} castShadow>
        <cylinderGeometry args={[0.22, 0.2, 0.6, 10]} />
        <meshStandardMaterial color="#78350f" roughness={0.8} />
      </mesh>

      {/* Weapon rack / spear bundle */}
      <group position={[0.5, 0, -0.2]} rotation={[0, -0.4, 0]}>
        {[-0.08, 0, 0.08].map((offset, i) => (
          <mesh key={i} position={[offset, 0.65, 0]}>
            <cylinderGeometry args={[0.015, 0.015, 1.3, 5]} />
            <meshStandardMaterial color="#3d2817" />
          </mesh>
        ))}
      </group>
    </group>
  );
};

// ─────────────────────────────────────────────────────────────────────────
// 4. BAMBOO GROVE (Khóm tre Đại Việt)
// ─────────────────────────────────────────────────────────────────────────
export const BambooGrove3D: React.FC<{
  position: [number, number, number];
  stalkCount?: number;
}> = ({ position, stalkCount = 6 }) => {
  const stalks = useMemo(() => {
    return Array.from({ length: stalkCount }).map((_, i) => ({
      x: (Math.sin(i * 1.5) * 0.45),
      z: (Math.cos(i * 1.5) * 0.45),
      h: 1.4 + (i % 3) * 0.4,
      r: 0.035 + (i % 2) * 0.01,
    }));
  }, [stalkCount]);

  return (
    <group position={position}>
      {stalks.map((s, idx) => (
        <group key={idx} position={[s.x, 0, s.z]}>
          {/* Bamboo stalk */}
          <mesh position={[0, s.h * 0.5, 0]} castShadow>
            <cylinderGeometry args={[s.r * 0.8, s.r, s.h, 6]} />
            <meshStandardMaterial color="#65a30d" roughness={0.7} />
          </mesh>
          {/* Bamboo nodes */}
          {[0.3, 0.6, 0.9].map((ratio, ni) => (
            <mesh key={ni} position={[0, s.h * ratio, 0]}>
              <torusGeometry args={[s.r * 0.95, 0.012, 4, 8]} />
              <meshStandardMaterial color="#365314" roughness={0.8} />
            </mesh>
          ))}
          {/* Leaf Canopy */}
          <mesh position={[0, s.h + 0.25, 0]} castShadow>
            <coneGeometry args={[0.35, 0.65, 6]} />
            <meshStandardMaterial color="#2d5a27" roughness={0.8} />
          </mesh>
        </group>
      ))}
    </group>
  );
};

// ─────────────────────────────────────────────────────────────────────────
// 5. MANGROVE / WETLAND WILLOW (Cây ngập mặn mép nước)
// ─────────────────────────────────────────────────────────────────────────
export const MangroveTree3D: React.FC<{
  position: [number, number, number];
  scale?: number;
}> = ({ position, scale = 1.0 }) => {
  return (
    <group position={position} scale={[scale, scale, scale]}>
      {/* Gnarled Trunk */}
      <mesh position={[0, 0.9, 0]} castShadow>
        <cylinderGeometry args={[0.15, 0.28, 1.8, 7]} />
        <meshStandardMaterial color="#3d2817" roughness={0.9} />
      </mesh>

      {/* Exposed roots dipping into water */}
      {[0, 1.5, 3.1, 4.7].map((angle, idx) => (
        <mesh
          key={idx}
          position={[Math.cos(angle) * 0.3, 0.25, Math.sin(angle) * 0.3]}
        >
          <cylinderGeometry args={[0.06, 0.09, 0.6, 5]} />
          <meshStandardMaterial color="#291b0f" roughness={0.95} />
        </mesh>
      ))}

      {/* Dense Canopy */}
      <mesh position={[0, 2.1, 0]} castShadow>
        <dodecahedronGeometry args={[0.9, 1]} />
        <meshStandardMaterial color="#1b4324" roughness={0.85} />
      </mesh>
      <mesh position={[0.2, 2.4, -0.2]} castShadow>
        <dodecahedronGeometry args={[0.65, 1]} />
        <meshStandardMaterial color="#2a5c32" roughness={0.8} />
      </mesh>
    </group>
  );
};

// ─────────────────────────────────────────────────────────────────────────
// 6. BACH DANG RIVER STAKES IN SHALLOWS (Bãi cọc ven bờ)
// ─────────────────────────────────────────────────────────────────────────
export const RiverShallowStakes3D: React.FC<{
  position: [number, number, number];
  tideTurnsLeft: number;
}> = ({ position, tideTurnsLeft }) => {
  const isLowTide = tideTurnsLeft <= 1;
  const stakeHeight = isLowTide ? 1.0 : 0.65;

  return (
    <group position={position}>
      {[
        [-0.4, -0.2, 0.06],
        [0.2, 0.3, -0.05],
        [-0.1, 0.5, 0.08],
        [0.4, -0.3, -0.07],
        [0.0, 0.0, 0.03],
      ].map(([ox, oz, rot], idx) => (
        <group key={idx} position={[ox, 0, oz]} rotation={[0, rot * 10, 0]}>
          <mesh position={[0, stakeHeight * 0.4, 0]} castShadow>
            <cylinderGeometry args={[0.08, 0.1, stakeHeight * 0.8, 6]} />
            <meshStandardMaterial color="#382414" roughness={0.95} />
          </mesh>
          <mesh position={[0, stakeHeight * 0.8 + 0.14, 0]} castShadow>
            <coneGeometry args={[0.08, 0.28, 6]} />
            <meshStandardMaterial color="#1f140a" roughness={0.95} metalness={0.1} />
          </mesh>
        </group>
      ))}
    </group>
  );
};

// ─────────────────────────────────────────────────────────────────────────
// 7. DISTANT HORIZON WARSHIPS (Chiến thuyền viễn cảnh trên sông)
// ─────────────────────────────────────────────────────────────────────────
export const DistantWarship3D: React.FC<{
  position: [number, number, number];
  isDaiViet?: boolean;
  scale?: number;
  rotationY?: number;
}> = ({ position, isDaiViet = true, scale = 0.65, rotationY = 0 }) => {
  return (
    <group position={position} scale={[scale, scale, scale]} rotation={[0, rotationY, 0]}>
      {/* Hull */}
      <mesh position={[0, 0.15, 0]}>
        <boxGeometry args={[1.2, 0.5, 3.2]} />
        <meshStandardMaterial color={isDaiViet ? '#4a301a' : '#261a12'} roughness={0.9} />
      </mesh>
      {/* Mast */}
      <mesh position={[0, 1.4, 0]}>
        <cylinderGeometry args={[0.04, 0.05, 2.5, 5]} />
        <meshStandardMaterial color="#2d1c10" />
      </mesh>
      {/* Sail */}
      <mesh position={[0.4, 1.5, 0]} rotation={[0, 0.15, 0]}>
        <planeGeometry args={[1.0, 1.8]} />
        <meshStandardMaterial
          color={isDaiViet ? '#fef3c7' : '#1e293b'}
          side={THREE.DoubleSide}
          roughness={0.9}
        />
      </mesh>
    </group>
  );
};

// ─────────────────────────────────────────────────────────────────────────
// 8. ATMOSPHERIC FLOATING PARTICLES (Bụi vàng hoàng hôn & tàn lửa)
// ─────────────────────────────────────────────────────────────────────────
export const AtmosphericDustMotes3D: React.FC = () => {
  const count = 42;
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  // Precompute initial positions
  const particles = useMemo(() => {
    return Array.from({ length: count }).map(() => ({
      x: (Math.random() - 0.5) * 36,
      y: 0.5 + Math.random() * 5.0,
      z: (Math.random() - 0.5) * 26,
      speedY: 0.15 + Math.random() * 0.25,
      speedX: 0.1 + Math.random() * 0.2,
      scale: 0.035 + Math.random() * 0.045,
    }));
  }, [count]);

  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    const t = clock.getElapsedTime();

    particles.forEach((p, i) => {
      const y = ((p.y + Math.sin(t * p.speedY + i) * 0.8) % 6.0);
      const x = p.x + Math.cos(t * p.speedX + i) * 0.6;
      dummy.position.set(x, y, p.z);
      dummy.scale.setScalar(p.scale);
      dummy.updateMatrix();
      meshRef.current?.setMatrixAt(i, dummy.matrix);
    });
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
      <sphereGeometry args={[1, 6, 6]} />
      <meshBasicMaterial
        color="#fbbf24"
        transparent
        opacity={0.55}
        blending={THREE.AdditiveBlending}
      />
    </instancedMesh>
  );
};

// ─────────────────────────────────────────────────────────────────────────
// MAIN EXPORT: BATTLEFIELD ENVIRONMENT
// ─────────────────────────────────────────────────────────────────────────
export const BattlefieldEnvironment3D: React.FC<{ tideTurnsLeft: number }> = ({
  tideTurnsLeft,
}) => {
  return (
    <group>
      {/* ── Watch Towers along river flanks ─────────────────────── */}
      <WatchTower3D position={[-12.8, 0, -4.8]} rotationY={Math.PI / 6} />
      <WatchTower3D position={[-12.8, 0, 4.8]} rotationY={-Math.PI / 6} />
      <WatchTower3D position={[12.8, 0, -4.8]} rotationY={-Math.PI / 6} />
      <WatchTower3D position={[12.8, 0, 4.8]} rotationY={Math.PI / 6} />

      {/* ── Wooden Palisade barricades flanking grid ────────────── */}
      <WoodenPalisade3D position={[-10.5, 0, -5.8]} length={3.5} rotationY={0.15} />
      <WoodenPalisade3D position={[-10.5, 0, 5.8]} length={3.5} rotationY={-0.15} />
      <WoodenPalisade3D position={[10.5, 0, -5.8]} length={3.5} rotationY={-0.15} />
      <WoodenPalisade3D position={[10.5, 0, 5.8]} length={3.5} rotationY={0.15} />

      {/* ── Supply Crates & Weapon Racks near Camps ─────────────── */}
      <SupplyCrates3D position={[-11.2, 0, -1.8]} rotationY={0.4} />
      <SupplyCrates3D position={[-11.5, 0, 2.2]} rotationY={-0.3} />
      <SupplyCrates3D position={[11.2, 0, -1.8]} rotationY={-0.4} />
      <SupplyCrates3D position={[11.5, 0, 2.2]} rotationY={0.3} />

      {/* ── Bamboo Groves along riverbanks ───────────────────────── */}
      <BambooGrove3D position={[-8.5, 0, -6.8]} stalkCount={7} />
      <BambooGrove3D position={[-6.2, 0, 6.8]} stalkCount={6} />
      <BambooGrove3D position={[8.5, 0, -6.8]} stalkCount={6} />
      <BambooGrove3D position={[6.2, 0, 6.8]} stalkCount={7} />

      {/* ── Mangrove Wetland Trees ──────────────────────────────── */}
      <MangroveTree3D position={[-9.5, -0.15, -8.0]} scale={1.2} />
      <MangroveTree3D position={[-4.5, -0.2, 8.2]} scale={1.1} />
      <MangroveTree3D position={[9.5, -0.15, -8.0]} scale={1.2} />
      <MangroveTree3D position={[4.5, -0.2, 8.2]} scale={1.1} />

      {/* ── Bach Dang River Stakes in Water Shallows ─────────────── */}
      <RiverShallowStakes3D position={[-5.0, -0.24, -5.5]} tideTurnsLeft={tideTurnsLeft} />
      <RiverShallowStakes3D position={[0.0, -0.24, -6.0]} tideTurnsLeft={tideTurnsLeft} />
      <RiverShallowStakes3D position={[5.0, -0.24, -5.5]} tideTurnsLeft={tideTurnsLeft} />
      <RiverShallowStakes3D position={[-3.0, -0.24, 6.0]} tideTurnsLeft={tideTurnsLeft} />
      <RiverShallowStakes3D position={[3.0, -0.24, 6.0]} tideTurnsLeft={tideTurnsLeft} />

      {/* ── Distant Warships on the Bach Dang River Horizon ──────── */}
      <DistantWarship3D position={[-8.5, -0.22, -15]} isDaiViet scale={0.7} rotationY={0.3} />
      <DistantWarship3D position={[-1.5, -0.22, -17]} isDaiViet scale={0.8} rotationY={0.1} />
      <DistantWarship3D position={[5.5, -0.22, -16]} isDaiViet={false} scale={0.75} rotationY={-0.2} />
      <DistantWarship3D position={[11.5, -0.22, -14]} isDaiViet={false} scale={0.7} rotationY={-0.35} />

      {/* ── Atmospheric Dust / Sunset Embers ─────────────────────── */}
      <AtmosphericDustMotes3D />
    </group>
  );
};
