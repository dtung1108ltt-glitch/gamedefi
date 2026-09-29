using System;
using System.Collections;
using System.Collections.Generic;
using System.Text;
using System.Threading.Tasks;
using UnityEngine;
using UnityEngine.Networking;
using VnHistoryGameFi.Models;

namespace VnHistoryGameFi.Network
{
    public class ApiClient : MonoBehaviour
    {
        public static ApiClient Instance { get; private set; }

        [SerializeField] private ApiConfig config;

        public event Action OnUnauthorized;

        private string _baseUrl;
        private string _accessToken;
        private bool _isInitialized;

        public string BaseURL => _baseUrl;

        private void Awake()
        {
            if (Instance != null && Instance != this)
            {
                Destroy(gameObject);
                return;
            }

            Instance = this;
            DontDestroyOnLoad(gameObject);
            if (config != null) Initialize(config);
        }

        private void OnDestroy()
        {
            if (Instance == this) Instance = null;
        }

        public void Initialize(ApiConfig apiConfig)
        {
            if (apiConfig == null) throw new ArgumentNullException(nameof(apiConfig));
            if (string.IsNullOrWhiteSpace(apiConfig.baseUrl))
                throw new InvalidOperationException("ApiConfig.baseUrl không được để trống.");

            config = apiConfig;
            _baseUrl = apiConfig.baseUrl.Trim().TrimEnd('/');
            _isInitialized = true;
        }

        public void SetAccessToken(string accessToken)
        {
            _accessToken = string.IsNullOrWhiteSpace(accessToken) ? null : accessToken.Trim();
        }

        public void ClearAccessToken()
        {
            _accessToken = null;
        }

        public Task<T> GetAsync<T>(string endpoint)
        {
            return SendAsync<T>(endpoint, UnityWebRequest.kHttpVerbGET, null);
        }

        public Task<T> PostAsync<T>(string endpoint, object payload)
        {
            if (payload == null) throw new ArgumentNullException(nameof(payload));
            return SendAsync<T>(endpoint, UnityWebRequest.kHttpVerbPOST, JsonUtility.ToJson(payload));
        }

        public async Task<T[]> GetListAsync<T>(string endpoint)
        {
            string json = await SendAsync<string>(endpoint, UnityWebRequest.kHttpVerbGET, null);
            if (string.IsNullOrWhiteSpace(json) || json == "[]") return Array.Empty<T>();
            string wrapped = "{\"items\":" + json + "}";
            EmptyArrayWrapper<T> response = JsonUtility.FromJson<EmptyArrayWrapper<T>>(wrapped);
            return response?.items ?? Array.Empty<T>();
        }

        private Task<T> SendAsync<T>(string endpoint, string method, string jsonBody)
        {
            EnsureInitialized();
            if (string.IsNullOrWhiteSpace(endpoint))
                throw new ArgumentException("API endpoint không được để trống.", nameof(endpoint));

            var completion = new TaskCompletionSource<T>();
            StartCoroutine(SendRequestCoroutine(endpoint, method, jsonBody, completion));
            return completion.Task;
        }

        private IEnumerator SendRequestCoroutine<T>(
            string endpoint,
            string method,
            string jsonBody,
            TaskCompletionSource<T> completion)
        {
            string url = _baseUrl + "/" + endpoint.TrimStart('/');
            using (var request = new UnityWebRequest(url, method))
            {
                request.downloadHandler = new DownloadHandlerBuffer();
                request.timeout = config != null ? Mathf.Max(1, config.timeoutSeconds) : 15;
                if (!string.IsNullOrEmpty(_accessToken))
                    request.SetRequestHeader("Authorization", "Bearer " + _accessToken);

                if (jsonBody != null)
                {
                    request.uploadHandler = new UploadHandlerRaw(Encoding.UTF8.GetBytes(jsonBody));
                    request.SetRequestHeader("Content-Type", "application/json");
                    request.SetRequestHeader("Accept", "application/json");
                }

                yield return request.SendWebRequest();

                long statusCode = request.responseCode;
                string responseBody = request.downloadHandler != null ? request.downloadHandler.text : string.Empty;
                if (statusCode == 401)
                {
                    ClearAccessToken();
                    try
                    {
                        OnUnauthorized?.Invoke();
                    }
                    catch (Exception handlerException)
                    {
                        Debug.LogException(handlerException, this);
                    }
                }

                if (request.result == UnityWebRequest.Result.ConnectionError)
                {
                    completion.TrySetException(new NetworkError(
                        $"Không thể kết nối API ({method} {endpoint}): {request.error}"));
                    yield break;
                }

                if (request.result == UnityWebRequest.Result.ProtocolError)
                {
                    completion.TrySetException(new ApiHttpError(
                        statusCode,
                        method,
                        endpoint,
                        ExtractDetail(responseBody, request.error)));
                    yield break;
                }

                if (request.result != UnityWebRequest.Result.Success)
                {
                    completion.TrySetException(new NetworkError(
                        $"Lỗi xử lý phản hồi API ({method} {endpoint}): {request.error}"));
                    yield break;
                }

                if (typeof(T) == typeof(string))
                {
                    completion.TrySetResult((T)(object)responseBody);
                    yield break;
                }

                try
                {
                    T parsed = JsonUtility.FromJson<T>(responseBody);
                    if (parsed == null)
                        throw new InvalidOperationException("API trả về JSON rỗng hoặc không đúng kiểu mong đợi.");
                    completion.TrySetResult(parsed);
                }
                catch (Exception exception)
                {
                    completion.TrySetException(new ApiResponseParseError(
                        $"Không thể đọc JSON từ {method} {endpoint}: {exception.Message}", exception));
                }
            }
        }

