/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  HÀO KHÍ ĐẠI VIỆT — GLOBAL ART DIRECTION DESIGN TOKENS
 * ═══════════════════════════════════════════════════════════════════════════
 *
 *  Single source of truth for the game's entire visual language.
 *
 *  STYLE TARGET:
 *    Stylized high-quality 3D · Chibi / Chunky proportions · Semi-realistic
 *    Premium collectible miniature aesthetic · Cinematic 2.5D battlefield
 *    PBR materials · Soft cinematic lighting · Clean rounded geometry
 *    Rise-of-Kingdoms-inspired but distinctly Vietnamese historical identity
 *
 *  FORBIDDEN DIRECTIONS:
 *    anime · photorealistic · generic European medieval · fantasy RPG
 *    futuristic · overly cartoonish · low-quality flat 2D sprites
 *
 *  Every character, soldier, general, tree, flag, building, fortress, and
 *  environment asset MUST consume these tokens to maintain visual coherence.
 * ═══════════════════════════════════════════════════════════════════════════
 */

// ─────────────────────────────────────────────────────────────────────────
// 1. COLOR PALETTE — HỆ MÀU TRIỀU ĐẠI
// ─────────────────────────────────────────────────────────────────────────

/** Imperial court and decorative accent colors */
export const IMPERIAL = {
  /** Deep crimson — primary brand, Trần dynasty banners, power/authority */
  crimson:        '#8B1E0F',
  /** Dark red — deep shadows, lacquer surfaces */
  darkRed:        '#520B05',
  /** Antique gold — trim, emblems, imperial seals, Đông Sơn bronze */
  gold:           '#D4AF37',
  /** Light gold — highlights, text glow, hover states */
  lightGold:      '#F3E5AB',
  /** Polished bronze — armor, weapons, Đông Sơn drum surfaces */
  bronze:         '#CD7F32',
  /** Dark bronze — weapon handles, aged metalwork */
  darkBronze:     '#784212',
  /** Deep obsidian — primary background, night sky */
  obsidian:       '#0B0C10',
  /** Lacquer black — panels, card backgrounds */
  lacquer:        '#13141C',
  /** Dark slate — secondary surfaces, elevated panels */
  slate:          '#1E2230',
  /** Border tone — subtle dividers, panel edges */
  border:         '#3D362A',
  /** Jade green — success, prosperity, completed states */
  jade:           '#10B981',
  /** Dark jade — pressed/active jade states */
  jadeDark:       '#047857',
} as const;

/** Faction-specific banner colors (read from factions.json) */
export const FACTION_COLORS = {
  vanLangAuLac:   '#B8860B',   // Faction 1 — Trống Đồng Gold
  haiBaTrung:     '#C71585',   // Faction 2 — Warrior Rose
  ngoMinh:        '#1E3F66',   // Faction 3 — River Blue
  nhaLy:          '#D4AF37',   // Faction 4 — Imperial Gold
  nhaTran:        '#8B0000',   // Faction 5 — Sát Thát Red
  hauLe:          '#FF4500',   // Faction 6 — Lam Sơn Orange
  taySon:         '#E65100',   // Faction 7 — Hỏa Hổ Amber
  nhaNguyen:      '#FFD700',   // Faction 8 — Cửu Đỉnh Gold
} as const;

/** Battlefield side identification */
export const SIDE_COLORS = {
  player: {
    primary:   '#1D4ED8',   // Đại Việt Blue
    secondary: '#1E3A8A',
    accent:    '#991B1B',   // Commander crimson
    banner:    '#1E40AF',
    hp:        { from: '#10B981', to: '#2DD4BF' },  // emerald gradient
  },
  enemy: {
    primary:   '#991B1B',   // Mông Nguyên Red
    secondary: '#7F1D1D',
    accent:    '#0F172A',   // Commander dark
    banner:    '#991B1B',
    hp:        { from: '#DC2626', to: '#FB7185' },  // red gradient
  },
} as const;

