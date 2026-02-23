import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { SignerService } from '../signer/signer.service';
import { KeyManagerService } from '../signer/key-manager.service';
import { MarketService } from '../market/market.service';
import { SwapService } from '../swap/swap.service';

@Injectable()
export class WalletsService {
  private readonly logger = new Logger('WalletsService');

  constructor(
    private prisma: PrismaService,
    private signer: SignerService,
    private keyManager: KeyManagerService,
    private market: MarketService,
    private swap: SwapService,
  ) {}

  // ── List wallets ──
  list(merchantId: string) {
    return this.prisma.walletConfig.findMany({
      where: { merchant_id: merchantId },
      orderBy: { created_at: 'desc' },
    });
  }

  // ── Add wallet (import or generate) ──
  async add(merchantId: string, data: any) {
    let address = data.address;
    let privateKey: string | null = null;

    // If no address provided, generate new real blockchain keypair
    if (!address) {
      const keypair = await this.keyManager.generateKeypair(data.chain);
      address = keypair.address;
      privateKey = keypair.privateKey;
    }

    const wallet = await this.prisma.walletConfig.create({
      data: {
        merchant_id: merchantId,
        label: data.label,
        chain: data.chain,
        address,
        type: data.type || 'hot',
        xpub: data.xpub || null,
        derivation_path: data.derivation_path || null,
        status: 'active',
      },
    });

    // Store encrypted private key if generated
    if (privateKey) {
      await this.keyManager.storeKey(wallet.id, privateKey);
    }

    // Create initial deposit address for this chain
    await this.prisma.walletDepositAddress.upsert({
      where: { merchant_id_chain: { merchant_id: merchantId, chain: data.chain } },
      create: {
        wallet_id: wallet.id,
        merchant_id: merchantId,
        chain: data.chain,
        address,
        min_deposit: this.getMinDeposit(data.chain),
        confirmations_required: this.getConfirmations(data.chain),
        estimated_time: this.getEstimatedTime(data.chain),
      },
      update: {},
    });

    this.logger.log(`Wallet added: ${wallet.id} for merchant ${merchantId}`);
    return wallet;
  }

  // ── Remove wallet ──
  async remove(merchantId: string, id: string) {
    const wallet = await this.prisma.walletConfig.findFirst({ where: { id, merchant_id: merchantId } });
    if (!wallet) throw new NotFoundException();
    await this.keyManager.deleteKey(id);
    await this.prisma.walletBalance.deleteMany({ where: { wallet_id: id } });
    await this.prisma.walletTransaction.deleteMany({ where: { wallet_id: id } });
    await this.prisma.walletConfig.delete({ where: { id } });
  }

  // ── Portfolio aggregation ──
  async portfolio(merchantId: string) {
    const wallets = await this.prisma.walletConfig.findMany({ where: { merchant_id: merchantId } });
    const balances = await this.prisma.walletBalance.findMany({
      where: { wallet: { merchant_id: merchantId } },
    });

    // Update prices from market data
    const tickers = await this.market.getTickers();
    const priceMap = new Map(tickers.map((t: any) => [t.symbol, t]));

    let totalUsd = 0;
    let totalPnl = 0;
    const assets: any[] = [];

    for (const bal of balances) {
      const ticker = priceMap.get(bal.symbol);
      const price = ticker?.price_usd ?? bal.price_usd;
      const change = ticker?.change_24h ?? bal.change_24h;
      const balUsd = parseFloat(bal.balance) * price;
      const pnl = balUsd * (change / 100);

      totalUsd += balUsd;
      totalPnl += pnl;

      assets.push({
        chain: bal.chain,
        symbol: bal.symbol,
        name: bal.name,
        balance: bal.balance,
        balance_usd: balUsd,
        price_usd: price,
        change_24h: change,
        contract_address: bal.contract_address,
      });
    }

    // If no balances yet, return wallet-level data
    if (!assets.length) {
      for (const w of wallets) {
        totalUsd += w.balance_usd;
      }
    }

    const hot = wallets.filter(w => w.type === 'hot');
    const cold = wallets.filter(w => w.type === 'cold');

    return {
      total_balance_usd: totalUsd,
      total_pnl_24h: totalPnl,
      total_pnl_pct: totalUsd > 0 ? (totalPnl / totalUsd) * 100 : 0,
      total_hot_wallets: hot.length,
      total_cold_wallets: cold.length,
      hot_balance_usd: hot.reduce((s, w) => s + w.balance_usd, 0),
      cold_balance_usd: cold.reduce((s, w) => s + w.balance_usd, 0),
      wallets,
      assets,
    };
  }

