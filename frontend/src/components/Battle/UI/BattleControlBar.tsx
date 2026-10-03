/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  HÀO KHÍ ĐẠI VIỆT — BATTLEFIELD CONTROLS BAR
 * ═══════════════════════════════════════════════════════════════════════════
 *
 *  Compact, premium bottom control bar.
 *
 *  BUTTONS:
 *  - [ ⚔ AUTO ]: Gold highlighted border, premium button, clearly active/inactive indicator
 *  - [ 👁 Hiện / Ẩn Lợi thế ]: Toggles the advantage panel, button text/state reflects visibility
 *  - [ ⚙ Chiến thuật / Tạm dừng ]: Strategy mode (Cân bằng / Tấn công / Phòng thủ) & pause/resume
 *  - Manual action buttons (Move, Attack, Defense, Fire Arrow, End Turn) when in manual mode.
 * ═══════════════════════════════════════════════════════════════════════════
 */

import React from 'react';
import { Swords, Eye, EyeOff, Play, Pause, Move, Shield, Flame, RotateCcw } from 'lucide-react';
import { TacticalAction } from '../../../types';

interface BattleControlBarProps {
  isAuto: boolean;
  onToggleAuto: () => void;
  isAdvantageOpen: boolean;
  onToggleAdvantage: () => void;
  strategy: 'aggressive' | 'defensive' | 'balanced';
  onChangeStrategy: (strategy: 'aggressive' | 'defensive' | 'balanced') => void;
  isPaused: boolean;
  onTogglePause: () => void;
  // Manual actions
  showManualActions: boolean;
  activeAction: TacticalAction | null;
  onSelectAction: (action: TacticalAction) => void;
  onAdvanceTurn: () => void;
}

