/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  HÀO KHÍ ĐẠI VIỆT — BATTLEFIELD FOUNDATION (SINGLE SOURCE OF TRUTH)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 *  This module defines the IMMUTABLE spatial foundation for the entire
 *  Bạch Đằng 1288 battlefield scene. Every value here is a frozen constant
 *  that NOTHING in the codebase may override, lerp, animate, or conditionally
 *  modify at runtime.
 *
 *  ┌─────────────────────────────────────────────────────────────────────┐
 *  │                      LOCKED CONTRACTS                              │
 *  │                                                                     │
 *  │  1. Camera position, rotation, and projection are FIXED.            │
 *  │  2. BattlefieldRoot transform is FIXED at world origin (0,0,0).    │
 *  │  3. Hex grid layout and centering constants are FIXED.              │
 *  │  4. No combat event, animation, or state change may alter 1-3.     │
 *  │                                                                     │
 *  │  PERMITTED runtime changes (unit-local only):                       │
 *  │  ✓ Unit position (within grid)       ✓ Animation state             │
 *  │  ✓ VFX (projectiles, damage popups)  ✓ HP / combat stats           │
 *  │  ✓ Unit-local visual transform       ✓ Selection highlights        │
 *  │  ✓ Tide water level offset           ✓ Point light intensity       │
 *  │                                                                     │
 *  │  FORBIDDEN runtime changes:                                         │
 *  │  ✗ Camera position / rotation / fov  ✗ Camera shake                │
 *  │  ✗ Camera pan / zoom / follow        ✗ Camera lerp to target       │
 *  │  ✗ Camera transition on combat       ✗ Perspective change           │
 *  │  ✗ BattlefieldRoot position          ✗ BattlefieldRoot rotation    │
 *  │  ✗ BattlefieldRoot scale             ✗ Canvas resize override      │
 *  └─────────────────────────────────────────────────────────────────────┘
 *
 *  IMPORT:
 *    import { CAMERA_LOCK, BATTLEFIELD_ROOT, HEX_GRID } from '../foundation/battlefield';
 */

// ─────────────────────────────────────────────────────────────────────────
// 1. FIXED BATTLE CAMERA — ABSOLUTE LOCK
// ─────────────────────────────────────────────────────────────────────────

/**
 * The ONE and ONLY camera configuration for the battlefield.
 *
 * - Position:  elevated 2.5D cinematic observer
 * - LookAt:    world origin (center of hex grid)
 * - FOV:       32° (telephoto — flattens depth for diorama look)
 *
 * This object is frozen. Any attempt to mutate it will throw in strict mode.
 * The Three.js camera is set to these values ONCE on mount and never touched again.
 */
export const CAMERA_LOCK = Object.freeze({
  /** Camera world position [x, y, z] — elevated rear-right observation point */
  position: Object.freeze([0, 18, 24] as const),

  /** Camera look-at target [x, y, z] — world origin, center of battlefield */
  lookAt: Object.freeze([0, 0, 0] as const),

  /** Field of view in degrees — telephoto for miniature/diorama compression */
  fov: 32,

  /** Near clipping plane */
  near: 0.1,

  /** Far clipping plane */
  far: 200,
}) as {
  readonly position: readonly [0, 18, 24];
  readonly lookAt: readonly [0, 0, 0];
  readonly fov: 32;
  readonly near: 0.1;
  readonly far: 200;
};

// ─────────────────────────────────────────────────────────────────────────
// 2. BATTLEFIELD ROOT TRANSFORM — IMMUTABLE ORIGIN
// ─────────────────────────────────────────────────────────────────────────

/**
 * The root transform of the entire battlefield diorama.
 *
 * ALL battlefield children (hex tiles, units, base camps, water, VFX)
 * are nested under a single <group> at this transform.
 *
 * This is the world origin. It does not move, rotate, or scale.
 */
