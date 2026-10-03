import { useEffect, useRef } from 'react';
import { BattleUnit, HexTile, ControlPointState } from '../../../types';
import { eventBus } from '../../../services/eventBus';
import { ProjectileEvent, DamagePopupEvent } from '../3D/Projectiles3D';

// Hex distance calculation
const hexDistance = (a: { col: number; row: number }, b: { col: number; row: number }) => {
  const dx = Math.abs(a.col - b.col);
  const dy = Math.abs(a.row - b.row);
  return Math.max(dx, dy);
};

export const DEFAULT_BATTLE_SPEED = 3; // Fixed 3x speed

interface AutoBattleConfig {
  isAuto: boolean;
  battlefieldId?: string;
  speedMultiplier?: number;
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
  spawnProjectile?: (proj: Omit<ProjectileEvent, 'progress'>) => void;
  controlPoints?: ControlPointState[];
  setControlPoints?: React.Dispatch<React.SetStateAction<ControlPointState[]>>;
}

export const useAutoBattle = (config: AutoBattleConfig) => {
  const {
    isAuto,
    battlefieldId,
    speedMultiplier = DEFAULT_BATTLE_SPEED,
    strategy,
    units,
    turnSide,
    hexes,
    tideTurnsLeft,
    setUnits,
    setActionEvents,
    showDamage,
    pushLog,
    endTurn,
    spawnProjectile,
    controlPoints,
    setControlPoints,
  } = config;

  const stateRef = useRef({ units, turnSide, tideTurnsLeft });
  const controlPointsRef = useRef(controlPoints);

  useEffect(() => {
    stateRef.current = { units, turnSide, tideTurnsLeft };
  }, [units, turnSide, tideTurnsLeft]);

  useEffect(() => {
    controlPointsRef.current = controlPoints;
  }, [controlPoints]);

  useEffect(() => {
    const isAITurn = turnSide === 'enemy' || (turnSide === 'player' && isAuto);
    if (!isAITurn) return;

    const baseDelay = 1100 / speedMultiplier;

    const timer = setTimeout(() => {
      executeCombatStep();
    }, baseDelay);

    return () => clearTimeout(timer);
  }, [isAuto, turnSide, speedMultiplier]);

  const executeCombatStep = () => {
    const { units: currentUnits, turnSide: currentSide, tideTurnsLeft: currentTide } = stateRef.current;

    const myUnits = currentUnits.filter((u) => u.side === currentSide && u.stats.at > 0);
    const enemyUnits = currentUnits.filter((u) => u.side !== currentSide && u.stats.at > 0);

    if (myUnits.length === 0 || enemyUnits.length === 0) return;

    // Pick an active unit based on tactical strategy
    let activeUnit: BattleUnit;
    if (strategy === 'aggressive') {
      // Prioritize high attack units
      activeUnit = [...myUnits].sort((a, b) => b.stats.atk - a.stats.atk)[0];
    } else if (strategy === 'defensive') {
      // Prioritize ranged or defensive anchor units
      activeUnit = myUnits.find((u) => u.icon === 'archer') || myUnits[0];
    } else {
      // Balanced: random selection among ready units
      activeUnit = myUnits[Math.floor(Math.random() * myUnits.length)];
    }

    // Find closest enemy target
    let bestTarget = enemyUnits[0];
    let minDistance = Infinity;

    enemyUnits.forEach((enemy) => {
      const dist = hexDistance(activeUnit, enemy);
      if (dist < minDistance) {
        minDistance = dist;
        bestTarget = enemy;
      }
    });

    const isPhuXuan = battlefieldId === 'phu_xuan' || battlefieldId === 'phu-xuan';
    const isArcher = activeUnit.icon === 'archer';
    const isCommander = activeUnit.icon === 'commander' || !!activeUnit.is_commander;
    const isLamSon = battlefieldId === 'lam_son' || battlefieldId === 'lam-son';
    const isThangLong = battlefieldId === 'thang_long' || battlefieldId === 'thang-long';

    // Objective capture verification helper for Phú Xuân
    const checkObjectiveCapture = (currentAllUnits: BattleUnit[]) => {
      if (!isPhuXuan || !setControlPoints || !controlPointsRef.current) return;

      const currentPoints = controlPointsRef.current;
      let stateChanged = false;

      const nextPoints = currentPoints.map((cp) => {
        const occupant = currentAllUnits.find((u) => u.col === cp.col && u.row === cp.row && u.stats.at > 0);
        if (occupant && occupant.side !== cp.owner) {
          stateChanged = true;
          pushLog(`👑 [KIỂM SOÁT PHÚ XUÂN] Quân ${occupant.side === 'player' ? 'Tây Sơn' : 'địch'} đã chiếm giữ ${cp.name}!`);
          return {
            ...cp,
            owner: occupant.side,
            progress: 100,
            contested: false,
          };
        }
        return cp;
      });

      if (stateChanged) {
        setControlPoints(nextPoints);
        const playerCount = nextPoints.filter((c) => c.owner === 'player').length;
        if (playerCount >= 2) {
          pushLog(`⚡ [MẠNG LƯỚI KIỂM SOÁT] Quân Tây Sơn chiếm ${playerCount}/3 cứ điểm trọng yếu (+10% Sĩ Khí toàn quân)!`);
        }
      }
    };

    checkObjectiveCapture(currentUnits);

    // Control network bonuses in Phú Xuân
    let playerControlledPoints = 0;
    let enemyControlledPoints = 0;
    if (isPhuXuan && controlPointsRef.current) {
      controlPointsRef.current.forEach((cp) => {
        if (cp.owner === 'player') playerControlledPoints++;
        else if (cp.owner === 'enemy') enemyControlledPoints++;
      });
    }

    const quangTrungAlive =
      isPhuXuan &&
      currentUnits.some((u) => u.side === 'player' && u.stats.at > 0 && (u.icon === 'commander' || u.is_commander));

    const attackerTile = hexes.find((h) => h.col === activeUnit.col && h.row === activeUnit.row);
    const targetTile = hexes.find((h) => h.col === bestTarget.col && h.row === bestTarget.row);

    const isHighGround =
      attackerTile?.terrain === 'fort' ||
      attackerTile?.terrain === 'hill' ||
      attackerTile?.terrain === 'mountain';
    const attackRange = isArcher ? (isHighGround ? 4 : 3) : 1;

    if (minDistance <= attackRange) {
      // ==========================================================
      // COMBAT EXECUTION
      // ==========================================================
      const isStakes =
        !isThangLong &&
        !isLamSon &&
        !isPhuXuan &&
        currentTide <= 1 &&
        targetTile?.terrain === 'stakes';

      // Damage formula adhering to attack, defense, terrain, and commander buffs
      let baseBonus = isArcher ? 1.25 : 1.0;
      if (isCommander) baseBonus *= 1.35; // Commander skill bonus
      if (isStakes) baseBonus *= 1.5; // +50% damage when opponent is trapped in stakes at low tide!
      if (isHighGround && isArcher) baseBonus *= 1.15; // +15% Ranged attack from watchtower / mountain ridge

      // Lam Sơn Ambush Strike Bonus: +30% damage on first attack from hidden state
      const isAmbushStrike = isLamSon && !!activeUnit.is_hidden;
      if (isAmbushStrike) {
        baseBonus *= 1.30;
      }

      // Lê Lợi Commander Aura ("Hiệu triệu Lam Sơn")
      const leLoiAlive =
        isLamSon &&
        currentUnits.some((u) => u.side === 'player' && u.stats.at > 0 && (u.icon === 'commander' || u.is_commander));
      if (isLamSon && activeUnit.side === 'player' && leLoiAlive && isAmbushStrike) {
        baseBonus *= 1.10; // Extra ambush DMG under Lê Lợi's command
      }

      // Quang Trung Commander Aura ("Tốc Chiến Phú Xuân"): +15% ATK for allied units
      if (isPhuXuan && activeUnit.side === 'player' && quangTrungAlive) {
        baseBonus *= 1.15;
      }

      // Phú Xuân: Control Network Morale Bonus (2 points = +10% DMG, 3 points = +15% DMG)
      if (isPhuXuan) {
        const activeControlled = activeUnit.side === 'player' ? playerControlledPoints : enemyControlledPoints;
        if (activeControlled >= 3) baseBonus *= 1.15;
        else if (activeControlled >= 2) baseBonus *= 1.10;
      }

      // Phú Xuân: Bridge Assault Charge (+15% DMG when attacking across bridge)
      if (isPhuXuan && attackerTile?.terrain === 'bridge') {
        baseBonus *= 1.15;
      }

      // Target terrain defense modifiers
      let defMultiplier = 1.0;
      if (targetTile?.terrain === 'wall') defMultiplier += 0.25; // +25% DEF on wall
      if (targetTile?.terrain === 'gate') defMultiplier += 0.20; // +20% DEF at gate
      if (targetTile?.terrain === 'courtyard') defMultiplier += 0.15; // +15% DEF in courtyard
      if (targetTile?.terrain === 'garden') defMultiplier += 0.05; // +5% DEF in garden
      if (targetTile?.terrain === 'dense_forest') defMultiplier += 0.25; // +25% DEF in dense forest
      if (targetTile?.terrain === 'narrow_path') defMultiplier += 0.20; // +20% DEF in narrow pass

      // Phú Xuân: Control Network Defense Bonus (3 points = +15% DEF)
      if (isPhuXuan) {
        const targetControlled = bestTarget.side === 'player' ? playerControlledPoints : enemyControlledPoints;
        if (targetControlled >= 3) defMultiplier += 0.15;
      }

      // Lý Thường Kiệt's Commander Aura: "Phòng tuyến kinh thành" (+20% DEF for defenders near citadel)
      if (isThangLong && bestTarget.side === 'player') {
        if (targetTile?.terrain === 'wall' || targetTile?.terrain === 'gate' || targetTile?.terrain === 'courtyard' || bestTarget.row >= 3) {
          defMultiplier += 0.20;
        }
      }

      // Lê Lợi's Commander Aura: +10% DEF for all allied Lam Sơn resistance fighters
      if (isLamSon && bestTarget.side === 'player' && leLoiAlive) {
        defMultiplier += 0.10;
      }

      const rawDmg = activeUnit.stats.atk * baseBonus - (bestTarget.stats.def * defMultiplier) * 0.35;
      const dmg = Math.max(8, Math.round(rawDmg + (Math.random() * 6 - 3)));

      // Spawn 3D Projectile / VFX
      if (spawnProjectile) {
        spawnProjectile({
          id: Date.now() + Math.random(),
          fromCol: activeUnit.col,
          fromRow: activeUnit.row,
          toCol: bestTarget.col,
          toRow: bestTarget.row,
          type: isArcher ? 'arrow' : isCommander ? 'skill' : 'slash',
        });
      }

      // Update unit HP & reveal hidden ambush attacker
      setUnits((prev) => {
        const updated = prev
          .map((u) => {
            if (u.unit_id === bestTarget.unit_id) {
              return { ...u, stats: { ...u.stats, at: Math.max(0, u.stats.at - dmg) } };
            }
            if (u.unit_id === activeUnit.unit_id && u.is_hidden) {
              return { ...u, is_hidden: false, has_ambushed: true };
            }
            return u;
          })
          .filter((u) => u.stats.at > 0 || u.side === 'player');
        checkObjectiveCapture(updated);
        return updated;
      });

      // Trigger Damage Numbers & Events
      showDamage(
        bestTarget.col,
        bestTarget.row,
        dmg,
        isAmbushStrike ? '#10b981' : isArcher ? '#fb923c' : isCommander ? '#f59e0b' : '#ef4444'
      );

      setActionEvents((prev) => [
        ...prev,
        {
          id: Date.now(),
          attackerId: activeUnit.unit_id,
          targetId: bestTarget.unit_id,
          type: isAmbushStrike ? 'ambush' : isArcher ? 'fire_arrow' : isCommander ? 'skill' : 'attack',
        },
      ]);

      // Historic Combat Logs
      if (isStakes) {
        pushLog(`⚔️ BÃI CỌC BẠCH ĐẰNG nhô lên bẫy thuyền ${bestTarget.name}, ${activeUnit.name} gây ${dmg} ST!`);
      } else if (isAmbushStrike) {
        pushLog(`🌲 [PHỤC KÍCH RỪNG SÂU] ${activeUnit.name} xuất quỷ nhập thần đánh úp ${bestTarget.name}, gây ${dmg} ST!`);
      } else if (isPhuXuan && isCommander) {
        pushLog(`👑 [TỐC CHIẾN PHÚ XUÂN] Quang Trung vung đại đao thần tốc chém ${bestTarget.name} gây ${dmg} ST!`);
      } else if (isPhuXuan && attackerTile?.terrain === 'bridge') {
        pushLog(`🌉 [XUNG KÍCH QUA CẦU] ${activeUnit.name} vượt sông tập kích ${bestTarget.name} gây ${dmg} ST!`);
      } else if (isPhuXuan && targetTile?.terrain === 'courtyard') {
        pushLog(`🐉 SÂN RỒNG HOÀNG THÀNH che chắn cho ${bestTarget.name}, ${activeUnit.name} gây ${dmg} ST.`);
      } else if (isLamSon && isCommander) {
        pushLog(`👑 [HIỆU TRIỆU LAM SƠN] Lê Lợi vung kiếm Thuận Thiên chém ${bestTarget.name} gây ${dmg} ST!`);
      } else if (isLamSon && isHighGround && isArcher) {
        pushLog(`🏹 [ĐÈO CHI LĂNG] ${activeUnit.name} phóng tiễn từ trên cao trúng ${bestTarget.name} gây ${dmg} ST!`);
      } else if (isLamSon && targetTile?.terrain === 'dense_forest') {
        pushLog(`🌲 RỪNG RẬM che chắn giảm tổn thất cho ${bestTarget.name}, ${activeUnit.name} gây ${dmg} ST.`);
      } else if (isLamSon && targetTile?.terrain === 'narrow_path') {
        pushLog(`🛤 ĐỊA THẾ ĐƯỜNG HẸP trợ lực thủ vững cho ${bestTarget.name}, ${activeUnit.name} gây ${dmg} ST.`);
      } else if (isThangLong && targetTile?.terrain === 'wall') {
        pushLog(`🏯 TƯỜNG THÀNH che chắn cho ${bestTarget.name}, ${activeUnit.name} gây ${dmg} ST.`);
      } else if (isThangLong && targetTile?.terrain === 'gate') {
        pushLog(`🚪 CỔNG ĐOAN MÔN tử thủ kiên cường, ${activeUnit.name} gây ${dmg} ST.`);
      } else if (isCommander) {
        pushLog(`👑 [NỘ KHÍ] ${activeUnit.name} tung tuyệt kỹ chém ${bestTarget.name} gây ${dmg} ST.`);
      } else if (isArcher) {
        pushLog(`🏹 ${activeUnit.name} bắn hỏa tiễn trúng ${bestTarget.name} gây ${dmg} ST.`);
      } else {
        pushLog(`⚔️ ${activeUnit.name} giáp chiến ${bestTarget.name} gây ${dmg} ST.`);
      }

      eventBus.emit('DAMAGE_DEALT', { amount: dmg, side: currentSide, attacker: activeUnit.unit_id });
      if (bestTarget.stats.at - dmg <= 0) {
        pushLog(`💀 ${bestTarget.name} đã bị đánh bại!`);
        eventBus.emit('UNIT_DEFEATED', { side: bestTarget.side });
      }
    } else {
      // ==========================================================
      // MARCHING / TACTICAL POSITIONING
      // ==========================================================
      const dx = Math.sign(bestTarget.col - activeUnit.col);
      const dy = Math.sign(bestTarget.row - activeUnit.row);

      const nextCol = activeUnit.col + dx;
      const nextRow = activeUnit.row + dy;

      const isOccupied = currentUnits.some((u) => u.col === nextCol && u.row === nextRow && u.stats.at > 0);
      const targetHex = hexes.find((h) => h.col === nextCol && h.row === nextRow);

      if (!isOccupied && targetHex && targetHex.terrain !== 'fort') {
        const isCapturingSupplyCamp = isLamSon && activeUnit.side === 'player' && nextCol === 10 && nextRow === 1;

        setUnits((prev) => {
          const next = prev.map((u) => {
            if (u.unit_id === activeUnit.unit_id) {
              return { ...u, col: nextCol, row: nextRow };
            }
            if (isCapturingSupplyCamp && u.side === 'enemy') {
              // Debuff enemy: -20% ATK
              return { ...u, stats: { ...u.stats, atk: Math.max(12, Math.round(u.stats.atk * 0.8)) } };
            }
            return u;
          });
          checkObjectiveCapture(next);
          return next;
        });

        if (isCapturingSupplyCamp) {
          pushLog(`🔥 QUÂN LAM SƠN THIÊU RỤI KHO LƯƠNG MINH! Toàn quân địch suy sụp sĩ khí, giảm 20% công lực!`);
        } else {
          pushLog(`🚩 ${activeUnit.name} tiến quân đến ô (${nextCol}, ${nextRow}).`);
        }
        eventBus.emit('UNIT_MOVED', { unitId: activeUnit.unit_id });
      } else {
        pushLog(`🛡️ ${activeUnit.name} dàn trận giữ vị trí.`);
      }
    }

    setTimeout(() => {
      endTurn();
    }, 450 / speedMultiplier);
  };
};

