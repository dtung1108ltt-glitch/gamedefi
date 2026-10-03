import { BattleUnit, HexTile, TerrainType } from '../types';

/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  THĂNG LONG — KINH ĐÔ NHÀ LÝ (CITADEL SIEGE DEFENSE BATTLEFIELD DATA)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 *  3 Defensive Layers:
 *  - LAYER 1: NORTH (Rows 0-1) — Outer Terrain, Moat Canal, Siege Approach
 *  - LAYER 2: MIDDLE (Row 2)  — Citadel Walls, Đoan Môn Gatehouse, Watchtowers
 *  - LAYER 3: SOUTH (Rows 3-6) — Imperial Courtyard, Ngự Đạo, Imperial Palace
 *
 *  Palace Breach Defeat Condition:
 *  - If any enemy unit reaches the Imperial Palace (Row >= 5), PLAYER LOSES.
 * ═══════════════════════════════════════════════════════════════════════════
 */

const COLS = 12;
const ROWS = 7;

export function buildThangLongHexes(): HexTile[] {
  const tiles: HexTile[] = [];

  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      let terrain: TerrainType = 'plain';
      let zone: HexTile['zone'] = 'neutral';
      let label: string | undefined;
      let effect: string | undefined;

      if (row === 0 || row === 1) {
        // ── LAYER 1: OUTER BATTLEFIELD (ENEMY SIEGE APPROACH) ───────────
        zone = 'enemy';
        if (row === 0 && (col === 0 || col === 11)) {
          terrain = 'hill';
          label = 'Gò đất tiền tiêu';
          effect = 'Tầm nhìn bao quát';
        } else if (row === 0 && (col === 3 || col === 4 || col === 7 || col === 8)) {
          terrain = 'river';
          label = 'Hào nước hộ thành';
          effect = 'Làm chậm bước tiến của bộ binh địch';
        } else if ((col === 5 || col === 6) && (row === 0 || row === 1)) {
          terrain = 'road';
          label = 'Đường cái quan';
          effect = 'Lối tiến quân thẳng vào cổng chính';
        } else if (col === 1 || col === 10) {
          terrain = 'forest';
          label = 'Bãi cây rậm';
        } else {
          terrain = 'plain';
          label = 'Bãi ngoại thành';
        }
      } else if (row === 2) {
        // ── LAYER 2: CITADEL WALLS, MAIN GATE & WATCHTOWERS ─────────────
        zone = 'ally';
        if (col === 5 || col === 6) {
          terrain = 'gate';
          label = 'Đoan Môn (Cổng chính)';
          effect = '+20% Phòng thủ cửa ải';
        } else if (col === 2 || col === 9) {
          terrain = 'fort';
          label = col === 2 ? 'Tháp Canh Tây' : 'Tháp Canh Đông';
          effect = '+15% Tầm bắn nỏ & Cung tiễn';
        } else {
          terrain = 'wall';
          label = 'Tường thành gạch đá';
          effect = '+25% Phòng thủ quân trấn giữ';
        }
      } else if (row === 3 || row === 4) {
        // ── LAYER 3: IMPERIAL COURTYARD & INNER PRECINCT ────────────────
        zone = 'ally';
        if (col === 5 || col === 6) {
          terrain = 'road';
          label = 'Ngự Đạo (Đường Hoàng Gia)';
          effect = 'Trục chính dẫn vào ngai vàng';
        } else if (col === 0 || col === 1 || col === 10 || col === 11) {
          terrain = 'garden';
          label = 'Ngự Uyển (Vườn thượng uyển)';
          effect = '+5% Phòng thủ ẩn nấp';
        } else {
          terrain = 'courtyard';
          label = 'Sân Rồng Hoàng Thành';
          effect = '+10% Sĩ khí bảo vệ kinh đô';
        }
      } else {
        // ── LAYER 3 FINAL: IMPERIAL PALACE / ĐIỆN THIÊN AN (Rows 5-6) ───
        zone = 'ally';
        if (col >= 4 && col <= 7) {
          terrain = 'courtyard';
          label = 'Điện Càn Nguyên / Thiên An';
          effect = 'Khu vực tối thượng — Địch lọt vào là Thất Thủ!';
        } else if (col <= 1 || col >= 10) {
          terrain = 'garden';
          label = 'Khuôn viên Hoàng Gia';
        } else {
          terrain = 'courtyard';
          label = 'Hiên Điện Hoàng Gia';
        }
      }

      tiles.push({ col, row, terrain, zone, label, effect });
    }
  }

  return tiles;
}

export const THANG_LONG_HEXES: HexTile[] = buildThangLongHexes();

/**
 * Quân lực Thăng Long (Nhà Lý vs Đối Phương / Quân Xâm Lược)
 * 6 Allied Units (Nhà Lý) vs 6 Invading Enemy Units
 */
