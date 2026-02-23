import { ChainAdapter, DetectedTx } from './chain-adapter.interface';

/**
 * TRON chain adapter — uses TronGrid / TRON JSON-RPC.
 * In production, connects to TronGrid API or a private TRON node.
 */
export class TronAdapter implements ChainAdapter {
  chain = 'tron';

  constructor(private apiUrl: string) {}

  async getLatestBlock(): Promise<number> {
    try {
      const res = await fetch(`${this.apiUrl}/wallet/getnowblock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      return data.block_header?.raw_data?.number || 0;
    } catch {
      return 0;
    }
  }

  async getTransactions(_from: number, _to: number, _addresses: string[]): Promise<DetectedTx[]> {
    // In production: use TronGrid API /v1/accounts/{address}/transactions
    return [];
  }

  async getConfirmations(txHash: string): Promise<number> {
    try {
      const res = await fetch(`${this.apiUrl}/wallet/gettransactioninfobyid`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value: txHash }),
      });
      const data = await res.json();
      return data.blockNumber ? 20 : 0;
    } catch {
      return 0;
    }
  }
}
