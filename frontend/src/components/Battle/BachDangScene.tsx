import React, { useEffect } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import type { BattleUnit, HexTile, ControlPointState } from '../../types';
import { HexTile3D } from './3D/HexTile3D';
import { WaterPlane3D } from './3D/WaterPlane3D';
import { BaseCamps3D } from './3D/BaseCamps3D';
import { BattlefieldEnvironment3D } from './3D/Environment/BattlefieldEnvironment3D';
import { ThangLongEnvironment3D } from './3D/Environment/ThangLongEnvironment3D';
import { LamSonEnvironment3D } from './3D/Environment/LamSonEnvironment3D';
import { PhuXuanEnvironment3D } from './3D/Environment/PhuXuanEnvironment3D';
import { Projectiles3D, ProjectileEvent, DamagePopupEvent } from './3D/Projectiles3D';
import { HexUnit } from './HexUnit';
import {
  CAMERA_LOCK,
  BATTLEFIELD_ROOT,
  CANVAS_CONFIG,
  FOG,
  SCENE_BG,
} from '../../foundation/battlefield';

interface BachDangSceneProps {
  battlefieldId?: string;
  units: BattleUnit[];
  hexes: HexTile[];
  selectedUnitId: string | null;
  selectedHex: { col: number; row: number } | null;
  validTargets: Set<string>;
  deploymentHexKeys?: Set<string>;
  commandAuraKeys?: Set<string>;
  tideTurnsLeft: number;
  projectiles: ProjectileEvent[];
  popups: DamagePopupEvent[];
  onSelectHex: (col: number, row: number) => void;
  onSelectUnit: (unitId: string) => void;
  isAutoRunning?: boolean;
  actionEvents?: { id: number; attackerId: string; targetId: string; type: string }[];
  controlPoints?: ControlPointState[];
}

// ─────────────────────────────────────────────────────────────────────────
// FIXED CAMERA OBSERVER — ABSOLUTE LOCK
// ─────────────────────────────────────────────────────────────────────────
//
// This component enforces the camera contract from foundation/battlefield.ts.
// It runs on EVERY frame to guarantee that nothing (OrbitControls, animation
// callbacks, third-party code, browser resize) can ever move the camera.
//
// The camera is set to CAMERA_LOCK values and locked there permanently.
// There is NO camera shake, NO auto-pan, NO follow, NO zoom, NO transition.
// ─────────────────────────────────────────────────────────────────────────

const FixedCameraObserver: React.FC = () => {
  const { camera } = useThree();

  // Set camera on mount — the ONLY place camera values are written.
  useEffect(() => {
    camera.position.set(
      CAMERA_LOCK.position[0],
      CAMERA_LOCK.position[1],
      CAMERA_LOCK.position[2]
    );
    camera.lookAt(
      CAMERA_LOCK.lookAt[0],
      CAMERA_LOCK.lookAt[1],
      CAMERA_LOCK.lookAt[2]
    );
    camera.updateProjectionMatrix();
  }, [camera]);

  // No useFrame — camera is set once and stays. The Canvas camera prop
  // handles initial positioning, and this effect locks it on mount.
  // Nothing else in the codebase writes to camera.position or camera.rotation.

  return null;
};

// ─────────────────────────────────────────────────────────────────────────
// BATTLEFIELD SCENE — LOCKED STAGE
// ─────────────────────────────────────────────────────────────────────────
//
// Structure:
//   Canvas (CAMERA_LOCK.fov, CAMERA_LOCK.position)
//     └── FixedCameraObserver (enforces lock on mount)
//     └── fog (FOG constants)
//     └── lights (sunset rig — visual only)
//     └── <group> BattlefieldRoot (BATTLEFIELD_ROOT — always at origin)
//           ├── WaterPlane3D
//           ├── BaseCamps3D
//           ├── HexTile3D[] (hex grid)
//           ├── HexUnit[] (units — only their local transforms change)
//           └── Projectiles3D (VFX — only their local transforms change)
//
// NOTHING inside this tree may modify:
//   - camera.position
//   - camera.rotation
//   - camera.fov
//   - BattlefieldRoot group position/rotation/scale
// ─────────────────────────────────────────────────────────────────────────

