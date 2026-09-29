# Unity client - FastAPI / Solana Devnet

Unity client thử nghiệm gọi backend FastAPI thật qua `UnityWebRequest`. Client
gửi input trận đấu; backend xác thực session, tính kết quả trong
`backend/app/domain/battle_engine.py`, ghi nhận eligibility và phân phối HKDV.
Unity không tự tính kết quả trận và không giữ private key của distributor.

## Những gì backend thực sự hỗ trợ

| Chức năng | Endpoint / giới hạn |
|---|---|
| Đăng nhập Guest | `POST /auth/guest` với `{ "username": "..." }` |
| Đăng nhập ví | `POST /auth/nonce`, ký challenge bằng ví thật, rồi `POST /auth/wallet` |
| Đăng ký / đăng nhập mật khẩu | Chưa có `/auth/register` hoặc `/auth/login`; client không gửi password giả định |
| Danh sách quân sư | `GET /advisors`; quyền sở hữu có thể kiểm tra ở `/advisors/{id}/ownership` |
| Danh sách faction | `GET /factions`; guest chọn qua `POST /players/{wallet}/faction/select` |
| Trận server-authoritative | `POST /battles` với `player_wallet`, `scenario_id`, `tactical_formation`, `advisor_id` |
| Bảng xếp hạng | `GET /leaderboard` |
| Claim thưởng trận | `POST /rewards/claim` với `wallet`, `battle_id`; yêu cầu bearer token và chiến thắng đã ghi nhận |

Backend không trả `token_reward` hay `remaining_hp` trong kết quả battle. Battle
trả `reward_rice`, `reward_gold`, `reward_xp`, `victory`, `battle_id` và
`combat_logs`. HKDV được trả qua response của claim, trong đó `amount` là
**base units**, `tx_digest` là signature và `explorer_url` là URL do backend tạo.
Guest không thể claim on-chain.

Các DTO `LoginRequest` và `RegisterRequest` được giữ làm mẫu hợp đồng tương lai,
nhưng không được gọi vì backend hiện không có hai API tương ứng. Wallet login
tự tạo player lần đầu. Ở Unity không có SDK ký ví đi kèm: `GameUIManager` cho
phép nhập chữ ký do ví thật tạo; không bao giờ nhập seed phrase/private key.

## Mã nguồn

- `Assets/Scripts/Models/Models.cs`: DTO theo backend và alias tương thích.
- `Assets/Scripts/Network/ApiClient.cs`: singleton bền qua scene, `Task` /
  `async-await`, bearer token, phân loại lỗi network / HTTP / JSON, event 401.
- `Assets/Scripts/Network/ApiConfig.cs`: cấu hình base URL.
- `Assets/Scripts/Services/AuthService.cs`: guest login và challenge wallet.
- `Assets/Scripts/Services/BattleService.cs`: factions, quân sư có thể dùng,
  battle server-authoritative và leaderboard.
- `Assets/Scripts/Services/SolanaRewardManager.cs`: kiểm tra địa chỉ Base58,
  gọi claim backend và mở Solana Explorer.
- `Assets/Scripts/Core/GameUIManager.cs`: controller nối UI với các service.
- `Assets/Scripts/Network/ApiBlockchainAdapter.cs`: adapter tương thích các
  luồng faction/blockchain sẵn có trong Unity client.

## Cấu hình base URL

Chạy backend trực tiếp bằng:

```powershell
cd .\backend
python -m pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Tạo `ApiConfig` từ **Assets > Create > VnHistoryGameFi > Api Config**:

- Unity Editor trên cùng máy, backend chạy `uvicorn app.main:app`:
  `http://127.0.0.1:8000`
- Backend được mount bởi `backend/app/hosted.py` tại `/api`:
  `http://127.0.0.1:8000/api`
- Android Emulator gọi backend trên máy host:
  `http://10.0.2.2:8000` (hoặc thêm `/api` nếu chạy hosted app).
- Thiết bị Android/iOS thật: dùng IP LAN của máy chạy backend, không dùng
  `localhost`/`127.0.0.1` vì chúng trỏ về chính thiết bị.

Backend phải bind ra interface phù hợp và firewall cho phép kết nối. HTTP thường
chỉ dùng cho local development; cấu hình HTTPS cho môi trường public. Với WebGL,
cần cấu hình `CORS_ALLOW_ORIGINS` ở backend để cho phép origin của trang game.

## Tạo scene và gán UI

Dùng Unity `2022.3.50f1` (xem `ProjectSettings/ProjectVersion.txt`). Tạo scene
ví dụ `Game` với cấu trúc:

Package TextMeshPro `3.0.6` được khai báo trong `Packages/manifest.json`. Sau
khi Unity resolve package, chọn **Window > TextMeshPro > Import TMP Essential
Resources** để có font mặc định cho các component TMP.

