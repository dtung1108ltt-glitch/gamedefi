/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  HÀO KHÍ ĐẠI VIỆT — PREMIUM TOP BATTLE HUD
 * ═══════════════════════════════════════════════════════════════════════════
 *
 *  Cinematic 2.5D strategy game top banner inspired by Rise of Kingdoms / Total War,
 *  infused with Vietnamese medieval historical visual identity (Bạch Đằng 1288).
 *
 *  LAYOUT:
 *  - Left:   Đại Việt emblem, faction title, HP bar + numbers, army unit roster icons
 *  - Center: ⚔ VS ⚔ banner with gold borders, "BẠCH ĐẰNG 1288", tide & turn indicator
 *  - Right:  Quân Nguyên emblem, faction title, HP bar + numbers, army unit roster icons
 *
 *  Guaranteed:
 *  - Compact height (~15-18% of viewport)
 *  - Dark translucent glassmorphism with gold accents
 *  - Never obscures the central hex battlefield
 * ═══════════════════════════════════════════════════════════════════════════
 */

import React from 'react';
import { BattleUnit, Faction } from '../../../types';
import { FactionBadge } from '../../FactionCard/FactionBadge';
import { ArrowLeft, Waves, Swords, Shield, Crown } from 'lucide-react';

interface BattleTopHUDProps {
  battlefieldId?: string;
  faction: Faction;
  units: BattleUnit[];
  turnSide: 'player' | 'enemy';
  tideTurnsLeft: number;
  onExitBattle: () => void;
  playerHpPercent: number;
  enemyHpPercent: number;
  playerPower: number;
  maxPlayerPower: number;
  enemyPower: number;
  maxEnemyPower: number;
  selectedUnitId: string | null;
  onSelectUnit: (unitId: string) => void;
}

