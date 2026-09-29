import React, { useMemo, useState, useEffect, useRef } from 'react';
import { Faction, Player, BattleResultResponse, BattleUnit, HexTile, TerrainType, TacticalAction, MapLocation, RewardClaim } from '../../types';
import { apiService } from '../../services/api';
import { BACH_DANG_HEXES, BACH_DANG_UNITS, BATTLEFIELD_DIMS } from '../../data/campaign';
import { hexToPixel, hexPolygonPoints, boardPixelSize, hexDistance, HEX_SIZE, getHexSurfaceHeight, getHexSurfacePosition } from '../../utils/hexGrid';
import {
  ArrowLeft, Waves, Move, Swords, LayoutGrid, Flame, MousePointer2, ExternalLink, LoaderCircle, Trophy, Shield,
  ChevronUp, ChevronDown
} from 'lucide-react';

interface BattleScreenProps {
  player: Player;
  faction: Faction;
  location: MapLocation;
  onExitBattle: () => void;
  onPlayDrum: () => void;
  onPlaySword: () => void;
  onPlayGong: () => void;
}

const TERRAIN_NAME_VI: Record<TerrainType, string> = {
  plain: 'Đồng Bằng', hill: 'Gò Cao', forest: 'Rừng Ngập Mặn',
  mud: 'Bãi Lầy', river: 'Sông Nước', stakes: 'Bãi Cọc Ngầm', fort: 'Công Sự',
};

const ACTIONS: { key: TacticalAction; label: string; icon: React.ReactNode; color: string }[] = [
  { key: 'move', label: 'Di chuyển', icon: <Move className="w-5 h-5" />, color: 'text-blue-400' },
  { key: 'attack', label: 'Tấn công', icon: <Swords className="w-5 h-5" />, color: 'text-red-400' },
  { key: 'formation', label: 'Phòng ngự', icon: <Shield className="w-5 h-5" />, color: 'text-emerald-400' },
  { key: 'fire_arrow', label: 'Hỏa tiễn', icon: <Flame className="w-5 h-5" />, color: 'text-orange-400' },
];

const TILT_ANGLE = 50;

// BattlefieldRoot position offset to align the hex board center with the playable viewport center
// (Hex coordinates have center at ~ (375, 200). After 50° pitch & 35° yaw isometric projection,
// this offset moves the battlefield down and into the visual center of the playable area, clear of the top header)
const BATTLEFIELD_ROOT_OFFSET = {
  x: 45,
  y: 180,
};

import { UnitEntity } from './UnitEntity';
import { useAutoBattle } from './engine/useAutoBattle';
import { useBattleCamera } from './engine/useBattleCamera';

