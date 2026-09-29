import { useState, useRef, useEffect, useCallback } from 'react';

export interface CameraState {
  x: number;
  y: number;
  zoom: number;
  pitch: number;
  yaw: number;
}

export type CameraMode = 'STRATEGIC' | 'TACTICAL' | 'COMBAT_LOCKED' | 'CINEMATIC' | 'RETURNING';

export const useBattleCamera = () => {
  const [mode, setMode] = useState<CameraMode>('TACTICAL');
  
  const [camera, setCamera] = useState<CameraState>({
    x: 0,
    y: 0,
    zoom: 1.2,
    pitch: 55,
    yaw: 35,
  });

  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef({ startX: 0, startY: 0, camX: 0, camY: 0, isMiddleButton: false });
  const lockRef = useRef({ isLocked: false, unlockTimer: null as any });

  const MIN_ZOOM = 0.5;
  const MAX_ZOOM = 2.5;
  const CLAMP_X = 1200;
  const CLAMP_Y = 1200;

  const clamp = (val: number, min: number, max: number) => Math.max(min, Math.min(max, val));

  const setCameraState = useCallback((updater: (prev: CameraState) => CameraState) => {
    setCamera(prev => {
      const next = updater(prev);
      return {
        ...next,
        x: clamp(next.x, -CLAMP_X, CLAMP_X),
        y: clamp(next.y, -CLAMP_Y, CLAMP_Y),
        zoom: clamp(next.zoom, MIN_ZOOM, MAX_ZOOM)
      };
    });
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    // If the player manually drags, we should break the combat lock to allow free viewing
    if (lockRef.current.isLocked) {
       clearTimeout(lockRef.current.unlockTimer);
       lockRef.current.isLocked = false;
       setMode('TACTICAL');
    }
    
    setIsDragging(true);
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      camX: camera.x,
      camY: camera.y,
      isMiddleButton: e.button === 1
    };
    if (e.button === 1) e.preventDefault();
  }, [camera]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging) return;
    
    const dx = (e.clientX - dragRef.current.startX) / camera.zoom;
    const dy = (e.clientY - dragRef.current.startY) / camera.zoom;

    setCameraState(prev => ({
      ...prev,
      x: dragRef.current.camX + dx,
      y: dragRef.current.camY + dy,
    }));
  }, [isDragging, camera.zoom, setCameraState]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault(); 
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setCameraState(prev => ({ ...prev, zoom: prev.zoom + delta }));
  }, [setCameraState]);

  // General focus without locking (e.g., clicking a unit manually)
  const focusOn = useCallback((x: number, y: number) => {
    if (lockRef.current.isLocked) return; // Don't override if locked in combat
    
    setCameraState(prev => ({
      ...prev,
      x: -x,
      y: -y,
    }));
  }, [setCameraState]);

  // COMBAT_LOCKED: calculate once, lock frame, ignore minor jitters
  const focusOnCombat = useCallback((x: number, y: number) => {
    // If already locked in combat, DO NOT recalculate or move camera unless 
    // it's been idle for a while. We just extend the unlock timer.
    
    if (lockRef.current.unlockTimer) {
      clearTimeout(lockRef.current.unlockTimer);
    }

    if (!lockRef.current.isLocked) {
      // First time entering combat lock, transition camera smoothly
      lockRef.current.isLocked = true;
      setMode('COMBAT_LOCKED');
      
      setCameraState(prev => ({
        ...prev,
        x: -x,
        y: -y + 100, // Offset slightly to center the combat nicely
        zoom: 1.5,
        pitch: 50
      }));
    }

    // Extend the lock timer. Once no new combat events happen for 2500ms, unlock.
    lockRef.current.unlockTimer = setTimeout(() => {
      lockRef.current.isLocked = false;
      setMode('RETURNING');
      
      // Return to tactical overview smoothly
      setCameraState(prev => ({
        ...prev,
        zoom: 1.2,
        pitch: 55
      }));
      
      setTimeout(() => setMode('TACTICAL'), 1000); // 1s returning duration
    }, 2500);

  }, [setCameraState]);

  const cinematicFocus = useCallback((x: number, y: number) => {
    // Only used for extremely major events (e.g. boss death). Normally don't use this.
    setMode('CINEMATIC');
    setCameraState(prev => ({
      ...prev,
      x: -x,
      y: -y,
      zoom: 1.8,
      pitch: 45 
    }));
    
    setTimeout(() => {
      setMode('TACTICAL');
      setCameraState(prev => ({
        ...prev,
        zoom: 1.2,
        pitch: 55
      }));
    }, 1500);
  }, [setCameraState]);

  return {
    camera,
    mode,
    isDragging,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleWheel,
    focusOn,
    focusOnCombat,
    cinematicFocus
  };
};
