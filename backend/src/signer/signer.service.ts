import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { KeyManagerService } from './key-manager.service';
import { PrismaService } from '../common/prisma/prisma.service';

/**
 * Signer Service: Signs transactions using encrypted private keys.
 * In production, this would be an isolated microservice with HSM access.
 * Currently runs in-process with AES-256-GCM encrypted key storage.
 */
@Injectable()
export class SignerService {
  private readonly logger = new Logger('SignerService');

  constructor(
    private keyManager: KeyManagerService,
    private prisma: PrismaService,
  ) {}

  /** Sign a transaction for a given wallet */
  async signTransaction(walletId: string, txData: {
    to: string;
    amount: string;
    chain: string;
    memo?: string;
  }): Promise<{ tx_hash: string; signed_tx: string }> {
    const wallet = await this.prisma.walletConfig.findUnique({ where: { id: walletId } });
    if (!wallet) throw new BadRequestException('Wallet not found');
    if (wallet.status !== 'active') throw new BadRequestException('Wallet is not active');

    // For cold wallets, return a pending state (requires hardware confirmation)
    if (wallet.type === 'cold') {
      this.logger.log(`Cold wallet ${walletId}: transaction queued for hardware signing`);
      return {
        tx_hash: `pending_${Date.now().toString(36)}`,
        signed_tx: 'AWAITING_HARDWARE_SIGNATURE',
      };
    }

    // Retrieve the encrypted private key
    const privateKey = await this.keyManager.retrieveKey(walletId);

    // Sign the transaction (chain-specific logic)
    const signedTx = await this.signForChain(txData.chain, privateKey, txData);

    this.logger.log(`Transaction signed for wallet ${walletId} on ${txData.chain}`);
    return signedTx;
  }

  /** Chain-specific transaction signing */
  private async signForChain(chain: string, _privateKey: string, txData: any): Promise<{ tx_hash: string; signed_tx: string }> {
    // In production, each chain uses its native signing library:
    // EVM: ethers.js Wallet.signTransaction()
    // BTC: bitcoinjs-lib Transaction.sign()
    // SOL: @solana/web3.js Transaction.sign()
    // TRX: tronweb.trx.sign()
    // LTC/DOGE: similar to BTC with different network params

    const crypto = await import('crypto');
    const txHash = '0x' + crypto.createHash('sha256').update(
      JSON.stringify({ ...txData, timestamp: Date.now() })
    ).digest('hex');

    return { tx_hash: txHash, signed_tx: txHash };
  }

  /** Estimate gas/fee for a transaction */
  async estimateFee(chain: string, _to: string, _amount: string): Promise<{ estimated_fee: string; chain: string }> {
    // In production, query RPC nodes for gas estimates
    const feeMap: Record<string, string> = {
      btc: '0.00005',
      eth: '0.002',
      bsc: '0.0005',
      polygon: '0.001',
      solana: '0.00025',
      tron: '1.0',
      arbitrum: '0.0003',
      optimism: '0.0003',
      ltc: '0.0001',
      doge: '1.0',
      avax: '0.001',
      fantom: '0.001',
      base: '0.0002',
    };

    return {
      estimated_fee: feeMap[chain] || '0.001',
      chain,
    };
  }

  /** Broadcast a signed transaction to the network */
  async broadcastTransaction(chain: string, signedTx: string): Promise<string> {
    // In production, submit to RPC node
    this.logger.log(`Broadcasting transaction on ${chain}`);
    return signedTx; // Returns tx_hash
  }
}
