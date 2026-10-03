import React, { useMemo, useState } from 'react';
import {
  ArrowRight,
  Check,
  CheckCircle2,
  Crown,
  Flame,
  Gift,
  Lock,
  Swords,
  Target,
  Trophy,
  Wand2,
} from 'lucide-react';
import type { Player, Quest, QuestPeriod, QuestReward, QuestStatus } from '../../types';

interface QuestCenterProps {
  player: Player;
  onBack: () => void;
  onPlayDrum?: () => void;
  onPlayGong?: () => void;
}

const periodOrder: QuestPeriod[] = ['daily', 'weekly', 'monthly', 'yearly'];

const initialQuests: Quest[] = [
  {
    id: 'daily-1',
    title: 'Trận đầu tiên',
    description: 'Tham gia 1 trận chiến',
    period: 'daily',
    category: 'combat',
    target: 1,
    progress: 1,
    rewards: [
      { type: 'xp', amount: 100 },
      { type: 'gold', amount: 500 },
    ],
    status: 'completed',
    requirements: [{ type: 'battle_count', value: 1 }],
  },
  {
    id: 'daily-2',
    title: 'Chiến binh của Đại Việt',
    description: 'Thắng 2 trận chiến',
    period: 'daily',
    category: 'combat',
    target: 2,
    progress: 1,
    rewards: [
      { type: 'xp', amount: 180 },
      { type: 'gold', amount: 800 },
    ],
    status: 'active',
    requirements: [{ type: 'battle_count', value: 2 }],
  },
  {
    id: 'daily-3',
    title: 'Sứ mệnh triều đại',
    description: 'Hoàn thành 1 mục tiêu chiến dịch',
    period: 'daily',
    category: 'campaign',
    target: 1,
    progress: 0,
    rewards: [
      { type: 'xp', amount: 220 },
      { type: 'food', amount: 150 },
    ],
    status: 'in_progress',
    requirements: [{ type: 'campaign', value: 'chapter_3' }],
  },
  {
    id: 'weekly-1',
    title: 'Chiến Binh Đại Việt',
    description: 'Chiến thắng 10 trận',
    period: 'weekly',
    category: 'combat',
    target: 10,
    progress: 7,
    rewards: [
      { type: 'xp', amount: 1500 },
      { type: 'gold', amount: 5000 },
      { type: 'advisor_fragment', amount: 1 },
    ],
    status: 'active',
    requirements: [{ type: 'battle_count', value: 10 }],
  },
  {
    id: 'weekly-2',
    title: 'Hội đồng quân sư',
    description: 'Dùng 5 tướng cố vấn trong trận chiến',
    period: 'weekly',
    category: 'advisor',
    target: 5,
    progress: 5,
    rewards: [
      { type: 'xp', amount: 1200 },
      { type: 'gold', amount: 4000 },
      { type: 'advisor', itemId: 'tran_hung_dao' },
    ],
    status: 'completed',
    requirements: [{ type: 'advisor', value: 5 }],
  },
  {
    id: 'monthly-1',
    title: 'Dựng cơ đồ Đại Việt',
    description: 'Hoàn thành 30 trận chiến và giành ít nhất 20 chiến thắng',
    period: 'monthly',
    category: 'faction',
    target: 30,
    progress: 17,
    rewards: [
      { type: 'xp', amount: 10000 },
      { type: 'gold', amount: 25000 },
      { type: 'advisor', itemId: 'rare-advisor' },
      { type: 'badge', itemId: 'historical-badge' },
    ],
    status: 'active',
    requirements: [
      { type: 'battle_count', value: 30 },
      { type: 'faction', value: 'Bạch Đằng' },
    ],
  },
  {
    id: 'monthly-2',
    title: 'Lịch sử không quên',
    description: 'Khám phá 8 chiến dịch lịch sử và hoàn thành mục tiêu phụ',
    period: 'monthly',
    category: 'historical',
    target: 8,
    progress: 8,
    rewards: [
      { type: 'xp', amount: 7000 },
      { type: 'badge', itemId: 'history-badge' },
      { type: 'special', itemId: 'historical-title' },
    ],
    status: 'claimed',
    requirements: [{ type: 'campaign', value: 8 }],
  },
  {
    id: 'yearly-1',
    title: 'Huyền thoại Đại Việt',
    description: 'Trong một năm: thắng 500 trận, hoàn thành 100 chiến dịch, thu thập 20 tướng cố vấn',
    period: 'yearly',
    category: 'achievement',
    target: 100,
    progress: 52,
    rewards: [
      { type: 'title', itemId: 'legendary-title' },
      { type: 'badge', itemId: 'historical-badge' },
      { type: 'special', itemId: 'special-achievement' },
      { type: 'gold', amount: 500000 },
    ],
    status: 'active',
    requirements: [
      { type: 'battle_count', value: 500 },
      { type: 'achievement', value: 100 },
      { type: 'advisor', value: 20 },
    ],
  },
];