export const BattleTopHUD: React.FC<BattleTopHUDProps> = ({
  battlefieldId,
  faction,
  units,
  turnSide,
  tideTurnsLeft,
  onExitBattle,
  playerHpPercent,
  enemyHpPercent,
  playerPower,
  maxPlayerPower,
  enemyPower,
  maxEnemyPower,
  selectedUnitId,
  onSelectUnit,
}) => {
  const isPhuXuan = battlefieldId === 'phu_xuan' || battlefieldId === 'phu-xuan';
  const isLamSon = battlefieldId === 'lam_son' || battlefieldId === 'lam-son';
  const isThangLong = battlefieldId === 'thang_long' || battlefieldId === 'thang-long';
  const playerFactionTitle = isPhuXuan ? 'TÂY SƠN' : isLamSon ? 'LAM SƠN' : isThangLong ? 'NHÀ LÝ' : (faction?.name || 'ĐẠI VIỆT');
  const enemyFactionTitle = isPhuXuan ? 'QUÂN NGUYỄN' : isLamSon ? 'MINH QUÂN' : isThangLong ? 'ĐỐI PHƯƠNG' : 'QUÂN NGUYÊN';
  const battlefieldTitle = isPhuXuan ? 'PHÚ XUÂN' : isLamSon ? 'KHỞI NGHĨA LAM SƠN' : isThangLong ? 'THĂNG LONG' : 'BẠCH ĐẰNG 1288';
  const battlefieldSubtitle = isPhuXuan ? 'Kinh đô Phú Xuân' : isLamSon ? 'Lam Sơn (1418 - 1427)' : isThangLong ? 'Kinh đô Nhà Lý' : 'VIỆT SỬ: LEGACY';

  const playerUnits = units.filter((u) => u.side === 'player');
  const enemyUnits = units.filter((u) => u.side === 'enemy');

  const getUnitIconGlyph = (icon: string) => {
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
    <header className="absolute top-0 left-0 right-0 z-40 px-3 py-2.5 md:px-6 md:py-3 pointer-events-none select-none">
      <div className="max-w-7xl mx-auto flex items-start justify-between gap-2 md:gap-4">
        
        {/* ════════════════════════════════════════════════════════════════ */}
        {/* LEFT: ĐẠI VIỆT FACTION CARD                                      */}
        {/* ════════════════════════════════════════════════════════════════ */}
        <div className="pointer-events-auto flex flex-col items-start gap-1.5 w-[clamp(210px,25vw,310px)] shrink-0">
          <div className="w-full bg-gradient-to-r from-[#091a26]/95 via-[#0c1822]/90 to-[#070e14]/80 border border-[#c9a44c]/70 rounded-2xl p-2 md:p-2.5 backdrop-blur-md shadow-[0_4px_24px_rgba(0,0,0,0.6),0_0_12px_rgba(14,165,233,0.15)] transition-all">
            <div className="flex items-center gap-2.5">
              {/* Dragon Emblem Badge */}
              <div className="relative shrink-0">
                <FactionBadge
                  faction={faction}
                  className="w-10 h-10 md:w-12 md:h-12 rounded-full border-2 border-[#f59e0b] shadow-[0_0_12px_rgba(245,158,11,0.35)]"
                />
                <div className="absolute -bottom-1 -right-1 bg-blue-900 border border-blue-400 rounded-full px-1 py-0.2 text-[8px] font-bold text-cyan-200 uppercase">
                  Ta
                </div>
              </div>

              {/* Faction Name & HP Bar */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1 leading-none mb-1">
                  <span className="text-[#f59e0b] font-serif font-black text-xs md:text-sm tracking-wider uppercase truncate drop-shadow">
                    {playerFactionTitle}
                  </span>
                  <span className="text-[10px] md:text-xs font-mono font-bold text-cyan-300 shrink-0">
                    {playerPower.toLocaleString()} / {maxPlayerPower.toLocaleString()}
                  </span>
                </div>

                {/* HP Progress Bar */}
                <div className="w-full h-2 md:h-2.5 bg-black/80 rounded-full overflow-hidden border border-cyan-800/60 p-[1px] shadow-inner">
                  <div
                    className="h-full bg-gradient-to-r from-cyan-600 via-blue-500 to-teal-400 rounded-full transition-all duration-300 shadow-[0_0_8px_rgba(6,182,212,0.5)]"
                    style={{ width: `${playerHpPercent}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Army Unit Icons Roster */}
            <div className="flex items-center gap-1.5 mt-2 pt-1.5 border-t border-[#c9a44c]/20 overflow-x-auto">
              {playerUnits.map((u) => {
                const isAlive = u.stats.at > 0;
                const isSelected = u.unit_id === selectedUnitId;
                const hpRatio = Math.max(0, u.stats.at / (u.is_commander ? 180 : 130));

                return (
                  <button
                    key={u.unit_id}
                    onClick={() => onSelectUnit(u.unit_id)}
                    title={`${u.name} (HP: ${u.stats.at})`}
                    className={`relative w-7 h-7 md:w-8 md:h-8 rounded-lg flex items-center justify-center text-xs transition-all ${
                      isSelected
                        ? 'bg-blue-800/90 border-2 border-[#f59e0b] scale-110 shadow-[0_0_8px_rgba(245,158,11,0.5)]'
                        : isAlive
                        ? 'bg-blue-950/70 border border-blue-500/40 hover:border-cyan-400 hover:bg-blue-900/60'
                        : 'bg-black/60 border border-slate-800 opacity-40 grayscale'
                    }`}
                  >
                    <span>{getUnitIconGlyph(u.icon)}</span>
                    {/* Tiny Health Dot */}
                    {isAlive && (
                      <span
                        className={`absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border border-black ${
                          hpRatio > 0.5 ? 'bg-emerald-400' : hpRatio > 0.25 ? 'bg-amber-400' : 'bg-red-500 animate-pulse'
                        }`}
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Retreat button */}
          <button
            onClick={onExitBattle}
            className="flex items-center gap-1.5 bg-[#0a151e]/85 hover:bg-[#122838] border border-[#c9a44c]/50 hover:border-[#f59e0b] px-3 py-1 rounded-full text-[10px] text-[#f3e5ab] font-serif font-bold uppercase tracking-widest transition-all backdrop-blur-md shadow-md hover:scale-105 active:scale-95"
          >
            <ArrowLeft className="w-3 h-3 text-[#f59e0b]" /> Rút lui
          </button>
        </div>

        {/* ════════════════════════════════════════════════════════════════ */}
        {/* CENTER: BATTLEFIELD STRATEGY BANNER                              */}
        {/* ════════════════════════════════════════════════════════════════ */}
        <div className="pointer-events-auto flex flex-col items-center">
          <div className="relative bg-gradient-to-b from-[#18110b]/95 via-[#120a05]/95 to-black/90 border-b-2 border-x border-[#c9a44c] rounded-b-2xl px-5 py-2 md:px-8 md:py-2.5 shadow-[0_6px_28px_rgba(0,0,0,0.8),0_0_15px_rgba(201,164,76,0.25)] backdrop-blur-md text-center">
            {/* Corner gold ornaments */}
            <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-[#f59e0b] -mt-[1px] -ml-[1px]" />
            <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-[#f59e0b] -mt-[1px] -mr-[1px]" />

            {/* Title Lockup */}
            <div className="flex flex-col items-center justify-center mb-0.5">
              <div className="text-[9px] md:text-[10px] uppercase font-serif font-bold tracking-[0.25em] text-amber-300/80 drop-shadow">
                {battlefieldSubtitle}
              </div>
              <div className="flex items-center justify-center gap-2">
                <span className="text-[#f59e0b] text-xs md:text-sm">⚔</span>
                <h1 className="text-transparent bg-clip-text bg-gradient-to-b from-[#fff3cc] via-[#f59e0b] to-[#92400e] font-serif font-black text-sm md:text-base lg:text-lg uppercase tracking-[0.18em] drop-shadow-[0_2px_6px_rgba(0,0,0,0.9)]">
                  {battlefieldTitle}
                </h1>
                <span className="text-[#f59e0b] text-xs md:text-sm">⚔</span>
              </div>
            </div>

            {/* Turn status indicator */}
            <div className="flex items-center justify-center gap-1.5 text-[10px] md:text-xs font-bold tracking-wide">
              {turnSide === 'player' ? (
                <span className="text-emerald-400 drop-shadow flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  {isPhuXuan ? 'Quang Trung thần tốc xuất kích' : isLamSon ? 'Quân Lam Sơn đang phục kích' : isThangLong ? 'Quân ta đang trấn thủ' : 'Quân ta đang hành động'}
                </span>
              ) : (
                <span className="text-red-400 drop-shadow flex items-center gap-1 animate-pulse">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                  {isPhuXuan ? 'Quân địch đang dồn lực phòng thủ...' : isLamSon ? 'Minh quân đang lọt vào ổ mai phục...' : isThangLong ? 'Quân địch đang công thành...' : 'Quân Nguyên đang điều binh...'}
                </span>
              )}
            </div>

            {/* Tactical Status Badge */}
            {isPhuXuan ? (
              <div className="mt-1.5 inline-flex items-center gap-1.5 bg-[#1f1709]/90 border border-[#d97706]/70 px-2.5 py-0.5 rounded-full shadow-inner">
                <Crown className="w-3 h-3 text-amber-400" />
                <span className="text-[9px] md:text-[10px] font-bold text-amber-200 uppercase tracking-wider">
                  Mạng Lưới Kiểm Soát — Tranh Chấp 2/3 Cứ Điểm Trọng Yếu
                </span>
              </div>
            ) : isLamSon ? (
              <div className="mt-1.5 inline-flex items-center gap-1.5 bg-[#092418]/90 border border-[#059669]/60 px-2.5 py-0.5 rounded-full shadow-inner">
                <span className="text-xs">🌲</span>
                <span className="text-[9px] md:text-[10px] font-bold text-emerald-300 uppercase tracking-wider">
                  Địa Thế Rừng Sâu — Đòn Phục Kích (+30% ST đầu)
                </span>
              </div>
            ) : isThangLong ? (
              <div className="mt-1.5 inline-flex items-center gap-1.5 bg-[#25190e]/90 border border-[#b45309] px-2.5 py-0.5 rounded-full shadow-inner">
                <Shield className="w-3 h-3 text-amber-400" />
                <span className="text-[9px] md:text-[10px] font-bold text-amber-200 uppercase tracking-wider">
                  Phòng Tuyến Hoàng Thành (Tử Thủ Đoan Môn)
                </span>
              </div>
            ) : (
              <div className="mt-1.5 inline-flex items-center gap-1.5 bg-[#091f2c]/90 border border-[#1b5d6d] px-2.5 py-0.5 rounded-full shadow-inner">
                <Waves className={`w-3 h-3 ${tideTurnsLeft <= 1 ? 'text-amber-300' : 'text-cyan-400'}`} />
                <span className="text-[9px] md:text-[10px] font-bold text-cyan-200 uppercase tracking-wider">
                  {tideTurnsLeft <= 1 ? 'Thủy triều rút cạn (Lộ bãi cọc!)' : `Thủy triều đang rút (còn ${tideTurnsLeft} lượt)`}
                </span>
                <div className="flex gap-0.5 ml-0.5">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className={`w-1.5 h-1.5 rounded-full ${
                        i <= tideTurnsLeft ? 'bg-cyan-400 shadow-[0_0_4px_rgba(6,182,212,0.8)]' : 'bg-slate-700'
                      }`}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ════════════════════════════════════════════════════════════════ */}
        {/* RIGHT: ENEMY FACTION CARD                                        */}
        {/* ════════════════════════════════════════════════════════════════ */}
        <div className="pointer-events-auto flex flex-col items-end gap-1.5 w-[clamp(210px,25vw,310px)] shrink-0">
          <div className="w-full bg-gradient-to-l from-[#250a0a]/95 via-[#1a0808]/90 to-[#0e0404]/80 border border-[#b91c1c]/70 rounded-2xl p-2 md:p-2.5 backdrop-blur-md shadow-[0_4px_24px_rgba(0,0,0,0.6),0_0_12px_rgba(239,68,68,0.15)] transition-all">
            <div className="flex items-center justify-end gap-2.5">
              {/* Faction Name & HP Bar */}
              <div className="flex-1 min-w-0 text-right">
                <div className="flex items-center justify-between gap-1 leading-none mb-1">
                  <span className="text-[10px] md:text-xs font-mono font-bold text-red-300 shrink-0">
                    {enemyPower.toLocaleString()} / {maxEnemyPower.toLocaleString()}
                  </span>
                  <span className="text-red-400 font-serif font-black text-xs md:text-sm tracking-wider uppercase truncate drop-shadow">
                    {enemyFactionTitle}
                  </span>
                </div>

                {/* HP Progress Bar */}
                <div className="w-full h-2 md:h-2.5 bg-black/80 rounded-full overflow-hidden border border-red-900/60 p-[1px] shadow-inner flex justify-end">
                  <div
                    className="h-full bg-gradient-to-l from-red-600 via-rose-500 to-amber-500 rounded-full transition-all duration-300 shadow-[0_0_8px_rgba(239,68,68,0.5)]"
                    style={{ width: `${enemyHpPercent}%` }}
                  />
                </div>
              </div>

              {/* Mongol Emblem Badge */}
              <div className="relative shrink-0">
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-full border-2 border-red-600 bg-gradient-to-br from-red-950 via-[#1f0b0b] to-black flex items-center justify-center shadow-[0_0_12px_rgba(239,68,68,0.4)]">
                  <Swords className="w-5 h-5 md:w-6 md:h-6 text-red-300" />
                </div>
                <div className="absolute -bottom-1 -left-1 bg-red-950 border border-red-600 rounded-full px-1 py-0.2 text-[8px] font-bold text-red-200 uppercase">
                  Địch
                </div>
              </div>
            </div>

            {/* Enemy Unit Icons Roster */}
            <div className="flex items-center justify-end gap-1.5 mt-2 pt-1.5 border-t border-red-800/30 overflow-x-auto">
              {enemyUnits.map((u) => {
                const isAlive = u.stats.at > 0;
                const isSelected = u.unit_id === selectedUnitId;
                const hpRatio = Math.max(0, u.stats.at / (u.is_commander ? 180 : 130));

                return (
                  <button
                    key={u.unit_id}
                    onClick={() => onSelectUnit(u.unit_id)}
                    title={`${u.name} (HP: ${u.stats.at})`}
                    className={`relative w-7 h-7 md:w-8 md:h-8 rounded-lg flex items-center justify-center text-xs transition-all ${
                      isSelected
                        ? 'bg-red-900/90 border-2 border-red-400 scale-110 shadow-[0_0_8px_rgba(239,68,68,0.5)]'
                        : isAlive
                        ? 'bg-red-950/70 border border-red-700/40 hover:border-red-400 hover:bg-red-900/60'
                        : 'bg-black/60 border border-slate-800 opacity-40 grayscale'
                    }`}
                  >
                    <span>{getUnitIconGlyph(u.icon)}</span>
                    {/* Health indicator dot */}
                    {isAlive && (
                      <span
                        className={`absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border border-black ${
                          hpRatio > 0.5 ? 'bg-red-500' : hpRatio > 0.25 ? 'bg-amber-400' : 'bg-rose-400 animate-pulse'
                        }`}
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

      </div>
    </header>
  );
};
