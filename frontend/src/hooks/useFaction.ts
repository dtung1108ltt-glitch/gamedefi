import { useEffect, useState } from 'react';
import { Faction, Player } from '../types';
import { apiService, DEFAULT_FACTIONS } from '../services/api';
import { checkMintBalance, fetchSolanaConfig, solanaAdapter, solanaConfigErrorMessage } from '../services/solana';
import confetti from 'canvas-confetti';

export function useFaction(player: Player | null, onFactionRegistered: (factionId: number, nftId: string) => void) {
  const [factions, setFactions] = useState<Faction[]>(DEFAULT_FACTIONS);
  const [selectedFactionId, setSelectedFactionId] = useState<number>(1);
  const [isLoadingFactions, setIsLoadingFactions] = useState<boolean>(false);
  const [isMinting, setIsMinting] = useState<boolean>(false);
  const [mintStatus, setMintStatus] = useState<string>('');
  const [mintNotice, setMintNotice] = useState<string | null>(null);
  const [lastMintedNft, setLastMintedNft] = useState<{ txDigest: string; nftId: string } | null>(null);
  const [configError, setConfigError] = useState<string | null>(null);
  const [mintReady, setMintReady] = useState<boolean>(false);

  const refreshConfig = async () => {
    setConfigError(null);
    try {
      const config = await fetchSolanaConfig();
      const message = solanaConfigErrorMessage(config);
      setMintReady(!message);
      setConfigError(message);
      return config;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Không kết nối được backend';
      setMintReady(false);
      setConfigError(message);
      return null;
    }
  };

  useEffect(() => {
    void refreshConfig();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    async function loadFactions() {
      setIsLoadingFactions(true);
      try {
        const list = await apiService.getFactions();
        if (list && list.length > 0) {
          setFactions(list);
          // Nếu player đã có faction_id từ trước thì gán luôn
          if (player?.faction_id) {
            setSelectedFactionId(player.faction_id);
          } else {
            setSelectedFactionId(list[0].faction_id);
          }
        }
      } catch (e) {
        console.warn('Load factions fallback:', e);
      } finally {
        setIsLoadingFactions(false);
      }
    }
    loadFactions();
  }, [player?.faction_id]);

  const selectedFaction = factions.find(f => f.faction_id === selectedFactionId) || factions[0];
  const factionName = (factionId: number): string =>
    factions.find(f => f.faction_id === factionId)?.name || `Faction #${factionId}`;

  const mintFactionNft = async (factionId: number) => {
    if (!player) throw new Error('Vui lòng kết nối ví trước khi đúc ấn tín');
    setMintNotice(null);
    setMintStatus('');
    if (!mintReady && !configError) await refreshConfig();
    if (configError || !mintReady) {
      const message = configError || 'Backend chưa cấu hình SOLANA_PROGRAM_ID (kiểm tra backend/.env)';
      setMintStatus(message);
      throw new Error(message);
    }
    if (!player.is_guest) {
      try {
        await checkMintBalance(player.wallet);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Ví thiếu SOL devnet để trả phí mint.';
        setMintStatus(message);
        throw err instanceof Error ? err : new Error(message);
      }
    }

    // Trường hợp (a)/(b): ví đã có faction on-chain thì không coi là lỗi.
    // Đọc trạng thái hiện có của ví trước, vào thẳng game (a) hoặc báo
    // "đã chọn faction X" (b) — không gọi mint lại.
    if (!player.is_guest) {
      try {
        const proof = await solanaAdapter.existingFactionProof(player.wallet);
        if (proof) {
          if (proof.factionId === factionId) {
            setMintNotice(`Ví này đã có đúng ấn tín của faction đang chọn: ${factionName(proof.factionId)}. Vào thẳng game, không cần đúc lại.`);
            try {
              await apiService.registerPlayerFaction(player.wallet, {
                faction_id: proof.factionId,
                nft_object_id: proof.nft_object_id,
                tx_digest: proof.tx_digest,
              });
              onFactionRegistered(proof.factionId, proof.nft_object_id);
            } catch (registerError) {
              console.warn('Đăng ký lại faction đã sở hữu thất bại:', registerError);
            }
          } else {
            setMintNotice(`Ví này đã chọn faction ${factionName(proof.factionId)}. Muốn đổi faction, hãy dùng ví khác hoặc liên hệ quản trị.`);
          }
          return { ...proof, alreadyOwned: true as const };
        }
      } catch {
        // Không đọc được trạng thái on-chain thì rơi xuống luồng mint để hiển thị lỗi (c).
      }
    }

    setIsMinting(true);
    setMintStatus('1/2: Đang gửi giao dịch đúc ấn tín lên mạng blockchain...');

    try {
      const adapter = solanaAdapter;
      const { tx_digest, nft_object_id } = await adapter.mintFactionNft(factionId, player.wallet);

      setMintStatus('2/2: Backend đang xác thực quyền sở hữu on-chain...');
      await apiService.registerPlayerFaction(player.wallet, {
        faction_id: factionId,
        nft_object_id,
        tx_digest,
      });

      setLastMintedNft({ txDigest: tx_digest, nftId: nft_object_id });
      onFactionRegistered(factionId, nft_object_id);

      // Pháo hoa ăn mừng lễ phong chức Tướng quân
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#D4AF37', '#8B1E0F', '#F3E5AB', '#CD7F32']
        });
      } catch {}

      setMintStatus('Đúc ấn tín thành công!');
      return { tx_digest, nft_object_id };
    } catch (err: unknown) {
      // Trường hợp (c): account on-chain lỗi/không hợp lệ — chỉ khi đó mới
      // hiển thị lỗi, kèm lý do kỹ thuật cụ thể, không nuốt message gốc.
      const message = err instanceof Error ? err.message : 'Không thể đăng ký faction trên Solana.';
      console.error('Lỗi khi đúc NFT:', err);
      setMintStatus(message);
      throw err instanceof Error ? err : new Error(message);
    } finally {
      setIsMinting(false);
    }
  };

  return {
    factions,
    selectedFactionId,
    setSelectedFactionId,
    selectedFaction,
    isLoadingFactions,
    isMinting,
    mintStatus,
    mintNotice,
    clearMintNotice: () => setMintNotice(null),
    lastMintedNft,
    mintFactionNft,
    configError,
    mintReady,
    refreshConfig,
  };
}
