import React, { useState } from 'react';
import { ArrowLeft, ArrowRight, Flag, Swords, Waves, Shield, Castle } from 'lucide-react';
import { Faction, MapLocation, Player } from '../../types';
import { MAP_LOCATIONS } from '../../data/campaign';
import './CampaignMap.css';

interface CampaignMapProps {
  player: Player;
  faction: Faction;
  onDeploy: (location: MapLocation) => void;
  onBackToLobby: () => void;
  onPlayGong: () => void;
}

export const CampaignMap: React.FC<CampaignMapProps> = ({
  player,
  faction,
  onDeploy,
  onBackToLobby,
  onPlayGong,
}) => {
  // Support both Thăng Long and Bạch Đằng as active playable battlefields
  const [selectedLocationId, setSelectedLocationId] = useState<string>('thang_long');

  const selectedLocation =
    MAP_LOCATIONS.find((loc) => loc.location_id === selectedLocationId) ||
    MAP_LOCATIONS.find((loc) => loc.location_id === 'thang_long') ||
    MAP_LOCATIONS[0];

  const otherLocations = MAP_LOCATIONS.filter(
    (loc) => loc.location_id !== selectedLocation.location_id
  );

  const isPhuXuan = selectedLocation.location_id === 'phu_xuan' || selectedLocation.location_id === 'phu-xuan';
  const isLamSon = selectedLocation.location_id === 'lam_son';
  const isThangLong = selectedLocation.location_id === 'thang_long';

  const deploy = (loc: MapLocation = selectedLocation) => {
    onPlayGong();
    onDeploy(loc);
  };

  return (
    <div className="app-screen campaign-screen">
      <section className="campaign-hero" aria-labelledby="campaign-title">
        <div className="campaign-hero-inner">
          <button type="button" className="campaign-back" onClick={onBackToLobby}>
            <ArrowLeft aria-hidden="true" /> Về tổng hành dinh
          </button>
          <p className="campaign-kicker">Chiến dịch lịch sử · Chiến thuật theo lượt 2.5D</p>
          <h1 id="campaign-title">
            {isPhuXuan ? (
              <>
                Tiến chiếm <span>Phú Xuân</span>
              </>
            ) : isLamSon ? (
              <>
                Khởi nghĩa <span>Lam Sơn</span>
              </>
            ) : isThangLong ? (
              <>
                Bảo vệ <span>Thăng Long</span>
              </>
            ) : (
              <>
                Dẫn quân vào <span>Bạch Đằng</span>
              </>
            )}
          </h1>
          <p>
            {isPhuXuan
              ? 'Chiến dịch thần tốc của đại quân Tây Sơn. Vượt sông Hương, kiểm soát Tây Kiều và Đông Kiều, tiến thẳng vào cổng Ngọ Môn và sân rồng để thu phục kinh đô Phú Xuân.'
              : isLamSon
              ? 'Dựa vào rừng rậm Lam Sơn và địa thế hiểm trở của ải Chi Lăng để mai phục, tập kích kho lương và chém tướng Liễu Thăng.'
              : isThangLong
              ? 'Tử thủ kinh thành Thăng Long trước đại quân xâm lược. Dựa vào thành cao, cổng Đoan Môn và tháp canh nỏ thần để bảo vệ Hoàng thành.'
              : 'Chọn vị trí, tận dụng địa hình sông nước và đón đúng thời cơ thủy triều rút để dụ giặc vào bãi cọc ngầm tiêu diệt toàn bộ chiến thuyền.'}
          </p>
          <button
            type="button"
            className="campaign-deploy"
            onClick={() => deploy(selectedLocation)}
          >
            <Swords aria-hidden="true" />{' '}
            {isPhuXuan ? 'Vào trận Phú Xuân' : isLamSon ? 'Vào trận Lam Sơn' : isThangLong ? 'Vào trận Thăng Long' : 'Vào trận Bạch Đằng'}{' '}
            <ArrowRight aria-hidden="true" />
          </button>
        </div>
      </section>

      <div className="campaign-container">
        <div className="campaign-summary">
          <div>
            <Flag aria-hidden="true" />
            <span>
              <small>Triều đại đã chọn</small>
              <strong>{faction.name}</strong>
            </span>
          </div>
          <div>
            <Swords aria-hidden="true" />
            <span>
              <small>Tướng quân</small>
              <strong>{player.username}</strong>
            </span>
          </div>
          <div>
            {isPhuXuan ? <span className="text-base">👑</span> : isLamSon ? <span className="text-base">🌲</span> : isThangLong ? <Shield aria-hidden="true" /> : <Waves aria-hidden="true" />}
            <span>
              <small>Chiến trường đang chọn</small>
              <strong>{selectedLocation.name} ({selectedLocation.sub_label})</strong>
            </span>
          </div>
        </div>

        <div className="campaign-content">
          {/* Main Selected Battlefield Card */}
          <section className="campaign-main-card" aria-labelledby="campaign-current-title">
            <div
              className="campaign-main-art"
              style={{
                backgroundImage: isPhuXuan || isLamSon || isThangLong
                  ? "linear-gradient(180deg, rgba(6,20,33,0.2), rgba(6,20,33,0.85)), url('/dai-viet-worlds.webp')"
                  : "linear-gradient(180deg, rgba(6,20,33,0.2), rgba(6,20,33,0.85)), url('/dai-viet-hero.webp')",
              }}
              aria-hidden="true"
            />
            <div className="campaign-main-copy">
              <span className="campaign-available">Có thể vào trận</span>
              <h2 id="campaign-current-title">
                {isPhuXuan
                  ? 'Tiến Chiếm Kinh Đô Phú Xuân — Chiến Dịch Thần Tốc'
                  : isLamSon
                  ? 'Khởi Nghĩa Lam Sơn — Chiến Thuật Du Kích'
                  : isThangLong
                  ? 'Bảo Vệ Kinh Đô Thăng Long'
                  : 'Đại Chiến Bạch Đằng 1288'}
              </h2>
              <p>
                {isPhuXuan
                  ? 'Chiến trường phức hợp gồm dòng sông Hương thơ mộng, hai cây cầu chiến lược Tây Kiều & Đông Kiều, cổng Ngọ Môn và Sân Rồng Hoàng Thành. Người chơi chiến đấu giành quyền kiểm soát 2 trong 3 mục tiêu trọng yếu để kích hoạt Mạng lưới kiểm soát và giải phóng toàn bộ kinh thành.'
                  : isLamSon
                  ? 'Chiến trường rừng núi hiểm trở với chiến thuật chiến tranh du kích bí mật. Dựa vào cây cối rậm rạp để ẩn mình tung đòn phục kích chết người, chẹn đường hẹp và đánh úp kho lương tiếp tế của Liễu Thăng.'
                  : isThangLong
                  ? 'Chiến trường công thủ thành trì kinh điển gồm 3 lớp phòng tuyến: Ngoại thành, Tường thành & Cổng Đoan Môn, và Sân Rồng Hoàng Thành. Thái úy Lý Thường Kiệt trực tiếp thống lĩnh Cấm Quân tử thủ, tuyệt đối không để quân địch tràn vào Điện Thiên An.'
                  : 'Một chiến trường sông nước lục giác với bãi phù sa, gò cao và bãi cọc ngầm cắm sâu đáy sông. Bố trí binh lực đón thời điểm thủy triều rút để dồn ép hạm đội Ô Mã Nhi vào thế đường cùng.'}
              </p>
              <div className="campaign-terrain">
                {isPhuXuan ? (
                  <>
                    <span>🌉 Tây Kiều (+15% Xung kích)</span>
                    <span>🎯 Đông Kiều (+15% Tầm)</span>
                    <span>👑 Sân Rồng (+20% Tinh thần)</span>
                    <span>🏯 Cổng Ngọ Môn (+20% DEF)</span>
                  </>
                ) : isLamSon ? (
                  <>
                    <span>🌲 Rừng sâu (+25% DEF)</span>
                    <span>⚔ Phục kích (+30% ST đầu)</span>
                    <span>⛰ Địa hình cao (+15% Tầm)</span>
                    <span>🛤 Đường hẹp (+20% DEF)</span>
                  </>
                ) : isThangLong ? (
                  <>
                    <span>🏯 Tường thành (+25% DEF)</span>
                    <span>🚪 Cổng Đoan Môn (+20% DEF)</span>
                    <span>🏹 Tháp canh (+15% Tầm)</span>
                    <span>👑 Hoàng thành (+10% Sĩ khí)</span>
                  </>
                ) : (
                  <>
                    <span>🌊 Sông nước</span>
                    <span>🪵 Bãi cọc ngầm (+50% ST)</span>
                    <span>🌿 Rừng ngập mặn</span>
                    <span>🌙 Thủy triều</span>
                  </>
                )}
              </div>
              <button type="button" onClick={() => deploy(selectedLocation)}>
                Dàn trận ngay <ArrowRight aria-hidden="true" />
              </button>
            </div>
          </section>

          {/* Other Historic Locations Sidebar */}
          <aside className="campaign-other" aria-labelledby="campaign-other-title">
            <p className="campaign-kicker">Dấu mốc trong sử Việt</p>
            <h2 id="campaign-other-title">Chọn chiến trường khác</h2>
            <p>Chọn các chiến trường lịch sử đã mở để dàn trận hoặc xem thông tin các cứ điểm tiếp theo.</p>
            <ul>
              {otherLocations.map((loc) => {
                const isPlayable = loc.location_id === 'bach_dang' || loc.location_id === 'thang_long' || loc.location_id === 'lam_son' || loc.location_id === 'phu_xuan' || loc.location_id === 'phu-xuan';

                return (
                  <li
                    key={loc.location_id}
                    onClick={() => {
                      if (isPlayable) {
                        setSelectedLocationId(loc.location_id);
                      }
                    }}
                    style={{
                      cursor: isPlayable ? 'pointer' : 'default',
                      border: isPlayable ? '1px solid #c9a44c' : '1px solid #506974',
                      background: isPlayable ? '#16364c' : '#102b3c',
                    }}
                    title={isPlayable ? `Nhấn để chuyển sang chiến trường ${loc.name}` : 'Chiến trường chưa mở'}
                  >
                    <Flag aria-hidden="true" />
                    <span>
                      <strong>{loc.name}</strong>
                      <small>{loc.sub_label}</small>
                    </span>
                    {isPlayable ? (
                      <em style={{ color: '#4ade80', fontWeight: 'bold' }}>Có thể vào trận</em>
                    ) : (
                      <em>Chưa mở</em>
                    )}
                  </li>
                );
              })}
            </ul>
          </aside>
        </div>
      </div>
    </div>
  );
};
