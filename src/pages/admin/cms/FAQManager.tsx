import { useState } from "react";
import { usePageTitle } from "@/hooks/use-page-title";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { admin } from "@/lib/api-client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { PageSkeleton } from "@/components/PageSkeleton";
import { toast } from "sonner";
import { PlusCircle, Trash2, Eye, EyeOff, GripVertical } from "lucide-react";

export default function FAQManager() {
  usePageTitle("FAQ Manager");
  const qc = useQueryClient();

  const [form, setForm] = useState({ question: "", answer: "", category: "General" });

  const { data: faqs, isLoading } = useQuery({
    queryKey: ["cms-faq"],
    queryFn: admin.cms.faq.list,
  });

  const createMut = useMutation({
    mutationFn: () => admin.cms.faq.create({
      ...form,
      sort_order: (faqs?.length ?? 0) + 1,
      visible: true,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["cms-faq"] });
      setForm({ question: "", answer: "", category: "General" });
      toast.success("FAQ entry created");
    },
    onError: () => toast.error("Failed to create FAQ"),
  });

  const toggleMut = useMutation({
    mutationFn: ({ id, visible }: { id: string; visible: boolean }) => admin.cms.faq.update(id, { visible }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["cms-faq"] }); toast.success("Updated"); },
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => admin.cms.faq.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["cms-faq"] }); toast.success("Deleted"); },
  });

  if (isLoading) return <PageSkeleton />;

  const categories = [...new Set(faqs?.map((f) => f.category) ?? ["General"])];

  return (
    <div className="space-y-6" data-testid="page:admin-cms-faq">
      <h1 className="text-lg font-semibold">FAQ Manager</h1>

      {/* Create */}
      <Card>
        <CardHeader><CardTitle className="text-sm">New FAQ Entry</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
            <div className="space-y-1.5">
              <Label>Question</Label>
              <Input placeholder="What is Cryptoniumpay?" value={form.question} onChange={(e) => setForm((f) => ({ ...f, question: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Category</Label>
              <Input placeholder="General" value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Answer</Label>
            <Textarea placeholder="The answer to the FAQ..." rows={4} value={form.answer} onChange={(e) => setForm((f) => ({ ...f, answer: e.target.value }))} />
          </div>
          <Button onClick={() => createMut.mutate()} disabled={!form.question.trim() || !form.answer.trim() || createMut.isPending}>
            <PlusCircle className="mr-1.5 h-3.5 w-3.5" />Add FAQ
          </Button>
        </CardContent>
      </Card>

      {/* List by category */}
      {categories.map((cat) => (
        <Card key={cat}>
          <CardHeader>
            <CardTitle className="text-sm">{cat} ({faqs?.filter((f) => f.category === cat).length ?? 0})</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {faqs?.filter((f) => f.category === cat).sort((a, b) => a.sort_order - b.sort_order).map((faq) => (
                <div key={faq.id} className="flex items-start justify-between px-4 py-3">
                  <div className="flex items-start gap-3">
                    <GripVertical className="h-4 w-4 text-muted-foreground mt-0.5 cursor-grab" />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{faq.question}</span>
                        {!faq.visible && <Badge variant="secondary" className="text-xs">Hidden</Badge>}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 max-w-lg">{faq.answer.slice(0, 150)}{faq.answer.length > 150 ? "..." : ""}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button variant="ghost" size="sm" onClick={() => toggleMut.mutate({ id: faq.id, visible: !faq.visible })}>
                      {faq.visible ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                    </Button>
                    <Button variant="ghost" size="sm" className="text-destructive" onClick={() => deleteMut.mutate(faq.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}

      {!faqs?.length && (
        <div className="text-center py-8 text-muted-foreground text-sm">No FAQ entries yet. Create your first one above.</div>
      )}
    </div>
  );
}
