using System;
using System.Linq;
using System.Threading.Tasks;
using TMPro;
using UnityEngine;
using UnityEngine.UI;
using VnHistoryGameFi.Models;
using VnHistoryGameFi.Network;
using VnHistoryGameFi.Services;

namespace VnHistoryGameFi.Core
{
    public class GameUIManager : MonoBehaviour
    {
        [Header("API")]
        [SerializeField] private ApiConfig apiConfig;
        [SerializeField] private ApiClient apiClient;

        [Header("Authentication")]
        [SerializeField] private TMP_InputField guestUsernameInput;
        [SerializeField] private Button guestLoginButton;
        [SerializeField] private TMP_InputField walletAddressInput;
        [SerializeField] private Button requestWalletChallengeButton;
        [SerializeField] private TMP_Text walletChallengeText;
        [SerializeField] private TMP_InputField walletSignatureInput;
        [SerializeField] private Button verifyWalletButton;
        [SerializeField] private Button registerButton;
        [SerializeField] private Button logoutButton;
        [SerializeField] private TMP_Text playerStatusText;

        [Header("Faction / advisor")]
        [SerializeField] private TMP_Dropdown factionDropdown;
        [SerializeField] private Button selectFactionButton;
        [SerializeField] private TMP_Dropdown advisorDropdown;
        [SerializeField] private TMP_Dropdown formationDropdown;
        [SerializeField] private TMP_Dropdown scenarioDropdown;
        [SerializeField] private Button enterBattleButton;

        [Header("Battle result")]
        [SerializeField] private GameObject battleResultPanel;
        [SerializeField] private TMP_Text battleResultText;
        [SerializeField] private TMP_Text combatLogText;
        [SerializeField] private TMP_Text rewardSummaryText;

        [Header("HKDV reward")]
        [SerializeField] private TMP_InputField recipientWalletInput;
        [SerializeField] private Button claimRewardButton;
        [SerializeField] private Button openExplorerButton;

        [Header("Leaderboard / status")]
        [SerializeField] private Button leaderboardButton;
        [SerializeField] private TMP_Text leaderboardText;
        [SerializeField] private TMP_Text statusText;

        private AuthService _authService;
        private BattleService _battleService;
        private SolanaRewardManager _rewardManager;
        private PlayerData _player;
        private FactionData[] _factions = Array.Empty<FactionData>();
        private AdvisorData[] _advisors = Array.Empty<AdvisorData>();
        private WalletNonceResponse _walletChallenge;
        private string _walletChallengeAddress;
        private BattleResultResponse _lastBattle;
        private string _lastTransactionSignature;
        private bool _claimSubmitted;

        private void Awake()
        {
            if (apiClient == null) apiClient = ApiClient.Instance;
            if (apiClient == null)
            {
                var clientObject = new GameObject("ApiClient");
                apiClient = clientObject.AddComponent<ApiClient>();
            }

            if (apiConfig != null)
            {
                try
                {
                    apiClient.Initialize(apiConfig);
                }
                catch (Exception exception)
                {
                    SetStatus(exception.Message);
                }
            }

            _authService = new AuthService(apiClient);
            _battleService = new BattleService(apiClient);
            _rewardManager = new SolanaRewardManager(apiClient);
        }

        private void OnEnable()
        {
            if (apiClient != null) apiClient.OnUnauthorized += HandleUnauthorized;
        }

        private void OnDisable()
        {
            if (apiClient != null) apiClient.OnUnauthorized -= HandleUnauthorized;
            RemoveButtonListeners();
        }

        private void Start()
        {
            AddButtonListeners();
            SetLoggedInControls(false);
            if (battleResultPanel != null) battleResultPanel.SetActive(false);
            if (openExplorerButton != null) openExplorerButton.interactable = false;
            if (advisorDropdown != null) advisorDropdown.interactable = false;
            SetStatus("Nhập tên để chơi Guest, hoặc đăng nhập bằng ví Solana.");
        }

