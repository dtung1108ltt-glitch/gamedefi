import React, { useEffect, useState } from 'react';
import { Check, Shield, Swords, Zap } from 'lucide-react';
import { Faction } from '../../types';
import { sanitizeFactionImage, handleFactionImageError } from '../../services/api';
import './FactionCard.css';

interface FactionCardProps {
  faction: Faction;
  isSelected: boolean;
  onSelect: (faction: Faction) => void;
  onPlayDrum: () => void;
}

export const FactionCard: React.FC<FactionCardProps> = ({ faction, isSelected, onSelect, onPlayDrum }) => {
  const [artFailed, setArtFailed] = useState(false);
  useEffect(() => { setArtFailed(false); }, [faction.faction_id, faction.image]);
  const artSrc = sanitizeFactionImage(faction.image, faction.faction_id);
  return (
  <button
    type="button"
    className={`faction-card faction-art-${faction.faction_id} ${isSelected ? 'is-selected' : ''}`}
    aria-pressed={isSelected}
    onClick={() => { onPlayDrum(); onSelect(faction); }}
  >
    <div className="faction-card-art" aria-hidden="true">
      {!artFailed ? (
        <img
          src={artSrc}
          alt=""
          loading="lazy"
          decoding="async"
          onError={(event) => {
            handleFactionImageError(event, faction.faction_id);
            setArtFailed(true);
          }}
        />
      ) : null}
    </div>
    <div className="faction-card-top">
      <span>Triều Đại #{faction.faction_id}</span>
      {isSelected && <span className="faction-card-selected"><Check aria-hidden="true" /> Đang chọn</span>}
    </div>
    <div className="faction-card-body">
      <span className="faction-card-era">{faction.historical_era}</span>
      <h3>{faction.name}</h3>
      <p>{faction.special_unit}</p>
      <div className="faction-card-stats" aria-label="Đặc tính chiến lược">
        <span title="Sức công phá"><Swords aria-hidden="true" /> Công +{faction.attack_bonus ?? 0}%</span>
        <span title="Khả năng phòng thủ"><Shield aria-hidden="true" /> Thủ +{faction.defense_bonus ?? 0}%</span>
        <span title="Tốc độ cơ động"><Zap aria-hidden="true" /> Cơ động +{faction.movement_bonus ?? 0}%</span>
      </div>
    </div>
  </button>
  );
};
