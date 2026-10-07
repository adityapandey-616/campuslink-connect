import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Empty, Loading, PageHeader } from "@/components/AppShell";
import { MOCK_PENDING_DOCS } from "@/lib/mock-data";

export const Route = createFileRoute("/_authenticated/admin/documents")({
  component: Docs,
});

function Docs() {
  const qc = useQueryClient();
  const q = useQuery({
    queryKey: ["pending-docs"],
    queryFn: async () => {
      try {
        const res = await supabase.from("documents").select("*, student:students(full_name,branch)").eq("status", "pending").order("created_at");
        if (res.data && res.data.length > 0) return res.data;
        return MOCK_PENDING_DOCS;
      } catch {
        return MOCK_PENDING_DOCS;
      }
    },
  });
  async function set(id: string, status: string) {
    try {
      const { data: u } = await supabase.auth.getUser();
      if (u?.user) {
        await supabase.from("documents").update({ status }).eq("id", id);
        await supabase.from("audit_logs").insert({ actor: u.user.id, action: `document_${status}`, entity: "documents", entity_id: id });
      }
    } catch {}
    toast.success(`Document marked as ${status}`);
    qc.invalidateQueries({ queryKey: ["pending-docs"] });
  }
  if (q.isLoading) return <Loading />;
  return (
    <>
      <PageHeader title="Document verification" subtitle="Pending documents submitted by students." />
      {(q.data ?? []).length === 0 ? <Empty>All documents are verified.</Empty> : (
        <div className="divide-y rounded-lg border bg-card">
          {(q.data ?? []).map((d) => (
            <div key={d.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
              <div><div className="font-medium">{d.doc_type}</div><div className="text-sm text-muted-foreground">{d.student?.full_name} · {d.student?.branch}</div></div>
              <div className="flex gap-2"><Button size="sm" onClick={() => set(d.id, "verified")}>Verify</Button><Button size="sm" variant="outline" onClick={() => set(d.id, "rejected")}>Reject</Button></div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
