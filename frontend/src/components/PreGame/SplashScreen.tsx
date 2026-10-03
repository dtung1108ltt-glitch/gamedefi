import React, { useState } from 'react';
import { ArrowDownUp, ArrowLeftRight, ArrowRight, BookOpen, Check, ChevronRight, Coins, Crown, Flag, LockKeyhole, Play, Shield, ShoppingBag, Swords, Trophy } from 'lucide-react';
import { Player } from '../../types';
import type { QuickSwapIntent } from '../../types/dex';
import { DEFAULT_FACTIONS } from '../../services/api';
import './SplashScreen.css';

interface SplashScreenProps {
  player: Player | null;
  onEnterF2P: () => void;
  onOpenCampaign: () => void;
  onOpenAdvisors: () => void;
  onOpenMarketplace: () => void;
  onOpenDex: (intent?: QuickSwapIntent) => void;
  onPlayDrum: () => void;
  onPlayGong: () => void;
}

const worlds = [
  { label: 'Chiến dịch', detail: 'Dàn trận, chọn triều đại và chinh chiến qua sử Việt.', eyebrow: 'Chiến thuật theo lượt', art: 'campaign', Icon: Swords, action: 'Vào game' },
  { label: 'Quân Sư', detail: 'Tìm hiểu những danh tướng đồng hành cùng quân đội.', eyebrow: 'Tướng cố vấn', art: 'advisor', Icon: Crown, action: 'Gặp quân sư' },
  { label: 'Marketplace', detail: 'Xem khu Chợ Tướng. Giao dịch đang chờ escrow on-chain.', eyebrow: 'Đang xem trước', art: 'market', Icon: ShoppingBag, action: 'Xem chợ tướng' },
  { label: 'DEX', detail: 'Đổi SOL với USDC hoặc USDT thử trên Solana Devnet.', eyebrow: 'SOL / Token thử', art: 'dex', Icon: ArrowLeftRight, action: 'Mở DEX' },
];

const legends = [
  { name: 'Hai Bà Trưng', note: 'Khởi nghĩa Mê Linh', image: '/hai-ba-trung.webp' },
  { name: 'Trần Hưng Đạo', note: 'Hào khí Đông A', image: '/tran-hung-dao.webp' },
  { name: 'Lê Lợi', note: 'Khởi nghĩa Lam Sơn', image: '/le-loi.webp' },
  { name: 'Quang Trung', note: 'Đại phá quân Thanh', image: '/quang-trung.webp' },
];

const chapters = [
  { name: 'Bạch Đằng', era: 'Thủy chiến mở màn', available: true },
  { name: 'Khởi nghĩa', era: 'Gây dựng nghĩa quân', available: false },
  { name: 'Thống nhất', era: 'Quy tụ anh hùng', available: false },
  { name: 'Bắc phạt', era: 'Tiến quân ra Bắc', available: false },
  { name: 'Vươn ra biển lớn', era: 'Chương mới', available: false },
];

const seasonLeaders = [
  { name: 'Đại Việt Dũng Sĩ', level: 52, power: 1420580, wins: 92 },
  { name: 'Trần Quốc Tuấn', level: 48, power: 1280430, wins: 114 },
  { name: 'BinhKhíRồngÁ', level: 45, power: 980210, wins: 138 },
  { name: 'Hồng Hà Nhi', level: 49, power: 760332, wins: 82 },
  { name: 'Nam Thiên Đế', level: 40, power: 650118, wins: 104 },
];
type RankMetric = 'power' | 'level' | 'wins';