const rewardMeta: Record<QuestReward['type'], { label: string; accent: string }> = {
  xp: { label: 'XP', accent: 'bg-violet-900/40 border-violet-700/40 text-violet-300' },
  gold: { label: 'Gold', accent: 'bg-amber-900/30 border-amber-700/40 text-amber-300' },
  food: { label: 'Food', accent: 'bg-emerald-900/30 border-emerald-700/40 text-emerald-300' },
  army: { label: 'Army', accent: 'bg-red-900/30 border-red-700/40 text-red-300' },
  advisor_fragment: { label: 'Fragment', accent: 'bg-cyan-900/30 border-cyan-700/40 text-cyan-300' },
  advisor: { label: 'Advisor', accent: 'bg-fuchsia-900/30 border-fuchsia-700/40 text-fuchsia-300' },
  badge: { label: 'Badge', accent: 'bg-sky-900/30 border-sky-700/40 text-sky-300' },
  title: { label: 'Title', accent: 'bg-yellow-900/30 border-yellow-700/40 text-yellow-300' },
  special: { label: 'Special', accent: 'bg-pink-900/30 border-pink-700/40 text-pink-300' },
};

const periodMeta: Record<QuestPeriod, { label: string; subtitle: string; icon: string }> = {
  daily: { label: 'HÀNG NGÀY', subtitle: 'Tái lập mục tiêu ngắn hạn', icon: '☀' },
  weekly: { label: 'HÀNG TUẦN', subtitle: 'Mục tiêu chiến lược', icon: '🗓' },
  monthly: { label: 'HÀNG THÁNG', subtitle: 'Mục tiêu theo mùa', icon: '🏯' },
  yearly: { label: 'HÀNG NĂM', subtitle: 'Thành tựu lớn của cả hành trình', icon: '🏆' },
};

const statusStyles: Record<QuestStatus, string> = {
  locked: 'border-slate-600/80 bg-slate-900/70 text-slate-300',
  active: 'border-amber-600/70 bg-amber-900/20 text-amber-300',
  in_progress: 'border-cyan-600/70 bg-cyan-950/30 text-cyan-300',
  completed: 'border-emerald-500/70 bg-emerald-900/30 text-emerald-300',
  claimed: 'border-slate-600 bg-slate-800/70 text-slate-400',
  expired: 'border-red-600/70 bg-red-950/30 text-red-300',
};

const formatRewardText = (reward: QuestReward) => {
  const meta = rewardMeta[reward.type];
  const amount = reward.amount ?? 1;
  return `${meta.label} +${amount}`;
};

