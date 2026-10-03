using System;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using UnityEngine;
using UnityEngine.Networking;
using VnHistoryGameFi.Models;
using VnHistoryGameFi.Network;

namespace VnHistoryGameFi.Services
{
    public class SolanaRewardManager
    {
        private static readonly Regex SolanaAddressPattern =
            new Regex("^[1-9A-HJ-NP-Za-km-z]{32,44}$", RegexOptions.Compiled);

        private readonly ApiClient _api;

        public SolanaRewardManager(ApiClient api)
        {
            _api = api ?? throw new ArgumentNullException(nameof(api));
        }

        public async Task<ClaimRewardResponse> ClaimBattleRewardAsync(string wallet, string battleId)
        {
            if (!IsValidSolanaAddress(wallet))
                throw new ArgumentException("Địa chỉ ví Solana không đúng định dạng Base58.", nameof(wallet));
            if (string.IsNullOrWhiteSpace(battleId))
                throw new ArgumentException("Thiếu battle_id do backend trả về.", nameof(battleId));

            var backendRequest = new RewardClaimRequest
            {
                wallet = wallet,
                battle_id = battleId,
            };

            ClaimRewardResponse response =
                await _api.PostAsync<ClaimRewardResponse>("/rewards/claim", backendRequest);
            response.NormalizeBackendFields();
            return response;
        }

        public static bool IsValidSolanaAddress(string wallet)
        {
            return !string.IsNullOrWhiteSpace(wallet) && SolanaAddressPattern.IsMatch(wallet.Trim());
        }

        public static void OpenSolanaExplorer(string transactionHash, string network = "devnet")
        {
            if (string.IsNullOrWhiteSpace(transactionHash))
                throw new ArgumentException("Thiếu transaction signature.", nameof(transactionHash));
            if (!Regex.IsMatch(transactionHash, "^[1-9A-HJ-NP-Za-km-z]{32,100}$"))
                throw new ArgumentException("Transaction signature không đúng định dạng Base58.", nameof(transactionHash));

            string cluster = string.IsNullOrWhiteSpace(network) ? "devnet" : network.Trim();
            string url = "https://explorer.solana.com/tx/" +
                         UnityWebRequest.EscapeURL(transactionHash) +
                         "?cluster=" + UnityWebRequest.EscapeURL(cluster);
            Application.OpenURL(url);
        }
    }
}