export const SplashScreen: React.FC<SplashScreenProps> = ({
  player,
  onEnterF2P,
  onOpenCampaign,
  onOpenAdvisors,
  onOpenMarketplace,
  onOpenDex,
  onPlayDrum,
  onPlayGong,
}) => {
  const [rankMetric, setRankMetric] = useState<RankMetric>('power');
  const [swapFrom, setSwapFrom] = useState<'USDC' | 'SOL'>('SOL');
  const [swapAmount, setSwapAmount] = useState('');
  const rankedLeaders = [...seasonLeaders].sort((a, b) => b[rankMetric] - a[rankMetric]);

  const startGame = () => {
    onPlayGong();
    if (player) onOpenCampaign();
    else onEnterF2P();
  };
  const openQuickSwap = () => {
    onPlayDrum();
    onOpenDex({ fromToken: swapFrom, amount: swapAmount });
  };
  const actions = [startGame, onOpenAdvisors, onOpenMarketplace, () => onOpenDex()];

  return (
    <div className="portal-home">
      <div className="portal-home-backdrop" aria-hidden="true" />
      <section className="portal-hero" aria-labelledby="portal-title">
        <div className="portal-hero-content">
          <div className="portal-hero-copy">
            <p className="portal-kicker">GameFi · DeFi · Việt sử hùng ca</p>
            <h1 id="portal-title" className="portal-hero-title-lockup">
              <img
                className="portal-hero-title-image"
                src="/hao-khi-dai-viet-logo.png"
                alt="Hào Khí Đại Việt — Việt sử hùng ca"
                width="1536"
                height="1024"
              />
            </h1>
            <p className="portal-hero-lead">Hệ sinh thái GameFi tái hiện hào hùng lịch sử Việt Nam.</p>
            <p className="portal-hero-description">Chọn triều đại, chiêu mộ binh mã và dẫn quân qua những trận đánh vang dội. Chơi miễn phí; kết nối ví khi muốn giao dịch.</p>
            <div className="portal-hero-actions">
              <button className="portal-button portal-button-primary" type="button" onClick={startGame}><Play aria-hidden="true" /> Chơi ngay <ArrowRight aria-hidden="true" /></button>
              <a className="portal-button portal-button-secondary" href="#ecosystem"><BookOpen aria-hidden="true" /> Khám phá hệ sinh thái</a>
            </div>
            <div className="portal-hero-pills" aria-label="Các khu vực của game">
              <span>Chiến thuật theo lượt</span><span>Tướng cố vấn</span><span>SOL / Token thử Devnet</span>
            </div>
          </div>
        </div>
      </section>

      <div className="portal-container">
        <div className="portal-status-strip" aria-label={player ? 'Thông tin người chơi' : 'Thông tin trò chơi'}>
          {player ? (
            <>
              <div><Crown aria-hidden="true" /><span><small>Tướng quân</small><strong>{player.username}</strong></span></div>
              <div><Shield aria-hidden="true" /><span><small>Cấp hiện tại</small><strong>{player.level}</strong></span></div>
              <div><Flag aria-hidden="true" /><span><small>Trận thắng</small><strong>{player.battles_won ?? '—'}</strong></span></div>
              <div><Trophy aria-hidden="true" /><span><small>Sao chiến dịch</small><strong>{player.campaign_stars ?? '—'}</strong></span></div>
            </>
          ) : (
            <>
              <div><Flag aria-hidden="true" /><span><small>Khởi đầu</small><strong>{DEFAULT_FACTIONS.length} triều đại</strong></span></div>
              <div><Swords aria-hidden="true" /><span><small>Trải nghiệm</small><strong>Chơi miễn phí</strong></span></div>
              <div><Crown aria-hidden="true" /><span><small>Đồng hành</small><strong>Tướng cố vấn</strong></span></div>
              <div><Coins aria-hidden="true" /><span><small>Giao thương</small><strong>Solana Devnet</strong></span></div>
            </>
          )}
        </div>

        <section id="ecosystem" className="portal-section portal-worlds" aria-labelledby="portal-worlds-title">
          <div className="portal-heading"><div><p className="portal-kicker">Hệ sinh thái</p><h2 id="portal-worlds-title">Một thế giới, nhiều cách trải nghiệm</h2><p>Chiến dịch, tướng lĩnh và giao thương cùng tồn tại trong thế giới Hào Khí Đại Việt.</p></div></div>
          <div className="portal-world-grid">
            {worlds.map((world, index) => (
              <article className="portal-world" key={world.label}>
                <div className={`portal-world-art world-${world.art}`} aria-hidden="true"><world.Icon /></div>
                <div className="portal-world-body"><span>{world.eyebrow}</span><h3>{world.label}</h3><p>{world.detail}</p><button type="button" onClick={actions[index]}>{world.action}<ArrowRight aria-hidden="true" /></button></div>
              </article>
            ))}
          </div>
        </section>

        <section className="portal-section portal-legends" aria-labelledby="portal-legends-title">
          <div className="portal-heading"><div><p className="portal-kicker">Sử Việt trong game</p><h2 id="portal-legends-title">Những tên tuổi làm nên hào khí</h2></div><button type="button" onClick={onOpenAdvisors}>Khám phá quân sư <ArrowRight aria-hidden="true" /></button></div>
          <div className="portal-legend-grid">
            {legends.map((legend) => (
              <figure className="portal-legend" key={legend.name}>
                <img className="portal-legend-image" src={legend.image} alt={`Tranh minh họa ${legend.name}`} loading="lazy" decoding="async" />
                <figcaption><span>{legend.note}</span><strong>{legend.name}</strong></figcaption>
              </figure>
            ))}
          </div>
        </section>

        <div className="portal-feature-grid portal-showcase-grid">
          <section className="portal-panel portal-path" aria-labelledby="portal-path-title">
            <div className="portal-panel-heading"><div><h2 id="portal-path-title">Lộ trình chinh phạt</h2><p>Khám phá các chương truyện lịch sử, mở khóa tướng lĩnh và nhận phần thưởng.</p></div><button type="button" onClick={startGame}>Xem chi tiết <ArrowRight aria-hidden="true" /></button></div>
            <ol className="portal-path-list">
              {chapters.map((chapter, index) => <li className={chapter.available ? 'is-available' : 'is-locked'} key={chapter.name}>
                <div className={`portal-path-art portal-path-art-${index + 1}`} aria-hidden="true" />
                <span className="portal-path-marker" aria-label={chapter.available ? 'Có thể chơi' : 'Sắp mở'}>{chapter.available ? <Check aria-hidden="true" /> : <LockKeyhole aria-hidden="true" />}</span>
                <span className="portal-path-chapter">Chương {index + 1}</span>
                <strong>{chapter.name}</strong><small>{chapter.available ? chapter.era : 'Sắp mở · ' + chapter.era}</small>
              </li>)}
            </ol>
            <div className="portal-path-progress" aria-label="1 trong 5 chương đã mở">
              <span>Đã mở 1/5 chương</span><div aria-hidden="true"><i /></div><span>4 chương sắp mở</span>
            </div>
          </section>
          <section className="portal-panel portal-trade" aria-labelledby="portal-trade-title">
            <div className="portal-panel-heading"><div><h2 id="portal-trade-title">Swap nhanh</h2><p>Đổi SOL và USDC thử trên Solana Devnet.</p></div><button type="button" onClick={() => onOpenDex()}>Mở DEX <ArrowRight aria-hidden="true" /></button></div>
            <div className="portal-swap-form">
              <label className="portal-swap-row">
                <span className="portal-swap-token"><img src={swapFrom === 'USDC' ? '/usdc-token.svg' : '/solana-token.svg'} alt="" /><strong>{swapFrom}</strong></span>
                <span className="portal-swap-field"><span>Bạn gửi</span><input inputMode="decimal" type="text" value={swapAmount} onChange={(event) => setSwapAmount(event.target.value.replace(/[^\d.,]/g, ''))} placeholder="0.00" aria-label={`Số lượng ${swapFrom} muốn đổi`} /></span>
              </label>
              <button className="portal-swap-reverse" type="button" onClick={() => { setSwapFrom(swapFrom === 'USDC' ? 'SOL' : 'USDC'); setSwapAmount(''); }} aria-label="Đảo chiều cặp giao dịch"><ArrowDownUp aria-hidden="true" /></button>
              <div className="portal-swap-row portal-swap-result">
                <span className="portal-swap-token"><img src={swapFrom === 'USDC' ? '/solana-token.svg' : '/usdc-token.svg'} alt="" /><strong>{swapFrom === 'USDC' ? 'SOL' : 'USDC'}</strong></span>
                <span className="portal-swap-field"><span>Bạn nhận</span><strong>—</strong></span>
              </div>
            </div>
            <button type="button" className="portal-swap-submit" onClick={openQuickSwap}>Hoán đổi trong DEX <ArrowRight aria-hidden="true" /></button>
            <p className="portal-trade-note">Tỷ giá, phí và số dư thực tế được xác nhận trong DEX trước khi ký ví.</p>
          </section>
        </div>

        <div className="portal-feature-grid portal-bottom-grid">
          <section id="leaderboard" className="portal-panel portal-leaderboard" aria-labelledby="portal-leaderboard-title">
            <div className="portal-panel-heading"><div><h2 id="portal-leaderboard-title">Bảng xếp hạng mùa giải</h2><p className="portal-mock-label">Dữ liệu minh họa · Phần thưởng dự kiến</p></div><button type="button" onClick={startGame}>Vào chiến dịch <ArrowRight aria-hidden="true" /></button></div>
            <div className="portal-rank-tabs" role="group" aria-label="Sắp xếp bảng xếp hạng">
              {([['power', 'Tổng lực chiến'], ['level', 'Cấp độ'], ['wins', 'Trận thắng']] as const).map(([metric, label]) => <button type="button" key={metric} className={rankMetric === metric ? 'is-active' : ''} aria-pressed={rankMetric === metric} onClick={() => setRankMetric(metric)}>{label}</button>)}
            </div>
            <div className="portal-leader-scroll"><div className="portal-leader-table" role="table" aria-label="Bảng xếp hạng mùa giải minh họa">
              <div role="row" className="portal-leader-head"><span role="columnheader">#</span><span role="columnheader">Người chơi</span><span role="columnheader">Cấp độ</span><span role="columnheader">{rankMetric === 'wins' ? 'Trận thắng' : 'Lực chiến'}</span><span role="columnheader">Phần thưởng</span></div>
              {rankedLeaders.map((leader, index) => <div role="row" key={leader.name}>
                <span className={`portal-rank-number rank-${index + 1}`} role="cell">{index + 1}</span>
                <strong role="cell"><span className="portal-rank-avatar" aria-hidden="true">{leader.name.slice(0, 1)}</span>{leader.name}</strong>
                <span role="cell">Lv.{leader.level}</span>
                <span role="cell">{(rankMetric === 'wins' ? leader.wins : leader.power).toLocaleString('vi-VN')}</span>
                <span className="portal-rank-reward" role="cell"><img src="/solana-token.svg" alt="" />{[0.01, 0.008, 0.006, 0.004, 0.002][index].toLocaleString('vi-VN')} SOL thử</span>
              </div>)}
            </div></div>
          </section>
          <section className="portal-panel portal-spotlight" aria-labelledby="portal-spotlight-title">
            <div className="portal-spotlight-art" aria-hidden="true" />
            <div className="portal-spotlight-content"><p className="portal-kicker">Chiến dịch nổi bật · Có thể chơi</p><h2 id="portal-spotlight-title">Bạch Đằng</h2><p>Dụng binh giữa thủy triều và cọc ngầm. Thử tài điều quân trong trận chiến đã đi vào sử Việt.</p><button type="button" onClick={startGame}>Tham gia ngay <ChevronRight aria-hidden="true" /></button></div>
          </section>
        </div>
      </div>
    </div>
  );
};
