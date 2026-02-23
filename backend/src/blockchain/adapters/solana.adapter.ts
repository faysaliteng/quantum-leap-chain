import { ChainAdapter, DetectedTx } from './chain-adapter.interface';

/**
 * Solana chain adapter — uses Solana JSON-RPC API.
 * In production, connects to a Solana RPC node (Helius, QuickNode, etc.)
 */
export class SolanaAdapter implements ChainAdapter {
  chain = 'solana';

  constructor(private rpcUrl: string) {}

  async getLatestBlock(): Promise<number> {
    const res = await fetch(this.rpcUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'getSlot' }),
    });
    const data = await res.json();
    return data.result || 0;
  }

  async getTransactions(_from: number, _to: number, _addresses: string[]): Promise<DetectedTx[]> {
    // In production: getSignaturesForAddress + getTransaction for each monitored address
    return [];
  }

  async getConfirmations(txHash: string): Promise<number> {
    const res = await fetch(this.rpcUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0', id: 1, method: 'getTransaction',
        params: [txHash, { encoding: 'json', commitment: 'confirmed' }],
      }),
    });
    const data = await res.json();
    return data.result?.slot ? 32 : 0; // Solana uses finality rather than confirmations
  }
}
