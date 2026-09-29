import React from 'react';
import { BattleUnit } from '../../types';

interface UnitVisualProps {
  unit: BattleUnit;
  isPlayer: boolean;
  isMoving: boolean;
  isAttacking: boolean;
  facing: number; // 1 for right, -1 for left
}

/**
 * BattlefieldUnitRenderer
 * Abstraction layer for 3D/2.5D units.
 * Can be swapped with a Three.js GLB renderer in the future.
 */
export const UnitVisual: React.FC<UnitVisualProps> = (props) => {
  // Option to switch to 3D model if supported
  const use3DModel = false; // Toggle when GLB assets are ready
  
  if (use3DModel) {
    return <Unit3DGLTFRenderer {...props} />;
  }

  return <Unit2DLayeredRenderer {...props} />;
};

/**
 * Minimal GLTF mock for future extension
 */
const Unit3DGLTFRenderer: React.FC<UnitVisualProps> = () => {
  return <div className="text-white text-xs">GLTF Placeholder</div>;
};

/**
 * Robust Layered 2.5D System with depth, parallax, and volumetric perception.
 */
const Unit2DLayeredRenderer: React.FC<UnitVisualProps> = ({ unit, isPlayer, isMoving, isAttacking, facing }) => {
  const colorPrimary = isPlayer ? '#1d4ed8' : '#991b1b'; // Blue vs Red
  const colorSecondary = isPlayer ? '#1e3a8a' : '#7f1d1d';
  const colorArmor = '#a16207'; // Bronze/Gold
  const colorSkin = '#fca5a5';
  
  const type = unit.icon; // 'spear' | 'archer' | 'elephant' | 'horse'

  // Apply facing transformation
  const facingTransform = facing < 0 ? 'scaleX(-1)' : 'scaleX(1)';

  return (
    <div 
      className={`relative w-16 h-24 transition-transform duration-300`}
      style={{ transformStyle: 'preserve-3d', transform: facingTransform }}
    >
      {/* LAYER 0: Shadow & Cape (Z = -4px) */}
      <svg width="64" height="96" className="absolute inset-0 overflow-visible" style={{ transform: 'translateZ(-4px)' }}>
        {/* Contact Shadow on terrain */}
        <ellipse cx="32" cy="90" rx="18" ry="8" fill="rgba(0,0,0,0.6)" filter="blur(3px)" />
        {/* Cape */}
        <path 
          d="M 20 34 Q 10 60 16 80 L 48 80 Q 54 60 44 34 Z" 
          fill={colorSecondary} 
          className={isMoving ? 'origin-top animate-[cape-flutter_0.8s_ease-in-out_infinite]' : ''}
        />
      </svg>
      
      {/* LAYER 1: Mount (if cavalry/elephant) (Z = -2px) */}
      {(type === 'cavalry' || type === 'elephant') && (
        <svg width="64" height="96" className="absolute inset-0 overflow-visible" style={{ transform: 'translateZ(-2px)' }}>
          {type === 'cavalry' && (
            <g className={isMoving ? 'animate-[bounce_0.4s_infinite]' : ''}>
              <path d="M 10 50 Q 20 40 40 40 Q 60 40 50 60 L 50 80 L 40 80 L 40 60 L 20 60 L 20 80 L 10 80 Z" fill="#78350f" />
              {/* Horse Head */}
              <path d="M 40 40 L 55 20 L 65 25 L 60 45 Z" fill="#78350f" />
            </g>
          )}
          {type === 'elephant' && (
            <g className={isMoving ? 'animate-[bounce_0.6s_infinite]' : ''}>
              <rect x="5" y="30" width="54" height="50" rx="10" fill="#475569" />
              {/* Trunk */}
              <path d="M 50 40 Q 70 40 65 80" fill="none" stroke="#475569" strokeWidth="8" strokeLinecap="round" />
              {/* Tusk */}
              <path d="M 55 55 Q 70 50 75 40" fill="none" stroke="#f1f5f9" strokeWidth="4" strokeLinecap="round" />
              {/* Legs */}
              <rect x="10" y="75" width="12" height="15" fill="#334155" />
              <rect x="40" y="75" width="12" height="15" fill="#334155" />
            </g>
          )}
        </svg>
      )}

      {/* LAYER 2: Body & Legs (Z = 0px) */}
      <svg width="64" height="96" className="absolute inset-0 overflow-visible" style={{ transform: 'translateZ(0px)' }}>
        {/* If mounted, rider is shifted up */}
        <g style={{ transform: (type === 'cavalry' || type === 'elephant') ? 'translateY(-20px)' : 'none' }}>
          {/* Legs (only animate if not mounted) */}
          <g className={(isMoving && type !== 'cavalry' && type !== 'elephant') ? 'animate-[leg-swing_0.5s_infinite_alternate]' : ''}>
            <path d="M 26 55 L 26 86" stroke="#475569" strokeWidth="7" strokeLinecap="round" />
          </g>
          <g className={(isMoving && type !== 'cavalry' && type !== 'elephant') ? 'animate-[leg-swing-rev_0.5s_infinite_alternate]' : ''}>
            <path d="M 38 55 L 38 86" stroke="#334155" strokeWidth="7" strokeLinecap="round" />
          </g>
          {/* Torso */}
          <rect x="22" y="36" width="20" height="26" rx="4" fill={colorPrimary} />
        </g>
      </svg>

      {/* LAYER 3: Armor & Details (Z = 4px) */}
      <svg width="64" height="96" className="absolute inset-0 overflow-visible" style={{ transform: 'translateZ(4px)' }}>
        <g style={{ transform: (type === 'cavalry' || type === 'elephant') ? 'translateY(-20px)' : 'none' }}>
          {/* Chest Plate */}
          <path d="M 20 34 L 44 34 L 42 50 L 22 50 Z" fill={colorArmor} />
          {/* Shoulder Pads */}
          <circle cx="22" cy="38" r="5" fill="#fbbf24" />
          <circle cx="42" cy="38" r="5" fill="#fbbf24" />
          {/* Belt */}
          <rect x="21" y="48" width="22" height="4" fill="#1e293b" />
          <rect x="30" y="46" width="4" height="8" fill="#fbbf24" />
        </g>
      </svg>

      {/* LAYER 4: Head & Face (Z = 8px) */}
      <svg width="64" height="96" className="absolute inset-0 overflow-visible" style={{ transform: 'translateZ(8px)' }}>
        <g style={{ transform: (type === 'cavalry' || type === 'elephant') ? 'translateY(-20px)' : 'none' }}>
          {/* Neck */}
          <rect x="29" y="28" width="6" height="10" fill={colorSkin} />
          {/* Face */}
          <circle cx="32" cy="22" r="8" fill={colorSkin} />
          {/* Helmet (Vietnamese historic style) */}
          <path d="M 20 22 Q 32 0 44 22 L 46 26 L 18 26 Z" fill={colorArmor} />
          <path d="M 32 6 L 32 0" stroke="#fbbf24" strokeWidth="3" />
          <circle cx="32" cy="0" r="3" fill="#ef4444" />
        </g>
      </svg>

      {/* LAYER 5: Weapon & Shield (Z = 12px) */}
      <svg width="64" height="96" className="absolute inset-0 overflow-visible" style={{ transform: 'translateZ(12px)' }}>
        <g style={{ transform: (type === 'cavalry' || type === 'elephant') ? 'translateY(-20px)' : 'none' }}>
          {type === 'spear' && (
            <g className={isAttacking ? 'animate-[thrust_0.3s_ease-in-out_2]' : ''}>
              {/* Spear */}
              <line x1="48" y1="80" x2="48" y2="10" stroke="#78350f" strokeWidth="4" strokeLinecap="round" />
              <polygon points="48,-5 43,10 53,10" fill="#cbd5e1" />
              {/* Shield */}
              <circle cx="20" cy="50" r="14" fill={colorArmor} />
              <circle cx="20" cy="50" r="6" fill="#fbbf24" />
            </g>
          )}
          {type === 'archer' && (
            <g className={isAttacking ? 'animate-[shoot_0.5s_ease-in-out_1]' : ''}>
              {/* Bow */}
              <path d="M 45 20 Q 55 45 45 70" fill="none" stroke="#78350f" strokeWidth="4" strokeLinecap="round" />
              <line x1="45" y1="20" x2="45" y2="70" stroke="#cbd5e1" strokeWidth="1" />
              {/* Arrow */}
              {isAttacking && (
                <line x1="25" y1="45" x2="55" y2="45" stroke="#fff" strokeWidth="2" className="animate-[arrow-fly_0.5s_ease-in_forwards]" />
              )}
            </g>
          )}
          {(type === 'cavalry' || type === 'elephant') && (
            <g className={isAttacking ? 'animate-[thrust_0.3s_ease-in-out_2]' : ''}>
              {/* Sword/Glaive */}
              <line x1="45" y1="60" x2="60" y2="10" stroke="#78350f" strokeWidth="4" strokeLinecap="round" />
              <polygon points="62,5 57,15 65,12" fill="#cbd5e1" />
            </g>
          )}
        </g>
      </svg>

    </div>
  );
};