  // ── Get assets with prices ──
  async assets(merchantId: string) {
    const balances = await this.prisma.walletBalance.findMany({
      where: { wallet: { merchant_id: merchantId } },
    });

    const tickers = await this.market.getTickers();
    const priceMap = new Map(tickers.map((t: any) => [t.symbol, t]));

    return balances.map(bal => {
      const ticker = priceMap.get(bal.symbol);
      return {
        chain: bal.chain,
        symbol: bal.symbol,
        name: bal.name,
        balance: bal.balance,
        balance_usd: parseFloat(bal.balance) * (ticker?.price_usd ?? bal.price_usd),
        price_usd: ticker?.price_usd ?? bal.price_usd,
        change_24h: ticker?.change_24h ?? bal.change_24h,
        contract_address: bal.contract_address,
      };
    });
  }

  // ── Deposit info ──
  async depositInfo(merchantId: string, chain: string) {
    let deposit = await this.prisma.walletDepositAddress.findUnique({
      where: { merchant_id_chain: { merchant_id: merchantId, chain } },
    });

    if (!deposit) {
      // Auto-generate real deposit address for this chain
      const keypair = await this.keyManager.generateKeypair(chain);
      const wallet = await this.prisma.walletConfig.findFirst({
        where: { merchant_id: merchantId, chain },
      });

      deposit = await this.prisma.walletDepositAddress.create({
        data: {
          wallet_id: wallet?.id || null,
          merchant_id: merchantId,
          chain,
          address: keypair.address,
          min_deposit: this.getMinDeposit(chain),
          confirmations_required: this.getConfirmations(chain),
          estimated_time: this.getEstimatedTime(chain),
        },
      });

      // Store the key
      if (wallet) {
        await this.keyManager.storeKey(`deposit_${deposit.id}`, keypair.privateKey);
      }
    }

    return {
      address: deposit.address,
      memo: deposit.memo,
      chain,
      min_deposit: deposit.min_deposit,
      confirmations_required: deposit.confirmations_required,
      estimated_time: deposit.estimated_time,
    };
  }

  // ── Send / Withdraw ──
  async send(merchantId: string, walletId: string, data: { to_address: string; amount: string; memo?: string }) {
    const wallet = await this.prisma.walletConfig.findFirst({ where: { id: walletId, merchant_id: merchantId } });
    if (!wallet) throw new NotFoundException('Wallet not found');
    if (wallet.status !== 'active') throw new BadRequestException('Wallet is not active');

    // Verify sufficient balance
    const balance = parseFloat(wallet.balance);
    const amount = parseFloat(data.amount);
    if (amount <= 0) throw new BadRequestException('Invalid amount');
    if (amount > balance) throw new BadRequestException('Insufficient balance');

    // Sign the transaction
    const signed = await this.signer.signTransaction(walletId, {
      to: data.to_address,
      amount: data.amount,
      chain: wallet.chain,
      memo: data.memo,
    });

    // Create transaction record
    const tx = await this.prisma.walletTransaction.create({
      data: {
        wallet_id: walletId,
        chain: wallet.chain,
        asset: wallet.chain.toUpperCase(),
        direction: 'send',
        amount: data.amount,
        fee: (await this.signer.estimateFee(wallet.chain, data.to_address, data.amount)).estimated_fee,
        to_address: data.to_address,
        from_address: wallet.address,
        memo: data.memo,
        status: wallet.type === 'cold' ? 'pending_signature' : 'pending',
        tx_hash: signed.tx_hash,
        explorer_url: this.getExplorerUrl(wallet.chain, signed.tx_hash),
      },
    });

    // Update wallet balance
    const newBalance = balance - amount;
    await this.prisma.walletConfig.update({
      where: { id: walletId },
      data: {
        balance: newBalance.toFixed(8),
        balance_usd: newBalance * (await this.market.getPrice(wallet.chain.toUpperCase())),
        last_activity: new Date(),
      },
    });

    return {
      tx_id: tx.id,
      tx_hash: signed.tx_hash,
      status: tx.status,
      explorer_url: tx.explorer_url,
    };
  }