// ─────────────────────────────────────────────────────────────────────────
// 2. TERRAIN PALETTE — MÀU ĐỊA HÌNH CHIẾN TRƯỜNG
// ─────────────────────────────────────────────────────────────────────────

export type TerrainStyle = {
  top: string;
  side: string;
  roughness: number;
  metalness: number;
};

export const TERRAIN_PALETTE: Record<string, TerrainStyle> = {
  plain:  { top: '#455938', side: '#2D3B24', roughness: 0.85, metalness: 0.05 },
  hill:   { top: '#73684A', side: '#4A412B', roughness: 0.90, metalness: 0.10 },
  forest: { top: '#234426', side: '#162B18', roughness: 0.90, metalness: 0.02 },
  mud:    { top: '#504333', side: '#362C20', roughness: 0.60, metalness: 0.15 },
  river:  { top: '#1C475E', side: '#0D2736', roughness: 0.15, metalness: 0.70 },
  stakes: { top: '#1A3E52', side: '#0B202E', roughness: 0.25, metalness: 0.60 },
  fort:   { top: '#5E4B33', side: '#3B2F1F', roughness: 0.80, metalness: 0.20 },
} as const;

// ─────────────────────────────────────────────────────────────────────────
// 3. MATERIAL PRESETS — VẬT LIỆU PBR
//    Consistent PBR material parameters for the "premium miniature" look.
//    All values are calibrated for Three.js MeshStandardMaterial.
// ─────────────────────────────────────────────────────────────────────────

export type PBRPreset = {
  color: string;
  metalness: number;
  roughness: number;
  emissive?: string;
  emissiveIntensity?: number;
};

export const MATERIALS: Record<string, PBRPreset> = {
  // ── Metals ──────────────────────────────
  imperialGold: {
    color: '#F59E0B',
    metalness: 0.85,
    roughness: 0.20,
  },
  agedBronze: {
    color: '#92400E',
    metalness: 0.80,
    roughness: 0.30,
  },
  polishedBronze: {
    color: '#B45309',
    metalness: 0.70,
    roughness: 0.30,
  },
  ironWeapon: {
    color: '#94A3B8',
    metalness: 0.85,
    roughness: 0.20,
  },
  steelBlade: {
    color: '#E2E8F0',
    metalness: 0.90,
    roughness: 0.15,
  },
  mongolIron: {
    color: '#475569',
    metalness: 0.80,
    roughness: 0.30,
  },

  // ── Organic / Natural ──────────────────
  skin: {
    color: '#D4A373',
    metalness: 0.0,
    roughness: 0.80,
  },
  bambooHelmet: {
    color: '#BFA15F',
    metalness: 0.0,
    roughness: 0.80,
  },
  darkWood: {
    color: '#54371F',
    metalness: 0.0,
    roughness: 0.90,
  },
  charredWood: {
    color: '#221811',
    metalness: 0.0,
    roughness: 0.95,
  },
  stakeWood: {
    color: '#402C1B',
    metalness: 0.05,
    roughness: 0.90,
  },
  rattanShield: {
    color: '#B45309',
    metalness: 0.30,
    roughness: 0.70,
  },
  leatherGrip: {
    color: '#92400E',
    metalness: 0.0,
    roughness: 0.80,
  },
  furTrim: {
    color: '#78350F',
    metalness: 0.0,
    roughness: 0.90,
  },

  // ── Fabrics ─────────────────────────────
  silkRed: {
    color: '#991B1B',
    metalness: 0.0,
    roughness: 0.60,
  },
  silkBlue: {
    color: '#1E40AF',
    metalness: 0.0,
    roughness: 0.60,
  },
  clothWhite: {
    color: '#E5E7EB',
    metalness: 0.0,
    roughness: 0.90,
  },
  mongolDarkCloth: {
    color: '#1E293B',
    metalness: 0.0,
    roughness: 0.95,
  },

  // ── Stone & Architecture ────────────────
  stoneFoundation: {
    color: '#374151',
    metalness: 0.0,
    roughness: 0.90,
  },
  fortWall: {
    color: '#4A3520',
    metalness: 0.0,
    roughness: 0.90,
  },
  roofTile: {
    color: '#D97706',
    metalness: 0.0,
    roughness: 0.60,
  },

  // ── Water & Environment ─────────────────
  riverWater: {
    color: '#0B2838',
    metalness: 0.82,
    roughness: 0.12,
  },
  sunsetReflection: {
    color: '#FFC371',
    metalness: 0.0,
    roughness: 0.0,
    emissive: '#FFC371',
    emissiveIntensity: 0.06,
  },
  mountainSilhouette: {
    color: '#081822',
    metalness: 0.0,
    roughness: 0.95,
  },

  // ── Foliage ─────────────────────────────
  mangroveStem: {
    color: '#556B2F',
    metalness: 0.0,
    roughness: 0.80,
  },
  mangroveCanopy: {
    color: '#2D5A27',
    metalness: 0.0,
    roughness: 0.85,
  },
  ivoryTusk: {
    color: '#FEF08A',
    metalness: 0.30,
    roughness: 0.30,
  },

  // ── Animal ──────────────────────────────
  elephantHide: {
    color: '#4B5563',
    metalness: 0.0,
    roughness: 0.90,
  },
  horseBrown: {
    color: '#3F2E1F',
    metalness: 0.0,
    roughness: 0.80,
  },
} as const;

