import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { format } from "date-fns";
import { 
  CheckCircle2, 
  XCircle, 
  Clock,
  Package,
  User,
  Calendar,
  Loader2,
  RotateCcw
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { BorrowRequestWithDetails } from "@shared/schema";

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

interface ActionDialogProps {
  request: BorrowRequestWithDetails | null;
  action: "approve" | "decline" | "return" | null;
  onClose: () => void;
}

function ActionDialog({ request, action, onClose }: ActionDialogProps) {
  const [notes, setNotes] = useState("");
  const { toast } = useToast();

  const mutation = useMutation({
    mutationFn: async () => {
      if (!request || !action) return;
      return apiRequest("PATCH", `/api/borrow-requests/${request.id}/${action}`, { notes });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/borrow-requests"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/equipment"] });
      toast({
        title: action === "approve" ? "Request Approved" : 
               action === "decline" ? "Request Declined" : 
               "Return Recorded",
        description: "The borrower will be notified via email.",
      });
      onClose();
      setNotes("");
    },
    onError: (error) => {
      toast({
        title: "Action failed",
        description: error instanceof Error ? error.message : "Could not complete action",
        variant: "destructive",
      });
    },
  });

  const titles = {
    approve: "Approve Request",
    decline: "Decline Request",
    return: "Record Return",
  };

  const descriptions = {
    approve: "The borrower will be notified that their request has been approved.",
    decline: "The borrower will be notified that their request has been declined.",
    return: "Mark this item as returned and update inventory.",
  };

  return (
    <Dialog open={!!request && !!action} onOpenChange={() => onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{action ? titles[action] : ""}</DialogTitle>
          <DialogDescription>{action ? descriptions[action] : ""}</DialogDescription>
        </DialogHeader>

        {request && (
          <div className="space-y-4">
            <div className="rounded-lg border p-4 space-y-2">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">{request.user?.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4 text-muted-foreground" />
                <span>{request.equipment?.name} ({request.quantity}x)</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  {format(new Date(request.borrowDate), "MMM d, yyyy")} - {format(new Date(request.expectedReturnDate), "MMM d, yyyy")}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                placeholder="Add any notes..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                data-testid="input-action-notes"
              />
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose} data-testid="button-cancel-action">
            Cancel
          </Button>
          <Button
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending}
            variant={action === "decline" ? "destructive" : "default"}
            data-testid="button-confirm-action"
          >
            {mutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : action === "approve" ? (
              <>
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Approve
              </>
            ) : action === "decline" ? (
              <>
                <XCircle className="mr-2 h-4 w-4" />
                Decline
              </>
            ) : (
              <>
                <RotateCcw className="mr-2 h-4 w-4" />
                Record Return
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function RequestCard({ 
  request, 
  onAction 
}: { 
  request: BorrowRequestWithDetails;
  onAction: (request: BorrowRequestWithDetails, action: "approve" | "decline" | "return") => void;
}) {
  const isPending = request.status === "pending";
  const isApproved = request.status === "approved";

  return (
    <div 
      className="rounded-lg border p-4 space-y-4"
      data-testid={`request-card-${request.id}`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium">{request.user?.name}</span>
            <StatusBadge status={request.status} />
          </div>
          <p className="text-sm text-muted-foreground">{request.user?.email}</p>
          {request.user?.studentId && (
            <p className="text-sm text-muted-foreground">ID: {request.user.studentId}</p>
          )}
        </div>
      </div>

      <div className="rounded-md bg-muted/50 p-3 space-y-2">
        <div className="flex items-center gap-2">
          <Package className="h-4 w-4 text-muted-foreground shrink-0" />
          <span className="font-medium">{request.equipment?.name}</span>
          <Badge variant="secondary" className="ml-auto">
            {request.quantity}x
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground pl-6">{request.purpose}</p>
      </div>

      <div className="flex items-center gap-4 text-sm text-muted-foreground">
        <div className="flex items-center gap-1">
          <Calendar className="h-4 w-4" />
          <span>Borrow: {format(new Date(request.borrowDate), "MMM d, yyyy")}</span>
        </div>
        <div className="flex items-center gap-1">
          <Clock className="h-4 w-4" />
          <span>Return: {format(new Date(request.expectedReturnDate), "MMM d, yyyy")}</span>
        </div>
      </div>

      {(isPending || isApproved) && (
        <div className="flex gap-2 pt-2 border-t">
          {isPending && (
            <>
              <Button 
                size="sm"
                onClick={() => onAction(request, "approve")}
                data-testid="button-approve"
              >
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Approve
              </Button>
              <Button 
                size="sm" 
                variant="destructive"
                onClick={() => onAction(request, "decline")}
                data-testid="button-decline"
              >
                <XCircle className="mr-2 h-4 w-4" />
                Decline
              </Button>
            </>
          )}
          {isApproved && (
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => onAction(request, "return")}
              data-testid="button-return"
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              Record Return
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

export default function AdminRequests() {
  const [activeTab, setActiveTab] = useState("pending");
  const [actionDialog, setActionDialog] = useState<{
    request: BorrowRequestWithDetails | null;
    action: "approve" | "decline" | "return" | null;
  }>({ request: null, action: null });

  const { data: requests, isLoading } = useQuery<BorrowRequestWithDetails[]>({
    queryKey: ["/api/borrow-requests"],
  });

  const filteredRequests = requests?.filter(r => {
    if (activeTab === "all") return true;
    return r.status === activeTab;
  }) || [];

  const handleAction = (request: BorrowRequestWithDetails, action: "approve" | "decline" | "return") => {
    setActionDialog({ request, action });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Borrow Requests</h1>
        <p className="text-muted-foreground">
          Manage equipment borrowing requests
        </p>
      </div>

      <Card>
        <CardHeader>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="pending" data-testid="tab-pending">
                Pending
                {requests && (
                  <Badge variant="secondary" className="ml-2">
                    {requests.filter(r => r.status === "pending").length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="approved" data-testid="tab-approved">Approved</TabsTrigger>
              <TabsTrigger value="declined" data-testid="tab-declined">Declined</TabsTrigger>
              <TabsTrigger value="returned" data-testid="tab-returned">Returned</TabsTrigger>
              <TabsTrigger value="all" data-testid="tab-all">All</TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-40 w-full" />
              ))}
            </div>
          ) : filteredRequests.length === 0 ? (
            <div className="py-12 text-center">
              <Package className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <p className="mt-2 text-muted-foreground">
                No {activeTab === "all" ? "" : activeTab} requests found.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredRequests.map((request) => (
                <RequestCard 
                  key={request.id} 
                  request={request} 
                  onAction={handleAction}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <ActionDialog
        request={actionDialog.request}
        action={actionDialog.action}
        onClose={() => setActionDialog({ request: null, action: null })}
      />
    </div>
  );
}
