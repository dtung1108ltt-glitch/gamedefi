import React from 'react';
import { BattleUnit } from '../../types';

interface BattleAdvantagePanelProps {
  units?: BattleUnit[];
  tideTurnsLeft?: number;
  log?: string[];
}

/**
 * Minimalist Real-Time Combat Log
 * Chỉ render duy nhất diễn biến trận đấu theo thời gian thực:
 * - Vị trí: Cố định 1/3 trên màn hình (top: 15%), căn giữa theo chiều ngang (left: 50%, translateX(-50%)).
 * - Nền: Hoàn toàn trong suốt, không viền, không box-shadow, không che khuất thao tác người chơi (pointer-events: none).
 * - Hiển thị 2 - 3 dòng diễn biến gần nhất với hiệu ứng đổ bóng đọc rõ trên nền 3D.
 * - Dòng mới nhất màu vàng kim nổi bật, các dòng trước mờ dần (opacity: 0.85 -> 0.5 -> 0.2).
 */
export const BattleAdvantagePanel: React.FC<BattleAdvantagePanelProps> = ({
  log = [],
}) => {
  // Giới hạn hiển thị 2 - 3 dòng diễn biến gần nhất
  const recentLogs = (log || []).slice(0, 3);

  if (recentLogs.length === 0) return null;

  return (
    <div
      className="fixed select-none flex flex-col items-center justify-center text-center space-y-1 transition-all duration-300 pointer-events-none"
      style={{
        position: 'fixed',
        top: '15%',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 40,
        pointerEvents: 'none',
        background: 'transparent',
        border: 'none',
        boxShadow: 'none',
        width: 'max-content',
        maxWidth: '85vw',
      }}
    >
      {recentLogs.map((entry, idx) => {
        // Dòng mới nhất màu vàng kim nổi bật, các dòng cũ mờ dần (0.85 -> 0.5 -> 0.2)
        let color = '#facc15';
        let opacity = 0.85;
        let fontClasses = 'text-xs md:text-sm font-bold font-serif tracking-wide';

        if (idx === 0) {
          color = '#facc15'; // Vàng kim nổi bật
          opacity = 0.95;
          fontClasses = 'text-xs md:text-sm font-bold font-serif tracking-wide';
        } else if (idx === 1) {
          color = '#f1f5f9'; // Trắng sáng / bạc
          opacity = 0.5;
          fontClasses = 'text-[11px] md:text-xs font-medium';
        } else {
          color = '#cbd5e1'; // Bạc nhạt
          opacity = 0.2;
          fontClasses = 'text-[10px] md:text-[11px] font-normal';
        }

        return (
          <div
            key={`${entry}-${idx}`}
            className={`transition-all duration-300 leading-snug text-center ${fontClasses}`}
            style={{
              color,
              opacity,
              textShadow: '0 2px 4px rgba(0, 0, 0, 0.8), 0 0 8px rgba(0, 0, 0, 0.6)',
            }}
          >
            {entry}
          </div>
        );
      })}
    </div>
  );
};
