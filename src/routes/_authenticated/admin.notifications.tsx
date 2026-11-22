import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Bell } from "lucide-react";
import { Empty, Loading, PageHeader } from "@/components/AppShell";
import { Badge } from "@/components/ui/badge";
import { adminNotificationsQuery, type AdminNotification } from "@/lib/admin-live-data";

const EMPTY_NOTIFICATIONS: AdminNotification[] = [];

export const Route = createFileRoute("/_authenticated/admin/notifications")({
  head: () => ({ meta: [{ title: "Notifications — Skill to Hire Admin" }] }),
  component: AdminNotificationsPage,
});

function AdminNotificationsPage() {
  const query = useQuery(adminNotificationsQuery);
  const [filter, setFilter] = useState<"all" | "unread" | "read">("all");
  const notifications = query.data ?? EMPTY_NOTIFICATIONS;
  const filtered = useMemo(
    () =>
      notifications.filter(
        (notification) =>
          filter === "all" || (filter === "read" ? notification.is_read : !notification.is_read),
      ),
    [notifications, filter],
  );

  if (query.isLoading) return <Loading />;
  if (query.error) {
    return (
      <Empty>
        Live notifications could not be loaded:{" "}
        {query.error instanceof Error ? query.error.message : "Unknown Supabase error"}
      </Empty>
    );
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Placement Notifications"
        subtitle="Live notification records visible under current RLS policies. Broadcast creation and admin read-state changes are unavailable until their policies are verified."
        action={
          <div className="flex items-center gap-2 rounded-lg border bg-card px-3 py-2 text-sm">
            <Bell className="h-4 w-4 text-accent" />
            {notifications.filter((notification) => !notification.is_read).length} unread
          </div>
        }
      />
      <div className="flex gap-2">
        {(["all", "unread", "read"] as const).map((value) => (
          <button
            key={value}
            onClick={() => setFilter(value)}
            className={`rounded-md border px-3 py-1.5 text-sm capitalize ${
              filter === value ? "border-accent bg-accent/10 text-accent" : "bg-card"
            }`}
          >
            {value}
          </button>
        ))}
      </div>
      {filtered.length === 0 ? (
        <Empty>
          {notifications.length
            ? "No notifications in this filter."
            : "No notification records found."}
        </Empty>
      ) : (
        <div className="divide-y rounded-xl border bg-card px-4">
          {filtered.map((notification) => (
            <article key={notification.id} className="flex items-start justify-between gap-3 py-4">
              <div>
                <h2 className="font-medium">{notification.title}</h2>
                <p className="mt-1 text-sm text-muted-foreground">{notification.message}</p>
                <p className="mt-2 text-xs text-muted-foreground">
                  Recipient profile: {notification.profile_id} ·{" "}
                  {new Date(notification.created_at).toLocaleString()}
                </p>
              </div>
              <Badge variant={notification.is_read ? "outline" : "default"}>
                {notification.is_read ? "Read" : "Unread"}
              </Badge>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
