using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using UnityEngine.Networking;
using VnHistoryGameFi.Models;
using VnHistoryGameFi.Network;

namespace VnHistoryGameFi.Services
{
    public class BattleService
    {
        private readonly ApiClient _api;

        public BattleService(ApiClient api)
        {
            _api = api ?? throw new ArgumentNullException(nameof(api));
        }

        public Task<AdvisorData[]> LoadAdvisorsAsync()
        {
            return _api.GetListAsync<AdvisorData>("/advisors");
        }

        public async Task<AdvisorData[]> LoadUsableAdvisorsAsync(
            string wallet,
            string chain,
            string starterAdvisorId)
        {
            AdvisorData[] advisors = await LoadAdvisorsAsync();
            var usable = new List<AdvisorData>();
            foreach (AdvisorData advisor in advisors)
            {
                if (advisor.id == starterAdvisorId)
                {
                    usable.Add(advisor);
                    continue;
                }

                string endpoint = $"/advisors/{UnityWebRequest.EscapeURL(advisor.id)}/ownership";
                AdvisorOwnershipData ownership = await _api.GetAsync<AdvisorOwnershipData>(endpoint);
                if (ownership.is_verified &&
                    ownership.chain == chain &&
                    string.Equals(ownership.owner_wallet, wallet, StringComparison.Ordinal))
                    usable.Add(advisor);
            }
            return usable.ToArray();
        }

        public Task<FactionData[]> LoadFactionsAsync()
        {
            return _api.GetListAsync<FactionData>("/factions");
        }

        public Task<LeaderboardEntryData[]> LoadLeaderboardAsync()
        {
            return _api.GetListAsync<LeaderboardEntryData>("/leaderboard");
        }

        public Task<PlayerData> SelectGuestFactionAsync(string wallet, int factionId)
        {
            if (string.IsNullOrWhiteSpace(wallet))
                throw new ArgumentException("Thiếu địa chỉ người chơi.", nameof(wallet));

            var payload = new SelectFactionRequest { faction_id = factionId };
            string endpoint = $"/players/{UnityWebRequest.EscapeURL(wallet)}/faction/select";
            return _api.PostAsync<PlayerData>(endpoint, payload);
        }

        public async Task<BattleResultResponse> SimulateBattleAsync(
            BattleRequest battle,
            Action<BattleLogEntry> onLogEntry = null)
        {
            if (battle == null) throw new ArgumentNullException(nameof(battle));
            if (string.IsNullOrWhiteSpace(battle.player_wallet))
                throw new ArgumentException("BattleRequest.player_wallet là bắt buộc.", nameof(battle));

            var payload = new BattleSimulationRequest
            {
                player_wallet = battle.player_wallet,
                scenario_id = string.IsNullOrWhiteSpace(battle.scenario_id)
                    ? "bach_dang_1288"
                    : battle.scenario_id,
                tactical_formation = string.IsNullOrWhiteSpace(battle.tactical_formation)
                    ? "standard"
                    : battle.tactical_formation,
                advisor_id = battle.advisor_id,
            };

            BattleResultResponse result = await _api.PostAsync<BattleResultResponse>("/battles", payload);
            result.NormalizeBackendFields();

            if (result.combat_logs != null)
            {
                foreach (BattleLogEntry entry in result.combat_logs)
                    onLogEntry?.Invoke(entry);
            }
            return result;
        }
    }
}
