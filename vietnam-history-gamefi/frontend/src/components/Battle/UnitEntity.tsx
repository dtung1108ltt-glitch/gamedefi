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
}

export const UnitEntity: React.FC<UnitEntityProps> = ({ unit, isSelected, onSelect, actionEvents, cameraPitch = 50, cameraYaw = 0 }) => {
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
      }, 500); // match transition duration
      return () => clearTimeout(timer);
    }
  }, [x, y]);

  // Handle attack animations
  useEffect(() => {
    // Find if this unit just attacked
    const attackEvent = actionEvents.find(e => e.attackerId === unit.unit_id);
    if (attackEvent) {
      setIsAttacking(true);
      // Face the target temporarily? (Too complex without target coords, just rely on attack anim)
      const timer = setTimeout(() => {
        setIsAttacking(false);
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [actionEvents, unit.unit_id]);

  const isPlayer = unit.side === 'player';
  const healthPercent = unit.stats.at / 150;
  
  // TILT_ANGLE is 50 from BattleScreen.
  return (
    <div
      className={`absolute flex flex-col items-center justify-end pointer-events-auto cursor-pointer group transition-all duration-500 ease-out`}
      style={{ 
        left: x, top: y, 
        transform: `translate(-50%, -100%) rotateZ(${-cameraYaw}deg) rotateX(${-cameraPitch}deg) scale(1.3)`, 
        transformOrigin: 'bottom center', 
        zIndex: Math.round(y) + 100 
      }}
      onClick={(e) => { e.stopPropagation(); onSelect(unit); }}
    >
      {/* Formation / Selection Aura (Ground level) */}
      {isSelected && (
        <div className="absolute bottom-0 w-24 h-24 border-2 border-dashed border-[#F3E5AB] rounded-full opacity-60 animate-[spin_4s_linear_infinite]" style={{ transform: `translateY(40%) rotateX(${cameraPitch}deg)` }} />
      )}
      
      <div className={`relative flex flex-col items-center transition-transform duration-300 ${isSelected ? 'scale-110 drop-shadow-[0_0_15px_rgba(251,191,36,0.5)]' : 'drop-shadow-2xl'}`}>
        
        {/* Banner (Moves with the unit) */}
        <div className="absolute -left-6 -top-12 w-6 h-20 flex flex-col items-center pointer-events-none" style={{ transform: 'translateZ(15px)' }}>
           <div className={`w-1 h-full ${isPlayer ? 'bg-amber-800' : 'bg-slate-800'}`} />
           <div className={`absolute top-0 left-1 w-7 h-14 ${isPlayer ? 'bg-blue-700' : 'bg-red-800'} rounded-br border border-white/20 shadow-lg origin-top animate-[pulse_2s_infinite] flex flex-col items-center`} style={{ transform: 'skewY(10deg)' }}>
             <span className="text-[9px] text-[#F3E5AB] font-bold font-serif drop-shadow-md">{isPlayer ? 'ĐẠI' : 'MÔNG'}</span>
             <span className="text-[9px] text-[#F3E5AB] font-bold font-serif drop-shadow-md -mt-1">{isPlayer ? 'VIỆT' : 'NGUYÊN'}</span>
           </div>
        </div>

        {/* Floating Health Bar */}
        <div className="mb-2 w-14 h-1.5 bg-black/90 rounded overflow-hidden shadow-lg border border-slate-700 pointer-events-none" style={{ transform: 'translateZ(20px)' }}>
           <div className={`h-full transition-all duration-300 ${isPlayer ? 'bg-emerald-500' : 'bg-red-500'}`} style={{ width: `${healthPercent * 100}%` }} />
        </div>

        {/* The 2.5D/3D Unit Visual */}
        <UnitVisual 
          unit={unit} 
          isPlayer={isPlayer} 
          isMoving={isMoving} 
          isAttacking={isAttacking} 
          facing={facing} 
        />
        
      </div>
    </div>
  );
};
