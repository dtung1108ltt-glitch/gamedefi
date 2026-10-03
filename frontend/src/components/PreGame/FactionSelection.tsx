import React, { useEffect, useState } from 'react';
import { Faction, Player } from '../../types';
import { FactionCard } from '../FactionCard/FactionCard';
import { Shield, Swords, Zap, ArrowLeft, ArrowRight, Loader2, CheckCircle, Award, Crown, Play, BookOpen, AlertCircle, Sparkles } from 'lucide-react';
import { FactionBadge } from '../FactionCard/FactionBadge';
import { apiService, fallbackFactionImage, sanitizeFactionImage } from '../../services/api';

interface FactionSelectionProps {
  factions: Faction[];
  selectedFactionId: number;
  onSelectFactionId: (id: number) => void;
  selectedFaction: Faction;
  player: Player | null;
  isMinting: boolean;
  mintStatus: string;
  mintNotice: string | null;
  onMintFaction: (factionId: number) => Promise<any>;
  configError?: string | null;
  mintReady?: boolean;
  onRetryConfig?: () => void;
  onProceedToLobby: () => void;
  onBackToSplash: () => void;
  onPlayDrum: () => void;
  onPlayGong: () => void;
  onPlaySword: () => void;
  onUpdatePlayer?: (player: Player) => void;
}

