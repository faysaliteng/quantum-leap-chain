export interface DetectedTx {
  txHash: string;
  address: string;
  amount: string;
  asset: string;
  blockNumber: number;
  blockHash: string;
}

export interface ChainAdapter {
  chain: string;
  getLatestBlock(): Promise<number>;
  getTransactions(fromBlock: number, toBlock: number, addresses: string[]): Promise<DetectedTx[]>;
  getConfirmations(txHash: string): Promise<number>;
}
