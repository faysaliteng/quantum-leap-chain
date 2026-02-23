import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { SignerService } from '../signer/signer.service';
import { KeyManagerService } from '../signer/key-manager.service';
import { MarketService } from '../market/market.service';
import { SwapService } from '../swap/swap.service';
import * as argon2 from 'argon2';
import * as crypto from 'crypto';

@Injectable()
export class AdminService {
  private readonly logger = new Logger('AdminService');

  constructor(
    private prisma: PrismaService,
    private signer: SignerService,
    private keyManager: KeyManagerService,
    private market: MarketService,
    private swap: SwapService,
  ) {}

  // ── Stats ──
  async stats() {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const [totalMerchants, activeCharges, transactionsToday] = await Promise.all([
      this.prisma.merchant.count(),
      this.prisma.charge.count({ where: { status: { in: ['NEW', 'PENDING'] } } }),
      this.prisma.chargePayment.count({ where: { created_at: { gte: today } } }),
    ]);
    return { total_merchants: totalMerchants, active_charges: activeCharges, transactions_today: transactionsToday };
  }

  // ── Merchants ──
  listMerchants() { return this.prisma.merchant.findMany({ orderBy: { created_at: 'desc' } }); }
  async getMerchant(id: string) {
    const m = await this.prisma.merchant.findUnique({ where: { id } });
    if (!m) throw new NotFoundException(); return m;
  }
  toggleMerchant(id: string, data: any) { return this.prisma.merchant.update({ where: { id }, data }); }

  // ── Chains ──
  listChains() { return this.prisma.chainConfig.findMany({ include: { rpc_endpoints: true } }); }
  updateChain(chain: string, data: any) { return this.prisma.chainConfig.update({ where: { chain }, data }); }

  // ── Assets ──
  listAssets() { return this.prisma.assetConfig.findMany(); }
  toggleAsset(chain: string, symbol: string, data: any) {
    return this.prisma.assetConfig.updateMany({ where: { chain_id: chain, symbol }, data });
  }

  // ── Fees ──
  async getFeeConfig() {
    const config = await this.prisma.feeConfigRecord.findFirst();
    return config || { rate_percent: 0.5, min_fee_usd: 0, model: 'flat' };
  }
  async updateFeeConfig(data: any) {
    const existing = await this.prisma.feeConfigRecord.findFirst();
    if (existing) return this.prisma.feeConfigRecord.update({ where: { id: existing.id }, data });
    return this.prisma.feeConfigRecord.create({ data });
  }
  listFeeOverrides() { return this.prisma.merchantFeeOverride.findMany(); }
  setFeeOverride(data: any) {
    return this.prisma.merchantFeeOverride.upsert({
      where: { merchant_id: data.merchant_id },
      create: data, update: { rate_percent: data.rate_percent },
    });
  }
  removeFeeOverride(merchantId: string) { return this.prisma.merchantFeeOverride.delete({ where: { merchant_id: merchantId } }); }

  // ── Revenue ──
  async revenueStats() {
    return { total_revenue_usd: '0', fees_today_usd: '0', total_transactions: 0, active_merchants: 0, revenue_change_pct: 0, daily_revenue: [] };
  }
  async topMerchants() { return []; }

  // ── Health ──
  async health() {
    const watchers = await this.prisma.watcherCheckpoint.findMany();
    return { watchers, rpc_status: [], webhook_queue: { pending: 0, failed: 0 }, uptime_seconds: Math.floor(process.uptime()) };
  }

  // ── Audit Log ──
  async auditLog(query: any) {
    const page = parseInt(query.page) || 1;
    const perPage = 20;
    const where: any = {};
    if (query.actor) where.actor_id = query.actor;
    if (query.action) where.action = query.action;
    const [data, total] = await Promise.all([
      this.prisma.auditLog.findMany({ where, skip: (page - 1) * perPage, take: perPage, orderBy: { created_at: 'desc' } }),
      this.prisma.auditLog.count({ where }),
    ]);
    return { data, total, page, per_page: perPage, total_pages: Math.ceil(total / perPage) };
  }

  // ── Wallets ──
  async walletStats() {
    const wallets = await this.prisma.walletConfig.findMany();
    const hot = wallets.filter(w => w.type === 'hot');
    const cold = wallets.filter(w => w.type === 'cold');
    return {
      total_hot_wallets: hot.length, total_cold_wallets: cold.length,
      total_balance_usd: wallets.reduce((s, w) => s + w.balance_usd, 0),
      hot_balance_usd: hot.reduce((s, w) => s + w.balance_usd, 0),
      cold_balance_usd: cold.reduce((s, w) => s + w.balance_usd, 0),
      wallets,
    };
  }
  addWallet(data: any) { return this.prisma.walletConfig.create({ data }); }

