import { useState, useCallback } from 'react';

/**
 * BattlefieldCameraController
 * 
 * DESIGN: The battlefield camera is a FIXED cinematic observer.
 * 
 * It does NOT:
 *   - follow units
 *   - track attacks
 *   - respond to damage
 *   - shake on impact
 *   - zoom during combat
 *   - pan automatically
 *   - recenter on selection
 * 
 * It DOES:
 *   - provide a single stable 3/4 perspective composition
 *   - center the battlefield in the playable viewport
 *   - remain absolutely constant during Auto Battle
 * 
 * COORDINATE SYSTEM:
 *   The board container is 1200×900px.
 *   Camera (x, y) offsets translate the board within the viewport.
 *   pitch = rotateX angle (tilt toward viewer)
 *   yaw   = rotateZ angle (horizontal rotation)
 * 
 * PLAYABLE CENTER OFFSET:
 *   The game UI occupies space on all sides:
 *     - Top: navbar (~60px)
 *     - Left: info panel (~0-260px, contextual)
 *     - Right: battle log (~0-260px, contextual)
 *     - Bottom: auto controls (~80px)
 *   The camera x/y offset accounts for this so the battlefield
 *   appears centered in the remaining playable area.
 */

export interface CameraState {
  x: number;
  y: number;
  zoom: number;
  pitch: number;
  yaw: number;
}

export type CameraMode = 'LOCKED';

// ─── FIXED CAMERA CONFIGURATION ───────────────────────────────
// These values define the ONE authoritative camera composition.
// Nothing in the game may modify them during gameplay.
const FIXED_CAMERA: Readonly<CameraState> = {
  x: 0,           // centered horizontally
  y: 0,           // centered vertically
  zoom: 1.15,     // comfortable zoom showing full battlefield
  pitch: 50,      // 50° tilt — cinematic 3/4 perspective
  yaw: 35,        // 35° horizontal rotation — isometric feel
};

export const useBattleCamera = () => {
  // Camera state is initialized ONCE and never changes during gameplay
  const [camera] = useState<CameraState>({ ...FIXED_CAMERA });
  const [mode] = useState<CameraMode>('LOCKED');

  // ─── NO-OP HANDLERS ───────────────────────────────────────
  // These exist to maintain API compatibility with BattleScreen
  // but they intentionally do NOTHING.

  const handleMouseDown = useCallback((_e: React.MouseEvent) => {
    // DISABLED: No drag-to-pan
  }, []);

  const handleMouseMove = useCallback((_e: React.MouseEvent) => {
    // DISABLED: No drag-to-pan
  }, []);

  const handleMouseUp = useCallback(() => {
    // DISABLED: No drag-to-pan
  }, []);

  const handleWheel = useCallback((_e: React.WheelEvent) => {
    // Camera is locked: intentionally do NOT call preventDefault() from a React
    // onWheel handler (React 17+ attaches wheel listeners as passive on document
    // root, so preventDefault() only logs a warning). Page scroll is already
    // contained because the map viewport has overflow-hidden.
  }, []);

  // ─── NO-OP CAMERA MOVEMENT FUNCTIONS ──────────────────────
  // These are called by BattleScreen and useAutoBattle but
  // they intentionally do NOTHING. The camera stays locked.

  const focusOn = useCallback((_x: number, _y: number) => {
    // DISABLED: Camera does not follow unit selection
  }, []);

  const focusOnCombat = useCallback((_x: number, _y: number) => {
    // DISABLED: Camera does not move during combat
  }, []);

  const cinematicFocus = useCallback((_x: number, _y: number) => {
    // DISABLED: No cinematic camera movements
  }, []);

  return {
    camera,
    mode,
    isDragging: false,      // never dragging
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleWheel,
    focusOn,
    focusOnCombat,
    cinematicFocus,
  };
};
