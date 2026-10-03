/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  HÀO KHÍ ĐẠI VIỆT — DESIGN SYSTEM BARREL EXPORT
 * ═══════════════════════════════════════════════════════════════════════════
 *
 *  Usage:
 *    import { IMPERIAL, MATERIALS, LIGHTING, UI } from '@/design';
 *
 *  All tokens, helpers, and style utilities are re-exported from here.
 */

export {
  // Color palette
  IMPERIAL,
  FACTION_COLORS,
  SIDE_COLORS,

  // Terrain
  TERRAIN_PALETTE,

  // PBR Materials
  MATERIALS,

  // Lighting
  LIGHTING,

  // Camera
  CAMERA,

  // Character proportions
  CHARACTER,

  // UI tokens
  UI,

  // Typography
  TYPOGRAPHY,

  // Animation
  ANIMATION,

  // Environment props
  ENVIRONMENT,

  // Hex grid visual constants
  HEX_VISUAL,

  // Rarity tiers
  RARITY,
} from './tokens';

export type { TerrainStyle, PBRPreset } from './tokens';
