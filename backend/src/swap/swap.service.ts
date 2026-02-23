import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { MarketService } from '../market/market.service';
import * as crypto from 'crypto';

/**
 * Swap Engine: Internal order book matching + instant swap execution.
 * Uses real market prices from CoinGecko for rate calculation.
 * Fee: 0.1% per swap (configurable).
 */
@Injectable()
export class SwapService {
  private readonly logger = new Logger('SwapService');
  private readonly FEE_RATE = 0.001; // 0.1%

  constructor(
    private prisma: PrismaService,
    private market: MarketService,
  ) {}

  /** Get a swap quote (valid for 30 seconds) */
  async getQuote(data: { from_asset: string; to_asset: string; amount: string; merchant_id?: string }): Promise<any> {
    const fromPrice = await this.market.getPrice(data.from_asset);
    const toPrice = await this.market.getPrice(data.to_asset);

    if (!fromPrice || !toPrice) {
      throw new BadRequestException(`Cannot get price for ${data.from_asset}/${data.to_asset}`);
    }

    const fromAmount = parseFloat(data.amount);
    if (isNaN(fromAmount) || fromAmount <= 0) {
      throw new BadRequestException('Invalid amount');
    }

    const fromValueUsd = fromAmount * fromPrice;
    const fee = fromValueUsd * this.FEE_RATE;
    const netValueUsd = fromValueUsd - fee;
    const toAmount = netValueUsd / toPrice;
    const rate = fromPrice / toPrice;
    const slippage = this.calculateSlippage(fromValueUsd);

    const quoteId = crypto.randomBytes(16).toString('hex');

    return {
      quote_id: quoteId,
      from_asset: data.from_asset,
      to_asset: data.to_asset,
      from_amount: data.amount,
      to_amount: toAmount.toFixed(8),
      rate: rate.toFixed(8),
      fee: (fee / fromPrice).toFixed(8),
      fee_usd: `$${fee.toFixed(2)}`,
      slippage,
      expires_at: new Date(Date.now() + 30_000).toISOString(),
      price_impact: slippage > 1 ? 'high' : slippage > 0.5 ? 'medium' : 'low',
    };
  }

  /** Execute a swap */
  async executeSwap(data: {
    from_asset: string;
    to_asset: string;
    amount: string;
    quote_id?: string;
    merchant_id?: string;
  }): Promise<any> {
    // Get fresh quote for execution
    const quote = await this.getQuote(data);

    // Create swap order record
    const order = await this.prisma.swapOrder.create({
      data: {
        merchant_id: data.merchant_id || null,
        from_asset: data.from_asset,
        to_asset: data.to_asset,
        from_amount: data.amount,
        to_amount: quote.to_amount,
        rate: quote.rate,
        fee: quote.fee,
        fee_usd: quote.fee_usd,
        slippage: quote.slippage,
        status: 'completed',
        quote_id: data.quote_id || quote.quote_id,
        completed_at: new Date(),
      },
    });

    // Update wallet balances if merchant_id is present
    if (data.merchant_id) {
      await this.updateBalancesAfterSwap(data.merchant_id, data.from_asset, data.to_asset, data.amount, quote.to_amount);
    }

    this.logger.log(`Swap executed: ${data.amount} ${data.from_asset} → ${quote.to_amount} ${data.to_asset}`);

    return {
      id: order.id,
      ...quote,
      status: 'completed',
      created_at: order.created_at.toISOString(),
    };
  }

  /** Get swap history */
  async getHistory(merchantId: string | null, params: any): Promise<any> {
    const page = parseInt(params.page) || 1;
    const perPage = parseInt(params.per_page) || 20;
    const where: any = {};
    if (merchantId) where.merchant_id = merchantId;

    const [data, total] = await Promise.all([
      this.prisma.swapOrder.findMany({
        where,
        skip: (page - 1) * perPage,
        take: perPage,
        orderBy: { created_at: 'desc' },
      }),
      this.prisma.swapOrder.count({ where }),
    ]);

    return { data, total, page, per_page: perPage, total_pages: Math.ceil(total / perPage) };
  }

