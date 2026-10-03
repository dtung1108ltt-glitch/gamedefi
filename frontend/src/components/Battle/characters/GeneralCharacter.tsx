/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  HÀO KHÍ ĐẠI VIỆT — GENERAL CHARACTER MODEL
 * ═══════════════════════════════════════════════════════════════════════════
 *
 *  Vietnamese historical commander — premium stylized 3D miniature.
 *
 *  VISUAL SPEC:
 *    Chibi/chunky proportions · Semi-realistic PBR · Strong silhouette
 *    Bronze historical helmet · Vietnamese lamellar armor · Black beard
 *    Beige cape · Long spear/halberd · Heroic commander appearance
 *
 *  PLACEMENT CONTRACT:
 *    - Origin/pivot is at the character's FEET (Y=0 is ground contact)
 *    - Always upright: rotation.x = 0, rotation.z = 0
 *    - Scale: 1.25–1.4× ordinary soldier height
 *    - Feet touch hex surface — no floating, no sinking
 *
 *  STRUCTURE:
 *    GeneralCharacter
 *    ├── Shadow (contact shadow on ground)
 *    ├── VisualRoot (scale container)
 *    │   ├── Body (chunky torso + legs)
 *    │   ├── Head (skin sphere)
 *    │   ├── Beard (black facial hair)
 *    │   ├── Helmet (bronze historical Đại Việt helmet)
 *    │   ├── Armor (Vietnamese-inspired lamellar cuirass)
 *    │   ├── Shoulders (pauldron armor plates)
 *    │   ├── Cape (beige flowing cape)
 *    │   ├── Weapon (long halberd/spear)
 *    │   └── Banner (commander war standard)
 *    └── (status HUD is rendered by parent HexUnit)
 *
 *  All materials reference design/tokens.ts MATERIALS presets.
 * ═══════════════════════════════════════════════════════════════════════════
 */

import React from 'react';
import * as THREE from 'three';
import { MATERIALS } from '../../../design/tokens';

interface GeneralCharacterProps {
  /** true = Đại Việt / Lam Sơn (player), false = Invader (enemy) */
  isPlayer: boolean;
  commanderName?: string;
}

// ─────────────────────────────────────────────────────────────────────────
// SUB-COMPONENTS — Internal model parts
// All positions are relative to the character's feet (Y=0 = ground)
// ─────────────────────────────────────────────────────────────────────────

/**
 * Bronze Historical Helmet — Đại Việt style (Mũ trụ đồng)
 * Inspired by Đông Sơn / Trần dynasty bronze military helmets.
 * Dome shape with cheek guards, crest finial, and gold trim.
 */
const GeneralHelmet: React.FC<{ isPlayer: boolean }> = ({ isPlayer }) => (
  <group position={[0, 1.52, 0]}>
    {/* Main dome — aged bronze */}
    <mesh castShadow>
      <sphereGeometry args={[0.22, 14, 14, 0, Math.PI * 2, 0, Math.PI * 0.55]} />
      <meshStandardMaterial
        color={MATERIALS.agedBronze.color}
        metalness={MATERIALS.agedBronze.metalness}
        roughness={MATERIALS.agedBronze.roughness}
      />
    </mesh>

    {/* Brim / visor ring — polished bronze */}
    <mesh position={[0, -0.02, 0]}>
      <torusGeometry args={[0.21, 0.035, 8, 16]} />
      <meshStandardMaterial
        color={MATERIALS.polishedBronze.color}
        metalness={MATERIALS.polishedBronze.metalness}
        roughness={MATERIALS.polishedBronze.roughness}
      />
    </mesh>

    {/* Cheek guards — left & right bronze plates */}
    {[-0.18, 0.18].map((xOff, i) => (
      <mesh key={i} position={[xOff, -0.12, 0.04]} castShadow>
        <boxGeometry args={[0.08, 0.18, 0.06]} />
        <meshStandardMaterial
          color={MATERIALS.agedBronze.color}
          metalness={0.75}
          roughness={0.35}
        />
      </mesh>
    ))}

    {/* Crest / Finial spike — gold spire atop helmet */}
    <mesh position={[0, 0.18, 0]} castShadow>
      <coneGeometry args={[0.04, 0.22, 6]} />
      <meshStandardMaterial
        color={MATERIALS.imperialGold.color}
        metalness={MATERIALS.imperialGold.metalness}
        roughness={MATERIALS.imperialGold.roughness}
      />
    </mesh>

    {/* Decorative ridge running front-to-back */}
    <mesh position={[0, 0.1, 0]} rotation={[0, 0, Math.PI / 2]}>
      <cylinderGeometry args={[0.015, 0.015, 0.38, 4]} />
      <meshStandardMaterial
        color={MATERIALS.imperialGold.color}
        metalness={0.85}
        roughness={0.25}
      />
    </mesh>

    {/* Plume / tassel — red for Đại Việt, dark for Mông Nguyên */}
    <mesh position={[0, 0.08, -0.15]} castShadow>
      <coneGeometry args={[0.06, 0.35, 6]} />
      <meshStandardMaterial
        color={isPlayer ? '#b91c1c' : '#1e293b'}
        roughness={0.75}
      />
    </mesh>
  </group>
);

