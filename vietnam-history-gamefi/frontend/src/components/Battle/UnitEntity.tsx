import React, { useEffect, useRef, useState } from 'react';
import { BattleUnit } from '../../types';
import { hexToPixel } from '../../utils/hexGrid';
import { UnitVisual } from './UnitVisual';

interface UnitEntityProps {
  unit: BattleUnit;
  isSelected: boolean;
  onSelect: (unit: BattleUnit) => void;
  actionEvents: { id: number; attackerId: string; targetId: string; type: string }[];
  cameraPitch?: number;
  cameraYaw?: number;
  surfaceZ?: number;
}

/**
 * UnitEntity — 90° Upright Perpendicular Model
 * 
 * MODEL ARCHITECTURE:
 *   CharacterRoot (at hex tile center x, y, surfaceZ)
 *     ├── Ground Plane: Contact Shadow (flat on terrain)
 *     ├── Ground Plane: Selection Ring (flat on terrain)
 *     └── Upright Model (stands 90° perpendicular to ground plane)
 *           ├── Banner / Flag (vertical)
 *           ├── Floating Health Bar (above head)
 *           └── UnitVisual (3D layered character)
 * 
 * ORIENTATION MATHEMATICS:
 *   - Ground plane = board surface (X-Y plane of BattlefieldRoot)
 *   - Ground normal = +Z axis (pointing straight up from the board)
 *   - Local model head points in -Y; feet are at bottom (50% 100%)
 *   - rotateX(-90deg) maps local -Y to +Z (head points straight UP at 90°)
 *   - rotateZ(-cameraYaw) rotates around the vertical spine to face camera horizontally
 *   - pitch = 0, roll = 0 relative to ground normal (strictly upright)
 *   - transformOrigin: '50% 100%' guarantees feet stay planted exactly on the terrain tile
 */

