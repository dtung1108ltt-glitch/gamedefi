using UnityEngine;

namespace VnHistoryGameFi.Network
{
    /// <summary>
    /// Cấu hình base URL cho FastAPI backend thật.
    /// Khi chạy trực tiếp `uvicorn app.main:app --reload`, route bắt đầu tại
    /// `/auth`, `/battles`... nên base URL là http://127.0.0.1:8000.
    /// Khi gọi app được mount qua backend/app/hosted.py, dùng
    /// http://127.0.0.1:8000/api (hoặc URL deploy cùng prefix /api).
    /// </summary>
    [CreateAssetMenu(fileName = "ApiConfig", menuName = "VnHistoryGameFi/Api Config")]
    public class ApiConfig : ScriptableObject
    {
        [Tooltip("Base URL đầy đủ tới FastAPI, có thể kèm /api, không có dấu / ở cuối.")]
        public string baseUrl = "http://127.0.0.1:8000";

        [Tooltip("Chain mặc định dùng khi test trong Editor: \"solana\".")]
        public string defaultChain = "solana";

        [Tooltip("Timeout (giây) cho mỗi request.")]
        public int timeoutSeconds = 10;
    }
}
