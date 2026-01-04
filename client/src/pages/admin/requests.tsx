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
  RotateCcw,
  Search,
  Filter,
  ArrowRight,
  Info,
  Mail,
  Fingerprint,
  ClipboardList,
  Trash2
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
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import type { BorrowRequestWithDetails } from "@shared/schema";

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
    <Badge variant="outline" className={cn("text-[10px] font-black uppercase tracking-widest gap-1 py-1 px-3 rounded-full", variant.className)}>
      <Icon className="h-3 w-3" />
      {variant.label}
    </Badge>
  );
}

interface ActionDialogProps {
  request: BorrowRequestWithDetails | null;
  action: "approve" | "decline" | "return" | null;
  onClose: () => void;
}

interface DeleteDialogProps {
  request: BorrowRequestWithDetails | null;
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
    onSuccess: async () => {
      await Promise.all([
        queryClient.refetchQueries({ queryKey: ["/api/borrow-requests"] }),
        queryClient.refetchQueries({ queryKey: ["/api/admin/stats"] }),
        queryClient.refetchQueries({ queryKey: ["/api/equipment"] })
      ]);
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
    approve: "The borrower will receive an email confirmation for this approval.",
    decline: "Please provide a reason if possible for the borrower.",
    return: "This will update the inventory stock and mark the request as returned.",
  };

