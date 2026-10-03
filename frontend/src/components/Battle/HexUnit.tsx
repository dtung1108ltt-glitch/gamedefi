import React, { useRef, useMemo, useState } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import { BattleUnit, HexTile } from '../../types';
import { hexToWorld3D, getHexSurfacePosition } from './3D/battle3DMath';
import { BACH_DANG_HEXES } from '../../data/campaign';
import { THANG_LONG_HEXES } from '../../data/thangLongCampaign';
import { LAM_SON_HEXES } from '../../data/lamSonCampaign';
import { PHU_XUAN_HEXES } from '../../data/phuXuanCampaign';
import { GeneralCharacter } from './characters/GeneralCharacter';

interface HexUnitProps {
  unit: BattleUnit;
  isSelected: boolean;
  onSelect: () => void;
  actionEvents?: { id: number; attackerId: string; targetId: string; type: string }[];
  isAutoRunning?: boolean;
  hexes?: HexTile[];
}

/**
 * Procedural Stylized Character Model Components
 */

// Conical Bamboo Helmet (Nón Dấu Đại Việt) with Bronze Finial
const NonDauHelmet: React.FC = () => (
  <group position={[0, 1.34, 0]}>
    <mesh castShadow>
      <coneGeometry args={[0.32, 0.22, 16]} />
      <meshStandardMaterial color="#c29d5b" roughness={0.75} />
    </mesh>
    {/* Bronze finial on top */}
    <mesh position={[0, 0.14, 0]}>
      <coneGeometry args={[0.04, 0.08, 6]} />
      <meshStandardMaterial color="#f59e0b" metalness={0.8} roughness={0.25} />
    </mesh>
    {/* Silk Chin Strap */}
    <mesh position={[0, -0.16, 0.02]}>
      <torusGeometry args={[0.16, 0.015, 4, 12, Math.PI]} />
      <meshStandardMaterial color="#1e3a8a" />
    </mesh>
  </group>
);

// Mongol Iron Helmet with Fur Trim
const MongolHelmet: React.FC = () => (
  <group position={[0, 1.35, 0]}>
    <mesh castShadow>
      <sphereGeometry args={[0.2, 12, 12, 0, Math.PI * 2, 0, Math.PI * 0.6]} />
      <meshStandardMaterial color="#475569" metalness={0.85} roughness={0.25} />
    </mesh>
    <mesh position={[0, 0.16, 0]}>
      <cylinderGeometry args={[0.02, 0.02, 0.12, 6]} />
      <meshStandardMaterial color="#d97706" metalness={0.9} />
    </mesh>
    <mesh position={[0, -0.05, 0]}>
      <torusGeometry args={[0.19, 0.05, 6, 12]} />
      <meshStandardMaterial color="#78350f" roughness={0.9} />
    </mesh>
  </group>
);

// Frontline Shield
const RattanShield: React.FC<{ isPlayer: boolean }> = ({ isPlayer }) => (
  <mesh position={[0.28, 0.65, 0.2]} rotation={[0, -0.3, 0]} castShadow>
    <boxGeometry args={[0.08, 0.62, 0.42]} />
    <meshStandardMaterial
      color={isPlayer ? '#b45309' : '#334155'}
      metalness={isPlayer ? 0.35 : 0.65}
      roughness={0.65}
    />
  </mesh>
);

