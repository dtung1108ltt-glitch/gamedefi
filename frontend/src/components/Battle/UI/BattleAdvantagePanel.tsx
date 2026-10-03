/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  HÀO KHÍ ĐẠI VIỆT — BOTTOM-LEFT "LỢI THẾ" (TACTICAL ADVANTAGES) PANEL
 * ═══════════════════════════════════════════════════════════════════════════
 *
 *  Glassmorphism / dark translucent panel positioned at BOTTOM-LEFT.
 *
 *  REQUIREMENTS:
 *  - Title: LỢI THẾ
 *  - Tactical bonus rows:
 *      ⛰ Địa hình cao       +15% Sát thương
 *      🛡 Công thành         +10% Phòng thủ
 *      ⚔ Tinh thần quân ta   +20% Tấn công
 *      🌊 Bãi cọc ngầm       +50% Sát thương khi triều cạn (dynamic)
 *  - Gold border, rounded corners, soft shadow, green/cyan bonus values
 *  - Collapse/expand: MUST ACTUALLY HIDE the panel using conditional rendering / display:none
 *    so hidden elements NEVER intercept clicks.
 *  - When collapsed, a compact floating button remains to re-open.
 * ═══════════════════════════════════════════════════════════════════════════
 */

import React from 'react';
import { Mountain, Shield, Swords, Waves, ChevronDown, ChevronUp, Eye, EyeOff } from 'lucide-react';

interface BattleAdvantagePanelProps {
  isOpen: boolean;
  onToggle: () => void;
  battlefieldId?: string;
  tideTurnsLeft: number;
  recentLogs?: string[];
}

