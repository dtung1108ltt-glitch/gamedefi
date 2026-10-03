/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  HÀO KHÍ ĐẠI VIỆT — FOUNDATION BARREL EXPORT
 * ═══════════════════════════════════════════════════════════════════════════
 *
 *  Usage:
 *    import { CAMERA_LOCK, BATTLEFIELD_ROOT, hexToWorld3D } from '@/foundation';
 *    import { getHexSurfacePosition, placeOnHexSurface } from '@/foundation';
 */

export {
  // Camera lock
  CAMERA_LOCK,

  // Battlefield root transform
  BATTLEFIELD_ROOT,

  // Hex grid constants
  HEX_RADIUS_3D,
  HEX_WIDTH_3D,
  HEX_VERT_DIST_3D,
  GRID_DIMS,
  GRID_CENTER_OFFSET,

  // Terrain
  TERRAIN_HEIGHT,
  DEFAULT_TERRAIN_HEIGHT,
  getTerrainHeight,

  // Coordinate transforms
  hexToWorld3D,
  getHexCornersXZ,

  // Hex surface placement system
  getHexSurfacePosition,
  getHexSurfaceNormal,
  UPRIGHT_ROTATION,
  placeOnHexSurface,

  // Base camps
  BASE_CAMP_POSITIONS,

  // Canvas / Scene
  CANVAS_CONFIG,
  FOG,
  SCENE_BG,
} from './battlefield';

export type { HexSurfacePoint } from './battlefield';