// Weapon: Spear / Bow / Dao / Sword
const UnitWeapon: React.FC<{ icon: string; isPlayer: boolean }> = ({ icon, isPlayer }) => {
  if (icon === 'archer') {
    return (
      <group>
        {/* Recurve Bow */}
        <group position={[-0.28, 0.7, 0.1]} rotation={[0, 0, 0.2]}>
          <mesh castShadow>
            <torusGeometry args={[0.36, 0.02, 6, 16, Math.PI * 0.9]} />
            <meshStandardMaterial color="#78350f" roughness={0.7} />
          </mesh>
          <mesh position={[0.02, 0, 0]}>
            <cylinderGeometry args={[0.005, 0.005, 0.72, 4]} />
            <meshBasicMaterial color="#e2e8f0" />
          </mesh>
        </group>
        {/* Back Quiver with arrows */}
        <group position={[0.14, 0.75, -0.16]} rotation={[0.2, 0, -0.2]}>
          <mesh castShadow>
            <cylinderGeometry args={[0.06, 0.05, 0.45, 6]} />
            <meshStandardMaterial color="#451a03" roughness={0.9} />
          </mesh>
          {[-0.02, 0.02].map((ox, idx) => (
            <mesh key={idx} position={[ox, 0.26, 0]}>
              <coneGeometry args={[0.025, 0.12, 4]} />
              <meshStandardMaterial color={isPlayer ? '#dc2626' : '#475569'} />
            </mesh>
          ))}
        </group>
      </group>
    );
  }

  if (icon === 'commander') {
    return (
      <group position={[-0.32, 0.65, 0.25]} rotation={[0.4, 0, 0]}>
        <mesh position={[0, 0.25, 0]} castShadow>
          <boxGeometry args={[0.04, 0.85, 0.08]} />
          <meshStandardMaterial color="#e2e8f0" metalness={0.9} roughness={0.15} />
        </mesh>
        <mesh position={[0, -0.18, 0]}>
          <cylinderGeometry args={[0.025, 0.025, 0.25, 6]} />
          <meshStandardMaterial color="#92400e" metalness={0.8} />
        </mesh>
      </group>
    );
  }

  // Spear with Red Tassel (Tua giáo đỏ)
  return (
    <group position={[-0.26, 0.8, 0.15]} rotation={[0.15, 0, 0]}>
      {/* Shaft */}
      <mesh position={[0, 0.3, 0]} castShadow>
        <cylinderGeometry args={[0.02, 0.022, 1.8, 6]} />
        <meshStandardMaterial color="#4a301a" roughness={0.85} />
      </mesh>
      {/* Red silk tassel */}
      <mesh position={[0, 1.1, 0]}>
        <coneGeometry args={[0.08, 0.18, 6]} />
        <meshStandardMaterial color={isPlayer ? '#ef4444' : '#1e293b'} roughness={0.7} />
      </mesh>
      {/* Steel Spearhead */}
      <mesh position={[0, 1.28, 0]} castShadow>
        <coneGeometry args={[0.065, 0.32, 6]} />
        <meshStandardMaterial color="#cbd5e1" metalness={0.9} roughness={0.15} />
      </mesh>
    </group>
  );
};

// War Elephant Model for Dai Viet
const WarElephantModel: React.FC = () => {
  return (
    <group position={[0, 0, 0]}>
      {/* Elephant Body */}
      <mesh position={[0, 0.9, 0]} castShadow>
        <boxGeometry args={[1.1, 0.95, 1.8]} />
        <meshStandardMaterial color="#4b5563" roughness={0.9} />
      </mesh>
      {/* 4 Sturdy Legs */}
      {[
        [-0.4, -0.4, -0.6],
        [0.4, -0.4, -0.6],
        [-0.4, -0.4, 0.6],
        [0.4, -0.4, 0.6],
      ].map(([lx, ly, lz], i) => (
        <mesh key={i} position={[lx, 0.45, lz]} castShadow>
          <cylinderGeometry args={[0.16, 0.19, 0.85, 8]} />
          <meshStandardMaterial color="#374151" roughness={0.95} />
        </mesh>
      ))}
      {/* Head & Trunk */}
      <mesh position={[0, 1.15, 1.1]} castShadow>
        <sphereGeometry args={[0.42, 12, 12]} />
        <meshStandardMaterial color="#4b5563" roughness={0.9} />
      </mesh>
      <mesh position={[0, 0.65, 1.45]} rotation={[-0.4, 0, 0]}>
        <cylinderGeometry args={[0.1, 0.16, 0.8, 8]} />
        <meshStandardMaterial color="#4b5563" />
      </mesh>
      {/* Ivory Tusks with brass caps */}
      <mesh position={[-0.22, 0.85, 1.35]} rotation={[0.4, -0.2, 0]}>
        <coneGeometry args={[0.06, 0.55, 6]} />
        <meshStandardMaterial color="#fef08a" metalness={0.3} roughness={0.3} />
      </mesh>
      <mesh position={[0.22, 0.85, 1.35]} rotation={[0.4, 0.2, 0]}>
        <coneGeometry args={[0.06, 0.55, 6]} />
        <meshStandardMaterial color="#fef08a" metalness={0.3} roughness={0.3} />
      </mesh>
      {/* Royal Howdah (Bành voi Đại Việt) */}
      <mesh position={[0, 1.6, -0.1]} castShadow>
        <boxGeometry args={[0.85, 0.45, 0.95]} />
        <meshStandardMaterial color="#991b1b" roughness={0.6} />
      </mesh>
    </group>
  );
};