export const BachDangScene: React.FC<BachDangSceneProps> = ({
  battlefieldId,
  units,
  hexes,
  selectedUnitId,
  selectedHex,
  validTargets,
  deploymentHexKeys,
  commandAuraKeys,
  tideTurnsLeft,
  projectiles,
  popups,
  onSelectHex,
  onSelectUnit,
  isAutoRunning = true,
  actionEvents = [],
  controlPoints,
}) => {
  const isPhuXuan = battlefieldId === 'phu_xuan' || battlefieldId === 'phu-xuan';
  const isLamSon = battlefieldId === 'lam_son' || battlefieldId === 'lam-son';
  const isThangLong = battlefieldId === 'thang_long' || battlefieldId === 'thang-long';

  const sceneBgColor = isPhuXuan
    ? '#1a2622'
    : isLamSon
    ? '#1c2e24'
    : isThangLong
    ? '#3d5239'
    : '#0a1d2b';

  return (
    <div
      className="absolute inset-0 w-full h-full overflow-hidden"
      style={{ background: sceneBgColor }}
    >
      <Canvas
        shadows={CANVAS_CONFIG.shadows}
        gl={{
          antialias: CANVAS_CONFIG.antialias,
          alpha: CANVAS_CONFIG.alpha,
          powerPreference: CANVAS_CONFIG.powerPreference,
        }}
        camera={{
          position: [CAMERA_LOCK.position[0], CAMERA_LOCK.position[1], CAMERA_LOCK.position[2]],
          fov: CAMERA_LOCK.fov,
          near: CAMERA_LOCK.near,
          far: CAMERA_LOCK.far,
        }}
      >
        {/* ══════════════════════════════════════════════════════════ */}
        {/* CAMERA LOCK — Set once, never touched again              */}
        {/* ══════════════════════════════════════════════════════════ */}
        <FixedCameraObserver />

        {/* ══════════════════════════════════════════════════════════ */}
        {/* ATMOSPHERE — visual only, no gameplay effect              */}
        {/* ══════════════════════════════════════════════════════════ */}
        <fog
          attach="fog"
          args={
            isPhuXuan
              ? ['#2e4038', 30, 82]
              : isLamSon
              ? ['#284236', 30, 80]
              : isThangLong
              ? ['#dcd3c4', 32, 85]
              : ['#0e2434', 28, 76]
          }
        />

        {/* Lighting setup: Golden afternoon for Phú Xuân, Forest morning for Lam Sơn, Bright morning for Thăng Long, Sunset for Bạch Đằng */}
        {isPhuXuan ? (
          <>
            {/* Warm afternoon imperial ambiance */}
            <ambientLight intensity={0.94} color="#fef3c7" />
            <directionalLight
              position={[-12, 26, 15]}
              intensity={1.80}
              color="#ffedd5"
              castShadow
              shadow-mapSize-width={2048}
              shadow-mapSize-height={2048}
              shadow-bias={-0.0001}
              shadow-camera-left={-22}
              shadow-camera-right={22}
              shadow-camera-top={18}
              shadow-camera-bottom={-18}
            />
            {/* River reflection emerald fill light */}
            <directionalLight position={[14, 15, -8]} intensity={0.60} color="#6ee7b7" />
            {/* Golden rear rim light */}
            <directionalLight position={[0, 18, -20]} intensity={0.45} color="#fed7aa" />
            {/* Hemisphere sky vs emerald river valley bounce */}
            <hemisphereLight args={['#fef3c7', '#1a2e26', 0.65]} />
          </>
        ) : isLamSon ? (
          <>
            {/* Morning mountain forest ambient */}
            <ambientLight intensity={0.92} color="#c2d5c8" />
            {/* Morning sun cutting through mountain karst mist */}
            <directionalLight
              position={[-14, 25, 14]}
              intensity={1.82}
              color="#fff7ed"
              castShadow
              shadow-mapSize-width={2048}
              shadow-mapSize-height={2048}
              shadow-bias={-0.0001}
              shadow-camera-left={-22}
              shadow-camera-right={22}
              shadow-camera-top={18}
              shadow-camera-bottom={-18}
            />
            {/* Limestone rock reflection & canopy fill light */}
            <directionalLight position={[14, 15, -8]} intensity={0.58} color="#9ec5ab" />
            {/* Forest rim highlight */}
            <directionalLight position={[0, 18, -20]} intensity={0.42} color="#e6f4ea" />
            {/* Sky vs lush forest ground bounce */}
            <hemisphereLight args={['#e1f0e5', '#1a3324', 0.68]} />
          </>
        ) : isThangLong ? (
          <>
            <ambientLight intensity={0.96} color="#fff6e8" />
            <directionalLight
              position={[-12, 26, 16]}
              intensity={1.85}
              color="#fff8ea"
              castShadow
              shadow-mapSize-width={2048}
              shadow-mapSize-height={2048}
              shadow-bias={-0.0001}
              shadow-camera-left={-22}
              shadow-camera-right={22}
              shadow-camera-top={18}
              shadow-camera-bottom={-18}
            />
            <directionalLight position={[14, 16, -8]} intensity={0.55} color="#e0f2fe" />
            <directionalLight position={[0, 18, -20]} intensity={0.4} color="#fef08a" />
            <hemisphereLight args={['#fef9ee', '#3e5c3b', 0.65]} />
          </>
        ) : (
          <>
            {/* Ambient illumination with warm sunset glow — bright and readable */}
            <ambientLight intensity={0.88} color="#ffe8c7" />

            {/* Primary Sunset Sun (Key Light) */}
            <directionalLight
              position={[-15, 24, 14]}
              intensity={1.75}
              color="#ffa94d"
              castShadow
              shadow-mapSize-width={2048}
              shadow-mapSize-height={2048}
              shadow-bias={-0.0001}
              shadow-camera-left={-22}
              shadow-camera-right={22}
              shadow-camera-top={16}
              shadow-camera-bottom={-16}
            />

            {/* Secondary River Reflection (Fill Light) */}
            <directionalLight position={[15, 14, -8]} intensity={0.65} color="#60a5fa" />

            {/* Rear Sunset Rim Light (Edge Separation for Characters & Terrain) */}
            <directionalLight position={[0, 16, -20]} intensity={0.45} color="#ffd8a8" />

            {/* Hemisphere ambient for sky vs river water bounce */}
            <hemisphereLight args={['#ffebd2', '#0f3147', 0.65]} />
          </>
        )}

        {/* ══════════════════════════════════════════════════════════ */}
        {/* BATTLEFIELD ROOT — IMMUTABLE TRANSFORM AT WORLD ORIGIN   */}
        {/*                                                          */}
        {/* This <group> is the single parent of ALL battlefield      */}
        {/* geometry. Its position/rotation/scale are set from        */}
        {/* BATTLEFIELD_ROOT constants and MUST NOT change at runtime.*/}
        {/* ══════════════════════════════════════════════════════════ */}
        <group
          position={[
            BATTLEFIELD_ROOT.position[0],
            BATTLEFIELD_ROOT.position[1],
            BATTLEFIELD_ROOT.position[2],
          ]}
          rotation={[
            BATTLEFIELD_ROOT.rotation[0],
            BATTLEFIELD_ROOT.rotation[1],
            BATTLEFIELD_ROOT.rotation[2],
          ]}
          scale={[
            BATTLEFIELD_ROOT.scale[0],
            BATTLEFIELD_ROOT.scale[1],
            BATTLEFIELD_ROOT.scale[2],
          ]}
        >
          {isPhuXuan ? (
            <PhuXuanEnvironment3D controlPoints={controlPoints} />
          ) : isLamSon ? (
            <LamSonEnvironment3D />
          ) : isThangLong ? (
            <ThangLongEnvironment3D />
          ) : (
            <>
              {/* ── Water ──────────────────────────────────────────── */}
              <WaterPlane3D tideTurnsLeft={tideTurnsLeft} />

              {/* ── Base Camps (diorama flanks) ─────────────────────── */}
              <BaseCamps3D />

              {/* ── Perimeter Medieval Environment (towers, bamboo, palisades, stakes) */}
              <BattlefieldEnvironment3D tideTurnsLeft={tideTurnsLeft} />
            </>
          )}

          {/* ── Hex Tile Grid ──────────────────────────────────── */}
          <group>
            {hexes.map((tile) => {
              const key = `${tile.col}-${tile.row}`;
              const isSelected = selectedHex?.col === tile.col && selectedHex?.row === tile.row;
              const isValid = validTargets.has(key);

              return (
                <HexTile3D
                  key={key}
                  tile={tile}
                  isSelected={isSelected}
                  isValidTarget={isValid}
                  isDeploymentHex={deploymentHexKeys?.has(key) ?? false}
                  isCommandAura={commandAuraKeys?.has(key) ?? false}
                  tideTurnsLeft={tideTurnsLeft}
                  onSelect={onSelectHex}
                />
              );
            })}
          </group>

          {/* ── Units (only unit-local transforms may change) ───── */}
          <group>
            {units.map((unit) => {
              const isSelected = unit.unit_id === selectedUnitId;
              return (
                <HexUnit
                  key={unit.unit_id}
                  unit={unit}
                  hexes={hexes}
                  isSelected={isSelected}
                  onSelect={() => onSelectUnit(unit.unit_id)}
                  actionEvents={actionEvents}
                  isAutoRunning={isAutoRunning}
                />
              );
            })}
          </group>

          {/* ── Combat VFX (projectiles, damage popups) ─────────── */}
          <Projectiles3D projectiles={projectiles} popups={popups} />
        </group>
      </Canvas>
    </div>
  );
};
