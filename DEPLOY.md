# Deploy Devnet lên Render

Single-origin: `deploy/devnet/backend.Dockerfile` build frontend vào `frontend/dist`,
`app/hosted.py` mount API dưới `/api` + game ở `/`. Health check của Render phải là
`/api/health/ready` (không phải `/health/ready`).

## 1. Biến môi trường (xem `render.yaml`)

Public (có `value` trong yaml): `DEVNET_DEPLOYED=true`, `SOLANA_NETWORK=devnet`,
`SOLANA_PROGRAM_ID`, `GAME_TOKEN_*`, `REWARD_DISTRIBUTOR_{CONFIG,VAULT,AUTHORITY}`,
`SOL_REWARD_SIGNER_ADDRESS`, `REWARD_MAX_AMOUNT_BASE_UNITS`, `CORS_ALLOW_ORIGINS`.

Secret (`sync: false`, nhập tay trên dashboard, không commit):
`REWARD_DISTRIBUTOR_KEYPAIR_JSON` (chỉ dùng khi không có Secret File).

Từ database: `DATABASE_URL` (`fromDatabase: haokhi-devnet-db`).
`DATABASE_AUTO_CREATE=false` nên pre-deploy phải chạy migration:
`preDeployCommand: python /srv/gamefi/scripts/apply-migrations.py`
(script chạy 5 file `database/migrations/00X_*.sql` bằng psycopg; không dùng Alembic).

## 2. Secret File reward-distributor.json (khuyên dùng)

Dashboard service → Environment → Secret Files → Add:
filename `reward-distributor.json`, nội dung là JSON array 64 số 0–255 của keypair.
`REWARD_DISTRIBUTOR_KEYPAIR_PATH=/etc/secrets/reward-distributor.json` đã set trong yaml
(đường dẫn tuyệt đối được dùng nguyên, xem `app/core/config.py:config_path_candidates`).

Tạo local để lấy nội dung upload (KHÔNG commit file, KHÔNG paste vào chat/log):

```sh
mkdir -p backend/keys
solana-keygen new --outfile backend/keys/reward-distributor.json
solana-keygen pubkey backend/keys/reward-distributor.json  # phải bằng REWARD_DISTRIBUTOR_AUTHORITY
```

## 3. Nạp tiền trước khi mở game

```sh
solana airdrop 2 <REWARD_DISTRIBUTOR_AUTHORITY> --url devnet   # ≥ 0.05 SOL
# Nạp HKDV vào REWARD_DISTRIBUTOR_VAULT ≥ REWARD_MAX_AMOUNT_BASE_UNITS (1_000_000_000 base units)
solana program show <SOLANA_PROGRAM_ID> --url devnet          # Executable: true
```

## 4. Verify sau deploy

```sh
python scripts/post_deploy_check.py https://<service>.onrender.com/api
```

Checklist: env + secret file đã nhập → migration pre-deploy xanh → script trên PASS hết
(`/health`, `/health/ready` 200, `solana/config` `configured/program_deployed: true`) →
mở game, đánh 1 trận Bạch Đằng, claim HKDV (lỗi 503 vẫn giữ kết quả trận + Exp, có nút thử lại).

## 5. RPC / CORS / Frontend

- `SOLANA_RPC_URL` đọc từ env (`app/core/config.py:53`). Public devnet hay 429 → dùng
  RPC riêng Helius/QuickNode/Alchemy.
- `CORS_ALLOW_ORIGINS` parse bằng `cors_allowed_origins()` (phẩy, trim, bỏ `/` cuối).
  Thêm domain FE production `https://...` khi tách FE khỏi BE.
- Frontend API base: `VITE_API_URL` (`frontend/src/services/api.ts:20`, `solana.ts:8`);
  **Vite nhúng lúc build** — đổi URL Render phải rebuild/redeploy. Single-origin Dockerfile
  đã set `VITE_API_URL=/api`.
