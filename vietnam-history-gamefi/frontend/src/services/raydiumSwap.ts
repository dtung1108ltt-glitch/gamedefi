import { Connection, PublicKey, VersionedTransaction } from '@solana/web3.js';
import { Buffer } from 'buffer';
import BN from 'bn.js';
import { CurveCalculator, DEV_API_URLS, FeeOn, Raydium, TxVersion } from '@raydium-io/raydium-sdk-v2';
import type { DexOrder } from '../types/dex';
import { SOLANA_NETWORK, SOLANA_RPC_URL } from './solana';

const PROGRAM_ID = import.meta.env?.VITE_RAYDIUM_CPMM_PROGRAM_ID?.trim()
  || 'DRaycpLY18LhpbydsBWbVJtxpNv9oXPgjRSfpF2bWpYb';
const WSOL_MINT = 'So11111111111111111111111111111111111111112';
const DEVNET_POOLS = {
  USDC: {
    pool: 'FeRts7d5DfXKXq1hGMkeiGEHayDdjsmSyJ41rHVcKo8t',
    mint: '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU',
  },
  USDT: {
    pool: 'Bw9gaeKqQy5aTpi1BiSdV2p21REATtVXDdhjPUFjgq6N',
    mint: '9jWfcfEZToquBQmkoEViNSCt72veXwcvRGFQERXRjEk1',
  },
} as const;
const DEVNET_GENESIS = 'EtWTRABZaYq6iMfeYKouRu166VU2xqa1wcaWoxPkrZBG';

export async function buildRaydiumSwapTransaction(
  order: DexOrder,
  expectedWallet: string,
): Promise<string> {
  if (SOLANA_NETWORK !== 'devnet' || order.provider !== 'raydium') {
    throw new Error('Lệnh này không thuộc Raydium Devnet.');
  }
  const otherSymbol = order.input_symbol === 'SOL' ? order.output_symbol : order.input_symbol;
  const pair = DEVNET_POOLS[otherSymbol as keyof typeof DEVNET_POOLS];
  if (!pair || ![order.input_symbol, order.output_symbol].includes('SOL') || order.router !== pair.pool) {
    throw new Error('Báo giá không khớp cặp SOL/USDC hoặc SOL/USDT thử.');
  }

  const owner = new PublicKey(expectedWallet);
  const connection = new Connection(SOLANA_RPC_URL, 'confirmed');
  if (await connection.getGenesisHash() !== DEVNET_GENESIS) {
    throw new Error('RPC frontend không phải Solana Devnet.');
  }
  const raydium = await Raydium.load({
    owner,
    connection,
    cluster: 'devnet',
    disableFeatureCheck: true,
    disableLoadToken: true,
    blockhashCommitment: 'confirmed',
    urlConfigs: DEV_API_URLS,
  });
  const { poolInfo, poolKeys, rpcData } = await raydium.cpmm.getPoolInfoFromRpc(pair.pool);
  if (poolInfo.programId !== PROGRAM_ID || poolInfo.id !== pair.pool) {
    throw new Error('Program hoặc pool Raydium không khớp cấu hình.');
  }
  if (new Set([poolInfo.mintA.address, poolInfo.mintB.address]).size !== 2
      || ![WSOL_MINT, pair.mint].every((mint) => [poolInfo.mintA.address, poolInfo.mintB.address].includes(mint))) {
    throw new Error('Pool Raydium không chứa đúng mint SOL/token đã chọn.');
  }

  const inputMint = order.input_symbol === 'SOL' ? WSOL_MINT : pair.mint;
  const baseIn = inputMint === poolInfo.mintA.address;
  const inputAmount = new BN(order.in_amount);
  const creatorFeeOnInput = rpcData.feeOn === FeeOn.BothToken || rpcData.feeOn === FeeOn.OnlyTokenB;
  const swapResult = CurveCalculator.swapBaseInput(
    inputAmount,
    baseIn ? rpcData.baseReserve : rpcData.quoteReserve,
    baseIn ? rpcData.quoteReserve : rpcData.baseReserve,
    rpcData.configInfo!.tradeFeeRate,
    rpcData.configInfo!.creatorFeeRate,
    rpcData.configInfo!.protocolFeeRate,
    rpcData.configInfo!.fundFeeRate,
    creatorFeeOnInput,
  );
  const quotedMinimum = new BN(order.out_amount)
    .mul(new BN(10_000 - order.slippage_bps))
    .div(new BN(10_000));
  if (swapResult.outputAmount.lt(quotedMinimum)) {
    throw new Error('Giá pool đã thay đổi quá slippage; hãy lấy báo giá mới.');
  }
  const transactionSlippageBps = swapResult.outputAmount
    .sub(quotedMinimum)
    .mul(new BN(10_000))
    .div(swapResult.outputAmount)
    .toNumber();

  const built = await raydium.cpmm.swap({
    poolInfo,
    poolKeys,
    inputAmount,
    swapResult,
    slippage: transactionSlippageBps / 10_000,
    baseIn,
    txVersion: TxVersion.V0,
  });
  if (!(built.transaction instanceof VersionedTransaction)) {
    throw new Error('Raydium không tạo versioned transaction hợp lệ.');
  }
  const staticKeys = built.transaction.message.staticAccountKeys.map((key) => key.toBase58());
  if (!staticKeys.includes(PROGRAM_ID) || !staticKeys.includes(pair.pool) || staticKeys[0] !== expectedWallet) {
    throw new Error('Giao dịch Raydium không khớp ví hoặc pool đã chọn.');
  }
  // Phantom may report only "Unexpected error" for a transaction that cannot run.
  // Simulate against the same Devnet RPC used to build it before opening the wallet.
  const simulation = await connection.simulateTransaction(built.transaction, {
    commitment: 'confirmed',
    sigVerify: false,
  });
  if (simulation.value.err) {
    const programError = simulation.value.logs?.filter((line) =>
      line.startsWith('Program log: Error:') || line.includes('failed:')).pop();
    const detail = programError || JSON.stringify(simulation.value.err);
    throw new Error(`Giao dịch không qua mô phỏng Devnet: ${detail}. Hãy lấy báo giá mới và kiểm tra số dư SOL để trả phí.`);
  }
  return Buffer.from(built.transaction.serialize()).toString('base64');
}