export const BATTLEFIELD_ROOT = Object.freeze({
  /** World position — always origin */
  position: Object.freeze([0, 0, 0] as const),

  /** World rotation [x, y, z] in radians — no rotation */
  rotation: Object.freeze([0, 0, 0] as const),

  /** Uniform scale — always 1:1:1 */
  scale: Object.freeze([1, 1, 1] as const),
}) as {
  readonly position: readonly [0, 0, 0];
  readonly rotation: readonly [0, 0, 0];
  readonly scale: readonly [1, 1, 1];
};

// ─────────────────────────────────────────────────────────────────────────
// 3. HEX GRID SPATIAL CONSTANTS
// ─────────────────────────────────────────────────────────────────────────

/** Radius from hex center to vertex in Three.js world units */
export const HEX_RADIUS_3D = 1.15;

/** Horizontal distance between column centers */
export const HEX_WIDTH_3D = Math.sqrt(3) * HEX_RADIUS_3D; // ≈ 1.9918

/** Vertical distance between row centers */
export const HEX_VERT_DIST_3D = 1.5 * HEX_RADIUS_3D; // ≈ 1.725

/**
 * Grid dimensions for the Bạch Đằng 1288 battlefield.
 * 12 columns × 7 rows.
 */
export const GRID_DIMS = Object.freeze({
  cols: 12,
  rows: 7,
}) as {
  readonly cols: 12;
  readonly rows: 7;
};

/**
 * Centering offsets that translate grid (col, row) → world (x, z)
 * such that the grid center (col 5.5, row 3) maps to world origin (0, 0).
 */
export const GRID_CENTER_OFFSET = Object.freeze({
  x: ((GRID_DIMS.cols - 1) / 2) * HEX_WIDTH_3D,
  z: ((GRID_DIMS.rows - 1) / 2) * HEX_VERT_DIST_3D,
}) as {
  readonly x: number;
  readonly z: number;
};

// ─────────────────────────────────────────────────────────────────────────
// 4. TERRAIN HEIGHT MAP
// ─────────────────────────────────────────────────────────────────────────

/**
 * Surface Y-height for each terrain type in 3D world units.
 * These determine how high above (or below) the base plane each hex sits.
 */
export const TERRAIN_HEIGHT: Readonly<Record<string, number>> = Object.freeze({
  wall:         0.45,   // Elevated citadel rampart (soldiers stand on top)
  gate:         0.15,   // Heavy arched gateway threshold
  fort:         0.25,   // Palisade / watchtower platform
  tower:        0.28,   // Watchtower high platform
  hill:         0.38,   // Raised vantage point
  mountain:     0.46,   // Rugged mountain rock / cliff
  courtyard:    0.08,   // Paved imperial stone courtyard
  road:         0.06,   // Imperial stone road
  narrow_path:  0.06,   // Mountain forest pass
  garden:       0.04,   // Palace gardens
  forest:       0.12,   // Forest / bamboo grove
  dense_forest: 0.16,   // Dense forest ambush pocket
  supply_camp:  0.10,   // Enemy supply depot
  bridge:       0.10,   // Elevated stone/wooden bridge over Sông Hương
  riverbank:   -0.02,   // Gentle sloping sandy/grass riverbank
  plain:        0.04,   // Alluvial plain / open field (default)
  mud:         -0.08,   // River mud shoal
  stakes:      -0.18,   // Submerged stake riverbed
  river:       -0.18,   // Flowing river / citadel moat
});

/** Default height for unknown terrain types */
export const DEFAULT_TERRAIN_HEIGHT = 0.04;

// ─────────────────────────────────────────────────────────────────────────
// 5. COORDINATE TRANSFORMS — PURE FUNCTIONS
// ─────────────────────────────────────────────────────────────────────────

/**
 * Returns the Y-height in 3D world space for a terrain type.
 * Pure function — no side effects, no state.
 */
export function getTerrainHeight(terrain?: string): number {
  if (!terrain) return DEFAULT_TERRAIN_HEIGHT;
  return TERRAIN_HEIGHT[terrain] ?? DEFAULT_TERRAIN_HEIGHT;
}

