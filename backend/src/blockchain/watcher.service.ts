import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { EvmAdapter } from './adapters/evm.adapter';
import { BitcoinAdapter } from './adapters/bitcoin.adapter';
import { SolanaAdapter } from './adapters/solana.adapter';
import { TronAdapter } from './adapters/tron.adapter';
import { UtxoAdapter } from './adapters/utxo.adapter';
import { ChainAdapter } from './adapters/chain-adapter.interface';

@Injectable()
export class WatcherService implements OnModuleInit {
  private readonly logger = new Logger('WatcherService');
  private running = false;
  private adapters: Map<string, ChainAdapter> = new Map();

  // Default RPC endpoints (overridden by DB config)
  private readonly DEFAULT_RPCS: Record<string, string> = {
    eth: 'https://eth.llamarpc.com',
    bsc: 'https://bsc-dataseed1.binance.org',
    polygon: 'https://polygon-rpc.com',
    arbitrum: 'https://arb1.arbitrum.io/rpc',
    optimism: 'https://mainnet.optimism.io',
    avax: 'https://api.avax.network/ext/bc/C/rpc',
    fantom: 'https://rpc.ftm.tools',
    base: 'https://mainnet.base.org',
    solana: 'https://api.mainnet-beta.solana.com',
    tron: 'https://api.trongrid.io',
  };

  constructor(private prisma: PrismaService) {}

  async onModuleInit() {
    await this.initializeAdapters();
    if (process.env.ENABLE_WATCHER === 'true') {
      this.start();
    }
  }

  /** Initialize chain adapters from DB config + defaults */
  private async initializeAdapters() {
    try {
      const configs = await this.prisma.chainConfig.findMany({
        where: { enabled: true },
        include: { rpc_endpoints: { where: { status: 'healthy' }, orderBy: { priority: 'asc' } } },
      });

      for (const config of configs) {
        const rpcUrl = config.rpc_endpoints[0]?.url || this.DEFAULT_RPCS[config.chain] || '';
        if (!rpcUrl) continue;

        const adapter = this.createAdapter(config.chain, rpcUrl);
        if (adapter) {
          this.adapters.set(config.chain, adapter);
        }
      }

      // Add defaults for any chains not in DB
      for (const [chain, rpcUrl] of Object.entries(this.DEFAULT_RPCS)) {
        if (!this.adapters.has(chain)) {
          const adapter = this.createAdapter(chain, rpcUrl);
          if (adapter) this.adapters.set(chain, adapter);
        }
      }

      this.logger.log(`Initialized ${this.adapters.size} chain adapters`);
    } catch (err) {
      this.logger.warn('Failed to initialize adapters from DB, using defaults');
      for (const [chain, rpcUrl] of Object.entries(this.DEFAULT_RPCS)) {
        const adapter = this.createAdapter(chain, rpcUrl);
        if (adapter) this.adapters.set(chain, adapter);
      }
    }
  }

  /** Create a chain adapter based on chain type */
  private createAdapter(chain: string, rpcUrl: string): ChainAdapter | null {
    const evmChains = ['eth', 'bsc', 'polygon', 'arbitrum', 'optimism', 'avax', 'fantom', 'base'];

    if (evmChains.includes(chain)) return new EvmAdapter(chain, rpcUrl);
    if (chain === 'btc') return new BitcoinAdapter();
    if (chain === 'solana') return new SolanaAdapter(rpcUrl);
    if (chain === 'tron') return new TronAdapter(rpcUrl);
    if (['ltc', 'doge'].includes(chain)) return new UtxoAdapter(chain, rpcUrl);

    return null;
  }

  private async start() {
    this.running = true;
    this.logger.log('Blockchain watcher started');

    while (this.running) {
      try {
        const chains = await this.prisma.chainConfig.findMany({ where: { enabled: true } });

        for (const chain of chains) {
          await this.processChain(chain.chain);
        }
      } catch (err) {
        this.logger.error('Watcher error', err);
      }

      // Poll interval
      await new Promise((r) => setTimeout(r, 10_000));
    }
  }

  private async processChain(chain: string) {
    const adapter = this.adapters.get(chain);
    if (!adapter) return;

    const checkpoint = await this.prisma.watcherCheckpoint.findUnique({ where: { chain } });
    if (!checkpoint) return;

    try {
      const latestBlock = await adapter.getLatestBlock();
      if (latestBlock <= checkpoint.current_block) return;

      // Get monitored addresses for this chain
      const addresses = await this.prisma.walletDepositAddress.findMany({
        where: { chain },
        select: { address: true },
      });

      if (!addresses.length) {
        // Just update checkpoint
        await this.prisma.watcherCheckpoint.update({
          where: { chain },
          data: { latest_block: latestBlock, lag: latestBlock - checkpoint.current_block },
        });
        return;
      }

      const monitoredAddresses = addresses.map(a => a.address);
      const fromBlock = checkpoint.current_block + 1;
      const toBlock = Math.min(fromBlock + 100, latestBlock); // Process max 100 blocks at a time

      const txs = await adapter.getTransactions(fromBlock, toBlock, monitoredAddresses);

      // Process detected transactions
      for (const tx of txs) {
        await this.processDetectedTx(chain, tx);
      }

      // Update checkpoint
      await this.prisma.watcherCheckpoint.update({
        where: { chain },
        data: {
          current_block: toBlock,
          latest_block: latestBlock,
          lag: latestBlock - toBlock,
        },
      });

      if (txs.length) {
        this.logger.log(`Detected ${txs.length} transactions on ${chain} (blocks ${fromBlock}-${toBlock})`);
      }
    } catch (err) {
      this.logger.warn(`Failed to process ${chain}: ${(err as Error).message}`);
    }
  }

  /** Process a detected incoming transaction */
  private async processDetectedTx(chain: string, tx: any) {
    try {
      // Find associated wallet
      const depositAddr = await this.prisma.walletDepositAddress.findFirst({
        where: { chain, address: tx.address },
      });

      if (!depositAddr?.wallet_id) return;

      // Create wallet transaction record
      await this.prisma.walletTransaction.create({
        data: {
          wallet_id: depositAddr.wallet_id,
          chain,
          asset: tx.asset || chain.toUpperCase(),
          direction: 'receive',
          amount: tx.amount,
          to_address: tx.address,
          from_address: '',
          status: 'pending',
          tx_hash: tx.txHash,
        },
      });

      this.logger.log(`Detected incoming tx ${tx.txHash} on ${chain} for ${tx.amount}`);
    } catch (err) {
      // Duplicate tx_hash is expected on re-scans
      this.logger.debug(`Skip duplicate tx: ${tx.txHash}`);
    }
  }

  /** Get adapter for external use */
  getAdapter(chain: string): ChainAdapter | undefined {
    return this.adapters.get(chain);
  }

  stop() {
    this.running = false;
  }
}
