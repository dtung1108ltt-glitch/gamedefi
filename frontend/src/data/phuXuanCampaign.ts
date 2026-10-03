/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  HÀO KHÍ ĐẠI VIỆT — PHÚ XUÂN (KINH ĐÔ NHÀ NGUYỄN) CAMPAIGN DATA
 * ═══════════════════════════════════════════════════════════════════════════
 *
 *  Historical Scenario:
 *  - ID: phu_xuan / phu-xuan
 *  - Title: PHÚ XUÂN — Kinh đô Nhà Nguyễn
 *  - Core Fantasy: RIVER + CITADEL + CONTROL POINTS
 *  - Geography:
 *      * North: Distant green hills & northern approaches
 *      * Middle North: Sông Hương (Perfume River) spanned by two bridges:
 *          - Western Bridge (Tây Kiều) at (col 3, row 2)
 *          - Eastern Bridge (Đông Kiều) at (col 8, row 2)
 *      * Middle South: Riverbanks, mud shoals, and citadel moat approaches
 *      * South: Phú Xuân Citadel with stone ramparts, main imperial gate
 *        (Cổng Ngọ Môn), watchtowers, royal gardens, and the Imperial Courtyard
 *        (Sân Rồng / Hoàng Thành) at (col 5, row 5).
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { BattleUnit, ControlPointState, HexTile, TerrainType } from '../types';

export const PHU_XUAN_COLS = 12;
export const PHU_XUAN_ROWS = 7;

/**
 * Procedural generation of the Phú Xuân River + Citadel Hex Battlefield
 */