        private void AddButtonListeners()
        {
            if (guestLoginButton != null) guestLoginButton.onClick.AddListener(LoginAsGuest);
            if (requestWalletChallengeButton != null)
                requestWalletChallengeButton.onClick.AddListener(RequestWalletChallenge);
            if (verifyWalletButton != null) verifyWalletButton.onClick.AddListener(VerifyWallet);
            if (registerButton != null) registerButton.onClick.AddListener(ShowRegistrationUnavailable);
            if (logoutButton != null) logoutButton.onClick.AddListener(Logout);
            if (selectFactionButton != null) selectFactionButton.onClick.AddListener(SelectFaction);
            if (enterBattleButton != null) enterBattleButton.onClick.AddListener(EnterBattle);
            if (claimRewardButton != null) claimRewardButton.onClick.AddListener(ClaimReward);
            if (openExplorerButton != null) openExplorerButton.onClick.AddListener(OpenExplorer);
            if (leaderboardButton != null) leaderboardButton.onClick.AddListener(LoadLeaderboard);
        }

        private void RemoveButtonListeners()
        {
            if (guestLoginButton != null) guestLoginButton.onClick.RemoveListener(LoginAsGuest);
            if (requestWalletChallengeButton != null)
                requestWalletChallengeButton.onClick.RemoveListener(RequestWalletChallenge);
            if (verifyWalletButton != null) verifyWalletButton.onClick.RemoveListener(VerifyWallet);
            if (registerButton != null) registerButton.onClick.RemoveListener(ShowRegistrationUnavailable);
            if (logoutButton != null) logoutButton.onClick.RemoveListener(Logout);
            if (selectFactionButton != null) selectFactionButton.onClick.RemoveListener(SelectFaction);
            if (enterBattleButton != null) enterBattleButton.onClick.RemoveListener(EnterBattle);
            if (claimRewardButton != null) claimRewardButton.onClick.RemoveListener(ClaimReward);
            if (openExplorerButton != null) openExplorerButton.onClick.RemoveListener(OpenExplorer);
            if (leaderboardButton != null) leaderboardButton.onClick.RemoveListener(LoadLeaderboard);
        }

        private async void LoginAsGuest()
        {
            try
            {
                EnsureApiConfigured();
                SetBusy(true);
                _player = await _authService.LoginAsGuestAsync(
                    guestUsernameInput != null ? guestUsernameInput.text.Trim() : string.Empty);
                OnLoginCompleted();
            }
            catch (Exception exception)
            {
                ShowError(exception);
            }
            finally
            {
                SetBusy(false);
            }
        }

        private async void RequestWalletChallenge()
        {
            try
            {
                EnsureApiConfigured();
                string wallet = walletAddressInput != null ? walletAddressInput.text.Trim() : string.Empty;
                if (!SolanaRewardManager.IsValidSolanaAddress(wallet))
                    throw new ArgumentException("Nhập địa chỉ ví Solana Base58 hợp lệ.");

                SetBusy(true);
                _walletChallenge = await _authService.RequestWalletChallengeAsync(wallet);
                _walletChallengeAddress = wallet;
                if (walletChallengeText != null)
                    walletChallengeText.text = _walletChallenge.message +
                        "\n\nHãy ký nguyên văn message này bằng ví Solana; không nhập seed phrase/private key.";
                SetStatus("Challenge đã tạo. Hãy ký message trong ví rồi dán chữ ký.");
            }
            catch (Exception exception)
            {
                ShowError(exception);
            }
            finally
            {
                SetBusy(false);
            }
        }

        private async void VerifyWallet()
        {
            try
            {
                EnsureApiConfigured();
                if (_walletChallenge == null)
                    throw new InvalidOperationException("Cần lấy wallet challenge trước khi xác thực.");
                string wallet = walletAddressInput != null ? walletAddressInput.text.Trim() : string.Empty;
                if (!string.Equals(wallet, _walletChallengeAddress, StringComparison.Ordinal))
                    throw new InvalidOperationException("Địa chỉ ví đã đổi. Hãy yêu cầu challenge mới cho ví này.");
                if (string.IsNullOrWhiteSpace(walletSignatureInput?.text))
                    throw new ArgumentException("Dán chữ ký Base58 do ví thật tạo.");

                SetBusy(true);
                _player = await _authService.VerifyWalletLoginAsync(
                    wallet,
                    _walletChallenge,
                    walletSignatureInput.text.Trim());
                _walletChallenge = null;
                _walletChallengeAddress = null;
                OnLoginCompleted();
            }
            catch (Exception exception)
            {
                ShowError(exception);
            }
            finally
            {
                SetBusy(false);
            }
        }

