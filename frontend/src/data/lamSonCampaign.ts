import { BattleUnit, HexTile, TerrainType } from '../types';

/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  LAM SƠN — KHỞI NGHĨA LAM SƠN (MOUNTAIN FOREST GUERRILLA WARFARE DATA)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 *  Asymmetrical Mountain Forest Battlefield (Chi Lăng - Xương Giang / Lam Sơn):
 *  - NORTH & FLANKS: Rugged Mountain Slopes, Dense Forest Ambush Pockets & High Ground
 *  - CENTER: Narrow Mountain Pass (Hẻm núi chốt chặn tử địa) & Rocky Brook
 *  - SOUTH-EAST: Open Valley Marching Route where the Minh Army advances
 *  - ENEMY REAR: Enemy Supply Depot (Trại tiếp tế quân Minh)
 *
 *  Ambush & Guerrilla Mechanics:
 *  - Units in dense forest, hidden clearings, or high ground start in HIDDEN state.
 *  - First attack from hidden: +30% DAMAGE, +15% CRITICAL!
 *  - High ground (+15% Ranged DMG), Dense forest (+25% DEF), Narrow pass (+20% DEF chokepoint)
 *  - Capturing the enemy Supply Camp (Col 10, Row 1) debuffs the Minh Army!
 * ═══════════════════════════════════════════════════════════════════════════
 */

const COLS = 12;
const ROWS = 7;

export function buildLamSonHexes(): HexTile[] {
  const tiles: HexTile[] = [];

  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      let terrain: TerrainType = 'plain';
      let zone: HexTile['zone'] = 'neutral';
      let label: string | undefined;
      let effect: string | undefined;

      // ── 1. STRATEGIC SPECIAL HEXES ─────────────────────────────────────
      if (col === 10 && row === 1) {
        // Enemy Supply Camp (Mục tiêu phụ quan trọng)
        terrain = 'supply_camp';
        zone = 'enemy';
        label = 'Trại tiếp tế quân Minh';
        effect = 'Chiếm đóng để phá vỡ hậu cần và sĩ khí địch';
      } else if (
        (col === 0 && (row === 0 || row === 1)) ||
        (col === 11 && (row === 0 || row === 1)) ||
        (col === 1 && row === 0) ||
        (col === 10 && row === 0)
      ) {
        // Perimeter mountain cliffs & crags
        terrain = 'mountain';
        zone = col <= 3 ? 'ally' : 'neutral';
        label = 'Vách núi đá Lam Sơn';
        effect = 'Địa hình hiểm trở che chắn sườn';
      } else if ((col === 4 && row === 1) || (col === 6 && row === 1)) {
        // High Ground vantage points for archers
        terrain = 'hill';
        zone = 'ally';
        label = 'Gò đất cao Chi Lăng';
        effect = '+15% Sát thương tầm xa & Tầm bắn +1';
      } else if (
        (col === 5 && row === 2) ||
        (col === 5 && row === 3) ||
        (col === 6 && row === 3)
      ) {
        // Narrow Valley Pass (Hẻm núi chốt chặn)
        terrain = 'narrow_path';
        zone = 'neutral';
        label = 'Hẻm núi hiểm trở';
        effect = '+20% Phòng thủ chốt chặn ải';
      } else if (
        (col === 2 && row === 2) ||
        (col === 3 && row === 2) ||
        (col === 7 && row === 2) ||
        (col === 8 && row === 2) ||
        (col === 2 && row === 3) ||
        (col === 3 && row === 4) ||
        (col === 1 && row === 3)
      ) {
        // Dense Forest Ambush Pockets (Rừng sâu mai phục)
        terrain = 'dense_forest';
        zone = 'ally';
        label = 'Rừng già mai phục';
        effect = 'Ẩn mình: +30% ST đòn đầu, +25% Thủ, +15% Né';
      } else if (
        (col === 3 && row === 0) ||
        (col === 4 && row === 0) ||
        (col === 7 && row === 0) ||
        (col === 8 && row === 0) ||
        (col === 0 && row === 3) ||
        (col === 1 && row === 5) ||
        (col === 11 && row === 4)
      ) {
        // Regular Forest & Bamboo Groves
        terrain = 'forest';
        zone = col <= 5 ? 'ally' : 'neutral';
        label = 'Rừng tre nứa rậm';
        effect = '+15% Phòng thủ rừng cây';
      } else if (
        (col === 4 && row === 3) ||
        (col === 4 && row === 4) ||
        (col === 3 && row === 5) ||
        (col === 4 && row === 6)
      ) {
        // Winding Rocky Mountain Stream (Suối rừng đá cuội)
        terrain = 'river';
        zone = 'neutral';
        label = 'Suối đá gập ghềnh';
        effect = 'Làm chậm bước tiến của kỵ binh';
      } else if (
        (col >= 7 && col <= 10 && row >= 4 && row <= 6) ||
        (col === 6 && row === 5)
      ) {
        // Open Valley Road / Marching Route of Minh Army
        terrain = 'road';
        zone = 'enemy';
        label = 'Thung lũng đường tiến quân';
        effect = 'Lối hành quân chính của đại quân Minh';
      } else {
        // Open Forest Clearings & Grassy Plains
        terrain = 'plain';
        zone = col <= 4 ? 'ally' : col >= 8 ? 'enemy' : 'neutral';
        label = 'Bãi cỏ thung lũng';
        effect = 'Chiến địa thông thoáng';
      }

      tiles.push({ col, row, terrain, zone, label, effect });
    }
  }

  return tiles;
}

export const LAM_SON_HEXES: HexTile[] = buildLamSonHexes();

