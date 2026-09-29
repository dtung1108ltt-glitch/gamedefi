# Blockchain — Solana

## Đăng nhập

`POST /auth/nonce` → ví ký UTF-8 message bằng Ed25519 → chữ ký base58 →
`POST /auth/wallet` → bearer token dùng cho mọi API ghi. Địa chỉ Solana phân biệt hoa/thường.
Backend không giữ private key của người chơi. Ví thưởng SOL của ứng dụng được cấu hình riêng trên server.

## Faction proof

`mint_faction(faction_id: String, metadata_uri: String)` nhận accounts theo thứ tự:

1. `proof`: writable PDA từ `[b"faction", owner public key]`.
2. `owner`: signer, writable, trả rent và gas.
3. `system_program`.

Instruction data: SHA256(`global:mint_faction`) lấy 8 byte đầu, tiếp theo hai string Borsh.
Account data: SHA256(`account:AssetProof`) lấy 8 byte đầu, `owner: Pubkey`,
`kind: String`, `reference_id: String`, `metadata_uri: String`.

Contract chỉ nhận faction `1` đến `8`. `init` PDA chặn mint lần hai;
không có hàm chuyển/đóng proof. Đây là account định danh, không phải token NFT SPL/Metaplex.
Tên, rarity và ảnh hiển thị lấy từ catalog off-chain theo faction ID.

Frontend và backend dùng cùng seed/layout. Frontend đọc program ID từ
`GET /blockchain/solana/config`, xác nhận RPC đúng cluster, ví ký transaction,
chờ `finalized` rồi gọi `POST /players/{wallet}/faction`.
Nếu đã mint nhưng đăng ký API bị lỗi, lần thử lại đọc proof và lịch sử transaction để đăng ký lại.
Backend xác minh transaction thành công cùng proof đúng chủ program/discriminator/wallet/faction.

## Reward, advisor, trading

Thưởng hiện tại là SOL Devnet: backend ký chuyển SOL từ ví phân phối riêng cho trận thắng/nhiệm vụ đủ điều kiện. Giao dịch có memo claim ID, được lưu trước khi gửi và đối soát theo chữ ký, người nhận và số lượng. Cấu hình và nạp ví phân phối theo [DeFi](defi.md). Marketplace/P2P vẫn trả 503 cho thao tác ghi đến khi có escrow.

## Cấu hình / deploy

`backend/.env.example` và `frontend/.env.example` chỉ chứa public configuration.
RPC backend có thể chứa credential riêng nên API config không trả RPC URL ra frontend.
`SOLANA_PROGRAM_ID` phải là public ID của program đã deploy, không phải System Program.

```sh
bash scripts/deploy-solana.sh devnet
```

Anchor/Solana CLI phải cài sẵn. Script không tự faucet, không thay ví người chơi.
Deployment Devnet hiện tại dùng program `8qUBTgX99v5EhxbAaxuqS94rgfRhnLrTgW66Gh9BvLKN`.
Khi upgrade hoặc đổi program, cập nhật `SOLANA_PROGRAM_ID` và restart backend. Proof account ngẫu nhiên của bản prototype cũ không tự trở thành PDA.

## Kiểm thử

```sh
cd backend
python -m pytest -q
# Shell khác, từ repo:
cd frontend
npm test
npm run build
# Khi có Anchor và local validator:
cd blockchain/solana
anchor test --provider.cluster localnet
```

`bash scripts/test-solana-localnet.sh` build program, preload SBF vào local validator và kiểm tra faction end-to-end. Unit test không gửi giao dịch public network.


## Dữ liệu lịch sử

Các claim cũ được giữ bằng mã sự kiện và nhãn `LEGACY` để tránh phát SOL lần nữa. Các giao dịch đã ghi trên Solana không thể xóa khỏi chuỗi.
