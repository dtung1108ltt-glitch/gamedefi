import React, { useMemo, useState, useEffect, useRef, useCallback } from 'react';
import type { Faction, Player, BattleResultResponse, BattleUnit, HexTile, TerrainType, TacticalAction, MapLocation, RewardClaim } from '../../types';
import { apiService } from '../../services/api';
import { FactionBadge } from '../FactionCard/FactionBadge';
import { formatBaseUnits } from '../../services/dexMath';
import { BACH_DANG_HEXES, BACH_DANG_UNITS, BATTLEFIELD_DIMS } from '../../data/campaign';
import { THANG_LONG_HEXES, THANG_LONG_UNITS } from '../../data/thangLongCampaign';
import { LAM_SON_HEXES, LAM_SON_UNITS } from '../../data/lamSonCampaign';
import { PHU_XUAN_HEXES, PHU_XUAN_UNITS, INITIAL_CONTROL_POINTS } from '../../data/phuXuanCampaign';
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
  plain: 'Đồng Bằng', hill: 'Gò Cao', forest: 'Rừng Rậm',
  dense_forest: 'Rừng Khởi Nghĩa', narrow_path: 'Khe Núi Hẹp', mountain: 'Đỉnh Núi Hiểm', supply_camp: 'Kho Lương Địch',
  mud: 'Bãi Lầy', river: 'Sông / Hào Nước', stakes: 'Bãi Cọc Ngầm', fort: 'Tháp Canh / Đồn',
  wall: 'Tường Thành', gate: 'Cổng Thành Đoan Môn', courtyard: 'Sân Rồng', road: 'Ngự Đạo', garden: 'Ngự Uyển',
  bridge: 'Cầu Vượt Sông Hương', riverbank: 'Bờ Sông Hương',
};

const ACTIONS: { key: TacticalAction; label: string; icon: React.ReactNode; color: string }[] = [
  { key: 'move', label: 'Di chuyển', icon: <Move className="w-5 h-5" />, color: 'text-blue-400' },
  { key: 'attack', label: 'Tấn công', icon: <Swords className="w-5 h-5" />, color: 'text-red-400' },
  { key: 'formation', label: 'Phòng ngự', icon: <Shield className="w-5 h-5" />, color: 'text-emerald-400' },
  { key: 'fire_arrow', label: 'Hỏa tiễn', icon: <Flame className="w-5 h-5" />, color: 'text-orange-400' },
];

import { BachDangScene } from './BachDangScene';
import { BattleTopHUD } from './UI/BattleTopHUD';
import { BattleAdvantagePanel } from './UI/BattleAdvantagePanel';
import { BattleControlBar } from './UI/BattleControlBar';
import { BattleUnitInfoCard } from './UI/BattleUnitInfoCard';
import type { BattlefieldId, FormationPresetId } from '../../data/deployment';
import {
  COMMAND_RADIUS, DEPLOY_PREP_SECONDS, DEPLOYMENT_ZONE_INFO,
  applyCommanderAura, buildPresetFormation, getDeploymentHexes, isDeployableHex,
  loadFormationFromStorage, saveFormationToStorage, unitsWithinCommandRadius,
  validateFormation,
} from '../../data/deployment';
import { DeploymentPanel } from './UI/DeploymentPanel';
import type { ProjectileEvent, DamagePopupEvent } from './3D/Projectiles3D';
import { useAutoBattle } from './engine/useAutoBattle';
// useBattleCamera is no longer imported — camera is locked via foundation/battlefield.ts

