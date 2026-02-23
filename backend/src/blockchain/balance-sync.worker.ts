import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { MarketService } from '../market/market.service';

/**
 * Balance Sync Worker: Periodically syncs on-chain balances for all wallets.
 * Queries blockchain RPCs for real balances and updates WalletBalance + WalletConfig records.
 * In production, uses chain-specific adapters for balance queries.
 */
@Injectable()
export class BalanceSyncWorker implements OnModuleInit {
  private readonly logger = new Logger('BalanceSyncWorker');
  private running = false;

  // Chain-to-RPC mapping (defaults; overridden by DB ChainConfig)
  private readonly DEFAULT_RPCS: Record<string, string> = {
    eth: 'https://eth.llamarpc.com',
    bsc: 'https://bsc-dataseed1.binance.org',
    polygon: 'https://polygon-rpc.com',
    arbitrum: 'https://arb1.arbitrum.io/rpc',
    optimism: 'https://mainnet.optimism.io',
    avax: 'https://api.avax.network/ext/bc/C/rpc',
    fantom: 'https://rpc.ftm.tools',
    base: 'https://mainnet.base.org',
  };

  // Native asset info per chain
  private readonly CHAIN_ASSETS: Record<string, { symbol: string; name: string; decimals: number }> = {
    btc: { symbol: 'BTC', name: 'Bitcoin', decimals: 8 },
    eth: { symbol: 'ETH', name: 'Ethereum', decimals: 18 },
    bsc: { symbol: 'BNB', name: 'BNB', decimals: 18 },
    polygon: { symbol: 'MATIC', name: 'Polygon', decimals: 18 },
    solana: { symbol: 'SOL', name: 'Solana', decimals: 9 },
    tron: { symbol: 'TRX', name: 'TRON', decimals: 6 },
    arbitrum: { symbol: 'ETH', name: 'Ethereum (Arb)', decimals: 18 },
    optimism: { symbol: 'ETH', name: 'Ethereum (OP)', decimals: 18 },
    ltc: { symbol: 'LTC', name: 'Litecoin', decimals: 8 },
    doge: { symbol: 'DOGE', name: 'Dogecoin', decimals: 8 },
    avax: { symbol: 'AVAX', name: 'Avalanche', decimals: 18 },
    fantom: { symbol: 'FTM', name: 'Fantom', decimals: 18 },
    base: { symbol: 'ETH', name: 'Ethereum (Base)', decimals: 18 },
  };

  constructor(
    private prisma: PrismaService,
    private market: MarketService,
  ) {}

  onModuleInit() {
    if (process.env.ENABLE_BALANCE_SYNC !== 'false') {
      this.start();
    }
  }

  private async start() {
    this.running = true;
    this.logger.log('Balance sync worker started');

    // Initial sync after 10s
    setTimeout(() => this.syncAll(), 10_000);

    // Periodic sync every 60s
    setInterval(() => {
      if (this.running) this.syncAll();
    }, 60_000);
  }

  /** Sync balances for all active wallets */
  async syncAll() {
    try {
      const wallets = await this.prisma.walletConfig.findMany({
        where: { status: 'active' },
      });

      if (!wallets.length) return;

      const tickers = await this.market.getTickers();
      const priceMap = new Map(tickers.map((t: any) => [t.symbol, t]));

      let synced = 0;
      for (const wallet of wallets) {
        try {
          await this.syncWallet(wallet, priceMap);
          synced++;
        } catch (err) {
          this.logger.warn(`Failed to sync wallet ${wallet.id} (${wallet.chain}): ${(err as Error).message}`);
        }
      }

      this.logger.debug(`Synced ${synced}/${wallets.length} wallets`);
    } catch (err) {
      this.logger.error('Balance sync failed', err);
    }
  }

