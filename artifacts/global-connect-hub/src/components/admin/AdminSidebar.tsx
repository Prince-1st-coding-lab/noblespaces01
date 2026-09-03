import { NavLink, useLocation } from "react-router-dom";
import {
  Bell,
  CalendarCheck,
  FileText,
  Image,
  LayoutDashboard,
  MessageSquare,
  Quote,
  Receipt,
  Settings,
  ShoppingBag,
  Sparkles,
  Star,
  Tags,

} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  useSidebar,
} from "@/components/ui/sidebar";

type Item = { title: string; url: string; icon: typeof LayoutDashboard };

const GROUPS: { label: string; items: Item[] }[] = [
  {
    label: "Overview",
    items: [
      { title: "Dashboard", url: "/admin", icon: LayoutDashboard },
      { title: "Notifications", url: "/admin/notifications", icon: Bell },
    ],
  },
  {
    label: "Operations",
    items: [
      { title: "Bookings", url: "/admin/bookings", icon: CalendarCheck },
      { title: "Orders", url: "/admin/orders", icon: Receipt },
      { title: "Quotations", url: "/admin/quotes", icon: Quote },
      { title: "Messages", url: "/admin/messages", icon: MessageSquare },
    ],
  },
  {
    label: "Catalogue",
    items: [
      { title: "Services", url: "/admin/services", icon: Sparkles },
      { title: "Service photos", url: "/admin/photos", icon: Image },
      { title: "Products", url: "/admin/products", icon: ShoppingBag },
      { title: "Categories", url: "/admin/categories", icon: Tags },
    ],
  },
  {
    label: "Content",
    items: [
      { title: "Journal", url: "/admin/blog", icon: FileText },
      { title: "Testimonials", url: "/admin/testimonials", icon: Star },
    ],
  },
  {
    label: "System",
    items: [{ title: "Settings", url: "/admin/settings", icon: Settings }],
  },
];


export const AdminSidebar = () => {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const { pathname } = useLocation();

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border px-3 py-5">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-sidebar-primary/45 font-display text-lg text-sidebar-primary">N</div>
          {!collapsed && (
            <div className="min-w-0">
              <p className="truncate font-display text-lg leading-none">Noble Spaces</p>
              <p className="mt-1 font-mono text-[9px] uppercase tracking-[0.18em] text-sidebar-foreground/55">Operations desk</p>
            </div>
          )}
        </div>
      </SidebarHeader>
      <SidebarContent>
        {GROUPS.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => {
                  const active =
                    item.url === "/admin" ? pathname === "/admin" : pathname.startsWith(item.url);
                  return (
                    <SidebarMenuItem key={item.url}>
                      <SidebarMenuButton asChild isActive={active} tooltip={item.title}>
                        <NavLink to={item.url} end={item.url === "/admin"} className="flex items-center gap-2">
                          <item.icon className="h-4 w-4" />
                          {!collapsed && <span>{item.title}</span>}
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
    </Sidebar>
  );
};