export const BattleScreen: React.FC<BattleScreenProps> = ({
  player, faction, location, onExitBattle, onPlayDrum, onPlaySword, onPlayGong,
}) => {
  const [units, setUnits] = useState<BattleUnit[]>(BACH_DANG_UNITS);
  const [selectedUnitId, setSelectedUnitId] = useState<string>('p1');
  const [selectedHex, setSelectedHex] = useState<{ col: number; row: number } | null>({ col: 1, row: 3 });
  const [activeAction, setActiveAction] = useState<TacticalAction | null>(null);
  const [turnSide, setTurnSide] = useState<'player' | 'enemy'>('player');
  const [tideTurnsLeft, setTideTurnsLeft] = useState<number>(3);
  const [log, setLog] = useState<string[]>(['Trận Bạch Đằng bắt đầu.', 'Đến lượt quân ta hành động.']);
  const [battleResult, setBattleResult] = useState<BattleResultResponse | null>(null);
  const [rewardClaim, setRewardClaim] = useState<RewardClaim | null>(null);
  const [settling, setSettling] = useState(false);
  const [settlementError, setSettlementError] = useState<string | null>(null);
  const [battleHeaderVisible, setBattleHeaderVisible] = useState<boolean>(true);

  const toggleBattleHeader = (e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    setBattleHeaderVisible(prev => !prev);
  };
  
  const [popups, setPopups] = useState<{ id: number; col: number; row: number; dmg: number; color: string }[]>([]);
  const [actionEvents, setActionEvents] = useState<{ id: number; attackerId: string; targetId: string; type: string }[]>([]);


  const [isAuto, setIsAuto] = useState<boolean>(true);
  const [battleSpeed, setBattleSpeed] = useState<number>(1);
  const [strategy, setStrategy] = useState<'aggressive'|'defensive'|'balanced'>('balanced');
  const [isPaused, setIsPaused] = useState<boolean>(false);

  // Auto-settle battle if one side is defeated
  useEffect(() => {
    if (settling || battleResult) return;
    const playerAlive = units.some(u => u.side === 'player' && u.stats.at > 0);
    const enemyAlive = units.some(u => u.side === 'enemy' && u.stats.at > 0);
    
    if (!playerAlive || !enemyAlive) {
      void handleSettleBattle();
    }
  }, [units, settling, battleResult]);

  const { 
    camera, mode: cameraMode, isDragging, 
    handleMouseDown, handleMouseMove, handleMouseUp, handleWheel, focusOnCombat 
  } = useBattleCamera();

  const { cols, rows } = BATTLEFIELD_DIMS;
  const boardSize = useMemo(() => boardPixelSize(cols, rows), [cols, rows]);

  const selectedUnit = units.find(u => u.unit_id === selectedUnitId) || null;
  const hexAt = (col: number, row: number) => BACH_DANG_HEXES.find(h => h.col === col && h.row === row);
  const unitAt = (col: number, row: number) => units.find(u => u.col === col && u.row === row);
  const selectedTile = selectedHex ? hexAt(selectedHex.col, selectedHex.row) : undefined;

  const pushLog = (msg: string) => setLog(prev => [msg, ...prev].slice(0, 5));
  const showDamage = (col: number, row: number, dmg: number, color: string) => {
    const id = Date.now() + Math.random();
    setPopups(prev => [...prev, { id, col, row, dmg, color }]);
    setTimeout(() => setPopups(prev => prev.filter(p => p.id !== id)), 1200);
  };

  const validTargets = useMemo(() => {
    if (!selectedUnit || !activeAction || selectedUnit.side !== 'player') return new Set<string>();
    const set = new Set<string>();
    if (activeAction === 'move') {
      for (const tile of BACH_DANG_HEXES) {
        if (tile.terrain === 'fort' && tile.zone === 'enemy') continue;
        const dist = hexDistance(selectedUnit, tile);
        if (dist > 0 && dist <= 2 && !unitAt(tile.col, tile.row)) set.add(`${tile.col}-${tile.row}`);
      }
    } else if (activeAction === 'attack') {
      for (const u of units) {
        if (u.side === selectedUnit.side) continue;
        if (hexDistance(selectedUnit, u) <= 1) set.add(`${u.col}-${u.row}`);
      }
    } else if (activeAction === 'fire_arrow') {
      const range = hexAt(selectedUnit.col, selectedUnit.row)?.terrain === 'hill' ? 4 : 3;
      for (const u of units) {
        if (u.side === selectedUnit.side) continue;
        const dist = hexDistance(selectedUnit, u);
        if (dist > 0 && dist <= range) set.add(`${u.col}-${u.row}`);
      }
    }
    return set;
  }, [selectedUnit, activeAction, units]);

  const advanceTurn = () => {
    setTurnSide(prev => {
      const nextSide = prev === 'player' ? 'enemy' : 'player';
      if (nextSide === 'player') {
        setTideTurnsLeft(t => (t > 0 ? t - 1 : 3));
        pushLog('Đến lượt quân ta hành động.');
      } else {
        pushLog('Quân Mông Nguyên đang điều binh...');
      }
      return nextSide;
    });
    setActiveAction(null);
  };

  useAutoBattle({
    isAuto: isAuto && !isPaused && !settling,
    speedMultiplier: battleSpeed,
    strategy,
    units,
    turnSide,
    hexes: BACH_DANG_HEXES,
    tideTurnsLeft,
    setUnits,
    setActionEvents,
    showDamage,
    pushLog,
    endTurn: advanceTurn,
    focusOnCombat
  });

  const handleSelectHex = (col: number, row: number) => {
    if (isDragging) return;
    const unit = unitAt(col, row);
    setSelectedHex({ col, row });

    if (turnSide !== 'player' || isAuto) {
      if (unit) setSelectedUnitId(unit.unit_id);
      return;
    }

    if (activeAction === 'move' && selectedUnit && validTargets.has(`${col}-${row}`)) {
      onPlayDrum();
      setUnits(prev => prev.map(u => (u.unit_id === selectedUnit.unit_id ? { ...u, col, row } : u)));
      pushLog(`Di chuyển tới ô (${col}, ${row}).`);
      setActiveAction(null);
      advanceTurn();
      return;
    }

    if ((activeAction === 'attack' || activeAction === 'fire_arrow') && selectedUnit && unit && validTargets.has(`${col}-${row}`)) {
      onPlaySword();
      focusOnCombat((hexToPixel(selectedUnit.col, selectedUnit.row).x + hexToPixel(unit.col, unit.row).x)/2, (hexToPixel(selectedUnit.col, selectedUnit.row).y + hexToPixel(unit.col, unit.row).y)/2);
      const bonus = activeAction === 'fire_arrow' ? 1.3 : 1.0;
      const hillBonus = hexAt(selectedUnit.col, selectedUnit.row)?.terrain === 'hill' ? 1.2 : 1.0;
      const isStakes = hexAt(unit.col, unit.row)?.terrain === 'stakes' && tideTurnsLeft <= 1;
      const dmg = Math.max(5, Math.round(selectedUnit.stats.atk * bonus * hillBonus * (isStakes ? 1.5 : 1.0) - unit.stats.def * 0.4));
      
      setUnits(prev => prev.map(u => (u.unit_id === unit.unit_id ? { ...u, stats: { ...u.stats, at: Math.max(0, u.stats.at - dmg) } } : u)).filter(u => u.stats.at > 0 || u.side === 'player'));
      showDamage(col, row, dmg, activeAction === 'fire_arrow' ? '#fb923c' : '#ef4444');
      setActionEvents(prev => [...prev, { id: Date.now(), attackerId: selectedUnit.unit_id, targetId: unit.unit_id, type: activeAction }]);
      pushLog(`${activeAction === 'fire_arrow' ? '🔥 Hỏa tiễn' : '⚔ Tấn công'} gây ${dmg} sát thương lên ${unit.name}.`);
      setActiveAction(null);
      advanceTurn();
      return;
    }

    if (unit) setSelectedUnitId(unit.unit_id);
  };

  const handleAction = (action: TacticalAction) => {
    if (!selectedUnit || selectedUnit.side !== 'player' || turnSide !== 'player' || isAuto) return;
    onPlayDrum();
    if (action === 'formation') {
      pushLog(`🛡 ${selectedUnit.name} lập đội hình phòng thủ (+DEF).`);
      setUnits(prev => prev.map(u => (u.unit_id === selectedUnit.unit_id ? { ...u, stats: { ...u.stats, def: u.stats.def + 10 } } : u)));
      setActiveAction(null);
      advanceTurn();
      return;
    }
    setActiveAction(prev => (prev === action ? null : action));
  };

  const handleSettleBattle = async () => {
    setSettling(true);
    setSettlementError(null);
    try {
      const result = await apiService.executeBattle(player.wallet, 'bach_dang_1288', 'aggressive');
      setBattleResult(result);
      if (result.victory && !player.is_guest) setRewardClaim(await apiService.claimBattleReward(player.wallet, result.battle_id));
      if (result.victory) onPlayGong();
    } catch (reason) {
      setSettlementError(reason instanceof Error ? reason.message : 'Không thể ghi nhận kết quả trận đánh.');
    } finally {
      setSettling(false);
    }
  };

  const playerPower = useMemo(() => units.filter(u => u.side === 'player').reduce((acc, curr) => acc + curr.stats.at, 0), [units]);
  const enemyPower = useMemo(() => units.filter(u => u.side === 'enemy').reduce((acc, curr) => acc + curr.stats.at, 0), [units]);
  const maxPlayerPower = BACH_DANG_UNITS.filter(u => u.side === 'player').reduce((acc, curr) => acc + curr.stats.at, 0);

  return (
    <div className="relative flex-1 w-full min-h-[600px] bg-[#030d12] overflow-hidden font-sans select-none">
      
      <style>{`
        @keyframes battle-shake { 0%, 100% { transform: translate(0, 0); } 20% { transform: translate(-8px, 4px) rotate(-1deg); } 40% { transform: translate(8px, -4px) rotate(1deg); } 60% { transform: translate(-4px, 8px); } 80% { transform: translate(4px, -8px); } }
        @keyframes dmg-float { 0% { opacity: 0; transform: translate(-50%, 0px) rotateZ(${-camera.yaw}deg) rotateX(-90deg) scale(0.6); } 20% { opacity: 1; transform: translate(-50%, -30px) rotateZ(${-camera.yaw}deg) rotateX(-90deg) scale(1.2); } 100% { opacity: 0; transform: translate(-50%, -70px) rotateZ(${-camera.yaw}deg) rotateX(-90deg) scale(1.0); } }
        .bg-water-noise { background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.015' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.3'/%3E%3C/svg%3E"); }
      `}</style>

      {/* Cinematic Background Layer */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
         <div className="absolute top-0 w-full h-[60%] bg-gradient-to-b from-[#0a1e2d] to-transparent opacity-80" />
         <div className="absolute bottom-0 w-full h-[60%] bg-gradient-to-t from-[#02080a] to-transparent opacity-90" />
         <div className="absolute inset-0 bg-water-noise mix-blend-overlay opacity-20 animate-[spin_120s_linear_infinite]" />
      </div>

      {/* MAP VIEWPORT */}
      <div 
        className="absolute inset-0 overflow-hidden z-0"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        style={{ cursor: activeAction ? 'crosshair' : 'default' }}
      >
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1200px] h-[900px] flex items-center justify-center pointer-events-none">
          
          {/* 2.5D BOARD CONTAINER (BattlefieldRoot) */}
          <div 
            className={`relative w-full h-full transition-transform duration-700 ease-in-out`}
            style={{ 
              transform: `perspective(1200px) translate3d(${camera.x + BATTLEFIELD_ROOT_OFFSET.x}px, ${camera.y + BATTLEFIELD_ROOT_OFFSET.y}px, 0) scale(${camera.zoom}) rotateX(${camera.pitch}deg) rotateZ(${camera.yaw}deg)`, 
              transformStyle: 'preserve-3d',
              pointerEvents: 'auto'
            }}
          >
            
            {/* BASE HEX LAYER (TERRAIN) */}
            <svg width="1200" height="900" className="absolute inset-0 overflow-visible pointer-events-none">
              {BACH_DANG_HEXES.map((tile) => {
                const { x, y } = hexToPixel(tile.col, tile.row);
                let fill = 'rgba(8, 51, 68, 0.4)'; // river/water base
                if (tile.terrain === 'plain') fill = 'rgba(20, 83, 45, 0.9)';
                if (tile.terrain === 'forest') fill = 'rgba(6, 78, 59, 0.95)';
                if (tile.terrain === 'hill') fill = 'rgba(66, 32, 6, 0.95)';
                if (tile.terrain === 'mud') fill = 'rgba(63, 63, 70, 0.8)';
                return (
                  <polygon
                    key={`base-${tile.col}-${tile.row}`}
                    points={hexPolygonPoints(x, y)}
                    fill={fill}
                    stroke="#ffffff" strokeOpacity={0.05} strokeWidth={1}
                  />
                );
              })}
            </svg>

            {/* TACTICAL HEX LAYER (INTERACTION & HIGHLIGHTS) */}
            <svg width="1200" height="900" className="absolute inset-0 overflow-visible z-10">
              {BACH_DANG_HEXES.map((tile) => {
                const { x, y } = hexToPixel(tile.col, tile.row);
                const isSelected = selectedHex?.col === tile.col && selectedHex?.row === tile.row;
                const isValidTarget = validTargets.has(`${tile.col}-${tile.row}`);
                return (
                  <g key={`tac-${tile.col}-${tile.row}`}>
                    <polygon
                      points={hexPolygonPoints(x, y)}
                      fill="transparent"
                      stroke={isSelected ? '#F3E5AB' : isValidTarget ? (activeAction === 'move' ? '#38bdf8' : '#ef4444') : 'transparent'}
                      strokeWidth={isSelected || isValidTarget ? 3 : 0}
                      className="pointer-events-auto cursor-pointer hover:fill-white/10 transition-colors"
                      onClick={() => handleSelectHex(tile.col, tile.row)}
                    />
                    {isValidTarget && (
                      <polygon points={hexPolygonPoints(x, y, HEX_SIZE - 4)} fill={activeAction === 'move' ? '#0ea5e9' : '#ef4444'} opacity="0.3" className="pointer-events-none" />
                    )}
                  </g>
                );
              })}
            </svg>

            {/* 3D OBJECTS LAYER (ENVIRONMENT & UNITS) */}
            <div className="absolute inset-0 z-20 pointer-events-none" style={{ transformStyle: "preserve-3d" }}>
              
              {/* TERRAIN FEATURES (90° Upright Perpendicular Models) */}
              {BACH_DANG_HEXES.map(tile => {
                if (tile.terrain !== 'forest' && tile.terrain !== 'hill' && tile.terrain !== 'stakes') return null;
                const { x, y, surfaceZ } = getHexSurfacePosition(tile.col, tile.row, tile.terrain);
                return (
                  <div
                    key={`env-${tile.col}-${tile.row}`}
                    className="absolute pointer-events-none"
                    style={{ 
                      left: x, 
                      top: y, 
                      width: 0, 
                      height: 0, 
                      transform: surfaceZ !== 0 ? `translateZ(${surfaceZ}px)` : undefined,
                      transformStyle: 'preserve-3d', 
                      zIndex: Math.round(y) 
                    }}
                  >
                    {/* Ground Contact Shadow (Flat on the terrain) */}
                    <div 
                      className="absolute pointer-events-none"
                      style={{ 
                        width: tile.terrain === 'forest' ? 52 : tile.terrain === 'hill' ? 58 : 36,
                        height: 22,
                        left: tile.terrain === 'forest' ? -26 : tile.terrain === 'hill' ? -29 : -18,
                        top: -11,
                        borderRadius: '50%',
                        background: 'radial-gradient(ellipse at center, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.2) 50%, transparent 80%)',
                      }} 
                    />

                    {/* Upright Object (90° Perpendicular to Ground) */}
                    <div
                      style={{
                        position: 'absolute',
                        left: 0,
                        top: 0,
                        transformOrigin: '50% 100%', // Pivot anchored at base on ground
                        transform: `rotateZ(${-camera.yaw}deg) rotateX(-90deg) scale(1.25)`,
                        transformStyle: 'preserve-3d',
                      }}
                    >
                      {tile.terrain === 'forest' && (
                        <div className="relative flex items-end justify-center text-4xl select-none -translate-y-2" style={{ transformStyle: 'preserve-3d' }}>
                          <span className="absolute -ml-7 mb-1 scale-75 opacity-90">🌲</span>
                          <span className="absolute ml-7 -mb-2 scale-90 opacity-95">🌲</span>
                          <span className="relative z-10 scale-105">🌲</span>
                        </div>
                      )}
                      {tile.terrain === 'hill' && (
                        <div className="text-5xl select-none -translate-y-2" style={{ transformStyle: 'preserve-3d' }}>
                          ⛰️
                        </div>
                      )}
                      {tile.terrain === 'stakes' && (
                        <div 
                          className={`flex items-end gap-1.5 transition-opacity duration-1000 ${tideTurnsLeft <= 1 ? 'opacity-100' : 'opacity-30'} -translate-y-1`} 
                          style={{ transformStyle: 'preserve-3d' }}
                        >
                          {[1, 2, 3].map(i => (
                            <div 
                              key={i} 
                              className="w-1.5 h-12 bg-gradient-to-b from-[#b3823d] to-[#3a2613] rounded-t border-t border-amber-300/40" 
                              style={{ transform: `rotate(${(i-2)*8}deg) translateY(${Math.abs(i-2)*4}px)` }} 
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* REAR BASE CAMPS (2.5D / 3D Upright Headquarters) */}
              {/* 1. Đại Việt Royal Base Camp (West Rear at 0, 3) */}
              {(() => {
                const { x, y, surfaceZ } = getHexSurfacePosition(0, 3, 'fort');
                return (
                  <div
                    key="base-player"
                    className="absolute pointer-events-none"
                    style={{ left: x, top: y, width: 0, height: 0, transform: `translateZ(${surfaceZ}px)`, transformStyle: 'preserve-3d', zIndex: Math.round(y) - 20 }}
                  >
                    {/* Ground Contact Shadow */}
                    <div 
                      className="absolute pointer-events-none"
                      style={{ 
                        width: 120, height: 48, left: -60, top: -24,
                        borderRadius: '50%',
                        background: 'radial-gradient(ellipse at center, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.25) 55%, transparent 80%)'
                      }} 
                    />

                    {/* Upright Camp Structure (90° Perpendicular) */}
                    <div
                      style={{
                        position: 'absolute',
                        left: 0,
                        top: 0,
                        width: 110,
                        height: 100,
                        marginLeft: -55,
                        marginTop: -100,
                        transformOrigin: '50% 100%',
                        transform: `rotateZ(${-camera.yaw}deg) rotateX(-90deg) scale(1.3)`,
                        transformStyle: 'preserve-3d'
                      }}
                    >
                      <div className="relative w-full h-full flex flex-col items-center justify-end select-none" style={{ transformStyle: 'preserve-3d' }}>
                        
                        {/* Main Headquarters Pavilion (Mái Đao Cổ Truyền) */}
                        <div className="relative w-24 h-20 flex flex-col items-center" style={{ transformStyle: 'preserve-3d' }}>
                          {/* Top Roof Crest */}
                          <div className="w-28 h-6 bg-gradient-to-r from-[#991b1b] via-[#b91c1c] to-[#991b1b] rounded-t-xl border-t-2 border-[#fbbf24] shadow-md flex items-center justify-center">
                            <span className="text-[7px] text-[#fef08a] font-serif font-black tracking-widest uppercase">ĐẠI VIỆT</span>
                          </div>
                          {/* Second Tier Curved Eaves */}
                          <div className="w-24 h-4 bg-[#78350f] border-b border-[#f59e0b] shadow-inner -mt-1" />
                          
                          {/* Wooden Pillars & Main Hall */}
                          <div className="w-20 h-11 bg-gradient-to-b from-[#451a03] to-[#1c0a00] border-x-4 border-[#78350f] flex flex-col items-center justify-between p-1">
                            <div className="w-6 h-6 rounded-full border border-[#fbbf24] bg-[#991b1b] flex items-center justify-center text-[10px] text-[#fef08a] font-serif font-bold">
                              陳
                            </div>
                            <div className="w-full flex justify-between px-1 text-[8px] text-amber-200">
                              <span>🏮</span><span>🏮</span>
                            </div>
                          </div>
                        </div>

                        {/* Left Imperial Banner (Cờ Tiết Chế) */}
                        <div className="absolute -left-3 bottom-0 flex flex-col items-center" style={{ transform: 'translateZ(8px)' }}>
                          <div className="w-1 h-24 bg-[#78350f]" />
                          <div className="absolute top-1 left-1 w-7 h-16 bg-blue-700 border-2 border-[#fbbf24] rounded-br flex flex-col items-center justify-center shadow-lg animate-[pulse_2.5s_infinite]">
                            <span className="text-[7px] text-[#fef08a] font-serif font-black leading-tight">SÁT</span>
                            <span className="text-[7px] text-[#fef08a] font-serif font-black leading-tight">THÁT</span>
                          </div>
                        </div>

                        {/* Right Imperial Banner (Cờ Hiệu Hoàng Gia) */}
                        <div className="absolute -right-3 bottom-0 flex flex-col items-center" style={{ transform: 'translateZ(8px)' }}>
                          <div className="w-1 h-24 bg-[#78350f]" />
                          <div className="absolute top-1 right-1 w-7 h-16 bg-red-700 border-2 border-[#fbbf24] rounded-bl flex flex-col items-center justify-center shadow-lg animate-[pulse_2s_infinite]">
                            <span className="text-[7px] text-[#fef08a] font-serif font-black leading-tight">QUÂN</span>
                            <span className="text-[7px] text-[#fef08a] font-serif font-black leading-tight">DOANH</span>
                          </div>
                        </div>

                        {/* Palisade Wooden Barricade & Campfire */}
                        <div className="absolute -bottom-1 w-28 flex items-end justify-between px-2" style={{ transform: 'translateZ(14px)' }}>
                          <div className="flex gap-0.5">
                            {[1, 2, 3, 4].map(i => (
                              <div key={i} className="w-1.5 h-6 bg-gradient-to-t from-[#451a03] to-[#78350f] rounded-t border-t border-amber-500" />
                            ))}
                          </div>
                          {/* Campfire */}
                          <div className="text-sm animate-[pulse_1s_infinite]">🔥</div>
                          <div className="flex gap-0.5">
                            {[1, 2, 3, 4].map(i => (
                              <div key={i} className="w-1.5 h-6 bg-gradient-to-t from-[#451a03] to-[#78350f] rounded-t border-t border-amber-500" />
                            ))}
                          </div>
                        </div>

                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* 2. Mông Nguyên Warlord Base Camp (East Rear at 11, 3) */}
              {(() => {
                const { x, y, surfaceZ } = getHexSurfacePosition(11, 3, 'fort');
                return (
                  <div
                    key="base-enemy"
                    className="absolute pointer-events-none"
                    style={{ left: x, top: y, width: 0, height: 0, transform: `translateZ(${surfaceZ}px)`, transformStyle: 'preserve-3d', zIndex: Math.round(y) - 20 }}
                  >
                    {/* Ground Contact Shadow */}
                    <div 
                      className="absolute pointer-events-none"
                      style={{ 
                        width: 120, height: 48, left: -60, top: -24,
                        borderRadius: '50%',
                        background: 'radial-gradient(ellipse at center, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.25) 55%, transparent 80%)'
                      }} 
                    />

                    {/* Upright Camp Structure (90° Perpendicular) */}
                    <div
                      style={{
                        position: 'absolute',
                        left: 0,
                        top: 0,
                        width: 110,
                        height: 100,
                        marginLeft: -55,
                        marginTop: -100,
                        transformOrigin: '50% 100%',
                        transform: `rotateZ(${-camera.yaw}deg) rotateX(-90deg) scale(1.3)`,
                        transformStyle: 'preserve-3d'
                      }}
                    >
                      <div className="relative w-full h-full flex flex-col items-center justify-end select-none" style={{ transformStyle: 'preserve-3d' }}>
                        
                        {/* Main Headquarters Yurt (Đại Hãn Trướng Mông Cổ) */}
                        <div className="relative w-24 h-20 flex flex-col items-center" style={{ transformStyle: 'preserve-3d' }}>
                          {/* Top Crown Wheel / Vent (Toono) */}
                          <div className="w-8 h-3 bg-[#b45309] rounded-full border border-amber-300 shadow-sm flex items-center justify-center">
                            <span className="text-[7px]">⚡</span>
                          </div>
                          {/* Round Felt Dome Roof */}
                          <div className="w-26 h-9 bg-gradient-to-b from-[#f1f5f9] via-[#e2e8f0] to-[#cbd5e1] rounded-t-[50%] border-t-2 border-[#b45309] shadow-md flex items-center justify-center -mt-1">
                            <div className="w-20 h-0.5 bg-[#78350f] opacity-40" />
                          </div>
                          
                          {/* Felt Wall Cylinder & Ornate Entrance */}
                          <div className="w-22 h-9 bg-[#e2e8f0] border-x-4 border-[#334155] border-b-2 border-[#1e293b] flex flex-col items-center justify-end p-0.5">
                            <div className="w-8 h-8 bg-gradient-to-b from-[#881337] to-[#4c0519] border-t-2 border-x-2 border-amber-400 rounded-t flex items-center justify-center text-[10px] text-amber-300 font-bold">
                              元
                            </div>
                          </div>
                        </div>

                        {/* Left Mongol Tug Banner (Cờ Đuôi Ngựa) */}
                        <div className="absolute -left-3 bottom-0 flex flex-col items-center" style={{ transform: 'translateZ(8px)' }}>
                          <div className="w-1 h-24 bg-[#1e293b]" />
                          <div className="absolute top-1 left-1 w-7 h-16 bg-[#881337] border-2 border-red-500 rounded-br flex flex-col items-center justify-center shadow-lg animate-[pulse_2.2s_infinite]">
                            <span className="text-[7px] text-amber-200 font-serif font-black leading-tight">MÔNG</span>
                            <span className="text-[7px] text-amber-200 font-serif font-black leading-tight">CỔ</span>
                          </div>
                        </div>

                        {/* Right Mongol Standard Banner */}
                        <div className="absolute -right-3 bottom-0 flex flex-col items-center" style={{ transform: 'translateZ(8px)' }}>
                          <div className="w-1 h-24 bg-[#1e293b]" />
                          <div className="absolute top-1 right-1 w-7 h-16 bg-slate-900 border-2 border-amber-400 rounded-bl flex flex-col items-center justify-center shadow-lg animate-[pulse_2s_infinite]">
                            <span className="text-[7px] text-amber-200 font-serif font-black leading-tight">NGUYÊN</span>
                            <span className="text-[7px] text-amber-200 font-serif font-black leading-tight">TRƯỚNG</span>
                          </div>
                        </div>

                        {/* Spiked Nomad Barricade & Campfire */}
                        <div className="absolute -bottom-1 w-28 flex items-end justify-between px-2" style={{ transform: 'translateZ(14px)' }}>
                          <div className="flex gap-0.5">
                            {[1, 2, 3, 4].map(i => (
                              <div key={i} className="w-1.5 h-6 bg-gradient-to-t from-[#1e293b] to-[#475569] rounded-t border-t border-red-500" />
                            ))}
                          </div>
                          {/* Campfire */}
                          <div className="text-sm animate-[pulse_1s_infinite]">🔥</div>
                          <div className="flex gap-0.5">
                            {[1, 2, 3, 4].map(i => (
                              <div key={i} className="w-1.5 h-6 bg-gradient-to-t from-[#1e293b] to-[#475569] rounded-t border-t border-red-500" />
                            ))}
                          </div>
                        </div>

                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* UNITS */}
              {units.map((unit) => {
                const isSelected = unit.unit_id === selectedUnitId;
                const tile = hexAt(unit.col, unit.row);
                const surfaceZ = getHexSurfaceHeight(tile?.terrain);
                return (
                  <UnitEntity 
                    key={unit.unit_id}
                    cameraPitch={camera.pitch} 
                    cameraYaw={camera.yaw}
                    unit={unit}
                    surfaceZ={surfaceZ}
                    isSelected={isSelected}
                    onSelect={() => handleSelectHex(unit.col, unit.row)}
                    actionEvents={actionEvents}
                  />
                );
              })}

              {/* EFFECTS (Damage popups) */}
              {popups.map(p => {
                const { x, y } = hexToPixel(p.col, p.row);
                return (
                  <div 
                    key={p.id}
                    className="absolute pointer-events-none font-bold font-display text-4xl drop-shadow-[0_4px_4px_rgba(0,0,0,1)] z-50 animate-[dmg-float_1.2s_ease-out_forwards]"
                    style={{ left: x, top: y, color: p.color, zIndex: 9999 }}
                  >
                    -{p.dmg}
                  </div>
                )
              })}

            </div>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* UI OVERLAYS (HUD) */}
      {/* ------------------------------------------------------------------ */}
      
      {/* Vignette Overlay for atmosphere */}
      <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_150px_rgba(0,0,0,0.9)] z-30" />

      {/* Top HUD */}
      <div className="absolute top-0 left-0 right-0 p-4 pointer-events-none flex justify-between items-start z-40">
        <div className="flex flex-col gap-2 pointer-events-auto">
          <div className="flex items-center bg-gradient-to-r from-[#1a0f0a]/90 to-black/80 border border-[#8b744f] rounded-full p-1.5 pr-6 backdrop-blur-md shadow-lg">
             <div className="w-11 h-11 rounded-full border-2 border-[#C9A44C] overflow-hidden bg-blue-950 shrink-0">
               {faction.image ? <img src={faction.image} alt="Faction" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-white font-serif font-bold">ĐV</div>}
             </div>
             <div className="ml-3">
               <div className="text-[#C9A44C] font-bold font-serif text-sm uppercase leading-none tracking-wide">{faction.name || 'Đại Việt'}</div>
               <div className="flex items-center gap-2 mt-1">
                 <div className="w-16 h-1.5 bg-black/50 rounded-full overflow-hidden">
                   <div className="h-full bg-emerald-500" style={{ width: `${(playerPower/maxPlayerPower)*100}%` }} />
                 </div>
                 <span className="text-[10px] text-white font-mono">{playerPower}</span>
               </div>
             </div>
          </div>
          <button 
            onClick={onExitBattle} 
            className="self-start flex items-center gap-1.5 bg-[#0a151e]/85 hover:bg-[#132838] border border-[#8b744f]/60 px-3.5 py-1.5 rounded-full text-[10px] text-[#F3E5AB] font-serif font-bold uppercase tracking-widest transition-all backdrop-blur-md shadow-md hover:scale-105 active:scale-95"
          >
            <ArrowLeft className="w-3 h-3 text-[#C9A44C]" /> Rút lui
          </button>
        </div>

        <div className="pointer-events-auto flex items-center justify-end bg-gradient-to-l from-[#2a0f0a]/90 to-black/80 border border-[#8b744f] rounded-full p-1.5 pl-6 backdrop-blur-md shadow-lg">
           <div className="mr-3 text-right">
             <div className="text-red-400 font-bold font-serif text-sm uppercase leading-none tracking-wide">Mông Nguyên</div>
             <div className="flex items-center justify-end gap-2 mt-1">
               <span className="text-[10px] text-white font-mono">{enemyPower}</span>
               <div className="w-16 h-1.5 bg-black/50 rounded-full overflow-hidden flex justify-end">
                 <div className="h-full bg-red-500 w-full" />
               </div>
             </div>
           </div>
           <div className="w-11 h-11 rounded-full border-2 border-red-600 bg-red-950 flex items-center justify-center shrink-0">
             <Swords className="w-5 h-5 text-red-300" />
           </div>
        </div>
      </div>

      {/* TOP-CENTER: COLLAPSIBLE BẠCH ĐẰNG 1288 HEADER */}
      {/* 1. Full Battle Header Panel */}
      <div 
        className="fixed top-0 left-1/2 z-50 flex flex-col items-center"
        style={{
          transform: battleHeaderVisible ? 'translate(-50%, 0)' : 'translate(-50%, -105%)',
          opacity: battleHeaderVisible ? 1 : 0,
          pointerEvents: battleHeaderVisible ? 'auto' : 'none',
          visibility: battleHeaderVisible ? 'visible' : 'hidden',
          transition: 'transform 220ms ease, opacity 180ms ease, visibility 220ms',
        }}
      >
        <div className="flex flex-col items-center bg-gradient-to-b from-[#1a0f0a]/95 to-black/90 border-b border-x border-[#8b744f] rounded-b-2xl px-10 pt-3 pb-2.5 shadow-2xl backdrop-blur-md select-none">
          <h2 className="text-[#F3E5AB] font-bold font-serif text-xl uppercase tracking-widest drop-shadow-md">Bạch Đằng 1288</h2>
          <div className={`text-xs font-bold mt-1 ${turnSide === 'player' ? 'text-emerald-400' : 'text-red-400 animate-pulse'}`}>
            {turnSide === 'player' ? 'Quân ta đang hành động' : 'Địch đang điều binh...'}
          </div>
          <div className="mt-2 flex items-center gap-2 bg-[#0a1e2d] border border-[#1a5c6b] px-3 py-1 rounded-full shadow-inner">
            <Waves className={`w-3.5 h-3.5 ${tideTurnsLeft <= 1 ? 'text-blue-300' : 'text-cyan-400'}`} />
            <span className="text-[10px] font-bold text-cyan-200 uppercase tracking-wider">Thủy triều {tideTurnsLeft <= 1 ? 'cạn' : 'đang rút'}</span>
            <div className="flex gap-0.5 ml-1">
              {[1, 2, 3].map(i => <div key={i} className={`w-2 h-2 rounded-full ${i <= tideTurnsLeft ? 'bg-cyan-400' : 'bg-slate-700'}`} />)}
            </div>
          </div>

          {/* Toggle Collapse Button at bottom center */}
          <button
            type="button"
            onClick={toggleBattleHeader}
            title="Ẩn thông tin trận đấu"
            className="mt-2.5 -mb-1 px-4 py-1 flex items-center gap-1.5 text-[10px] text-[#C9A44C] hover:text-[#F3E5AB] bg-black/50 hover:bg-[#8b744f]/30 border border-[#8b744f]/50 hover:border-[#C9A44C] rounded-full transition-all cursor-pointer shadow-sm active:scale-95"
          >
            <span className="font-serif font-bold tracking-wider uppercase">Ẩn</span>
            <ChevronUp className="w-3.5 h-3.5 text-[#C9A44C]" />
          </button>
        </div>
      </div>

      {/* 2. Hidden Header Toggle Button ("HIỆN ▼") */}
      <div
        className="fixed top-2 left-1/2 z-50 flex items-center justify-center"
        style={{
          transform: battleHeaderVisible ? 'translate(-50%, -45px)' : 'translate(-50%, 0)',
          opacity: battleHeaderVisible ? 0 : 1,
          pointerEvents: battleHeaderVisible ? 'none' : 'auto',
          visibility: battleHeaderVisible ? 'hidden' : 'visible',
          transition: 'transform 220ms ease, opacity 180ms ease, visibility 220ms',
        }}
      >
        <button
          type="button"
          onClick={toggleBattleHeader}
          title="Hiện thông tin trận đấu"
          className="flex items-center gap-1.5 bg-gradient-to-b from-[#1a0f0a]/95 to-black/90 hover:bg-[#2a1810] border border-[#8b744f] hover:border-[#C9A44C] rounded-full px-4 py-1.5 text-[#C9A44C] hover:text-[#F3E5AB] shadow-2xl backdrop-blur-md cursor-pointer transition-all active:scale-95 select-none"
        >
          <span className="text-[10px] font-serif font-bold uppercase tracking-wider">Hiện thông tin</span>
          <ChevronDown className="w-3.5 h-3.5 text-[#C9A44C] animate-bounce" />
        </button>
      </div>

      {/* Bottom HUD */}
      <div className="absolute bottom-0 left-0 right-0 p-4 pointer-events-none flex justify-between items-end z-40">
        
        {/* BOTTOM-LEFT: LỢI THẾ & NHẬT KÝ CHIẾN TRƯỜNG */}
        <div 
          className="pointer-events-auto w-[290px] rounded-xl p-3.5 shadow-2xl transition-all"
          style={{
            background: 'rgba(5, 10, 15, 0.40)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            border: '1px solid rgba(180, 140, 60, 0.45)',
          }}
        >
          {/* Header & Percentage */}
          <div className="flex justify-between items-center pb-2 border-b border-[#8b744f]/30">
            <div className="flex items-center gap-1.5">
              <span className="text-xs">⚖</span>
              <span className="text-[11px] uppercase text-[#C9A44C] font-serif font-bold tracking-wider">Lợi Thế</span>
            </div>
            <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30">
              +{Math.round((playerPower / (playerPower + enemyPower + 1)) * 100)}%
            </span>
          </div>

          {/* Dual Ratio Bar: Đại Việt vs Mông Cổ */}
          <div className="w-full h-2 bg-black/60 rounded-full overflow-hidden flex border border-[#8b744f]/30 my-2.5">
            <div 
              className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 transition-all duration-300" 
              style={{ width: `${Math.round((playerPower / (playerPower + enemyPower + 1)) * 100)}%` }} 
            />
            <div 
              className="h-full bg-gradient-to-r from-red-500 to-red-700 transition-all duration-300" 
              style={{ width: `${100 - Math.round((playerPower / (playerPower + enemyPower + 1)) * 100)}%` }} 
            />
          </div>

          {/* Subheader: Nhật ký chiến trường */}
          <div className="flex items-center justify-between text-[9px] uppercase text-slate-400 tracking-widest font-semibold pb-1 border-b border-[#8b744f]/20 mb-1.5">
            <span>Nhật ký chiến trường</span>
            <span className="text-[8px] text-slate-500 font-mono">LIVE</span>
          </div>

          {/* Scrollable battle log */}
          <div className="space-y-1.5 max-h-28 overflow-y-auto pr-1">
            {log.length === 0 ? (
              <div className="text-[10px] text-slate-500 italic py-1">Trận chiến vừa bắt đầu...</div>
            ) : (
              log.map((entry, i) => (
                <div 
                  key={i} 
                  className={`text-[10px] leading-tight transition-opacity ${
                    i === 0 ? 'text-[#F3E5AB] font-medium' : 'text-slate-400 opacity-80'
                  }`}
                >
                  {entry}
                </div>
              ))
            )}
          </div>
        </div>

        {/* BOTTOM-CENTER: AUTO BATTLE CONTROLS & MANUAL ACTIONS */}
        <div className="pointer-events-auto flex flex-col items-center justify-end pb-1">
          <div className="flex bg-[#0c1a24]/90 border border-[#8b744f] rounded-full p-1.5 shadow-2xl backdrop-blur-md gap-1">
             <button 
               onClick={() => setIsAuto(!isAuto)} 
               className={`px-4 py-2 rounded-full text-xs font-bold font-serif uppercase tracking-widest transition-colors ${
                 isAuto 
                   ? 'bg-gradient-to-r from-emerald-700 to-emerald-900 text-white shadow-[0_0_10px_rgba(16,185,129,0.5)]' 
                   : 'bg-black/50 text-slate-400 hover:text-white'
               }`}
             >
                AUTO {isAuto && '●'}
             </button>
             
             <div className="w-px bg-[#8b744f]/50 mx-1 my-1" />
             
             <select 
               value={strategy}
               onChange={e => setStrategy(e.target.value as any)}
               className="appearance-none bg-black/50 hover:bg-black text-[#C9A44C] border border-transparent hover:border-[#8b744f]/50 rounded-full px-4 py-2 text-xs font-bold uppercase tracking-wider text-center cursor-pointer outline-none"
             >
               <option value="balanced">⚖ Cân Bằng</option>
               <option value="aggressive">⚔ Tấn Công</option>
               <option value="defensive">🛡 Phòng Thủ</option>
             </select>

             <div className="w-px bg-[#8b744f]/50 mx-1 my-1" />

             {[1, 2, 4].map(s => (
               <button 
                 key={s} 
                 onClick={() => setBattleSpeed(s)} 
                 className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                   battleSpeed === s 
                     ? 'bg-[#8b5e24] text-white border border-[#C9A44C]' 
                     : 'bg-black/50 text-slate-400 hover:text-white border border-transparent hover:border-[#8b744f]/50'
                 }`}
               >
                 ×{s}
               </button>
             ))}

             <button 
               onClick={() => setIsPaused(!isPaused)} 
               className={`w-10 h-10 ml-1 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                 isPaused 
                   ? 'bg-red-800 text-white border border-red-400 animate-pulse' 
                   : 'bg-black/50 text-slate-400 hover:text-white border border-transparent hover:border-[#8b744f]/50'
               }`}
             >
               ⏸
             </button>
          </div>
          
          {!isAuto && selectedUnit && selectedUnit.side === 'player' && turnSide === 'player' && !battleResult && (
             <div className="flex gap-2 mt-3 animate-in slide-in-from-bottom-2">
               {ACTIONS.map(action => {
                  const isActive = activeAction === action.key;
                  return (
                    <button 
                      key={action.key} 
                      onClick={() => handleAction(action.key)} 
                      className={`px-4 py-1.5 rounded text-[10px] uppercase font-bold flex items-center gap-1.5 border transition-colors ${
                        isActive 
                          ? 'bg-[#8b5e24] text-white border-[#C9A44C]' 
                          : 'bg-black/80 text-slate-300 border-slate-700 hover:bg-slate-800'
                      }`}
                    >
                      {action.label}
                    </button>
                  );
               })}
               <button onClick={advanceTurn} className="px-4 py-1.5 rounded text-[10px] uppercase font-bold border border-slate-700 bg-black/60 text-slate-400 hover:text-white hover:bg-slate-800 ml-2">
                 Qua Lượt
               </button>
             </div>
          )}
        </div>

        {/* BOTTOM-RIGHT: THÔNG TIN (SELECTED UNIT & HEX) + BATTLE SETTLEMENT */}
        <div className="pointer-events-auto flex flex-col items-end gap-3 w-64">
          <div className="bg-gradient-to-br from-[#1c140f]/95 to-black/95 border border-[#8b744f] rounded-xl overflow-hidden shadow-xl backdrop-blur-md w-full">
            <div className="bg-[#2a1810] px-3 py-1.5 border-b border-[#8b744f]/50 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <MousePointer2 className="w-3.5 h-3.5 text-[#C9A44C]" />
                <span className="text-[10px] uppercase text-[#C9A44C] font-bold tracking-wider">Thông Tin</span>
              </div>
              {selectedUnit && (
                <span className={`text-[9px] px-1.5 py-0.2 rounded font-mono ${selectedUnit.side === 'player' ? 'text-blue-300 bg-blue-950/80 border border-blue-800' : 'text-red-300 bg-red-950/80 border border-red-800'}`}>
                  {selectedUnit.side === 'player' ? 'Đại Việt' : 'Mông Cổ'}
                </span>
              )}
            </div>
            <div className="p-3">
              {selectedUnit ? (
                <>
                  <div className="flex gap-3 items-center mb-3">
                    <div className={`w-12 h-12 rounded flex items-center justify-center border-2 ${selectedUnit.side === 'player' ? 'border-blue-500/50 bg-blue-900/30' : 'border-red-500/50 bg-red-900/30'} shrink-0`}>
                      <span className="text-xl">
                        {selectedUnit.icon === 'commander' ? '👑' : selectedUnit.icon === 'spear' ? '⚔' : selectedUnit.icon === 'archer' ? '🏹' : selectedUnit.icon === 'elephant' ? '🐘' : '🐎'}
                      </span>
                    </div>
                    <div>
                      <div className="font-serif font-bold text-white text-sm leading-tight flex items-center gap-1">
                        {selectedUnit.name}
                        {selectedUnit.is_commander && <span className="text-[10px] text-amber-300">👑</span>}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        {selectedUnit.is_commander ? 'Chủ Tướng Chỉ Huy' : `${selectedUnit.side === 'player' ? 'Đại Việt' : 'Địch'} • Binh chủng`}
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[10px]">
                    <div className="bg-black/40 rounded px-2 py-1 flex justify-between border border-slate-800"><span className="text-slate-500">HP</span><span className="text-emerald-400 font-bold font-mono">{selectedUnit.stats.at}</span></div>
                    <div className="bg-black/40 rounded px-2 py-1 flex justify-between border border-slate-800"><span className="text-slate-500">ATK</span><span className="text-red-400 font-bold font-mono">{selectedUnit.stats.atk}</span></div>
                    <div className="bg-black/40 rounded px-2 py-1 flex justify-between border border-slate-800"><span className="text-slate-500">DEF</span><span className="text-blue-400 font-bold font-mono">{selectedUnit.stats.def}</span></div>
                    <div className="bg-black/40 rounded px-2 py-1 flex justify-between border border-slate-800"><span className="text-slate-500">LĐ</span><span className="text-amber-400 font-bold font-mono">{selectedUnit.stats.asTk}</span></div>
                  </div>
                </>
              ) : <div className="text-xs text-slate-500 text-center py-4">Chưa chọn đơn vị</div>}
            </div>
            {selectedTile && (
              <div className="bg-black/60 p-2 border-t border-[#8b744f]/30">
                <div className="flex justify-between items-center text-[10px]">
                  <span className="text-slate-400">Địa hình: <span className="text-white font-bold">{TERRAIN_NAME_VI[selectedTile.terrain]}</span></span>
                </div>
                {selectedTile.effect && <div className="text-[9px] text-[#C9A44C] mt-0.5 leading-tight">{selectedTile.effect}</div>}
              </div>
            )}
          </div>

          {battleResult || settlementError ? (
            <div className="bg-black/90 border border-[#8b744f] p-3 rounded-xl w-full backdrop-blur-md shadow-[0_0_20px_rgba(201,164,76,0.3)] text-center animate-in zoom-in-95">
               {battleResult && (
                 <>
                   <div className={`font-serif font-bold text-lg mb-2 ${battleResult.victory ? 'text-emerald-400' : 'text-red-400'}`}>{battleResult.victory ? 'ĐẠI THẮNG' : 'THẤT BẠI'}</div>
                   <div className="text-[10px] text-slate-400 mb-3">Thời gian: {(log.length * 1.5).toFixed(1)}s</div>
                   
                   <div className="bg-[#1a2e1d] border border-emerald-900 rounded p-2 mb-3">
                      <div className="text-[10px] text-emerald-400 uppercase font-bold mb-1 border-b border-emerald-800/50 pb-1">Phần Thưởng</div>
                      {rewardClaim && <div className="text-[11px] font-bold text-[#F3E5AB]">+5 HKDV</div>}
                      <div className="text-[11px] text-emerald-200">+100 Exp</div>
                   </div>
                   <button onClick={onExitBattle} className="w-full py-2 bg-gradient-to-r from-[#8b5e24] to-[#C9A44C] hover:brightness-110 text-black text-xs font-bold uppercase tracking-widest rounded shadow-lg transition-all">Rời chiến trường</button>
                 </>
               )}
               {settlementError && <div className="text-xs text-red-400">{settlementError}</div>}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};

