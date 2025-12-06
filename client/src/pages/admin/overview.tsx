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
  ArrowRight
} from "lucide-react";
import { Link } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import type { BorrowRequestWithDetails, Equipment } from "@shared/schema";

interface DashboardStats {
  pendingRequests: number;
  activeBorrows: number;
  totalEquipment: number;
  overdueItems: number;
}

function StatCard({ 
  title, 
  value, 
  icon: Icon, 
  description,
  isLoading 
}: { 
  title: string; 
  value: number; 
  icon: typeof Package;
  description: string;
  isLoading: boolean;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-8 w-16" />
        ) : (
          <div className="text-2xl font-bold">{value}</div>
        )}
        <p className="text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}

function StatusBadge({ status }: { status: string }) {
  const variants: Record<string, { className: string; label: string }> = {
    pending: { className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400", label: "Pending" },
    approved: { className: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400", label: "Approved" },
    declined: { className: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400", label: "Declined" },
    returned: { className: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400", label: "Returned" },
  };
  
  const variant = variants[status] || variants.pending;
  
  return (
    <Badge variant="outline" className={variant.className}>
      {variant.label}
    </Badge>
  );
}

export default function AdminOverview() {
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
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Overview of equipment borrowing activity
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Pending Requests"
          value={stats?.pendingRequests || 0}
          icon={Clock}
          description="Awaiting approval"
          isLoading={statsLoading}
        />
        <StatCard
          title="Active Borrows"
          value={stats?.activeBorrows || 0}
          icon={ClipboardList}
          description="Currently borrowed"
          isLoading={statsLoading}
        />
        <StatCard
          title="Total Equipment"
          value={stats?.totalEquipment || 0}
          icon={Package}
          description="Items in inventory"
          isLoading={statsLoading}
        />
        <StatCard
          title="Overdue Items"
          value={stats?.overdueItems || 0}
          icon={AlertTriangle}
          description="Past return date"
          isLoading={statsLoading}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-4">
            <div>
              <CardTitle>Pending Requests</CardTitle>
              <CardDescription>Requests awaiting your approval</CardDescription>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href="/admin/requests">
                View All
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {requestsLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : !pendingRequests || pendingRequests.length === 0 ? (
              <div className="py-8 text-center">
                <CheckCircle2 className="mx-auto h-12 w-12 text-green-500/50" />
                <p className="mt-2 text-sm text-muted-foreground">
                  All caught up! No pending requests.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {pendingRequests.slice(0, 4).map((request) => (
                  <div
                    key={request.id}
                    className="flex items-center justify-between rounded-lg border p-3"
                    data-testid={`pending-request-${request.id}`}
                  >
                    <div className="space-y-1 min-w-0">
                      <p className="font-medium truncate">{request.user?.name}</p>
                      <p className="text-sm text-muted-foreground truncate">
                        {request.equipment?.name} ({request.quantity}x)
                      </p>
                    </div>
                    <StatusBadge status={request.status} />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-4">
            <div>
              <CardTitle>Low Stock Alert</CardTitle>
              <CardDescription>Equipment running low on availability</CardDescription>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href="/admin/inventory">
                Manage
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {stockLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : !lowStockItems || lowStockItems.length === 0 ? (
              <div className="py-8 text-center">
                <Package className="mx-auto h-12 w-12 text-muted-foreground/50" />
                <p className="mt-2 text-sm text-muted-foreground">
                  All equipment has sufficient stock.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {lowStockItems.slice(0, 4).map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between rounded-lg border p-3"
                    data-testid={`low-stock-${item.id}`}
                  >
                    <div className="space-y-1 min-w-0">
                      <p className="font-medium truncate">{item.name}</p>
                      <p className="text-sm text-muted-foreground">{item.category}</p>
                    </div>
                    <Badge variant="outline" className="bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400">
                      {item.availableQuantity} left
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
