// ============================================================================
// PLAYER-CONTROLLED DEPLOYMENT CONFIG — VIỆT SỬ: LEGACY (off-chain)
// Mỗi chiến trường định nghĩa vùng triển khai riêng từ terrain + zone metadata.
// ============================================================================

import type { BattleUnit, HexTile, TerrainType } from '../types';
import { hexDistance } from '../utils/hexGrid';

export type BattlefieldId = 'bach_dang' | 'thang_long' | 'lam_son' | 'phu_xuan';

export const COMMAND_RADIUS = 2;
export const COMMAND_ATK_BONUS = 0.1;
export const COMMAND_DEF_BONUS = 0.1;
export const DEPLOY_PREP_SECONDS = 60;

/** Terrain không bao giờ được đặt quân (nước, cọc ngầm, vách núi). */
export const BLOCKED_DEPLOY_TERRAIN: TerrainType[] = ['river', 'stakes', 'mountain'];

export const DEPLOYMENT_ZONE_INFO: Record<BattlefieldId, { title: string; desc: string }> = {
  bach_dang: {
    title: 'Bờ sông Bạch Đằng',
    desc: 'Triển khai dọc bờ sông phía Tây — bãi cọc ngầm là tuyến phòng thủ tự nhiên.',
  },
  thang_long: {
    title: 'Phòng tuyến Thăng Long',
    desc: 'Triển khai trong thành — tường thành, cổng Đoan Môn và tháp canh là chốt chặn.',
  },
  lam_son: {
    title: 'Rừng núi Lam Sơn',
    desc: 'Triển khai trong rừng — tận dụng ô rừng rậm để ẩn mình phục kích.',
  },
  phu_xuan: {
    title: 'Hoàng thành Phú Xuân',
    desc: 'Triển khai quanh kinh thành — giữ cầu Tây/Đông Kiều và Sân Rồng.',
  },
};

export function isBlockedDeployTerrain(terrain: TerrainType): boolean {
  return BLOCKED_DEPLOY_TERRAIN.includes(terrain);
}

/** Ô hex có được phép đặt quân phe người chơi không? */
export function isDeployableHex(tile: HexTile | undefined): boolean {
  if (!tile) return false;
  if (tile.zone !== 'ally') return false;
  if (isBlockedDeployTerrain(tile.terrain)) return false;
  return true;
}

/** Tất cả ô hợp lệ của một chiến trường. */
export function getDeploymentHexes(hexes: HexTile[]): HexTile[] {
  return hexes.filter(isDeployableHex);
}

export type FormationPresetId = 'balanced' | 'defense' | 'attack' | 'archer';

export interface FormationPreset {
  id: FormationPresetId;
  label: string;
  icon: string;
}

export const FORMATION_PRESETS: FormationPreset[] = [
  { id: 'balanced', label: 'Cân bằng', icon: '⚖' },
  { id: 'defense', label: 'Phòng thủ', icon: '🛡' },
  { id: 'attack', label: 'Tấn công', icon: '⚔' },
  { id: 'archer', label: 'Cung thủ', icon: '🏹' },
];

/** Quân trong bán kính chỉ huy của tướng? */
export function unitsWithinCommandRadius(
  units: BattleUnit[],
  commander: BattleUnit | null | undefined,
  radius: number = COMMAND_RADIUS,
): BattleUnit[] {
  if (!commander) return [];
  const cc = { col: commander.col, row: commander.row };
  return units.filter(
    (u) =>
      u.unit_id !== commander.unit_id &&
      u.side === 'player' &&
      hexDistance({ col: u.col, row: u.row }, cc) <= radius,
  );
}

/** Áp aura tướng: +10% ATK / +10% DEF cho quân trong bán kính. */
export function applyCommanderAura(
  playerUnits: BattleUnit[],
  commander: BattleUnit | null | undefined,
): { units: BattleUnit[]; buffedIds: string[] } {
  if (!commander) return { units: playerUnits, buffedIds: [] };
  const buffedIds = unitsWithinCommandRadius(playerUnits, commander).map((u) => u.unit_id);
  const units = playerUnits.map((u) => {
    if (u.unit_id === commander.unit_id) return u;
    if (!buffedIds.includes(u.unit_id)) return u;
    return {
      ...u,
      stats: {
        ...u.stats,
        atk: Math.round(u.stats.atk * (1 + COMMAND_ATK_BONUS)),
        def: Math.round(u.stats.def * (1 + COMMAND_DEF_BONUS)),
      },
    };
  });
  return { units, buffedIds };
}

export interface FormationValidation {
  ok: boolean;
  errors: string[];
}

/** Kiểm tra đội hình trước khi khóa. */
export function validateFormation(
  playerUnits: BattleUnit[],
  hexes: HexTile[],
  requireCommander = true,
): FormationValidation {
  const errors: string[] = [];
  if (playerUnits.length < 1) errors.push('Bạn chưa triển khai bất kỳ đơn vị nào.');
  if (requireCommander && !playerUnits.find((u) => u.is_commander)) {
    errors.push('Bạn chưa triển khai tướng chỉ huy.');
  }
  const seen = new Set<string>();
  for (const u of playerUnits) {
    const key = `${u.col}-${u.row}`;
    if (seen.has(key)) errors.push(`Có 2 đơn vị đang ở cùng một vị trí (${u.col}, ${u.row}).`);
    seen.add(key);
    const tile = hexes.find((h) => h.col === u.col && h.row === u.row);
    const bad = !tile || !isDeployableHex(tile);
    if (bad) errors.push(`${u.name} đang ở vị trí không hợp lệ (${u.col}, ${u.row}).`);
  }
  return { ok: errors.length === 0, errors };
}