// ─────────────────────────────────────────────────────────────────────────
// 4. LIGHTING RIG — CHIẾU SÁNG HOÀNG HÔN LỊCH SỬ
//    Sunset dusk atmosphere for the Bạch Đằng River, 1288.
// ─────────────────────────────────────────────────────────────────────────

export const LIGHTING = {
  /** Global fog (river dusk) */
  fog: {
    color:     '#0C1B26',
    near:      18,
    far:       55,
  },

  /** Ambient illumination — warm sunset wash */
  ambient: {
    color:     '#FCD396',
    intensity: 0.7,
  },

  /** Primary directional light — golden sunset */
  sunPrimary: {
    color:     '#FF9B49',
    intensity: 1.5,
    position:  [-16, 22, 12] as const,
    shadow: {
      mapSize:  2048,
      bias:     -0.0001,
      camera:   { left: -20, right: 20, top: 15, bottom: -15 },
    },
  },

  /** Secondary fill — river reflection cool blue */
  sunFill: {
    color:     '#5BA0C9',
    intensity: 0.5,
    position:  [14, 12, -10] as const,
  },

  /** Hemisphere — sky vs water bounce */
  hemisphere: {
    skyColor:    '#FBD097',
    groundColor: '#08253A',
    intensity:   0.55,
  },

  /** Point lights — campfire / torch / beacon */
  campfire: {
    color:     '#FBBF24',
    intensity: 0.9,
    distance:  3.5,
  },
  beacon: {
    color:     '#FF7700',
    intensity: 0.6,
    distance:  2.5,
  },
} as const;

// ─────────────────────────────────────────────────────────────────────────
// 5. CAMERA CONSTANTS — GÓC NHÌN 2.5D CỐ ĐỊNH
//    Locked cinematic diorama camera. DO NOT MODIFY camera gameplay.
// ─────────────────────────────────────────────────────────────────────────

export const CAMERA = {
  position:  [0, 18, 24] as const,
  lookAt:    [0, 0, 0]   as const,
  fov:       32,
} as const;

// ─────────────────────────────────────────────────────────────────────────
// 6. CHARACTER PROPORTIONS — TỈ LỆ NHÂN VẬT MINIATURE
//    Chibi/chunky body ratios for the "premium collectible" aesthetic.
//    Head:Body ≈ 1:2.5 · Limbs thick & rounded · No sharp polygonal edges
// ─────────────────────────────────────────────────────────────────────────

