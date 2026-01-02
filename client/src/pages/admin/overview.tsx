import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import {
  Package,
  ClipboardList,
  Users,
  AlertTriangle,
  Clock,
  CheckCircle2,
  XCircle,
  ArrowRight,
  TrendingUp,
  Activity,
  Zap,
  ShieldCheck
} from "lucide-react";
import { Link } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth";
import type { BorrowRequestWithDetails, Equipment } from "@shared/schema";

interface DashboardStats {
  pendingRequests: number;
  activeBorrows: number;
  totalEquipment: number;
  overdueItems: number;
}

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const item = {
  hidden: { y: 20, opacity: 0 },
  show: { y: 0, opacity: 1 }
};

function StatCard({
  title,
  value,
  icon: Icon,
  description,
  isLoading,
  trend,
  color = "primary"
}: {
  title: string;
  value: number;
  icon: any;
  description: string;
  isLoading: boolean;
  trend?: string;
  color?: "primary" | "orange" | "purple" | "blue";
}) {
  const colors = {
    primary: "from-blue-600/20 to-indigo-600/20 text-blue-600 border-blue-200/50",
    orange: "from-orange-600/20 to-red-600/20 text-orange-600 border-orange-200/50",
    purple: "from-purple-600/20 to-pink-600/20 text-purple-600 border-purple-200/50",
    blue: "from-cyan-600/20 to-blue-600/20 text-cyan-600 border-cyan-200/50",
  };

  return (
    <motion.div variants={item}>
      <Card className="overflow-hidden border-none shadow-xl shadow-neutral-200/50 dark:shadow-none bg-background/60 backdrop-blur-xl group hover:scale-[1.02] transition-all duration-300">
        <div className={cn("absolute inset-0 bg-gradient-to-br opacity-10", colors[color])} />
        <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0 pb-2 relative z-10">
          <CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{title}</CardTitle>
          <div className={cn("p-2 rounded-xl bg-background shadow-sm group-hover:scale-110 transition-transform duration-300", colors[color])}>
            <Icon className="h-4 w-4" />
          </div>
        </CardHeader>
        <CardContent className="relative z-10">
          {isLoading ? (
            <Skeleton className="h-9 w-24 mb-1" />
          ) : (
            <div className="text-3xl font-black tracking-tighter mb-1">{value}</div>
          )}
          <div className="flex items-center gap-2">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-tight">{description}</p>
            {trend && (
              <Badge variant="outline" className="text-[10px] font-black border-none bg-green-500/10 text-green-600 px-1 py-0 h-4">
                {trend}
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const variants: Record<string, { className: string; label: string; icon: any }> = {
    pending: { className: "bg-yellow-500/10 text-yellow-600 border-yellow-200/50", label: "Pending", icon: Clock },
    approved: { className: "bg-green-500/10 text-green-600 border-green-200/50", label: "Approved", icon: CheckCircle2 },
    declined: { className: "bg-red-500/10 text-red-600 border-red-200/50", label: "Declined", icon: XCircle },
    returned: { className: "bg-blue-500/10 text-blue-600 border-blue-200/50", label: "Returned", icon: Package },
  };

  const variant = variants[status] || variants.pending;
  const Icon = variant.icon;

  return (
    <Badge variant="outline" className={cn("text-[10px] font-black uppercase tracking-widest gap-1 py-0.5", variant.className)}>
      <Icon className="h-3 w-3" />
      {variant.label}
    </Badge>
  );
}

export default function AdminOverview() {
  const { user } = useAuth();
  const { data: stats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/admin/stats"],
  });

  const { data: pendingRequests, isLoading: requestsLoading } = useQuery<BorrowRequestWithDetails[]>({
    queryKey: ["/api/borrow-requests", { status: "pending" }],
  });

  const { data: lowStockItems, isLoading: stockLoading } = useQuery<Equipment[]>({
    queryKey: ["/api/equipment/low-stock"],
  });

  return (
    <motion.div
      className="space-y-10"
      initial="hidden"
      animate="show"
      variants={container}
    >
      <motion.div variants={item} className="relative overflow-hidden rounded-[2.5rem] bg-neutral-900 p-8 md:p-12 text-white shadow-2xl">
        <div className="absolute top-0 right-0 -mt-20 -mr-20 h-64 w-64 rounded-full bg-primary/20 blur-[100px]" />
        <div className="absolute bottom-0 left-0 -mb-20 -ml-20 h-64 w-64 rounded-full bg-purple-600/20 blur-[100px]" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 backdrop-blur-md border border-white/10 shadow-lg">
              <ShieldCheck className="h-4 w-4 text-primary" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/80">Administrator Portal</span>
            </div>
            <div>
              <h1 className="text-4xl md:text-5xl font-black tracking-tighter">
                Welcome back, <span className="bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent">{user?.name?.split(' ')[0]}</span>
              </h1>
              <p className="mt-2 text-lg text-white/50 font-medium">
                Here's what's happening with the inventory today.
              </p>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="h-16 w-[1px] bg-white/10 hidden md:block" />
            <div className="flex flex-col justify-center">
              <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">Platform Status</span>
              <div className="mt-1 flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.5)]" />
                <span className="font-bold text-sm">System Operational</span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Awaiting Review"
          value={stats?.pendingRequests || 0}
          icon={Clock}
          description="Pending approvals"
          isLoading={statsLoading}
          color="orange"
        />
        <StatCard
          title="In Circulation"
          value={stats?.activeBorrows || 0}
          icon={Activity}
          description="Active borrowings"
          isLoading={statsLoading}
          color="primary"
        />
        <StatCard
          title="Total Assets"
          value={stats?.totalEquipment || 0}
          icon={Package}
          description="Inventory items"
          isLoading={statsLoading}
          color="purple"
        />
        <StatCard
          title="Overdue Alerts"
          value={stats?.overdueItems || 0}
          icon={AlertTriangle}
          description="Action required"
          isLoading={statsLoading}
          color="blue"
        />
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <motion.div variants={item}>
          <Card className="border-none shadow-xl shadow-neutral-200/50 dark:shadow-none bg-background/60 backdrop-blur-xl rounded-[2rem] overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between border-b border-neutral-100 dark:border-neutral-800 pb-6">
              <div>
                <CardTitle className="text-xl font-black tracking-tight">Recent Requests</CardTitle>
                <CardDescription className="text-xs font-bold uppercase tracking-widest opacity-60">Pending approval</CardDescription>
              </div>
              <Button variant="ghost" className="h-9 w-9 rounded-xl hover:bg-primary/10 transition-colors" asChild>
                <Link href="/admin/requests">
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent className="pt-6">
              {requestsLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-20 w-full rounded-2xl" />
                  ))}
                </div>
              ) : !pendingRequests || pendingRequests.length === 0 ? (
                <div className="py-12 text-center rounded-[2rem] border-2 border-dashed border-neutral-100 dark:border-neutral-800">
                  <div className="mx-auto h-16 w-16 rounded-2xl bg-green-500/10 flex items-center justify-center mb-4">
                    <CheckCircle2 className="h-8 w-8 text-green-500" />
                  </div>
                  <p className="font-black text-sm uppercase tracking-widest text-muted-foreground opacity-60">
                    All caught up!
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {pendingRequests.slice(0, 4).map((request) => (
                    <div
                      key={request.id}
                      className="group flex items-center justify-between rounded-2xl border border-neutral-100 dark:border-neutral-800 p-4 transition-all duration-300 hover:border-primary/50 hover:bg-primary/5 hover:translate-x-1"
                      data-testid={`pending-request-${request.id}`}
                    >
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center font-black text-sm text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                          {request.user?.name?.[0]}
                        </div>
                        <div className="space-y-0.5 min-w-0">
                          <p className="font-black text-sm tracking-tight truncate">{request.user?.name}</p>
                          <p className="text-[10px] font-bold text-muted-foreground uppercase truncate">
                            {request.equipment?.name} <span className="text-primary italic opacity-60">({request.quantity}x)</span>
                          </p>
                        </div>
                      </div>
                      <StatusBadge status={request.status} />
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={item}>
          <Card className="border-none shadow-xl shadow-neutral-200/50 dark:shadow-none bg-background/60 backdrop-blur-xl rounded-[2rem] overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between border-b border-neutral-100 dark:border-neutral-800 pb-6">
              <div>
                <CardTitle className="text-xl font-black tracking-tight">Stock Alerts</CardTitle>
                <CardDescription className="text-xs font-bold uppercase tracking-widest opacity-60">Low availability</CardDescription>
              </div>
              <Button variant="ghost" className="h-9 w-9 rounded-xl hover:bg-primary/10 transition-colors" asChild>
                <Link href="/admin/inventory">
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent className="pt-6">
              {stockLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-20 w-full rounded-2xl" />
                  ))}
                </div>
              ) : !lowStockItems || lowStockItems.length === 0 ? (
                <div className="py-12 text-center rounded-[2rem] border-2 border-dashed border-neutral-100 dark:border-neutral-800">
                  <div className="mx-auto h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                    <Package className="h-8 w-8 text-primary" />
                  </div>
                  <p className="font-black text-sm uppercase tracking-widest text-muted-foreground opacity-60">
                    Inventory is stable
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {lowStockItems.slice(0, 4).map((item) => (
                    <div
                      key={item.id}
                      className="group flex items-center justify-between rounded-2xl border border-neutral-100 dark:border-neutral-800 p-4 transition-all duration-300 hover:border-orange-500/50 hover:bg-orange-500/5 hover:translate-x-1"
                      data-testid={`low-stock-${item.id}`}
                    >
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-xl bg-orange-500/10 flex items-center justify-center group-hover:bg-orange-500 transition-colors">
                          <AlertTriangle className="h-5 w-5 text-orange-600 group-hover:text-white" />
                        </div>
                        <div className="space-y-0.5 min-w-0">
                          <p className="font-black text-sm tracking-tight truncate">{item.name}</p>
                          <p className="text-[10px] font-bold text-muted-foreground uppercase">{item.category}</p>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-[10px] font-black uppercase tracking-widest bg-orange-500/10 text-orange-600 border-orange-200/50">
                        {item.availableQuantity} left
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
}