/**
 * Maps hex grid offset coordinates (col, row) to 3D world position [x, y, z].
 *
 * The grid is centered at world origin so that:
 *   - col 5.5 → x = 0 (horizontal center)
 *   - row 3   → z = 0 (depth center)
 *
 * This is the AUTHORITATIVE hex→world transform used by:
 *   - HexTile3D (tile positioning)
 *   - HexUnit (unit positioning)
 *   - Projectiles3D (VFX source/target)
 *   - BaseCamps3D (camp offset reference)
 *
 * Pure function — no side effects, no state.
 */
export function hexToWorld3D(
  col: number,
  row: number,
  terrain?: string
): [number, number, number] {
  const isOddRow = row % 2 === 1;
  const rawX = col * HEX_WIDTH_3D + (isOddRow ? HEX_WIDTH_3D / 2 : 0);
  const rawZ = row * HEX_VERT_DIST_3D;

  const x = rawX - GRID_CENTER_OFFSET.x;
  const z = rawZ - GRID_CENTER_OFFSET.z;
  const y = getTerrainHeight(terrain);

  return [x, y, z];
}

/**
 * Hex corner positions for a pointy-topped hexagon in the XZ plane.
 * Used for rendering hex outlines and hit-test shapes.
 */
export function getHexCornersXZ(radius: number = HEX_RADIUS_3D): [number, number][] {
  const corners: [number, number][] = [];
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 3) * i - Math.PI / 6; // pointy-top
    corners.push([radius * Math.cos(angle), radius * Math.sin(angle)]);
  }
  return corners;
}

// ─────────────────────────────────────────────────────────────────────────
// 5b. HEX SURFACE PLACEMENT SYSTEM
//
//     Every object on the battlefield (character, soldier, general, tree,
//     flag, building, fortress) MUST be placed using these helpers.
//
//     PLACEMENT RULE:
//       object.position = getHexSurfacePosition(col, row, terrain) + [0, localHeightOffset, 0]
//
//     ORIENTATION RULE:
//       object.rotation.x = 0
//       object.rotation.z = 0
//       object.rotation.y = facingAngle   (only Y-axis rotation is allowed)
//
//     The battlefield is a HORIZONTAL PLANE. All surfaces are flat.
//     The surface normal is always [0, 1, 0] (straight up).
//     Objects stand 90° perpendicular to the ground — no tilt, no lean.
// ─────────────────────────────────────────────────────────────────────────

/**
 * HexSurfacePoint — the complete placement data for an object on a hex tile.
 *
 *   position:  world coordinates of the hex surface center [x, y, z]
 *   normal:    surface normal vector (always up) [0, 1, 0]
 *   surfaceY:  the Y component — the logical "ground level" of this hex
 */
export interface HexSurfacePoint {
  /** World position of the hex surface center [x, y, z] */
  readonly position: readonly [number, number, number];
  /** Surface normal — always straight up for a horizontal battlefield */
  readonly normal: readonly [0, 1, 0];
  /** The Y-height of this hex surface (same as position[1]) */
  readonly surfaceY: number;
}

/**
 * Returns the logical surface point for a hex tile.
 *
 * This is the AUTHORITATIVE function for placing ANY object on the battlefield.
 * The returned position is the exact world point where an object's base/feet
 * should be anchored.
 *
 * Usage:
 *   const surface = getHexSurfacePosition(col, row, terrain);
 *   <group position={surface.position}>
 *     <mesh position={[0, localHeightOffset, 0]} />
 *   </group>
 *
 * @param col     Grid column (0-11)
 * @param row     Grid row (0-6)
 * @param terrain Terrain type string (plain, hill, forest, mud, river, stakes, fort)
 * @returns       HexSurfacePoint with position, normal, and surfaceY
 */
export function getHexSurfacePosition(
  col: number,
  row: number,
  terrain?: string
): HexSurfacePoint {
  const worldPos = hexToWorld3D(col, row, terrain);
  return {
    position: worldPos as readonly [number, number, number],
    normal: [0, 1, 0] as const,
    surfaceY: worldPos[1],
  };
}

