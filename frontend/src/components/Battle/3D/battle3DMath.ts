/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  3D Hex Math & Coordinate Transformations for Bạch Đằng 1288
 * ═══════════════════════════════════════════════════════════════════════════
 *
 *  This module re-exports all spatial constants and coordinate transforms
 *  from the single source of truth: foundation/battlefield.ts.
 *
 *  Components that previously imported from this file continue to work
 *  without any import path changes.
 * ═══════════════════════════════════════════════════════════════════════════
 */

// Re-export everything from the foundation — backwards compatible
export {
  HEX_RADIUS_3D,
  HEX_WIDTH_3D,
  HEX_VERT_DIST_3D,
  GRID_DIMS as BATTLE_GRID_DIMS,
  GRID_CENTER_OFFSET,
  TERRAIN_HEIGHT,
  DEFAULT_TERRAIN_HEIGHT,
  getTerrainHeight as getTerrainHeight3D,
  hexToWorld3D,
  getHexCornersXZ,

  // Hex surface placement system
  getHexSurfacePosition,
  getHexSurfaceNormal,
  UPRIGHT_ROTATION,
  placeOnHexSurface,
} from '../../../foundation/battlefield';

export type { HexSurfacePoint } from '../../../foundation/battlefield';

// Legacy named exports for backwards compatibility with existing imports
export {
  GRID_DIMS,
} from '../../../foundation/battlefield';

// Re-export the grid dimension individual values for any code that
// destructured BATTLE_COLS / BATTLE_ROWS directly
import { GRID_DIMS } from '../../../foundation/battlefield';
export const BATTLE_COLS = GRID_DIMS.cols;
export const BATTLE_ROWS = GRID_DIMS.rows;

// Re-export centering constants under their original names
import { GRID_CENTER_OFFSET } from '../../../foundation/battlefield';
export const CENTER_OFFSET_X = GRID_CENTER_OFFSET.x;
export const CENTER_OFFSET_Z = GRID_CENTER_OFFSET.z;