        private void ShowRegistrationUnavailable()
        {
            SetStatus(
                "Backend hiện không có POST /auth/register hoặc đăng nhập bằng mật khẩu. " +
                "Wallet login tự tạo player ở lần đăng nhập đầu; có thể dùng Guest để thử gameplay.");
        }

        private async void SelectFaction()
        {
            try
            {
                if (_player == null) throw new InvalidOperationException("Đăng nhập trước khi chọn faction.");
                if (!_player.is_guest)
                    throw new InvalidOperationException(
                        "Backend chỉ cho Guest chọn faction trực tiếp. Tài khoản ví cần mint/register faction proof on-chain.");
                if (_factions.Length == 0 || factionDropdown == null)
                    throw new InvalidOperationException("Chưa tải được danh sách faction.");

                SetBusy(true);
                FactionData faction = _factions[Mathf.Clamp(factionDropdown.value, 0, _factions.Length - 1)];
                _player = await _battleService.SelectGuestFactionAsync(_player.wallet, faction.faction_id);
                if (playerStatusText != null)
                    playerStatusText.text = $"{_player.username} · {faction.name} · Guest";
                await UpdateAdvisorOptionsAsync(faction);
                SetStatus("Đã chọn faction và gán quân sư khởi đầu từ backend.");
            }
            catch (Exception exception)
            {
                ShowError(exception);
            }
            finally
            {
                SetBusy(false);
            }
        }

        private async void EnterBattle()
        {
            try
            {
                if (_player == null) throw new InvalidOperationException("Đăng nhập trước khi vào trận.");
                if (_player.faction_id <= 0)
                    throw new InvalidOperationException("Hãy chọn faction trước khi vào trận.");
                EnsureApiConfigured();

                var request = new BattleRequest
                {
                    player_wallet = _player.wallet,
                    scenario_id = SelectedValue(
                        scenarioDropdown,
                        new[] { "bach_dang_1288", "rach_gam_1785", "ngoc_hoi_1789", "nhu_nguyet_1077" },
                        "bach_dang_1288"),
                    tactical_formation = SelectedValue(
                        formationDropdown,
                        new[] { "standard", "defensive", "aggressive" },
                        "standard"),
                    advisor_id = GetSelectedAdvisorId(),
                };

                SetBusy(true);
                _lastBattle = null;
                _lastTransactionSignature = null;
                _claimSubmitted = false;
                if (claimRewardButton != null) claimRewardButton.interactable = false;
                if (openExplorerButton != null) openExplorerButton.interactable = false;
                if (battleResultPanel != null) battleResultPanel.SetActive(true);
                if (combatLogText != null) combatLogText.text = string.Empty;
                if (rewardSummaryText != null) rewardSummaryText.text = string.Empty;

                _lastBattle = await _battleService.SimulateBattleAsync(
                    request,
                    entry =>
                    {
                        if (combatLogText != null)
                            combatLogText.text += $"Hiệp {entry.turn} · {entry.actor} · " +
                                                 $"{entry.log_message}\n";
                    });

                if (battleResultText != null)
                    battleResultText.text = _lastBattle.victory ? "CHIẾN THẮNG" : "THẤT BẠI";
                if (rewardSummaryText != null)
                {
                    rewardSummaryText.text =
                        $"Lúa: {_lastBattle.reward_rice:N0} · Vàng: {_lastBattle.reward_gold:N0} · " +
                        $"EXP: {_lastBattle.reward_xp:N0}\nBattle ID: {_lastBattle.battle_id}\n" +
                        (_lastBattle.victory
                            ? "Chiến thắng đủ điều kiện yêu cầu claim HKDV on-chain."
                            : "Chỉ chiến thắng mới đủ điều kiện claim HKDV.");
                }

                if (recipientWalletInput != null)
                    recipientWalletInput.text = _player.wallet;
                if (claimRewardButton != null)
                    claimRewardButton.interactable = _lastBattle.victory && !_player.is_guest;
                SetStatus(_lastBattle.message);
            }
            catch (Exception exception)
            {
                ShowError(exception);
            }
            finally
            {
                SetBusy(false);
            }
        }

