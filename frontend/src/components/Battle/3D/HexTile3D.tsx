import React, { useMemo, useState } from 'react';
import * as THREE from 'three';
import { HexTile, TerrainType } from '../../../types';
import { HEX_RADIUS_3D, hexToWorld3D } from './battle3DMath';

interface HexTile3DProps {
  tile: HexTile;
  isSelected: boolean;
  isValidTarget: boolean;
  onSelect: (col: number, row: number) => void;
  tideTurnsLeft: number;
  isDeploymentHex?: boolean;
  isCommandAura?: boolean;
}

// Color palettes for historical terrain in warm late afternoon lighting
const TERRAIN_COLORS: Record<
  TerrainType,
  { top: string; side: string; roughness: number; metalness: number }
> = {
  plain:        { top: '#4a673c', side: '#2d3f25', roughness: 0.85, metalness: 0.04 },
  hill:         { top: '#7c6d53', side: '#4e4433', roughness: 0.88, metalness: 0.08 },
  forest:       { top: '#26542c', side: '#16331a', roughness: 0.85, metalness: 0.02 },
  dense_forest: { top: '#1c451e', side: '#0f2910', roughness: 0.88, metalness: 0.02 },
  narrow_path:  { top: '#63533e', side: '#3d3224', roughness: 0.82, metalness: 0.08 },
  mountain:     { top: '#505a4e', side: '#343c32', roughness: 0.90, metalness: 0.05 },
  supply_camp:  { top: '#5e432c', side: '#3d2919', roughness: 0.84, metalness: 0.12 },
  bridge:       { top: '#634b35', side: '#3d2d1e', roughness: 0.82, metalness: 0.15 },
  riverbank:    { top: '#545842', side: '#363a28', roughness: 0.88, metalness: 0.05 },
  mud:          { top: '#4e4030', side: '#32281d', roughness: 0.65, metalness: 0.12 },
  river:        { top: '#1c4962', side: '#0d2838', roughness: 0.18, metalness: 0.72 },
  stakes:       { top: '#1b435a', side: '#0b2432', roughness: 0.22, metalness: 0.65 },
  fort:         { top: '#634e35', side: '#3c2e1e', roughness: 0.82, metalness: 0.18 },
  wall:         { top: '#7a5c49', side: '#4e3729', roughness: 0.75, metalness: 0.10 },
  gate:         { top: '#5f4433', side: '#3a271b', roughness: 0.78, metalness: 0.15 },
  courtyard:    { top: '#8a7d6b', side: '#574e40', roughness: 0.60, metalness: 0.12 },
  road:         { top: '#786854', side: '#493e31', roughness: 0.72, metalness: 0.08 },
  garden:       { top: '#3b6131', side: '#223c1c', roughness: 0.86, metalness: 0.02 },
};

/**
 * Procedural sharpened wooden stake (Cọc gỗ Bạch Đằng)
 * Stands 90° upright perpendicular to battlefield floor.
 * Only rotation.y varies for visual variety — rotation.x and rotation.z are always 0.
 */