  async generateWallet(data: { label: string; chain: string; merchant_id?: string }) {
    try {
      this.logger.log(`generateWallet called: chain=${data.chain}, label=${data.label}`);
      const keypair = await this.keyManager.generateKeypair(data.chain);
      this.logger.log(`Keypair generated: address=${keypair.address}`);
      const wallet = await this.prisma.walletConfig.create({
        data: {
          merchant_id: data.merchant_id || null,
          label: data.label,
          chain: data.chain,
          address: keypair.address,
          type: 'hot',
          status: 'active',
        },
      });
      this.logger.log(`Wallet record created: id=${wallet.id}`);
      await this.keyManager.storeKey(wallet.id, keypair.privateKey);
      this.logger.log(`Key stored for wallet ${wallet.id}`);
      return {
        wallet,
        address: keypair.address,
        private_key: keypair.privateKey,
        mnemonic: keypair.mnemonic || null,
      };
    } catch (err) {
      this.logger.error(`generateWallet FAILED: ${err.message || err}`, err.stack);
      throw err;
    }
  }
  updateWallet(id: string, data: any) { return this.prisma.walletConfig.update({ where: { id }, data }); }
  async removeWallet(id: string) {
    await this.prisma.walletBalance.deleteMany({ where: { wallet_id: id } });
    await this.prisma.walletTransaction.deleteMany({ where: { wallet_id: id } });
    return this.prisma.walletConfig.delete({ where: { id } });
  }
  async walletTransactions(query: any) {
    const perPage = parseInt(query.per_page) || 20;
    const where: any = {};
    if (query.wallet_id) where.wallet_id = query.wallet_id;
    if (query.direction) where.direction = query.direction;
    if (query.status) where.status = query.status;
    const [data, total] = await Promise.all([
      this.prisma.walletTransaction.findMany({ where, take: perPage, orderBy: { created_at: 'desc' } }),
      this.prisma.walletTransaction.count({ where }),
    ]);
    return { data, total, page: 1, per_page: perPage, total_pages: Math.ceil(total / perPage) };
  }

  // ── Admin Wallet Portfolio ──
  async walletPortfolio() {
    const wallets = await this.prisma.walletConfig.findMany();
    const balances = await this.prisma.walletBalance.findMany();
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
      totalUsd += balUsd;
      totalPnl += balUsd * (change / 100);
      assets.push({
        chain: bal.chain, symbol: bal.symbol, name: bal.name,
        balance: bal.balance, balance_usd: balUsd, price_usd: price,
        change_24h: change, contract_address: bal.contract_address,
      });
    }

    if (!assets.length) {
      totalUsd = wallets.reduce((s, w) => s + w.balance_usd, 0);
    }