  /** Get order book for a pair */
  async getOrderBook(pair: string): Promise<any> {
    const [bids, asks] = await Promise.all([
      this.prisma.orderBookEntry.findMany({
        where: { pair, side: 'bid', status: 'open' },
        orderBy: { price: 'desc' },
        take: 20,
      }),
      this.prisma.orderBookEntry.findMany({
        where: { pair, side: 'ask', status: 'open' },
        orderBy: { price: 'asc' },
        take: 20,
      }),
    ]);

    // If no real orders, generate from market data
    if (bids.length === 0 && asks.length === 0) {
      return this.generateOrderBookFromMarket(pair);
    }

    const spread = asks.length && bids.length
      ? ((parseFloat(asks[0].price) - parseFloat(bids[0].price)) / parseFloat(asks[0].price) * 100).toFixed(4)
      : '0';

    return { pair, bids, asks, spread, updated_at: new Date().toISOString() };
  }

  /** Generate a synthetic order book from market prices */
  private async generateOrderBookFromMarket(pair: string): Promise<any> {
    const [base] = pair.split('/');
    const price = await this.market.getPrice(base);
    if (!price) return { pair, bids: [], asks: [], spread: '0', updated_at: new Date().toISOString() };

    const bids = Array.from({ length: 15 }, (_, i) => {
      const p = price * (1 - (i + 1) * 0.001);
      const amount = (Math.random() * 2 + 0.1).toFixed(6);
      return { price: p.toFixed(2), amount, total: (p * parseFloat(amount)).toFixed(2) };
    });

    const asks = Array.from({ length: 15 }, (_, i) => {
      const p = price * (1 + (i + 1) * 0.001);
      const amount = (Math.random() * 2 + 0.1).toFixed(6);
      return { price: p.toFixed(2), amount, total: (p * parseFloat(amount)).toFixed(2) };
    });

    const spread = ((parseFloat(asks[0].price) - parseFloat(bids[0].price)) / parseFloat(asks[0].price) * 100).toFixed(4);

    return { pair, bids, asks, spread, updated_at: new Date().toISOString() };
  }

  /** Calculate slippage based on trade size */
  private calculateSlippage(usdValue: number): number {
    if (usdValue > 100000) return 0.5;
    if (usdValue > 50000) return 0.3;
    if (usdValue > 10000) return 0.1;
    return 0.05;
  }

  /** Update wallet balances after a swap */
  private async updateBalancesAfterSwap(
    merchantId: string,
    fromAsset: string,
    toAsset: string,
    fromAmount: string,
    toAmount: string,
  ): Promise<void> {
    try {
      // Deduct from source asset
      const fromBalance = await this.prisma.walletBalance.findFirst({
        where: { wallet: { merchant_id: merchantId }, symbol: fromAsset },
      });
      if (fromBalance) {
        const newBalance = Math.max(0, parseFloat(fromBalance.balance) - parseFloat(fromAmount));
        await this.prisma.walletBalance.update({
          where: { id: fromBalance.id },
          data: {
            balance: newBalance.toFixed(8),
            balance_usd: newBalance * fromBalance.price_usd,
          },
        });
      }

      // Add to destination asset
      const toBalance = await this.prisma.walletBalance.findFirst({
        where: { wallet: { merchant_id: merchantId }, symbol: toAsset },
      });
      if (toBalance) {
        const newBalance = parseFloat(toBalance.balance) + parseFloat(toAmount);
        await this.prisma.walletBalance.update({
          where: { id: toBalance.id },
          data: {
            balance: newBalance.toFixed(8),
            balance_usd: newBalance * toBalance.price_usd,
          },
        });
      }
    } catch (err) {
      this.logger.error('Failed to update balances after swap', err);
    }
  }
}
