import React, { useRef, useMemo } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import { hexToWorld3D } from './battle3DMath';

export interface ProjectileEvent {
  id: number;
  fromCol: number;
  fromRow: number;
  toCol: number;
  toRow: number;
  type: 'arrow' | 'slash' | 'skill';
  progress: number;
}

export interface DamagePopupEvent {
  id: number;
  col: number;
  row: number;
  dmg: number;
  color: string;
  createdAt: number;
}

/**
 * 3D Parabolic Flying Arrow with fire trail
 */
const ParabolicArrow: React.FC<{
  from: [number, number, number];
  to: [number, number, number];
  progress: number;
}> = ({ from, to, progress }) => {
  const meshRef = useRef<THREE.Group>(null);

  // Parabolic trajectory: peak height in middle
  const currentPos = useMemo(() => {
    const t = Math.max(0, Math.min(1, progress));
    const x = from[0] + (to[0] - from[0]) * t;
    const z = from[2] + (to[2] - from[2]) * t;
    const arcHeight = 2.4;
    const y = from[1] + (to[1] - from[1]) * t + Math.sin(t * Math.PI) * arcHeight;
    return new THREE.Vector3(x, y, z);
  }, [from, to, progress]);

  // Compute tangent heading
  const rotation = useMemo(() => {
    const t = Math.max(0, Math.min(1, progress));
    const dt = 0.05;
    const nextT = Math.min(1, t + dt);
    const nx = from[0] + (to[0] - from[0]) * nextT;
    const nz = from[2] + (to[2] - from[2]) * nextT;
    const ny = from[1] + (to[1] - from[1]) * nextT + Math.sin(nextT * Math.PI) * 2.4;
    
    const dir = new THREE.Vector3(nx - currentPos.x, ny - currentPos.y, nz - currentPos.z).normalize();
    const euler = new THREE.Euler();
    euler.setFromVector3(dir);
    return euler;
  }, [from, to, progress, currentPos]);

  return (
    <group ref={meshRef} position={currentPos} rotation={rotation}>
      {/* Arrow shaft */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.015, 0.015, 0.6, 6]} />
        <meshBasicMaterial color="#78350f" />
      </mesh>
      {/* Arrow head */}
      <mesh position={[0, 0, 0.35]} rotation={[Math.PI / 2, 0, 0]}>
        <coneGeometry args={[0.04, 0.12, 6]} />
        <meshBasicMaterial color="#e2e8f0" />
      </mesh>
      {/* Flaming glow */}
      <pointLight color="#f97316" intensity={1.5} distance={1.2} />
      <mesh position={[0, 0, 0.15]}>
        <sphereGeometry args={[0.08, 8, 8]} />
        <meshBasicMaterial color="#fbbf24" transparent opacity={0.7} />
      </mesh>
    </group>
  );
};

/**
 * Melee Slash Wave on Floor / Target
 */
const MeleeSlash: React.FC<{
  position: [number, number, number];
  progress: number;
}> = ({ position, progress }) => {
  const scale = 0.5 + progress * 0.8;
  const opacity = Math.max(0, 1 - progress);

  return (
    <group position={[position[0], position[1] + 0.3, position[2]]}>
      {/* Glowing curved slice */}
      <mesh rotation={[-Math.PI / 3, 0, progress * Math.PI]} scale={[scale, scale, scale]}>
        <torusGeometry args={[0.6, 0.06, 8, 24, Math.PI * 0.8]} />
        <meshBasicMaterial color="#ef4444" transparent opacity={opacity} />
      </mesh>
      <pointLight color="#ef4444" intensity={2 * opacity} distance={1.5} />
    </group>
  );
};

/**
 * Commander Rage / Skill Shockwave expanding on floor
 */
const SkillShockwave: React.FC<{
  position: [number, number, number];
  progress: number;
}> = ({ position, progress }) => {
  const radius = 0.4 + progress * 1.8;
  const opacity = Math.max(0, 1 - progress);

  return (
    <group position={[position[0], position[1] + 0.05, position[2]]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[radius * 0.85, radius, 32]} />
        <meshBasicMaterial color="#f59e0b" transparent opacity={opacity * 0.85} side={THREE.DoubleSide} />
      </mesh>
      <pointLight color="#f59e0b" intensity={3 * opacity} distance={2.5} />
    </group>
  );
};

/**
 * Floating 3D Damage Number
 */
const DamagePopup3D: React.FC<{
  popup: DamagePopupEvent;
}> = ({ popup }) => {
  const [worldX, worldY, worldZ] = useMemo(
    () => hexToWorld3D(popup.col, popup.row),
    [popup.col, popup.row]
  );

  const elapsed = (Date.now() - popup.createdAt) / 1000;
  const yOffset = Math.min(1.8, elapsed * 1.2);
  const opacity = Math.max(0, 1 - elapsed / 1.2);

  if (opacity <= 0) return null;

  return (
    <Html
      position={[worldX, worldY + 1.2 + yOffset, worldZ]}
      center
      distanceFactor={18}
      style={{ pointerEvents: 'none', userSelect: 'none' }}
    >
      <div
        className="font-display font-black text-2xl drop-shadow-[0_2px_4px_rgba(0,0,0,1)] transition-opacity"
        style={{
          color: popup.color,
          opacity,
          transform: `scale(${1 + Math.sin(elapsed * 4) * 0.15})`,
          textShadow: '0 0 10px rgba(0,0,0,0.8), 0 2px 4px #000',
        }}
      >
        -{popup.dmg}
      </div>
    </Html>
  );
};

export const Projectiles3D: React.FC<{
  projectiles: ProjectileEvent[];
  popups: DamagePopupEvent[];
}> = ({ projectiles, popups }) => {
  return (
    <group>
      {/* Flying & Active combat VFX */}
      {projectiles.map((proj) => {
        const fromPos = hexToWorld3D(proj.fromCol, proj.fromRow);
        const toPos = hexToWorld3D(proj.toCol, proj.toRow);

        if (proj.type === 'arrow') {
          return (
            <ParabolicArrow
              key={proj.id}
              from={[fromPos[0], fromPos[1] + 0.6, fromPos[2]]}
              to={[toPos[0], toPos[1] + 0.5, toPos[2]]}
              progress={proj.progress}
            />
          );
        }

        if (proj.type === 'slash') {
          return <MeleeSlash key={proj.id} position={toPos} progress={proj.progress} />;
        }

        if (proj.type === 'skill') {
          return <SkillShockwave key={proj.id} position={fromPos} progress={proj.progress} />;
        }

        return null;
      })}

      {/* Floating 3D Damage Numbers */}
      {popups.map((popup) => (
        <DamagePopup3D key={popup.id} popup={popup} />
      ))}
    </group>
  );
};

