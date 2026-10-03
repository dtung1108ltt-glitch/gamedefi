import { Connection, PublicKey, SystemProgram, Transaction, TransactionInstruction, VersionedTransaction } from '@solana/web3.js';
import { Buffer } from 'buffer';
import bs58 from 'bs58';
import { encodeMintFaction, factionAddress, readFactionProof } from './solanaProtocol';
import { normalizeError } from './api';

export const SOLANA_NETWORK = import.meta.env?.VITE_SOLANA_NETWORK || 'devnet';
export const SOLANA_RPC_URL = import.meta.env?.VITE_SOLANA_RPC_URL || 'https://api.devnet.solana.com';
const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

interface WalletProvider {
  publicKey?: PublicKey;
  connect(): Promise<{ publicKey: PublicKey }>;
  signMessage(message: Uint8Array, encoding?: string): Promise<{ signature: Uint8Array }>;
  signTransaction<T extends Transaction | VersionedTransaction>(transaction: T): Promise<T>;
  disconnect?(): Promise<void>;
}

function provider(): WalletProvider {
  const win = window as unknown as { phantom?: { solana?: WalletProvider }; solana?: WalletProvider; solflare?: WalletProvider };
  const wallet = win.phantom?.solana || win.solana || win.solflare;
  if (!wallet) throw new Error('Hãy cài Phantom hoặc Solflare để kết nối Solana.');
  return wallet;
}

export interface SolanaConfig {
  chain: string;
  network: string;
  program_id: string;
  configured: boolean;
  program_deployed: boolean;
  error_code: 'NOT_CONFIGURED' | 'INVALID_PROGRAM_ID' | 'PROGRAM_NOT_DEPLOYED' | 'RPC_UNREACHABLE' | null;
  message: string;
}

export const SOLANA_CONFIG_MESSAGES: Record<string, string> = {
  NOT_CONFIGURED: 'Backend chưa cấu hình SOLANA_PROGRAM_ID (kiểm tra backend/.env)',
  INVALID_PROGRAM_ID: 'SOLANA_PROGRAM_ID sai định dạng',
  PROGRAM_NOT_DEPLOYED: 'Program chưa deploy trên devnet',
  RPC_UNREACHABLE: 'Không kết nối được Solana RPC, thử lại sau',
  API_UNREACHABLE: 'Không kết nối được backend',
  NETWORK_MISMATCH: 'Ví sai network: Frontend và backend đang dùng khác mạng Solana.',
};

export async function fetchSolanaConfig(): Promise<SolanaConfig> {
  let response: Response;
  try {
    response = await fetch(`${API_URL}/blockchain/solana/config`);
  } catch {
    throw Object.assign(new Error(SOLANA_CONFIG_MESSAGES.API_UNREACHABLE), { error_code: 'API_UNREACHABLE' });
  }
  if (!response.ok) throw Object.assign(new Error('Không đọc được cấu hình Solana từ backend.'), { error_code: 'API_UNREACHABLE' });
  let config: SolanaConfig;
  try {
    config = await response.json();
  } catch {
    throw Object.assign(new Error(SOLANA_CONFIG_MESSAGES.API_UNREACHABLE), { error_code: 'API_UNREACHABLE' });
  }
  return config;
}

export function solanaConfigErrorMessage(config: SolanaConfig): string | null {
  // Field BE snake_case: program_id, program_deployed, error_code, configured.
  if (config.network !== SOLANA_NETWORK) return SOLANA_CONFIG_MESSAGES.NETWORK_MISMATCH;
  if (config.error_code === 'NOT_CONFIGURED') return SOLANA_CONFIG_MESSAGES.NOT_CONFIGURED;
  if (config.error_code === 'INVALID_PROGRAM_ID') return SOLANA_CONFIG_MESSAGES.INVALID_PROGRAM_ID;
  if (config.error_code === 'PROGRAM_NOT_DEPLOYED')
    return `Program chưa deploy trên ${config.network || SOLANA_NETWORK}`;
  if (config.error_code === 'RPC_UNREACHABLE') return SOLANA_CONFIG_MESSAGES.RPC_UNREACHABLE;
  if (!config.configured || !config.program_id) return SOLANA_CONFIG_MESSAGES.NOT_CONFIGURED;
  if (!config.program_deployed) return `Program chưa deploy trên ${config.network || SOLANA_NETWORK}`;
  return null;
}