export function buildPhuXuanHexes(): HexTile[] {
  const hexes: HexTile[] = [];

  for (let r = 0; r < PHU_XUAN_ROWS; r++) {
    for (let c = 0; c < PHU_XUAN_COLS; c++) {
      let terrain: TerrainType = 'plain';
      let label: string | undefined = undefined;
      let effect: string | undefined = undefined;
      let control_point: HexTile['control_point'] = undefined;

      // ─────────────────────────────────────────────────────────────
      // ROW 0: NORTHERN HILLS & APPROACHES
      // ─────────────────────────────────────────────────────────────
      if (r === 0) {
        if (c <= 1) {
          terrain = 'mountain';
          label = 'Gò Núi Tiền Tiêu';
          effect = '+15% Tầm nhìn và hỏa lực bắn xa';
        } else if (c === 2 || c === 3) {
          terrain = 'road';
          label = 'Đường Tiến Quân Bắc Tây';
        } else if (c >= 4 && c <= 6) {
          terrain = 'plain';
          label = 'Bãi Trống Bắc Sông Hương';
        } else if (c === 7 || c === 8) {
          terrain = 'road';
          label = 'Đường Tiến Quân Bắc Đông';
        } else {
          terrain = 'hill';
          label = 'Đồi Cao Quan Sát';
          effect = '+15% Sát thương tầm xa';
        }
      }

      // ─────────────────────────────────────────────────────────────
      // ROW 1: NORTH RIVERBANK & BRIDGE ENTRY RAMPS
      // ─────────────────────────────────────────────────────────────
      else if (r === 1) {
        if (c === 3) {
          terrain = 'bridge';
          label = 'Đầu Cầu Tây Kiều Bắc';
          effect = 'Lối vượt Sông Hương';
        } else if (c === 8) {
          terrain = 'bridge';
          label = 'Đầu Cầu Đông Kiều Bắc';
          effect = 'Lối vượt Sông Hương';
        } else if (c <= 2 || c >= 9) {
          terrain = 'riverbank';
          label = 'Bờ Bắc Sông Hương';
        } else {
          terrain = 'river';
          label = 'Sông Hương (Dòng Chảy)';
        }
      }

      // ─────────────────────────────────────────────────────────────
      // ROW 2: SÔNG HƯƠNG MAIN CHANNEL & STRATEGIC BRIDGES (OBJECTIVES)
      // ─────────────────────────────────────────────────────────────
      else if (r === 2) {
        if (c === 3) {
          terrain = 'bridge';
          label = 'Tây Kiều 🌉 [ĐIỂM CHIẾN LƯỢC]';
          effect = '+15% Tốc độ di chuyển toàn quân khi kiểm soát';
          control_point = 'west_bridge';
        } else if (c === 8) {
          terrain = 'bridge';
          label = 'Đông Kiều 🌉 [ĐIỂM CHIẾN LƯỢC]';
          effect = '+15% Tầm bắn cung thủ khi kiểm soát';
          control_point = 'east_bridge';
        } else {
          terrain = 'river';
          label = 'Sông Hương';
        }
      }

      // ─────────────────────────────────────────────────────────────
      // ROW 3: SOUTH RIVERBANK, MUD & CITADEL MOAT APPROACHES
      // ─────────────────────────────────────────────────────────────
      else if (r === 3) {
        if (c === 3) {
          terrain = 'road';
          label = 'Ngõ Nam Tây Kiều';
        } else if (c === 8) {
          terrain = 'road';
          label = 'Ngõ Nam Đông Kiều';
        } else if (c === 4 || c === 7) {
          terrain = 'mud';
          label = 'Bãi Bùn Lầy Ven Sông';
          effect = '-20% Tốc độ di chuyển, -10% Phòng thủ';
        } else if (c === 5 || c === 6) {
          terrain = 'plain';
          label = 'Quảng Trường Tiền Môn';
        } else {
          terrain = 'riverbank';
          label = 'Bờ Nam Sông Hương';
        }
      }

      // ─────────────────────────────────────────────────────────────
      // ROW 4: PHÚ XUÂN CITADEL WALLS, WATCHTOWERS & MAIN IMPERIAL GATE
      // ─────────────────────────────────────────────────────────────
      else if (r === 4) {
        if (c === 2) {
          terrain = 'fort';
          label = 'Tháp Canh Hữu Dực 🏹';
          effect = '+15% Tầm cung thủ, +20% DEF';
        } else if (c === 9) {
          terrain = 'fort';
          label = 'Tháp Canh Tả Dực 🏹';
          effect = '+15% Tầm cung thủ, +20% DEF';
        } else if (c === 5 || c === 6) {
          terrain = 'gate';
          label = 'Cổng Ngọ Môn Phú Xuân 🏯';
          effect = '+20% Phòng thủ kiên cố trước cổng thành';
        } else {
          terrain = 'wall';
          label = 'Thành Lũy Đá Phú Xuân';
          effect = '+25% Phòng thủ';
        }
      }

      // ─────────────────────────────────────────────────────────────
      // ROW 5: IMPERIAL COURTYARD (CONTROL POINT) & ROYAL GARDENS
      // ─────────────────────────────────────────────────────────────
      else if (r === 5) {
        if (c <= 2) {
          terrain = 'garden';
          label = 'Ngự Uyển Hữu Dực';
          effect = '+5% Né tránh';
        } else if (c >= 9) {
          terrain = 'garden';
          label = 'Ngự Uyển Tả Dực';
          effect = '+5% Né tránh';
        } else if (c === 5) {
          terrain = 'courtyard';
          label = 'Hoàng Thành Phú Xuân 👑 [ĐIỂM CHIẾN LƯỢC]';
          effect = '+20% Tinh thần / Sĩ khí quân ta khi giữ vững Hoàng Thành';
          control_point = 'imperial_courtyard';
        } else {
          terrain = 'courtyard';
          label = 'Sân Rồng Đại Nội';
        }
      }

      // ─────────────────────────────────────────────────────────────
      // ROW 6: CENTRAL COMMAND HALL (ĐIỆN THÁI HÒA / KỲ ĐÀI) & INNER COURT
      // ─────────────────────────────────────────────────────────────
      else if (r === 6) {
        if (c <= 2 || c >= 9) {
          terrain = 'garden';
          label = 'Khu Vườn Cung Đình';
        } else if (c === 5 || c === 6) {
          terrain = 'fort';
          label = 'Điện Thái Hòa / Kỳ Đài';
          effect = '+10% Hiệu suất toàn quân, trung tâm chỉ huy';
        } else {
          terrain = 'courtyard';
          label = 'Hành Lang Hoàng Gia';
        }
      }

      // Determine BattleZone
      const zone = r <= 2 ? 'enemy' : r === 3 ? 'neutral' : 'ally';

      hexes.push({
        col: c,
        row: r,
        terrain,
        zone,
        label,
        effect,
        control_point,
      });
    }
  }

  return hexes;
}