const WoodenStake: React.FC<{
  position: [number, number, number];
  height?: number;
  radius?: number;
  tiltAngle?: number;
}> = ({ position, height = 0.8, radius = 0.09, tiltAngle = 0.08 }) => {
  // tiltAngle is repurposed as rotation.y variation (rotational twist, not lean)
  const rotY = (position[0] * 3 + tiltAngle * 10) % (Math.PI * 2);
  return (
    <group position={position} rotation={[0, rotY, 0]}>
      {/* Lower stake body */}
      <mesh position={[0, height * 0.4, 0]} castShadow>
        <cylinderGeometry args={[radius * 0.85, radius, height * 0.8, 6]} />
        <meshStandardMaterial color="#402c1b" roughness={0.9} metalness={0.05} />
      </mesh>
      {/* Sharpened charred tip */}
      <mesh position={[0, height * 0.8 + 0.12, 0]} castShadow>
        <coneGeometry args={[radius * 0.85, 0.28, 6]} />
        <meshStandardMaterial color="#221811" roughness={0.95} metalness={0.1} />
      </mesh>
      {/* River mud ring at base */}
      <mesh position={[0, 0.02, 0]}>
        <ringGeometry args={[radius * 0.8, radius * 1.5, 6]} />
        <meshBasicMaterial color="#1a2730" transparent opacity={0.6} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
};

/**
 * Bamboo / Mangrove Tree cluster for forests (standing 90° upright)
 */
const MangroveCluster: React.FC<{ position: [number, number, number] }> = ({ position }) => {
  return (
    <group position={position}>
      {/* 3 Stems of bamboo / mangrove */}
      {[
        [-0.2, 0, -0.15, 0.85, 0.04],
        [0.15, 0, 0.1, 1.05, 0.05],
        [0.05, 0, -0.22, 0.7, 0.035],
      ].map(([ox, , oz, h, r], i) => (
        <group key={i} position={[ox, 0, oz]}>
          {/* Stem */}
          <mesh position={[0, h * 0.5, 0]} castShadow>
            <cylinderGeometry args={[r * 0.7, r, h, 5]} />
            <meshStandardMaterial color="#556b2f" roughness={0.8} />
          </mesh>
          {/* Foliage crown */}
          <mesh position={[0, h + 0.18, 0]} castShadow>
            <coneGeometry args={[0.32, 0.55, 6]} />
            <meshStandardMaterial color="#2d5a27" roughness={0.85} />
          </mesh>
        </group>
      ))}
    </group>
  );
};

/**
 * Stone outcrop for hill terrain — standing 90° upright.
 * Only rotation.y varies for visual variety.
 */
const RockOutcrop: React.FC<{ position: [number, number, number] }> = ({ position }) => {
  return (
    <group position={position}>
      <mesh position={[0, 0.15, 0]} rotation={[0, 0.5, 0]} castShadow>
        <dodecahedronGeometry args={[0.28, 0]} />
        <meshStandardMaterial color="#66615b" roughness={0.95} metalness={0.05} />
      </mesh>
    </group>
  );
};

/**
 * Citadel Wall crenellations and stone parapet along the northern face.
 * Units stand behind the crenellations.
 */
const WallParapet: React.FC = () => {
  return (
    <group position={[0, 0, -0.62]}>
      {/* Stone base parapet ledge */}
      <mesh position={[0, 0.15, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.5, 0.3, 0.22]} />
        <meshStandardMaterial color="#6a4c3a" roughness={0.78} metalness={0.1} />
      </mesh>
      {/* 3 Merlons (crenellation teeth) */}
      {[-0.5, 0, 0.5].map((x, i) => (
        <mesh key={i} position={[x, 0.36, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.32, 0.22, 0.22]} />
          <meshStandardMaterial color="#7a5844" roughness={0.75} metalness={0.1} />
        </mesh>
      ))}
      {/* Torch bracket */}
      <mesh position={[0.62, 0.32, 0.12]}>
        <cylinderGeometry args={[0.02, 0.02, 0.22, 4]} />
        <meshStandardMaterial color="#2d2218" metalness={0.8} />
      </mesh>
      <mesh position={[0.62, 0.44, 0.12]}>
        <sphereGeometry args={[0.04, 6, 6]} />
        <meshBasicMaterial color="#ff9900" />
      </mesh>
    </group>
  );
};

/**
 * Citadel Gatehouse portal on the gate hex tile.
 */
const GatehouseTilePortal: React.FC = () => {
  return (
    <group position={[0, 0, 0]}>
      {/* Left and Right heavy stone portal jambs */}
      <mesh position={[-0.65, 0.5, -0.28]} castShadow>
        <boxGeometry args={[0.28, 1.0, 0.38]} />
        <meshStandardMaterial color="#553a29" roughness={0.8} metalness={0.15} />
      </mesh>
      <mesh position={[0.65, 0.5, -0.28]} castShadow>
        <boxGeometry args={[0.28, 1.0, 0.38]} />
        <meshStandardMaterial color="#553a29" roughness={0.8} metalness={0.15} />
      </mesh>
      {/* Arch lintel */}
      <mesh position={[0, 1.05, -0.28]} castShadow>
        <boxGeometry args={[1.58, 0.2, 0.42]} />
        <meshStandardMaterial color="#684732" roughness={0.75} metalness={0.12} />
      </mesh>
      {/* Iron studded doors slightly ajar */}
      <mesh position={[-0.26, 0.42, -0.28]} rotation={[0, 0.3, 0]} castShadow>
        <boxGeometry args={[0.44, 0.84, 0.07]} />
        <meshStandardMaterial color="#2d1b10" roughness={0.85} metalness={0.25} />
      </mesh>
      <mesh position={[0.26, 0.42, -0.28]} rotation={[0, -0.3, 0]} castShadow>
        <boxGeometry args={[0.44, 0.84, 0.07]} />
        <meshStandardMaterial color="#2d1b10" roughness={0.85} metalness={0.25} />
      </mesh>
    </group>
  );
};

/**
 * Imperial Courtyard stone details & ceremonial paver ring.
 */
const CourtyardTileDecor: React.FC = () => {
  return (
    <group position={[0, 0.005, 0]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.35, 0.48, 8]} />
        <meshStandardMaterial color="#6a5d4e" roughness={0.65} metalness={0.2} />
      </mesh>
    </group>
  );
};