/**
 * Vietnamese-Inspired Lamellar Armor Cuirass
 * Layered plate strips with gold trim, covering the torso.
 */
const LamellarArmor: React.FC<{ isPlayer: boolean }> = ({ isPlayer }) => {
  const baseColor = isPlayer ? '#7f2020' : '#1a1a2e';
  return (
    <group position={[0, 0.68, 0]}>
      {/* Main cuirass body — chunky box with lamellar look */}
      <mesh castShadow>
        <boxGeometry args={[0.50, 0.60, 0.32]} />
        <meshStandardMaterial
          color={baseColor}
          metalness={0.50}
          roughness={0.55}
        />
      </mesh>

      {/* Lamellar strip rows — 4 horizontal bands across the front */}
      {[0.18, 0.06, -0.06, -0.18].map((yOff, i) => (
        <mesh key={i} position={[0, yOff, 0.17]} castShadow>
          <boxGeometry args={[0.46, 0.08, 0.02]} />
          <meshStandardMaterial
            color={MATERIALS.agedBronze.color}
            metalness={0.70}
            roughness={0.35}
          />
        </mesh>
      ))}

      {/* Central imperial emblem disc — gold Đông Sơn tiger/dragon */}
      <mesh position={[0, 0.04, 0.175]}>
        <circleGeometry args={[0.11, 10]} />
        <meshStandardMaterial
          color={MATERIALS.imperialGold.color}
          metalness={MATERIALS.imperialGold.metalness}
          roughness={MATERIALS.imperialGold.roughness}
        />
      </mesh>

      {/* Belt / waist sash — gold trim at bottom */}
      <mesh position={[0, -0.32, 0]}>
        <boxGeometry args={[0.52, 0.06, 0.34]} />
        <meshStandardMaterial
          color={MATERIALS.imperialGold.color}
          metalness={0.75}
          roughness={0.30}
        />
      </mesh>
    </group>
  );
};

/**
 * Shoulder Pauldrons — bronze armor plates on each shoulder
 */
const ShoulderPauldrons: React.FC = () => (
  <group>
    {/* Left pauldron */}
    <mesh position={[-0.32, 0.92, 0]} castShadow>
      <boxGeometry args={[0.16, 0.12, 0.22]} />
      <meshStandardMaterial
        color={MATERIALS.polishedBronze.color}
        metalness={MATERIALS.polishedBronze.metalness}
        roughness={MATERIALS.polishedBronze.roughness}
      />
    </mesh>
    {/* Right pauldron */}
    <mesh position={[0.32, 0.92, 0]} castShadow>
      <boxGeometry args={[0.16, 0.12, 0.22]} />
      <meshStandardMaterial
        color={MATERIALS.polishedBronze.color}
        metalness={MATERIALS.polishedBronze.metalness}
        roughness={MATERIALS.polishedBronze.roughness}
      />
    </mesh>
    {/* Gold trim on each pauldron */}
    {[-0.32, 0.32].map((xOff, i) => (
      <mesh key={i} position={[xOff, 0.87, 0]}>
        <boxGeometry args={[0.17, 0.025, 0.23]} />
        <meshStandardMaterial
          color={MATERIALS.imperialGold.color}
          metalness={0.85}
          roughness={0.20}
        />
      </mesh>
    ))}
  </group>
);

/**
 * Beige Flowing Cape — drapes from shoulders down the back
 */
