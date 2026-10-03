import React, { useEffect, useState } from 'react';
import { Coins, ExternalLink, Gift, LoaderCircle, RefreshCw } from 'lucide-react';
import { Connection, PublicKey } from '@solana/web3.js';
import type { Player, Quest, RewardClaim } from '../../types';
import { apiService } from '../../services/api';
import { formatBaseUnits } from '../../services/dexMath';
import { SOLANA_NETWORK, SOLANA_RPC_URL } from '../../services/solana';

interface Props { player: Player }

export const SolRewardCard: React.FC<Props> = ({ player }) => {
  const [balance, setBalance] = useState<string | null>(null);
  const [rewards, setRewards] = useState<RewardClaim[]>([]);
  const [quests, setQuests] = useState<Quest[]>([]);
  const [loading, setLoading] = useState(false);
  const [claiming, setClaiming] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [rewardWallet, setRewardWallet] = useState<{ address: string; configured: boolean; active: boolean } | null>(null);

  const refresh = async () => {
    if (player.is_guest) { setBalance(null); setRewards([]); setQuests([]); return; }
    setLoading(true);
    setError(null);
    try {
      const connection = new Connection(SOLANA_RPC_URL, 'confirmed');
      const [lamports, history, playerQuests, walletStatus] = await Promise.all([
        connection.getBalance(new PublicKey(player.wallet), 'confirmed'),
        apiService.getRewards(player.wallet, 8),
        apiService.getPlayerQuests(player.wallet),
        apiService.getSolRewardWallet().catch(() => null),
      ]);
      setBalance(formatBaseUnits(BigInt(lamports), 9, 6));
      setRewards(history.filter((item) => item.asset_symbol === 'SOL'));
      setQuests(playerQuests);
      setRewardWallet(walletStatus);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Không đọc được phần thưởng SOL.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void refresh(); }, [player.wallet, player.is_guest]);

  const claimQuest = async (quest: Quest) => {
    setClaiming(quest.id);
    setError(null);
    try { await apiService.claimQuestReward(player.wallet, quest.id); await refresh(); }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'Không gửi được thưởng SOL.'); }
    finally { setClaiming(null); }
  };

  return (
    <div className="mt-5 rounded-xl border border-amber-600/40 bg-amber-950/20 p-3 text-xs">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="rounded-full border border-amber-500/50 bg-red-950 p-2 text-amber-300"><Coins className="h-4 w-4" /></div>
          <div>
            <div className="font-bold text-imperial-lightgold">SOL · Phần thưởng chiến dịch</div>
            <div className="mt-0.5 text-[10px] uppercase tracking-wider text-slate-500">Solana {SOLANA_NETWORK} · tài sản thử</div>
          </div>
        </div>
        <button type="button" onClick={() => void refresh()} disabled={loading || player.is_guest} className="text-slate-400 hover:text-white disabled:opacity-40" aria-label="Tải lại số dư SOL">
          {loading ? <LoaderCircle className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
        </button>
      </div>
      <div className="mt-3">
        <div className="text-[10px] text-slate-500">Số dư trong ví</div>
        <div className="font-mono text-lg font-bold text-white">{balance ?? 'Cần kết nối ví'} SOL</div>
      </div>
      {rewardWallet && !rewardWallet.active && (
        <p className="mt-2 text-[10px] text-amber-300" role="status">
          Ví phân phối SOL Devnet chưa sẵn sàng. Các trận đấu vẫn ghi nhận kết quả; thưởng sẽ nhận được khi ví phân phối được cấu hình và nạp SOL.
        </p>
      )}
      {!player.is_guest && quests.some((quest) => quest.completed) && (
        <div className="mt-3 border-t border-amber-700/30 pt-3">
          <div className="mb-2 flex items-center gap-1.5 font-semibold text-amber-200"><Gift className="h-3.5 w-3.5" /> Nhiệm vụ đủ điều kiện</div>
          <div className="space-y-2">
            {quests.filter((quest) => quest.completed).map((quest) => {
              const legacyClaimed = quest.reward_claim_status === 'legacy_claimed';
              const claimed = quest.reward_claim_status === 'confirmed' || legacyClaimed;
              const processing = Boolean(quest.reward_claim_status && !['failed', 'confirmed'].includes(quest.reward_claim_status));
              return (
                <div key={quest.id} className="flex items-center justify-between gap-2 rounded-lg border border-slate-800 bg-black/20 p-2">
                  <div>
                    <div className="font-semibold text-slate-200">{quest.title}</div>
                    <div className="text-[10px] text-slate-500">{legacyClaimed ? 'Đã nhận thưởng trước đây' : `${formatBaseUnits(BigInt(quest.reward_sol_lamports ?? 0), 9, 6)} SOL`}</div>
                  </div>
                  <button type="button" disabled={claimed || processing || claiming === quest.id || rewardWallet?.active === false} onClick={() => void claimQuest(quest)}
                    className="rounded-lg border border-amber-500/50 px-2 py-1 text-[10px] font-semibold text-amber-200 disabled:border-emerald-800 disabled:text-emerald-400">
                    {claiming === quest.id ? 'Đang gửi…' : legacyClaimed ? 'Đã nhận trước đây' : claimed ? 'Đã nhận' : processing ? 'Đang xác nhận' : 'Nhận SOL'}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
      {!player.is_guest && (
        <div className="mt-3 border-t border-amber-700/30 pt-3">
          <div className="mb-2 font-semibold text-slate-300">Lịch sử thưởng SOL</div>
          {rewards.length === 0 ? <p className="text-[10px] text-slate-500">Chưa có phần thưởng SOL.</p> : (
            <div className="space-y-1.5">
              {rewards.map((reward) => (
                <div key={reward.claim_id} className="flex items-center justify-between gap-2 rounded-lg bg-black/20 px-2 py-1.5">
                  <span className="text-slate-300">{reward.source_type === 'battle' ? 'Chiến thắng' : 'Nhiệm vụ'} · {formatBaseUnits(BigInt(reward.amount), 9, 6)} SOL</span>
                  <span className="flex items-center gap-1 text-amber-300">
                    {reward.status === 'confirmed' ? 'Đã nhận' : reward.status === 'failed' ? 'Thất bại' : 'Đang xử lý'}
                    {reward.explorer_url && <a href={reward.explorer_url} target="_blank" rel="noreferrer" aria-label="Mở giao dịch trên Solana Explorer"><ExternalLink className="h-3 w-3" /></a>}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      {error && <p className="mt-2 text-[10px] text-red-300" role="alert">{error}</p>}
    </div>
  );
};