export const BattleControlBar: React.FC<BattleControlBarProps> = ({
  isAuto,
  onToggleAuto,
  isAdvantageOpen,
  onToggleAdvantage,
  strategy,
  onChangeStrategy,
  isPaused,
  onTogglePause,
  showManualActions,
  activeAction,
  onSelectAction,
  onAdvanceTurn,
}) => {
  return (
    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-40 flex flex-col items-center gap-2 pointer-events-auto select-none">
      
      {/* ──────────────────────────────────────────────────────────── */}
      {/* 1. MANUAL TACTICAL ACTION BUTTONS (When not in AUTO)          */}
      {/* ──────────────────────────────────────────────────────────── */}
      {showManualActions && (
        <div className="flex items-center gap-1.5 bg-[#09141d]/90 border border-[#c9a44c]/60 rounded-full px-3 py-1.5 shadow-2xl backdrop-blur-md animate-in slide-in-from-bottom-2 duration-150">
          <button
            onClick={() => onSelectAction('move')}
            className={`flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-bold uppercase transition-all ${
              activeAction === 'move'
                ? 'bg-blue-600 text-white shadow-[0_0_10px_rgba(37,99,235,0.6)] border border-blue-300'
                : 'bg-black/40 text-blue-300 hover:bg-blue-900/40 border border-transparent'
            }`}
          >
            <Move className="w-3 h-3" /> Di chuyển
          </button>

          <button
            onClick={() => onSelectAction('attack')}
            className={`flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-bold uppercase transition-all ${
              activeAction === 'attack'
                ? 'bg-red-600 text-white shadow-[0_0_10px_rgba(220,38,38,0.6)] border border-red-300'
                : 'bg-black/40 text-red-300 hover:bg-red-900/40 border border-transparent'
            }`}
          >
            <Swords className="w-3 h-3" /> Tấn công
          </button>

          <button
            onClick={() => onSelectAction('formation')}
            className={`flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-bold uppercase transition-all ${
              activeAction === 'formation'
                ? 'bg-emerald-600 text-white shadow-[0_0_10px_rgba(16,185,129,0.6)] border border-emerald-300'
                : 'bg-black/40 text-emerald-300 hover:bg-emerald-900/40 border border-transparent'
            }`}
          >
            <Shield className="w-3 h-3" /> Phòng ngự
          </button>

          <button
            onClick={() => onSelectAction('fire_arrow')}
            className={`flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-bold uppercase transition-all ${
              activeAction === 'fire_arrow'
                ? 'bg-amber-600 text-white shadow-[0_0_10px_rgba(217,119,6,0.6)] border border-amber-300'
                : 'bg-black/40 text-amber-300 hover:bg-amber-900/40 border border-transparent'
            }`}
          >
            <Flame className="w-3 h-3" /> Hỏa tiễn
          </button>

          <div className="w-px h-4 bg-[#c9a44c]/40 mx-0.5" />

          <button
            onClick={onAdvanceTurn}
            className="flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-bold uppercase bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 border border-slate-600 transition-all"
          >
            <RotateCcw className="w-3 h-3" /> Qua lượt
          </button>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────── */}
      {/* 2. MAIN BATTLE CONTROL DOCK                                  */}
      {/* ──────────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-1.5 md:gap-2 bg-gradient-to-r from-[#0d1a24]/95 via-[#112230]/95 to-[#0d1a24]/95 border-2 border-[#c9a44c] rounded-full p-1.5 shadow-[0_8px_32px_rgba(0,0,0,0.8),0_0_15px_rgba(201,164,76,0.25)] backdrop-blur-md">
        
        {/* [ ⚔ AUTO ] BUTTON */}
        <button
          onClick={onToggleAuto}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-full font-serif font-black text-xs uppercase tracking-widest transition-all ${
            isAuto
              ? 'bg-gradient-to-r from-emerald-600 via-teal-500 to-emerald-700 text-white shadow-[0_0_16px_rgba(16,185,129,0.7)] border border-emerald-300 scale-105 active:scale-100'
              : 'bg-black/60 text-slate-400 hover:text-white hover:bg-black/80 border border-slate-700 active:scale-95'
          }`}
        >
          <Swords className={`w-3.5 h-3.5 ${isAuto ? 'animate-spin' : ''}`} style={{ animationDuration: '4s' }} />
          <span>AUTO</span>
          <span
            className={`w-2 h-2 rounded-full ${
              isAuto ? 'bg-emerald-300 shadow-[0_0_6px_#34d399]' : 'bg-slate-600'
            }`}
          />
        </button>

        <div className="w-px h-5 bg-[#c9a44c]/40" />

        {/* [ 👁 HIỆN / ẨN LỢI THẾ ] BUTTON */}
        <button
          onClick={onToggleAdvantage}
          title="Bật/tắt hiển thị bảng lợi thế chiến thuật"
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-serif font-bold uppercase tracking-wider transition-all border ${
            isAdvantageOpen
              ? 'bg-blue-950/80 border-cyan-500/70 text-cyan-200 shadow-[0_0_10px_rgba(6,182,212,0.3)]'
              : 'bg-black/50 border-slate-700 text-slate-300 hover:text-white hover:border-[#c9a44c]/60'
          }`}
        >
          {isAdvantageOpen ? <Eye className="w-3.5 h-3.5 text-cyan-400" /> : <EyeOff className="w-3.5 h-3.5 text-slate-400" />}
          <span>{isAdvantageOpen ? 'Ẩn Lợi thế' : 'Hiện Lợi thế'}</span>
        </button>

        <div className="w-px h-5 bg-[#c9a44c]/40" />

        {/* [ ⚙ CHIẾN THUẬT STRATEGY SELECTOR ] */}
        <select
          value={strategy}
          onChange={(e) => onChangeStrategy(e.target.value as any)}
          aria-label="Chọn chiến thuật tác chiến"
          className="appearance-none bg-black/60 hover:bg-black text-[#f59e0b] border border-[#c9a44c]/50 hover:border-[#f59e0b] rounded-full px-3.5 py-1.5 text-xs font-serif font-bold uppercase tracking-wider text-center cursor-pointer outline-none transition-all shadow-inner"
        >
          <option value="balanced" className="bg-[#0b141d] text-[#f59e0b]">⚖ Cân Bằng</option>
          <option value="aggressive" className="bg-[#0b141d] text-red-400">⚔ Tấn Công</option>
          <option value="defensive" className="bg-[#0b141d] text-cyan-400">🛡 Phòng Thủ</option>
        </select>

        {/* [ ⏸ / ▶ TẠM DỪNG / TIẾP TỤC ] */}
        <button
          onClick={onTogglePause}
          title={isPaused ? 'Tiếp tục trận đấu' : 'Tạm dừng trận đấu'}
          className={`p-2 rounded-full border transition-all ${
            isPaused
              ? 'bg-red-700 border-red-400 text-white animate-pulse shadow-[0_0_12px_rgba(239,68,68,0.7)]'
              : 'bg-black/50 border-slate-700 text-slate-300 hover:text-white hover:border-[#c9a44c]/60'
          }`}
        >
          {isPaused ? <Play className="w-3.5 h-3.5 fill-current" /> : <Pause className="w-3.5 h-3.5" />}
        </button>

      </div>
    </div>
  );
};
