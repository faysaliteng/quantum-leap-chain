import { ChainAdapter, DetectedTx } from './chain-adapter.interface';

/**
 * Litecoin/Dogecoin adapter — uses Bitcoin-compatible JSON-RPC.
 * Both chains use the same UTXO model as Bitcoin with different network parameters.
 */
export class UtxoAdapter implements ChainAdapter {
  constructor(public chain: string, private rpcUrl: string) {}

  async getLatestBlock(): Promise<number> {
    try {
      const res = await fetch(this.rpcUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jsonrpc: '1.0', id: 1, method: 'getblockcount', params: [] }),
      });
      const data = await res.json();
      return data.result || 0;
    } catch {
      return 0;
    }
  }

  async getTransactions(_from: number, _to: number, _addresses: string[]): Promise<DetectedTx[]> {
    // In production: scan blocks using getblock + getrawtransaction
    // or use an indexer like Blockchair API
    return [];
  }

  async getConfirmations(txHash: string): Promise<number> {
    try {
      const res = await fetch(this.rpcUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jsonrpc: '1.0', id: 1, method: 'gettransaction', params: [txHash] }),
      });
      const data = await res.json();
      return data.result?.confirmations || 0;
    } catch {
      return 0;
    }
  }
}