        // Callback wrappers retained for the existing faction/blockchain adapter.
        public void Get<TResponse>(string path, Action<TResponse> onSuccess, Action<string> onError)
        {
            _ = CompleteCallback(GetAsync<TResponse>(path), onSuccess, onError);
        }

        public void Post<TResponse>(
            string path,
            object bodyObject,
            Action<TResponse> onSuccess,
            Action<string> onError)
        {
            _ = CompleteCallback(PostAsync<TResponse>(path, bodyObject), onSuccess, onError);
        }

        public void GetFactionList(
            Action<FactionListWrapper> onSuccess,
            Action<string> onError)
        {
            _ = CompleteListCallback<FactionDto, FactionListWrapper>("/factions", onSuccess, onError);
        }

        public void GetRewardList(
            string wallet,
            Action<RewardListWrapper> onSuccess,
            Action<string> onError)
        {
            _ = CompleteListCallback<RewardDto, RewardListWrapper>(
                $"/players/{UnityWebRequest.EscapeURL(wallet)}/rewards", onSuccess, onError);
        }

        private async Task CompleteCallback<T>(
            Task<T> request,
            Action<T> onSuccess,
            Action<string> onError)
        {
            try
            {
                onSuccess?.Invoke(await request);
            }
            catch (Exception exception)
            {
                onError?.Invoke(exception.Message);
            }
        }

        private async Task CompleteListCallback<TItem, TWrapper>(
            string endpoint,
            Action<TWrapper> onSuccess,
            Action<string> onError)
            where TWrapper : new()
        {
            try
            {
                TItem[] items = await GetListAsync<TItem>(endpoint);
                var wrapper = new TWrapper();
                if (typeof(TWrapper) == typeof(FactionListWrapper))
                    ((FactionListWrapper)(object)wrapper).items =
                        new List<FactionDto>(Array.ConvertAll(items, item => (FactionDto)(object)item));
                else if (typeof(TWrapper) == typeof(RewardListWrapper))
                    ((RewardListWrapper)(object)wrapper).items =
                        new List<RewardDto>(Array.ConvertAll(items, item => (RewardDto)(object)item));
                onSuccess?.Invoke(wrapper);
            }
            catch (Exception exception)
            {
                onError?.Invoke(exception.Message);
            }
        }

        private void EnsureInitialized()
        {
            if (!_isInitialized)
                throw new InvalidOperationException(
                    "ApiClient chưa được cấu hình. Gán ApiConfig trong Inspector hoặc gọi Initialize() trước khi request.");
        }

        private static string ExtractDetail(string body, string fallback)
        {
            if (string.IsNullOrWhiteSpace(body)) return fallback;
            const string key = "\"detail\"";
            int keyIndex = body.IndexOf(key, StringComparison.Ordinal);
            if (keyIndex < 0) return body;

            int colonIndex = body.IndexOf(':', keyIndex + key.Length);
            if (colonIndex < 0) return body;
            int firstQuote = body.IndexOf('"', colonIndex + 1);
            if (firstQuote < 0) return body;
            int secondQuote = body.IndexOf('"', firstQuote + 1);
            return secondQuote > firstQuote
                ? body.Substring(firstQuote + 1, secondQuote - firstQuote - 1)
                : body;
        }
    }

    public class NetworkError : Exception
    {
        public NetworkError(string message) : base(message) { }
    }

    public class ApiHttpError : Exception
    {
        public long StatusCode { get; }
        public string Method { get; }
        public string Endpoint { get; }

        public ApiHttpError(long statusCode, string method, string endpoint, string detail)
            : base($"API trả HTTP {statusCode} ({method} {endpoint}): {detail}")
        {
            StatusCode = statusCode;
            Method = method;
            Endpoint = endpoint;
        }
    }

    public class ApiResponseParseError : Exception
    {
        public ApiResponseParseError(string message, Exception innerException)
            : base(message, innerException) { }
    }
}
