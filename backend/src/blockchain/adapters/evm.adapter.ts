import { ChainAdapter, DetectedTx } from './chain-adapter.interface';

/**
 * EVM Chain Adapter — queries eth_blockNumber, eth_getBlockByNumber, eth_getLogs.
 * Works for ETH, BSC, Polygon, Arbitrum, Optimism, Avalanche, Fantom, Base.
 */
export class EvmAdapter implements ChainAdapter {
  constructor(public chain: string, private rpcUrl: string) {}

  async getLatestBlock(): Promise<number> {
    try {
      const res = await fetch(this.rpcUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'eth_blockNumber', params: [] }),
      });
      const data = await res.json();
      return parseInt(data.result, 16) || 0;
    } catch {
      return 0;
    }
  }

  async getTransactions(fromBlock: number, toBlock: number, addresses: string[]): Promise<DetectedTx[]> {
    if (!addresses.length) return [];

    const results: DetectedTx[] = [];

    // Scan for native transfers using eth_getBlockByNumber
    // In production, use eth_getLogs with transfer event topics for ERC-20
    for (let blockNum = fromBlock; blockNum <= toBlock; blockNum++) {
      try {
        const res = await fetch(this.rpcUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jsonrpc: '2.0', id: 1,
            method: 'eth_getBlockByNumber',
            params: [`0x${blockNum.toString(16)}`, true],
          }),
        });
        const data = await res.json();
        if (!data.result?.transactions) continue;

        const addrSet = new Set(addresses.map(a => a.toLowerCase()));

        for (const tx of data.result.transactions) {
          const to = (tx.to || '').toLowerCase();
          if (addrSet.has(to) && tx.value !== '0x0') {
            const weiValue = BigInt(tx.value);
            const ethValue = Number(weiValue) / 1e18;

            results.push({
              txHash: tx.hash,
              address: to,
              amount: ethValue.toFixed(8),
              asset: this.chain.toUpperCase(),
              blockNumber: blockNum,
              blockHash: data.result.hash,
            });
          }
        }
      } catch {
        // Skip failed blocks
      }
    }

    return results;
  }

  async getConfirmations(txHash: string): Promise<number> {
    try {
      const [receiptRes, blockRes] = await Promise.all([
        fetch(this.rpcUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'eth_getTransactionReceipt', params: [txHash] }),
        }),
        fetch(this.rpcUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ jsonrpc: '2.0', id: 2, method: 'eth_blockNumber', params: [] }),
        }),
      ]);

      const receipt = await receiptRes.json();
      const block = await blockRes.json();

      if (!receipt.result?.blockNumber) return 0;

      const txBlock = parseInt(receipt.result.blockNumber, 16);
      const latestBlock = parseInt(block.result, 16);

      return Math.max(0, latestBlock - txBlock);
    } catch {
      return 0;
    }
  }
}
