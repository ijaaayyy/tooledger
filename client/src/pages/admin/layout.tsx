import { Switch, Route } from "wouter";
import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import { AdminSidebar } from "@/components/admin-sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import AdminOverview from "./overview";
import AdminRequests from "./requests";
import AdminInventory from "./inventory";
import AdminRecords from "./records";

export default function AdminLayout() {
  const style = {
    "--sidebar-width": "18rem",
    "--sidebar-width-icon": "4rem",
  };

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex min-h-screen w-full bg-neutral-50 dark:bg-[#0a0a0a] transition-colors duration-500">
        <AdminSidebar />
        <SidebarInset className="flex flex-col flex-1 overflow-hidden">
          <header className="sticky top-0 z-[100] flex h-16 items-center justify-between gap-4 border-b bg-background/60 backdrop-blur-xl supports-[backdrop-filter]:bg-background/40 px-6">
            <div className="flex items-center gap-4">
              <SidebarTrigger className="h-9 w-9 rounded-full hover:bg-primary/10 transition-colors" data-testid="button-admin-sidebar-toggle" />
              <div className="h-4 w-[1px] bg-neutral-200 dark:bg-neutral-800" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground hidden sm:block">
                Admin Management Portal
              </span>
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle />
            </div>
          </header>
          <main className="flex-1 p-6 lg:p-10 overflow-auto">
            <Switch>
              <Route path="/admin" component={AdminOverview} />
              <Route path="/admin/overview" component={AdminOverview} />
              <Route path="/admin/requests" component={AdminRequests} />
              <Route path="/admin/inventory" component={AdminInventory} />
              <Route path="/admin/records" component={AdminRecords} />
            </Switch>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
