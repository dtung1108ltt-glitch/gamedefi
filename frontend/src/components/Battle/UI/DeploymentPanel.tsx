import React from 'react';
import { Lock, Save, FolderOpen, RotateCcw } from 'lucide-react';
import type { BattleUnit } from '../../../types';
import { COMMAND_RADIUS, FORMATION_PRESETS } from '../../../data/deployment';
import type { FormationPresetId } from '../../../data/deployment';

interface DeploymentPanelProps {
  reserveUnits: BattleUnit[];
  deployedCount: number;
  selectedUnitId: string | null;
  commanderId: string | null;
  buffedIds: string[];
  validationErrors: string[];
  canLock: boolean;
  prepSecondsLeft: number;
  zoneDesc: string;
  onSelectReserve: (unitId: string) => void;
  onApplyPreset: (preset: FormationPresetId) => void;
  onRecallUnit: (unitId: string) => void;
  onReset: () => void;
  onSave: () => void;
  onLoad: () => void;
  onLock: () => void;
}

const glyphFor = (icon: string) => {
  if (icon === 'commander') return '👑';
  if (icon === 'archer') return '🏹';
  if (icon === 'cavalry') return '🐎';
  if (icon === 'elephant') return '🐘';
  return '⚔';
};

export const DeploymentPanel: React.FC<DeploymentPanelProps> = (props) => {
  const { reserveUnits, deployedCount, selectedUnitId, commanderId } = props;
  const { buffedIds, validationErrors, canLock, prepSecondsLeft, zoneDesc } = props;
  return (
    <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-40 w-[min(680px,94vw)] select-none">
      <div className="rounded-2xl border-2 border-[#c9a44c] bg-[#0b141d]/95 shadow backdrop-blur-md overflow-hidden">
        <div className="flex items-center justify-between gap-2 px-3 py-1.5 border-b border-[#c9a44c]/30">
          <div className="text-[11px] font-serif font-black uppercase tracking-widest text-[#f3e5ab]">
            Xếp đội hình <span className="text-slate-400 normal-case font-sans font-normal">— {zoneDesc}</span>
          </div>
          <div className="text-[11px] font-mono font-bold text-amber-300">⏳ {prepSecondsLeft}s</div>
        </div>
        <div className="px-3 pt-2">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
            Quân dự bị ({reserveUnits.length}) · Đã triển khai ({deployedCount})
          </div>
          <div className="flex flex-wrap gap-1.5 min-h-[34px]">
            {reserveUnits.length === 0 && (
              <div className="text-[10px] italic text-slate-500">Toàn quân đã ra trận.</div>
            )}
            {reserveUnits.map((u) => (
              <button
                key={u.unit_id}
                onClick={() => props.onSelectReserve(u.unit_id)}
                title={`${u.name} — bấm rồi bấm ô xanh để triển khai`}
                className={`flex items-center gap-1 rounded-lg border px-2 py-1 text-[11px] font-bold ${
                  selectedUnitId === u.unit_id
                    ? 'border-amber-300 bg-amber-900/50 text-amber-100'
                    : 'border-slate-700 bg-black/50 text-slate-200'
                }`}
              >
                <span>{glyphFor(u.icon)}</span>
                <span className="max-w-[110px] truncate">{u.name}</span>
                {u.unit_id === commanderId && <span className="text-[9px] text-amber-300">CMD</span>}
              </button>
            ))}
          </div>
          <div className="mt-1 text-[10px] text-slate-400">
            Trong vùng chỉ huy (bán kính {COMMAND_RADIUS}):{' '}
            <span className="font-bold text-emerald-300">{buffedIds.length} quân (+10% ATK/DEF)</span>
          </div>
          {validationErrors.length > 0 && (
            <div className="mt-1 rounded-lg border border-red-700/60 bg-red-950/50 px-2 py-1 text-[10px] text-red-200">
              {validationErrors.map((e) => (
                <div key={e}>• {e}</div>
              ))}
            </div>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-1.5 px-3 py-2">
          {FORMATION_PRESETS.map((p) => (
            <button
              key={p.id}
              onClick={() => props.onApplyPreset(p.id)}
              className="rounded-full border border-slate-700 bg-black/50 px-2.5 py-1 text-[10px] font-bold uppercase text-slate-300"
            >
              {p.icon} {p.label}
            </button>
          ))}
          <div className="mx-1 h-4 w-px bg-[#c9a44c]/40" />
          <button
            onClick={props.onSave}
            className="flex items-center gap-1 rounded-full border border-slate-700 bg-black/50 px-2.5 py-1 text-[10px] font-bold text-slate-300"
          >
            <Save className="h-3 w-3" /> Lưu
          </button>
          <button
            onClick={props.onLoad}
            className="flex items-center gap-1 rounded-full border border-slate-700 bg-black/50 px-2.5 py-1 text-[10px] font-bold text-slate-300"
          >
            <FolderOpen className="h-3 w-3" /> Tải
          </button>
          <button
            onClick={props.onReset}
            className="flex items-center gap-1 rounded-full border border-slate-700 bg-black/50 px-2.5 py-1 text-[10px] font-bold text-slate-300"
          >
            <RotateCcw className="h-3 w-3" /> Mặc định
          </button>
          {selectedUnitId && (
            <button
              onClick={() => props.onRecallUnit(selectedUnitId)}
              className="rounded-full border border-orange-700/60 bg-orange-950/50 px-2.5 py-1 text-[10px] font-bold uppercase text-orange-200"
            >
              Rút quân
            </button>
          )}
          <button
            onClick={props.onLock}
            disabled={!canLock}
            className={`ml-auto flex items-center gap-1.5 rounded-full px-4 py-1.5 font-serif text-[11px] font-black uppercase ${
              canLock
                ? 'bg-gradient-to-r from-[#b45309] via-[#f59e0b] to-[#b45309] text-black'
                : 'cursor-not-allowed bg-black/60 text-slate-500 border border-slate-700'
            }`}
          >
            <Lock className="h-3.5 w-3.5" /> Khóa đội hình
          </button>
        </div>
      </div>
    </div>
  );
};

