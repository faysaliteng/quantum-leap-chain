import { ChainAdapter, DetectedTx } from './chain-adapter.interface';

/**
 * Bitcoin chain adapter — uses Blockchair public API for block/tx data.
 * In production, connect to a Bitcoin Core node via JSON-RPC.
 */
export class BitcoinAdapter implements ChainAdapter {
  chain = 'btc';

  async getLatestBlock(): Promise<number> {
    try {
      const res = await fetch('https://api.blockchair.com/bitcoin/stats');
      const data = await res.json();
      return data.data?.blocks || 0;
    } catch {
      return 0;
    }
  }

  async getTransactions(fromBlock: number, toBlock: number, addresses: string[]): Promise<DetectedTx[]> {
    if (!addresses.length) return [];

    const results: DetectedTx[] = [];

    // Use Blockchair API to check addresses for recent transactions
    // In production, use a Bitcoin Core node with addressindex enabled
    for (const address of addresses.slice(0, 5)) { // Rate limit: max 5 addresses per scan
      try {
        const res = await fetch(`https://api.blockchair.com/bitcoin/dashboards/address/${address}?limit=10`);
        const data = await res.json();

        const addrData = data.data?.[address];
        if (!addrData?.transactions) continue;

        // Check for new transactions in the block range
        for (const txHash of addrData.transactions.slice(0, 5)) {
          const txRes = await fetch(`https://api.blockchair.com/bitcoin/dashboards/transaction/${txHash}`);
          const txData = await txRes.json();
          const tx = txData.data?.[txHash]?.transaction;

          if (tx && tx.block_id >= fromBlock && tx.block_id <= toBlock) {
            // Find output to our address
            const outputs = txData.data[txHash].outputs || [];
            for (const out of outputs) {
              if (out.recipient === address) {
                results.push({
                  txHash,
                  address,
                  amount: (out.value / 1e8).toFixed(8),
                  asset: 'BTC',
                  blockNumber: tx.block_id,
                  blockHash: tx.block_hash || '',
                });
              }
            }
          }
        }
      } catch {
        // Rate limited or network error
      }
    }

    return results;
  }

  async getConfirmations(txHash: string): Promise<number> {
    try {
      const [txRes, statsRes] = await Promise.all([
        fetch(`https://api.blockchair.com/bitcoin/dashboards/transaction/${txHash}`),
        fetch('https://api.blockchair.com/bitcoin/stats'),
      ]);

      const txData = await txRes.json();
      const statsData = await statsRes.json();

      const txBlock = txData.data?.[txHash]?.transaction?.block_id;
      const latestBlock = statsData.data?.blocks;

      if (!txBlock || !latestBlock) return 0;
      return Math.max(0, latestBlock - txBlock);
    } catch {
      return 0;
    }
  }
}
