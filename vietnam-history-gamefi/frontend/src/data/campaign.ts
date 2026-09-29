import { BattleUnit, CampaignChapter, HexTile, MapLocation } from '../types';

// ---------------------------------------------------------------------------
// Chương chiến dịch — ăn khớp 1-1 với 5 triều đại / faction_id trong useFaction
// ---------------------------------------------------------------------------
export const CAMPAIGN_CHAPTERS: CampaignChapter[] = [
  { chapter_id: 1, faction_id: 1, code: 'nha_ly', title_vi: 'Nhà Lý', title_en: '1009-1225', era: '1009-1225', status: 'available' },
  { chapter_id: 2, faction_id: 2, code: 'nha_tran', title_vi: 'Nhà Trần', title_en: '1225-1400', era: '1225-1400', status: 'active' },
  { chapter_id: 3, faction_id: 3, code: 'nha_le', title_vi: 'Nhà Lê', title_en: '1428-1789', era: '1423-1789', status: 'available' },
  { chapter_id: 4, faction_id: 4, code: 'tay_son', title_vi: 'Tây Sơn', title_en: '1778-1802', era: '1778-1802', status: 'locked' },
  { chapter_id: 5, faction_id: 5, code: 'nha_nguyen', title_vi: 'Nhà Nguyễn', title_en: '1802-1945', era: '1802-1945', status: 'locked' },
];

// Vị trí các trọng điểm trên bản đồ chiến dịch (toạ độ % trong khung bản đồ)
export const MAP_LOCATIONS: MapLocation[] = [
  {
    location_id: 'thang_long',
    chapter_id: 1,
    name: 'Thăng Long',
    sub_label: 'Kinh đô Nhà Lý',
    flag_glyph: '李',
    x: 44,
    y: 34,
    is_capital: true,
  },
  {
    location_id: 'bach_dang',
    chapter_id: 2,
    name: 'Bạch Đằng',
    sub_label: 'Nhà Trần',
    flag_glyph: '陳',
    x: 61,
    y: 24,
    is_target: true,
    tooltip: 'Điểm chiến lược',
  },
  {
    location_id: 'lam_son',
    chapter_id: 3,
    name: 'Lam Sơn',
    sub_label: 'Nhà Lê',
    flag_glyph: '黎',
    x: 49,
    y: 59,
  },
  {
    location_id: 'phu_xuan',
    chapter_id: 5,
    name: 'Phú Xuân',
    sub_label: 'Nhà Nguyễn',
    flag_glyph: '阮',
    x: 70,
    y: 76,
  },
];

// ---------------------------------------------------------------------------
// Trận Bạch Đằng — bàn cờ hex chiến thuật (12 cột x 7 hàng)
// ---------------------------------------------------------------------------
const COLS = 12;
const ROWS = 7;

function buildBachDangHexes(): HexTile[] {
  const tiles: HexTile[] = [];

  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      let terrain: HexTile['terrain'] = 'plain';
      let zone: HexTile['zone'] = 'neutral';
      let label: string | undefined;
      let effect: string | undefined;

      if (col === 0 && row === 3) {
        // Căn cứ doanh trại Đại Việt
        zone = 'ally';
        terrain = 'fort';
        label = 'Doanh trại Đại Việt';
        effect = 'Hậu cứ & Tổng hành dinh';
      } else if (col === 11 && row === 3) {
        // Căn cứ doanh trại Mông Nguyên
        zone = 'enemy';
        terrain = 'fort';
        label = 'Doanh trại Nguyên Triều';
        effect = 'Hậu cứ & Đại Hãn trướng';
      } else if (col <= 2) {
        // Hậu quân & cánh quân Đại Việt
        zone = 'ally';
        terrain = (col === 1 && (row === 0 || row === 6)) ? 'forest' : (col === 2 && row === 0 ? 'hill' : 'plain');
      } else if (col === 3 || col === 4) {
        // Tiền duyên quân Đại Việt
        zone = 'ally';
        terrain = 'plain';
      } else if (col === 5 || col === 6) {
        // Chiến tuyến trung tâm — Sông Bạch Đằng & bãi cọc ngầm
        zone = 'neutral';
        if ((col === 5 && row === 2) || (col === 6 && row === 4)) {
          terrain = 'stakes';
          label = 'Bãi cọc ngầm';
          effect = 'Sát thương & cản trở thuyền chiến';
        } else if (col === 6 && row === 6) {
          terrain = 'forest';
          label = 'Rừng ngập mặn';
          effect = 'Ẩn nấp phục kích';
        } else if (row === 1 || row === 3 || row === 5) {
          terrain = 'river';
          label = 'Dòng sông Bạch Đằng';
        } else {
          terrain = 'mud';
          label = 'Bãi lầy phù sa';
          effect = 'Giảm tốc độ di chuyển';
        }
      } else if (col === 7 || col === 8) {
        // Tiền duyên quân Mông Nguyên
        zone = 'enemy';
        terrain = 'plain';
      } else {
        // Hậu quân & cánh quân Mông Nguyên
        zone = 'enemy';
        terrain = (col === 10 && (row === 0 || row === 6)) ? 'forest' : (col === 9 && row === 6 ? 'hill' : 'plain');
      }

      tiles.push({ col, row, terrain, zone, label, effect });
    }
  }

  return tiles;
}

