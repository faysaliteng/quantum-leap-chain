import { useState } from "react";
import { usePageTitle } from "@/hooks/use-page-title";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { admin } from "@/lib/api-client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { PageSkeleton } from "@/components/PageSkeleton";
import { toast } from "sonner";
import {
  Mail, Trash2, Archive, Eye, MessageSquare, Building2, Clock,
  ChevronDown, ChevronUp, Reply, Filter,
} from "lucide-react";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import type { ContactSubmission } from "@/lib/types";

const statusColors: Record<ContactSubmission["status"], string> = {
  new: "bg-primary/10 text-primary",
  read: "bg-info/10 text-info",
  replied: "bg-success/10 text-success",
  archived: "bg-muted text-muted-foreground",
};

export default function ContactSubmissions() {
  usePageTitle("Contact Submissions");
  const qc = useQueryClient();
  const [expanded, setExpanded] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | ContactSubmission["status"]>("all");
  const [replyNote, setReplyNote] = useState("");

  const { data: submissions, isLoading } = useQuery({
    queryKey: ["cms-contacts"],
    queryFn: admin.cms.contacts.list,
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<ContactSubmission> }) =>
      admin.cms.contacts.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["cms-contacts"] });
      qc.invalidateQueries({ queryKey: ["cms-stats"] });
      toast.success("Updated");
    },
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => admin.cms.contacts.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["cms-contacts"] });
      qc.invalidateQueries({ queryKey: ["cms-stats"] });
      toast.success("Deleted");
    },
  });

  if (isLoading) return <PageSkeleton />;

  const filtered = filter === "all"
    ? submissions ?? []
    : (submissions ?? []).filter((s) => s.status === filter);

  const counts = {
    all: submissions?.length ?? 0,
    new: submissions?.filter((s) => s.status === "new").length ?? 0,
    read: submissions?.filter((s) => s.status === "read").length ?? 0,
    replied: submissions?.filter((s) => s.status === "replied").length ?? 0,
    archived: submissions?.filter((s) => s.status === "archived").length ?? 0,
  };

  return (
    <div className="space-y-6" data-testid="page:admin-cms-contacts">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">Contact Submissions</h1>
        {counts.new > 0 && (
          <Badge className="bg-primary/10 text-primary border-primary/20">
            {counts.new} new
          </Badge>
        )}
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {(["all", "new", "read", "replied", "archived"] as const).map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`rounded-lg border p-3 text-center text-sm transition-colors ${
              filter === s ? "border-primary bg-primary/5" : "hover:border-primary/30"
            }`}
          >
            <p className="text-lg font-bold">{counts[s]}</p>
            <p className="text-xs text-muted-foreground capitalize">{s}</p>
          </button>
        ))}
      </div>

      {/* Submissions list */}
      <div className="space-y-3">
        {filtered.length ? filtered.map((sub) => {
          const isOpen = expanded === sub.id;
          return (
            <Card key={sub.id} className={sub.status === "new" ? "border-primary/30" : ""}>
              <CardContent className="p-0">
                {/* Header row */}
                <button
                  className="w-full flex items-center justify-between px-5 py-4 text-left"
                  onClick={() => {
                    setExpanded(isOpen ? null : sub.id);
                    if (sub.status === "new") {
                      updateMut.mutate({ id: sub.id, data: { status: "read" } });
                    }
                  }}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Mail className={`h-4 w-4 shrink-0 ${sub.status === "new" ? "text-primary" : "text-muted-foreground"}`} />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-sm">{sub.name}</span>
                        <span className="text-xs text-muted-foreground">&lt;{sub.email}&gt;</span>
                        {sub.company && (
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Building2 className="h-3 w-3" />{sub.company}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Badge variant="outline" className="text-xs">{sub.subject}</Badge>
                        <Badge className={`${statusColors[sub.status]} border-0 text-xs`}>{sub.status}</Badge>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {new Date(sub.created_at).toLocaleDateString()}
                    </span>
                    {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </div>
                </button>

                {/* Expanded content */}
                {isOpen && (
                  <div className="border-t px-5 py-4 space-y-4">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1 font-medium">Message</p>
                      <p className="text-sm whitespace-pre-wrap bg-muted/50 rounded-lg p-4">{sub.message}</p>
                    </div>

                    {sub.notes && (
                      <div>
                        <p className="text-xs text-muted-foreground mb-1 font-medium">Admin Notes</p>
                        <p className="text-sm bg-success/5 border border-success/20 rounded-lg p-3">{sub.notes}</p>
                      </div>
                    )}

                    {/* Add note */}
                    <div className="space-y-2">
                      <p className="text-xs text-muted-foreground font-medium">Add Note / Reply Record</p>
                      <Textarea
                        placeholder="Add internal notes about this submission..."
                        rows={3}
                        value={expanded === sub.id ? replyNote : ""}
                        onChange={(e) => setReplyNote(e.target.value)}
                      />
                    </div>

                    {/* Actions */}
                    <div className="flex flex-wrap gap-2">
                      {replyNote.trim() && (
                        <Button
                          size="sm"
                          onClick={() => {
                            updateMut.mutate({
                              id: sub.id,
                              data: {
                                status: "replied",
                                notes: (sub.notes ? sub.notes + "\n---\n" : "") + `[${new Date().toLocaleString()}] ${replyNote}`,
                              },
                            });
                            setReplyNote("");
                          }}
                        >
                          <Reply className="mr-1.5 h-3.5 w-3.5" />Save Note & Mark Replied
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateMut.mutate({ id: sub.id, data: { status: "archived" } })}
                      >
                        <Archive className="mr-1.5 h-3.5 w-3.5" />Archive
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive"
                        onClick={() => deleteMut.mutate(sub.id)}
                      >
                        <Trash2 className="mr-1.5 h-3.5 w-3.5" />Delete
                      </Button>
                      <a
                        href={`mailto:${sub.email}?subject=Re: ${encodeURIComponent(sub.subject)}`}
                        className="inline-flex"
                      >
                        <Button variant="outline" size="sm">
                          <MessageSquare className="mr-1.5 h-3.5 w-3.5" />Reply via Email
                        </Button>
                      </a>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        }) : (
          <div className="text-center py-12 text-muted-foreground text-sm">
            No {filter === "all" ? "" : filter} submissions yet.
          </div>
        )}
      </div>
    </div>
  );
}
