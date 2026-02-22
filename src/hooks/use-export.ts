import { useMutation } from "@tanstack/react-query";
import { exports as exportsApi, adminExports } from "@/lib/api-extended";
import { toast } from "sonner";
import type { ExportKind } from "@/lib/types-extended";

interface UseExportOptions {
  scope: "merchant" | "admin";
}

export function useExport({ scope }: UseExportOptions) {
  const api = scope === "admin" ? adminExports : exportsApi;

  const mutation = useMutation({
    mutationFn: (data: { kind: string; format: string; filters?: Record<string, unknown> }) =>
      api.create(data),
    onSuccess: (job) => {
      toast.success("Export started", {
        description: `Job ${job.id.slice(0, 8)} queued. Check the Export Center for download.`,
        action: {
          label: scope === "admin" ? "View Exports" : "View Exports",
          onClick: () => {
            window.location.href = scope === "admin" ? "/admin/exports" : "/dashboard/exports";
          },
        },
      });
    },
    onError: () => {
      toast.error("Failed to start export");
    },
  });

  const startExport = (kind: ExportKind, format: "csv" | "json" = "csv", filters?: Record<string, unknown>) => {
    mutation.mutate({ kind, format, filters });
  };

  return { startExport, isExporting: mutation.isPending };
}
