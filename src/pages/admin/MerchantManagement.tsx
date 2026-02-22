import { usePageTitle } from "@/hooks/use-page-title";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { admin } from "@/lib/api-client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { TableSkeleton } from "@/components/PageSkeleton";
import { useState } from "react";

export default function MerchantManagement() {
  usePageTitle("Merchants");
  const qc = useQueryClient();
  const { data: merchants, isLoading } = useQuery({ queryKey: ["admin-merchants"], queryFn: admin.merchants.list });
  const [search, setSearch] = useState("");
  const toggleMut = useMutation({ mutationFn: ({ id, enabled }: { id: string; enabled: boolean }) => admin.merchants.toggle(id, enabled), onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-merchants"] }) });

  const filtered = merchants?.filter((m) => m.name.toLowerCase().includes(search.toLowerCase()) || m.email.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-4" data-testid="page:admin-merchants">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">Merchants</h1>
        <Input className="max-w-xs h-8 text-sm" placeholder="Search merchants…" value={search} onChange={(e) => setSearch(e.target.value)} maxLength={100} />
      </div>
      <Card>
        <CardContent className="p-0">
          {isLoading ? <TableSkeleton /> : (
            <table className="w-full text-sm">
              <thead><tr className="border-b text-left text-xs text-muted-foreground uppercase"><th className="px-4 py-2">Name</th><th className="px-4 py-2">Email</th><th className="px-4 py-2">Status</th><th className="px-4 py-2">Created</th><th className="px-4 py-2"></th></tr></thead>
              <tbody>
                {filtered?.length ? filtered.map((m) => (
                  <tr key={m.id} className="border-b last:border-0">
                    <td className="px-4 py-2 font-medium">{m.name}</td>
                    <td className="px-4 py-2 text-muted-foreground">{m.email}</td>
                    <td className="px-4 py-2"><Badge variant={m.status === "active" ? "default" : "outline"} className="text-xs">{m.status}</Badge></td>
                    <td className="px-4 py-2 text-xs text-muted-foreground">{new Date(m.created_at).toLocaleDateString()}</td>
                    <td className="px-4 py-2"><Button variant="outline" size="sm" className="h-7 text-xs" disabled={toggleMut.isPending} onClick={() => toggleMut.mutate({ id: m.id, enabled: m.status !== "active" })}>{m.status === "active" ? "Disable" : "Enable"}</Button></td>
                  </tr>
                )) : <tr><td colSpan={5} className="px-4 py-6 text-center text-muted-foreground">No merchants found</td></tr>}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
