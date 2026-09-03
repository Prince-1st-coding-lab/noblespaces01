import { Outlet, Link } from "react-router-dom";
import { LogOut, ExternalLink } from "lucide-react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AdminGuard } from "@/components/admin/AdminGuard";
import { NotificationBell } from "@/components/admin/NotificationBell";
import { supabase } from "@/integrations/supabase/client";

const AdminLayout = () => (
  <AdminGuard>
    <SidebarProvider>
      <div className="noise flex min-h-[100dvh] w-full bg-background text-foreground">
        <AdminSidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-20 flex min-h-16 items-center gap-3 border-b border-gold/15 bg-background/90 px-4 backdrop-blur-xl md:px-7">
            <SidebarTrigger className="text-gold" aria-label="Toggle admin navigation" />
            <Link to="/admin" className="focus-ring group flex items-baseline gap-2" aria-label="Noble Spaces admin dashboard">
              <span className="font-display text-xl leading-none">Noble Spaces</span>
              <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-gold transition-colors group-hover:text-gold-soft">Admin</span>
            </Link>
            <div className="ml-auto flex items-center gap-1 sm:gap-2">
              <NotificationBell />
              <Button asChild variant="ghost" size="sm">
                <a href="/" target="_blank" rel="noreferrer" className="hidden sm:inline-flex">
                  <ExternalLink className="mr-1.5 h-4 w-4" /> View site
                </a>
              </Button>
              <Button variant="outline" size="sm" onClick={() => supabase.auth.signOut()} className="border-gold/25">
                <LogOut className="mr-1.5 h-4 w-4" /> <span className="hidden sm:inline">Sign out</span>
              </Button>
            </div>
          </header>
          <main className="min-w-0 flex-1 bg-[radial-gradient(circle_at_top_right,hsl(var(--gold)/0.07),transparent_32rem)] p-4 md:p-7 lg:p-9">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  </AdminGuard>
);

export default AdminLayout;
