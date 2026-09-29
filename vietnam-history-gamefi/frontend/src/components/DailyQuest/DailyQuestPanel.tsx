import React, { useEffect, useState, useCallback } from 'react';
import { Player, DailyQuestSummary } from '../../types';
import { apiService } from '../../services/api';
import { ArrowLeft, Check, CheckCircle2, Flame, Gift, PackageOpen, Target, Wheat } from 'lucide-react';

interface DailyQuestPanelProps {
  player: Player;
  onBack: () => void;
  onPlayDrum?: () => void;
  onPlayGong?: () => void;
}

export const DailyQuestPanel: React.FC<DailyQuestPanelProps> = ({
  player,
  onBack,
  onPlayDrum,
  onPlayGong,
}) => {
  const [summary, setSummary] = useState<DailyQuestSummary | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [claimingIds, setClaimingIds] = useState<Set<string>>(new Set());
  const [claimingAll, setClaimingAll] = useState<boolean>(false);
  const [recentlyClaimed, setRecentlyClaimed] = useState<Set<string>>(new Set());

  const fetchQuests = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiService.getDailyQuests(player.wallet);
      setSummary(data);
    } catch (err: any) {
      setError(err.message || 'Không thể tải nhiệm vụ hàng ngày');
    } finally {
      setLoading(false);
    }
  }, [player.wallet]);

  useEffect(() => {
    void fetchQuests();
  }, [fetchQuests]);

  const handleClaim = async (questId: string) => {
    if (claimingIds.has(questId)) return;
    try {
      if (onPlayDrum) onPlayDrum();
      setClaimingIds(prev => new Set(prev).add(questId));
      const data = await apiService.claimDailyQuest(player.wallet, questId);
      
      // Animation trigger
      setRecentlyClaimed(prev => new Set(prev).add(questId));
      setTimeout(() => {
        setRecentlyClaimed(prev => {
          const next = new Set(prev);
          next.delete(questId);
          return next;
        });
      }, 500);

      setSummary(data);
    } catch (err: any) {
      alert(err.message || 'Có lỗi xảy ra khi nhận thưởng');
    } finally {
      setClaimingIds(prev => {
        const next = new Set(prev);
        next.delete(questId);
        return next;
      });
    }
  };

  const handleClaimAll = async () => {
    if (claimingAll) return;
    try {
      if (onPlayGong) onPlayGong();
      setClaimingAll(true);
      const data = await apiService.claimAllDailyQuests(player.wallet);
      
      // Animation trigger for all newly claimed
      const newClaimedIds = data.quests
        .filter(q => q.reward_claimed && !summary?.quests.find(sq => sq.id === q.id)?.reward_claimed)
        .map(q => q.id);
      
      setRecentlyClaimed(new Set(newClaimedIds));
      setTimeout(() => {
        setRecentlyClaimed(new Set());
      }, 500);

      setSummary(data);
    } catch (err: any) {
      alert(err.message || 'Có lỗi xảy ra khi nhận thưởng tất cả');
    } finally {
      setClaimingAll(false);
    }
  };

  const formatVietnameseDate = (dateString: string) => {
    const [year, month, day] = dateString.split('-');
    return `Ngày ${day} tháng ${month} năm ${year}`;
  };

  if (loading && !summary) {
    return (
      <div className="app-screen flex items-center justify-center min-h-[70vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-amber-600/30 border-t-amber-500 rounded-full animate-spin" />
          <p className="text-amber-500/80 text-sm font-bold uppercase tracking-widest">Đang tải quân lệnh...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="app-screen flex flex-col items-center justify-center min-h-[70vh] gap-4">
        <div className="p-4 border border-red-500/50 bg-red-950/30 rounded-lg text-center">
          <p className="text-red-400 mb-4">{error}</p>
          <button 
            onClick={fetchQuests}
            className="px-4 py-2 bg-red-900/50 hover:bg-red-800/50 border border-red-500/30 rounded text-red-200 transition-colors"
          >
            Thử lại
          </button>
        </div>
        <button onClick={() => { if(onPlayDrum) onPlayDrum(); onBack(); }} className="text-amber-500/70 hover:text-amber-400">
          Quay lại sảnh
        </button>
      </div>
    );
  }

  const claimableCount = summary?.quests.filter(q => q.completed && !q.reward_claimed).length || 0;

  return (
    <div className="app-screen max-w-4xl mx-auto px-4 py-8">
      {/* Header section */}
      <div className="mb-6">
        <button 
          onClick={() => { if(onPlayDrum) onPlayDrum(); onBack(); }} 
          className="group flex items-center gap-2 text-amber-500/70 hover:text-amber-400 transition-colors mb-4 text-sm font-medium"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Trở về tổng hành dinh
        </button>
        
        <div className="daily-quest-banner p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-amber-400 mb-2 font-serif">
              Quân Lệnh Hằng Ngày
            </h1>
            <p className="text-amber-200/80 text-sm md:text-base">
              {summary ? formatVietnameseDate(summary.date) : 'Hôm nay'}
            </p>
          </div>
          
          <div className="daily-quest-streak shrink-0">
            <Flame className={`w-6 h-6 ${summary?.streak && summary.streak > 0 ? 'text-orange-500' : 'text-slate-500'}`} />
            <div>
              <div className="text-xs text-amber-500/80 font-bold uppercase tracking-wider">Chuỗi đăng nhập</div>
              <div className="text-xl font-bold text-amber-400">{summary?.streak || 0} ngày</div>
            </div>
          </div>
        </div>
      </div>

      {/* Progress overview */}
      {summary && (
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6 p-4 rounded-lg bg-imperial-obsidian border border-imperial-border">
          <div className="flex items-center gap-4 w-full md:w-auto">
            <Target className="w-8 h-8 text-emerald-500" />
            <div>
              <div className="text-xs text-slate-400 uppercase tracking-widest font-bold mb-1">Tiến độ hôm nay</div>
              <div className="flex items-center gap-3">
                <span className="text-xl font-bold text-white">
                  {summary.total_completed} / {summary.total_quests}
                </span>
                <div className="w-32 h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-emerald-500 transition-all duration-500"
                    style={{ width: `${(summary.total_completed / Math.max(1, summary.total_quests)) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
          
          {claimableCount > 1 && (
            <button
              onClick={handleClaimAll}
              disabled={claimingAll}
              className="w-full md:w-auto daily-quest-claim-btn py-2 px-6 shadow-lg shadow-amber-900/20"
            >
              {claimingAll ? (
                <div className="w-4 h-4 border-2 border-amber-200/30 border-t-amber-100 rounded-full animate-spin" />
              ) : (
                <Gift className="w-4 h-4" />
              )}
              Nhận Tất Cả ({claimableCount})
            </button>
          )}
        </div>
      )}

      {/* Quests List */}
      <div className="grid gap-3">
        {summary?.quests.map(quest => {
          const progressPercent = Math.min(100, Math.round((quest.current_progress / quest.required) * 100));
          const isClaiming = claimingIds.has(quest.id);
          const isRecentlyClaimed = recentlyClaimed.has(quest.id);
          
          return (
            <div 
              key={quest.id} 
              className={`daily-quest-card p-4 flex flex-col sm:flex-row gap-4 items-start sm:items-center ${quest.completed ? 'completed' : ''} ${quest.reward_claimed ? 'claimed' : ''} ${isRecentlyClaimed ? 'quest-claimed-anim' : ''}`}
            >
              {/* Icon */}
              <div className="shrink-0 w-12 h-12 rounded-full bg-slate-800/50 border border-slate-600 flex items-center justify-center">
                {quest.reward_claimed ? (
                  <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                ) : (
                  <PackageOpen className={`w-6 h-6 ${quest.completed ? 'text-amber-400' : 'text-slate-400'}`} />
                )}
              </div>
              
              {/* Info */}
              <div className="flex-1 min-w-0">
                <h3 className={`font-bold text-lg mb-1 truncate ${quest.reward_claimed ? 'text-slate-300' : 'text-amber-100'}`}>
                  {quest.title}
                </h3>
                <p className={`text-sm mb-3 ${quest.reward_claimed ? 'text-slate-500' : 'text-slate-400'}`}>
                  {quest.description}
                </p>
                
                {/* Progress bar */}
                <div className="flex items-center gap-3">
                  <div className="flex-1 daily-quest-progress max-w-[200px]">
                    <div 
                      className={`daily-quest-progress-fill ${quest.completed ? 'complete' : ''}`}
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                  <span className="text-xs font-bold text-slate-300">
                    {quest.current_progress} / {quest.required}
                  </span>
                </div>
              </div>
              
              {/* Rewards & Action */}
              <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto gap-3 shrink-0">
                <div className="flex gap-2">
                  {quest.reward_gold > 0 && (
                    <div className="flex items-center gap-1 bg-amber-900/30 border border-amber-700/30 px-2 py-1 rounded text-xs font-bold text-amber-400">
                      <span className="w-3 h-3 rounded-full bg-yellow-500" />
                      +{quest.reward_gold}
                    </div>
                  )}
                  {quest.reward_rice > 0 && (
                    <div className="flex items-center gap-1 bg-emerald-900/30 border border-emerald-700/30 px-2 py-1 rounded text-xs font-bold text-emerald-400">
                      <Wheat className="w-3 h-3" />
                      +{quest.reward_rice}
                    </div>
                  )}
                </div>
                
                {quest.completed && !quest.reward_claimed ? (
                  <button
                    onClick={() => handleClaim(quest.id)}
                    disabled={isClaiming || claimingAll}
                    className="daily-quest-claim-btn"
                  >
                    {isClaiming ? (
                      <div className="w-3 h-3 border-2 border-amber-200/30 border-t-amber-100 rounded-full animate-spin" />
                    ) : (
                      <Check className="w-3 h-3" />
                    )}
                    Nhận Thưởng
                  </button>
                ) : quest.reward_claimed ? (
                  <div className="text-xs font-bold text-emerald-500 uppercase tracking-widest flex items-center gap-1">
                    <Check className="w-3 h-3" /> Đã nhận
                  </div>
                ) : (
                  <div className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                    Chưa đạt
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {summary?.all_completed && (
        <div className="mt-8 p-6 text-center border border-emerald-500/30 bg-emerald-950/20 rounded-lg">
          <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
          <h3 className="text-emerald-400 font-bold text-xl mb-1 font-serif">Toàn Thắng Cáo Tiệp</h3>
          <p className="text-emerald-200/70 text-sm">Tướng quân đã hoàn thành xuất sắc toàn bộ quân lệnh hôm nay.</p>
        </div>
      )}
    </div>
  );
};
