import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DocsNav } from "@/components/DocsNav";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SEOHead } from "@/components/SEOHead";
import { ShareBar } from "@/components/ShareBar";

export default function SingularityCoinDocs() {
  return (
    <div className="min-h-screen bg-background">
      <SEOHead title="SingularityCoin Protocol" description="Layer-1 blockchain protocol specification: HotStuff BFT consensus, post-quantum signatures, and Rust monorepo architecture." />
      <DocsNav />
      <div className="max-w-5xl mx-auto space-y-8 py-8 px-4">
        <div>
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h1 className="text-2xl font-display font-bold">SingularityCoin — Layer-1 Protocol Specification</h1>
            <ShareBar title="SingularityCoin Protocol Spec" />
          </div>
          <p className="text-muted-foreground mt-2">Post-quantum secure, HotStuff PoS consensus, 1-3s finality, self-hosted on commodity VMs</p>
        </div>

        <Tabs defaultValue="overview">
          <TabsList className="flex-wrap h-auto gap-1">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="consensus">Consensus</TabsTrigger>
            <TabsTrigger value="crypto">Cryptography</TabsTrigger>
            <TabsTrigger value="state">State Machine</TabsTrigger>
            <TabsTrigger value="network">Networking</TabsTrigger>
            <TabsTrigger value="rpc">RPC & CLI</TabsTrigger>
            <TabsTrigger value="deployment">Deployment</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-6 space-y-4">
            <Card>
              <CardHeader><CardTitle className="text-sm">Architecture</CardTitle></CardHeader>
              <CardContent>
                <pre className="text-xs font-mono whitespace-pre overflow-x-auto text-muted-foreground">{`
SingularityCoin Monorepo (Rust)
├── node/        Daemon entrypoint, config, runtime orchestration
├── consensus/   HotStuff BFT: propose → vote → QC → commit
├── crypto/      ML-DSA (Dilithium) / ed25519 fallback, blake3
├── p2p/         libp2p gossip, peer discovery, block sync
├── storage/     RocksDB: block store, state store, snapshots
├── state/       Account model, staking, slashing, epochs
├── rpc/         JSON-RPC (axum) + WebSocket events
├── cli/         singularityd + singularity-wallet
├── tools/       Genesis builder, testnet faucet, key inspector
├── spec/        Protocol specification (this document)
└── tests/       Integration tests (4-node localnet)
                `}</pre>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-sm">Key Properties</CardTitle></CardHeader>
              <CardContent className="p-0">
                <table className="w-full text-sm">
                  <tbody>
                    {[
                      ["Consensus", "HotStuff-style BFT with stake-weighted voting"],
                      ["Finality", "Deterministic, 1-3 seconds under normal conditions"],
                      ["Signatures", "ML-DSA / Dilithium (NIST PQC) — post-quantum secure"],
                      ["Hash Function", "BLAKE3 (256-bit)"],
                      ["Storage", "RocksDB (embedded, no external DB)"],
                      ["P2P", "libp2p (gossipsub + Kademlia DHT)"],
                      ["Fee Model", "base_fee_per_byte × tx_bytes + fixed_compute_fee"],
                      ["Staking", "Permissionless; top-N validators by stake per epoch"],
                      ["Slashing", "Double-vote: heavy slash + jail; Downtime: small slash"],
                      ["Block Size", "Configurable max (default 1 MB)"],
                      ["Epoch Length", "Configurable (default 100 blocks)"],
                      ["Address Format", "blake3(pubkey)[0..20] hex-encoded (20 bytes)"],
                      ["Serialization", "bincode (deterministic, canonical)"],
                    ].map(([k, v]) => (
                      <tr key={k} className="border-b last:border-0">
                        <td className="px-4 py-2 font-medium whitespace-nowrap">{k}</td>
                        <td className="px-4 py-2 text-muted-foreground">{v}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-sm">Tech Stack</CardTitle></CardHeader>
              <CardContent className="p-0">
                <table className="w-full text-sm">
                  <thead><tr className="border-b text-left text-xs text-muted-foreground uppercase"><th className="px-4 py-2">Crate</th><th className="px-4 py-2">Purpose</th></tr></thead>
                  <tbody>
                    {[
                      ["tokio", "Async runtime"],
                      ["axum", "JSON-RPC HTTP server"],
                      ["serde + bincode", "Deterministic serialization"],
                      ["thiserror", "Error types"],
                      ["tracing", "Structured logging"],
                      ["rocksdb", "Embedded key-value storage"],
                      ["blake3", "Hashing (blocks, addresses, Merkle tree)"],
                      ["libp2p", "P2P networking (gossip, discovery)"],
                      ["pqcrypto-dilithium", "ML-DSA post-quantum signatures"],
                      ["ed25519-dalek", "Fallback signatures (test only)"],
                      ["clap", "CLI argument parsing"],
                      ["prometheus", "Metrics exporter"],
                    ].map(([c, p]) => (
                      <tr key={c} className="border-b last:border-0">
                        <td className="px-4 py-2 font-mono text-xs">{c}</td>
                        <td className="px-4 py-2 text-muted-foreground">{p}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="consensus" className="mt-6 space-y-4">
            <Card>
              <CardHeader><CardTitle className="text-sm">HotStuff BFT Consensus</CardTitle></CardHeader>
              <CardContent>
                <pre className="text-xs font-mono whitespace-pre overflow-x-auto text-muted-foreground">{`
Phase 1: PROPOSE
  Leader L broadcasts: Proposal { block, view, parent_qc }
  
Phase 2: VOTE  
  Each validator V verifies block, signs vote:
    Vote { block_hash, view, validator_id, signature }
  Sends vote to leader

Phase 3: QUORUM CERTIFICATE (QC)
  Leader collects votes with ≥ 2f+1 stake weight
  Forms QC = { block_hash, view, aggregated_votes }
  Broadcasts QC to all validators

Phase 4: COMMIT
  On receiving QC for current view:
    If QC.view == locked_view + 1: COMMIT block
    Update locked_view, committed_height
    Apply state transitions
    Emit newBlock event

VIEW CHANGE (Timeout):
  If no proposal within timeout:
    Broadcast ViewChange { view+1, highest_qc }
    Timeout doubles (exponential backoff, capped at 30s)
    New leader = validators[(view+1) % N]
  On 2f+1 ViewChange messages:
    New leader proposes with highest QC from messages

SAFETY INVARIANTS:
  - A validator NEVER votes for two different blocks in same view
  - A validator NEVER votes for a block that conflicts with locked_qc
  - Commit requires 3 consecutive certified blocks (3-chain rule)
                `}</pre>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-sm">Leader Rotation</CardTitle></CardHeader>
              <CardContent className="text-sm space-y-2">
                <p><strong>Round-robin weighted:</strong> <code className="font-mono text-xs bg-muted px-1 py-0.5 rounded">leader = validators[view % active_validator_count]</code></p>
                <p className="text-muted-foreground">Validators are sorted by stake descending. Higher-stake validators get proportionally more proposal slots. Leader rotation changes every view (every block under normal operation).</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-sm">Finality Timing</CardTitle></CardHeader>
              <CardContent className="text-sm space-y-2">
                <p className="text-muted-foreground">Under normal network conditions with all validators online:</p>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div><p className="text-2xl font-bold font-mono">~1s</p><p className="text-xs text-muted-foreground">Best case</p></div>
                  <div><p className="text-2xl font-bold font-mono">~2s</p><p className="text-xs text-muted-foreground">Typical</p></div>
                  <div><p className="text-2xl font-bold font-mono">~3s</p><p className="text-xs text-muted-foreground">With stragglers</p></div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="crypto" className="mt-6 space-y-4">
            <Card>
              <CardHeader><CardTitle className="text-sm">Post-Quantum Signature Scheme</CardTitle></CardHeader>
              <CardContent className="text-sm space-y-3">
                <p><strong>Default:</strong> ML-DSA (CRYSTALS-Dilithium) — NIST FIPS 204 standard. Lattice-based, resistant to quantum attacks.</p>
                <p><strong>Fallback (test only):</strong> Ed25519 via <code className="font-mono text-xs bg-muted px-1 py-0.5 rounded">ed25519-dalek</code>. Enabled via feature flag <code className="font-mono text-xs bg-muted px-1 py-0.5 rounded">--features fallback-ed25519</code>.</p>
                <p><strong>Hybrid mode (optional):</strong> Requires BOTH Dilithium + Ed25519 signatures. Maximum security during PQ transition period.</p>
                <div className="mt-4">
                  <p className="font-medium mb-2">Feature Flags (Cargo.toml)</p>
                  <pre className="text-xs font-mono bg-muted p-3 rounded">{`[features]
default = ["dilithium"]
dilithium = ["pqcrypto-dilithium"]
fallback-ed25519 = ["ed25519-dalek"]
hybrid = ["dilithium", "fallback-ed25519"]`}</pre>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-sm">Address Derivation</CardTitle></CardHeader>
              <CardContent>
                <pre className="text-xs font-mono bg-muted p-3 rounded">{`// Address = blake3(public_key_bytes)[0..20]
// Displayed as 40-character hex string: "0x" + hex(20 bytes)
// Example: 0xa1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0

fn derive_address(pubkey: &[u8]) -> Address {
    let hash = blake3::hash(pubkey);
    let bytes: [u8; 20] = hash.as_bytes()[0..20]
        .try_into()
        .expect("20 bytes");
    Address(bytes)
}`}</pre>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-sm">Hashing</CardTitle></CardHeader>
              <CardContent className="text-sm space-y-2">
                <p><strong>BLAKE3</strong> is used for all hashing: block hashes, transaction hashes, Merkle tree nodes, address derivation.</p>
                <p className="text-muted-foreground">BLAKE3 provides 256-bit security, is parallelizable, and has no known quantum speedups beyond Grover's (128-bit post-quantum security).</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="state" className="mt-6 space-y-4">
            <Card>
              <CardHeader><CardTitle className="text-sm">Transaction Types</CardTitle></CardHeader>
              <CardContent className="p-0">
                <table className="w-full text-sm">
                  <thead><tr className="border-b text-left text-xs text-muted-foreground uppercase"><th className="px-4 py-2">Type</th><th className="px-4 py-2">Fields</th><th className="px-4 py-2">Effect</th></tr></thead>
                  <tbody>
                    {[
                      ["Transfer", "to, amount, memo?", "Move tokens between accounts"],
                      ["Bond", "amount", "Stake tokens (locked)"],
                      ["Unbond", "amount", "Begin unbonding (21-epoch delay)"],
                      ["DeclareValidator", "commission_rate", "Register as validator candidate"],
                      ["WithdrawUnbonded", "—", "Claim matured unbonded tokens"],
                      ["EvidenceDoubleVote", "vote_a, vote_b", "Slash validator for equivocation"],
                    ].map(([type, fields, effect]) => (
                      <tr key={type} className="border-b last:border-0">
                        <td className="px-4 py-2 font-mono text-xs">{type}</td>
                        <td className="px-4 py-2 text-xs font-mono text-muted-foreground">{fields}</td>
                        <td className="px-4 py-2 text-muted-foreground">{effect}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-sm">Transaction Format</CardTitle></CardHeader>
              <CardContent>
                <pre className="text-xs font-mono bg-muted p-3 rounded">{`struct Transaction {
    chain_id:   u32,        // Prevent cross-chain replay
    nonce:      u64,        // Must increment by exactly 1
    from_pubkey: Vec<u8>,   // Sender's public key
    to_address:  Address,   // Recipient (20 bytes)
    amount:      u128,      // In smallest denomination
    fee:         u64,       // Must >= min_fee(tx_size)
    memo:        Option<String>, // Max 256 bytes
    tx_type:     TxType,    // Enum discriminant
    signature:   Vec<u8>,   // ML-DSA or Ed25519
}

// Validation rules:
// 1. signature.verify(from_pubkey, tx_hash) == true
// 2. account.nonce + 1 == tx.nonce
// 3. amount + fee <= account.balance
// 4. fee >= base_fee_per_byte * tx_bytes + fixed_compute_fee`}</pre>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-sm">Fee Market</CardTitle></CardHeader>
              <CardContent className="text-sm space-y-2">
                <pre className="text-xs font-mono bg-muted p-3 rounded">{`fee = base_fee_per_byte × tx_size_bytes + fixed_compute_fee

// base_fee adjustment (per block):
if block_utilization > 50%:
    base_fee *= 1.125  (12.5% increase)
else:
    base_fee *= 0.875  (12.5% decrease)
    
// Floor: base_fee >= MIN_BASE_FEE (anti-spam)
// fixed_compute_fee = 1000 units (constant)`}</pre>
                <p className="text-muted-foreground">Proposer selects transactions ordered by fee/byte descending. Max block size enforced.</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-sm">Staking & Epochs</CardTitle></CardHeader>
              <CardContent className="text-sm space-y-3">
                <p><strong>Epoch length:</strong> 100 blocks (configurable). Validator set updates ONLY at epoch boundaries.</p>
                <p><strong>Active set:</strong> Top N validators by total stake (default N=100).</p>
                <p><strong>Rewards:</strong></p>
                <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                  <li>Proposer reward: 40% of block fees</li>
                  <li>Voter reward: 60% of block fees, split by stake weight</li>
                  <li>Annual inflation: 2% (configurable), distributed per epoch</li>
                </ul>
                <p><strong>Slashing:</strong></p>
                <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                  <li>Double vote: 5% of stake slashed + jailed for 7 epochs</li>
                  <li>Downtime ({'>'} 500 consecutive missed blocks): 0.1% of stake slashed</li>
                </ul>
                <p><strong>Unbonding period:</strong> 21 epochs (~2100 blocks) before funds can be withdrawn.</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="network" className="mt-6 space-y-4">
            <Card>
              <CardHeader><CardTitle className="text-sm">P2P Networking (libp2p)</CardTitle></CardHeader>
              <CardContent className="text-sm space-y-3">
                <p><strong>Transport:</strong> TCP + Noise protocol (authenticated encryption)</p>
                <p><strong>Discovery:</strong> Kademlia DHT + mDNS (local), bootstrap nodes for mainnet</p>
                <p><strong>Gossip:</strong> gossipsub for block propagation and transaction broadcast</p>
                <p><strong>Topics:</strong></p>
                <ul className="list-disc pl-5 space-y-1 text-muted-foreground font-mono text-xs">
                  <li>/singularity/blocks/1.0.0</li>
                  <li>/singularity/txs/1.0.0</li>
                  <li>/singularity/consensus/1.0.0</li>
                </ul>
                <p><strong>Peer scoring:</strong> Peers penalized for invalid blocks/txs, slow response, or gossip spam. Automatic disconnection below threshold.</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-sm">Block Sync</CardTitle></CardHeader>
              <CardContent className="text-sm space-y-2">
                <p className="text-muted-foreground">New nodes sync via request/response protocol:</p>
                <ol className="list-decimal pl-5 space-y-1 text-muted-foreground">
                  <li>Request latest block height from peers</li>
                  <li>Download blocks in batches of 100</li>
                  <li>Verify each block (hash chain, QC, state transitions)</li>
                  <li>Optionally use snapshot at recent epoch boundary for fast sync</li>
                  <li>Switch to live gossip once caught up</li>
                </ol>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="rpc" className="mt-6 space-y-4">
            <Card>
              <CardHeader><CardTitle className="text-sm">JSON-RPC Endpoints</CardTitle></CardHeader>
              <CardContent className="p-0">
                <table className="w-full text-sm">
                  <thead><tr className="border-b text-left text-xs text-muted-foreground uppercase"><th className="px-4 py-2">Method</th><th className="px-4 py-2">Params</th><th className="px-4 py-2">Returns</th></tr></thead>
                  <tbody>
                    {[
                      ["getStatus", "—", "height, peers, base_fee, chain_id"],
                      ["getBlock", "height | hash", "Block with txs and QC"],
                      ["getTx", "hash", "Transaction with inclusion proof"],
                      ["getBalance", "address", "balance, nonce, staking info"],
                      ["sendTx", "raw_tx (hex)", "tx_hash"],
                      ["getValidators", "—", "Active validator set with stakes"],
                      ["getParams", "—", "Chain parameters (epoch, fees, etc.)"],
                    ].map(([m, p, r]) => (
                      <tr key={m} className="border-b last:border-0">
                        <td className="px-4 py-2 font-mono text-xs">{m}</td>
                        <td className="px-4 py-2 text-xs text-muted-foreground">{p}</td>
                        <td className="px-4 py-2 text-xs text-muted-foreground">{r}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-sm">WebSocket Events</CardTitle></CardHeader>
              <CardContent className="p-0">
                <table className="w-full text-sm">
                  <thead><tr className="border-b text-left text-xs text-muted-foreground uppercase"><th className="px-4 py-2">Event</th><th className="px-4 py-2">Payload</th></tr></thead>
                  <tbody>
                    <tr className="border-b"><td className="px-4 py-2 font-mono text-xs">newBlock</td><td className="px-4 py-2 text-xs text-muted-foreground">height, hash, proposer, tx_count, timestamp</td></tr>
                    <tr><td className="px-4 py-2 font-mono text-xs">txIncluded</td><td className="px-4 py-2 text-xs text-muted-foreground">tx_hash, block_height, status</td></tr>
                  </tbody>
                </table>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-sm">CLI Commands</CardTitle></CardHeader>
              <CardContent>
                <pre className="text-xs font-mono bg-muted p-3 rounded overflow-x-auto">{`# Node CLI (singularityd)
singularityd init-genesis \\
  --chain-id singularity-mainnet-1 \\
  --genesis-out genesis.json \\
  --allocations allocations.csv \\
  --validators validators.json

singularityd run --config node.toml
singularityd status --rpc http://localhost:26657

# Wallet CLI (singularity-wallet)
singularity-wallet keygen --out ~/.singularity/key.json
singularity-wallet address --key ~/.singularity/key.json
singularity-wallet balance --rpc http://localhost:26657 --address 0xa1b2...
singularity-wallet transfer \\
  --rpc http://localhost:26657 \\
  --key ~/.singularity/key.json \\
  --to 0xdeadbeef... \\
  --amount 1000000 \\
  --fee 5000 \\
  --memo "Payment for services"
singularity-wallet bond --rpc ... --key ... --amount 1000000
singularity-wallet unbond --rpc ... --key ... --amount 500000
singularity-wallet validators --rpc http://localhost:26657`}</pre>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-sm">Prometheus Metrics</CardTitle></CardHeader>
              <CardContent className="p-0">
                <table className="w-full text-sm">
                  <thead><tr className="border-b text-left text-xs text-muted-foreground uppercase"><th className="px-4 py-2">Metric</th><th className="px-4 py-2">Type</th><th className="px-4 py-2">Description</th></tr></thead>
                  <tbody>
                    {[
                      ["singularity_block_height", "Gauge", "Current committed block height"],
                      ["singularity_peers_count", "Gauge", "Connected peers"],
                      ["singularity_mempool_size", "Gauge", "Pending transactions in mempool"],
                      ["singularity_tx_received_total", "Counter", "Total transactions received"],
                      ["singularity_blocks_proposed_total", "Counter", "Total blocks proposed by this node"],
                      ["singularity_consensus_view", "Gauge", "Current consensus view number"],
                    ].map(([m, t, d]) => (
                      <tr key={m} className="border-b last:border-0">
                        <td className="px-4 py-2 font-mono text-xs">{m}</td>
                        <td className="px-4 py-2 text-xs">{t}</td>
                        <td className="px-4 py-2 text-xs text-muted-foreground">{d}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="deployment" className="mt-6 space-y-4">
            <Card>
              <CardHeader><CardTitle className="text-sm">Local Development (4-Node Testnet)</CardTitle></CardHeader>
              <CardContent>
                <pre className="text-xs font-mono bg-muted p-3 rounded overflow-x-auto">{`# Prerequisites: Rust 1.75+, Docker, docker-compose

# Build
cd singularitycoin/
cargo build --release

# Or use the build script
./scripts/build.sh

# Generate genesis with 4 validators
./scripts/localnet.sh init

# Start 4-node local network
./scripts/localnet.sh start
# Nodes on ports: 26657, 26658, 26659, 26660

# Check status
singularityd status --rpc http://localhost:26657

# Run tests
./scripts/test.sh

# Stop
./scripts/localnet.sh stop`}</pre>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-sm">Docker Compose (Production)</CardTitle></CardHeader>
              <CardContent>
                <pre className="text-xs font-mono bg-muted p-3 rounded overflow-x-auto">{`# docker-compose.yml
version: "3.8"
services:
  node1:
    image: singularitycoin/node:latest
    volumes:
      - ./data/node1:/data
      - ./config/node1.toml:/config/node.toml
    ports:
      - "26657:26657"  # RPC
      - "9090:9090"    # Prometheus
    command: singularityd run --config /config/node.toml

  node2:
    image: singularitycoin/node:latest
    volumes:
      - ./data/node2:/data
      - ./config/node2.toml:/config/node.toml
    ports:
      - "26658:26657"

  node3:
    image: singularitycoin/node:latest
    ...

  node4:
    image: singularitycoin/node:latest
    ...`}</pre>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-sm">systemd Service (VM)</CardTitle></CardHeader>
              <CardContent>
                <pre className="text-xs font-mono bg-muted p-3 rounded overflow-x-auto">{`# /etc/systemd/system/singularityd.service
[Unit]
Description=SingularityCoin Node
After=network.target

[Service]
Type=simple
User=singularity
ExecStart=/usr/local/bin/singularityd run \\
  --config /etc/singularity/node.toml
Restart=on-failure
RestartSec=5
LimitNOFILE=65535

[Install]
WantedBy=multi-user.target

# Enable & start:
sudo systemctl daemon-reload
sudo systemctl enable singularityd
sudo systemctl start singularityd
sudo journalctl -u singularityd -f`}</pre>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-sm">Node Configuration (node.toml)</CardTitle></CardHeader>
              <CardContent>
                <pre className="text-xs font-mono bg-muted p-3 rounded overflow-x-auto">{`[node]
chain_id = "singularity-mainnet-1"
data_dir = "/data"
genesis_file = "/config/genesis.json"

[consensus]
timeout_propose_ms = 3000
timeout_vote_ms = 2000
timeout_commit_ms = 1000
max_timeout_ms = 30000

[p2p]
listen_addr = "0.0.0.0:26656"
bootstrap_peers = [
  "/dns4/seed1.singularitycoin.io/tcp/26656/p2p/12D3...",
  "/dns4/seed2.singularitycoin.io/tcp/26656/p2p/12D3...",
]
max_peers = 50

[rpc]
listen_addr = "0.0.0.0:26657"
max_request_size = 1048576
rate_limit_per_second = 100

[storage]
cache_size_mb = 512
compaction_style = "level"

[metrics]
enabled = true
listen_addr = "0.0.0.0:9090"

[validator]
key_file = "/config/validator_key.json"
enabled = true`}</pre>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
