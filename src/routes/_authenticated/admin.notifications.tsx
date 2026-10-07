import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import {
  AlertTriangle,
  Award,
  Bell,
  CalendarDays,
  CheckCircle2,
  Clock,
  FileCheck2,
  Filter,
  Megaphone,
  Plus,
  Send,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Empty, PageHeader } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  getMockNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  addMockNotification,
  type MockNotification,
} from "@/lib/mock-data";

export const Route = createFileRoute("/_authenticated/admin/notifications")({
  head: () => ({ meta: [{ title: "Notifications & Alerts — CAMPUSLINK Admin" }] }),
  component: AdminNotificationsPage,
});

export function AdminNotificationsPage() {
  const [notifications, setNotifications] = useState<MockNotification[]>(() => getMockNotifications());
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [isBroadcastOpen, setIsBroadcastOpen] = useState(false);

  const unreadCount = useMemo(() => {
    return notifications.filter((n) => !n.read).length;
  }, [notifications]);

  const filteredNotifications = useMemo(() => {
    return notifications.filter((n) => {
      if (categoryFilter === "all") return true;
      if (categoryFilter === "unread") return !n.read;
      return n.category === categoryFilter;
    });
  }, [notifications, categoryFilter]);

  const handleMarkRead = (id: string) => {
    const updated = markNotificationRead(id);
    setNotifications(updated);
  };

  const handleMarkAllRead = () => {
    const updated = markAllNotificationsRead();
    setNotifications(updated);
    toast.success("All placement notifications marked as read.");
  };

  const handleBroadcast = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const title = String(fd.get("title") || "").trim();
    const body = String(fd.get("body") || "").trim();
    const category = (String(fd.get("category") || "system")) as MockNotification["category"];

    if (!title || !body) {
      toast.error("Please enter both title and notification message.");
      return;
    }

    const updated = addMockNotification({
      title,
      body,
      category,
    });

    setNotifications(updated);
    setIsBroadcastOpen(false);
    toast.success("Broadcast notice published across student and recruiter portals!");
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "drive":
        return <CalendarDays className="h-4 w-4 text-accent" />;
      case "interview":
        return <Clock className="h-4 w-4 text-warning" />;
      case "offer":
        return <Award className="h-4 w-4 text-success" />;
      case "application":
        return <FileCheck2 className="h-4 w-4 text-accent" />;
      default:
        return <Bell className="h-4 w-4 text-muted-foreground" />;
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Placement Notifications & Alerts"
        subtitle="Live event stream of drive announcements, interview scheduling reminders, document queues, and broadcast notices."
        action={
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <Button size="sm" variant="outline" onClick={handleMarkAllRead}>
                Mark All as Read ({unreadCount})
              </Button>
            )}
            <Button size="sm" onClick={() => setIsBroadcastOpen(true)} className="gap-1.5 shadow-sm">
              <Megaphone className="h-4 w-4" /> Broadcast Notice
            </Button>
          </div>
        }
      />

      {/* Filter Chips */}
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className="text-muted-foreground flex items-center gap-1">
          <Filter className="h-3.5 w-3.5" /> Filter by:
        </span>
        {[
          { key: "all", label: "All Alerts" },
          { key: "unread", label: `Unread (${unreadCount})` },
          { key: "drive", label: "Drives" },
          { key: "interview", label: "Interviews" },
          { key: "offer", label: "Offers" },
          { key: "application", label: "Applications" },
          { key: "system", label: "System & Alerts" },
        ].map((f) => (
          <button
            key={f.key}
            onClick={() => setCategoryFilter(f.key)}
            className={`rounded-full px-3 py-1 font-medium transition-colors ${
              categoryFilter === f.key
                ? "bg-accent text-accent-foreground font-semibold shadow-xs"
                : "bg-secondary text-muted-foreground hover:bg-muted"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Notifications List */}
      {filteredNotifications.length === 0 ? (
        <Empty>No notifications found in this category.</Empty>
      ) : (
        <div className="space-y-2.5">
          {filteredNotifications.map((n) => (
            <div
              key={n.id}
              onClick={() => !n.read && handleMarkRead(n.id)}
              className={`rounded-xl border p-4 transition-all flex items-start justify-between gap-3 ${
                !n.read
                  ? "bg-card border-accent/40 shadow-xs cursor-pointer hover:border-accent"
                  : "bg-secondary/20 border-border opacity-85"
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5 rounded-lg border bg-background p-2 shrink-0">
                  {getCategoryIcon(n.category)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-foreground">{n.title}</span>
                    {!n.read && (
                      <span className="h-2 w-2 rounded-full bg-accent animate-pulse" />
                    )}
                    <Badge variant="outline" className="text-[10px] uppercase py-0 px-1.5 font-mono">
                      {n.category}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    {n.body}
                  </p>
                  <div className="mt-2 text-[11px] text-muted-foreground/80 flex items-center gap-1 font-mono">
                    <Clock className="h-3 w-3" />
                    {new Date(n.created_at).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })}
                  </div>
                </div>
              </div>

              {!n.read && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 text-xs px-2 shrink-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleMarkRead(n.id);
                  }}
                >
                  Mark Read
                </Button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Broadcast Notice Dialog */}
      <Dialog open={isBroadcastOpen} onOpenChange={setIsBroadcastOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Broadcast Placement Announcement</DialogTitle>
            <DialogDescription className="text-xs">
              Publish an urgent placement notice across student, recruiter, and administration feeds.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleBroadcast} className="space-y-3.5 text-xs pt-1">
            <div>
              <label className="font-medium text-foreground">Notice Title *</label>
              <Input
                name="title"
                placeholder="e.g. Schedule Update: Day 1 Placement Drive timings shifted"
                required
                className="h-9 mt-1 text-xs"
              />
            </div>

            <div>
              <label className="font-medium text-foreground">Alert Category</label>
              <select name="category" className="h-9 w-full rounded-md border bg-card px-2.5 text-xs text-foreground mt-1">
                <option value="drive">Placement Drive Alert</option>
                <option value="interview">Interview Scheduling Alert</option>
                <option value="offer">Offer Letter Announcement</option>
                <option value="system">Institutional Policy Notice</option>
              </select>
            </div>

            <div>
              <label className="font-medium text-foreground">Detailed Notice Body *</label>
              <textarea
                name="body"
                rows={4}
                placeholder="Provide instructions, venue guidelines, reporting time, and mandatory documents required..."
                required
                className="w-full rounded-md border bg-card p-2 text-xs text-foreground mt-1"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsBroadcastOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" size="sm" className="gap-1.5">
                <Send className="h-3.5 w-3.5" /> Publish Broadcast
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