const GeneralCape: React.FC<{ isQuangTrung?: boolean }> = ({ isQuangTrung }) => (
  <group position={[0, 0.60, -0.20]}>
    {/* Main cape body — beige or imperial crimson fabric */}
    <mesh castShadow>
      <planeGeometry args={[0.65, 1.05]} />
      <meshStandardMaterial
        color={isQuangTrung ? '#991b1b' : '#c8b591'}
        roughness={0.70}
        side={THREE.DoubleSide}
      />
    </mesh>
    {/* Gold clasp at neckline */}
    <mesh position={[0, 0.48, 0.01]}>
      <circleGeometry args={[0.06, 8]} />
      <meshStandardMaterial
        color={MATERIALS.imperialGold.color}
        metalness={MATERIALS.imperialGold.metalness}
        roughness={0.20}
      />
    </mesh>
    {/* Cape bottom trim */}
    <mesh position={[0, -0.50, 0.005]}>
      <boxGeometry args={[0.63, 0.04, 0.005]} />
      <meshStandardMaterial
        color={isQuangTrung ? '#f59e0b' : '#a08b6b'}
        roughness={0.60}
        metalness={isQuangTrung ? 0.6 : 0.1}
      />
    </mesh>
  </group>
);

/**
 * Quang Trung's Imperial Sabre (Đao Lệnh Tây Sơn)
 */
const QuangTrungSabre: React.FC = () => (
  <group position={[-0.30, 0.45, 0.18]} rotation={[0.18, 0, 0.15]}>
    {/* Curved Sabre Blade with high polish steel */}
    <mesh position={[0.04, 0.52, 0]} rotation={[0, 0, -0.1]} castShadow>
      <boxGeometry args={[0.08, 0.90, 0.025]} />
      <meshStandardMaterial color="#f1f5f9" metalness={0.92} roughness={0.12} />
    </mesh>
    {/* Curved Blade Tip */}
    <mesh position={[0.10, 0.98, 0]} rotation={[0, 0, -0.35]} castShadow>
      <coneGeometry args={[0.05, 0.22, 4]} />
      <meshStandardMaterial color="#f8fafc" metalness={0.95} roughness={0.10} />
    </mesh>
    {/* Dragon Gold Crossguard */}
    <mesh position={[0, 0.08, 0]}>
      <boxGeometry args={[0.24, 0.05, 0.07]} />
      <meshStandardMaterial color="#f59e0b" metalness={0.88} roughness={0.18} />
    </mesh>
    {/* Royal Red Grip with wrap */}
    <mesh position={[0, -0.06, 0]}>
      <cylinderGeometry args={[0.022, 0.022, 0.24, 6]} />
      <meshStandardMaterial color="#7f1d1d" roughness={0.7} />
    </mesh>
    {/* Gold Dragon Pommel */}
    <mesh position={[0, -0.18, 0]}>
      <sphereGeometry args={[0.04, 8, 8]} />
      <meshStandardMaterial color="#f59e0b" metalness={0.9} roughness={0.15} />
    </mesh>
  </group>
);

/**
 * Long Halberd / Spear — Đại đao (Great Blade) or Trường thương
 * Held in left hand, extends tall above the general's head.
 */
