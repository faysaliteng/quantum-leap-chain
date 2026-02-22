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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PageSkeleton } from "@/components/PageSkeleton";
import { toast } from "sonner";
import { PlusCircle, Trash2, Edit, Newspaper, ChevronDown, ChevronUp } from "lucide-react";

export default function BlogManager() {
  usePageTitle("Blog Manager");
  const qc = useQueryClient();
  const [expanded, setExpanded] = useState<string | null>(null);

  const [form, setForm] = useState({
    title: "", slug: "", excerpt: "", body: "", tags: "", status: "draft" as "draft" | "published" | "scheduled",
    author: "Admin",
  });

  const { data: posts, isLoading } = useQuery({
    queryKey: ["cms-blog"],
    queryFn: admin.cms.blog.list,
  });

  const createMut = useMutation({
    mutationFn: () => admin.cms.blog.create({
      ...form,
      tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
      published_at: form.status === "published" ? new Date().toISOString() : undefined,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["cms-blog"] });
      setForm({ title: "", slug: "", excerpt: "", body: "", tags: "", status: "draft", author: "Admin" });
      toast.success("Post created");
    },
    onError: () => toast.error("Failed to create post"),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => admin.cms.blog.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["cms-blog"] }); toast.success("Deleted"); },
  });

  const toggleStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      admin.cms.blog.update(id, { status: status === "published" ? "draft" : "published" } as any),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["cms-blog"] }); toast.success("Updated"); },
  });

  if (isLoading) return <PageSkeleton />;

  return (
    <div className="space-y-6" data-testid="page:admin-cms-blog">
      <h1 className="text-lg font-semibold">Blog & News Manager</h1>

      {/* Create Form */}
      <Card>
        <CardHeader><CardTitle className="text-sm">New Blog Post</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Title</Label>
              <Input placeholder="Post title" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value, slug: e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "-") }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Slug</Label>
              <Input placeholder="post-slug" value={form.slug} onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))} className="font-mono" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Excerpt</Label>
            <Input placeholder="Short summary..." value={form.excerpt} onChange={(e) => setForm((f) => ({ ...f, excerpt: e.target.value }))} />
          </div>
          <div className="space-y-1.5">
            <Label>Body (Markdown)</Label>
            <Textarea placeholder="Write your post content in Markdown..." rows={8} value={form.body} onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))} className="font-mono text-sm" />
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label>Tags (comma-separated)</Label>
              <Input placeholder="crypto, payments, update" value={form.tags} onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Author</Label>
              <Input placeholder="Author name" value={form.author} onChange={(e) => setForm((f) => ({ ...f, author: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => setForm((f) => ({ ...f, status: v as typeof f.status }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button onClick={() => createMut.mutate()} disabled={!form.title.trim() || createMut.isPending}>
            <PlusCircle className="mr-1.5 h-3.5 w-3.5" />Create Post
          </Button>
        </CardContent>
      </Card>

      {/* List */}
      <Card>
        <CardHeader><CardTitle className="text-sm">All Posts ({posts?.length ?? 0})</CardTitle></CardHeader>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-xs text-muted-foreground uppercase">
                <th className="px-4 py-2">Title</th>
                <th className="px-4 py-2">Status</th>
                <th className="px-4 py-2">Author</th>
                <th className="px-4 py-2">Tags</th>
                <th className="px-4 py-2">Date</th>
                <th className="px-4 py-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {posts?.length ? posts.map((p) => (
                <tr key={p.id} className="border-b last:border-0">
                  <td className="px-4 py-2">
                    <div className="font-medium">{p.title}</div>
                    <div className="text-xs text-muted-foreground font-mono">/{p.slug}</div>
                  </td>
                  <td className="px-4 py-2">
                    <Badge variant={p.status === "published" ? "default" : p.status === "scheduled" ? "outline" : "secondary"} className="text-xs">
                      {p.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-2 text-muted-foreground">{p.author}</td>
                  <td className="px-4 py-2">
                    <div className="flex flex-wrap gap-1">
                      {p.tags.slice(0, 3).map((t) => <Badge key={t} variant="outline" className="text-xs">{t}</Badge>)}
                    </div>
                  </td>
                  <td className="px-4 py-2 text-xs text-muted-foreground">{new Date(p.created_at).toLocaleDateString()}</td>
                  <td className="px-4 py-2 text-right space-x-1">
                    <Button variant="ghost" size="sm" onClick={() => toggleStatus.mutate({ id: p.id, status: p.status })}>
                      {p.status === "published" ? "Unpublish" : "Publish"}
                    </Button>
                    <Button variant="ghost" size="sm" className="text-destructive" onClick={() => deleteMut.mutate(p.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </td>
                </tr>
              )) : (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">No blog posts yet</td></tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