export const FactionSelection: React.FC<FactionSelectionProps> = ({
  factions,
  selectedFactionId,
  onSelectFactionId,
  selectedFaction,
  player,
  isMinting,
  mintStatus,
  mintNotice,
  onMintFaction,
  configError,
  mintReady,
  onRetryConfig,
  onProceedToLobby,
  onBackToSplash,
  onPlayDrum,
  onPlayGong,
  onPlaySword,
  onUpdatePlayer,
}) => {
  const [isSelectingF2P, setIsSelectingF2P] = useState<boolean>(false);
  const [detailImage, setDetailImage] = useState<string>(() => sanitizeFactionImage(selectedFaction.image, selectedFaction.faction_id));
  // Một nguồn lỗi duy nhất: nhánh ví dùng mintStatus (từ useFaction),
  // nhánh guest/F2P dùng selectionError cục bộ — không hiện 2 chỗ trùng nhau.
  const [selectionError, setSelectionError] = useState<string | null>(null);
  // Chỉ khóa nút mint on-chain khi BE/FE xác nhận configured && program_deployed.
  const mintLocked = player && !player.is_guest && mintReady === false;
  useEffect(() => {
    setDetailImage(sanitizeFactionImage(selectedFaction.image, selectedFaction.faction_id));
  }, [selectedFaction.image, selectedFaction.faction_id]);
  const isAlreadyOwned = player?.faction_id === selectedFaction.faction_id;

  const handleSelectF2P = async () => {
    onPlayGong();
    setIsSelectingF2P(true);
    setSelectionError(null);
    try {
      if (player && !player.is_guest) {
        if (!isAlreadyOwned) await onMintFaction(selectedFaction.faction_id);
        onProceedToLobby();
        return;
      }
      if (player?.wallet) {
        const updated = player.access_token
          ? await apiService.selectFactionF2P(player.wallet, selectedFaction.faction_id)
          : { ...player, faction_id: selectedFaction.faction_id, base_power: 1500 };
        if (onUpdatePlayer) onUpdatePlayer(updated);
      }
      onProceedToLobby();
    } catch (e: any) {
      console.error('Error selecting faction F2P:', e);
      // Nhánh ví đã kết nối: useFaction.mintFactionNft đã hiển thị lỗi chi tiết
      // qua mintStatus — không set selectionError nữa để tránh hiện 2 chỗ trùng nhau.
      if (player && !player.is_guest) return;
      setSelectionError(e?.message || 'Không thể chọn faction. Hãy thử lại.');
    } finally {
      setIsSelectingF2P(false);
    }
  };

  const handleProceed = () => {
    onPlayGong();
    onProceedToLobby();
  };

  return (
    <div className="app-screen max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      
      {/* Top Breadcrumb & Title */}
      <div className="faction-select-heading flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 p-5 sm:p-7 border border-imperial-border">
        <div>
          <button
            onClick={onBackToSplash}
            className="inline-flex items-center space-x-1.5 text-xs text-slate-400 hover:text-imperial-lightgold transition-colors mb-2 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Về trang chủ</span>
          </button>
          <h2 className="text-2xl sm:text-3xl font-display font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-100 via-imperial-lightgold to-yellow-500">
            Chọn Triều Đại Lịch Sử
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-1">
            Tìm hiểu cội nguồn và đồng hành cùng 8 triều đại vàng son của dân tộc Việt Nam.
          </p>
        </div>

        {/* Player Status Tag */}
        <div className="flex items-center space-x-3 bg-imperial-lacquer px-4 py-2 rounded-xl border border-imperial-border">
          <div className="text-right">
            <div className="text-xs text-slate-400">Thống lĩnh:</div>
            <div className="text-xs font-mono font-bold text-imperial-lightgold">
              {player?.username || 'Hiền sĩ viễn chinh'}
            </div>
          </div>
          <div className="px-3 py-1.5 rounded-lg bg-imperial-darkred flex items-center justify-center text-imperial-lightgold border border-imperial-gold/50 font-display font-bold text-xs">
            {player?.is_guest ? 'Khách Khám Phá' : 'Tướng Quân Viễn Chinh'}
          </div>
        </div>
      </div>

      {/* Grid: 8 Faction Cards (2 rows of 4 on large screens) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {factions.map((faction) => (
          <FactionCard
            key={faction.faction_id}
            faction={faction}
            isSelected={selectedFactionId === faction.faction_id}
            onSelect={(f) => onSelectFactionId(f.faction_id)}
            onPlayDrum={onPlayDrum}
          />
        ))}
      </div>

      {/* Inspector / Detail Banner for Selected Faction */}
      <div className="faction-detail bg-imperial-lacquer/95 border border-imperial-gold/80 rounded-2xl p-6 sm:p-8 relative overflow-hidden shadow-2xl">
        <div className="absolute -right-10 -bottom-10 text-9xl font-serif text-white/[0.03] pointer-events-none select-none">
          {selectedFaction.coat_of_arms?.charAt(0) || '越'}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Main Info Column: Title, Era, Origin, Strengths & Weaknesses (8 cols) */}
          <div className="lg:col-span-8 space-y-5">
            {/* Header badges */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs uppercase px-3 py-1 rounded-full font-bold bg-imperial-darkred text-imperial-lightgold border border-imperial-crimson shadow-sm">
                Thời kỳ: {selectedFaction.historical_era || 'Lịch Sử Việt Nam'}
              </span>
              <span className="text-xs text-amber-300/90 font-mono px-2.5 py-0.5 rounded bg-black/40 border border-slate-700">
                Triều Đại #{selectedFaction.faction_id}
              </span>
              {selectedFaction.coat_of_arms && (
                <span className="text-xs text-slate-300 px-2.5 py-0.5 rounded bg-black/30 border border-slate-800">
                  Huy hiệu: {selectedFaction.coat_of_arms}
                </span>
              )}
            </div>

            {/* Dynasty Name & Motto */}
            <div>
              <h3 className="text-3xl sm:text-4xl font-display font-black text-white tracking-wide">
                {selectedFaction.name}
              </h3>
              {selectedFaction.motto && (
                <blockquote className="mt-2 border-l-2 border-imperial-gold pl-3 italic text-amber-200/90 text-sm sm:text-base font-serif">
                  "{selectedFaction.motto}"
                </blockquote>
              )}
            </div>

            {/* Section 1: Lai Lịch & Bối Cảnh Lịch Sử */}
            <div className="rounded-xl border border-amber-600/30 bg-black/40 p-4 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-300">
                <BookOpen className="w-4 h-4 text-amber-400" />
                <span>Lai Lịch & Cội Nguồn Lịch Sử</span>
              </div>
              <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
                {selectedFaction.history_origin || selectedFaction.description}
              </p>
            </div>

            {/* Section 2: Điểm Mạnh & Điểm Yếu (Side-by-side) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Điểm Mạnh / Sở Trường */}
              <div className="rounded-xl border border-emerald-600/40 bg-emerald-950/20 p-4 space-y-1.5 shadow-inner">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-300">
                  <Sparkles className="w-4 h-4 text-emerald-400" />
                  <span>Điểm Mạnh (Sở Trường)</span>
                </div>
                <p className="text-xs text-slate-200 leading-relaxed">
                  {selectedFaction.strengths || 'Sở trường quân sự đặc trưng theo từng địa hình tác chiến.'}
                </p>
              </div>

              {/* Điểm Yếu / Thách Thức */}
              <div className="rounded-xl border border-rose-600/40 bg-rose-950/20 p-4 space-y-1.5 shadow-inner">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-rose-300">
                  <AlertCircle className="w-4 h-4 text-rose-400" />
                  <span>Điểm Yếu (Thách Thức)</span>
                </div>
                <p className="text-xs text-slate-200 leading-relaxed">
                  {selectedFaction.weaknesses || 'Những hạn chế về khí tài và thách thức thời đại trong sử liệu.'}
                </p>
              </div>
            </div>

            {/* Strategic Attributes */}
            <div className="flex flex-wrap gap-2.5 pt-1">
              <div className="px-3 py-1.5 rounded-lg bg-black/50 border border-slate-700 text-xs text-slate-200 flex items-center space-x-1.5 shadow-sm">
                <Swords className="w-3.5 h-3.5 text-red-400" />
                <span>Công Phá: +{selectedFaction.attack_bonus ?? 15}%</span>
              </div>
              <div className="px-3 py-1.5 rounded-lg bg-black/50 border border-slate-700 text-xs text-slate-200 flex items-center space-x-1.5 shadow-sm">
                <Shield className="w-3.5 h-3.5 text-blue-400" />
                <span>Phòng Ngự: +{selectedFaction.defense_bonus ?? 15}%</span>
              </div>
              <div className="px-3 py-1.5 rounded-lg bg-black/50 border border-slate-700 text-xs text-slate-200 flex items-center space-x-1.5 shadow-sm">
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                <span>Cơ Động: +{selectedFaction.movement_bonus ?? 10}%</span>
              </div>
              {selectedFaction.special_unit && (
                <div className="px-3 py-1.5 rounded-lg bg-amber-950/40 border border-amber-600/50 text-xs text-amber-200 flex items-center space-x-1.5 shadow-sm">
                  <Award className="w-3.5 h-3.5 text-amber-400" />
                  <span>Binh chủng đặc sắc: {selectedFaction.special_unit}</span>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Imperial Seal & Action Card (4 cols) */}
          <div className="lg:col-span-4 bg-black/60 border border-imperial-border rounded-2xl p-6 flex flex-col items-center justify-between text-center space-y-5 shadow-xl">
            {/* Imperial Seal Avatar */}
            <div className="relative">
              <div className="h-32 w-32 overflow-hidden rounded-full border-2 border-amber-400/80 bg-slate-900 shadow-2xl p-1">
                <img
                  src={detailImage}
                  alt={`Ấn tín ${selectedFaction.name}`}
                  className="h-full w-full object-cover rounded-full"
                  loading="lazy"
                  decoding="async"
                  onError={() => setDetailImage(fallbackFactionImage(selectedFaction.faction_id))}
                />
              </div>
              <div className="absolute -bottom-2 inset-x-0 mx-auto w-max px-3 py-0.5 rounded-full bg-gradient-to-r from-amber-600 to-yellow-500 text-black text-[10px] font-bold uppercase tracking-wider shadow">
                Ấn Tín Hoàng Triều
              </div>
            </div>

            <div>
              <h4 className="text-base font-bold text-white font-display">
                Đồng Hành Cùng {selectedFaction.name}
              </h4>
              <p className="text-xs text-slate-400 mt-1">
                Tiếp quản đội quân tiên phong và đồng hành cùng các danh tướng lịch sử
              </p>
            </div>

            {/* Một thông báo duy nhất: configError (BE) hoặc mintStatus (luồng mint) */}
            {(configError || mintStatus) && (
              <div className="w-full p-2.5 rounded-lg bg-amber-950/60 border border-amber-500/50 text-xs text-amber-200 flex items-center justify-center space-x-2">
                {isMinting && <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-400" />}
                <span>{configError || mintStatus}</span>
                {configError && onRetryConfig && (
                  <button type="button" onClick={() => void onRetryConfig()} className="ml-2 underline hover:text-amber-100">
                    Thử lại
                  </button>
                )}
              </div>
            )}

            {/* Primary Action Button */}
            <div className="w-full space-y-2.5">
              {!player?.wallet || player?.is_guest ? (
                selectionError && <p role="alert" className="text-sm text-red-300">{selectionError}</p>
              ) : null}
              {mintNotice && (
                <p role="status" className="rounded-lg border border-emerald-500/50 bg-emerald-950/50 px-3 py-2 text-xs text-emerald-200">{mintNotice}</p>
              )}
              <button
                onClick={handleSelectF2P}
                disabled={isSelectingF2P || isMinting || !!mintLocked}
                className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-amber-600 via-yellow-500 to-amber-700 hover:brightness-110 text-black font-display font-black text-sm shadow-xl shadow-amber-950/60 flex items-center justify-center space-x-2 transition-all cursor-pointer border border-amber-300"
              >
                {isSelectingF2P ? (
                  <Loader2 className="w-4 h-4 animate-spin text-black" />
                ) : (
                  <Play className="w-4 h-4 fill-current text-black" />
                )}
                <span>
                  {isAlreadyOwned
                    ? 'Tiếp Tục Vào Sảnh Duyệt Binh'
                    : player && !player.is_guest
                    ? 'Xác Nhận Triều Đại & Xuất Binh'
                    : 'Chọn Triều Đại & Xuất Binh'}
                </span>
                <ArrowRight className="w-4 h-4 text-black" />
              </button>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};