/**
 * Royal Garden Bonsai tree and lawn decor.
 */
const RoyalGardenDecor: React.FC = () => {
  return (
    <group position={[0, 0, 0]}>
      <mesh position={[0.22, 0.3, 0.18]} castShadow>
        <cylinderGeometry args={[0.035, 0.06, 0.6, 5]} />
        <meshStandardMaterial color="#3d2c1f" roughness={0.9} />
      </mesh>
      <mesh position={[0.22, 0.68, 0.18]} castShadow>
        <dodecahedronGeometry args={[0.34, 0]} />
        <meshStandardMaterial color="#2c5a27" roughness={0.8} />
      </mesh>
      {/* Stone lantern */}
      <mesh position={[-0.32, 0.16, -0.22]} castShadow>
        <cylinderGeometry args={[0.06, 0.09, 0.32, 4]} />
        <meshStandardMaterial color="#6b665f" roughness={0.85} metalness={0.1} />
      </mesh>
    </group>
  );
};

/**
 * Imperial Stone Road Flagstone lines.
 */
const RoadTileDecor: React.FC = () => {
  return (
    <group position={[0, 0.004, 0]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.38, 1.3]} />
        <meshStandardMaterial color="#635544" roughness={0.65} metalness={0.1} />
      </mesh>
      <mesh position={[-0.22, 0.006, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.04, 1.3]} />
        <meshStandardMaterial color="#4d4234" roughness={0.6} metalness={0.2} />
      </mesh>
      <mesh position={[0.22, 0.006, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.04, 1.3]} />
        <meshStandardMaterial color="#4d4234" roughness={0.6} metalness={0.2} />
      </mesh>
    </group>
  );
};

/**
 * Dense Forest Ambush Pocket: clusters of deep green pine/bamboo framing back of tile
 */
const DenseForestTileDecor: React.FC = () => {
  return (
    <group position={[0, 0, -0.45]}>
      {/* Pine stem 1 */}
      <mesh position={[-0.32, 0.4, 0]} castShadow>
        <cylinderGeometry args={[0.035, 0.06, 0.8, 5]} />
        <meshStandardMaterial color="#2d1c12" roughness={0.9} />
      </mesh>
      <mesh position={[-0.32, 0.85, 0]} castShadow>
        <coneGeometry args={[0.35, 0.65, 5]} />
        <meshStandardMaterial color="#1a381c" roughness={0.82} />
      </mesh>
      {/* Pine stem 2 */}
      <mesh position={[0.35, 0.35, -0.05]} castShadow>
        <cylinderGeometry args={[0.03, 0.05, 0.7, 5]} />
        <meshStandardMaterial color="#2d1c12" roughness={0.9} />
      </mesh>
      <mesh position={[0.35, 0.75, -0.05]} castShadow>
        <coneGeometry args={[0.3, 0.55, 5]} />
        <meshStandardMaterial color="#1f4422" roughness={0.8} />
      </mesh>
      {/* Dense undergrowth bush */}
      <mesh position={[0.05, 0.18, 0.08]} castShadow>
        <dodecahedronGeometry args={[0.22, 0]} />
        <meshStandardMaterial color="#274f26" roughness={0.85} />
      </mesh>
    </group>
  );
};

/**
 * Narrow Mountain Pass Path with boundary rocks
 */