const GeneralHalberd: React.FC = () => (
  <group position={[-0.30, 0.0, 0.15]}>
    {/* Long wooden shaft */}
    <mesh position={[0, 1.20, 0]} castShadow>
      <cylinderGeometry args={[0.025, 0.03, 2.40, 8]} />
      <meshStandardMaterial
        color={MATERIALS.darkWood.color}
        roughness={MATERIALS.darkWood.roughness}
      />
    </mesh>

    {/* Spearhead blade — wide crescent halberd blade */}
    <mesh position={[0, 2.42, 0]} castShadow>
      <coneGeometry args={[0.10, 0.45, 6]} />
      <meshStandardMaterial
        color={MATERIALS.steelBlade.color}
        metalness={MATERIALS.steelBlade.metalness}
        roughness={MATERIALS.steelBlade.roughness}
      />
    </mesh>

    {/* Cross-guard / Halberd hook blade */}
    <mesh position={[0.08, 2.22, 0]} rotation={[0, 0, -0.3]}>
      <boxGeometry args={[0.20, 0.04, 0.03]} />
      <meshStandardMaterial
        color={MATERIALS.steelBlade.color}
        metalness={0.85}
        roughness={0.20}
      />
    </mesh>

    {/* Gold ferrule at blade junction */}
    <mesh position={[0, 2.18, 0]}>
      <cylinderGeometry args={[0.04, 0.04, 0.08, 8]} />
      <meshStandardMaterial
        color={MATERIALS.imperialGold.color}
        metalness={0.85}
        roughness={0.20}
      />
    </mesh>

    {/* Leather grip wrapping at hold point */}
    <mesh position={[0, 0.85, 0]}>
      <cylinderGeometry args={[0.035, 0.035, 0.30, 6]} />
      <meshStandardMaterial
        color={MATERIALS.leatherGrip.color}
        roughness={MATERIALS.leatherGrip.roughness}
      />
    </mesh>

    {/* Butt spike at shaft bottom */}
    <mesh position={[0, -0.02, 0]}>
      <coneGeometry args={[0.035, 0.12, 6]} />
      <meshStandardMaterial
        color={MATERIALS.ironWeapon.color}
        metalness={0.80}
        roughness={0.25}
      />
    </mesh>
  </group>
);

/**
 * Lê Lợi's Thuận Thiên Broadsword (Gươm Thần Thuận Thiên)
 */
const LeLoiSword: React.FC = () => (
  <group position={[-0.30, 0.45, 0.18]} rotation={[0.15, 0, 0.08]}>
    {/* Steel Blade with cyan sacred glow edge */}
    <mesh position={[0, 0.55, 0]} castShadow>
      <boxGeometry args={[0.07, 0.95, 0.02]} />
      <meshStandardMaterial color="#e2e8f0" metalness={0.9} roughness={0.15} />
    </mesh>
    {/* Gold Crossguard */}
    <mesh position={[0, 0.08, 0]}>
      <boxGeometry args={[0.22, 0.04, 0.05]} />
      <meshStandardMaterial color="#d97706" metalness={0.85} roughness={0.2} />
    </mesh>
    {/* Grip */}
    <mesh position={[0, -0.05, 0]}>
      <cylinderGeometry args={[0.02, 0.02, 0.22, 6]} />
      <meshStandardMaterial color="#352317" roughness={0.9} />
    </mesh>
    {/* Gold Pommel */}
    <mesh position={[0, -0.16, 0]}>
      <sphereGeometry args={[0.035, 6, 6]} />
      <meshStandardMaterial color="#d97706" metalness={0.85} />
    </mesh>
  </group>
);

/**
 * Commander War Standard / Banner on back
 */
const GeneralBanner: React.FC<{ isPlayer: boolean; isLeLoi?: boolean; isQuangTrung?: boolean }> = ({
  isPlayer,
  isLeLoi,
  isQuangTrung,
}) => (
  <group position={[0.15, 1.05, -0.22]}>
    {/* Banner pole */}
    <mesh position={[0, 0.55, 0]}>
      <cylinderGeometry args={[0.018, 0.022, 1.20, 6]} />
      <meshStandardMaterial
        color={MATERIALS.darkWood.color}
        roughness={0.85}
      />
    </mesh>
    {/* Pole tip — gold ornament */}
    <mesh position={[0, 1.18, 0]}>
      <sphereGeometry args={[0.04, 8, 8]} />
      <meshStandardMaterial
        color={MATERIALS.imperialGold.color}
        metalness={0.85}
        roughness={0.20}
      />
    </mesh>
    {/* Flag cloth */}
    <mesh position={[0.22, 0.88, 0]}>
      <planeGeometry args={[0.40, 0.52]} />
      <meshStandardMaterial
        color={isQuangTrung ? '#b91c1c' : isLeLoi ? '#14532d' : isPlayer ? '#991b1b' : '#0f172a'}
        side={THREE.DoubleSide}
        roughness={0.65}
      />
    </mesh>
    {/* Gold trim on flag edge */}
    <mesh position={[0.22, 0.88, 0.003]}>
      <planeGeometry args={[0.42, 0.54]} />
      <meshBasicMaterial color="#f59e0b" wireframe />
    </mesh>
  </group>
);

/**
 * Black Beard — chunky facial hair for the general
 */
