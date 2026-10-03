import React, { useEffect, useState } from 'react';
import type { Faction } from '../../types';
import { fallbackFactionImage, sanitizeFactionImage } from '../../services/api';

export const FACTION_EMBLEM_MAP: Record<number, { img: string; symbol: string; color: string; label: string }> = {
  1: { img: '/dai-viet-worlds.webp', symbol: '🥁', color: 'from-amber-700 to-yellow-900', label: 'Văn Lang – Âu Lạc' },
  2: { img: '/hai-ba-trung.webp', symbol: '🐘', color: 'from-rose-700 to-pink-900', label: 'Hai Bà Trưng – Bà Triệu' },
  3: { img: '/dai-viet-hero.webp', symbol: '⚔️', color: 'from-blue-700 to-indigo-900', label: 'Nhà Ngô – Nhà Đinh' },
  4: { img: '/dai-viet-worlds.webp', symbol: '🐉', color: 'from-amber-600 to-yellow-800', label: 'Nhà Lý' },
  5: { img: '/tran-hung-dao.webp', symbol: '🦅', color: 'from-blue-800 to-cyan-950', label: 'Nhà Trần' },
  6: { img: '/le-loi.webp', symbol: '🗡️', color: 'from-emerald-700 to-teal-950', label: 'Hậu Lê – Lam Sơn' },
  7: { img: '/quang-trung.webp', symbol: '🔥', color: 'from-red-700 to-amber-950', label: 'Tây Sơn' },
  8: { img: '/dai-viet-worlds.webp', symbol: '☀️', color: 'from-yellow-700 to-orange-950', label: 'Nhà Nguyễn' },
};

export function getFactionEmblem(faction?: Partial<Faction> | null) {
  const id = faction?.faction_id || 1;
  const byId = FACTION_EMBLEM_MAP[id];
  if (byId) return byId;

  const name = faction?.name || '';
  const byName = Object.values(FACTION_EMBLEM_MAP).find(c => 
    c.label.toLowerCase().includes(name.toLowerCase().slice(0, 5)) ||
    name.toLowerCase().includes(c.label.toLowerCase().slice(0, 5))
  );
  return byName || FACTION_EMBLEM_MAP[1];
}

interface FactionBadgeProps {
  faction?: Partial<Faction> | null;
  className?: string;
  src?: string;
  imgClassName?: string;
  showFallbackIcon?: boolean;
}

/** Avatar faction có fallback local: không bao giờ gọi domain ngoài hay để vỡ ảnh. */
export const FactionBadge: React.FC<FactionBadgeProps> = ({
  faction,
  className = '',
  src,
  imgClassName = 'h-full w-full object-cover',
  showFallbackIcon = true,
}) => {
  const [failed, setFailed] = useState(false);
  const emblem = getFactionEmblem(faction);
  
  const rawSrc = src ?? faction?.image;
  const resolved = sanitizeFactionImage(rawSrc, faction?.faction_id || 1) || emblem.img;

  useEffect(() => {
    setFailed(false);
  }, [faction?.faction_id, faction?.image, src]);

  const factionName = faction?.name || emblem.label;

  return (
    <div 
      className={`relative flex items-center justify-center overflow-hidden bg-gradient-to-br ${emblem.color} ${className}`}
      aria-label={factionName}
    >
      {!failed && resolved ? (
        <img
          src={resolved}
          alt={factionName}
          className={imgClassName}
          loading="lazy"
          onError={() => setFailed(true)}
        />
      ) : (
        <span className="flex h-full w-full items-center justify-center text-lg select-none" title={factionName}>
          {emblem.symbol}
        </span>
      )}
    </div>
  );
};