const NarrowPathTileDecor: React.FC = () => {
  return (
    <group position={[0, 0.005, 0]}>
      {/* Winding dirt trail */}
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.42, 1.25]} />
        <meshStandardMaterial color="#554433" roughness={0.8} metalness={0.05} />
      </mesh>
      {/* Flanking mossy boulders */}
      {[-0.52, 0.52].map((bx, i) => (
        <mesh key={i} position={[bx, 0.14, 0]} castShadow>
          <dodecahedronGeometry args={[0.18, 0]} />
          <meshStandardMaterial color="#4a5245" roughness={0.9} />
        </mesh>
      ))}
    </group>
  );
};

/**
 * Mountain Crag Rock Formation at rear of hex
 */
const MountainTileDecor: React.FC = () => {
  return (
    <group position={[0, 0, -0.42]}>
      <mesh position={[0, 0.35, 0]} castShadow>
        <coneGeometry args={[0.42, 0.75, 5]} />
        <meshStandardMaterial color="#4d574a" roughness={0.92} metalness={0.05} />
      </mesh>
      <mesh position={[-0.28, 0.22, 0.1]} castShadow>
        <dodecahedronGeometry args={[0.24, 0]} />
        <meshStandardMaterial color="#3d453b" roughness={0.9} />
      </mesh>
    </group>
  );
};

/**
 * Enemy Supply Camp depot on hex
 */
const SupplyCampTileDecor: React.FC = () => {
  return (
    <group position={[0, 0, -0.4]}>
      {/* Supply crate */}
      <mesh position={[-0.22, 0.2, 0]} castShadow>
        <boxGeometry args={[0.38, 0.38, 0.38]} />
        <meshStandardMaterial color="#54371f" roughness={0.85} />
      </mesh>
      {/* Barrel */}
      <mesh position={[0.25, 0.22, 0]} castShadow>
        <cylinderGeometry args={[0.16, 0.16, 0.44, 6]} />
        <meshStandardMaterial color="#402816" roughness={0.85} />
      </mesh>
      {/* Mini warning torch */}
      <mesh position={[0.02, 0.32, -0.1]}>
        <cylinderGeometry args={[0.02, 0.02, 0.3, 4]} />
        <meshStandardMaterial color="#2d1c12" />
      </mesh>
      <mesh position={[0.02, 0.48, -0.1]}>
        <sphereGeometry args={[0.05, 6, 6]} />
        <meshBasicMaterial color="#f97316" />
      </mesh>
    </group>
  );
};

/**
 * Bridge planking decor on bridge hexes
 */
const BridgeTileDecor: React.FC = () => (
  <group position={[0, 0.04, 0]}>
    {[-0.32, 0, 0.32].map((z, idx) => (
      <mesh key={idx} position={[0, 0.02, z]} receiveShadow>
        <boxGeometry args={[1.15, 0.04, 0.26]} />
        <meshStandardMaterial color="#4a301a" roughness={0.85} />
      </mesh>
    ))}
    {[-0.58, 0.58].map((x, idx) => (
      <mesh key={idx} position={[x, 0.12, 0]}>
        <boxGeometry args={[0.08, 0.2, 1.05]} />
        <meshStandardMaterial color="#382313" roughness={0.9} />
      </mesh>
    ))}
  </group>
);

/**
 * Riverbank sandy mud & reed decor
 */
const RiverbankTileDecor: React.FC = () => (
  <group position={[0, 0, 0]}>
    <mesh position={[0.2, 0.015, 0.1]} receiveShadow>
      <circleGeometry args={[0.32, 6]} />
      <meshStandardMaterial color="#4a4231" roughness={0.95} />
    </mesh>
    {[-0.18, 0.14].map((x, idx) => (
      <mesh key={idx} position={[x, 0.14, -0.18]}>
        <cylinderGeometry args={[0.015, 0.02, 0.32, 4]} />
        <meshStandardMaterial color="#3f6212" roughness={0.8} />
      </mesh>
    ))}
  </group>
);