async function solanaConnection(): Promise<{ connection: Connection; program: PublicKey }> {
  const config = await fetchSolanaConfig();
  const configError = solanaConfigErrorMessage(config);
  if (configError) {
    throw Object.assign(new Error(configError), { error_code: config.error_code || 'NOT_CONFIGURED' });
  }
  let program: PublicKey;
  try {
    program = new PublicKey(config.program_id);
  } catch {
    throw Object.assign(new Error(SOLANA_CONFIG_MESSAGES.INVALID_PROGRAM_ID), { error_code: 'INVALID_PROGRAM_ID' });
  }
  if (program.equals(SystemProgram.programId))
    throw Object.assign(new Error(SOLANA_CONFIG_MESSAGES.INVALID_PROGRAM_ID), { error_code: 'INVALID_PROGRAM_ID' });
  const connection = new Connection(SOLANA_RPC_URL, 'finalized');
  const genesis: Record<string, string> = {
    devnet: 'EtWTRABZaYq6iMfeYKouRu166VU2xqa1wcaWoxPkrZBG',
    testnet: '4uhcVJyU9pJkvQyS88uRDiswHXSCkY3zQawwpjk2NsNY',
    'mainnet-beta': '5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp',
  };
  if (!(SOLANA_NETWORK in genesis) && SOLANA_NETWORK !== 'localnet') throw new Error('Mạng Solana không hợp lệ.');
  let genesisHash: string;
  try {
    genesisHash = await connection.getGenesisHash();
  } catch {
    throw new Error('Không gọi được RPC Solana (devnet timeout/rate-limit 429 hoặc sai VITE_SOLANA_RPC_URL).');
  }
  if (genesis[SOLANA_NETWORK] && genesisHash !== genesis[SOLANA_NETWORK]) {
    throw Object.assign(new Error('Ví sai network: RPC frontend không khớp mạng Solana đã chọn. Hãy chuyển ví (Phantom/Solflare) sang devnet.'), { error_code: 'NETWORK_MISMATCH' });
  }
  let programAccount;
  try {
    programAccount = await connection.getAccountInfo(program);
  } catch {
    throw new Error('Không gọi được RPC Solana (devnet timeout/rate-limit 429 hoặc sai VITE_SOLANA_RPC_URL).');
  }
  if (!programAccount?.executable)
    throw Object.assign(new Error(`Program chưa deploy trên ${SOLANA_NETWORK}`), { error_code: 'PROGRAM_NOT_DEPLOYED' });
  // Kiểm tra số dư SOL đủ trả phí trước khi mint.
  return { connection, program };
}

export async function checkMintBalance(walletAddress: string): Promise<void> {
  const connection = new Connection(SOLANA_RPC_URL, 'finalized');
  let balance: number;
  try {
    balance = await connection.getBalance(new PublicKey(walletAddress));
  } catch {
    throw new Error(SOLANA_CONFIG_MESSAGES.RPC_UNREACHABLE);
  }
  // ~0.005 SOL phí mint + rent PDA; ngưỡng an toàn 0.01 SOL.
  if (balance < 10_000_000) {
    throw Object.assign(
      new Error('Ví thiếu SOL devnet để trả phí mint. Nạp tại https://faucet.solana.com rồi thử lại.'),
      { error_code: 'INSUFFICIENT_SOL' },
    );
  }
}

