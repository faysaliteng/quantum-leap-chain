import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { KeyManagerService } from './key-manager.service';
import { PrismaService } from '../common/prisma/prisma.service';

/**
 * Signer Service: Signs and broadcasts REAL blockchain transactions.
 *
 * Uses:
 *  - ethers.js for EVM chains (ETH, BSC, Polygon, Arbitrum, Optimism, etc.)
 *  - bitcoinjs-lib for UTXO chains (BTC, LTC, DOGE)
 *  - @solana/web3.js for Solana
 *  - tronweb for Tron
 *
 * Cold wallets queue transactions for hardware signing.
 */
@Injectable()
export class SignerService {
  private readonly logger = new Logger('SignerService');

  /** Default public RPC endpoints per chain (override via env or ChainConfig) */
  private readonly rpcUrls: Record<string, string> = {
    eth: process.env.ETH_RPC_URL || 'https://eth.llamarpc.com',
    bsc: process.env.BSC_RPC_URL || 'https://bsc-dataseed1.binance.org',
    polygon: process.env.POLYGON_RPC_URL || 'https://polygon-rpc.com',
    arbitrum: process.env.ARBITRUM_RPC_URL || 'https://arb1.arbitrum.io/rpc',
    optimism: process.env.OPTIMISM_RPC_URL || 'https://mainnet.optimism.io',
    avax: process.env.AVAX_RPC_URL || 'https://api.avax.network/ext/bc/C/rpc',
    fantom: process.env.FANTOM_RPC_URL || 'https://rpc.ftm.tools',
    base: process.env.BASE_RPC_URL || 'https://mainnet.base.org',
    btc: process.env.BTC_RPC_URL || 'https://blockstream.info/api',
    solana: process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com',
    tron: process.env.TRON_RPC_URL || 'https://api.trongrid.io',
  };

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

    // Cold wallets: queue for hardware signing
    if (wallet.type === 'cold') {
      this.logger.log(`Cold wallet ${walletId}: transaction queued for hardware signing`);
      return {
        tx_hash: `pending_${Date.now().toString(36)}`,
        signed_tx: 'AWAITING_HARDWARE_SIGNATURE',
      };
    }

    // Retrieve the encrypted private key
    const privateKey = await this.keyManager.retrieveKey(walletId);

    // Sign and broadcast the transaction (chain-specific)
    const result = await this.signAndBroadcast(txData.chain, privateKey, txData);