  /** Sync a single wallet's balance */
  private async syncWallet(wallet: any, priceMap: Map<string, any>) {
    const chainAsset = this.CHAIN_ASSETS[wallet.chain];
    if (!chainAsset) return;

    // Fetch on-chain balance
    const balance = await this.fetchBalance(wallet.chain, wallet.address);
    if (balance === null) return;

    const ticker = priceMap.get(chainAsset.symbol);
    const priceUsd = ticker?.price_usd ?? 0;
    const change24h = ticker?.change_24h ?? 0;
    const balanceUsd = balance * priceUsd;

    // Upsert WalletBalance record
    await this.prisma.walletBalance.upsert({
      where: {
        wallet_id_chain_symbol: {
          wallet_id: wallet.id,
          chain: wallet.chain,
          symbol: chainAsset.symbol,
        },
      },
      create: {
        wallet_id: wallet.id,
        chain: wallet.chain,
        asset: chainAsset.symbol,
        symbol: chainAsset.symbol,
        name: chainAsset.name,
        balance: balance.toFixed(8),
        balance_usd: balanceUsd,
        price_usd: priceUsd,
        change_24h: change24h,
      },
      update: {
        balance: balance.toFixed(8),
        balance_usd: balanceUsd,
        price_usd: priceUsd,
        change_24h: change24h,
      },
    });

    // Update WalletConfig balance
    await this.prisma.walletConfig.update({
      where: { id: wallet.id },
      data: {
        balance: balance.toFixed(8),
        balance_usd: balanceUsd,
      },
    });
  }

  /** Fetch on-chain balance for an address */
  private async fetchBalance(chain: string, address: string): Promise<number | null> {
    try {
      // EVM chains: eth_getBalance
      if (this.DEFAULT_RPCS[chain]) {
        return this.fetchEvmBalance(chain, address);
      }

      // Solana
      if (chain === 'solana') {
        return this.fetchSolanaBalance(address);
      }

      // TRON
      if (chain === 'tron') {
        return this.fetchTronBalance(address);
      }

      // BTC/LTC/DOGE: use Blockchair API (free tier)
      if (['btc', 'ltc', 'doge'].includes(chain)) {
        return this.fetchUtxoBalance(chain, address);
      }

      return null;
    } catch (err) {
      this.logger.debug(`Balance fetch failed for ${chain}:${address}: ${(err as Error).message}`);
      return null;
    }
  }

  /** EVM balance via eth_getBalance */
  private async fetchEvmBalance(chain: string, address: string): Promise<number | null> {
    const rpcUrl = this.DEFAULT_RPCS[chain];
    if (!rpcUrl) return null;

    const res = await fetch(rpcUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'eth_getBalance',
        params: [address, 'latest'],
      }),
    });

    const data = await res.json();
    if (!data.result) return null;

    const wei = BigInt(data.result);
    return Number(wei) / 1e18;
  }

  /** Solana balance via getBalance */
  private async fetchSolanaBalance(address: string): Promise<number | null> {
    const rpcUrl = process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com';

    const res = await fetch(rpcUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'getBalance',
        params: [address],
      }),
    });

    const data = await res.json();
    if (!data.result) return null;

    return data.result.value / 1e9; // lamports to SOL
  }

  /** TRON balance via TronGrid */
  private async fetchTronBalance(address: string): Promise<number | null> {
    const apiUrl = process.env.TRON_API_URL || 'https://api.trongrid.io';

    const res = await fetch(`${apiUrl}/v1/accounts/${address}`, {
      headers: { 'Accept': 'application/json' },
    });

    const data = await res.json();
    if (!data.data?.[0]) return null;

    return (data.data[0].balance || 0) / 1e6; // sun to TRX
  }

  /** UTXO balance via Blockchair API */
  private async fetchUtxoBalance(chain: string, address: string): Promise<number | null> {
    const chainMap: Record<string, string> = {
      btc: 'bitcoin',
      ltc: 'litecoin',
      doge: 'dogecoin',
    };

    const chainName = chainMap[chain];
    if (!chainName) return null;

    const res = await fetch(`https://api.blockchair.com/${chainName}/dashboards/address/${address}?limit=0`);
    const data = await res.json();

    const addressData = data.data?.[address];
    if (!addressData) return null;

    const satoshis = addressData.address?.balance || 0;
    return satoshis / 1e8;
  }

  stop() {
    this.running = false;
  }
}
