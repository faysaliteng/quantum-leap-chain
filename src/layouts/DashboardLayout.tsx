import { Outlet } from "react-router-dom";
import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import { MerchantSidebar } from "@/components/MerchantSidebar";
import { ThemeToggle } from "@/components/ThemeToggle";
import { NotificationBell } from "@/components/NotificationBell";

export default function DashboardLayout() {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <MerchantSidebar />
        <SidebarInset>
          <header className="flex h-12 items-center border-b px-4 gap-2">
            <SidebarTrigger />
            <span className="text-sm font-medium text-muted-foreground flex-1">Merchant Dashboard</span>
            <NotificationBell />
            <ThemeToggle />
          </header>
          <div className="flex-1 p-6">
            <Outlet />
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