export const UnitEntity: React.FC<UnitEntityProps> = ({ 
  unit, 
  isSelected, 
  onSelect, 
  actionEvents, 
  cameraPitch = 50, 
  cameraYaw = 35,
  surfaceZ = 0
}) => {
  const { x, y } = hexToPixel(unit.col, unit.row);
  const prevPos = useRef({ x, y });
  const [isMoving, setIsMoving] = useState(false);
  const [isAttacking, setIsAttacking] = useState(false);
  const [facing, setFacing] = useState<number>(unit.side === 'player' ? 1 : -1);

  // Handle movement detection and facing
  useEffect(() => {
    const prevX = prevPos.current.x;
    const prevY = prevPos.current.y;
    
    if (prevX !== x || prevY !== y) {
      setIsMoving(true);
      const dx = x - prevX;
      if (dx !== 0) setFacing(dx > 0 ? 1 : -1);
      
      const timer = setTimeout(() => {
        setIsMoving(false);
        prevPos.current = { x, y };
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [x, y]);

  // Handle attack animations
  useEffect(() => {
    const attackEvent = actionEvents.find(e => e.attackerId === unit.unit_id);
    if (attackEvent) {
      setIsAttacking(true);
      const timer = setTimeout(() => {
        setIsAttacking(false);
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [actionEvents, unit.unit_id]);

  const isPlayer = unit.side === 'player';
  const isCommander = unit.icon === 'commander' || !!unit.is_commander;
  const healthPercent = unit.stats.at / 180;

  return (
    <div
      className="absolute pointer-events-auto cursor-pointer group transition-all duration-500 ease-out"
      style={{ 
        left: x, 
        top: y, 
        width: 0,
        height: 0,
        transform: surfaceZ !== 0 ? `translateZ(${surfaceZ}px)` : undefined,
        transformStyle: 'preserve-3d',
        zIndex: Math.round(y) + 100 
      }}
      onClick={(e) => { e.stopPropagation(); onSelect(unit); }}
    >
      {/* ======================================================== */}
      {/* 1. GROUND PLANE ELEMENTS (Flat on hex tile at ground Z=0) */}
      {/* ======================================================== */}
      
      {/* Contact Shadow — grounded directly under the feet / mount */}
      <div 
        className="absolute pointer-events-none"
        style={{ 
          width: isCommander ? 60 : 50,
          height: isCommander ? 28 : 24,
          left: isCommander ? -30 : -25,
          top: isCommander ? -14 : -12,
          borderRadius: '50%',
          background: 'radial-gradient(ellipse at center, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0.25) 50%, transparent 80%)',
        }} 
      />

      {/* Selection Ring (flat on terrain) */}
      {isSelected && (
        <div 
          className="absolute pointer-events-none animate-[spin_6s_linear_infinite]"
          style={{ 
            width: isCommander ? 84 : 76,
            height: isCommander ? 84 : 76,
            left: isCommander ? -42 : -38,
            top: isCommander ? -42 : -38,
            borderRadius: '50%',
            border: isCommander ? '2.5px dashed #F59E0B' : '2px dashed #F3E5AB',
            opacity: 0.8,
          }} 
        />
      )}

      {/* ======================================================== */}
      {/* 2. UPRIGHT MODEL (90° Perpendicular to Ground Plane)    */}
      {/* ======================================================== */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          width: 64,
          height: 96,
          marginLeft: -32,
          marginTop: -96,
          transformOrigin: '50% 100%', // Pivot is precisely at the feet (bottom center)
          transform: `rotateZ(${-cameraYaw}deg) rotateX(-90deg) scale(${isCommander ? 1.35 : 1.25})`,
          transformStyle: 'preserve-3d',
        }}
      >
        <div 
          className={`relative w-full h-full flex flex-col items-center justify-end transition-transform duration-300 ${isSelected ? 'scale-105' : ''}`}
          style={{ transformStyle: 'preserve-3d' }}
        >
          {/* Banner / Flag (Vertical pole, attached to unit) */}
          <div 
            className={`absolute ${isCommander ? '-left-6 -top-12 w-8 h-22' : '-left-5 -top-10 w-6 h-20'} flex flex-col items-center pointer-events-none`} 
            style={{ transform: 'translateZ(10px)', transformStyle: 'preserve-3d' }}
          >
             <div className={`w-1 h-full ${isPlayer ? 'bg-amber-800' : 'bg-slate-800'}`} />
             <div 
               className={`absolute top-0 left-1 ${isCommander ? 'w-8 h-15 border-2 border-amber-400' : 'w-7 h-14 border border-white/20'} ${isPlayer ? 'bg-blue-700' : 'bg-red-800'} rounded-br origin-top animate-[pulse_2s_infinite] flex flex-col items-center shadow-lg`} 
               style={{ transform: 'skewY(8deg)' }}
             >
               {isCommander ? (
                 <>
                   <span className="text-[8px] text-[#FDE047] font-extrabold font-serif">{isPlayer ? 'TIẾT' : 'VẠN'}</span>
                   <span className="text-[8px] text-[#FDE047] font-extrabold font-serif -mt-1">{isPlayer ? 'CHẾ' : 'HỘ'}</span>
                 </>
               ) : (
                 <>
                   <span className="text-[9px] text-[#F3E5AB] font-bold font-serif">{isPlayer ? 'ĐẠI' : 'MÔNG'}</span>
                   <span className="text-[9px] text-[#F3E5AB] font-bold font-serif -mt-1">{isPlayer ? 'VIỆT' : 'NGUYÊN'}</span>
                 </>
               )}
             </div>
          </div>

          {/* Commander Crown Indicator 👑 */}
          {isCommander && (
            <div 
              className="absolute -top-7 left-1/2 -translate-x-1/2 text-sm pointer-events-none select-none animate-[bounce_1.5s_infinite]"
              style={{ transform: 'translateZ(20px)' }}
            >
              👑
            </div>
          )}

          {/* Floating Health Bar (Above character head) */}
          <div 
            className="absolute -top-3 left-1/2 -translate-x-1/2 w-14 h-1.5 bg-black/90 rounded overflow-hidden border border-slate-700 pointer-events-none" 
            style={{ transform: 'translateZ(16px)' }}
          >
             <div 
               className={`h-full transition-all duration-300 ${isPlayer ? 'bg-emerald-500' : 'bg-red-500'}`} 
               style={{ width: `${Math.min(100, healthPercent * 100)}%` }} 
             />
          </div>

          {/* 3D Layered Character Visual */}
          <UnitVisual 
            unit={unit} 
            isPlayer={isPlayer} 
            isMoving={isMoving} 
            isAttacking={isAttacking} 
            facing={facing} 
          />
        </div>
      </div>
    </div>
  );
};