/** Sắp xếp preset: rải quân player vào các ô deployable (sửa tay sau đó). */
export function buildPresetFormation(
  playerUnits: BattleUnit[],
  hexes: HexTile[],
  preset: FormationPresetId,
): BattleUnit[] {
  const zone = getDeploymentHexes(hexes).sort((a, b) => a.col - b.col || a.row - b.row);
  if (zone.length === 0 || playerUnits.length === 0) return playerUnits;
  const ranged = (u: BattleUnit) => u.icon === 'archer';
  const melee = (u: BattleUnit) => u.icon === 'spear' || u.icon === 'elephant' || u.icon === 'cavalry';
  const commander = playerUnits.find((u) => u.is_commander);
  const others = playerUnits.filter((u) => !u.is_commander);
  let ordered: BattleUnit[] = [];
  if (preset === 'defense') {
    ordered = [...others.filter(melee), ...(commander ? [commander] : []), ...others.filter(ranged)];
  } else if (preset === 'attack') {
    ordered = [
      ...others.filter((u) => u.icon === 'cavalry' || u.icon === 'elephant'),
      ...others.filter((u) => u.icon === 'spear'),
      ...(commander ? [commander] : []),
      ...others.filter(ranged),
    ];
  } else if (preset === 'archer') {
    const m = others.filter(melee);
    const half = Math.ceil(m.length / 2);
    const cmd = commander ? [commander] : [];
    ordered = [...m.slice(0, half), ...cmd, ...others.filter(ranged), ...m.slice(half)];
  } else {
    ordered = [...others];
    if (commander) ordered.splice(Math.floor(ordered.length / 2), 0, commander);
  }
  const colsAsc = [...new Set(zone.map((h) => h.col))].sort((a, b) => a - b);
  const colOrder = preset === 'balanced' || preset === 'archer' ? colsAsc : [...colsAsc].reverse();
  const byCol = new Map<number, HexTile[]>();
  for (const h of zone) {
    const arr = byCol.get(h.col) ?? [];
    arr.push(h);
    byCol.set(h.col, arr);
  }
  for (const arr of byCol.values()) arr.sort((a, b) => a.row - b.row);
  const counts = [...byCol.values()].map((a) => a.length);
  const maxRows = counts.length > 0 ? Math.max(...counts) : 0;
  const slots: HexTile[] = [];
  for (let i = 0; i < maxRows; i++) {
    for (const c of colOrder) {
      const arr = byCol.get(c);
      if (arr && arr[i]) slots.push(arr[i]);
    }
  }
  const posById = new Map<string, HexTile>();
  ordered.forEach((u, i) => {
    if (slots[i]) posById.set(u.unit_id, slots[i]);
  });
  return playerUnits.map((u) => {
    const slot = posById.get(u.unit_id);
    return slot ? { ...u, col: slot.col, row: slot.row } : u;
  });
}

const formationStorageKey = (battlefieldId: BattlefieldId) => `viet-su-formation:${battlefieldId}`;

/** Lưu đội hình vào localStorage (off-chain hoàn toàn). */
export function saveFormationToStorage(battlefieldId: BattlefieldId, units: BattleUnit[]): void {
  try {
    const payload = units
      .filter((u) => u.side === 'player')
      .map((u) => ({ unit_id: u.unit_id, col: u.col, row: u.row }));
    localStorage.setItem(formationStorageKey(battlefieldId), JSON.stringify(payload));
  } catch {
    /* bỏ qua khi storage không khả dụng */
  }
}

/** Tải đội hình đã lưu; trả null khi không hợp lệ với map hiện tại. */
export function loadFormationFromStorage(
  battlefieldId: BattlefieldId,
  playerUnits: BattleUnit[],
  hexes: HexTile[],
): BattleUnit[] | null {
  try {
    const raw = localStorage.getItem(formationStorageKey(battlefieldId));
    if (!raw) return null;
    const saved = JSON.parse(raw) as { unit_id: string; col: number; row: number }[];
    if (!Array.isArray(saved) || saved.length === 0) return null;
    const byId = new Map(playerUnits.map((u) => [u.unit_id, u]));
    const next: BattleUnit[] = [];
    const used = new Set<string>();
    for (const s of saved) {
      const u = byId.get(s.unit_id);
      const tile = hexes.find((h) => h.col === s.col && h.row === s.row);
      if (!u || !tile || !isDeployableHex(tile)) continue;
      const key = `${s.col}-${s.row}`;
      if (used.has(key)) continue;
      used.add(key);
      next.push({ ...u, col: s.col, row: s.row });
    }
    if (next.length === 0) return null;
    const savedIds = new Set(next.map((u) => u.unit_id));
    for (const u of playerUnits) if (!savedIds.has(u.unit_id)) next.push(u);
    const v = validateFormation(next, hexes);
    return v.ok ? next : null;
  } catch {
    return null;
  }
}