export const THANG_LONG_UNITS: BattleUnit[] = [
  // ==========================================
  // QUÂN ĐỘI NHÀ LÝ (ALLIED DEFENDERS - 6 UNITS)
  // ==========================================
  {
    unit_id: 'ly_cmd',
    name: 'Lý Thường Kiệt',
    side: 'player',
    icon: 'commander',
    is_commander: true,
    col: 5,
    row: 3,
    stats: { at: 200, atk: 55, def: 52, asTk: 16, atf: 38, reg: 35 },
  },
  {
    unit_id: 'ly_p1',
    name: 'Cấm Quân Đại Việt I',
    side: 'player',
    icon: 'spear',
    col: 4,
    row: 2,
    stats: { at: 140, atk: 40, def: 44, asTk: 12, atf: 30, reg: 22 },
  },
  {
    unit_id: 'ly_p2',
    name: 'Cấm Quân Đại Việt II',
    side: 'player',
    icon: 'spear',
    col: 7,
    row: 2,
    stats: { at: 140, atk: 40, def: 44, asTk: 12, atf: 30, reg: 22 },
  },
  {
    unit_id: 'ly_p3',
    name: 'Ngự Lâm Tiên Phong',
    side: 'player',
    icon: 'spear',
    col: 6,
    row: 3,
    stats: { at: 150, atk: 48, def: 42, asTk: 14, atf: 32, reg: 25 },
  },
  {
    unit_id: 'ly_p4',
    name: 'Thần Nỏ Thăng Long I',
    side: 'player',
    icon: 'archer',
    col: 2,
    row: 2,
    stats: { at: 115, atk: 46, def: 30, asTk: 18, atf: 50, reg: 16 },
  },
  {
    unit_id: 'ly_p5',
    name: 'Thần Nỏ Thăng Long II',
    side: 'player',
    icon: 'archer',
    col: 9,
    row: 2,
    stats: { at: 115, atk: 46, def: 30, asTk: 18, atf: 50, reg: 16 },
  },

  // ==========================================
  // QUÂN ĐỘI XÂM LƯỢC (INVADING ENEMY - 6 UNITS)
  // ==========================================
  {
    unit_id: 'tl_e_cmd',
    name: 'Tướng Tiên Phong',
    side: 'enemy',
    icon: 'commander',
    is_commander: true,
    col: 5,
    row: 0,
    stats: { at: 190, atk: 52, def: 48, asTk: 14, atf: 35, reg: 30 },
  },
  {
    unit_id: 'tl_e1',
    name: 'Thiết Giáp Vây Thành I',
    side: 'enemy',
    icon: 'spear',
    col: 4,
    row: 1,
    stats: { at: 135, atk: 40, def: 38, asTk: 12, atf: 30, reg: 20 },
  },
  {
    unit_id: 'tl_e2',
    name: 'Thiết Giáp Vây Thành II',
    side: 'enemy',
    icon: 'spear',
    col: 7,
    row: 1,
    stats: { at: 135, atk: 40, def: 38, asTk: 12, atf: 30, reg: 20 },
  },
  {
    unit_id: 'tl_e3',
    name: 'Thiết Kỵ Đột Kích',
    side: 'enemy',
    icon: 'cavalry',
    col: 5,
    row: 1,
    stats: { at: 155, atk: 50, def: 44, asTk: 15, atf: 28, reg: 22 },
  },
  {
    unit_id: 'tl_e4',
    name: 'Cung Thủ Phá Thành I',
    side: 'enemy',
    icon: 'archer',
    col: 2,
    row: 0,
    stats: { at: 110, atk: 44, def: 24, asTk: 16, atf: 46, reg: 15 },
  },
  {
    unit_id: 'tl_e5',
    name: 'Cung Thủ Phá Thành II',
    side: 'enemy',
    icon: 'archer',
    col: 9,
    row: 0,
    stats: { at: 110, atk: 44, def: 24, asTk: 16, atf: 46, reg: 15 },
  },
];

export const THANG_LONG_ADVANTAGES = [
  {
    id: 'thanh_cao',
    icon: '🏯',
    title: 'Thành Cao Kiên Cố',
    bonus: '+25% Phòng thủ',
    desc: 'Lớp tường thành gạch nung sừng sững che chở cho cung thủ và cấm quân.',
    active: true,
  },
  {
    id: 'cong_thanh',
    icon: '🚪',
    title: 'Cổng Thành Đoan Môn',
    bonus: '+20% Phòng thủ',
    desc: 'Cửa gỗ lim bọc đồng kiên cố biến cổng thành thành nút thắt tử thủ.',
    active: true,
  },
  {
    id: 'thap_canh',
    icon: '🏹',
    title: 'Tháp Canh Cao Tầng',
    bonus: '+15% Tầm đánh',
    desc: 'Vọng lâu cao tầng mở rộng tầm bắn của Thần Nỏ bao quát toàn bộ cửa thành.',
    active: true,
  },
  {
    id: 'hoang_thanh',
    icon: '👑',
    title: 'Khí Phách Hoàng Thành',
    bonus: '+10% Tinh thần',
    desc: 'Điện Càn Nguyên rực rỡ tiếp thêm dũng khí cho quân dân quyết tử giữ kinh đô.',
    active: true,
  },
];
