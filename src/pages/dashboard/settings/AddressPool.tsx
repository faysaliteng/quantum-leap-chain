import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { addressPool } from "@/lib/api-client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Upload, AlertCircle, CheckCircle } from "lucide-react";
import { usePageTitle } from "@/hooks/use-page-title";
import { useToast } from "@/hooks/use-toast";
import type { ChainId } from "@/lib/types";

const CHAINS: { value: ChainId; label: string }[] = [
  { value: "btc", label: "Bitcoin (BTC)" },
  { value: "eth", label: "Ethereum (ETH)" },
  { value: "arbitrum", label: "Arbitrum" },
  { value: "optimism", label: "Optimism" },
  { value: "polygon", label: "Polygon" },
];

export default function AddressPool() {
  usePageTitle("Address Pool");
  const qc = useQueryClient();
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);

  const { data: stats } = useQuery({ queryKey: ["address-pool-stats"], queryFn: addressPool.stats });
  const { data: addresses } = useQuery({ queryKey: ["address-pool-list"], queryFn: () => addressPool.list() });

  const [showUpload, setShowUpload] = useState(false);
  const [chain, setChain] = useState<ChainId>("btc");
  const [parsedAddresses, setParsedAddresses] = useState<string[]>([]);
  const [parseError, setParseError] = useState("");

  const uploadMut = useMutation({
    mutationFn: () => addressPool.upload({ chain, addresses: parsedAddresses }),
    onSuccess: () => {
      toast({ title: "Addresses uploaded", description: `${parsedAddresses.length} addresses added to ${chain.toUpperCase()} pool` });
      qc.invalidateQueries({ queryKey: ["address-pool-stats"] });
      qc.invalidateQueries({ queryKey: ["address-pool-list"] });
      setShowUpload(false);
      setParsedAddresses([]);
    },
    onError: (err: any) => {
      toast({ title: "Upload failed", description: err?.response?.data?.message || "Failed to upload addresses", variant: "destructive" });
    },
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setParseError("");
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const lines = text.split(/[\r\n]+/).map((l) => l.trim()).filter((l) => l && !l.startsWith("#") && !l.toLowerCase().startsWith("address"));
      
      if (lines.length === 0) {
        setParseError("No valid addresses found in file");
        return;
      }
      if (lines.length > 10000) {
        setParseError("Maximum 10,000 addresses per upload");
        return;
      }

      // Basic validation: addresses should be alphanumeric strings
      const invalid = lines.filter((l) => !/^[a-zA-Z0-9]{20,100}$/.test(l));
      if (invalid.length > 0) {
        setParseError(`${invalid.length} invalid address(es) found. First: ${invalid[0].slice(0, 30)}…`);
        return;
      }

      const unique = [...new Set(lines)];
      setParsedAddresses(unique);
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-4" data-testid="page:dashboard-settings-addresses">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">Deposit Address Pool</h1>
        <Button size="sm" onClick={() => setShowUpload(true)}>
          <Upload className="mr-1.5 h-3.5 w-3.5" />Upload CSV
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {stats?.map((s) => (
          <Card key={s.chain}>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-mono uppercase">{s.chain}</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div><p className="text-2xl font-bold">{s.total}</p><p className="text-xs text-muted-foreground">Total</p></div>
                <div><p className="text-2xl font-bold">{s.allocated}</p><p className="text-xs text-muted-foreground">Allocated</p></div>
                <div><p className="text-2xl font-bold text-success">{s.available}</p><p className="text-xs text-muted-foreground">Available</p></div>
              </div>
              {s.available < 10 && s.total > 0 && (
                <div className="mt-2 flex items-center gap-1 text-xs text-warning">
                  <AlertCircle className="h-3 w-3" />
                  Low address pool — upload more addresses
                </div>
              )}
            </CardContent>
          </Card>
        )) ?? <p className="text-muted-foreground">No address pools configured. Upload addresses to get started.</p>}
      </div>

      {addresses && addresses.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-sm">Recent Addresses</CardTitle></CardHeader>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs text-muted-foreground uppercase tracking-wide">
                  <th className="px-4 py-2">Address</th>
                  <th className="px-4 py-2">Chain</th>
                  <th className="px-4 py-2">Status</th>
                  <th className="px-4 py-2">Added</th>
                </tr>
              </thead>
              <tbody>
                {addresses.slice(0, 20).map((addr) => (
                  <tr key={addr.id} className="border-b last:border-0">
                    <td className="px-4 py-2 font-mono text-xs truncate max-w-[250px]">{addr.address}</td>
                    <td className="px-4 py-2 text-xs uppercase font-mono">{addr.chain}</td>
                    <td className="px-4 py-2">
                      <Badge variant={addr.status === "available" ? "default" : "outline"} className="text-xs">
                        {addr.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-2 text-xs text-muted-foreground">{new Date(addr.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      <Dialog open={showUpload} onOpenChange={setShowUpload}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload Deposit Addresses</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Chain</Label>
              <Select value={chain} onValueChange={(v) => setChain(v as ChainId)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CHAINS.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>CSV File</Label>
              <p className="text-xs text-muted-foreground">One address per line. Headers and comments (starting with #) are ignored.</p>
              <input
                ref={fileRef}
                type="file"
                accept=".csv,.txt"
                onChange={handleFileSelect}
                className="block w-full text-sm text-muted-foreground file:mr-4 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-sm file:font-medium file:bg-primary file:text-primary-foreground hover:file:bg-primary/90 cursor-pointer"
              />
            </div>

            {parseError && (
              <div className="flex items-center gap-2 text-sm text-destructive">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {parseError}
              </div>
            )}

            {parsedAddresses.length > 0 && (
              <div className="flex items-center gap-2 text-sm text-success">
                <CheckCircle className="h-4 w-4 shrink-0" />
                {parsedAddresses.length} valid unique addresses parsed
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowUpload(false); setParsedAddresses([]); setParseError(""); }}>Cancel</Button>
            <Button onClick={() => uploadMut.mutate()} disabled={parsedAddresses.length === 0 || uploadMut.isPending}>
              {uploadMut.isPending ? "Uploading…" : `Upload ${parsedAddresses.length} Addresses`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