export const CHARACTER = {
  /** Commander units are 25% larger than standard soldiers */
  commanderScale: 1.25,
  standardScale:  1.0,

  /** Approximate proportions (head radius as 1.0 unit) */
  proportions: {
    headRadius:   0.18,
    torsoWidth:   0.42,
    torsoHeight:  0.55,
    torsoDepth:   0.28,
    legLength:    0.65,
  },

  /** Selection ring sizes */
  selectionRing: {
    standard:  { inner: 0.75, outer: 0.88 },
    elephant:  { inner: 0.95, outer: 1.10 },
    commander: { inner: 0.75, outer: 0.88 },
  },

  /** HP bar overhead distance */
  healthBarHeight: {
    infantry:  2.05,
    commander: 2.50,
    elephant:  3.30,
  },
} as const;

// ─────────────────────────────────────────────────────────────────────────
// 7. UI STYLE TOKENS — GIAO DIỆN TRIỀU ĐÌNH
//    Consistent styling for all HUD overlays, panels, buttons.
// ─────────────────────────────────────────────────────────────────────────

export const UI = {
  /** Panel backgrounds with Vietnamese lacquer aesthetic */
  panel: {
    primary:    'bg-gradient-to-b from-[#1a0f0a]/95 to-black/90',
    secondary:  'bg-[#0c1a24]/90',
    dark:       'bg-black/90',
    card:       'bg-gradient-to-br from-[#1c140f]/95 to-black/95',
    cardHeader: 'bg-[#2a1810]',
  },

  /** Border styling */
  border: {
    gold:      'border-[#8b744f]',
    goldLight: 'border-[#C9A44C]',
    goldFaint: 'border-[#8b744f]/50',
    subtle:    'border-slate-800',
  },

  /** Text styling classes */
  text: {
    gold:     'text-[#C9A44C]',
    lightGold:'text-[#F3E5AB]',
    warmGold: 'text-[#f3ce88]',
    label:    'text-[10px] uppercase font-bold tracking-wider font-serif',
    heading:  'font-serif font-bold uppercase tracking-widest',
  },

  /** Button presets */
  button: {
    primary:   'bg-gradient-to-r from-[#8b5e24] to-[#C9A44C] hover:brightness-110 text-black font-bold uppercase tracking-widest',
    secondary: 'bg-[#0a151e]/85 hover:bg-[#132838] border border-[#8b744f]/60 text-[#F3E5AB] font-serif font-bold uppercase tracking-widest',
    ghost:     'bg-black/50 text-slate-400 hover:text-white',
  },

  /** Glow effects */
  glow: {
    gold:    'shadow-[0_0_20px_-5px_rgba(212,175,55,0.4),inset_0_0_15px_-5px_rgba(212,175,55,0.2)]',
    crimson: 'shadow-[0_0_25px_-5px_rgba(185,28,28,0.5),inset_0_0_15px_-5px_rgba(185,28,28,0.25)]',
    jade:    'shadow-[0_0_20px_-5px_rgba(16,185,129,0.45)]',
  },

  /** Backdrop blur for floating panels */
  backdrop: 'backdrop-blur-md',

  /** Standard border radius */
  radius: {
    panel: 'rounded-xl',
    button: 'rounded-full',
    card: 'rounded-2xl',
  },
} as const;

// ─────────────────────────────────────────────────────────────────────────
// 8. TYPOGRAPHY — THƯ PHÁP & CHỮ NGHĨA
// ─────────────────────────────────────────────────────────────────────────

export const TYPOGRAPHY = {
  /** Display / heading font stack — Vietnamese serif + Noto */
  display: "'Noto Serif', 'Be Vietnam Pro', serif",
  /** Body / UI font stack */
  body: "'Be Vietnam Pro', 'Segoe UI', system-ui, sans-serif",
  /** Monospace for stats, numbers */
  mono: "'JetBrains Mono', 'Fira Code', monospace",

  /** Font sizes */
  sizes: {
    xs:    '0.6rem',
    sm:    '0.68rem',
    base:  '0.73rem',
    label: '0.63rem',
    md:    '0.78rem',
    lg:    '1rem',
    xl:    '1.3rem',
    '2xl': '1.7rem',
    '3xl': '2rem',
    '4xl': '2.7rem',
  },
} as const;