export const PHU_XUAN_HEXES: HexTile[] = buildPhuXuanHexes();

/**
 * Initial State of the 3 Strategic Control Points
 */
export const INITIAL_CONTROL_POINTS: ControlPointState[] = [
  {
    id: 'west_bridge',
    name: 'Tây Kiều',
    shortName: 'Tây Kiều',
    col: 3,
    row: 2,
    owner: 'neutral',
    progress: 50,
    contested: false,
  },
  {
    id: 'east_bridge',
    name: 'Đông Kiều',
    shortName: 'Đông Kiều',
    col: 8,
    row: 2,
    owner: 'neutral',
    progress: 50,
    contested: false,
  },
  {
    id: 'imperial_courtyard',
    name: 'Hoàng Thành',
    shortName: 'Hoàng Thành',
    col: 5,
    row: 5,
    owner: 'player',
    progress: 100,
    contested: false,
  },
];

/**
 * Historical Battle Units for the Phú Xuân Battlefield
 *
 * Player: Quân Tây Sơn / Nhà Nguyễn dưới quyền Quang Trung (Nguyễn Huệ)
 * Enemy: Đại quân xâm lấn / phản loạn phương Bắc
 */
export const PHU_XUAN_UNITS: BattleUnit[] = [
  // ── Allied Force (Nhà Nguyễn / Tây Sơn) ───────────────────────────────────
  {
    unit_id: 'qt_cmd',
    name: 'Quang Trung 👑',
    side: 'player',
    icon: 'commander',
    col: 5,
    row: 5,
    stats: { at: 200, atk: 46, def: 34, asTk: 18, atf: 30, reg: 15 },
    is_commander: true,
  },
  {
    unit_id: 'nq_spear1',
    name: 'Vệ Binh Tây Kiều',
    side: 'player',
    icon: 'spear',
    col: 3,
    row: 4,
    stats: { at: 140, atk: 34, def: 28, asTk: 12, atf: 20, reg: 10 },
  },
  {
    unit_id: 'nq_spear2',
    name: 'Vệ Binh Đông Kiều',
    side: 'player',
    icon: 'spear',
    col: 8,
    row: 4,
    stats: { at: 140, atk: 34, def: 28, asTk: 12, atf: 20, reg: 10 },
  },
  {
    unit_id: 'nq_archer1',
    name: 'Thần Nỏ Tháp Hữu',
    side: 'player',
    icon: 'archer',
    col: 2,
    row: 4,
    stats: { at: 115, atk: 40, def: 18, asTk: 14, atf: 42, reg: 8 },
  },
  {
    unit_id: 'nq_archer2',
    name: 'Thần Nỏ Tháp Tả',
    side: 'player',
    icon: 'archer',
    col: 9,
    row: 4,
    stats: { at: 115, atk: 40, def: 18, asTk: 14, atf: 42, reg: 8 },
  },
  {
    unit_id: 'nq_elephant',
    name: 'Thần Tượng Hoàng Gia',
    side: 'player',
    icon: 'elephant',
    col: 5,
    row: 4,
    stats: { at: 175, atk: 42, def: 32, asTk: 10, atf: 22, reg: 12 },
  },
  {
    unit_id: 'nq_cavalry',
    name: 'Thiết Kỵ Tốc Chiến',
    side: 'player',
    icon: 'cavalry',
    col: 6,
    row: 5,
    stats: { at: 135, atk: 38, def: 24, asTk: 16, atf: 24, reg: 8 },
  },

  // ── Enemy Force (Quân Đối Phương Phương Bắc) ──────────────────────────────
  {
    unit_id: 'en_cmd',
    name: 'Chủ Tướng Địch ⚔',
    side: 'enemy',
    icon: 'commander',
    col: 5,
    row: 0,
    stats: { at: 190, atk: 44, def: 30, asTk: 16, atf: 28, reg: 12 },
    is_commander: true,
  },
  {
    unit_id: 'en_inf1',
    name: 'Tiên Phong Tây Kiều',
    side: 'enemy',
    icon: 'spear',
    col: 3,
    row: 0,
    stats: { at: 135, atk: 32, def: 26, asTk: 12, atf: 18, reg: 8 },
  },
  {
    unit_id: 'en_inf2',
    name: 'Tiên Phong Đông Kiều',
    side: 'enemy',
    icon: 'spear',
    col: 8,
    row: 0,
    stats: { at: 135, atk: 32, def: 26, asTk: 12, atf: 18, reg: 8 },
  },
  {
    unit_id: 'en_inf3',
    name: 'Xung Kích Sông Hương',
    side: 'enemy',
    icon: 'spear',
    col: 6,
    row: 1,
    stats: { at: 130, atk: 30, def: 24, asTk: 12, atf: 16, reg: 8 },
  },
  {
    unit_id: 'en_arch1',
    name: 'Xạ Thủ Gò Tây',
    side: 'enemy',
    icon: 'archer',
    col: 1,
    row: 0,
    stats: { at: 110, atk: 38, def: 16, asTk: 14, atf: 38, reg: 6 },
  },
  {
    unit_id: 'en_arch2',
    name: 'Xạ Thủ Gò Đông',
    side: 'enemy',
    icon: 'archer',
    col: 10,
    row: 0,
    stats: { at: 110, atk: 38, def: 16, asTk: 14, atf: 38, reg: 6 },
  },
  {
    unit_id: 'en_cav1',
    name: 'Kỵ Binh Vượt Sông Hữu',
    side: 'enemy',
    icon: 'cavalry',
    col: 4,
    row: 1,
    stats: { at: 130, atk: 36, def: 22, asTk: 15, atf: 22, reg: 8 },
  },
  {
    unit_id: 'en_cav2',
    name: 'Kỵ Binh Vượt Sông Tả',
    side: 'enemy',
    icon: 'cavalry',
    col: 7,
    row: 1,
    stats: { at: 130, atk: 36, def: 22, asTk: 15, atf: 22, reg: 8 },
  },
];

/**
 * Tactical Advantage descriptions for the Lợi thế panel
 */
export const PHU_XUAN_ADVANTAGES = [
  {
    icon: '🌉',
    title: 'Tây Kiều',
    bonus: '+15% Tốc độ',
    desc: 'Kiểm soát nhịp độ tiến thoái vượt Sông Hương',
  },
  {
    icon: '🌉',
    title: 'Đông Kiều',
    bonus: '+15% Tầm đánh',
    desc: 'Cung thủ khống chế toàn bộ mặt sông phía Đông',
  },
  {
    icon: '🏯',
    title: 'Hoàng Thành',
    bonus: '+20% Tinh thần',
    desc: 'Bảo vệ vững vàng trái tim kinh đô Phú Xuân',
  },
  {
    icon: '🚪',
    title: 'Cổng Chính',
    bonus: '+20% Phòng thủ',
    desc: 'Cổng Ngọ Môn kiên cố chặn đứng mọi đợt công thành',
  },
  {
    icon: '👑',
    title: 'Mạng lưới kiểm soát',
    bonus: '+15% ATK / DEF',
    desc: 'Áp đảo hoàn toàn khi làm chủ cả 3 cứ điểm trọng yếu',
  },
];

