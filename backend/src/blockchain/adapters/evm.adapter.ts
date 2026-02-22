import { ChainAdapter, DetectedTx } from './chain-adapter.interface';

export class EvmAdapter implements ChainAdapter {
  constructor(public chain: string, private rpcUrl: string) {}

  async getLatestBlock(): Promise<number> {
    // TODO: eth_blockNumber RPC call
    return 0;
  }

  async getTransactions(_from: number, _to: number, _addresses: string[]): Promise<DetectedTx[]> {
    // TODO: Scan EVM blocks for incoming transfers to monitored addresses
    return [];
  }

  async getConfirmations(_txHash: string): Promise<number> {
    // TODO: Get tx receipt and calculate confirmations
    return 0;
  }
}