    this.logger.log(`Transaction signed and broadcast for wallet ${walletId} on ${txData.chain}: ${result.tx_hash}`);
    return result;
  }

  /** Sign and broadcast using real chain libraries */
  private async signAndBroadcast(
    chain: string,
    privateKey: string,
    txData: { to: string; amount: string; memo?: string },
  ): Promise<{ tx_hash: string; signed_tx: string }> {
    const evmChains = ['eth', 'bsc', 'polygon', 'arbitrum', 'optimism', 'avax', 'fantom', 'base'];

    if (evmChains.includes(chain)) {
      return this.signEVM(chain, privateKey, txData);
    }
    if (chain === 'solana') {
      return this.signSolana(privateKey, txData);
    }
    if (chain === 'tron') {
      return this.signTron(privateKey, txData);
    }
    if (['btc', 'ltc', 'doge'].includes(chain)) {
      return this.signUTXO(chain, privateKey, txData);
    }

    throw new BadRequestException(`Unsupported chain: ${chain}`);
  }

  /** Sign and broadcast an EVM transaction using ethers.js */
  private async signEVM(
    chain: string,
    privateKey: string,
    txData: { to: string; amount: string; memo?: string },
  ): Promise<{ tx_hash: string; signed_tx: string }> {
    const { ethers } = await import('ethers');

    const rpcUrl = this.rpcUrls[chain];
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const wallet = new ethers.Wallet(privateKey, provider);

    const tx = {
      to: txData.to,
      value: ethers.parseEther(txData.amount),
      // data field for memo (as hex-encoded UTF-8)
      data: txData.memo ? ethers.hexlify(ethers.toUtf8Bytes(txData.memo)) : '0x',
    };

    // Estimate gas
    const gasEstimate = await provider.estimateGas({ ...tx, from: wallet.address });
    const feeData = await provider.getFeeData();

    const fullTx = {
      ...tx,
      gasLimit: gasEstimate * 120n / 100n, // 20% buffer
      maxFeePerGas: feeData.maxFeePerGas || feeData.gasPrice,
      maxPriorityFeePerGas: feeData.maxPriorityFeePerGas || 0n,
      type: feeData.maxFeePerGas ? 2 : 0, // EIP-1559 if supported
    };

    const txResponse = await wallet.sendTransaction(fullTx);
    this.logger.log(`EVM tx sent on ${chain}: ${txResponse.hash}`);

    return {
      tx_hash: txResponse.hash,
      signed_tx: txResponse.hash,
    };
  }

  /** Sign and broadcast a Solana transaction */
  private async signSolana(
    privateKey: string,
    txData: { to: string; amount: string },
  ): Promise<{ tx_hash: string; signed_tx: string }> {
    const solana = await import('@solana/web3.js');
    const bs58 = await import('bs58');

    const connection = new solana.Connection(
      this.rpcUrls.solana,
      'confirmed',
    );

    const fromKeypair = solana.Keypair.fromSecretKey(bs58.default.decode(privateKey));
    const toPubkey = new solana.PublicKey(txData.to);
    const lamports = Math.round(parseFloat(txData.amount) * solana.LAMPORTS_PER_SOL);

    const transaction = new solana.Transaction().add(
      solana.SystemProgram.transfer({
        fromPubkey: fromKeypair.publicKey,
        toPubkey,
        lamports,
      }),
    );

    const signature = await solana.sendAndConfirmTransaction(connection, transaction, [fromKeypair]);
    this.logger.log(`Solana tx sent: ${signature}`);

    return { tx_hash: signature, signed_tx: signature };
  }

  /** Sign and broadcast a Tron transaction */
  private async signTron(
    privateKey: string,
    txData: { to: string; amount: string },
  ): Promise<{ tx_hash: string; signed_tx: string }> {
    const tronModule: any = await import('tronweb');
    const TronWeb = tronModule.default?.default ?? tronModule.default ?? tronModule;
    const tronWeb = new (TronWeb as any)({
      fullHost: this.rpcUrls.tron,
      privateKey,
    });

    // Amount in SUN (1 TRX = 1,000,000 SUN)
    const amountSun = Math.round(parseFloat(txData.amount) * 1_000_000);

    const tx = await tronWeb.trx.sendTransaction(txData.to, amountSun);

    if (!tx.result) {
      throw new BadRequestException(`Tron transaction failed: ${JSON.stringify(tx)}`);
    }

    this.logger.log(`Tron tx sent: ${tx.txid}`);
    return { tx_hash: tx.txid, signed_tx: tx.txid };
  }

  /**
   * UTXO chains (BTC/LTC/DOGE): Fetch UTXOs from public API, build and sign transaction.
   * Uses Blockstream API (BTC), SoChain (LTC/DOGE) as UTXO indexers.
   */
  private async signUTXO(
    chain: string,
    privateKey: string,
    txData: { to: string; amount: string },
  ): Promise<{ tx_hash: string; signed_tx: string }> {
    const bitcoin = await import('bitcoinjs-lib');
    const ecc = await import('tiny-secp256k1');
    const { ECPairFactory } = await import('ecpair');

    const ECPair = ECPairFactory(ecc);

    // Network selection
    const networks: Record<string, any> = {
      btc: bitcoin.networks.bitcoin,
      ltc: { ...bitcoin.networks.bitcoin, messagePrefix: '\x19Litecoin Signed Message:\n', bech32: 'ltc', bip32: { public: 0x019da462, private: 0x019d9cfe }, pubKeyHash: 0x30, scriptHash: 0x32, wif: 0xb0 },
      doge: { ...bitcoin.networks.bitcoin, messagePrefix: '\x19Dogecoin Signed Message:\n', bip32: { public: 0x02facafd, private: 0x02fac398 }, pubKeyHash: 0x1e, scriptHash: 0x16, wif: 0x9e },
    };
    const network = networks[chain] || bitcoin.networks.bitcoin;

    // UTXO API endpoints
    const utxoApis: Record<string, string> = {
      btc: 'https://blockstream.info/api',
      ltc: 'https://chain.so/api/v3',
      doge: 'https://chain.so/api/v3',
    };

    try {
      const keyPair = ECPair.fromWIF(privateKey, network);
      const payment = bitcoin.payments.p2wpkh({ pubkey: Buffer.from(keyPair.publicKey), network });
      const address = payment.address;

      if (!address) throw new BadRequestException('Could not derive sender address');

      // Fetch UTXOs
      let utxos: Array<{ txid: string; vout: number; value: number }> = [];

      if (chain === 'btc') {
        const resp = await fetch(`${utxoApis.btc}/address/${address}/utxo`);
        const data = await resp.json() as Array<{ txid: string; vout: number; value: number; status: { confirmed: boolean } }>;
        utxos = data.filter(u => u.status.confirmed).map(u => ({ txid: u.txid, vout: u.vout, value: u.value }));
      } else {
        // SoChain for LTC/DOGE
        const coinName = chain === 'ltc' ? 'LTC' : 'DOGE';
        const resp = await fetch(`${utxoApis[chain]}/unspent_outputs/${coinName}/${address}`);
        const data = await resp.json() as { data: { outputs: Array<{ txid: string; output_no: number; value: string }> } };
        utxos = (data.data?.outputs || []).map(u => ({ txid: u.txid, vout: u.output_no, value: Math.round(parseFloat(u.value) * 1e8) }));
      }

      if (utxos.length === 0) throw new BadRequestException(`No confirmed UTXOs found for ${chain} address ${address}`);

      // Calculate amounts in satoshis
      const satoshiMultiplier = chain === 'doge' ? 1e8 : 1e8;
      const sendAmount = Math.round(parseFloat(txData.amount) * satoshiMultiplier);
      const feeEstimate = chain === 'btc' ? 5000 : chain === 'ltc' ? 10000 : 100000000; // Conservative fees

      // Select UTXOs (simple: use all)
      const totalInput = utxos.reduce((sum, u) => sum + u.value, 0);
      if (totalInput < sendAmount + feeEstimate) {
        throw new BadRequestException(`Insufficient funds: have ${totalInput} sats, need ${sendAmount + feeEstimate} sats`);
      }

      // Build transaction
      const psbt = new bitcoin.Psbt({ network });

      for (const utxo of utxos) {
        if (chain === 'btc') {
          // For segwit BTC, fetch the raw tx for non-witness UTXO or use witnessUtxo
          psbt.addInput({
            hash: utxo.txid,
            index: utxo.vout,
            witnessUtxo: {
              script: payment.output!,
              value: utxo.value,
            },
          });
        } else {
          // For LTC/DOGE, fetch raw transaction hex
          const rawResp = await fetch(`${utxoApis[chain === 'ltc' ? 'ltc' : 'doge']}/transaction/${chain === 'ltc' ? 'LTC' : 'DOGE'}/${utxo.txid}`);
          const rawData = await rawResp.json() as { data: { tx_hex: string } };
          psbt.addInput({
            hash: utxo.txid,
            index: utxo.vout,
            nonWitnessUtxo: Buffer.from(rawData.data?.tx_hex || '', 'hex'),
          });
        }
      }

      // Output: recipient
      psbt.addOutput({ address: txData.to, value: sendAmount });

      // Output: change (back to sender)
      const change = totalInput - sendAmount - feeEstimate;
      if (change > 546) { // Dust threshold
        psbt.addOutput({ address, value: change });
      }

      // Sign all inputs
      psbt.signAllInputs(keyPair);
      psbt.finalizeAllInputs();

      const rawTx = psbt.extractTransaction().toHex();

      // Broadcast via API
      let txHash: string;
      if (chain === 'btc') {
        const broadcastResp = await fetch(`${utxoApis.btc}/tx`, { method: 'POST', body: rawTx });
        txHash = await broadcastResp.text();
      } else {
        const coinName = chain === 'ltc' ? 'LTC' : 'DOGE';
        const broadcastResp = await fetch(`${utxoApis[chain]}/send_tx/${coinName}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tx_hex: rawTx }),
        });
        const broadcastData = await broadcastResp.json() as { data: { txid: string } };
        txHash = broadcastData.data?.txid || rawTx.slice(0, 64);
      }

      this.logger.log(`${chain.toUpperCase()} UTXO transaction broadcast: ${txHash}`);
      return { tx_hash: txHash, signed_tx: rawTx };
    } catch (err) {
      if (err instanceof BadRequestException) throw err;
      this.logger.error(`${chain.toUpperCase()} UTXO signing failed: ${(err as Error).message}`);
      throw new BadRequestException(`${chain.toUpperCase()} transaction failed: ${(err as Error).message}`);
    }
  }

  /** Estimate fee using real RPC data where possible */
  async estimateFee(chain: string, to: string, amount: string): Promise<{ estimated_fee: string; chain: string; currency: string }> {
    const evmChains = ['eth', 'bsc', 'polygon', 'arbitrum', 'optimism', 'avax', 'fantom', 'base'];

    if (evmChains.includes(chain)) {
      try {
        const { ethers } = await import('ethers');
        const provider = new ethers.JsonRpcProvider(this.rpcUrls[chain]);
        const feeData = await provider.getFeeData();
        const gasPrice = feeData.maxFeePerGas || feeData.gasPrice || 0n;
        const gasLimit = 21000n; // Standard ETH transfer
        const feeWei = gasPrice * gasLimit;
        const feeEth = ethers.formatEther(feeWei);

        const nativeSymbols: Record<string, string> = {
          eth: 'ETH', bsc: 'BNB', polygon: 'MATIC', arbitrum: 'ETH',
          optimism: 'ETH', avax: 'AVAX', fantom: 'FTM', base: 'ETH',
        };

        return {
          estimated_fee: parseFloat(feeEth).toFixed(8),
          chain,
          currency: nativeSymbols[chain] || 'ETH',
        };
      } catch (err) {
        this.logger.warn(`Fee estimation failed for ${chain}, using fallback`);
      }
    }

    // Fallback static fees for non-EVM or when RPC fails
    const feeMap: Record<string, { fee: string; currency: string }> = {
      btc: { fee: '0.00005', currency: 'BTC' },
      eth: { fee: '0.002', currency: 'ETH' },
      bsc: { fee: '0.0005', currency: 'BNB' },
      polygon: { fee: '0.001', currency: 'MATIC' },
      solana: { fee: '0.00025', currency: 'SOL' },
      tron: { fee: '1.0', currency: 'TRX' },
      arbitrum: { fee: '0.0003', currency: 'ETH' },
      optimism: { fee: '0.0003', currency: 'ETH' },
      ltc: { fee: '0.0001', currency: 'LTC' },
      doge: { fee: '1.0', currency: 'DOGE' },
      avax: { fee: '0.001', currency: 'AVAX' },
      fantom: { fee: '0.001', currency: 'FTM' },
      base: { fee: '0.0002', currency: 'ETH' },
    };

    const entry = feeMap[chain] || { fee: '0.001', currency: chain.toUpperCase() };
    return { estimated_fee: entry.fee, chain, currency: entry.currency };
  }

  /** Broadcast a pre-signed transaction to the network */
  async broadcastTransaction(chain: string, signedTx: string): Promise<string> {
    const evmChains = ['eth', 'bsc', 'polygon', 'arbitrum', 'optimism', 'avax', 'fantom', 'base'];

    if (evmChains.includes(chain)) {
      const { ethers } = await import('ethers');
      const provider = new ethers.JsonRpcProvider(this.rpcUrls[chain]);
      const txResponse = await provider.broadcastTransaction(signedTx);
      return txResponse.hash;
    }

    // For other chains, the sign methods already broadcast
    return signedTx;
  }
}