const GeneralBeard: React.FC = () => (
  <group position={[0, 1.06, 0.12]}>
    {/* Main beard mass */}
    <mesh>
      <boxGeometry args={[0.16, 0.14, 0.08]} />
      <meshStandardMaterial color="#1a1a1a" roughness={0.95} />
    </mesh>
    {/* Pointed goatee tip */}
    <mesh position={[0, -0.10, 0.02]}>
      <coneGeometry args={[0.05, 0.12, 5]} />
      <meshStandardMaterial color="#111111" roughness={0.95} />
    </mesh>
  </group>
);

// ─────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT — GeneralCharacter
// ─────────────────────────────────────────────────────────────────────────

/**
 * GeneralCharacter — Vietnamese Historical Commander (Tướng Quân)
 *
 * A premium stylized 3D procedural character model following the
 * "Hào Khí Đại Việt" Global Art Direction.
 *
 * PIVOT/ORIGIN: At the character's feet (Y=0 = ground contact point).
 * ORIENTATION:  Always upright. Only Y-axis rotation for facing direction.
 * SCALE:        This component renders at 1.0x. The parent applies
 *               1.25–1.4x scale to differentiate from ordinary soldiers.
 *
 * HIERARCHY:
 *   <group>                  ← VisualRoot (pivot at feet)
 *     Shadow                 ← Contact shadow circle on ground
 *     Body                   ← Chunky legs + hips
 *     LamellarArmor          ← Vietnamese cuirass with bronze trim
 *     ShoulderPauldrons      ← Bronze shoulder plates
 *     Head                   ← Skin sphere
 *     Beard                  ← Black facial hair
 *     GeneralHelmet          ← Bronze historical helmet with crest
 *     GeneralCape            ← Beige flowing cape from shoulders
 *     GeneralHalberd         ← Long spear/halberd weapon
 *     GeneralBanner          ← Commander war standard
 */
