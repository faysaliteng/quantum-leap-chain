import {
  LayoutDashboard, Users, Link2, Activity, FileText, LogOut, Shield,
  Percent, DollarSign, Newspaper, Megaphone, HelpCircle, Settings, FileEdit,
  Mail, Share2, Wallet, Bell, History, ShieldCheck, UserCog, FileSpreadsheet, Brain, Terminal,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useAuth } from "@/lib/auth";
import { CryptoniumpayLogo } from "@/components/CryptoniumpayLogo";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupLabel, SidebarGroupContent,
  SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarHeader, SidebarFooter,
} from "@/components/ui/sidebar";

const adminNav = [
  { title: "Overview", url: "/admin", icon: LayoutDashboard },
  { title: "Revenue", url: "/admin/revenue", icon: DollarSign },
  { title: "Fee Management", url: "/admin/fees", icon: Percent },
  { title: "Merchants", url: "/admin/merchants", icon: Users },
  { title: "Chains & Assets", url: "/admin/chains", icon: Link2 },
  { title: "Wallets", url: "/admin/wallets", icon: Wallet },
  { title: "Wallet Audit", url: "/admin/wallets/transactions", icon: History },
  { title: "Monitoring", url: "/admin/monitoring", icon: Activity },
  { title: "Audit Log", url: "/admin/audit-log", icon: FileText },
  { title: "Security Policies", url: "/admin/security-policies", icon: ShieldCheck },
  { title: "Roles & Permissions", url: "/admin/roles", icon: UserCog },
  { title: "Notifications", url: "/admin/notifications", icon: Bell },
  { title: "Exports", url: "/admin/exports", icon: FileSpreadsheet },
  { title: "Intelligence", url: "/admin/intelligence", icon: Brain },
  { title: "API Settings", url: "/admin/api-settings", icon: Terminal },
];

const cmsNav = [
  { title: "Content Overview", url: "/admin/cms", icon: FileEdit },
  { title: "Pages", url: "/admin/cms/pages", icon: FileText },
  { title: "Blog Posts", url: "/admin/cms/blog", icon: Newspaper },
  { title: "Announcements", url: "/admin/cms/announcements", icon: Megaphone },
  { title: "FAQ", url: "/admin/cms/faq", icon: HelpCircle },
  { title: "Contact Inbox", url: "/admin/cms/contacts", icon: Mail },
  { title: "Social Links", url: "/admin/cms/social", icon: Share2 },
  { title: "CMS Settings", url: "/admin/cms/settings", icon: Settings },
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
              {adminNav.map((item) => (
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

        <SidebarGroup>
          <SidebarGroupLabel>Content Management</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {cmsNav.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton asChild tooltip={item.title}>
                    <NavLink to={item.url} end={item.url === "/admin/cms"} activeClassName="bg-sidebar-accent text-sidebar-accent-foreground">
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
