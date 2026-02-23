import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { RedisService } from '../common/redis/redis.service';

/**
 * Market Data Service: Fetches real-time prices from CoinGecko (free API).
 * Caches results in Redis with 30s TTL. Falls back to DB cache.
 */
@Injectable()
export class MarketService {
  private readonly logger = new Logger('MarketService');
  private readonly CACHE_KEY = 'market:tickers';
  private readonly CACHE_TTL = 30; // seconds

  // CoinGecko IDs mapped to our internal symbols
  private readonly COIN_MAP: Record<string, string> = {
    bitcoin: 'BTC', ethereum: 'ETH', 'binancecoin': 'BNB',
    tether: 'USDT', 'usd-coin': 'USDC', solana: 'SOL',
    tron: 'TRX', 'matic-network': 'MATIC', dogecoin: 'DOGE',
    litecoin: 'LTC', 'avalanche-2': 'AVAX', fantom: 'FTM',
  };

  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
  ) {
    // Start background price updater
    this.startPriceUpdater();
  }

  /** Get all market tickers */
  async getTickers(): Promise<any[]> {
    // Try Redis cache first
    try {
      const cached = await this.redis.client.get(this.CACHE_KEY);
      if (cached) return JSON.parse(cached);
    } catch {}

    // Fallback to DB
    const tickers = await this.prisma.marketTicker.findMany({ orderBy: { market_cap: 'desc' } });
    if (tickers.length) return tickers;

    // If nothing in DB, fetch fresh
    return this.fetchAndCachePrices();
  }

  /** Get price for a specific asset */
  async getPrice(symbol: string): Promise<number> {
    const tickers = await this.getTickers();
    const ticker = tickers.find((t: any) => t.symbol === symbol);
    return ticker?.price_usd ?? 0;
  }

  /** Fetch prices from CoinGecko and cache them */
  async fetchAndCachePrices(): Promise<any[]> {
    try {
      const ids = Object.keys(this.COIN_MAP).join(',');
      const url = `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${ids}&order=market_cap_desc&sparkline=false&price_change_percentage=24h`;

      const response = await fetch(url);
      if (!response.ok) throw new Error(`CoinGecko API error: ${response.status}`);

      const data = await response.json();
      const tickers = data.map((coin: any) => ({
        symbol: this.COIN_MAP[coin.id] || coin.symbol.toUpperCase(),
        name: coin.name,
        price_usd: coin.current_price,
        change_24h: coin.price_change_percentage_24h || 0,
        volume_24h: coin.total_volume || 0,
        market_cap: coin.market_cap || 0,
      }));

      // Cache in Redis
      try {
        await this.redis.client.setex(this.CACHE_KEY, this.CACHE_TTL, JSON.stringify(tickers));
      } catch {}

      // Persist to DB for fallback
      for (const ticker of tickers) {
        await this.prisma.marketTicker.upsert({
          where: { symbol: ticker.symbol },
          create: ticker,
          update: {
            name: ticker.name,
            price_usd: ticker.price_usd,
            change_24h: ticker.change_24h,
            volume_24h: ticker.volume_24h,
            market_cap: ticker.market_cap,
          },
        });
      }

      this.logger.log(`Updated ${tickers.length} market tickers from CoinGecko`);
      return tickers;
    } catch (err) {
      this.logger.error('Failed to fetch market data', err);
      return this.prisma.marketTicker.findMany({ orderBy: { market_cap: 'desc' } });
    }
  }

  /** Background price updater (every 60 seconds) */
  private startPriceUpdater() {
    setInterval(async () => {
      try {
        await this.fetchAndCachePrices();
      } catch (err) {
        this.logger.error('Price update failed', err);
      }
    }, 60_000);

    // Fetch immediately on startup
    setTimeout(() => this.fetchAndCachePrices(), 5000);
  }
}