  return (
    <Dialog open={!!request && !!action} onOpenChange={() => onClose()}>
      <DialogContent className="sm:max-w-[425px] rounded-[2rem] border-none shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-black tracking-tight">{action ? titles[action] : ""}</DialogTitle>
          <DialogDescription className="text-sm font-medium opacity-60">{action ? descriptions[action] : ""}</DialogDescription>
        </DialogHeader>

        {request && (
          <div className="space-y-6 pt-4">
            <div className="rounded-2xl bg-neutral-50 dark:bg-neutral-900 p-5 space-y-3 border border-neutral-100 dark:border-neutral-800">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center font-black text-xs text-primary">
                  {request.user?.name?.[0]}
                </div>
                <span className="font-bold tracking-tight">{request.user?.name}</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-muted-foreground font-medium">
                <Package className="h-4 w-4 opacity-50" />
                <span>{request.equipment?.name} <span className="text-primary">({request.quantity}x)</span></span>
              </div>
              <div className="flex items-center gap-3 text-sm text-muted-foreground font-medium">
                <Calendar className="h-4 w-4 opacity-50" />
                <span>
                  {format(new Date(request.borrowDate), "MMM d, yyyy")}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Internal Notes / Feedback</Label>
              <Textarea
                id="notes"
                placeholder="Write your notes here..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="rounded-2xl bg-neutral-50 dark:bg-neutral-900 border-neutral-100 dark:border-neutral-800 focus-visible:ring-primary h-24 shadow-inner"
                data-testid="input-action-notes"
              />
            </div>
          </div>
        )}

        <DialogFooter className="pt-4 gap-2">
          <Button variant="ghost" onClick={onClose} className="rounded-xl font-bold uppercase tracking-widest text-[10px]" data-testid="button-cancel-action">
            Cancel
          </Button>
          <Button
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending}
            variant={action === "decline" ? "destructive" : "default"}
            className={cn(
              "rounded-xl font-black uppercase tracking-widest text-[10px] h-11 px-8 shadow-lg transition-all",
              action === "approve" ? "bg-primary shadow-primary/20 hover:scale-105" :
                action === "return" ? "bg-blue-600 shadow-blue-500/20 hover:scale-105" : ""
            )}
            data-testid="button-confirm-action"
          >
            {mutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : action === "approve" ? (
              "Confirm Approval"
            ) : action === "decline" ? (
              "Decline Request"
            ) : (
              "Confirm Return"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function DeleteDialog({ request, onClose }: DeleteDialogProps) {
  const { toast } = useToast();

  const mutation = useMutation({
    mutationFn: async () => {
      if (!request) return;
      return apiRequest("DELETE", `/api/borrow-requests/${request.id}`);
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.refetchQueries({ queryKey: ["/api/borrow-requests"] }),
        queryClient.refetchQueries({ queryKey: ["/api/admin/stats"] }),
        queryClient.refetchQueries({ queryKey: ["/api/equipment"] })
      ]);
      toast({
        title: "Request Deleted",
        description: "The borrow request has been permanently removed.",
      });
      onClose();
    },
    onError: (error) => {
      toast({
        title: "Deletion failed",
        description: error instanceof Error ? error.message : "Could not delete request",
        variant: "destructive",
      });
    },
  });

  return (
    <Dialog open={!!request} onOpenChange={() => onClose()}>
      <DialogContent className="sm:max-w-[425px] rounded-[2rem] border-none shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-black tracking-tight text-destructive">Delete Request</DialogTitle>
          <DialogDescription className="text-sm font-medium opacity-60">This action cannot be undone. The request will be permanently deleted.</DialogDescription>
        </DialogHeader>

        {request && (
          <div className="space-y-4 pt-4">
            <div className="rounded-2xl bg-destructive/5 dark:bg-destructive/10 p-5 space-y-3 border border-destructive/20">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-destructive/10 flex items-center justify-center font-black text-xs text-destructive">
                  {request.user?.name?.[0]}
                </div>
                <span className="font-bold tracking-tight">{request.user?.name}</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-muted-foreground font-medium">
                <Package className="h-4 w-4 opacity-50" />
                <span>{request.equipment?.name} <span className="text-destructive">({request.quantity}x)</span></span>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-3">
              <Info className="h-4 w-4 text-yellow-600" />
              <span>If this request was approved, the equipment quantity will be restored.</span>
            </div>
          </div>
        )}

        <DialogFooter className="pt-4 gap-2">
          <Button variant="ghost" onClick={onClose} className="rounded-xl font-bold uppercase tracking-widest text-[10px]" data-testid="button-cancel-delete">
            Cancel
          </Button>
          <Button
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending}
            variant="destructive"
            className="rounded-xl font-black uppercase tracking-widest text-[10px] h-11 px-8 shadow-lg transition-all hover:scale-105"
            data-testid="button-confirm-delete"
          >
            {mutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Permanently
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
  onAction,
  onDelete
}: {
  request: BorrowRequestWithDetails;
  onAction: (request: BorrowRequestWithDetails, action: "approve" | "decline" | "return") => void;
  onDelete: (request: BorrowRequestWithDetails) => void;
}) {
  const isPending = request.status === "pending";
  const isApproved = request.status === "approved";

  return (
    <motion.div
      variants={item}
      className="group rounded-[2rem] border-none bg-background shadow-xl shadow-neutral-200/50 dark:shadow-none p-6 space-y-6 transition-all duration-300 hover:scale-[1.01] hover:shadow-2xl hover:shadow-primary/5"
      data-testid={`request-card-${request.id}`}
    >
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div className="flex gap-4 flex-1">
          <div className="h-14 w-14 rounded-[1.25rem] bg-gradient-to-tr from-neutral-100 to-neutral-50 dark:from-neutral-800 dark:to-neutral-900 flex items-center justify-center font-black text-xl text-primary border border-neutral-200/50 dark:border-neutral-700/50 group-hover:scale-110 transition-transform">
            {request.user?.name?.[0].toUpperCase()}
          </div>
          <div className="space-y-1 min-w-0">
            <div className="flex items-center gap-3">
              <h3 className="font-black text-lg tracking-tight truncate">{request.user?.name}</h3>
              <StatusBadge status={request.status} />
            </div>
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase opacity-60 tracking-tight">
                <Mail className="h-3 w-3" />
                {request.user?.email}
              </div>
              {request.user?.studentId && (
                <div className="flex items-center gap-2 text-xs font-black text-primary/80 uppercase tracking-[0.05em]">
                  <Fingerprint className="h-3 w-3" />
                  ID: {request.user.studentId}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex gap-2 shrink-0 self-end md:self-auto">
          {isPending && (
            <>
              <Button
                size="sm"
                className="rounded-xl h-10 px-4 font-black uppercase tracking-widest text-[10px] bg-primary shadow-lg shadow-primary/20 hover:scale-105 transition-transform"
                onClick={() => onAction(request, "approve")}
                data-testid="button-approve"
              >
                <CheckCircle2 className="mr-2 h-3 w-3" />
                Approve
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="rounded-xl h-10 px-4 font-black uppercase tracking-widest text-[10px] text-destructive hover:bg-destructive/10 hover:text-destructive"
                onClick={() => onAction(request, "decline")}
                data-testid="button-decline"
              >
                <XCircle className="mr-2 h-3 w-3" />
                Decline
              </Button>
            </>
          )}
          {isApproved && (
            <Button
              size="sm"
              variant="outline"
              className="rounded-xl h-10 px-6 font-black uppercase tracking-widest text-[10px] border-2 border-blue-600/20 text-blue-600 hover:bg-blue-600 hover:text-white transition-all shadow-lg shadow-blue-500/5"
              onClick={() => onAction(request, "return")}
              data-testid="button-return"
            >
              <RotateCcw className="mr-2 h-3 w-3" />
              Record Return
            </Button>
          )}
          <Button
            size="sm"
            variant="ghost"
            className="rounded-xl h-10 px-3 font-black uppercase tracking-widest text-[10px] text-destructive hover:bg-destructive/10 hover:text-destructive transition-all"
            onClick={() => onDelete(request)}
            data-testid="button-delete"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl bg-neutral-50/50 dark:bg-neutral-900/50 p-4 border border-neutral-100/50 dark:border-neutral-800/50">
          <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 mb-2">Requested Equipment</div>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-background shadow-sm flex items-center justify-center">
              <Package className="h-5 w-5 text-primary" />
            </div>
            <div className="space-y-0.5">
              <p className="font-bold text-sm">{request.equipment?.name}</p>
              <Badge variant="secondary" className="bg-primary/10 text-primary border-none text-[10px] font-black uppercase py-0 px-2 h-5">
                Quantity: {request.quantity}
              </Badge>
            </div>
          </div>
        </div>

        <div className="rounded-2xl bg-neutral-50/50 dark:bg-neutral-900/50 p-4 border border-neutral-100/50 dark:border-neutral-800/50">
          <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 mb-2">Borrow Duration</div>
          <div className="flex items-center gap-6">
            <div className="space-y-0.5">
              <span className="text-[10px] font-black uppercase tracking-tight text-muted-foreground opacity-40">Start</span>
              <div className="flex items-center gap-2 text-xs font-bold">
                <Calendar className="h-3 w-3 text-primary opacity-60" />
                {format(new Date(request.borrowDate), "MMM d, yyyy")}
              </div>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground opacity-20" />
            <div className="space-y-0.5">
              <span className="text-[10px] font-black uppercase tracking-tight text-muted-foreground opacity-40">Return</span>
              <div className="flex items-center gap-2 text-xs font-bold text-orange-600">
                <Clock className="h-3 w-3 opacity-60" />
                {format(new Date(request.expectedReturnDate), "MMM d, yyyy")}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="relative group/purpose">
        <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 mb-1.5 flex items-center gap-2">
          <Info className="h-3 w-3" />
          Purpose of Borrowing
        </div>
        <p className="text-sm font-medium text-muted-foreground line-clamp-2 leading-relaxed bg-neutral-50/30 dark:bg-neutral-900/30 p-3 rounded-xl border border-dashed border-neutral-200 dark:border-neutral-800">
          {request.purpose}
        </p>
      </div>
    </motion.div>
  );
}

export default function AdminRequests() {
  const [activeTab, setActiveTab] = useState("pending");
  const [actionDialog, setActionDialog] = useState<{
    request: BorrowRequestWithDetails | null;
    action: "approve" | "decline" | "return" | null;
  }>({ request: null, action: null });
  const [deleteDialog, setDeleteDialog] = useState<BorrowRequestWithDetails | null>(null);

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

  const handleDelete = (request: BorrowRequestWithDetails) => {
    setDeleteDialog(request);
  };

  return (
    <motion.div
      className="max-w-6xl mx-auto space-y-10"
      initial="hidden"
      animate="show"
      variants={container}
    >
      <motion.div variants={item} className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-primary font-black text-[10px] uppercase tracking-[0.2em]">
            <ClipboardList className="h-3 w-3" />
            Request Management
          </div>
          <h1 className="text-4xl font-black tracking-tighter">Borrow Requests</h1>
          <p className="text-muted-foreground font-medium">Verify and manage equipment requests from students.</p>
        </div>

        <div className="flex items-center gap-2 bg-neutral-100/50 dark:bg-neutral-900/50 p-1.5 rounded-2xl border border-neutral-200/50 dark:border-neutral-800/50">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="bg-transparent h-10 gap-1">
              {["pending", "approved", "declined", "returned", "all"].map((tab) => (
                <TabsTrigger
                  key={tab}
                  value={tab}
                  className="rounded-xl px-4 text-[10px] font-black uppercase tracking-widest h-8 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg shadow-primary/20 transition-all"
                  data-testid={`tab-${tab}`}
                >
                  {tab}
                  {tab === "pending" && requests && requests.filter(r => r.status === "pending").length > 0 && (
                    <span className="ml-1.5 h-4 w-4 rounded-full bg-white/20 flex items-center justify-center text-[8px]">
                      {requests.filter(r => r.status === "pending").length}
                    </span>
                  )}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>
      </motion.div>

      <div className="min-h-[400px]">
        {isLoading ? (
          <div className="grid gap-6 md:grid-cols-1">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-64 w-full rounded-[2rem]" />
            ))}
          </div>
        ) : filteredRequests.length === 0 ? (
          <motion.div
            variants={item}
            className="flex flex-col items-center justify-center py-20 rounded-[3rem] border-2 border-dashed border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50"
          >
            <div className="h-24 w-24 rounded-[2.5rem] bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center mb-6 shadow-xl border border-white dark:border-neutral-700">
              <Package className="h-10 w-10 text-muted-foreground opacity-50" />
            </div>
            <h3 className="text-xl font-black tracking-tight text-muted-foreground opacity-80 uppercase">No Requests Found</h3>
            <p className="text-sm font-medium text-muted-foreground opacity-60 mt-2">
              There are no {activeTab === "all" ? "" : activeTab} requests to display at the moment.
            </p>
          </motion.div>
        ) : (
          <AnimatePresence mode="popLayout">
            <motion.div className="grid gap-6">
              {filteredRequests.map((request) => (
                <RequestCard
                  key={request.id}
                  request={request}
                  onAction={handleAction}
                  onDelete={handleDelete}
                />
              ))}
            </motion.div>
          </AnimatePresence>
        )}
      </div>

      <ActionDialog
        request={actionDialog.request}
        action={actionDialog.action}
        onClose={() => setActionDialog({ request: null, action: null })}
      />
      <DeleteDialog
        request={deleteDialog}
        onClose={() => setDeleteDialog(null)}
      />
    </motion.div>
  );
}
