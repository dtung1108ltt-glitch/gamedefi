# Triển khai ứng dụng Devnet

`render.yaml` ở gốc repository cấu hình web service và PostgreSQL trên Render. Web service build frontend cùng API; các migration được áp dụng khi khởi động.

1. Đặt `SOL_REWARD_SIGNER_ADDRESS` là public key của ví thưởng SOL Devnet. Đặt `SOL_REWARD_SIGNER_KEYPAIR_BASE64` trực tiếp trong Render Secret Environment, không đưa khóa vào Git hoặc chat.
2. Nạp SOL Devnet vào ví thưởng. Kiểm tra `GET /api/blockchain/solana/reward-wallet` trả `configured: true` và `active: true`.
3. Redeploy web service. Kiểm tra `GET /api/health/ready` và `GET /api/dex/config`. DEX chỉ có SOL/USDC thử và SOL/USDT thử.
4. Dùng ví thử trên Devnet kiểm tra đăng nhập, một claim nhỏ và một swap nhỏ. Đối chiếu chữ ký trên Solana Explorer.

PostgreSQL lưu swap intent và reward claim. Player, session và battle detail còn ở RAM nên phiên hiện tại sẽ mất khi redeploy. Render free service có thể ngủ khi không có truy cập; chọn database có backup nếu cần lưu lịch sử lâu dài.