export const BattleAdvantagePanel: React.FC<BattleAdvantagePanelProps> = ({
  isOpen,
  onToggle,
  battlefieldId,
  tideTurnsLeft,
  recentLogs = [],
}) => {
  const isPhuXuan = battlefieldId === 'phu_xuan' || battlefieldId === 'phu-xuan';
  const isLamSon = battlefieldId === 'lam_son' || battlefieldId === 'lam-son';
  const isThangLong = battlefieldId === 'thang_long' || battlefieldId === 'thang-long';

  return (
    <div className="absolute bottom-4 left-4 z-40 flex flex-col items-start gap-2 pointer-events-none select-none">
      
      {/* ──────────────────────────────────────────────────────────── */}
      {/* 1. EXPANDED PANEL (Shown only when isOpen is true)            */}
      {/* ──────────────────────────────────────────────────────────── */}
      {isOpen && (
        <div
          className="pointer-events-auto w-56 md:w-64 bg-gradient-to-br from-[#0c1822]/90 via-[#0a1218]/90 to-black/90 border border-[#c9a44c]/60 rounded-xl overflow-hidden shadow-[0_6px_24px_rgba(0,0,0,0.7),0_0_12px_rgba(201,164,76,0.15)] backdrop-blur-md animate-in fade-in slide-in-from-bottom-2 duration-150"
          style={{ display: 'block' }}
        >
          {/* Header with Title and Collapse Button */}
          <div className="bg-gradient-to-r from-[#182633] via-[#121c25] to-[#0c141a] px-2.5 py-1.5 border-b border-[#c9a44c]/30 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="text-[#f59e0b] text-xs">✦</span>
              <h3 className="text-[11px] md:text-xs font-serif font-black uppercase tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-[#fff3cb] via-[#f59e0b] to-[#b45309]">
                {isPhuXuan ? 'LỢI THẾ PHÚ XUÂN' : isLamSon ? 'CHIẾN THUẬT DU KÍCH' : isThangLong ? 'LỢI THẾ KINH THÀNH' : 'LỢI THẾ CHIẾN THUẬT'}
              </h3>
            </div>

            {/* Collapse Button */}
            <button
              type="button"
              onClick={onToggle}
              title="Ẩn bảng Lợi thế"
              className="p-0.5 rounded-full text-[#c9a44c] hover:text-white hover:bg-black/40 transition-colors"
            >
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Advantage Rows */}
          <div className="p-2 space-y-1 text-[11px]">
            {isPhuXuan ? (
              <>
                {/* Row 1: Cầu vượt Sông Hương */}
                <div className="flex items-center justify-between bg-black/40 border border-[#059669]/40 rounded-lg px-2 py-1 shadow-inner">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm leading-none">🌉</span>
                    <span className="text-slate-200 font-medium text-[11px]">Tây Kiều / Cầu Vượt</span>
                  </div>
                  <span className="font-mono font-bold text-emerald-400 text-[10px] drop-shadow">
                    +15% Xung kích
                  </span>
                </div>

                {/* Row 2: Đông Kiều tầm bắn */}
                <div className="flex items-center justify-between bg-black/40 border border-[#059669]/40 rounded-lg px-2 py-1 shadow-inner">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm leading-none">🎯</span>
                    <span className="text-slate-200 font-medium text-[11px]">Đông Kiều</span>
                  </div>
                  <span className="font-mono font-bold text-cyan-400 text-[10px] drop-shadow">
                    +15% Tầm bắn
                  </span>
                </div>

                {/* Row 3: Sân Rồng Hoàng Thành */}
                <div className="flex items-center justify-between bg-black/40 border border-[#d97706]/40 rounded-lg px-2 py-1 shadow-inner">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm leading-none">👑</span>
                    <span className="text-slate-200 font-medium text-[11px]">Sân Rồng Kinh Thành</span>
                  </div>
                  <span className="font-mono font-bold text-yellow-400 text-[10px] drop-shadow">
                    +20% Tinh thần
                  </span>
                </div>

                {/* Row 4: Cổng Ngọ Môn */}
                <div className="flex items-center justify-between bg-black/40 border border-[#b45309]/40 rounded-lg px-2 py-1 shadow-inner">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm leading-none">🏯</span>
                    <span className="text-slate-200 font-medium text-[11px]">Cổng Ngọ Môn</span>
                  </div>
                  <span className="font-mono font-bold text-blue-400 text-[10px] drop-shadow">
                    +20% DEF
                  </span>
                </div>

                {/* Row 5: Mạng lưới kiểm soát */}
                <div className="flex items-center justify-between bg-black/40 border border-[#eab308]/40 rounded-lg px-2 py-1 shadow-inner">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm leading-none">⚡</span>
                    <span className="text-slate-200 font-medium text-[11px]">Mạng Lưới (≥2 điểm)</span>
                  </div>
                  <span className="font-mono font-bold text-amber-300 text-[10px] drop-shadow">
                    +10% Sĩ Khí
                  </span>
                </div>
              </>
            ) : isLamSon ? (
              <>
                {/* Row 1: Rừng sâu */}
                <div className="flex items-center justify-between bg-black/40 border border-[#059669]/40 rounded-lg px-2 py-1 shadow-inner">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm leading-none">🌲</span>
                    <span className="text-slate-200 font-medium text-[11px]">Rừng sâu</span>
                  </div>
                  <span className="font-mono font-bold text-emerald-400 text-[10px] drop-shadow">
                    +25% DEF
                  </span>
                </div>

                {/* Row 2: Phục kích */}
                <div className="flex items-center justify-between bg-black/40 border border-[#059669]/40 rounded-lg px-2 py-1 shadow-inner">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm leading-none">⚔</span>
                    <span className="text-slate-200 font-medium text-[11px]">Phục kích</span>
                  </div>
                  <span className="font-mono font-bold text-emerald-300 text-[10px] drop-shadow">
                    +30% ST đầu
                  </span>
                </div>

                {/* Row 3: Địa hình cao */}
                <div className="flex items-center justify-between bg-black/40 border border-[#059669]/40 rounded-lg px-2 py-1 shadow-inner">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm leading-none">⛰</span>
                    <span className="text-slate-200 font-medium text-[11px]">Địa hình cao</span>
                  </div>
                  <span className="font-mono font-bold text-amber-300 text-[10px] drop-shadow">
                    +15% Tầm
                  </span>
                </div>

                {/* Row 4: Đường hẹp */}
                <div className="flex items-center justify-between bg-black/40 border border-[#059669]/40 rounded-lg px-2 py-1 shadow-inner">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm leading-none">🛤</span>
                    <span className="text-slate-200 font-medium text-[11px]">Đường hẹp</span>
                  </div>
                  <span className="font-mono font-bold text-cyan-400 text-[10px] drop-shadow">
                    +20% DEF
                  </span>
                </div>

                {/* Row 5: Kho lương địch */}
                <div className="flex items-center justify-between bg-black/40 border border-[#059669]/40 rounded-lg px-2 py-1 shadow-inner">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm leading-none">⛺</span>
                    <span className="text-slate-200 font-medium text-[11px]">Kho lương địch</span>
                  </div>
                  <span className="font-mono font-bold text-rose-400 text-[10px] drop-shadow">
                    -20% ATK Địch
                  </span>
                </div>
              </>
            ) : isThangLong ? (
              <>
                {/* Row 1: Thành cao */}
                <div className="flex items-center justify-between bg-black/40 border border-[#b45309]/40 rounded-lg px-2 py-1 shadow-inner">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm leading-none">🏯</span>
                    <span className="text-slate-200 font-medium text-[11px]">Thành cao</span>
                  </div>
                  <span className="font-mono font-bold text-emerald-400 text-[10px] drop-shadow">
                    +25% DEF
                  </span>
                </div>

                {/* Row 2: Cổng thành */}
                <div className="flex items-center justify-between bg-black/40 border border-[#b45309]/40 rounded-lg px-2 py-1 shadow-inner">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm leading-none">🚪</span>
                    <span className="text-slate-200 font-medium text-[11px]">Cổng thành</span>
                  </div>
                  <span className="font-mono font-bold text-cyan-400 text-[10px] drop-shadow">
                    +20% DEF
                  </span>
                </div>

                {/* Row 3: Tháp canh */}
                <div className="flex items-center justify-between bg-black/40 border border-[#b45309]/40 rounded-lg px-2 py-1 shadow-inner">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm leading-none">🏹</span>
                    <span className="text-slate-200 font-medium text-[11px]">Tháp canh</span>
                  </div>
                  <span className="font-mono font-bold text-amber-300 text-[10px] drop-shadow">
                    +15% Tầm
                  </span>
                </div>

                {/* Row 4: Hoàng thành */}
                <div className="flex items-center justify-between bg-black/40 border border-[#b45309]/40 rounded-lg px-2 py-1 shadow-inner">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm leading-none">👑</span>
                    <span className="text-slate-200 font-medium text-[11px]">Hoàng thành</span>
                  </div>
                  <span className="font-mono font-bold text-yellow-400 text-[10px] drop-shadow">
                    +10% Tinh thần
                  </span>
                </div>
              </>
            ) : (
              <>
                {/* Row 1: High Ground */}
                <div className="flex items-center justify-between bg-black/40 border border-[#1b3544]/60 rounded-lg px-2 py-1 shadow-inner">
                  <div className="flex items-center gap-1.5">
                    <Mountain className="w-3 h-3 text-amber-400" />
                    <span className="text-slate-200 font-medium text-[11px]">Địa hình cao</span>
                  </div>
                  <span className="font-mono font-bold text-emerald-400 text-[10px] drop-shadow">
                    +15% ATK
                  </span>
                </div>

                {/* Row 2: Fortification */}
                <div className="flex items-center justify-between bg-black/40 border border-[#1b3544]/60 rounded-lg px-2 py-1 shadow-inner">
                  <div className="flex items-center gap-1.5">
                    <Shield className="w-3 h-3 text-cyan-400" />
                    <span className="text-slate-200 font-medium text-[11px]">Công sự</span>
                  </div>
                  <span className="font-mono font-bold text-cyan-400 text-[10px] drop-shadow">
                    +10% DEF
                  </span>
                </div>

                {/* Row 3: Army Morale */}
                <div className="flex items-center justify-between bg-black/40 border border-[#1b3544]/60 rounded-lg px-2 py-1 shadow-inner">
                  <div className="flex items-center gap-1.5">
                    <Swords className="w-3 h-3 text-rose-400" />
                    <span className="text-slate-200 font-medium text-[11px]">Tinh thần</span>
                  </div>
                  <span className="font-mono font-bold text-emerald-400 text-[10px] drop-shadow">
                    +20% ATK
                  </span>
                </div>

                {/* Row 4: Bach Dang Stakes & Tide (Dynamic situational) */}
                <div
                  className={`flex items-center justify-between border rounded-lg px-2 py-1 transition-all ${
                    tideTurnsLeft <= 1
                      ? 'bg-amber-950/40 border-amber-500/70 shadow-[0_0_8px_rgba(245,158,11,0.2)]'
                      : 'bg-black/40 border-[#1b3544]/60'
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <Waves className={`w-3 h-3 ${tideTurnsLeft <= 1 ? 'text-amber-400 animate-pulse' : 'text-blue-400'}`} />
                    <span className="text-slate-200 font-medium text-[11px]">
                      {tideTurnsLeft <= 1 ? 'Cọc lộ diện' : 'Thủy triều'}
                    </span>
                  </div>
                  <span
                    className={`font-mono font-bold text-[10px] ${
                      tideTurnsLeft <= 1 ? 'text-amber-300 drop-shadow' : 'text-cyan-300'
                    }`}
                  >
                    {tideTurnsLeft <= 1 ? '+50% Cọc' : `Rút sau ${tideTurnsLeft}T`}
                  </span>
                </div>
              </>
            )}
          </div>

          {/* Recent Combat Log Stream */}
          {recentLogs.length > 0 && (
            <div className="bg-black/60 border-t border-[#c9a44c]/20 px-2 py-1 text-[9px] text-slate-300 space-y-0.5">
              <div className="text-[8px] uppercase tracking-wider text-[#c9a44c] font-bold">Diễn biến:</div>
              {recentLogs.slice(0, 2).map((entry, idx) => (
                <div key={idx} className="truncate text-slate-300">
                  {entry}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────── */}
      {/* 2. FLOATING TOGGLE BUTTON (Always accessible)                 */}
      {/* ──────────────────────────────────────────────────────────── */}
      <button
        type="button"
        onClick={onToggle}
        className={`pointer-events-auto flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-serif font-bold uppercase tracking-wider transition-all backdrop-blur-md shadow-lg active:scale-95 ${
          isOpen
            ? 'bg-[#0c1822]/80 border-[#c9a44c]/50 text-[#f3e5ab] hover:bg-[#122433]'
            : 'bg-gradient-to-r from-[#182633]/95 to-[#0e161d]/95 border-[#f59e0b] text-[#f59e0b] shadow-[0_0_12px_rgba(245,158,11,0.3)] hover:scale-105'
        }`}
      >
        {isOpen ? <EyeOff className="w-3.5 h-3.5 text-[#f59e0b]" /> : <Eye className="w-3.5 h-3.5 text-[#f59e0b]" />}
        <span>{isOpen ? 'Ẩn Lợi thế' : 'Lợi thế'}</span>
        {isOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
      </button>

    </div>
  );
};
