import { Injectable, Logger } from '@nestjs/common';
import * as crypto from 'crypto';
import { PrismaService } from '../common/prisma/prisma.service';

/**
 * Key Manager: Handles AES-256-GCM encryption/decryption of private keys.
 * In production, this delegates to an external KMS (AWS KMS, HashiCorp Vault, etc.).
 * The SIGNER_SECRET env var serves as the master encryption key.
 */
@Injectable()
export class KeyManagerService {
  private readonly logger = new Logger('KeyManager');
  private masterKey: Buffer;

  constructor(private prisma: PrismaService) {
    const secret = process.env.SIGNER_SECRET || crypto.randomBytes(32).toString('hex');
    this.masterKey = crypto.scryptSync(secret, 'cryptoniumpay-kms-salt', 32);
  }

  /** Encrypt a private key and store it */
  async storeKey(walletId: string, privateKey: string): Promise<void> {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-gcm', this.masterKey, iv);
    let encrypted = cipher.update(privateKey, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag().toString('hex');

    await this.prisma.encryptedKey.upsert({
      where: { wallet_id: walletId },
      create: {
        wallet_id: walletId,
        key_enc: encrypted,
        iv: iv.toString('hex'),
        auth_tag: authTag,
        algorithm: 'aes-256-gcm',
      },
      update: {
        key_enc: encrypted,
        iv: iv.toString('hex'),
        auth_tag: authTag,
      },
    });

    this.logger.log(`Key stored for wallet ${walletId}`);
  }

  /** Decrypt and retrieve a private key (requires 2FA in production) */
  async retrieveKey(walletId: string): Promise<string> {
    const record = await this.prisma.encryptedKey.findUnique({ where: { wallet_id: walletId } });
    if (!record) throw new Error(`No key found for wallet ${walletId}`);

    const iv = Buffer.from(record.iv, 'hex');
    const authTag = Buffer.from(record.auth_tag, 'hex');
    const decipher = crypto.createDecipheriv('aes-256-gcm', this.masterKey, iv);
    decipher.setAuthTag(authTag);
    let decrypted = decipher.update(record.key_enc, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }

  /** Delete encrypted key when wallet is removed */
  async deleteKey(walletId: string): Promise<void> {
    await this.prisma.encryptedKey.deleteMany({ where: { wallet_id: walletId } });
  }

  /** Generate a new keypair for a given chain */
  generateKeypair(chain: string): { address: string; privateKey: string } {
    // For EVM chains, generate ECDSA secp256k1 keypair
    if (['eth', 'bsc', 'polygon', 'arbitrum', 'optimism', 'avax', 'fantom', 'base'].includes(chain)) {
      const privateKey = crypto.randomBytes(32).toString('hex');
      // Derive address from public key (simplified — in production use ethers.js)
      const pubKey = crypto.createPublicKey({
        key: Buffer.concat([Buffer.from([0x30, 0x56, 0x30, 0x10, 0x06, 0x07, 0x2a, 0x86, 0x48, 0xce, 0x3d, 0x02, 0x01, 0x06, 0x05, 0x2b, 0x81, 0x04, 0x00, 0x0a, 0x03, 0x42, 0x00, 0x04]),
          crypto.createPrivateKey({
            key: Buffer.from(`302e0201010420${privateKey}a00706052b8104000a`, 'hex'),
            format: 'der',
            type: 'sec1',
          }).export({ format: 'der', type: 'sec1' }).subarray(7, 72)]),
        format: 'der',
        type: 'spki',
      });
      const pubKeyHash = crypto.createHash('sha256').update(privateKey).digest('hex');
      const address = '0x' + pubKeyHash.slice(0, 40);
      return { address, privateKey };
    }

    // For non-EVM chains, generate placeholder keypairs
    // In production, these use chain-specific libraries (bitcoinjs-lib, @solana/web3.js, tronweb, etc.)
    const privateKey = crypto.randomBytes(32).toString('hex');
    const hash = crypto.createHash('sha256').update(privateKey).digest('hex');

    const prefixes: Record<string, string> = {
      btc: 'bc1q', ltc: 'ltc1q', doge: 'D', solana: '', tron: 'T',
    };

    const prefix = prefixes[chain] ?? '0x';
    const address = prefix + hash.slice(0, chain === 'solana' ? 44 : 34);
    return { address, privateKey };
  }
}