export const BACH_DANG_HEXES: HexTile[] = buildBachDangHexes();

export const BACH_DANG_UNITS: BattleUnit[] = [
  // ==========================================
  // QUÂN ĐỘI ĐẠI VIỆT (ALLIED ARMY - 6 UNITS)
  // ==========================================
  {
    unit_id: 'p_cmd',
    name: 'Trần Hưng Đạo',
    side: 'player',
    icon: 'commander',
    is_commander: true,
    col: 1,
    row: 3,
    stats: { at: 180, atk: 50, def: 46, asTk: 14, atf: 35, reg: 30 },
  },
  {
    unit_id: 'p1',
    name: 'Thương binh Đại Việt I',
    side: 'player',
    icon: 'spear',
    col: 3,
    row: 2,
    stats: { at: 130, atk: 38, def: 38, asTk: 12, atf: 30, reg: 20 },
  },
  {
    unit_id: 'p2',
    name: 'Tượng binh Tiên phong',
    side: 'player',
    icon: 'elephant',
    col: 3,
    row: 3,
    stats: { at: 160, atk: 52, def: 48, asTk: 8, atf: 25, reg: 22 },
  },
  {
    unit_id: 'p3',
    name: 'Thương binh Đại Việt II',
    side: 'player',
    icon: 'spear',
    col: 3,
    row: 4,
    stats: { at: 130, atk: 38, def: 38, asTk: 12, atf: 30, reg: 20 },
  },
  {
    unit_id: 'p4',
    name: 'Xạ thủ Bạch Đằng I',
    side: 'player',
    icon: 'archer',
    col: 2,
    row: 1,
    stats: { at: 110, atk: 42, def: 24, asTk: 16, atf: 45, reg: 15 },
  },
  {
    unit_id: 'p5',
    name: 'Xạ thủ Bạch Đằng II',
    side: 'player',
    icon: 'archer',
    col: 2,
    row: 5,
    stats: { at: 110, atk: 42, def: 24, asTk: 16, atf: 45, reg: 15 },
  },

  // ==========================================
  // QUÂN ĐỘI MÔNG NGUYÊN (ENEMY ARMY - 6 UNITS)
  // ==========================================
  {
    unit_id: 'e_cmd',
    name: 'Ô Mã Nhi',
    side: 'enemy',
    icon: 'commander',
    is_commander: true,
    col: 10,
    row: 3,
    stats: { at: 180, atk: 50, def: 46, asTk: 14, atf: 35, reg: 30 },
  },
  {
    unit_id: 'e1',
    name: 'Thiết giáp Nguyên I',
    side: 'enemy',
    icon: 'spear',
    col: 8,
    row: 2,
    stats: { at: 130, atk: 38, def: 38, asTk: 12, atf: 30, reg: 20 },
  },
  {
    unit_id: 'e2',
    name: 'Thiết Kỵ Tiên phong',
    side: 'enemy',
    icon: 'cavalry',
    col: 8,
    row: 3,
    stats: { at: 160, atk: 52, def: 48, asTk: 14, atf: 28, reg: 22 },
  },
  {
    unit_id: 'e3',
    name: 'Thiết giáp Nguyên II',
    side: 'enemy',
    icon: 'spear',
    col: 8,
    row: 4,
    stats: { at: 130, atk: 38, def: 38, asTk: 12, atf: 30, reg: 20 },
  },
  {
    unit_id: 'e4',
    name: 'Thần Tiễn Nguyên I',
    side: 'enemy',
    icon: 'archer',
    col: 9,
    row: 1,
    stats: { at: 110, atk: 42, def: 24, asTk: 16, atf: 45, reg: 15 },
  },
  {
    unit_id: 'e5',
    name: 'Thần Tiễn Nguyên II',
    side: 'enemy',
    icon: 'archer',
    col: 9,
    row: 5,
    stats: { at: 110, atk: 42, def: 24, asTk: 16, atf: 45, reg: 15 },
  },
];

export const BATTLEFIELD_DIMS = { cols: COLS, rows: ROWS };
