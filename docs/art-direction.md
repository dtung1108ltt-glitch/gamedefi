# 🎨 HÀO KHÍ ĐẠI VIỆT — Global Art Direction

> **Tài liệu hướng dẫn phong cách nghệ thuật thống nhất cho toàn bộ dự án.**
> Mọi asset — character, soldier, general, tree, flag, building, fortress, environment —
> **PHẢI** tuân theo visual language được mô tả ở đây.

---

## 📋 Tổng quan

| Attribute | Specification |
|---|---|
| **Project** | Hào Khí Đại Việt — Vietnamese Historical Strategy GameFi |
| **Setting** | Bạch Đằng 1288 (Trần Dynasty vs Mongol-Yuan Empire) |
| **Render Style** | Stylized high-quality 3D |
| **Proportions** | Chibi / Chunky (Head:Body ≈ 1:2.5) |
| **Realism** | Semi-realistic (PBR materials, soft cinematic lighting) |
| **Aesthetic** | Premium collectible miniature / tabletop diorama |
| **Battlefield** | Cinematic 2.5D (fixed camera, isometric perspective) |
| **Visual Target** | Rise of Kingdoms-inspired, Vietnamese historical identity |
| **Tech Stack** | React Three Fiber (Three.js) · Tailwind CSS · TypeScript |

---

## 🚫 Forbidden Directions

| ❌ DO NOT | Reason |
|---|---|
| Anime | Wrong visual identity — not Japanese |
| Photorealistic | Too heavy, not miniature aesthetic |
| Generic European Medieval | Wrong cultural context |
| Fantasy RPG | Historical, not fantasy |
| Futuristic | 13th century Vietnam |
| Overly Cartoonish | Premium quality required |
| Low-quality Flat 2D Sprites | Full 3D procedural models required |

---

## 🏗 Design System Architecture

```
frontend/src/design/
├── tokens.ts        ← Single source of truth (TypeScript constants)
├── variables.css    ← CSS custom properties (mirrors tokens.ts)
└── index.ts         ← Barrel export

tailwind.config.js   ← Integrated with design tokens
index.css            ← Imports variables.css before Tailwind
```

### Importing Tokens

**In TypeScript / React components:**
```ts
import { IMPERIAL, MATERIALS, LIGHTING, UI, CHARACTER } from '../design';
```

**In CSS / Tailwind:**
```css
color: var(--hk-color-gold);
background: var(--hk-ui-panel);
```

**Tailwind utility classes:**
```html
<div class="bg-imperial-crimson text-hk-lightgold shadow-hk-gold" />
<span class="text-rarity-legendary" />
```

---

## 🎨 Color Palette

### Imperial Court Colors (Primary)

| Token | Hex | Usage |
|---|---|---|
| `imperial.crimson` | `#8B1E0F` | Brand primary, Trần dynasty banners |
| `imperial.darkred` | `#520B05` | Deep shadows, lacquer surfaces |
| `imperial.gold` | `#D4AF37` | Trim, emblems, Đông Sơn bronze |
| `imperial.lightgold` | `#F3E5AB` | Highlights, hover states |
| `imperial.bronze` | `#CD7F32` | Armor, weapons |
| `imperial.obsidian` | `#0B0C10` | Primary background |
| `imperial.lacquer` | `#13141C` | Panel backgrounds |
| `imperial.jade` | `#10B981` | Success, prosperity |

### Side Identification

| Side | Primary | Accent | Banner |
|---|---|---|---|
| Đại Việt (Player) | `#1D4ED8` Blue | `#991B1B` Crimson | `#1E40AF` |
| Mông Nguyên (Enemy) | `#991B1B` Red | `#0F172A` Dark | `#991B1B` |

---

## 🧱 PBR Material Presets

All 3D assets use `MeshStandardMaterial` with these calibrated values:

### Metals
| Material | Color | Metalness | Roughness |
|---|---|---|---|
| `imperialGold` | `#F59E0B` | 0.85 | 0.20 |
| `agedBronze` | `#92400E` | 0.80 | 0.30 |
| `ironWeapon` | `#94A3B8` | 0.85 | 0.20 |
| `steelBlade` | `#E2E8F0` | 0.90 | 0.15 |
| `mongolIron` | `#475569` | 0.80 | 0.30 |

### Organic
| Material | Color | Metalness | Roughness |
|---|---|---|---|
| `skin` | `#D4A373` | 0.00 | 0.80 |
| `bambooHelmet` | `#BFA15F` | 0.00 | 0.80 |
| `darkWood` | `#54371F` | 0.00 | 0.90 |
| `rattanShield` | `#B45309` | 0.30 | 0.70 |

### Fabrics
| Material | Color | Usage |
|---|---|---|
| `silkRed` | `#991B1B` | Royal cloaks, Đại Việt banners |
| `silkBlue` | `#1E40AF` | Trần navy flags |
| `mongolDarkCloth` | `#1E293B` | Mongol sails and tents |

---

## 💡 Lighting Rig

Historical sunset atmosphere — Bạch Đằng River, late afternoon 1288.

| Light | Color | Intensity | Role |
|---|---|---|---|
| **Fog** | `#0C1B26` | near: 18, far: 55 | River dusk atmosphere |
| **Ambient** | `#FCD396` | 0.70 | Warm sunset wash |
| **Sun Primary** | `#FF9B49` | 1.50 | Golden hour directional |
| **Sun Fill** | `#5BA0C9` | 0.50 | Cool river reflection |
| **Hemisphere** | Sky `#FBD097` / Ground `#08253A` | 0.55 | Sky-water bounce |
| **Campfire** | `#FBBF24` | 0.90 | Base camp warmth |
| **Beacon** | `#FF7700` | 0.60 | Fort signal fires |

