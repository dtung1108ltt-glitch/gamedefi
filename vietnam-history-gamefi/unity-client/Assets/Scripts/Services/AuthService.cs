using System;
using System.Threading.Tasks;
using VnHistoryGameFi.Models;
using VnHistoryGameFi.Network;

namespace VnHistoryGameFi.Services
{
    public class AuthService
    {
        private readonly ApiClient _api;

        public AuthService(ApiClient api)
        {
            _api = api ?? throw new ArgumentNullException(nameof(api));
        }

        public async Task<PlayerData> LoginAsGuestAsync(string username)
        {
            var response = await _api.PostAsync<PlayerData>(
                "/auth/guest",
                new GuestLoginRequest { username = username });

            if (string.IsNullOrWhiteSpace(response.access_token))
                throw new ApiResponseParseError("Backend không trả access_token cho guest login.", null);

            _api.SetAccessToken(response.access_token);
            return response;
        }

        public Task<WalletNonceResponse> RequestWalletChallengeAsync(string wallet)
        {
            return _api.PostAsync<WalletNonceResponse>(
                "/auth/nonce",
                new WalletNonceRequest { chain = "solana", wallet = wallet });
        }

        public async Task<PlayerData> VerifyWalletLoginAsync(
            string wallet,
            WalletNonceResponse challenge,
            string signature)
        {
            if (challenge == null) throw new ArgumentNullException(nameof(challenge));
            if (string.IsNullOrWhiteSpace(signature))
                throw new ArgumentException("Chữ ký phải được tạo bởi ví Solana thật.", nameof(signature));

            var response = await _api.PostAsync<PlayerData>(
                "/auth/wallet",
                new WalletVerifyRequest
                {
                    chain = "solana",
                    wallet = wallet,
                    nonce = challenge.nonce,
                    message = challenge.message,
                    signature = signature,
                });

            if (string.IsNullOrWhiteSpace(response.access_token))
                throw new ApiResponseParseError("Backend không trả access_token cho wallet login.", null);

            _api.SetAccessToken(response.access_token);
            return response;
        }

        public void Logout()
        {
            _api.ClearAccessToken();
        }
    }
}