// Steppe Warhorse Model for Mongol
const WarhorseModel: React.FC = () => {
  return (
    <group position={[0, 0, 0]}>
      {/* Body */}
      <mesh position={[0, 0.75, 0]} castShadow>
        <boxGeometry args={[0.65, 0.6, 1.4]} />
        <meshStandardMaterial color="#3f2e1f" roughness={0.8} />
      </mesh>
      {/* 4 Legs */}
      {[
        [-0.25, 0.35, -0.45],
        [0.25, 0.35, -0.45],
        [-0.25, 0.35, 0.45],
        [0.25, 0.35, 0.45],
      ].map(([lx, ly, lz], i) => (
        <mesh key={i} position={[lx, ly, lz]} castShadow>
          <cylinderGeometry args={[0.07, 0.08, 0.7, 6]} />
          <meshStandardMaterial color="#2d1f14" roughness={0.9} />
        </mesh>
      ))}
      {/* Neck & Head */}
      <mesh position={[0, 1.05, 0.7]} rotation={[0.4, 0, 0]} castShadow>
        <boxGeometry args={[0.26, 0.6, 0.4]} />
        <meshStandardMaterial color="#3f2e1f" />
      </mesh>
    </group>
  );
};

export const HexUnit: React.FC<HexUnitProps> = ({
  unit,
  isSelected,
  onSelect,
  actionEvents = [],
  isAutoRunning = true,
  hexes,
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const visualRef = useRef<THREE.Group>(null);

  const isPlayer = unit.side === 'player';
  const isCommander = unit.icon === 'commander' || !!unit.is_commander;
  const isElephant = unit.icon === 'elephant';
  const isCavalry = unit.icon === 'cavalry';

  // ── Terrain-aware surface positioning ───────────────────────────────
  // Look up the terrain type for this hex so the unit sits at the correct
  // surface height (wall=0.45, gate=0.15, fort=0.25, courtyard=0.08, etc.)
  const hexTerrain = useMemo(
    () => hexes?.find(h => h.col === unit.col && h.row === unit.row)?.terrain
       ?? PHU_XUAN_HEXES.find(h => h.col === unit.col && h.row === unit.row)?.terrain
       ?? LAM_SON_HEXES.find(h => h.col === unit.col && h.row === unit.row)?.terrain
       ?? THANG_LONG_HEXES.find(h => h.col === unit.col && h.row === unit.row)?.terrain
       ?? BACH_DANG_HEXES.find(h => h.col === unit.col && h.row === unit.row)?.terrain,
    [unit.col, unit.row, hexes]
  );

  const [targetX, targetY, targetZ] = useMemo(
    () => hexToWorld3D(unit.col, unit.row, hexTerrain),
    [unit.col, unit.row, hexTerrain]
  );

  // Smooth position interpolation
  const currentPos = useRef(new THREE.Vector3(targetX, targetY, targetZ));
  const [animState, setAnimState] = useState<'idle' | 'walk' | 'attack' | 'hit' | 'skill'>('idle');

  // Trigger attack/hit animation when actionEvents changes
  React.useEffect(() => {
    const isAttacker = actionEvents.some((e) => e.attackerId === unit.unit_id);
    const isTarget = actionEvents.some((e) => e.targetId === unit.unit_id);

    if (isAttacker) {
      setAnimState('attack');
      const timer = setTimeout(() => setAnimState('idle'), 500);
      return () => clearTimeout(timer);
    }
    if (isTarget) {
      setAnimState('hit');
      const timer = setTimeout(() => setAnimState('idle'), 400);
      return () => clearTimeout(timer);
    }
  }, [actionEvents, unit.unit_id]);

  // Orientation: Đại Việt units face +X (towards Mongol); Mongol units face -X (towards Dai Viet)
  const defaultFacingY = isPlayer ? Math.PI / 2 : -Math.PI / 2;

  // Frame animation loop
  useFrame(({ clock }, delta) => {
    if (!groupRef.current) return;

    // Position interpolation (walking towards new hex)
    const targetVec = new THREE.Vector3(targetX, targetY, targetZ);
    const dist = currentPos.current.distanceTo(targetVec);

    if (dist > 0.05) {
      currentPos.current.lerp(targetVec, Math.min(1, delta * 6));
      groupRef.current.position.copy(currentPos.current);
    } else {
      groupRef.current.position.set(targetX, targetY, targetZ);
    }

    // Upright stance: strictly perpendicular to battlefield floor (rotation.x = 0, rotation.z = 0)
    groupRef.current.rotation.x = 0;
    groupRef.current.rotation.z = 0;

    // Subtle idle breathing & bobbing
    if (visualRef.current) {
      const t = clock.getElapsedTime() + (unit.col * 2 + unit.row);
      const idleBob = Math.sin(t * 2.5) * 0.02;
      visualRef.current.position.y = idleBob;

      // Attack lunge
      if (animState === 'attack') {
        const lunge = (isPlayer ? 0.35 : -0.35) * Math.sin(clock.getElapsedTime() * 14);
        visualRef.current.position.x = lunge;
      } else if (animState === 'hit') {
        visualRef.current.position.x = isPlayer ? -0.2 : 0.2;
      } else {
        visualRef.current.position.x = 0;
      }
    }
  });

  const maxHealth = isCommander ? 180 : 130;
  const healthPercent = Math.max(0, Math.min(100, Math.round((unit.stats.at / maxHealth) * 100)));
  const isAlive = unit.stats.at > 0;

  if (!isAlive && animState !== 'hit') {
    return null; // Defeated unit removed cleanly from battlefield
  }

  return (
    <group
      ref={groupRef}
      position={[targetX, targetY, targetZ]}
      rotation={[0, defaultFacingY, 0]}
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
    >
      {/* ======================================================== */}
      {/* 1. GROUND PLANE ELEMENTS (Shadow & Selection Ring)      */}
      {/* ======================================================== */}
      {/* Soft Feathered Contact Shadow on hex surface */}
      <mesh position={[0, 0.012, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[isElephant ? 1.05 : isCommander ? 0.78 : 0.52, 24]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.22} />
      </mesh>
      <mesh position={[0, 0.018, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[isElephant ? 0.72 : isCommander ? 0.52 : 0.35, 24]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.42} />
      </mesh>

      {/* Commander Dedicated Ground Aura */}
      {isCommander && (
        <mesh position={[0, 0.022, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.62, 0.75, 24]} />
          <meshBasicMaterial
            color={isPlayer ? '#f59e0b' : '#ef4444'}
            transparent
            opacity={0.35}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}

      {/* Selection Ring */}
      {isSelected && (
        <mesh position={[0, 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.72, 0.85, 24]} />
          <meshBasicMaterial
            color={isCommander ? '#f59e0b' : '#38bdf8'}
            transparent
            opacity={0.85}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}

      {/* ======================================================== */}
      {/* 2. UPRIGHT 3D MODEL (Stands 90° Perpendicular to Ground) */}
      {/* ======================================================== */}
      <group ref={visualRef} scale={isCommander ? 1.30 : 1.0}>
        {isCommander ? (
          /* ──────────────────────────────────────────────────────── */
          /* GENERAL CHARACTER — Full dedicated model                */
          /* Replaces the old inline commander rendering with the    */
          /* premium GeneralCharacter component (bronze helmet,      */
          /* lamellar armor, beard, beige cape, halberd, banner).    */
          /* Pivot at feet (Y=0), scaled 1.30× by parent group.     */
          /* ──────────────────────────────────────────────────────── */
          <GeneralCharacter isPlayer={isPlayer} commanderName={unit.name} />
        ) : (
          /* ──────────────────────────────────────────────────────── */
          /* ORDINARY SOLDIER — Existing inline models               */
          /* Spearman, Archer, Cavalry, Elephant                     */
          /* ──────────────────────────────────────────────────────── */
          <>
            {/* Render Mount if Elephant or Cavalry */}
            {isElephant && <WarElephantModel />}
            {isCavalry && <WarhorseModel />}

            {/* Humanoid Warrior Figure */}
            <group position={[0, isElephant ? 1.7 : isCavalry ? 0.85 : 0, 0]}>
              {/* Legs & Boots (Grounded at Y=0) */}
              {[-0.1, 0.1].map((lx, idx) => (
                <group key={idx} position={[lx, 0, 0]}>
                  <mesh position={[0, 0.2, 0]} castShadow>
                    <cylinderGeometry args={[0.07, 0.08, 0.4, 6]} />
                    <meshStandardMaterial color={isPlayer ? '#1e3a8a' : '#331515'} roughness={0.8} />
                  </mesh>
                  <mesh position={[0, 0.04, 0.02]} castShadow>
                    <boxGeometry args={[0.09, 0.08, 0.13]} />
                    <meshStandardMaterial color="#2d1c10" roughness={0.9} />
                  </mesh>
                </group>
              ))}

              {/* Belt & Sash */}
              <mesh position={[0, 0.42, 0]} castShadow>
                <boxGeometry args={[0.38, 0.08, 0.26]} />
                <meshStandardMaterial color={isPlayer ? '#06b6d4' : '#475569'} roughness={0.6} />
              </mesh>
              {/* Bronze Belt Buckle */}
              <mesh position={[0, 0.42, 0.135]}>
                <boxGeometry args={[0.08, 0.06, 0.02]} />
                <meshStandardMaterial color="#f59e0b" metalness={0.85} roughness={0.2} />
              </mesh>

              {/* Torso & Armor with Faction Colors */}
              <mesh position={[0, 0.7, 0]} castShadow>
                <boxGeometry args={[0.42, 0.5, 0.28]} />
                <meshStandardMaterial
                  color={isPlayer ? '#1e40af' : '#7f1d1d'}
                  metalness={isPlayer ? 0.3 : 0.45}
                  roughness={0.55}
                />
              </mesh>

              {/* Pauldron Shoulder Armor Plates */}
              {[-0.24, 0.24].map((sx, idx) => (
                <mesh key={idx} position={[sx, 0.88, 0]} castShadow>
                  <boxGeometry args={[0.12, 0.1, 0.22]} />
                  <meshStandardMaterial
                    color={isPlayer ? '#b45309' : '#334155'}
                    metalness={0.7}
                    roughness={0.35}
                  />
                </mesh>
              ))}

              {/* Head & Face */}
              <mesh position={[0, 1.14, 0]} castShadow>
                <sphereGeometry args={[0.18, 12, 12]} />
                <meshStandardMaterial color="#d4a373" roughness={0.8} />
              </mesh>

              {/* Helmet based on side */}
              {isPlayer ? <NonDauHelmet /> : <MongolHelmet />}

              {/* Frontline Shield (if melee infantry) */}
              {!isElephant && unit.icon === 'spear' && (
                <RattanShield isPlayer={isPlayer} />
              )}

              {/* Weapon */}
              {!isElephant && <UnitWeapon icon={unit.icon} isPlayer={isPlayer} />}
            </group>

            {/* Unit Flag Banner */}
            <group position={[-0.32, isElephant ? 2.1 : 1.1, -0.2]}>
              <mesh position={[0, 0.45, 0]}>
                <cylinderGeometry args={[0.015, 0.02, 1.1, 6]} />
                <meshStandardMaterial color="#451a03" />
              </mesh>
              <mesh position={[0.22, 0.75, 0]}>
                <planeGeometry args={[0.38, 0.45]} />
                <meshStandardMaterial
                  color={isPlayer ? '#1e40af' : '#991b1b'}
                  side={THREE.DoubleSide}
                />
              </mesh>
            </group>
          </>
        )}
      </group>

      {/* ======================================================== */}
      {/* 3. FLOATING STATUS (Health Bar & Crown Tag above unit)   */}
      {/* ======================================================== */}
      <Html
        position={[0, isElephant ? 3.35 : isCommander ? 2.55 : 2.05, 0]}
        center
        distanceFactor={22}
        style={{ pointerEvents: 'none', userSelect: 'none' }}
      >
        <div className="flex flex-col items-center">
          {/* Commander Gold Crown Badge */}
          {isCommander && (
            <div className="text-[11px] -mb-1 animate-bounce select-none drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">
              👑
            </div>
          )}

          {/* Guerrilla Ambush Stealth Badge */}
          {unit.is_hidden && (
            <div className="text-[8px] -mb-0.5 select-none font-bold text-emerald-300 drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] bg-emerald-950/90 px-1 py-0.2 rounded border border-emerald-500/70 shadow-[0_0_6px_rgba(16,185,129,0.5)] flex items-center gap-0.5 whitespace-nowrap">
              <span>🌲</span> ẨN MÌNH
            </div>
          )}

          {/* Thin, Rounded, Clean Strategy Health Bar */}
          <div
            className={`h-1.5 rounded-full overflow-hidden bg-black/85 p-[1px] shadow-[0_2px_6px_rgba(0,0,0,0.8)] border ${
              isCommander
                ? 'w-14 border-[#f59e0b]/80 shadow-[0_0_8px_rgba(245,158,11,0.3)]'
                : 'w-11 border-slate-700/80'
            }`}
          >
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                isPlayer
                  ? 'bg-gradient-to-r from-cyan-400 via-teal-300 to-emerald-400 shadow-[0_0_4px_rgba(6,182,212,0.8)]'
                  : 'bg-gradient-to-r from-red-600 via-rose-500 to-amber-500 shadow-[0_0_4px_rgba(239,68,68,0.8)]'
              }`}
              style={{ width: `${healthPercent}%` }}
            />
          </div>

          {/* Unit Name preview when selected */}
          {isSelected && (
            <div className="mt-1 px-2 py-0.5 rounded-md bg-[#0a141d]/90 border border-[#c9a44c]/70 text-[9px] text-[#f3e5ab] font-serif font-bold whitespace-nowrap shadow-lg backdrop-blur-sm">
              {unit.name}
            </div>
          )}
        </div>
      </Html>
    </group>
  );
};