export const GeneralCharacter: React.FC<GeneralCharacterProps> = ({ isPlayer, commanderName }) => {
  const isLeLoi = commanderName === 'Lê Lợi' || commanderName === 'le_loi';
  const isQuangTrung = !!commanderName && (
    commanderName.toLowerCase().includes('quang trung') ||
    commanderName.toLowerCase().includes('nguyễn huệ') ||
    commanderName.toLowerCase().includes('quang_trung')
  );

  return (
    <group>
      {/* ════════════════════════════════════════════════════════ */}
      {/* BODY — Chunky chibi legs + hip base                    */}
      {/* Feet are at Y=0 (ground contact). Build upward.        */}
      {/* ════════════════════════════════════════════════════════ */}

      {/* Left Leg */}
      <mesh position={[-0.10, 0.22, 0]} castShadow>
        <cylinderGeometry args={[0.09, 0.10, 0.44, 8]} />
        <meshStandardMaterial
          color={isQuangTrung ? '#7f1d1d' : isLeLoi ? '#1b3b1c' : isPlayer ? '#3b1a1a' : '#1a1a2e'}
          roughness={0.80}
        />
      </mesh>
      {/* Right Leg */}
      <mesh position={[0.10, 0.22, 0]} castShadow>
        <cylinderGeometry args={[0.09, 0.10, 0.44, 8]} />
        <meshStandardMaterial
          color={isQuangTrung ? '#7f1d1d' : isLeLoi ? '#1b3b1c' : isPlayer ? '#3b1a1a' : '#1a1a2e'}
          roughness={0.80}
        />
      </mesh>
      {/* Left Boot */}
      <mesh position={[-0.10, 0.03, 0.02]}>
        <boxGeometry args={[0.12, 0.06, 0.16]} />
        <meshStandardMaterial color="#2a1810" roughness={0.90} />
      </mesh>
      {/* Right Boot */}
      <mesh position={[0.10, 0.03, 0.02]}>
        <boxGeometry args={[0.12, 0.06, 0.16]} />
        <meshStandardMaterial color="#2a1810" roughness={0.90} />
      </mesh>

      {/* Hip / waist connector */}
      <mesh position={[0, 0.42, 0]}>
        <boxGeometry args={[0.35, 0.10, 0.25]} />
        <meshStandardMaterial
          color={isQuangTrung ? '#991b1b' : isLeLoi ? '#254b28' : isPlayer ? '#5a1a1a' : '#151530'}
          roughness={0.70}
        />
      </mesh>

      {/* ════════════════════════════════════════════════════════ */}
      {/* ARMOR — Vietnamese Lamellar Cuirass                    */}
      {/* ════════════════════════════════════════════════════════ */}
      <LamellarArmor isPlayer={isPlayer} />

      {/* ════════════════════════════════════════════════════════ */}
      {/* SHOULDERS — Bronze Pauldrons                           */}
      {/* ════════════════════════════════════════════════════════ */}
      <ShoulderPauldrons />

      {/* ════════════════════════════════════════════════════════ */}
      {/* ARMS — Chunky arms extending from shoulders            */}
      {/* ════════════════════════════════════════════════════════ */}
      {/* Left arm */}
      <mesh position={[-0.30, 0.72, 0.08]} castShadow>
        <cylinderGeometry args={[0.065, 0.07, 0.42, 6]} />
        <meshStandardMaterial
          color={MATERIALS.skin.color}
          roughness={MATERIALS.skin.roughness}
        />
      </mesh>
      {/* Right arm */}
      <mesh position={[0.30, 0.72, 0.04]} castShadow>
        <cylinderGeometry args={[0.065, 0.07, 0.42, 6]} />
        <meshStandardMaterial
          color={MATERIALS.skin.color}
          roughness={MATERIALS.skin.roughness}
        />
      </mesh>
      {/* Left bracer — bronze arm guard */}
      <mesh position={[-0.30, 0.62, 0.08]}>
        <cylinderGeometry args={[0.075, 0.075, 0.16, 6]} />
        <meshStandardMaterial
          color={MATERIALS.agedBronze.color}
          metalness={0.70}
          roughness={0.35}
        />
      </mesh>
      {/* Right bracer */}
      <mesh position={[0.30, 0.62, 0.04]}>
        <cylinderGeometry args={[0.075, 0.075, 0.16, 6]} />
        <meshStandardMaterial
          color={MATERIALS.agedBronze.color}
          metalness={0.70}
          roughness={0.35}
        />
      </mesh>

      {/* ════════════════════════════════════════════════════════ */}
      {/* HEAD — Chibi/chunky proportioned head                  */}
      {/* ════════════════════════════════════════════════════════ */}
      <mesh position={[0, 1.18, 0]} castShadow>
        <sphereGeometry args={[0.20, 14, 14]} />
        <meshStandardMaterial
          color={MATERIALS.skin.color}
          roughness={MATERIALS.skin.roughness}
        />
      </mesh>

      {/* Eyes — simple dark dots */}
      {[-0.06, 0.06].map((xOff, i) => (
        <mesh key={i} position={[xOff, 1.20, 0.18]}>
          <sphereGeometry args={[0.025, 6, 6]} />
          <meshStandardMaterial color="#1a1a1a" roughness={0.90} />
        </mesh>
      ))}

      {/* ════════════════════════════════════════════════════════ */}
      {/* BEARD — Black facial hair                              */}
      {/* ════════════════════════════════════════════════════════ */}
      <GeneralBeard />

      {/* ════════════════════════════════════════════════════════ */}
      {/* HELMET — Bronze historical Vietnamese helmet           */}
      {/* ════════════════════════════════════════════════════════ */}
      <GeneralHelmet isPlayer={isPlayer} />

      {/* ════════════════════════════════════════════════════════ */}
      {/* CAPE — Flowing cape from shoulders                     */}
      {/* ════════════════════════════════════════════════════════ */}
      <GeneralCape isQuangTrung={isQuangTrung} />

      {/* ════════════════════════════════════════════════════════ */}
      {/* WEAPON — Sabre / Thuận Thiên Sword / Halberd           */}
      {/* ════════════════════════════════════════════════════════ */}
      {isQuangTrung ? (
        <QuangTrungSabre />
      ) : isLeLoi ? (
        <LeLoiSword />
      ) : (
        <GeneralHalberd />
      )}

      {/* ════════════════════════════════════════════════════════ */}
      {/* BANNER — Commander War Standard on back                */}
      {/* ════════════════════════════════════════════════════════ */}
      <GeneralBanner isPlayer={isPlayer} isLeLoi={isLeLoi} isQuangTrung={isQuangTrung} />
    </group>
  );
};

export default GeneralCharacter;