export const BattleScreen: React.FC<BattleScreenProps> = ({
  player, faction, location, onExitBattle, onPlayDrum, onPlaySword, onPlayGong,
}) => {
  const isPhuXuan = location.location_id === 'phu_xuan' || location.location_id === 'phu-xuan';
  const isLamSon = location.location_id === 'lam_son' || location.location_id === 'lam-son';
  const isThangLong = location.location_id === 'thang_long' || location.location_id === 'thang-long';
  const battlefieldId = isPhuXuan ? 'phu_xuan' : isLamSon ? 'lam_son' : isThangLong ? 'thang_long' : 'bach_dang';
  const activeHexes = useMemo(() => isPhuXuan ? PHU_XUAN_HEXES : isLamSon ? LAM_SON_HEXES : isThangLong ? THANG_LONG_HEXES : BACH_DANG_HEXES, [isPhuXuan, isLamSon, isThangLong]);
  const initialUnits = useMemo(() => isPhuXuan ? PHU_XUAN_UNITS : isLamSon ? LAM_SON_UNITS : isThangLong ? THANG_LONG_UNITS : BACH_DANG_UNITS, [isPhuXuan, isLamSon, isThangLong]);

  const [units, setUnits] = useState<BattleUnit[]>(() => isPhuXuan ? PHU_XUAN_UNITS : isLamSon ? LAM_SON_UNITS : isThangLong ? THANG_LONG_UNITS : BACH_DANG_UNITS);
  // ── DEPLOYMENT PHASE (player-controlled, off-chain) ──
  // Quân player bắt đầu ở QUÂN DỰ BỊ; người chơi bấm quân rồi bấm ô xanh
  // để triển khai. Enemy giữ nguyên vị trí script sẵn.
  const [phase, setPhase] = useState<'deployment' | 'combat'>('deployment');
  const [deployedIds, setDeployedIds] = useState<string[]>([]);
  const [reserveSelectedId, setReserveSelectedId] = useState<string | null>(null);
  const [locked, setLocked] = useState(false);
  const [prepSecondsLeft, setPrepSecondsLeft] = useState(DEPLOY_PREP_SECONDS);
  const [deploymentError, setDeploymentError] = useState<string | null>(null);
  const [commandAuraIds, setCommandAuraIds] = useState<string[]>([]);
  const [selectedUnitId, setSelectedUnitId] = useState<string | null>(null);
  const [selectedHex, setSelectedHex] = useState<{ col: number; row: number } | null>(() => isPhuXuan ? { col: 2, row: 1 } : isLamSon ? { col: 1, row: 3 } : isThangLong ? { col: 5, row: 3 } : { col: 1, row: 3 });
  const [controlPoints, setControlPoints] = useState(INITIAL_CONTROL_POINTS);
  const [activeAction, setActiveAction] = useState<TacticalAction | null>(null);
  const [turnSide, setTurnSide] = useState<'player' | 'enemy'>('player');
  const [tideTurnsLeft, setTideTurnsLeft] = useState<number>(3);
  const [log, setLog] = useState<string[]>(() => isPhuXuan
    ? ['Tiến Chiếm Kinh Đô Phú Xuân — Chiến Dịch Thần Tốc Tây Sơn.', 'Tranh chấp quyền kiểm soát Tây Kiều, Đông Kiều và Sân Rồng.', 'Đến lượt quân Tây Sơn xuất kích!']
    : isLamSon
    ? ['Khởi nghĩa Lam Sơn — Chiến thuật du kích ngút ngàn rừng núi.', 'Quân Lam Sơn mai phục sẵn trong rừng sâu.', 'Đến lượt quân Lam Sơn xuất kích!']
    : isThangLong
    ? ['Trận bảo vệ Kinh đô Thăng Long bắt đầu.', 'Cấm quân Nhà Lý vào vị trí phòng thủ.', 'Đến lượt quân ta hành động.']
    : ['Trận Bạch Đằng bắt đầu.', 'Đến lượt quân ta hành động.']
  );
  const [battleResult, setBattleResult] = useState<BattleResultResponse | null>(null);
  const [rewardClaim, setRewardClaim] = useState<RewardClaim | null>(null);
  const [settling, setSettling] = useState(false);
  const [settlementError, setSettlementError] = useState<string | null>(null);
  // On-chain payout is tracked apart from the battle result so a payout problem never
  // hides the victory, the Exp reward or blocks leaving the battlefield.
  const [rewardStatus, setRewardStatus] = useState<'idle' | 'pending' | 'done' | 'error'>('idle');
  const [rewardError, setRewardError] = useState<string | null>(null);
  const [retryingReward, setRetryingReward] = useState<boolean>(false);
  
  // Tactical UI visibility states
  const [isAdvantageOpen, setIsAdvantageOpen] = useState<boolean>(true);
  const [isInfoDismissed, setIsInfoDismissed] = useState<boolean>(false);
  
  const [popups, setPopups] = useState<DamagePopupEvent[]>([]);
  const [projectiles, setProjectiles] = useState<ProjectileEvent[]>([]);
  const [actionEvents, setActionEvents] = useState<{ id: number; attackerId: string; targetId: string; type: string }[]>([]);

  const spawnProjectile = useCallback((proj: Omit<ProjectileEvent, 'progress'>) => {
    const newProj: ProjectileEvent = { ...proj, progress: 0 };
    setProjectiles(prev => [...prev, newProj]);

    const startTime = performance.now();
    const duration = Math.round(400 / BATTLE_SPEED);

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(1, elapsed / duration);
      setProjectiles(prev =>
        prev.map(p => (p.id === proj.id ? { ...p, progress } : p))
      );

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setTimeout(() => {
          setProjectiles(prev => prev.filter(p => p.id !== proj.id));
        }, 50);
      }
    };
    requestAnimationFrame(animate);
  }, []);

  const BATTLE_SPEED = 3; // Fixed 3x battle speed
  const [isAuto, setIsAuto] = useState<boolean>(true);
  const [strategy, setStrategy] = useState<'aggressive'|'defensive'|'balanced'>('balanced');
  const [isPaused, setIsPaused] = useState<boolean>(false);

  const hasSettledRef = useRef<boolean>(false);
  const isClaimingRef = useRef<boolean>(false);

  // Reset state when switching between battlefields
  useEffect(() => {
    setUnits(isPhuXuan ? PHU_XUAN_UNITS : isLamSon ? LAM_SON_UNITS : isThangLong ? THANG_LONG_UNITS : BACH_DANG_UNITS);
    setSelectedUnitId(null);
    setSelectedHex(null);
    setTurnSide('player');
    setActiveAction(null);
    hasSettledRef.current = false;
    setBattleResult(null);
    setControlPoints(INITIAL_CONTROL_POINTS);
    setPhase('deployment');
    setDeployedIds([]);
    setReserveSelectedId(null);
    setLocked(false);
    setPrepSecondsLeft(DEPLOY_PREP_SECONDS);
    setDeploymentError(null);
    setCommandAuraIds([]);
    setLog(isPhuXuan
      ? ['Tiến Chiếm Kinh Đô Phú Xuân — XẾP ĐỘI HÌNH trước khi xuất kích.', 'Bấm quân dự bị, rồi bấm ô xanh để triển khai. Khóa đội hình để bắt đầu AUTO combat.']
      : isLamSon
      ? ['Khởi nghĩa Lam Sơn — XẾP ĐỘI HÌNH trong rừng sâu.', 'Bấm quân dự bị, rồi bấm ô xanh để triển khai. Khóa đội hình để bắt đầu AUTO combat.']
      : isThangLong
      ? ['Bảo vệ Kinh đô Thăng Long — XẾP ĐỘI HÌNH trong thành.', 'Bấm quân dự bị, rồi bấm ô xanh để triển khai. Khóa đội hình để bắt đầu AUTO combat.']
      : ['Trận Bạch Đằng — XẾP ĐỘI HÌNH dọc bờ sông.', 'Bấm quân dự bị, rồi bấm ô xanh để triển khai. Khóa đội hình để bắt đầu AUTO combat.']
    );
  }, [isPhuXuan, isLamSon, isThangLong, location.location_id]);

  // Auto-settle battle if one side is defeated or Thăng Long palace is breached
  useEffect(() => {
    if (hasSettledRef.current || settling || battleResult) return;
    const playerAlive = units.some(u => u.side === 'player' && u.stats.at > 0);
    const enemyAlive = units.some(u => u.side === 'enemy' && u.stats.at > 0);

    // Thăng Long Defeat Condition: Enemy breaches the palace (row >= 5)
    const enemyBreachedPalace = isThangLong && units.some(u => u.side === 'enemy' && u.stats.at > 0 && u.row >= 5);
    
    // Thăng Long Warning: Enemy reached courtyard (row 3 or 4)
    if (isThangLong && units.some(u => u.side === 'enemy' && u.stats.at > 0 && (u.row === 3 || u.row === 4))) {
      pushLog('⚠️ THÀNH TRÌ BỊ ĐE DỌA — Quân địch đã tiến vào Sân Rồng Hoàng Thành!');
    }

    // Phú Xuân Objectives Control Check
    const playerControlledCount = isPhuXuan
      ? controlPoints.filter(cp => cp.owner === 'player').length
      : 0;

    if (!playerAlive || !enemyAlive || enemyBreachedPalace) {
      hasSettledRef.current = true;
      if (enemyBreachedPalace) {
        pushLog('💥 KINH THÀNH THẤT THỦ — Quân giặc đã tràn vào Điện Thiên An!');
      } else if (isPhuXuan && playerControlledCount >= 2) {
        pushLog('🎉 TOÀN THẮNG PHÚ XUÂN — Quân Tây Sơn làm chủ 2/3 cứ điểm chiến lược, giải phóng kinh thành!');
      }
      void handleSettleBattle(!enemyBreachedPalace && !enemyAlive);
    }
  }, [units, settling, battleResult, isThangLong, isPhuXuan, controlPoints]);

  // Camera is permanently locked via foundation/battlefield.ts.
  // No camera hook needed — BachDangScene handles its own FixedCameraObserver.

  const { cols, rows } = BATTLEFIELD_DIMS;
  const boardSize = useMemo(() => boardPixelSize(cols, rows), [cols, rows]);

  const selectedUnit = units.find(u => u.unit_id === selectedUnitId) || null;
  const hexAt = (col: number, row: number) => activeHexes.find(h => h.col === col && h.row === row);
  const playerVisibleUnits = useMemo(() => {
    if (phase !== 'deployment') return units;
    const enemy = units.filter((u) => u.side === 'enemy');
    const mine = units.filter((u) => u.side === 'player' && deployedIds.includes(u.unit_id));
    return [...enemy, ...mine];
  }, [units, deployedIds, phase]);
  const unitAt = (col: number, row: number) => playerVisibleUnits.find(u => u.col === col && u.row === row);
  const selectedTile = selectedHex ? hexAt(selectedHex.col, selectedHex.row) : undefined;

  function pushLog(msg: string) {
    setLog(prev => [msg, ...prev].slice(0, 5));
  }

  // ── DEPLOYMENT derived state ──────────────────────────────────
  const deploymentHexKeys = useMemo(() => {
    const s = new Set<string>();
    for (const h of getDeploymentHexes(activeHexes)) s.add(`${h.col}-${h.row}`);
    return s;
  }, [activeHexes]);
  const deployedPlayerUnits = useMemo(
    () => units.filter((u) => u.side === 'player' && deployedIds.includes(u.unit_id)),
    [units, deployedIds],
  );
  const reserveUnits = useMemo(
    () => units.filter((u) => u.side === 'player' && !deployedIds.includes(u.unit_id)),
    [units, deployedIds],
  );
  const activeDeployedUnit = useMemo(
    () => deployedPlayerUnits.find((u) => u.unit_id === selectedUnitId) ?? null,
    [deployedPlayerUnits, selectedUnitId],
  );
  const deploymentCommander = useMemo(
    () => deployedPlayerUnits.find((u) => u.is_commander) ?? null,
    [deployedPlayerUnits],
  );
  const commandAuraTargets = useMemo(
    () => (deploymentCommander
      ? unitsWithinCommandRadius(deployedPlayerUnits, deploymentCommander).map((u) => u.unit_id)
      : []),
    [deployedPlayerUnits, deploymentCommander],
  );
  const formationCheck = useMemo(
    () => validateFormation(deployedPlayerUnits, activeHexes),
    [deployedPlayerUnits, activeHexes],
  );
  const commandAuraKey = commandAuraTargets.join(',');
  useEffect(() => {
    if (phase === 'deployment') setCommandAuraIds(commandAuraTargets);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [commandAuraKey, phase]);
  const commandAuraHexKeys = useMemo(() => {
    const s = new Set<string>();
    for (const id of commandAuraIds) {
      const u = units.find((x) => x.unit_id === id);
      if (u) s.add(`${u.col}-${u.row}`);
    }
    return s;
  }, [commandAuraIds, units]);
  useEffect(() => {
    if (phase !== 'deployment' || locked) return;
    if (prepSecondsLeft <= 0) {
      if (formationCheck.ok) {
        pushLog('⏳ Hết giờ chuẩn bị — đội hình hợp lệ nên tự động khóa.');
      } else {
        pushLog('⏳ Hết giờ chuẩn bị — hãy khóa đội hình để vào trận.');
      }
      return;
    }
    const t = setTimeout(() => setPrepSecondsLeft((s) => Math.max(0, s - 1)), 1000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, locked, prepSecondsLeft]);
  const showDamage = useCallback((col: number, row: number, dmg: number, color: string) => {
    const id = Date.now() + Math.random();
    setPopups(prev => [...prev, { id, col, row, dmg, color, createdAt: Date.now() }]);
    setTimeout(() => setPopups(prev => prev.filter(p => p.id !== id)), 1200);
  }, []);

  const validTargets = useMemo(() => {
    // DEPLOYMENT: sáng ô xanh hợp lệ khi đang cầm quân.
    if (phase === 'deployment' && !locked) {
      const carry = activeDeployedUnit
        ?? reserveUnits.find((u) => u.unit_id === (reserveSelectedId ?? selectedUnitId)) ?? null;
      if (!carry) return new Set<string>();
      const set = new Set<string>();
      for (const h of activeHexes) {
        const key = `${h.col}-${h.row}`;
        if (!deploymentHexKeys.has(key)) continue;
        const occupant = playerVisibleUnits.find((u) => u.col === h.col && u.row === h.row);
        if (occupant && occupant.side === 'enemy') continue;
        if (occupant && occupant.unit_id !== carry.unit_id) {
          if (occupant.side !== 'player') continue;
        }
        set.add(key);
      }
      return set;
    }
    if (phase === 'deployment') return new Set<string>();
    if (!selectedUnit || !activeAction || selectedUnit.side !== 'player') return new Set<string>();
    const set = new Set<string>();
    if (activeAction === 'move') {
      for (const tile of activeHexes) {
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
      const isElevated = hexAt(selectedUnit.col, selectedUnit.row)?.terrain === 'hill' || hexAt(selectedUnit.col, selectedUnit.row)?.terrain === 'fort';
      const range = isElevated ? 4 : 3;
      for (const u of units) {
        if (u.side === selectedUnit.side) continue;
        const dist = hexDistance(selectedUnit, u);
        if (dist > 0 && dist <= range) set.add(`${u.col}-${u.row}`);
      }
    }
    return set;
  }, [selectedUnit, activeAction, units, activeHexes, phase, locked, activeDeployedUnit, reserveUnits, reserveSelectedId, selectedUnitId, deploymentHexKeys, playerVisibleUnits]);

  const advanceTurn = () => {
    setTurnSide(prev => {
      const nextSide = prev === 'player' ? 'enemy' : 'player';
      if (nextSide === 'player') {
        if (!isThangLong && !isLamSon && !isPhuXuan) {
          setTideTurnsLeft(t => (t > 0 ? t - 1 : 3));
        }
        pushLog(isPhuXuan ? 'Đến lượt quân Tây Sơn hành động.' : isLamSon ? 'Đến lượt quân Lam Sơn xuất kích.' : isThangLong ? 'Đến lượt quân Nhà Lý trấn thủ.' : 'Đến lượt quân ta hành động.');
      } else {
        pushLog(isPhuXuan ? 'Quân địch đang phản kích giữ thành...' : isLamSon ? 'Minh quân đang tiến vào ổ mai phục...' : isThangLong ? 'Quân địch đang dồn lực công thành...' : 'Quân Mông Nguyên đang điều binh...');
      }
      return nextSide;
    });
    setActiveAction(null);
  };

  useAutoBattle({
    isAuto: isAuto && !isPaused && !settling && phase === 'combat',
    battlefieldId,
    speedMultiplier: BATTLE_SPEED,
    strategy,
    units,
    turnSide,
    hexes: activeHexes,
    tideTurnsLeft,
    setUnits,
    setActionEvents,
    showDamage,
    pushLog,
    endTurn: advanceTurn,
    spawnProjectile,
    controlPoints,
    setControlPoints,
  });

  const placeDeploymentUnit = (carryId: string, col: number, row: number): boolean => {
    const tile = hexAt(col, row);
    if (!tile || !isDeployableHex(tile)) {
      setDeploymentError('Ô này không nằm trong vùng triển khai (ô xanh).');
      return false;
    }
    const occupant = playerVisibleUnits.find((u) => u.col === col && u.row === row);
    if (occupant && occupant.side === 'enemy') {
      setDeploymentError('Ô này đã có quân địch.');
      return false;
    }
    setDeploymentError(null);
    onPlayDrum();
    setUnits((prev) => prev.map((u) => {
      if (u.unit_id === carryId) return { ...u, col, row };
      // Swap: quân bị đè đổi sang vị trí cũ của quân đang cầm.
      if (occupant && occupant.side === 'player' && u.unit_id === occupant.unit_id) {
        const carry = prev.find((p) => p.unit_id === carryId);
        if (carry && deployedIds.includes(occupant.unit_id)) {
          return { ...u, col: carry.col, row: carry.row };
        }
      }
      return u;
    }));
    if (!deployedIds.includes(carryId)) setDeployedIds((prev) => [...prev, carryId]);
    setSelectedUnitId(carryId);
    setReserveSelectedId(null);
    setSelectedHex({ col, row });
    return true;
  };

  const handleSelectHex = (col: number, row: number) => {
    const unit = unitAt(col, row);
    setSelectedHex({ col, row });
    setIsInfoDismissed(false);

    // ── DEPLOYMENT: click quân rồi click ô (fallback cho drag & mobile) ──
    if (phase === 'deployment' && !locked) {
      const carryId = activeDeployedUnit?.unit_id ?? reserveSelectedId ?? selectedUnitId;
      const carryIsReserve = carryId ? reserveUnits.some((u) => u.unit_id === carryId) : false;
      const carryIsDeployed = carryId ? deployedIds.includes(carryId) : false;
      // Bấm vào quân ta đã triển khai → cầm quân đó.
      if (unit && unit.side === 'player' && (!carryId || (!carryIsReserve && unit.unit_id !== carryId))) {
        setSelectedUnitId(unit.unit_id);
        setReserveSelectedId(null);
        pushLog(`Đã chọn ${unit.name} — bấm ô xanh để di chuyển, bấm quân khác để đổi chỗ (swap).`);
        return;
      }
      if (carryId && (carryIsReserve || carryIsDeployed)) {
        // Bấm vào quân khác phe ta → swap trực tiếp.
        if (unit && unit.side === 'player' && unit.unit_id !== carryId && carryIsDeployed) {
          onPlayDrum();
          setUnits((prev) => {
            const a = prev.find((p) => p.unit_id === carryId);
            const b = prev.find((p) => p.unit_id === unit.unit_id);
            if (!a || !b) return prev;
            return prev.map((p) => {
              if (p.unit_id === carryId) return { ...p, col: b.col, row: b.row };
              if (p.unit_id === unit.unit_id) return { ...p, col: a.col, row: a.row };
              return p;
            });
          });
          setSelectedUnitId(unit.unit_id);
          pushLog('Đổi chỗ 2 đơn vị.');
          return;
        }
        placeDeploymentUnit(carryId, col, row);
        return;
      }
      if (unit) setSelectedUnitId(unit.unit_id);
      else setDeploymentError('Hãy chọn quân ở QUÂN DỰ BỊ trước, rồi bấm ô xanh để triển khai.');
      return;
    }

    if (turnSide !== 'player' || isAuto || phase !== 'combat') {
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
      const bonus = activeAction === 'fire_arrow' ? 1.3 : 1.0;
      const hillBonus = hexAt(selectedUnit.col, selectedUnit.row)?.terrain === 'hill' ? 1.2 : 1.0;
      const isStakes = hexAt(unit.col, unit.row)?.terrain === 'stakes' && tideTurnsLeft <= 1;
      const dmg = Math.max(5, Math.round(selectedUnit.stats.atk * bonus * hillBonus * (isStakes ? 1.5 : 1.0) - unit.stats.def * 0.4));
      
      spawnProjectile({
        id: Date.now() + Math.random(),
        fromCol: selectedUnit.col,
        fromRow: selectedUnit.row,
        toCol: unit.col,
        toRow: unit.row,
        type: activeAction === 'fire_arrow' ? 'arrow' : 'slash',
      });

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
    if (phase !== 'combat') return;
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

  const claimReward = async (battleId: string) => {
    if (isClaimingRef.current) return;
    isClaimingRef.current = true;
    setRetryingReward(true);
    setRewardStatus('pending');
    setRewardError(null);
    try {
      setRewardClaim(await apiService.claimBattleReward(player.wallet, battleId));
      setRewardStatus('done');
    } catch (reason) {
      setRewardStatus('error');
      setRewardError(reason instanceof Error ? reason.message : 'Backend chưa trả về lý do cụ thể.');
    } finally {
      isClaimingRef.current = false;
      setRetryingReward(false);
    }
  };

  async function handleSettleBattle(forceVictory?: boolean) {
    if (settling) return;
    setSettling(true);
    setSettlementError(null);
    try {
      const scenarioId = isPhuXuan ? 'phu_xuan_citadel' : isLamSon ? 'lam_son_guerrilla' : isThangLong ? 'thang_long_citadel' : 'bach_dang_1288';
      const result = await apiService.executeBattle(player.wallet, scenarioId, 'aggressive');
      if (typeof forceVictory === 'boolean') {
        result.victory = forceVictory;
      }
      setBattleResult(result);
      if (result.victory) {
        onPlayGong();
        if (!player.is_guest) await claimReward(result.battle_id);
      }
    } catch (reason) {
      setSettlementError(reason instanceof Error ? reason.message : 'Không thể ghi nhận kết quả trận đánh.');
    } finally {
      setSettling(false);
    }
  }

  // ── LOCK FORMATION: snapshot → aura → AUTO combat ──
  const deployedIdsRef = useRef(deployedIds);
  deployedIdsRef.current = deployedIds;
  const activeHexesRef = useRef(activeHexes);
  activeHexesRef.current = activeHexes;
  function handleLockFormation() {
    const deployed = units.filter((u) => u.side === 'player' && deployedIdsRef.current.includes(u.unit_id));
    const check = validateFormation(deployed, activeHexesRef.current);
    if (!check.ok) {
      setDeploymentError(check.errors[0]);
      pushLog(`⛔ ${check.errors[0]}`);
      return;
    }
    const commander = deployed.find((u) => u.is_commander) ?? null;
    const { units: buffed, buffedIds } = applyCommanderAura(deployed, commander);
    // Snapshot bất biến cho combat; deployment gốc giữ nguyên để tham chiếu.
    const buffById = new Map(buffed.map((u) => [u.unit_id, u]));
    const snapshot = units.map((u) => {
      if (u.side !== 'player') return { ...u, stats: { ...u.stats } };
      if (!deployedIdsRef.current.includes(u.unit_id)) return null;
      const b = buffById.get(u.unit_id);
      return b ? { ...b, stats: { ...b.stats } } : null;
    }).filter((u): u is BattleUnit => u !== null);
    const enemies = units
      .filter((u) => u.side === 'enemy')
      .map((u) => ({ ...u, stats: { ...u.stats } }));
    const combatUnits = [...snapshot, ...enemies];
    setUnits(combatUnits);
    setCommandAuraIds(buffedIds);
    setLocked(true);
    setPhase('combat');
    setReserveSelectedId(null);
    setIsAuto(true);
    setIsPaused(false);
    setTurnSide('player');
    pushLog('🔒 ĐỘI HÌNH ĐÃ KHÓA — BẮT ĐẦU CHIẾN!');
    if (buffedIds.length > 0 && commander) {
      pushLog(`👑 ${commander.name} truyền hiệu lệnh: ${buffedIds.length} quân +10% ATK/DEF.`);
    }
    onPlayGong();
  }

  // Hết giờ mà đội hình hợp lệ → tự khóa.
  useEffect(() => {
    if (phase !== 'deployment' || locked || prepSecondsLeft > 0) return;
    const deployed = units.filter((u) => u.side === 'player' && deployedIds.includes(u.unit_id));
    if (validateFormation(deployed, activeHexes).ok) handleLockFormation();
  }, [phase, locked, prepSecondsLeft, units, deployedIds, activeHexes, handleLockFormation]);
  const playerPower = useMemo(() => playerVisibleUnits.filter(u => u.side === 'player').reduce((acc, curr) => acc + curr.stats.at, 0), [playerVisibleUnits]);
  const enemyPower = useMemo(() => units.filter(u => u.side === 'enemy').reduce((acc, curr) => acc + curr.stats.at, 0), [units]);
  const maxPlayerPower = useMemo(() => {
    const sum = initialUnits.filter(u => u.side === 'player').reduce((acc, curr) => acc + curr.stats.at, 0);
    return sum > 0 ? sum : 820;
  }, [initialUnits]);
  const maxEnemyPower = useMemo(() => {
    const sum = initialUnits.filter(u => u.side === 'enemy').reduce((acc, curr) => acc + curr.stats.at, 0);
    return sum > 0 ? sum : 820;
  }, [initialUnits]);
  const playerHpPercent = Math.max(0, Math.min(100, Math.round((playerPower / maxPlayerPower) * 100)));
  const enemyHpPercent = Math.max(0, Math.min(100, Math.round((enemyPower / maxEnemyPower) * 100)));

  return (
    <div className={`relative flex-1 w-full min-h-[600px] ${isPhuXuan ? 'bg-[#15231c]' : isLamSon ? 'bg-[#14231a]' : isThangLong ? 'bg-[#1b2b1d]' : 'bg-[#0a1d2b]'} overflow-hidden font-sans select-none`}>
      
      {/* Legacy 2D dmg-float keyframe uses the LOCKED camera yaw value (35°).
          battle-shake is removed — camera shake is forbidden by art direction. */}
      <style>{`
        @keyframes dmg-float { 0% { opacity: 0; transform: translate(-50%, 0px) rotateZ(-35deg) rotateX(-90deg) scale(0.6); } 20% { opacity: 1; transform: translate(-50%, -30px) rotateZ(-35deg) rotateX(-90deg) scale(1.2); } 100% { opacity: 0; transform: translate(-50%, -70px) rotateZ(-35deg) rotateX(-90deg) scale(1.0); } }
        .bg-water-noise { background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.015' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.3'/%3E%3C/svg%3E"); }
      `}</style>

      {/* ------------------------------------------------------------------ */}
      {/* 3D CINEMATIC BATTLEFIELD SCENE (Three.js & React Three Fiber)      */}
      {/* ------------------------------------------------------------------ */}
      <BachDangScene
        battlefieldId={battlefieldId}
        units={playerVisibleUnits}
        hexes={activeHexes}
        selectedUnitId={selectedUnitId}
        selectedHex={selectedHex}
        validTargets={validTargets}
        deploymentHexKeys={phase === 'deployment' ? deploymentHexKeys : undefined}
        commandAuraKeys={phase === 'deployment' ? commandAuraHexKeys : undefined}
        tideTurnsLeft={tideTurnsLeft}
        projectiles={projectiles}
        popups={popups}
        onSelectHex={handleSelectHex}
        onSelectUnit={(id) => {
          // Trong deployment chỉ được cầm quân phe ta (hoặc quân dự bị).
          if (phase === 'deployment' && !locked) {
            const u = units.find((x) => x.unit_id === id);
            if (u && u.side === 'player') {
              if (deployedIds.includes(id)) {
                setSelectedUnitId(id);
                setReserveSelectedId(null);
              } else {
                setReserveSelectedId(id);
                setSelectedUnitId(id);
              }
              setIsInfoDismissed(false);
            }
            return;
          }
          setSelectedUnitId(id);
        }}
        isAutoRunning={isAuto && !isPaused && !settling && phase === 'combat'}
        actionEvents={actionEvents}
        controlPoints={controlPoints}
      />

      {/* DEPLOYMENT banner */}
      {phase === 'deployment' && !locked && (
        <div className="absolute top-16 md:top-20 left-1/2 -translate-x-1/2 z-40 pointer-events-none select-none">
          <div className="rounded-full border border-[#c9a44c]/70 bg-black/70 px-4 py-1 text-center backdrop-blur-md">
            <div className="font-serif text-[12px] font-black uppercase tracking-widest text-[#f3e5ab]">
              Xếp đội hình — {DEPLOYMENT_ZONE_INFO[battlefieldId as BattlefieldId]?.title ?? ''}
            </div>
            <div className="text-[10px] text-amber-200/90">
              Thời gian chuẩn bị: {prepSecondsLeft}s · {deployedPlayerUnits.length} đã triển khai
            </div>
          </div>
        </div>
      )}
      {phase === 'combat' && (
        <div className="absolute top-16 md:top-20 left-1/2 -translate-x-1/2 z-40 pointer-events-none select-none">
          <div className="rounded-full border border-emerald-700/60 bg-black/70 px-4 py-1 text-center backdrop-blur-md">
            <div className="font-serif text-[12px] font-black uppercase tracking-widest text-emerald-200">
              Đội hình đã khóa — Auto combat
            </div>
          </div>
        </div>
      )}

      {/* Subtle Atmospheric Vignette — gently frames screen without pitch-black edges */}
      <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_80px_rgba(6,18,28,0.5)] z-30" />

      {/* 1. TOP HUD (Đại Việt vs Bạch Đằng 1288 vs Quân Nguyên) */}
      <BattleTopHUD
        battlefieldId={battlefieldId}
        faction={faction}
        units={units}
        turnSide={turnSide}
        tideTurnsLeft={tideTurnsLeft}
        onExitBattle={onExitBattle}
        playerHpPercent={playerHpPercent}
        enemyHpPercent={enemyHpPercent}
        playerPower={playerPower}
        maxPlayerPower={maxPlayerPower}
        enemyPower={enemyPower}
        maxEnemyPower={maxEnemyPower}
        selectedUnitId={selectedUnitId}
        onSelectUnit={(id) => {
          setSelectedUnitId(id);
          setIsInfoDismissed(false);
          const u = units.find(unit => unit.unit_id === id);
          if (u) setSelectedHex({ col: u.col, row: u.row });
        }}
      />

      {/* 2. BOTTOM-LEFT "LỢI THẾ" PANEL */}
      <BattleAdvantagePanel
        isOpen={isAdvantageOpen}
        onToggle={() => setIsAdvantageOpen(prev => !prev)}
        battlefieldId={battlefieldId}
        tideTurnsLeft={tideTurnsLeft}
        recentLogs={log}
      />

      {/* 3. BOTTOM-CENTER / RIGHT CONTROLS BAR */}
      {phase === 'deployment' && !locked ? (
        <DeploymentPanel
          reserveUnits={reserveUnits}
          deployedCount={deployedPlayerUnits.length}
          selectedUnitId={reserveSelectedId ?? selectedUnitId}
          commanderId={deploymentCommander?.unit_id ?? null}
          buffedIds={commandAuraTargets}
          validationErrors={deploymentError ? [deploymentError, ...formationCheck.errors.slice(0, 2)] : formationCheck.errors.slice(0, 3)}
          canLock={formationCheck.ok}
          prepSecondsLeft={prepSecondsLeft}
          zoneDesc={DEPLOYMENT_ZONE_INFO[battlefieldId as BattlefieldId]?.desc ?? ''}
          onSelectReserve={(id) => {
            setReserveSelectedId((prev) => (prev === id ? null : id));
            setSelectedUnitId(id);
            setIsInfoDismissed(false);
            setDeploymentError(null);
          }}
          onApplyPreset={(preset: FormationPresetId) => {
            const next = buildPresetFormation(deployedPlayerUnits.length > 0 ? deployedPlayerUnits : reserveUnits.concat(deployedPlayerUnits), activeHexes, preset);
            setUnits((prev) => prev.map((u) => {
              const n = next.find((x) => x.unit_id === u.unit_id);
              return n ? { ...u, col: n.col, row: n.row } : u;
            }));
            const ids = next.map((u) => u.unit_id);
            setDeployedIds(ids);
            setDeploymentError(null);
            pushLog(`Áp dụng đội hình ${preset} — bạn vẫn có thể sửa tay.`);
          }}
          onRecallUnit={(id) => {
            setDeployedIds((prev) => prev.filter((x) => x !== id));
            if (reserveSelectedId === id) setReserveSelectedId(null);
            if (selectedUnitId === id) setSelectedUnitId(null);
            pushLog('Đã rút quân về dự bị.');
          }}
          onReset={() => {
            setUnits(isPhuXuan ? PHU_XUAN_UNITS : isLamSon ? LAM_SON_UNITS : isThangLong ? THANG_LONG_UNITS : BACH_DANG_UNITS);
            setDeployedIds([]);
            setReserveSelectedId(null);
            setSelectedUnitId(null);
            setDeploymentError(null);
          }}
          onSave={() => {
            saveFormationToStorage(battlefieldId as BattlefieldId, deployedPlayerUnits);
            pushLog('Đã lưu đội hình.');
          }}
          onLoad={() => {
            const loaded = loadFormationFromStorage(battlefieldId as BattlefieldId, units.filter((u) => u.side === 'player'), activeHexes);
            if (!loaded) {
              setDeploymentError('Không có đội hình đã lưu hợp lệ cho chiến trường này.');
              return;
            }
            setUnits((prev) => prev.map((u) => {
              const n = loaded.find((x) => x.unit_id === u.unit_id);
              return n ? { ...u, col: n.col, row: n.row } : u;
            }));
            setDeployedIds(loaded.map((u) => u.unit_id));
            setDeploymentError(null);
            pushLog('Đã tải đội hình đã lưu.');
          }}
          onLock={handleLockFormation}
        />
      ) : (
      <BattleControlBar
        isAuto={isAuto}
        onToggleAuto={() => setIsAuto(prev => !prev)}
        isAdvantageOpen={isAdvantageOpen}
        onToggleAdvantage={() => setIsAdvantageOpen(prev => !prev)}
        strategy={strategy}
        onChangeStrategy={setStrategy}
        isPaused={isPaused}
        onTogglePause={() => setIsPaused(prev => !prev)}
        showManualActions={!isAuto && !!selectedUnit && selectedUnit.side === 'player' && turnSide === 'player' && !battleResult && phase === 'combat'}
        activeAction={activeAction}
        onSelectAction={handleAction}
        onAdvanceTurn={advanceTurn}
      />
      )}

      {/* 4. RIGHT-SIDE COMPACT INFORMATION CARD (When a unit or hex tile is selected) */}
      {!isInfoDismissed && (selectedUnit || selectedTile) && (
        <BattleUnitInfoCard
          unit={selectedUnit}
          tile={selectedTile}
          onClose={() => setIsInfoDismissed(true)}
          extraLines={
            phase === 'deployment' && selectedUnit && selectedUnit.side === 'player'
              ? [
                  `VỊ TRÍ: HEX (${selectedUnit.col}, ${selectedUnit.row})`,
                  selectedUnit.is_commander
                    ? `BÁN KÍNH CHỈ HUY: ${COMMAND_RADIUS} (+10% ATK/DEF)`
                    : commandAuraIds.includes(selectedUnit.unit_id)
                      ? 'TRONG VÙNG CHỈ HUY (+10% ATK/DEF)'
                      : 'NGOÀI VÙNG CHỈ HUY',
                  deployedIds.includes(selectedUnit.unit_id) ? 'ĐÃ TRIỂN KHAI' : 'QUÂN DỰ BỊ',
                ]
              : undefined
          }
        />
      )}

      {/* 5. BATTLE SETTLEMENT OVERLAY (Victory / Defeat Modal) */}
      {(battleResult || settlementError) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm pointer-events-auto animate-in fade-in zoom-in-95 duration-200">
          <div className="w-full max-w-sm bg-gradient-to-b from-[#1c140c]/95 via-[#140e08]/95 to-black/95 border-2 border-[#c9a44c] p-5 rounded-2xl shadow-[0_0_40px_rgba(201,164,76,0.35)] text-center">
            {battleResult && (
              <>
                <div className={`font-serif font-black text-2xl mb-1 drop-shadow-md tracking-wider ${battleResult.victory ? 'text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 via-teal-200 to-emerald-400' : 'text-red-400'}`}>
                  {battleResult.victory
                    ? (isPhuXuan ? 'ĐẠI THẮNG PHÚ XUÂN' : isLamSon ? 'ĐẠI THẮNG LAM SƠN' : isThangLong ? 'ĐẠI THẮNG THĂNG LONG' : 'ĐẠI THẮNG BẠCH ĐẰNG')
                    : (isPhuXuan ? 'LUI QUÂN VỀ LŨY THẦY' : isLamSon ? 'RÚT VỀ CHÍ LINH' : isThangLong ? 'KINH THÀNH THẤT THỦ' : 'THẤT BẠI')}
                </div>
                <div className="text-xs text-amber-200/80 mb-3 font-serif">
                  {battleResult.victory
                    ? (isPhuXuan ? 'Thần tốc chiếm lĩnh các cầu huyết mạch và Hoàng thành, thu phục Kinh đô Phú Xuân!' : isLamSon ? 'Đại phá viện binh Liễu Thăng, mở đường giải phóng đất nước!' : isThangLong ? 'Bảo vệ thành công Kinh đô Thăng Long và Hoàng thành!' : 'Quân Mông Nguyên đại bại trên sông Bạch Đằng!')
                    : (isPhuXuan ? 'Tạm thời lui binh bảo toàn lực lượng chuẩn bị tổng phản công!' : isLamSon ? 'Tạm thời rút vào vùng núi Chí Linh bảo toàn lực lượng để phục kích lại!' : isThangLong ? 'Quân địch đã phá vỡ Đoan Môn tràn vào Hoàng thành!' : 'Rút quân bảo toàn lực lượng để tái chiến.')}
                </div>

                <div className="bg-[#1a2e1d] border border-emerald-900/80 rounded-xl p-3 mb-3 text-left">
                  <div className="text-[10px] text-emerald-400 uppercase font-serif font-bold mb-1.5 border-b border-emerald-800/50 pb-1 flex justify-between">
                    <span>Chiến Lợi Phẩm</span>
                    <span className="text-slate-400 font-mono">{(log.length * 1.5).toFixed(1)}s</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center text-xs font-bold text-emerald-200">
                    <div className="bg-black/40 rounded p-1.5 border border-emerald-800/40">
                      <div className="text-[9px] text-emerald-400 uppercase">Exp</div>
                      +{battleResult.reward_xp}
                    </div>
                    {battleResult.reward_gold > 0 && (
                      <div className="bg-black/40 rounded p-1.5 border border-emerald-800/40">
                        <div className="text-[9px] text-amber-400 uppercase">Vàng</div>
                        +{battleResult.reward_gold}
                      </div>
                    )}
                    {battleResult.reward_rice > 0 && (
                      <div className="bg-black/40 rounded p-1.5 border border-emerald-800/40">
                        <div className="text-[9px] text-lime-400 uppercase">Lúa</div>
                        +{battleResult.reward_rice}
                      </div>
                    )}
                  </div>
                </div>

                {battleResult.victory && !player.is_guest && (
                  <div className="mb-3 rounded-xl border border-amber-800/60 bg-black/60 p-2.5 text-left">
                    <div className="mb-1.5 flex items-center justify-between border-b border-amber-800/40 pb-1 text-[10px] font-bold uppercase tracking-wider text-amber-300">
                      <span>Thưởng HKDV on-chain</span>
                      {rewardStatus === 'pending' && <LoaderCircle className="h-3 w-3 animate-spin text-amber-400" />}
                    </div>

                    {rewardStatus === 'pending' && (
                      <div className="text-[10px] text-amber-200">Đang ký và gửi giao dịch thưởng lên Solana Devnet…</div>
                    )}

                    {rewardStatus === 'done' && rewardClaim && (
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <div className="text-[12px] font-bold text-[#F3E5AB]">
                            +{formatBaseUnits(BigInt(rewardClaim.amount), 6)} HKDV
                          </div>
                          {rewardClaim.status !== 'confirmed' && (
                            <div className="text-[9px] text-amber-200/80">Đang chờ xác nhận on-chain</div>
                          )}
                        </div>
                        {rewardClaim.explorer_url && (
                          <a
                            href={rewardClaim.explorer_url}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center gap-1 text-[10px] text-amber-300 underline"
                          >
                            Explorer <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                      </div>
                    )}

                    {rewardStatus === 'error' && (
                      <div>
                        <div className="text-[10px] font-bold text-amber-200">Chưa nhận được thưởng HKDV</div>
                        <div className="mt-0.5 text-[10px] leading-snug text-slate-400">
                          Kết quả trận đấu và Exp đã được ghi nhận. Thử lại nhận HKDV khi backend đã sẵn sàng.
                        </div>
                        {rewardError && (
                          <div className="mt-1 break-words font-mono text-[9px] text-red-300/80">{rewardError}</div>
                        )}
                        <button
                          type="button"
                          disabled={retryingReward}
                          onClick={() => void claimReward(battleResult.battle_id)}
                          className="mt-2 w-full rounded-lg border border-amber-500/60 bg-amber-900/30 py-1.5 text-[10px] font-bold uppercase tracking-wider text-amber-100 transition-colors hover:bg-amber-800/40 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {retryingReward ? 'Đang gửi...' : 'Thử lại nhận thưởng'}
                        </button>
                      </div>
                    )}
                  </div>
                )}

                <button
                  onClick={onExitBattle}
                  className="w-full py-2.5 bg-gradient-to-r from-[#b45309] via-[#f59e0b] to-[#b45309] hover:brightness-110 text-black font-serif text-xs font-black uppercase tracking-widest rounded-xl shadow-lg transition-all active:scale-95"
                >
                  Rời chiến trường
                </button>
              </>
            )}

            {settlementError && (
              <div className="p-3">
                <div className="text-xs text-red-400 mb-3">{settlementError}</div>
                <button
                  onClick={onExitBattle}
                  className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold uppercase tracking-wider rounded-lg transition-all"
                >
                  Đóng
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

