import { Link, useLocation } from "wouter";
import {
  LayoutDashboard,
  Package,
  ClipboardList,
  FileText,
  Wrench,
  LogOut
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
  SidebarFooter,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";

const menuItems = [
  {
    title: "Overview",
    url: "/admin",
    icon: LayoutDashboard,
  },
  {
    title: "Borrow Requests",
    url: "/admin/requests",
    icon: ClipboardList,
  },
  {
    title: "Inventory",
    url: "/admin/inventory",
    icon: Package,
  },
  {
    title: "Borrower Records",
    url: "/admin/records",
    icon: FileText,
  },
];

export function AdminSidebar() {
  const [location] = useLocation();
  const { user, logout } = useAuth();

  return (
    <Sidebar className="border-r-0 bg-neutral-50 dark:bg-[#0a0a0a]">
      <SidebarHeader className="h-16 border-b px-6 flex items-center justify-start bg-background/60 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary shadow-lg shadow-primary/20">
            <Wrench className="h-5 w-5 text-primary-foreground" />
          </div>
          <div className="flex flex-col">
            <span className="font-black text-sm tracking-tight">ToolLedger</span>
            <span className="text-[10px] font-bold uppercase tracking-widest text-primary/70">Admin</span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-3 py-4">
        <SidebarGroup>
          <SidebarGroupLabel className="px-3 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/50 mb-4">
            Management
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-2">
              {menuItems.map((item) => {
                const isActive = location === item.url ||
                  (item.url !== "/admin" && location.startsWith(item.url));

                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      className={cn(
                        "h-11 px-3 rounded-xl transition-all duration-200",
                        isActive
                          ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20 hover:bg-primary/90"
                          : "hover:bg-primary/10 hover:text-primary"
                      )}
                      data-testid={`nav-${item.title.toLowerCase().replace(" ", "-")}`}
                    >
                      <Link href={item.url} className="flex items-center gap-3">
                        <item.icon className={cn("h-4 w-4", isActive ? "text-primary-foreground" : "text-primary")} />
                        <span className="font-bold text-sm tracking-tight">{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t p-4 bg-background/40">
        <div className="flex items-center justify-between gap-3 px-2">
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-primary to-purple-600 flex items-center justify-center text-white font-black text-xs shadow-md">
              {user?.name?.[0].toUpperCase()}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-black truncate">{user?.name}</span>
              <span className="text-[10px] text-muted-foreground font-bold truncate opacity-60 uppercase">{user?.email}</span>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-full hover:bg-destructive/10 hover:text-destructive transition-colors shrink-0"
            onClick={logout}
            data-testid="button-admin-logout"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