export const LAM_SON_UNITS: BattleUnit[] = [
  // ========================================================
  // NGHĨA QUÂN LAM SƠN (ALLIED RESISTANCE FORCES - 6 UNITS)
  // Lighter, agile, forest camouflage, ambush specialists
  // ========================================================
  {
    unit_id: 'lam_cmd',
    name: 'Lê Lợi',
    side: 'player',
    icon: 'commander',
    is_commander: true,
    col: 2,
    row: 3,
    is_hidden: true,
    stats: { at: 200, atk: 54, def: 50, asTk: 16, atf: 38, reg: 35 },
  },
  {
    unit_id: 'lam_p1',
    name: 'Nghĩa Binh Lam Sơn I',
    side: 'player',
    icon: 'spear',
    col: 3,
    row: 2,
    is_hidden: true,
    stats: { at: 140, atk: 44, def: 38, asTk: 14, atf: 30, reg: 20 },
  },
  {
    unit_id: 'lam_p2',
    name: 'Nghĩa Binh Lam Sơn II',
    side: 'player',
    icon: 'spear',
    col: 7,
    row: 2,
    is_hidden: true,
    stats: { at: 140, atk: 44, def: 38, asTk: 14, atf: 30, reg: 20 },
  },
  {
    unit_id: 'lam_p3',
    name: 'Xạ Thủ Rừng Núi I',
    side: 'player',
    icon: 'archer',
    col: 4,
    row: 1,
    is_hidden: true,
    stats: { at: 115, atk: 48, def: 28, asTk: 18, atf: 52, reg: 15 },
  },
  {
    unit_id: 'lam_p4',
    name: 'Xạ Thủ Rừng Núi II',
    side: 'player',
    icon: 'archer',
    col: 6,
    row: 1,
    is_hidden: true,
    stats: { at: 115, atk: 48, def: 28, asTk: 18, atf: 52, reg: 15 },
  },
  {
    unit_id: 'lam_p5',
    name: 'Trinh Sát Rừng Già',
    side: 'player',
    icon: 'cavalry',
    col: 1,
    row: 4,
    is_hidden: true,
    stats: { at: 125, atk: 46, def: 34, asTk: 18, atf: 34, reg: 25 },
  },

  // ========================================================
  // ĐẠI QUÂN MINH (INVADING MINH IMPERIAL FORCES - 6 UNITS)
  // Heavily armored, rigid formation advancing through valley
  // ========================================================
  {
    unit_id: 'minh_cmd',
    name: 'Liễu Thăng',
    side: 'enemy',
    icon: 'commander',
    is_commander: true,
    col: 9,
    row: 4,
    stats: { at: 195, atk: 54, def: 52, asTk: 12, atf: 35, reg: 25 },
  },
  {
    unit_id: 'minh_e1',
    name: 'Thiết Giáp Tiên Phong I',
    side: 'enemy',
    icon: 'spear',
    col: 5,
    row: 4,
    stats: { at: 145, atk: 42, def: 44, asTk: 10, atf: 28, reg: 18 },
  },
  {
    unit_id: 'minh_e2',
    name: 'Thiết Giáp Tiên Phong II',
    side: 'enemy',
    icon: 'spear',
    col: 6,
    row: 4,
    stats: { at: 145, atk: 42, def: 44, asTk: 10, atf: 28, reg: 18 },
  },
  {
    unit_id: 'minh_e3',
    name: 'Thiết Kỵ Quân Minh',
    side: 'enemy',
    icon: 'cavalry',
    col: 8,
    row: 5,
    stats: { at: 160, atk: 52, def: 46, asTk: 15, atf: 25, reg: 20 },
  },
  {
    unit_id: 'minh_e4',
    name: 'Cung Thủ Thần Cơ I',
    side: 'enemy',
    icon: 'archer',
    col: 8,
    row: 3,
    stats: { at: 110, atk: 44, def: 25, asTk: 16, atf: 46, reg: 15 },
  },
  {
    unit_id: 'minh_e5',
    name: 'Hộ Vệ Trại Tiếp Tế',
    side: 'enemy',
    icon: 'spear',
    col: 10,
    row: 1,
    is_supply_camp: true,
    stats: { at: 130, atk: 38, def: 45, asTk: 11, atf: 28, reg: 20 },
  },
];

export const LAM_SON_ADVANTAGES = [
  {
    id: 'rung_sau',
    icon: '🌲',
    title: 'Rừng Sâu Mai Phục',
    bonus: '+25% Phòng thủ',
    desc: 'Cây rừng rậm rạp che chắn tầm nhìn giặc, giảm sát thương nhận vào.',
    active: true,
  },
  {
    id: 'phuc_kich',
    icon: '⚔',
    title: 'Đòn Phục Kích Sấm Sét',
    bonus: '+30% Sát thương đầu',
    desc: 'Đòn đánh đầu tiên từ trạng thái ẩn mình gây sát thương kinh hoàng.',
    active: true,
  },
  {
    id: 'dia_hinh_cao',
    icon: '⛰',
    title: 'Địa Hình Đồi Cao',
    bonus: '+15% Tầm bắn & Sát thương',
    desc: 'Cung thủ trên cao điểm bao quát thung lũng, chế áp đối phương.',
    active: true,
  },
  {
    id: 'duong_hep',
    icon: '🛤',
    title: 'Đường Hẹp Khóa Ải',
    bonus: '+20% Phòng thủ',
    desc: 'Hẻm núi thắt nút bóp nghẹt kỵ binh và bộ binh hạng nặng quân Minh.',
    active: true,
  },
];