        private async void ClaimReward()
        {
            try
            {
                if (_player == null || _lastBattle == null)
                    throw new InvalidOperationException("Chưa có kết quả trận đánh để claim.");
                if (!_lastBattle.victory)
                    throw new InvalidOperationException("Trận thua không đủ điều kiện nhận HKDV.");
                if (_player.is_guest)
                    throw new InvalidOperationException("Tài khoản Guest không thể claim phần thưởng on-chain.");

                string wallet = recipientWalletInput != null ? recipientWalletInput.text.Trim() : string.Empty;
                if (!string.Equals(wallet, _player.wallet, StringComparison.Ordinal))
                    throw new InvalidOperationException(
                        "Ví nhận thưởng phải trùng với ví của người chơi đã đăng nhập.");

                SetBusy(true);
                ClaimRewardResponse response =
                    await _rewardManager.ClaimBattleRewardAsync(wallet, _lastBattle.battle_id);
                _lastTransactionSignature = response.transaction_signature;
                _claimSubmitted = true;
                if (rewardSummaryText != null)
                {
                    rewardSummaryText.text +=
                        $"\nTrạng thái claim: {response.status} · Amount: {response.amount} base units" +
                        (string.IsNullOrEmpty(_lastTransactionSignature)
                            ? string.Empty
                            : $"\nSignature: {_lastTransactionSignature}");
                }
                if (openExplorerButton != null)
                    openExplorerButton.interactable = !string.IsNullOrEmpty(_lastTransactionSignature);
                if (claimRewardButton != null) claimRewardButton.interactable = false;
                SetStatus(response.success
                    ? "HKDV đã xác nhận on-chain."
                    : $"Claim đã được backend ghi nhận với trạng thái: {response.status}.");
            }
            catch (Exception exception)
            {
                ShowError(exception);
            }
            finally
            {
                SetBusy(false);
            }
        }

        private async void LoadLeaderboard()
        {
            try
            {
                EnsureApiConfigured();
                SetBusy(true);
                LeaderboardEntryData[] entries = await _battleService.LoadLeaderboardAsync();
                if (leaderboardText != null)
                {
                    leaderboardText.text = string.Join(
                        "\n",
                        entries.Select(entry =>
                            $"{entry.rank}. {entry.username} · {entry.faction_name} · " +
                            $"Thắng {entry.battles_won} · Uy danh {entry.reputation_score}"));
                }
                SetStatus($"Đã tải {entries.Length} người chơi trên bảng xếp hạng.");
            }
            catch (Exception exception)
            {
                ShowError(exception);
            }
            finally
            {
                SetBusy(false);
            }
        }

        private void OpenExplorer()
        {
            try
            {
                SolanaRewardManager.OpenSolanaExplorer(
                    _lastTransactionSignature,
                    "devnet");
            }
            catch (Exception exception)
            {
                ShowError(exception);
            }
        }

        private void Logout()
        {
            _authService?.Logout();
            _player = null;
            _lastBattle = null;
            _claimSubmitted = false;
            _walletChallenge = null;
            _walletChallengeAddress = null;
            SetLoggedInControls(false);
            if (battleResultPanel != null) battleResultPanel.SetActive(false);
            SetStatus("Đã đăng xuất.");
        }

        private async void OnLoginCompleted()
        {
            if (_player == null) return;
            SetLoggedInControls(true);
            if (playerStatusText != null)
                playerStatusText.text = $"{_player.username} · {_player.wallet} · " +
                                        (_player.is_guest ? "Guest" : "Solana");
            if (recipientWalletInput != null) recipientWalletInput.text = _player.wallet;

            try
            {
                SetBusy(true);
                _factions = await _battleService.LoadFactionsAsync();
                _advisors = await _battleService.LoadAdvisorsAsync();
                PopulateFactionDropdown();
                FactionData currentFaction = _factions.FirstOrDefault(
                    faction => faction.faction_id == _player.faction_id);
                if (currentFaction != null) await UpdateAdvisorOptionsAsync(currentFaction);
                SetStatus("Đăng nhập thành công. Chọn faction nếu cần, sau đó vào trận.");
            }
            catch (Exception exception)
            {
                ShowError(exception);
            }
            finally
            {
                SetBusy(false);
            }
        }