export const HexTile3D: React.FC<HexTile3DProps> = ({
  tile,
  isSelected,
  isValidTarget,
  onSelect,
  tideTurnsLeft,
  isDeploymentHex = false,
  isCommandAura = false,
}) => {
  const [hovered, setHovered] = useState(false);
  const [worldX, worldY, worldZ] = useMemo(
    () => hexToWorld3D(tile.col, tile.row, tile.terrain),
    [tile.col, tile.row, tile.terrain]
  );

  const colors = TERRAIN_COLORS[tile.terrain] || TERRAIN_COLORS.plain;
  const isStakes = tile.terrain === 'stakes';
  const isRiver = tile.terrain === 'river';
  const isBridge = tile.terrain === 'bridge';
  const isRiverbank = tile.terrain === 'riverbank';
  const isFort = tile.terrain === 'fort';
  const isForest = tile.terrain === 'forest';
  const isDenseForest = tile.terrain === 'dense_forest';
  const isNarrowPath = tile.terrain === 'narrow_path';
  const isMountain = tile.terrain === 'mountain';
  const isSupplyCamp = tile.terrain === 'supply_camp';
  const isHill = tile.terrain === 'hill';
  const isWall = tile.terrain === 'wall';
  const isGate = tile.terrain === 'gate';
  const isCourtyard = tile.terrain === 'courtyard';
  const isRoad = tile.terrain === 'road';
  const isGarden = tile.terrain === 'garden';
  const isControlPoint = !!tile.control_point;

  // Highlight color based on state (subtle, non-blinding)
  const borderEmissive = useMemo(() => {
    if (isSelected) return '#d97706';
    if (isValidTarget) return '#059669';
    if (isCommandAura) return '#c9a44c';
    if (isDeploymentHex) return '#0e7490';
    if (hovered) return '#b45309';
    return isFort ? '#785428' : '#1e293b';
  }, [isSelected, isValidTarget, isCommandAura, isDeploymentHex, hovered, isFort]);

  const tileDepth = 0.42;

  return (
    <group position={[worldX, worldY, worldZ]}>
      {/* Clickable Hexagon Column */}
      <mesh
        position={[0, -tileDepth * 0.5, 0]}
        rotation={[0, Math.PI / 6, 0]} // pointy-top rotation
        receiveShadow
        castShadow={!isRiver}
        onClick={(e) => {
          e.stopPropagation();
          onSelect(tile.col, tile.row);
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
        }}
        onPointerOut={(e) => {
          e.stopPropagation();
          setHovered(false);
        }}
      >
        <cylinderGeometry args={[HEX_RADIUS_3D * 0.985, HEX_RADIUS_3D * 0.985, tileDepth, 6]} />
        <meshStandardMaterial
          color={hovered ? '#5a6e78' : colors.top}
          roughness={colors.roughness}
          metalness={colors.metalness}
          emissive={isSelected ? '#78350f' : isValidTarget ? '#064e3b' : isCommandAura ? '#78350f' : isDeploymentHex ? '#164e63' : '#000000'}
          emissiveIntensity={isSelected || isValidTarget ? 0.25 : isCommandAura || isDeploymentHex ? 0.18 : 0}
        />
      </mesh>

      {/* Hex Border Ring — subtle embedded stone/bronze bevel */}
      <mesh position={[0, 0.003, 0]} rotation={[-Math.PI / 2, 0, Math.PI / 6]}>
        <ringGeometry args={[HEX_RADIUS_3D * 0.94, HEX_RADIUS_3D * 0.99, 6]} />
        <meshStandardMaterial
          color={borderEmissive}
          emissive={borderEmissive}
          emissiveIntensity={isSelected ? 0.55 : isValidTarget ? 0.45 : hovered ? 0.3 : 0.08}
          roughness={0.6}
          metalness={0.4}
        />
      </mesh>

      {/* Subtle Ground Highlight when Selected */}
      {isSelected && (
        <mesh position={[0, 0.015, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.65, 16]} />
          <meshBasicMaterial color="#f59e0b" transparent opacity={0.25} side={THREE.DoubleSide} />
        </mesh>
      )}

      {/* Target Indicator Ring */}
      {isValidTarget && (
        <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.35, 0.52, 16]} />
          <meshBasicMaterial color="#10b981" transparent opacity={0.55} side={THREE.DoubleSide} />
        </mesh>
      )}
      {/* Deployment zone tint + commander aura ring (subtle, readable) */}
      {isDeploymentHex && !isValidTarget && (
        <mesh position={[0, 0.012, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.55, 0.66, 6]} />
          <meshBasicMaterial color="#22d3ee" transparent opacity={0.3} side={THREE.DoubleSide} />
        </mesh>
      )}
      {isCommandAura && (
        <mesh position={[0, 0.025, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.38, 0.5, 16]} />
          <meshBasicMaterial color="#f59e0b" transparent opacity={0.5} side={THREE.DoubleSide} />
        </mesh>
      )}

      {/* ----------------------------------------------------------- */}
      {/* 3D ENVIRONMENT PROPS GROUNDED AT SURFACEE (Y = 0 of tile)    */}
      {/* ----------------------------------------------------------- */}

      {/* Bạch Đằng Wooden Stakes (Driven into riverbed, emerging from water) */}
      {isStakes && (
        <group>
          {/* Center cluster of 4-5 sharpened stakes */}
          <WoodenStake position={[0, 0, 0]} height={tideTurnsLeft <= 1 ? 0.95 : 0.65} radius={0.095} tiltAngle={0.05} />
          <WoodenStake position={[-0.35, 0, -0.2]} height={tideTurnsLeft <= 1 ? 0.85 : 0.55} radius={0.08} tiltAngle={-0.08} />
          <WoodenStake position={[0.3, 0, 0.25]} height={tideTurnsLeft <= 1 ? 0.9 : 0.6} radius={0.085} tiltAngle={0.07} />
          <WoodenStake position={[-0.2, 0, 0.35]} height={tideTurnsLeft <= 1 ? 0.75 : 0.45} radius={0.075} tiltAngle={-0.04} />
          <WoodenStake position={[0.38, 0, -0.3]} height={tideTurnsLeft <= 1 ? 0.8 : 0.5} radius={0.07} tiltAngle={0.09} />

          {/* Water ripples around stakes */}
          <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.6, 0.85, 12]} />
            <meshBasicMaterial color="#38bdf8" transparent opacity={0.25} />
          </mesh>
        </group>
      )}

      {/* Forest Trees */}
      {isForest && <MangroveCluster position={[0, 0, 0]} />}

      {/* Hill Rocks */}
      {isHill && <RockOutcrop position={[0.2, 0, -0.1]} />}

      {/* Fort Palisade Barricade */}
      {isFort && (
        <group position={[0, 0, 0]}>
          {/* Timber spikes defense wall — standing 90° upright */}
          {[-0.4, -0.2, 0, 0.2, 0.4].map((px, idx) => (
            <mesh key={idx} position={[px, 0.35, 0.4]} rotation={[0, 0, 0]} castShadow>
              <cylinderGeometry args={[0.04, 0.055, 0.7, 5]} />
              <meshStandardMaterial color="#4a3520" roughness={0.9} />
            </mesh>
          ))}
          {/* Signal torch / beacon */}
          <mesh position={[0, 0.65, -0.25]}>
            <sphereGeometry args={[0.07, 8, 8]} />
            <meshBasicMaterial color="#f97316" />
          </mesh>
          <pointLight position={[0, 0.7, -0.25]} color="#ff7700" intensity={0.6} distance={2.5} />
        </group>
      )}

      {/* Thăng Long Citadel Wall Parapet */}
      {isWall && <WallParapet />}

      {/* Thăng Long Citadel Gate Entrance */}
      {isGate && <GatehouseTilePortal />}

      {/* Thăng Long Imperial Courtyard */}
      {isCourtyard && <CourtyardTileDecor />}

      {/* Thăng Long Royal Garden */}
      {isGarden && <RoyalGardenDecor />}

      {/* Thăng Long Imperial Stone Road */}
      {isRoad && <RoadTileDecor />}

      {/* Lam Sơn Dense Forest Ambush Pocket */}
      {isDenseForest && <DenseForestTileDecor />}

      {/* Lam Sơn Narrow Pass Path */}
      {isNarrowPath && <NarrowPathTileDecor />}

      {/* Lam Sơn Mountain Crags */}
      {isMountain && <MountainTileDecor />}

      {/* Lam Sơn Enemy Supply Camp */}
      {isSupplyCamp && <SupplyCampTileDecor />}

      {/* Phú Xuân Bridge Deck */}
      {isBridge && <BridgeTileDecor />}

      {/* Phú Xuân Riverbank Decor */}
      {isRiverbank && <RiverbankTileDecor />}

      {/* Phú Xuân Strategic Control Point Ring */}
      {isControlPoint && (
        <mesh position={[0, 0.025, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.55, 0.68, 24]} />
          <meshBasicMaterial
            color="#f59e0b"
            transparent
            opacity={0.55}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}
    </group>
  );
};