export const solanaAdapter = {
  existingFactionProof: async (expectedWallet: string): Promise<{ factionId: number; tx_digest: string; nft_object_id: string } | null> => {
    const wallet = provider();
    const owner = (await wallet.connect()).publicKey;
    if (owner.toBase58() !== expectedWallet) throw new Error('Ví đã đổi tài khoản. Hãy đăng nhập lại.');
    const { connection, program } = await solanaConnection();
    const proof = factionAddress(owner, program);
    const existing = await connection.getAccountInfo(proof);
    if (!existing || !existing.owner.equals(program)) return null;
    const reference = await readFactionProof(existing.data, owner);
    if (reference === null) return null;
    const history = await connection.getSignaturesForAddress(proof, { limit: 20 });
    const confirmed = history.find(tx => !tx.err && tx.confirmationStatus === 'finalized');
    if (!confirmed) return null;
    return { factionId: reference, tx_digest: confirmed.signature, nft_object_id: proof.toBase58() };
  },
  isAvailable: () => {
    if (typeof window === 'undefined') return false;
    try { provider(); return true; } catch { return false; }
  },
  connect: async (): Promise<string> => (await provider().connect()).publicKey.toBase58(),
  signMessage: async (message: string): Promise<string> => {
    const signed = await provider().signMessage(new TextEncoder().encode(message), 'utf8');
    return bs58.encode(signed.signature);
  },
  signDexTransaction: async (transactionBase64: string, expectedWallet: string): Promise<string> => {
    const wallet = provider();
    const owner = wallet.publicKey ?? (await wallet.connect()).publicKey;
    if (owner.toBase58() !== expectedWallet) throw new Error('Ví đã đổi tài khoản. Hãy đăng nhập lại.');
    let transaction: Transaction | VersionedTransaction;
    try {
      const bytes = Buffer.from(transactionBase64, 'base64');
      try {
        transaction = Transaction.from(bytes);
      } catch {
        transaction = VersionedTransaction.deserialize(bytes);
      }
    } catch {
      throw new Error('DEX trả transaction không hợp lệ.');
    }
    const feePayer = transaction instanceof Transaction
      ? transaction.feePayer : transaction.message.staticAccountKeys[0];
    if (!feePayer?.equals(owner)) throw new Error('Ví ký không phải fee payer của giao dịch DEX.');
    let signed: Transaction | VersionedTransaction;
    try {
      signed = await wallet.signTransaction(transaction);
    } catch (reason) {
      const walletError = reason as { code?: unknown; message?: unknown } | null;
      const message = typeof walletError?.message === 'string' ? walletError.message : String(reason);
      const code = typeof walletError?.code === 'number' || typeof walletError?.code === 'string'
        ? ` (mã ${walletError.code})` : '';
      if (/unexpected error/i.test(message)) {
        throw new Error(`Phantom từ chối ký giao dịch${code}: ${message}.`);
      }
      // Ví có thể reject bằng giá trị không phải Error (thậm chí `undefined`).
      throw normalizeError(reason, 'Ví từ chối ký giao dịch.');
    }
    return Buffer.from(signed.serialize()).toString('base64');
  },
  mintFactionNft: async (factionId: number, expectedWallet: string): Promise<{ tx_digest: string; nft_object_id: string }> => {
    const wallet = provider();
    const owner = (await wallet.connect()).publicKey;
    if (owner.toBase58() !== expectedWallet) throw new Error('Ví đã đổi tài khoản. Hãy đăng nhập lại.');
    const { connection, program } = await solanaConnection();
    const proof = factionAddress(owner, program);
    const existing = await connection.getAccountInfo(proof);
    if (existing) {
      const reference = await readFactionProof(existing.data, owner);
      if (existing.owner.equals(program) && reference === factionId) {
        // Trường hợp (a): ví đã có đúng faction đang chọn — trả về lịch sử mint để khôi phục đăng ký.
        const history = await connection.getSignaturesForAddress(proof, { limit: 20 });
        const confirmed = history.find(tx => !tx.err && tx.confirmationStatus === 'finalized');
        if (!confirmed) throw new Error('Ấn tín đã tồn tại; hãy thử lại sau khi RPC đồng bộ lịch sử.');
        return { tx_digest: confirmed.signature, nft_object_id: proof.toBase58() };
      }
      if (existing.owner.equals(program) && reference !== null) {
        // Trường hợp (b): ví đã có faction khác.
        throw new Error(`Ví này đã chọn faction khác (faction #${reference}). Mỗi ví chỉ giữ một ấn tín faction.`);
      }
      // Trường hợp (c): account tồn tại nhưng dữ liệu/chủ sở hữu không hợp lệ.
      throw new Error('Account ấn tín on-chain không hợp lệ (sai owner program hoặc dữ liệu faction hỏng).');
    }
    const blockhash = await connection.getLatestBlockhash();
    const transaction = new Transaction({ feePayer: owner, ...blockhash }).add(new TransactionInstruction({
      programId: program,
      keys: [
        { pubkey: proof, isSigner: false, isWritable: true },
        { pubkey: owner, isSigner: true, isWritable: true },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      ],
      data: Buffer.from(await encodeMintFaction(factionId)),
    }));
    const signed = await wallet.signTransaction(transaction);
    const digest = await connection.sendRawTransaction(signed.serialize(), { skipPreflight: false });
    const confirmation = await connection.confirmTransaction({ signature: digest, ...blockhash }, 'finalized');
    if (confirmation.value.err) throw new Error(`Giao dịch Solana thất bại: ${digest}`);
    return { tx_digest: digest, nft_object_id: proof.toBase58() };
  },
};
