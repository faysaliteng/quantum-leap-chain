import {
  LayoutDashboard, Users, Link2, Activity, FileText, LogOut, Shield,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useAuth } from "@/lib/auth";
import { CryptoniumpayLogo } from "@/components/CryptoniumpayLogo";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupLabel, SidebarGroupContent,
  SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarHeader, SidebarFooter,
} from "@/components/ui/sidebar";

const nav = [
  { title: "Overview", url: "/admin", icon: LayoutDashboard },
  { title: "Merchants", url: "/admin/merchants", icon: Users },
  { title: "Chains & Assets", url: "/admin/chains", icon: Link2 },
  { title: "Monitoring", url: "/admin/monitoring", icon: Activity },
  { title: "Audit Log", url: "/admin/audit-log", icon: FileText },
];

export function AdminSidebar() {
  const { logout, user } = useAuth();

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-destructive text-destructive-foreground">
            <Shield className="h-4 w-4" />
          </div>
          <span className="text-sm font-display font-semibold group-data-[collapsible=icon]:hidden">Admin Panel</span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Administration</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {nav.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton asChild tooltip={item.title}>
                    <NavLink to={item.url} end={item.url === "/admin"} activeClassName="bg-sidebar-accent text-sidebar-accent-foreground">
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="p-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={logout} tooltip="Logout">
              <LogOut className="h-4 w-4" />
              <span className="text-xs truncate">{user?.email ?? "Logout"}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