  // ── Estimate fee ──
  estimateFee(walletId: string, chain: string, data: { to_address: string; amount: string }) {
    return this.signer.estimateFee(chain, data.to_address, data.amount);
  }

  // ── Swap endpoints (delegated to SwapService) ──
  swapQuote(merchantId: string, data: any) {
    return this.swap.getQuote({ ...data, merchant_id: merchantId });
  }

  swapExecute(merchantId: string, data: any) {
    return this.swap.executeSwap({ ...data, merchant_id: merchantId });
  }

  swapHistory(merchantId: string, params: any) {
    return this.swap.getHistory(merchantId, params);
  }

  // ── Market data ──
  market_tickers() {
    return this.market.getTickers();
  }

  orderBook(pair: string) {
    return this.swap.getOrderBook(pair);
  }

  // ── Transactions ──
  async transactions(merchantId: string, query: any) {
    const page = parseInt(query.page) || 1;
    const perPage = parseInt(query.per_page) || 20;

    // Get merchant's wallet IDs
    const walletIds = await this.prisma.walletConfig.findMany({
      where: { merchant_id: merchantId },
      select: { id: true },
    });

    const where: any = {
      wallet_id: { in: walletIds.map(w => w.id) },
    };
    if (query.direction) where.direction = query.direction;
    if (query.status) where.status = query.status;

    const [data, total] = await Promise.all([
      this.prisma.walletTransaction.findMany({
        where,
        skip: (page - 1) * perPage,
        take: perPage,
        orderBy: { created_at: 'desc' },
      }),
      this.prisma.walletTransaction.count({ where }),
    ]);

    return { data, total, page, per_page: perPage, total_pages: Math.ceil(total / perPage) };
  }

  // ── Helpers ──
  private getMinDeposit(chain: string): string {
    const mins: Record<string, string> = {
      btc: '0.0001', eth: '0.001', bsc: '0.001', polygon: '1',
      solana: '0.01', tron: '1', ltc: '0.001', doge: '10',
      arbitrum: '0.001', optimism: '0.001', avax: '0.01',
      fantom: '1', base: '0.001',
    };
    return mins[chain] || '0.001';
  }

  private getConfirmations(chain: string): number {
    const confs: Record<string, number> = {
      btc: 3, eth: 12, bsc: 15, polygon: 64,
      solana: 32, tron: 20, ltc: 6, doge: 6,
      arbitrum: 12, optimism: 12, avax: 12,
      fantom: 12, base: 12,
    };
    return confs[chain] || 12;
  }

  private getEstimatedTime(chain: string): string {
    const times: Record<string, string> = {
      btc: '~30 min', eth: '~3 min', bsc: '~45 sec', polygon: '~5 min',
      solana: '~1 min', tron: '~1 min', ltc: '~15 min', doge: '~10 min',
      arbitrum: '~2 min', optimism: '~2 min', avax: '~2 min',
      fantom: '~1 min', base: '~2 min',
    };
    return times[chain] || '~5 min';
  }

  private getExplorerUrl(chain: string, txHash: string): string {
    const explorers: Record<string, string> = {
      btc: `https://blockchair.com/bitcoin/transaction/${txHash}`,
      eth: `https://etherscan.io/tx/${txHash}`,
      bsc: `https://bscscan.com/tx/${txHash}`,
      polygon: `https://polygonscan.com/tx/${txHash}`,
      solana: `https://solscan.io/tx/${txHash}`,
      tron: `https://tronscan.org/#/transaction/${txHash}`,
      ltc: `https://blockchair.com/litecoin/transaction/${txHash}`,
      doge: `https://blockchair.com/dogecoin/transaction/${txHash}`,
      arbitrum: `https://arbiscan.io/tx/${txHash}`,
      optimism: `https://optimistic.etherscan.io/tx/${txHash}`,
      avax: `https://snowtrace.io/tx/${txHash}`,
      fantom: `https://ftmscan.com/tx/${txHash}`,
      base: `https://basescan.org/tx/${txHash}`,
    };
    return explorers[chain] || `#${txHash}`;
  }
}