/**
 * Returns the surface normal for any hex tile on the battlefield.
 *
 * The battlefield is a HORIZONTAL PLANE — the normal is ALWAYS [0, 1, 0].
 * This function exists for API completeness and to make the contract explicit:
 * if the battlefield ever supported sloped terrain, this would return
 * per-tile normals. Currently it always returns straight up.
 *
 * @returns [0, 1, 0] — the up vector
 */
export function getHexSurfaceNormal(): readonly [0, 1, 0] {
  return [0, 1, 0] as const;
}

/**
 * UPRIGHT_ROTATION — the mandatory base rotation for all placed objects.
 *
 * Every character, soldier, general, tree, flag, building, and fortress
 * MUST have rotation.x = 0 and rotation.z = 0.
 * Only rotation.y is allowed (for directional facing).
 *
 * Usage:
 *   <group rotation={[UPRIGHT_ROTATION[0], facingAngle, UPRIGHT_ROTATION[2]]}>
 *     ...object model...
 *   </group>
 */
export const UPRIGHT_ROTATION = Object.freeze([0, 0, 0] as const) as readonly [0, 0, 0];

/**
 * Convenience: compute the full placement transform for an object on a hex.
 *
 * Returns position (surface + height offset) and rotation (upright + facing).
 * This is the canonical way to place any object on the battlefield.
 *
 * @param col              Grid column
 * @param row              Grid row
 * @param terrain          Terrain type
 * @param localHeightOffset Additional Y offset above the surface (e.g. 0 for ground objects)
 * @param facingY          Y-axis rotation in radians (facing direction)
 * @returns                { position, rotation } ready to spread onto a <group>
 */
export function placeOnHexSurface(
  col: number,
  row: number,
  terrain?: string,
  localHeightOffset: number = 0,
  facingY: number = 0,
): {
  position: [number, number, number];
  rotation: [number, number, number];
} {
  const surface = getHexSurfacePosition(col, row, terrain);
  return {
    position: [
      surface.position[0],
      surface.position[1] + localHeightOffset,
      surface.position[2],
    ],
    rotation: [0, facingY, 0],
  };
}

// ─────────────────────────────────────────────────────────────────────────
// 6. BASE CAMP POSITIONS
// ─────────────────────────────────────────────────────────────────────────

/**
 * Fixed world positions for the two base camp diorama groups.
 * These sit outside the hex grid, flanking the battlefield.
 */
export const BASE_CAMP_POSITIONS = Object.freeze({
  /** Đại Việt base camp — left/west side */
  daiViet: Object.freeze([-12.2, 0, 0] as const),
  /** Mông Nguyên base camp — right/east side */
  mongol:  Object.freeze([12.2, 0, 0] as const),
}) as {
  readonly daiViet: readonly [-12.2, 0, 0];
  readonly mongol: readonly [12.2, 0, 0];
};

// ─────────────────────────────────────────────────────────────────────────
// 7. CANVAS CONFIGURATION
// ─────────────────────────────────────────────────────────────────────────

/**
 * Three.js Canvas GL configuration.
 * These are set once when the Canvas mounts and never changed.
 */
export const CANVAS_CONFIG = Object.freeze({
  antialias: true,
  alpha: false,
  powerPreference: 'high-performance' as const,
  shadows: true,
});

// ─────────────────────────────────────────────────────────────────────────
// 8. ATMOSPHERIC CONSTANTS (Locked — visual only, no gameplay effect)
// ─────────────────────────────────────────────────────────────────────────

/**
 * Fog configuration for the river dusk atmosphere.
 * Applied to the Three.js scene fog, not affecting gameplay.
 */
export const FOG = Object.freeze({
  color: '#0C1B26',
  near: 18,
  far: 55,
});

/**
 * Background color of the Canvas container.
 * Must match the fog near color for seamless blending.
 */
export const SCENE_BG = '#07131b';