    const hot = wallets.filter(w => w.type === 'hot');
    const cold = wallets.filter(w => w.type === 'cold');
    return {
      total_balance_usd: totalUsd, total_pnl_24h: totalPnl,
      total_pnl_pct: totalUsd > 0 ? (totalPnl / totalUsd) * 100 : 0,
      total_hot_wallets: hot.length, total_cold_wallets: cold.length,
      wallets, assets,
    };
  }

  async walletAssets() {
    const balances = await this.prisma.walletBalance.findMany();
    const tickers = await this.market.getTickers();
    const priceMap = new Map(tickers.map((t: any) => [t.symbol, t]));
    return balances.map(bal => {
      const ticker = priceMap.get(bal.symbol);
      return {
        chain: bal.chain, symbol: bal.symbol, name: bal.name,
        balance: bal.balance,
        balance_usd: parseFloat(bal.balance) * (ticker?.price_usd ?? bal.price_usd),
        price_usd: ticker?.price_usd ?? bal.price_usd,
        change_24h: ticker?.change_24h ?? bal.change_24h,
      };
    });
  }

  async walletSend(walletId: string, data: any) {
    const wallet = await this.prisma.walletConfig.findUnique({ where: { id: walletId } });
    if (!wallet) throw new NotFoundException('Wallet not found');

    const signed = await this.signer.signTransaction(walletId, {
      to: data.to_address, amount: data.amount, chain: wallet.chain, memo: data.memo,
    });

    const tx = await this.prisma.walletTransaction.create({
      data: {
        wallet_id: walletId, chain: wallet.chain, asset: wallet.chain.toUpperCase(),
        direction: 'send', amount: data.amount,
        fee: (await this.signer.estimateFee(wallet.chain, data.to_address, data.amount)).estimated_fee,
        to_address: data.to_address, from_address: wallet.address, memo: data.memo,
        status: wallet.type === 'cold' ? 'pending_signature' : 'pending',
        tx_hash: signed.tx_hash,
      },
    });

    const balance = parseFloat(wallet.balance) - parseFloat(data.amount);
    await this.prisma.walletConfig.update({
      where: { id: walletId },
      data: { balance: Math.max(0, balance).toFixed(8), last_activity: new Date() },
    });

    return { tx_id: tx.id, tx_hash: signed.tx_hash, status: tx.status };
  }

  walletEstimateFee(walletId: string, data: any) {
    return this.signer.estimateFee(data.chain || 'eth', data.to_address, data.amount);
  }

  walletSwapQuote(data: any) { return this.swap.getQuote(data); }
  walletSwapExecute(data: any) { return this.swap.executeSwap(data); }
  walletMarket() { return this.market.getTickers(); }

  // ── Roles ──
  listRoles() { return this.prisma.adminRole.findMany({ orderBy: { created_at: 'desc' } }); }
  createRole(data: any) { return this.prisma.adminRole.create({ data }); }
  updateRole(id: string, data: any) { return this.prisma.adminRole.update({ where: { id }, data }); }
  deleteRole(id: string) { return this.prisma.adminRole.delete({ where: { id } }); }
  roleAssignments() { return this.prisma.adminUserRole.findMany({ include: { role: true } }); }
  assignRole(data: any) { return this.prisma.adminUserRole.create({ data: { ...data, admin_email: '' } }); }
  revokeRole(adminUserId: string) { return this.prisma.adminUserRole.delete({ where: { admin_user_id: adminUserId } }); }
  listInvites() { return this.prisma.teamInvite.findMany({ orderBy: { created_at: 'desc' } }); }
  sendInvite(data: any) {
    return this.prisma.teamInvite.create({
      data: { ...data, invited_by: '', expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) },
    });
  }
  revokeInvite(id: string) { return this.prisma.teamInvite.delete({ where: { id } }); }

  // ── CMS ──
  async cmsStats() {
    const [pages, posts, announcements, faqs, contacts, unread] = await Promise.all([
      this.prisma.cMSPage.count(), this.prisma.cMSBlogPost.count(),
      this.prisma.cMSAnnouncement.count(), this.prisma.cMSFAQEntry.count(),
      this.prisma.cMSContactSubmission.count(),
      this.prisma.cMSContactSubmission.count({ where: { status: 'new' } }),
    ]);
    return { total_pages: pages, total_posts: posts, total_announcements: announcements, total_faqs: faqs, total_contacts: contacts, unread_contacts: unread, recent_activity: [] };
  }
  cmsPages() { return this.prisma.cMSPage.findMany(); }
  updateCmsPage(id: string, data: any) { return this.prisma.cMSPage.update({ where: { id }, data }); }
  cmsAnnouncements() { return this.prisma.cMSAnnouncement.findMany({ orderBy: { created_at: 'desc' } }); }
  createAnnouncement(data: any) { return this.prisma.cMSAnnouncement.create({ data }); }
  updateAnnouncement(id: string, data: any) { return this.prisma.cMSAnnouncement.update({ where: { id }, data }); }
  deleteAnnouncement(id: string) { return this.prisma.cMSAnnouncement.delete({ where: { id } }); }
  cmsBlog() { return this.prisma.cMSBlogPost.findMany({ orderBy: { created_at: 'desc' } }); }
  createBlogPost(data: any) { return this.prisma.cMSBlogPost.create({ data }); }
  updateBlogPost(id: string, data: any) { return this.prisma.cMSBlogPost.update({ where: { id }, data }); }
  deleteBlogPost(id: string) { return this.prisma.cMSBlogPost.delete({ where: { id } }); }
  cmsFaq() { return this.prisma.cMSFAQEntry.findMany({ orderBy: { sort_order: 'asc' } }); }
  createFaqEntry(data: any) { return this.prisma.cMSFAQEntry.create({ data }); }
  updateFaqEntry(id: string, data: any) { return this.prisma.cMSFAQEntry.update({ where: { id }, data }); }
  deleteFaqEntry(id: string) { return this.prisma.cMSFAQEntry.delete({ where: { id } }); }
  async cmsSettings() {
    const s = await this.prisma.cMSSettingsRecord.findFirst();
    return s || { site_title_template: '{page} | Cryptoniumpay', default_og_image: '/og-image.png', social_urls: {}, analytics_id: '', maintenance_mode: false };
  }
  async updateCmsSettings(data: any) {
    const existing = await this.prisma.cMSSettingsRecord.findFirst();
    if (existing) return this.prisma.cMSSettingsRecord.update({ where: { id: existing.id }, data });
    return this.prisma.cMSSettingsRecord.create({ data });
  }
  cmsContacts() { return this.prisma.cMSContactSubmission.findMany({ orderBy: { created_at: 'desc' } }); }
  updateContact(id: string, data: any) { return this.prisma.cMSContactSubmission.update({ where: { id }, data }); }
  deleteContact(id: string) { return this.prisma.cMSContactSubmission.delete({ where: { id } }); }

  // ── Security ──
  async getSecuritySettings(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    const sessions = await this.prisma.refreshToken.findMany({ where: { user_id: userId, revoked: false } });
    return {
      two_factor_enabled: user?.two_factor_enabled || false,
      email_verification_enabled: user?.email_verify_enabled || false,
      active_sessions: sessions.map(s => ({ id: s.id, device: 'Unknown', ip_address: '', last_active: s.created_at })),
      backup_codes_remaining: user?.backup_codes?.length || 0,
    };
  }
  async setup2fa(userId: string) {
    // TODO: Generate TOTP secret with otplib
    const secret = crypto.randomBytes(20).toString('hex');
    return { secret, otpauth_url: `otpauth://totp/Cryptoniumpay?secret=${secret}`, qr_code_data_url: '', backup_codes: [] };
  }
  async enable2fa(userId: string, _totpCode: string) {
    await this.prisma.user.update({ where: { id: userId }, data: { two_factor_enabled: true } });
  }
  async disable2fa(userId: string, _totpCode: string) {
    await this.prisma.user.update({ where: { id: userId }, data: { two_factor_enabled: false, two_factor_secret: null } });
  }
  async toggleEmailVerification(userId: string, enabled: boolean) {
    await this.prisma.user.update({ where: { id: userId }, data: { email_verify_enabled: enabled } });
  }
  async regenerateBackupCodes(userId: string) {
    const codes = Array.from({ length: 10 }, () => crypto.randomBytes(4).toString('hex'));
    const hashed = await Promise.all(codes.map(c => argon2.hash(c)));
    await this.prisma.user.update({ where: { id: userId }, data: { backup_codes: hashed } });
    return { backup_codes: codes };
  }
  revokeSession(id: string) { return this.prisma.refreshToken.update({ where: { id }, data: { revoked: true } }); }
  revokeAllSessions(userId: string) { return this.prisma.refreshToken.updateMany({ where: { user_id: userId }, data: { revoked: true } }); }
  async changePassword(userId: string, data: any) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException();
    const valid = await argon2.verify(user.password, data.current_password);
    if (!valid) throw new NotFoundException('Invalid current password');
    const hash = await argon2.hash(data.new_password, { type: argon2.argon2id, memoryCost: 65536, timeCost: 3, parallelism: 4 });
    await this.prisma.user.update({ where: { id: userId }, data: { password: hash } });
  }

  // ── Exports ──
  createExport(userId: string, data: any) {
    return this.prisma.dataExportJob.create({ data: { scope: 'admin', requested_by_user_id: userId, kind: data.kind, file_format: data.format, filters: data.filters || {} } });
  }
  async listExports(userId: string, query: any) {
    const limit = parseInt(query.limit) || 20;
    const [data, total] = await Promise.all([
      this.prisma.dataExportJob.findMany({ where: { scope: 'admin' }, take: limit, orderBy: { created_at: 'desc' } }),
      this.prisma.dataExportJob.count({ where: { scope: 'admin' } }),
    ]);
    return { data, total, page: 1, per_page: limit, total_pages: Math.ceil(total / limit) };
  }
  async getExport(userId: string, id: string) {
    const job = await this.prisma.dataExportJob.findUnique({ where: { id } });
    if (!job) throw new NotFoundException(); return job;
  }
}
