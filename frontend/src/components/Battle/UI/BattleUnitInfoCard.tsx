/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  HÀO KHÍ ĐẠI VIỆT — RIGHT-SIDE COMPACT INFORMATION PANEL (THÔNG TIN)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 *  Semi-transparent dark glass card appearing on the RIGHT SIDE of the screen
 *  when a unit or hex tile is selected.
 *
 *  FEATURES:
 *  - Unit Portrait / Icon with side badge (Đại Việt vs Mông Nguyên)
 *  - Unit Name & Role (e.g. "Trần Hưng Đạo 👑", "Chủ Tướng Chỉ Huy")
 *  - Key Combat Stats (HP, ATK, DEF, LĐ/Speed)
 *  - Hex Tile Terrain & Tactical Effect (e.g. Gò Cao, Bãi Cọc Ngầm)
 *  - Smooth slide-in/slide-out animation, close button, non-blocking
 * ═══════════════════════════════════════════════════════════════════════════
 */

import React from 'react';
import { BattleUnit, HexTile, TerrainType } from '../../../types';
import { MousePointer2, X, Shield, Swords, Heart, Zap, MapPin } from 'lucide-react';

interface BattleUnitInfoCardProps {
  unit: BattleUnit | null;
  tile?: HexTile;
  onClose?: () => void;
  extraLines?: string[];
}

const TERRAIN_NAME_VI: Record<TerrainType, string> = {
  plain: 'Đồng Bằng / Bãi Trống',
  hill: 'Gò Đất Cao',
  forest: 'Rừng Ngập Mặn / Cây Rậm',
  dense_forest: 'Rừng Rậm Khởi Nghĩa',
  narrow_path: 'Đường Hẹp / Khe Núi',
  mountain: 'Đỉnh Núi Hiểm Trở',
  supply_camp: 'Kho Lương Tiền Tiêu (Minh)',
  mud: 'Bãi Bùn Lầy',
  river: 'Sông Nước / Hào Thành',
  stakes: 'Bãi Cọc Ngầm',
  fort: 'Tháp Canh / Công Sự',
  wall: 'Tường Thành Gạch Đá',
  gate: 'Cổng Thành Đoan Môn',
  courtyard: 'Sân Rồng Hoàng Thành',
  road: 'Ngự Đạo Hoàng Gia',
  garden: 'Ngự Uyển Hoàng Gia',
  bridge: 'Cầu Vượt Sông Hương',
  riverbank: 'Bờ Sông Hương',
};