---

## 🎭 Character Model Guidelines

### Proportions
- **Head:Body ratio** — approximately 1:2.5 (chibi-chunky, not anime)
- **Limbs** — thick and rounded, no sharp edges
- **Geometry** — clean, low-to-mid poly with smooth normals
- **Scale** — Commanders are **1.25x** standard unit size

### Equipment Visual Language

| Element | Đại Việt | Mông Nguyên |
|---|---|---|
| **Helmet** | Nón Dấu (conical bamboo) | Iron dome + fur trim |
| **Commander Helm** | Gold crown with red finial | Gold crown with dark finial |
| **Armor** | Bronze chestplate + rattan | Iron plates + leather |
| **Shield** | Rattan (warm bronze) | Iron (cool slate) |
| **Weapon** | Bamboo spear, recurve bow, dao sword | Similar weapons, darker palette |
| **Banner** | Blue field + gold trim | Dark/red field + gold trim |
| **Cloak** | Deep red (`#991B1B`) | Indigo (`#1E1B4B`) |
| **Mount (Horse)** | Light/white (commander) | Dark brown steppe horse |
| **War Elephant** | Gray hide + red howdah | (Đại Việt exclusive) |

### Unit Types & Icons

| Type | Icon Key | Visual Features |
|---|---|---|
| Commander | `commander` | Crown helmet, sword+shield, mounted (horse), cloak, flag, 1.25x scale |
| Spearman | `spear` | Nón Dấu, spear+shield, standing infantry |
| Archer | `archer` | Nón Dấu, recurve bow, light armor |
| Cavalry | `cavalry` | Nón Dấu, mounted on warhorse, sword |
| Elephant | `elephant` | War elephant + howdah + rider, tusks |

---

## 🏯 Environment & Terrain

### Hex Tile Terrain

| Terrain | Top Color | PBR | Props |
|---|---|---|---|
| Plain | `#455938` | R:0.85 M:0.05 | (none) |
| Hill | `#73684A` | R:0.90 M:0.10 | Rock outcrops |
| Forest | `#234426` | R:0.90 M:0.02 | Mangrove/bamboo clusters |
| Mud | `#504333` | R:0.60 M:0.15 | (none) |
| River | `#1C475E` | R:0.15 M:0.70 | Reflective water surface |
| Stakes | `#1A3E52` | R:0.25 M:0.60 | Bạch Đằng wooden stakes (tide-reactive) |
| Fort | `#5E4B33` | R:0.80 M:0.20 | Palisade + beacon torch |

### Wooden Stakes (Cọc Bạch Đằng)
- Charred pointed tips (dark `#221811`)
- Lighter wooden shafts (`#402C1B`)
- Emerge from riverbed, height varies with tide state
- Subtle tilt variation for organic feel

### Base Camps (Diorama Edges)
- **Đại Việt** (left/west): Red command pavilion, bronze drum, Sát Thát banner, war junks with dragon prow
- **Mông Nguyên** (right/east): Dark command tent, Mongol banners, heavy warships with fortified bow

---

## 📐 UI / HUD Design

### Panel Aesthetic
- **Background**: Dark gradient with Vietnamese lacquer depth
- **Borders**: Antique gold (`#8b744f`) single-pixel borders
- **Corners**: Gold corner ornaments (CSS pseudo-elements)
- **Text**: Gold headings, warm cream body text (`#f2ecdf`)
- **Blur**: `backdrop-blur-md` on floating panels
- **Glow**: Gold `box-shadow` for emphasis

### Button Hierarchy
1. **Primary** — Gold gradient (`from-[#8b5e24] to-[#C9A44C]`), dark text
2. **Secondary** — Dark background, gold border, gold text, serif font
3. **Ghost** — Transparent, subtle text, no border

### Scrollbar
- Track: obsidian `#0B0C10`
- Thumb: border gold `#3D362A` with `#D4AF37` border
- Hover: full gold `#D4AF37`

---

## 🔧 Usage Checklist for New Assets

When creating any new visual asset, verify:

- [ ] Colors come from `tokens.ts` or `variables.css`
- [ ] PBR materials use presets from `MATERIALS`
- [ ] Lighting matches the sunset rig in `LIGHTING`
- [ ] Character proportions follow `CHARACTER` constants
- [ ] Side colors differentiate Đại Việt (blue) vs Mông Nguyên (red)
- [ ] Equipment follows the Vietnamese historical equipment table
- [ ] No anime / photorealistic / European medieval / fantasy / futuristic elements
- [ ] UI panels use the lacquer panel aesthetic with gold borders
- [ ] Typography uses `font-display` for headings, `font-sans` for body

---

## ⚠️ Rules

1. **KHÔNG thay đổi gameplay** — tokens are visual only
2. **KHÔNG thay đổi camera** — position `[0, 18, 24]`, fov `32`, fixed
3. **KHÔNG thay đổi battlefield positions** — hex grid layout unchanged
4. **KHÔNG thay đổi combat engine** — damage, HP, movement rules untouched
5. **ALL future assets MUST use this design system** — no hardcoded magic values
