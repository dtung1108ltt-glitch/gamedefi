# Mainnet release

Mainnet has not been released. The live application trades test SOL against test USDC and USDT on Devnet. Rewards are also Devnet SOL only.

A separate Mainnet release requires a production RPC, PostgreSQL with migrations, a verified upgrade authority, a Jupiter API key and small SOL/USDC swap tests in both directions. Mainnet DEX stays closed until `DEX_MAINNET_ENABLED=true`. Run `python scripts/check-mainnet-readiness.py` and verify the resulting transactions on Solana Explorer before enabling it.

The current backend rejects Mainnet reward claims. A Mainnet reward funding and authorization design must be implemented and reviewed before enabling real payouts.