export const QuestCenter: React.FC<QuestCenterProps> = ({ player, onBack, onPlayDrum, onPlayGong }) => {
  const [selectedPeriod, setSelectedPeriod] = useState<QuestPeriod>('daily');
  const [quests, setQuests] = useState<Quest[]>(initialQuests);
  const [claimedQuestIds, setClaimedQuestIds] = useState<Set<string>>(new Set());
  const [celebratingId, setCelebratingId] = useState<string | null>(null);

  const filteredQuests = useMemo(
    () => quests.filter((quest) => quest.period === selectedPeriod),
    [quests, selectedPeriod],
  );

  const totalProgress = useMemo(() => {
    if (filteredQuests.length === 0) return 0;
    const completed = filteredQuests.filter((quest) => quest.status === 'claimed' || quest.status === 'completed').length;
    return Math.round((completed / filteredQuests.length) * 100);
  }, [filteredQuests]);

  const handleQuestAction = (questId: string) => {
    setQuests((current) =>
      current.map((quest) => {
        if (quest.id !== questId) return quest;
        if (quest.status === 'completed') {
          return { ...quest, status: 'claimed' };
        }
        return { ...quest, status: 'active' };
      }),
    );
    setClaimedQuestIds((current) => new Set(current).add(questId));
    setCelebratingId(questId);
    window.setTimeout(() => setCelebratingId(null), 900);
  };

  const selectedPeriodMeta = periodMeta[selectedPeriod];

  return (
    <div className="app-screen max-w-6xl mx-auto px-4 py-8">
      <div className="mb-5">
        <button
          type="button"
          onClick={() => {
            if (onPlayDrum) onPlayDrum();
            onBack();
          }}
          className="group flex items-center gap-2 text-amber-500/70 hover:text-amber-400 transition-colors mb-4 text-sm font-medium"
        >
          <ArrowRight className="w-4 h-4 group-hover:-translate-x-1 transition-transform rotate-180" />
          Trở về tổng hành dinh
        </button>

        <div className="rounded-lg border border-amber-700/40 bg-gradient-to-r from-[#071521] via-[#0a1e2d] to-[#071521] p-6 md:p-8 shadow-[0_0_24px_rgba(245,208,139,0.08)]">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-amber-400/80">Quest center</p>
              <h1 className="mt-2 text-3xl font-black text-amber-300 md:text-4xl">NHIỆM VỤ</h1>
              <p className="mt-2 text-sm text-slate-300">Hành trình dựng xây Đại Việt · mục tiêu ngắn hạn và dài hạn</p>
            </div>
            <div className="rounded border border-amber-600/50 bg-black/20 px-4 py-2 text-right">
              <div className="text-[10px] uppercase tracking-[0.2em] text-slate-400">Thành viên</div>
              <div className="text-lg font-bold text-amber-300">{player.username}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="mb-6 flex flex-wrap gap-3 rounded-lg border border-slate-700 bg-[#0a1d2a] p-3">
        {periodOrder.map((period) => (
          <button
            key={period}
            type="button"
            onClick={() => setSelectedPeriod(period)}
            className={`rounded border px-4 py-2 text-sm font-bold uppercase tracking-[0.12em] transition ${
              selectedPeriod === period
                ? 'border-amber-500 bg-amber-500/15 text-amber-200 shadow-[0_0_18px_rgba(245,208,139,0.2)]'
                : 'border-slate-600 bg-slate-900/50 text-slate-300 hover:border-amber-500/60 hover:text-amber-200'
            }`}
          >
            {periodMeta[period].label}
          </button>
        ))}
      </div>

      <div className="mb-6 rounded-lg border border-slate-700 bg-[#081b2a] p-5">
        <div className="mb-4 flex items-center justify-between gap-4">
          <div>
            <p className="text-[10px] uppercase tracking-[0.25em] text-slate-400">Quest progress</p>
            <h2 className="mt-1 text-2xl font-bold text-amber-100">{selectedPeriodMeta.label}</h2>
          </div>
          <div className="text-right">
            <div className="text-[10px] uppercase tracking-[0.2em] text-slate-500">Mô tả</div>
            <div className="text-sm text-slate-300">{selectedPeriodMeta.subtitle}</div>
          </div>
        </div>

        <div className="mb-3 flex items-center gap-3">
          <div className="h-3 flex-1 overflow-hidden rounded-full bg-slate-800">
            <div
              className="h-full rounded-full bg-gradient-to-r from-amber-500 via-yellow-400 to-emerald-400 transition-all duration-500"
              style={{ width: `${totalProgress}%` }}
            />
          </div>
          <span className="min-w-[52px] text-right text-sm font-bold text-amber-200">{totalProgress}%</span>
        </div>

        <div className="flex items-center justify-between text-sm text-slate-300">
          <span>
            {filteredQuests.filter((quest) => quest.status === 'claimed' || quest.status === 'completed').length} / {filteredQuests.length} nhiệm vụ hoàn thành
          </span>
          <span className="flex items-center gap-2 text-amber-300">
            <Trophy className="w-4 h-4" /> {selectedPeriodMeta.icon} {selectedPeriodMeta.label}
          </span>
        </div>
      </div>

      <div className="grid gap-4">
        {filteredQuests.map((quest) => {
          const progressPercent = Math.min(100, Math.round(((quest.progress ?? 0) / Math.max(1, quest.target ?? 1)) * 100));
          const isClaiming = celebratingId === quest.id;
          const actionLabel =
            quest.status === 'completed'
              ? 'Nhận thưởng'
              : quest.status === 'claimed'
                ? 'Đã nhận'
                : quest.status === 'locked'
                  ? 'Chưa mở khóa'
                  : quest.status === 'expired'
                    ? 'Đã hết hạn'
                    : 'Tiếp tục';

          return (
            <article
              key={quest.id}
              className={`rounded-lg border p-4 shadow transition ${
                quest.status === 'claimed'
                  ? 'border-slate-700 bg-slate-900/60 opacity-75'
                  : quest.status === 'completed'
                    ? 'border-emerald-500/50 bg-emerald-950/20'
                    : 'border-slate-700 bg-[#0c2333]'
              } ${isClaiming ? 'ring-2 ring-amber-500/60' : ''}`}
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-slate-600 bg-slate-900/80 text-xl">
                  {quest.category === 'combat' && <Swords className="h-6 w-6 text-orange-300" />}
                  {quest.category === 'campaign' && <Target className="h-6 w-6 text-cyan-300" />}
                  {quest.category === 'advisor' && <Wand2 className="h-6 w-6 text-violet-300" />}
                  {quest.category === 'faction' && <Crown className="h-6 w-6 text-amber-300" />}
                  {quest.category === 'achievement' && <Trophy className="h-6 w-6 text-yellow-300" />}
                  {quest.category === 'historical' && <Flame className="h-6 w-6 text-red-300" />}
                  {quest.category === 'economy' && <Gift className="h-6 w-6 text-emerald-300" />}
                  {quest.category === 'progression' && <CheckCircle2 className="h-6 w-6 text-green-300" />}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <h3 className="text-xl font-bold text-amber-100">{quest.title}</h3>
                    <span className={`rounded-full border px-2 py-1 text-[10px] font-bold uppercase tracking-[0.18em] ${statusStyles[quest.status ?? 'active']}`}>
                      {quest.status === 'in_progress' ? 'IN PROGRESS' : quest.status ?? 'ACTIVE'}
                    </span>
                  </div>

                  <p className="mb-3 text-sm text-slate-300">{quest.description}</p>

                  <div className="mb-3 flex items-center gap-3">
                    <div className="h-2.5 max-w-[240px] flex-1 overflow-hidden rounded-full bg-slate-800">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-amber-500 to-emerald-400 transition-all duration-500"
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                    <span className="text-xs font-bold text-slate-300">
                      {quest.progress ?? 0} / {quest.target ?? 0}
                    </span>
                  </div>

                  {quest.requirements && quest.requirements.length > 0 && (
                    <div className="mb-3 flex flex-wrap gap-2">
                      {quest.requirements.map((req, index) => (
                        <span
                          key={`${quest.id}-${index}`}
                          className="rounded border border-slate-600 bg-slate-950/40 px-2 py-1 text-[10px] uppercase tracking-[0.12em] text-slate-300"
                        >
                          {`${req.type} ${req.value}`}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="flex flex-wrap gap-2">
                    {(quest.rewards ?? []).map((reward, index) => (
                      <span
                        key={`${quest.id}-reward-${index}`}
                        className={`rounded border px-2 py-1 text-[10px] font-bold uppercase tracking-[0.12em] ${
                          rewardMeta[reward.type]?.accent ?? 'bg-slate-800 border-slate-700 text-slate-200'
                        }`}
                      >
                        {formatRewardText(reward)}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex shrink-0 flex-col items-stretch gap-2 lg:min-w-[170px] lg:items-end">
                  <button
                    type="button"
                    disabled={quest.status === 'claimed' || quest.status === 'locked' || quest.status === 'expired'}
                    onClick={() => handleQuestAction(quest.id)}
                    className={`inline-flex items-center justify-center gap-2 rounded border px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] transition ${
                      quest.status === 'claimed'
                        ? 'border-slate-600 bg-slate-800 text-slate-400 cursor-default'
                        : quest.status === 'completed'
                          ? 'border-amber-500 bg-amber-500/20 text-amber-100 hover:bg-amber-500/30'
                          : quest.status === 'locked'
                            ? 'border-slate-700 bg-slate-900 text-slate-500 cursor-not-allowed'
                            : quest.status === 'expired'
                              ? 'border-red-700 bg-red-950/20 text-red-300 cursor-not-allowed'
                              : 'border-emerald-500 bg-emerald-600/15 text-emerald-200 hover:bg-emerald-600/25'
                    }`}
                  >
                    {quest.status === 'claimed' ? (
                      <Check className="h-3.5 w-3.5" />
                    ) : quest.status === 'locked' ? (
                      <Lock className="h-3.5 w-3.5" />
                    ) : (
                      <ArrowRight className="h-3.5 w-3.5" />
                    )}
                    {actionLabel}
                  </button>

                  {claimedQuestIds.has(quest.id) && (
                    <span className="text-[10px] uppercase tracking-[0.2em] text-emerald-400">Claimed</span>
                  )}
                </div>
              </div>
            </article>
          );
        })}
      </div>

      {celebratingId && (
        <div className="fixed inset-x-0 bottom-6 z-50 flex justify-center px-4">
          <div className="rounded-full border border-amber-500/60 bg-[#0d2433] px-5 py-3 text-sm font-bold text-amber-200 shadow-[0_0_25px_rgba(245,208,139,0.25)]">
            ✨ NHIỆM VỤ HOÀN THÀNH ✨
          </div>
        </div>
      )}
    </div>
  );
};

export default QuestCenter;