export const BattleUnitInfoCard: React.FC<BattleUnitInfoCardProps> = ({
  unit,
  tile,
  onClose,
  extraLines,
}) => {
  if (!unit && !tile) return null;

  const isPlayer = unit?.side === 'player';
  const maxHp = unit ? (unit.is_commander ? 180 : 130) : 100;
  const currentHp = unit ? unit.stats.at : 0;
  const hpPercent = Math.max(0, Math.min(100, Math.round((currentHp / maxHp) * 100)));

  const getUnitIconGlyph = (icon?: string) => {
    switch (icon) {
      case 'commander': return '👑';
      case 'spear':     return '⚔';
      case 'archer':    return '🏹';
      case 'elephant':  return '🐘';
      case 'cavalry':   return '🐎';
      default:          return '⚔';
    }
  };

  return (
    <aside
      aria-label="Thông tin đơn vị và địa hình"
      className="absolute top-16 md:top-20 right-4 z-40 w-52 md:w-60 bg-gradient-to-br from-[#0c1822]/95 via-[#09121a]/95 to-black/95 border border-[#c9a44c]/60 rounded-xl overflow-hidden shadow-[0_6px_24px_rgba(0,0,0,0.8),0_0_12px_rgba(201,164,76,0.15)] backdrop-blur-md animate-in fade-in slide-in-from-right-2 duration-150 select-none pointer-events-auto"
    >
      {/* Header with Title and Close Button */}
      <div className="bg-gradient-to-r from-[#172633] via-[#101b24] to-[#0b131a] px-2.5 py-1.5 border-b border-[#c9a44c]/30 flex items-center justify-between">
        <div className="flex items-center gap-1">
          <MousePointer2 className="w-3 h-3 text-[#f59e0b]" />
          <span className="text-[10px] font-serif font-black uppercase tracking-wider text-[#f3e5ab]">
            THÔNG TIN
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          {unit && (
            <span
              className={`text-[8px] px-1.5 py-0.5 rounded-full font-mono font-bold uppercase tracking-wider border ${
                isPlayer
                  ? 'text-cyan-300 bg-blue-950/80 border-blue-500/60'
                  : 'text-rose-300 bg-red-950/80 border-red-500/60'
              }`}
            >
              {isPlayer ? 'Phe Ta' : 'Địch'}
            </span>
          )}

          {onClose && (
            <button
              onClick={onClose}
              className="p-0.5 rounded-full text-slate-400 hover:text-white hover:bg-black/40 transition-colors"
              title="Đóng bảng thông tin"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* Unit Profile & Stats */}
      {unit ? (
        <div className="p-2.5">
          {/* Unit Portrait & Identity */}
          <div className="flex items-center gap-2.5 mb-2">
            <div
              className={`w-9 h-9 rounded-lg flex items-center justify-center text-lg border shrink-0 shadow-md ${
                isPlayer
                  ? 'border-cyan-500/60 bg-gradient-to-br from-blue-900/60 to-cyan-950/80'
                  : 'border-red-500/60 bg-gradient-to-br from-red-900/60 to-rose-950/80'
              }`}
            >
              {getUnitIconGlyph(unit.icon)}
            </div>

            <div className="flex-1 min-w-0">
              <div className="font-serif font-bold text-white text-xs leading-tight flex items-center gap-1 truncate">
                {unit.name}
              </div>
              <div className="text-[9px] text-slate-400 truncate">
                {unit.is_commander ? 'Thống Soái' : 'Binh chủng'}
              </div>
              {/* HP Bar */}
              <div className="w-full h-1 bg-black/70 rounded-full overflow-hidden border border-slate-700/60 mt-1">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    isPlayer
                      ? 'bg-gradient-to-r from-cyan-500 to-emerald-400'
                      : 'bg-gradient-to-r from-red-600 to-rose-400'
                  }`}
                  style={{ width: `${hpPercent}%` }}
                />
              </div>

              {/* Guerrilla Stealth Tag */}
              {unit.is_hidden && (
                <div className="mt-1 text-[8px] font-bold text-emerald-300 bg-emerald-950/80 border border-emerald-500/50 rounded px-1.5 py-0.5 inline-flex items-center gap-1 shadow-sm">
                  <span>🌲</span> Ẩn mình (+30% ST đầu)
                </div>
              )}
              {extraLines && extraLines.length > 0 && (
                <div className="mt-1 space-y-0.5">
                  {extraLines.map((line) => (
                    <div key={line} className="text-[8px] font-bold text-amber-200 bg-amber-950/40 border border-amber-700/40 rounded px-1.5 py-0.5">
                      {line}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* 4-Stat Grid */}
          <div className="grid grid-cols-2 gap-1 text-[9px]">
            <div className="bg-black/50 rounded-lg px-2.5 py-1.5 flex items-center justify-between border border-[#1b3544]/50">
              <span className="text-slate-400 flex items-center gap-1">
                <Heart className="w-3 h-3 text-emerald-400" /> HP
              </span>
              <span className="text-emerald-400 font-bold font-mono">
                {unit.stats.at} <span className="text-slate-500 text-[8px]">/{maxHp}</span>
              </span>
            </div>

            <div className="bg-black/50 rounded-lg px-2.5 py-1.5 flex items-center justify-between border border-[#1b3544]/50">
              <span className="text-slate-400 flex items-center gap-1">
                <Swords className="w-3 h-3 text-red-400" /> ATK
              </span>
              <span className="text-red-400 font-bold font-mono">
                {unit.stats.atk}
              </span>
            </div>

            <div className="bg-black/50 rounded-lg px-2.5 py-1.5 flex items-center justify-between border border-[#1b3544]/50">
              <span className="text-slate-400 flex items-center gap-1">
                <Shield className="w-3 h-3 text-blue-400" /> DEF
              </span>
              <span className="text-blue-400 font-bold font-mono">
                {unit.stats.def}
              </span>
            </div>

            <div className="bg-black/50 rounded-lg px-2.5 py-1.5 flex items-center justify-between border border-[#1b3544]/50">
              <span className="text-slate-400 flex items-center gap-1">
                <Zap className="w-3 h-3 text-amber-400" /> LĐ
              </span>
              <span className="text-amber-400 font-bold font-mono">
                {unit.stats.asTk}
              </span>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-3 text-xs text-slate-500 text-center italic">
          Chọn một đơn vị trên chiến trường
        </div>
      )}

      {/* Hex Tile Terrain & Effect */}
      {tile && (
        <div className="bg-black/60 px-3 py-2 border-t border-[#c9a44c]/30 text-[10px]">
          <div className="flex items-center justify-between text-slate-300">
            <span className="flex items-center gap-1 text-slate-400">
              <MapPin className="w-3 h-3 text-[#f59e0b]" /> Ô ({tile.col}, {tile.row}):
            </span>
            <span className="text-white font-serif font-bold">
              {TERRAIN_NAME_VI[tile.terrain]}
            </span>
          </div>

          {tile.effect && (
            <div className="text-[9px] text-[#f59e0b] mt-1 leading-snug bg-amber-950/30 border border-amber-800/40 rounded px-1.5 py-0.5">
              {tile.effect}
            </div>
          )}
        </div>
      )}
    </aside>
  );
};