```text
Game
├── ApiClient                  (ApiClient component, ApiConfig được gán)
├── EventSystem
└── Canvas                     (Canvas + CanvasScaler + GraphicRaycaster)
    ├── AuthPanel
    │   ├── GuestUsername      (TMP_InputField)
    │   ├── GuestLoginButton   (Button)
    │   ├── WalletAddress      (TMP_InputField)
    │   ├── RequestChallenge   (Button)
    │   ├── WalletChallenge    (TMP_Text)
    │   ├── WalletSignature    (TMP_InputField)
    │   ├── VerifyWallet       (Button)
    │   └── RegisterButton     (Button, tùy chọn; hiển thị backend chưa hỗ trợ)
    ├── PlayerStatus           (TMP_Text)
    ├── LogoutButton           (Button)
    ├── GamePanel
    │   ├── FactionDropdown    (TMP_Dropdown; tự nạp từ API)
    │   ├── SelectFaction      (Button; dành cho Guest)
    │   ├── AdvisorDropdown    (TMP_Dropdown; quân sư thuộc quyền sử dụng)
    │   ├── FormationDropdown  (TMP_Dropdown)
    │   ├── ScenarioDropdown   (TMP_Dropdown)
    │   ├── EnterBattle        (Button)
    │   └── LeaderboardButton  (Button)
    ├── BattleResultPanel
    │   ├── BattleResult       (TMP_Text)
    │   ├── CombatLog          (TMP_Text)
    │   ├── RewardSummary      (TMP_Text)
    │   ├── RecipientWallet    (TMP_InputField)
    │   ├── ClaimReward        (Button)
    │   └── OpenExplorer       (Button)
    ├── Leaderboard            (TMP_Text)
    ├── Status                 (TMP_Text)
    └── GameUIManager          (GameUIManager component)
```

Trên `GameUIManager`, kéo `ApiConfig` vào **Api Config** và kéo đúng từng
component UI vào các field cùng tên. Có thể để field leaderboard, registration
hoặc wallet controls trống nếu không dùng. Đảm bảo `ApiClient` tồn tại trong
scene và cùng được gán `ApiConfig`; nó sẽ giữ instance qua scene bằng
`DontDestroyOnLoad`.

Dropdown `FormationDropdown` phải có các option theo đúng thứ tự:

1. `standard`
2. `defensive`
3. `aggressive`

Dropdown `ScenarioDropdown` phải theo thứ tự sau (nhãn có thể hiển thị tiếng Việt):

1. `bach_dang_1288`
2. `rach_gam_1785`
3. `ngoc_hoi_1789`
4. `nhu_nguyet_1077`

Controller dùng index để map dropdown sang các giá trị backend. Faction dropdown
được nạp tự động. Sau khi guest chọn faction, quân sư khởi đầu được gán bởi
backend; các quân sư sở hữu đã xác minh cũng hiện trong dropdown. Ví đã kết nối
cần hoàn thành luồng mint/register faction NFT/proof riêng trước khi battle.

## Luồng chạy thử

1. Khởi động backend, kiểm tra `http://127.0.0.1:8000/health`.
2. Mở scene, nhập Guest username rồi nhấn **Guest Login**.
3. Guest chọn faction, nhấn **Select Faction**; backend gán quân sư khởi đầu.
4. Chọn formation/scenario/quân sư và nhấn **Enter Battle**. Kết quả/log đến từ
   backend; không dùng Unity local score để claim.
5. Guest không nhận thưởng on-chain. Muốn thử claim, đăng nhập bằng ví đã mint
   faction proof, ký nonce trong ví thật, thắng trận rồi claim bằng cùng địa chỉ
   ví. Backend chỉ cấp HKDV nếu trận thắng hợp lệ và distributor đã cấu hình.
6. Mở signature trong Solana Explorer bằng nút **Open Explorer**.

`ApiClient.OnUnauthorized` được phát khi server trả HTTP 401; controller xóa
trạng thái đăng nhập và yêu cầu người chơi đăng nhập lại. Lỗi mất mạng, lỗi HTTP
(bao gồm 400/403/409/422/500) và lỗi parse JSON được phân loại riêng, không giả
lập kết quả thành công.

## Giới hạn cần biết

- Password login/register chưa tồn tại trong FastAPI.
- Unity không bao gồm Phantom/Solflare signing SDK; cần tích hợp wallet adapter
  native/WebGL để xin chữ ký thay vì nhập thủ công.
- Claim dùng battle ID và wallet của session. Quest claim hiện có endpoint riêng
  `/rewards/quests/claim`, nhưng UI này chỉ claim phần thưởng battle.
- Private key distributor chỉ nằm ở backend/Render secret file, tuyệt đối không
  đưa vào Unity client.
- Chưa thể xác nhận compile trong Unity Editor trên máy này; mở project bằng
  Unity 2022.3.50f1 và kiểm tra Console trước khi build.
