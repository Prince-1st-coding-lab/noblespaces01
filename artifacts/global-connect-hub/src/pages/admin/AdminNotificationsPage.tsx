import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { Link } from "react-router-dom";
import { useNotifications } from "@/hooks/useNotifications";
import { EmptyState, PageHeader } from "@/components/admin/AdminUi";

const AdminNotificationsPage = () => {
  const { items, unread, markRead } = useNotifications();

  return (
    <>
      <PageHeader
        title="Notifications"
        description="Everything that happened on your website."
        action={
          unread.length > 0 ? (
            <Button variant="outline" size="sm" onClick={() => markRead(unread.map((n) => n.id))}>
              <Check className="mr-1.5 h-4 w-4" /> Mark all read
            </Button>
          ) : undefined
        }
      />
      {!items.length ? (
        <EmptyState text="No notifications yet." />
      ) : (
        <div className="grid gap-2">
          {items.map((n) => (
            <div
              key={n.id}
              className={`rounded-lg border border-gold/20 bg-card p-3 text-sm ${n.read_at ? "opacity-60" : ""}`}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-medium">{n.title}</span>
                <span className="text-xs text-muted-foreground">
                  {new Date(n.created_at).toLocaleString()}
                </span>
              </div>
              {n.body && <p className="text-xs text-muted-foreground">{n.body}</p>}
              {n.link && (
                <Button asChild size="sm" variant="ghost" className="mt-1 h-7 px-2 text-xs">
                  <Link to={n.link} onClick={() => !n.read_at && markRead([n.id])}>
                    Open
                  </Link>
                </Button>
              )}
            </div>
          ))}
        </div>
      )}
    </>
  );
};

export default AdminNotificationsPage;
