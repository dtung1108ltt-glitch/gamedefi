import { useEffect, useRef } from 'react';
import { BattleUnit, HexTile } from '../../../types';
import { eventBus } from '../../../services/eventBus';
import { hexToPixel } from '../../../utils/hexGrid';

// Mock pathfinding and distance
const hexDistance = (a: {col: number, row: number}, b: {col: number, row: number}) => {
  const dx = Math.abs(a.col - b.col);
  const dy = Math.abs(a.row - b.row);
  return Math.max(dx, dy); 
};

interface AutoBattleConfig {
  isAuto: boolean;
  speedMultiplier: number;
  strategy: 'aggressive' | 'defensive' | 'balanced';
  units: BattleUnit[];
  turnSide: 'player' | 'enemy';
  hexes: HexTile[];
  tideTurnsLeft: number;
  setUnits: (updateFn: (prev: BattleUnit[]) => BattleUnit[]) => void;
  setActionEvents: (updateFn: (prev: any[]) => any[]) => void;
  showDamage: (col: number, row: number, dmg: number, color: string) => void;
  pushLog: (msg: string) => void;
  endTurn: () => void;
  focusOnCombat: (x: number, y: number) => void;
}

export const useAutoBattle = (config: AutoBattleConfig) => {
  const {
    isAuto, speedMultiplier, strategy, units, turnSide, hexes, tideTurnsLeft,
    setUnits, setActionEvents, showDamage, pushLog, endTurn, focusOnCombat
  } = config;

  const stateRef = useRef({ units, turnSide, tideTurnsLeft });
  
  useEffect(() => {
    stateRef.current = { units, turnSide, tideTurnsLeft };
  }, [units, turnSide, tideTurnsLeft]);

  useEffect(() => {
    const isAITurn = turnSide === 'enemy' || (turnSide === 'player' && isAuto);
    if (!isAITurn) return;

    const baseDelay = 1000 / speedMultiplier;
    
    const timer = setTimeout(() => {
      executeAITurn();
    }, baseDelay);

    return () => clearTimeout(timer);
  }, [isAuto, turnSide, speedMultiplier]);

  const executeAITurn = () => {
    const { units: currentUnits, turnSide: currentSide, tideTurnsLeft: currentTide } = stateRef.current;
    
    const myUnits = currentUnits.filter(u => u.side === currentSide && u.stats.at > 0);
    const enemyUnits = currentUnits.filter(u => u.side !== currentSide && u.stats.at > 0);

    if (myUnits.length === 0 || enemyUnits.length === 0) return;

    const activeUnit = myUnits[Math.floor(Math.random() * myUnits.length)];

    let bestTarget = enemyUnits[0];
    let minDistance = Infinity;

    enemyUnits.forEach(enemy => {
      const dist = hexDistance(activeUnit, enemy);
      if (dist < minDistance) {
        minDistance = dist;
        bestTarget = enemy;
      }
    });

    const attackRange = activeUnit.icon === 'archer' ? 3 : 1;
    
    if (minDistance <= attackRange) {
      // ATTACK!
      const bonus = activeUnit.icon === 'archer' ? 1.3 : 1.0;
      const isStakes = currentTide <= 1 && hexes.find(h => h.col === bestTarget.col && h.row === bestTarget.row)?.terrain === 'stakes';
      const dmg = Math.max(5, Math.round(activeUnit.stats.atk * bonus * (isStakes ? 1.5 : 1.0) - bestTarget.stats.def * 0.4));

      // FOCUS ON COMBAT (calculates midpoint and locks camera without jitter)
      const p1 = hexToPixel(activeUnit.col, activeUnit.row);
      const p2 = hexToPixel(bestTarget.col, bestTarget.row);
      const midX = (p1.x + p2.x) / 2;
      const midY = (p1.y + p2.y) / 2;
      focusOnCombat(midX, midY);

      setUnits(prev => prev.map(u => {
        if (u.unit_id === bestTarget.unit_id) {
          return { ...u, stats: { ...u.stats, at: Math.max(0, u.stats.at - dmg) } };
        }
        return u;
      }).filter(u => u.stats.at > 0 || u.side === 'player'));

      showDamage(bestTarget.col, bestTarget.row, dmg, activeUnit.icon === 'archer' ? '#fb923c' : '#ef4444');
      setActionEvents(prev => [...prev, { id: Date.now(), attackerId: activeUnit.unit_id, targetId: bestTarget.unit_id, type: activeUnit.icon === 'archer' ? 'fire_arrow' : 'attack' }]);
      pushLog(`[AUTO] ${activeUnit.name} tấn công ${bestTarget.name} gây ${dmg} ST.`);
      
      eventBus.emit('DAMAGE_DEALT', { amount: dmg, side: currentSide, attacker: activeUnit.unit_id });
      if (bestTarget.stats.at - dmg <= 0) {
         eventBus.emit('UNIT_DEFEATED', { side: bestTarget.side });
      }

    } else {
      // MOVE!
      const dx = Math.sign(bestTarget.col - activeUnit.col);
      const dy = Math.sign(bestTarget.row - activeUnit.row);
      
      let nextCol = activeUnit.col + dx;
      let nextRow = activeUnit.row + dy;

      if (!currentUnits.find(u => u.col === nextCol && u.row === nextRow) && hexes.find(h => h.col === nextCol && h.row === nextRow)) {
         setUnits(prev => prev.map(u => u.unit_id === activeUnit.unit_id ? { ...u, col: nextCol, row: nextRow } : u));
         pushLog(`[AUTO] ${activeUnit.name} di chuyển.`);
         eventBus.emit('UNIT_MOVED', { unitId: activeUnit.unit_id });
      } else {
         pushLog(`[AUTO] ${activeUnit.name} giữ vị trí.`);
      }
    }

    setTimeout(() => {
      endTurn();
    }, 500 / speedMultiplier);
  };
};