        private void PopulateFactionDropdown()
        {
            if (factionDropdown == null) return;
            factionDropdown.ClearOptions();
            factionDropdown.AddOptions(_factions.Select(faction => faction.name).ToList());
            int selected = Array.FindIndex(_factions, faction => faction.faction_id == _player.faction_id);
            if (selected >= 0) factionDropdown.SetValueWithoutNotify(selected);
        }

        private async Task UpdateAdvisorOptionsAsync(FactionData faction)
        {
            if (advisorDropdown == null) return;

            AdvisorData[] usableAdvisors = await _battleService.LoadUsableAdvisorsAsync(
                _player.wallet,
                string.IsNullOrWhiteSpace(_player.chain) ? "solana" : _player.chain,
                faction.starting_advisor_id);
            advisorDropdown.ClearOptions();
            if (usableAdvisors.Length == 0)
            {
                advisorDropdown.AddOptions(new System.Collections.Generic.List<string> { "Không có quân sư khả dụng" });
                advisorDropdown.interactable = false;
                _advisors = Array.Empty<AdvisorData>();
                return;
            }

            _advisors = usableAdvisors;
            advisorDropdown.AddOptions(usableAdvisors.Select(advisor => advisor.name).ToList());
            advisorDropdown.SetValueWithoutNotify(0);
            advisorDropdown.interactable = usableAdvisors.Length > 1;
        }

        private string GetSelectedAdvisorId()
        {
            if (_advisors.Length == 0 || advisorDropdown == null) return null;
            int index = Mathf.Clamp(advisorDropdown.value, 0, _advisors.Length - 1);
            return _advisors[index].id;
        }

        private static string SelectedValue(TMP_Dropdown dropdown, string[] values, string fallback)
        {
            if (dropdown == null || values.Length == 0) return fallback;
            int index = Mathf.Clamp(dropdown.value, 0, values.Length - 1);
            return values[index];
        }

        private void HandleUnauthorized()
        {
            _player = null;
            _walletChallenge = null;
            _walletChallengeAddress = null;
            _lastBattle = null;
            _claimSubmitted = false;
            _lastTransactionSignature = null;
            SetLoggedInControls(false);
            SetStatus("Phiên đăng nhập hết hạn hoặc không hợp lệ. Hãy đăng nhập lại.");
        }

        private void SetLoggedInControls(bool loggedIn)
        {
            SetActiveIfAssigned(logoutButton, loggedIn);
            SetActiveIfAssigned(selectFactionButton, loggedIn && _player != null && _player.is_guest);
            SetActiveIfAssigned(enterBattleButton, loggedIn);
            if (claimRewardButton != null) claimRewardButton.interactable = false;
            if (factionDropdown != null) factionDropdown.interactable = loggedIn && _player != null && _player.is_guest;
            if (guestLoginButton != null) guestLoginButton.interactable = !loggedIn;
            if (verifyWalletButton != null) verifyWalletButton.interactable = !loggedIn;
        }

        private void SetBusy(bool busy)
        {
            if (guestLoginButton != null) guestLoginButton.interactable = !busy && _player == null;
            if (requestWalletChallengeButton != null) requestWalletChallengeButton.interactable = !busy;
            if (verifyWalletButton != null) verifyWalletButton.interactable = !busy && _player == null;
            if (selectFactionButton != null)
                selectFactionButton.interactable = !busy && _player != null && _player.is_guest;
            if (enterBattleButton != null) enterBattleButton.interactable = !busy && _player != null;
            if (claimRewardButton != null)
                claimRewardButton.interactable = !busy && _lastBattle != null &&
                                                 _lastBattle.victory && _player != null && !_player.is_guest &&
                                                 !_claimSubmitted;
            if (leaderboardButton != null) leaderboardButton.interactable = !busy;
        }

        private void EnsureApiConfigured()
        {
            if (apiClient == null || string.IsNullOrWhiteSpace(apiClient.BaseURL))
                throw new InvalidOperationException(
                    "Chưa cấu hình ApiClient. Gán ApiConfig và Base URL trong Inspector.");
        }

        private void ShowError(Exception exception)
        {
            Debug.LogException(exception, this);
            SetStatus(exception.Message);
        }

        private void SetStatus(string message)
        {
            if (statusText != null) statusText.text = message;
            else Debug.Log(message, this);
        }

        private static void SetActiveIfAssigned(Selectable control, bool active)
        {
            if (control != null) control.gameObject.SetActive(active);
        }
    }
}
