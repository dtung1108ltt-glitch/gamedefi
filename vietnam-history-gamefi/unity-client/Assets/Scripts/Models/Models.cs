using System;

namespace VnHistoryGameFi.Models
{
    // These two payloads are reserved for a future password-auth API. The
    // current FastAPI backend does not expose /auth/login or /auth/register.
    [Serializable]
    public class LoginRequest
    {
        public string username;
        public string password;
    }

    [Serializable]
    public class RegisterRequest
    {
        public string username;
        public string password;
    }

    [Serializable]
    public class AuthResponse
    {
        public string access_token;
        public string token_type;
        public string user_id;
        public string wallet;
        public string chain;
        public string username;
        public int faction_id;
        public bool is_guest;
    }

    [Serializable]
    public class GuestLoginRequest
    {
        public string username;
    }

    [Serializable]
    public class WalletNonceRequest
    {
        public string chain = "solana";
        public string wallet;
    }

    [Serializable]
    public class WalletNonceResponse
    {
        public string nonce;
        public string message;
    }

    [Serializable]
    public class WalletVerifyRequest
    {
        public string chain = "solana";
        public string wallet;
        public string nonce;
        public string message;
        public string signature;
    }

    [Serializable]
    public class PlayerData
    {
        public string wallet;
        public string chain;
        public string username;
        public int faction_id;
        public string nft_object_id;
        public int level;
        public int rice;
        public int gold;
        public int morale;
        public bool is_guest;
        public string access_token;
    }

    [Serializable]
    public class AdvisorData
    {
        public string id;
        public string name;
        public int faction_id;
        public string faction_name;
        public string rarity;
        public string title;
        public string historical_lore;
        public string image;
        public string passive_name;
        public string passive_effect;
        public string active_skill;
        public string skill_description;
        public int base_tactics;
        public int base_leadership;
        public int base_valor;
        public string buff_type;
        public float buff_value;
        public string description;
    }

    [Serializable]
    public class AdvisorOwnershipData
    {
        public string advisor_id;
        public string advisor_name;
        public string owner_wallet;
        public string chain;
        public string token_id;
        public bool is_verified;
        public string verified_at;
    }

    [Serializable]
    public class FactionData
    {
        public int faction_id;
        public string name;
        public string rarity;
        public string image;
        public string description;
        public string historical_era;
        public string starting_advisor_id;
        public int attack_bonus;
        public int defense_bonus;
        public int movement_bonus;
    }

    [Serializable]
    public class SelectFactionRequest
    {
        public int faction_id;
    }

    [Serializable]
    public class BattleRequest
    {
        // Fields consumed by the current server-authoritative FastAPI endpoint.
        public string player_wallet;
        public string scenario_id = "bach_dang_1288";
        public string tactical_formation = "standard";
        public string advisor_id;

        // Compatibility names from the initial Unity integration brief. They
        // are not consumed by the current backend and should be left empty.
        public string army_id;
        public string stage_id;
    }

    [Serializable]
    public class BattleSimulationRequest
    {
        public string player_wallet;
        public string scenario_id;
        public string tactical_formation;
        public string advisor_id;
    }

    [Serializable]
    public class BattleLogEntry
    {
        public int turn;
        public string action;
        public string actor;
        public int damage_dealt;
        public string log_message;
    }

    [Serializable]
    public class BattleResultResponse
    {
        public string battle_id;
        public string scenario_id;
        public bool victory;
        public int turns_taken;
        public int player_casualties;
        public int enemy_casualties;
        public int reward_rice;
        public int reward_gold;
        public int reward_xp;
        public BattleLogEntry[] combat_logs;
        public string message;

        // Friendly aliases requested by the original client contract. The
        // backend does not return token_reward or remaining_hp in battle data.
        public bool is_victory;
        public int exp_earned;
        public long token_reward;
        public string battle_log;
        public int remaining_hp;

        public void NormalizeBackendFields()
        {
            is_victory = victory;
            exp_earned = reward_xp;
        }
    }

    [Serializable]
    public class RewardClaimRequest
    {
        public string wallet;
        public string battle_id;
    }

    [Serializable]
    public class ClaimRewardRequest
    {
        public string user_id;
        public string quest_or_stage_id;
        public string recipient_wallet_address;

        // Actual backend request fields; only these are submitted.
        public string wallet;
        public string battle_id;
    }

    [Serializable]
    public class ClaimRewardResponse
    {
        public bool success;
        public string transaction_signature;
        public long amount;
        public string explorer_url;

        // Additional fields returned by the current /rewards/claim endpoint.
        public string id;
        public string claim_id;
        public string wallet;
        public string chain;
        public string network;
        public string source_type;
        public string source_id;
        public string tx_digest;
        public string status;
        public string error;
        public void NormalizeBackendFields()
        {
            transaction_signature = tx_digest;
            success = status == "confirmed";
        }
    }

    [Serializable]
    public class LeaderboardEntryData
    {
        public int rank;
        public string username;
        public string wallet;
        public string faction_name;
        public int campaign_stars;
        public int battles_won;
        public int reputation_score;
    }

    [Serializable]
    public class EmptyArrayWrapper<T>
    {
        public T[] items;
    }
}