// ─────────────────────────────────────────────────────────────────────────
// 9. ANIMATION CONSTANTS — NHỊP CHIẾN TRƯỜNG
//    Timing curves and durations for battlefield animations.
// ─────────────────────────────────────────────────────────────────────────

export const ANIMATION = {
  /** Unit movement interpolation speed (lerp factor per delta) */
  moveLerpSpeed:   6,
  /** Idle breathing bob amplitude */
  idleBobAmplitude: 0.02,
  /** Idle breathing frequency */
  idleBobFrequency: 2.5,
  /** Attack lunge distance */
  attackLunge:      0.35,
  /** Hit recoil distance */
  hitRecoil:        0.20,
  /** Projectile flight duration (base ms at 1x speed) */
  projectileDuration: 400,
  /** Damage popup lifetime (ms) */
  damagePopupLife:    1200,

  /** CSS animation timing */
  transition: {
    fast:     '150ms ease',
    normal:   '220ms ease',
    slow:     '300ms ease',
    color:    '200ms ease',
  },
} as const;

// ─────────────────────────────────────────────────────────────────────────
// 10. ENVIRONMENT PROPS — MÔI TRƯỜNG CHIẾN TRƯỜNG
//     Shared constants for trees, stakes, rocks, and structures.
// ─────────────────────────────────────────────────────────────────────────

export const ENVIRONMENT = {
  /** Wooden stake (Cọc Bạch Đằng) defaults */
  stake: {
    defaultHeight:  0.80,
    defaultRadius:  0.09,
    tiltAngle:      0.08,
    /** Heights when tide is low (exposed) */
    exposedHeight:  { min: 0.75, max: 0.95 },
    /** Heights when tide is high (submerged) */
    submergedHeight: { min: 0.45, max: 0.65 },
  },

  /** Mangrove / bamboo tree cluster */
  tree: {
    stemColor:    '#556B2F',
    canopyColor:  '#2D5A27',
    stemCount:    3,
  },

  /** Rock outcrop */
  rock: {
    color: '#66615B',
  },

  /** Water plane */
  water: {
    waveFrequency: 1.2,
    foamFrequency: 1.5,
    tideDropOffset: -0.08,
    baseY:         -0.32,
    size:          [70, 50] as const,
  },

  /** Base camps / diorama edges */
  camp: {
    daiVietOffset:  [-12.2, 0, 0] as const,
    mongolOffset:   [12.2, 0, 0]  as const,
  },
} as const;

// ─────────────────────────────────────────────────────────────────────────
// 11. HEX GRID VISUAL CONSTANTS
//     Visual styling for the tactical hex grid (non-gameplay values only).
// ─────────────────────────────────────────────────────────────────────────

export const HEX_VISUAL = {
  /** Tile depth (cylinder height) */
  tileDepth: 0.45,

  /** Border ring emissive colors */
  emissive: {
    selected:   '#F59E0B',
    validTarget: '#10B981',
    hovered:     '#C9A44C',
    fort:        '#B48C3C',
    default:     '#2A3A46',
  },

  /** Emissive intensities */
  emissiveIntensity: {
    selected:    0.80,
    validTarget: 0.60,
    hovered:     0.40,
    idle:        0.15,
  },

  /** Target indicator ring */
  targetRing: {
    color:   '#10B981',
    opacity: 0.65,
    inner:   0.35,
    outer:   0.55,
  },
} as const;

// ─────────────────────────────────────────────────────────────────────────
// 12. RARITY COLORS — MÀU SẮC ĐỘ HIẾM (future NFT / advisor use)
// ─────────────────────────────────────────────────────────────────────────

export const RARITY = {
  common:    { color: '#94A3B8', glow: 'rgba(148,163,184,0.3)', label: 'Thường' },
  rare:      { color: '#3B82F6', glow: 'rgba(59,130,246,0.4)',  label: 'Hiếm' },
  epic:      { color: '#A855F7', glow: 'rgba(168,85,247,0.4)',  label: 'Sử thi' },
  legendary: { color: '#F59E0B', glow: 'rgba(245,158,11,0.5)',  label: 'Huyền thoại' },
} as const;
