import { ChainAdapter, DetectedTx } from './chain-adapter.interface';

export class BitcoinAdapter implements ChainAdapter {
  chain = 'btc';

  async getLatestBlock(): Promise<number> {
    // TODO: Query Bitcoin RPC
    return 0;
  }

  async getTransactions(_from: number, _to: number, _addresses: string[]): Promise<DetectedTx[]> {
    // TODO: Scan Bitcoin blocks
    return [];
  }

  async getConfirmations(_txHash: string): Promise<number> {
    // TODO: Get confirmations from RPC
    return 0;
  }
}
