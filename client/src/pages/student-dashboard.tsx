import React, { useState, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { LogOut, Loader2, Calendar, CheckCircle2, Clock, Wrench, Package, ArrowRight, User, LayoutDashboard, PlusCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { ThemeToggle } from "@/components/theme-toggle";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { Equipment, BorrowRequestWithDetails } from "@shared/schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { format } from "date-fns";
import { useQuery, useMutation } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";

const borrowRequestSchema = z.object({
  equipmentId: z.string().min(1, "Please select an equipment"),
  quantity: z.coerce.number().min(1, "Quantity must be at least 1"),
  purpose: z.string().min(10, "Please describe your purpose (at least 10 characters)"),
  borrowDate: z.string().min(1, "Please select a borrow date"),
  expectedReturnDate: z.string().min(1, "Please select a return date"),
});

type BorrowFormValues = z.infer<typeof borrowRequestSchema>;

function StatusBadge({ status }: { status: string }) {
  const variants: Record<string, { className: string; label: string; icon: any }> = {
    pending: { className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-400 border-yellow-200/50", label: "Pending", icon: Clock },
    approved: { className: "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-400 border-green-200/50", label: "Approved", icon: CheckCircle2 },
    declined: { className: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-400 border-red-200/50", label: "Declined", icon: AlertCircle },
    returned: { className: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-400 border-blue-200/50", label: "Returned", icon: Package },
  };

  const variant = variants[status] || variants.pending;
  const Icon = variant.icon;

  return (
    <Badge variant="outline" className={`gap-1 font-medium transition-all ${variant.className}`}>
      <Icon className="h-3.5 w-3.5" />
      {variant.label}
    </Badge>
  );
}

export default function StudentDashboard() {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const [showSuccess, setShowSuccess] = useState(false);
  const [notEnoughModal, setNotEnoughModal] = useState<{
    open: boolean;
    available?: number;
    requested?: number;
    itemName?: string;
  }>({ open: false });

  const { data: equipment, isLoading: equipmentLoading } = useQuery<Equipment[]>({
    queryKey: ["/api/equipment"],
  });

  const { data: recentRequests, isLoading: requestsLoading } = useQuery<BorrowRequestWithDetails[]>({
    queryKey: ["/api/borrow-requests/my"],
  });

  // Calculate Stats
  const stats = useMemo(() => {
    if (!recentRequests || !equipment) return { active: 0, pending: 0, available: 0 };
    return {
      active: recentRequests.filter(r => r.status === "approved").length,
      pending: recentRequests.filter(r => r.status === "pending").length,
      available: equipment.reduce((acc, curr) => acc + (curr.availableQuantity ?? curr.totalQuantity ?? 0), 0)
    };
  }, [recentRequests, equipment]);

  const form = useForm<BorrowFormValues>({
    resolver: zodResolver(borrowRequestSchema),
    defaultValues: {
      equipmentId: "",
      quantity: 1,
      purpose: "",
      borrowDate: "",
      expectedReturnDate: "",
    },
  });

  const createRequestMutation = useMutation({
    mutationFn: async (data: BorrowFormValues) => {
      return apiRequest("POST", "/api/borrow-requests", {
        ...data,
        borrowDate: new Date(data.borrowDate).toISOString(),
        expectedReturnDate: new Date(data.expectedReturnDate).toISOString(),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/borrow-requests/my"] });
      queryClient.invalidateQueries({ queryKey: ["/api/equipment"] });
      form.reset();
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 5000);
    },
    onError: (error: any) => {
      toast({
        title: "Request failed",
        description: error instanceof Error ? error.message : String(error),
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: BorrowFormValues) => {
    const equipmentItem = equipment?.find((e: Equipment) => e.id === data.equipmentId);
    const available = equipmentItem?.availableQuantity ?? equipmentItem?.totalQuantity ?? 0;

    if (data.quantity > available) {
      setNotEnoughModal({
        open: true,
        available,
        requested: data.quantity,
        itemName: equipmentItem?.name ?? "equipment",
      });
      return;
    }

    try {
      createRequestMutation.mutate(data);
    } catch (err) {
      toast({
        title: "Request failed",
        description: err instanceof Error ? err.message : "Could not submit request",
        variant: "destructive",
      });
    }
  };

  const availableEquipment =
    equipment?.filter((e: Equipment) => (e as any).isActive && ((e.availableQuantity ?? e.totalQuantity ?? 0) > 0)) || [];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <>
      <div className="min-h-screen bg-neutral-50 dark:bg-[#0a0a0a] transition-colors duration-500">
        {/* Header - Glassmorphism */}
        <header className="sticky top-0 z-[100] border-b bg-background/60 backdrop-blur-xl supports-[backdrop-filter]:bg-background/40">
          <div className="container mx-auto px-4">
            <div className="flex h-16 items-center justify-between gap-4">
              <div className="flex items-center gap-3 group cursor-pointer">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-lg shadow-primary/20 group-hover:scale-105 transition-transform duration-300">
                  <Wrench className="h-5 w-5" />
                </div>
                <div className="flex flex-col">
                  <span className="font-bold text-lg leading-none">ToolLedger</span>
                  <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Student Dashboard</span>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="hidden md:flex flex-col items-end mr-2">
                  <span className="text-sm font-semibold">{user?.name}</span>
                  <span className="text-[11px] text-muted-foreground uppercase font-bold tracking-tighter">Student</span>
                </div>
                <ThemeToggle />
                <div className="h-8 w-[1px] bg-neutral-200 dark:bg-neutral-800 mx-1" />
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30 transition-colors"
                  onClick={logout}
                  data-testid="button-logout"
                >
                  <LogOut className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>
        </header>

        <main className="container mx-auto px-4 py-8 md:py-12">
          <motion.div
            className="max-w-6xl mx-auto space-y-12"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {/* Hero / Greeting */}
            <motion.div variants={itemVariants} className="relative overflow-hidden rounded-3xl bg-neutral-900 p-8 md:p-12 text-white shadow-2xl">
              <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-primary/20 to-transparent pointer-events-none" />
              <div className="relative z-10 space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-[11px] font-bold tracking-widest uppercase border border-white/10">
                  <LayoutDashboard className="h-3 w-3" />
                  ToolLedger Overview
                </div>
                <h1 className="text-4xl md:text-5xl font-black tracking-tighter leading-tight max-w-2xl">
                  Hello, {user?.name?.split(" ")[0]}! <span className="text-primary italic">Ready to build?</span>
                </h1>
                <p className="text-white/70 max-w-md text-lg leading-relaxed">
                  Submit a borrowing request below to get the tools you need for your projects.
                </p>
              </div>
            </motion.div>

            {/* Stat Cards */}
            <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { label: "Active Borrowings", value: stats.active, icon: CheckCircle2, gradient: "from-green-500/10 to-green-500/5", iconColor: "text-green-500" },
                { label: "Pending Requests", value: stats.pending, icon: Clock, gradient: "from-yellow-500/10 to-yellow-500/5", iconColor: "text-yellow-500" },
                { label: "Available Tools", value: stats.available, icon: Package, gradient: "from-blue-500/10 to-blue-500/5", iconColor: "text-blue-500" }
              ].map((stat, idx) => (
                <Card key={idx} className="border-none shadow-sm overflow-hidden group hover:shadow-md transition-shadow">
                  <div className={`flex flex-col justify-center p-6 bg-gradient-to-br ${stat.gradient} h-full`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-bold text-muted-foreground uppercase tracking-tight">{stat.label}</span>
                      <stat.icon className={`h-5 w-5 ${stat.iconColor} group-hover:scale-110 transition-transform`} />
                    </div>
                    <div className="text-4xl font-black tracking-tighter">{stat.value}</div>
                  </div>
                </Card>
              ))}
            </motion.div>

            <AnimatePresence>
              {showSuccess && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, y: -20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: -20 }}
                  className="relative group"
                >
                  <Card className="border-green-500/20 bg-green-500/10 backdrop-blur-md overflow-hidden">
                    <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-green-500" />
                    <CardContent className="flex items-center gap-4 py-6">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-green-500/20 shadow-inner">
                        <CheckCircle2 className="h-6 w-6 text-green-500" />
                      </div>
                      <div>
                        <p className="text-lg font-bold text-green-900 dark:text-green-300">Request Sent Successfully!</p>
                        <p className="text-sm text-green-700 dark:text-green-400">
                          We'll notify you via email as soon as an administrator reviews your request.
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="grid gap-12 lg:grid-cols-5 items-start">
              {/* Request Form */}
              <motion.div variants={itemVariants} className="lg:col-span-3">
                <Card className="border-none shadow-xl bg-card/80 backdrop-blur-sm overflow-hidden">
                  <div className="h-1 bg-primary/20" />
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-3 text-2xl font-black tracking-tight">
                      <PlusCircle className="h-6 w-6 text-primary" />
                      Borrow Equipment
                    </CardTitle>
                    <CardDescription className="text-sm font-medium">
                      Select your tools and schedule your pickup date.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Form {...form}>
                      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                        <div className="grid gap-6 md:grid-cols-3">
                          <FormField
                            control={form.control}
                            name="equipmentId"
                            render={({ field }) => (
                              <FormItem className="md:col-span-2">
                                <FormLabel className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-1 block">Select Equipment</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                  <FormControl>
                                    <SelectTrigger className="h-12 bg-neutral-50 dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 transition-all focus:ring-2 focus:ring-primary/20" data-testid="select-equipment">
                                      <SelectValue placeholder="What do you need?" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent className="max-h-80">
                                    {equipmentLoading ? (
                                      <div className="p-4 space-y-2">
                                        <Skeleton className="h-8 w-full" />
                                        <Skeleton className="h-8 w-full" />
                                      </div>
                                    ) : availableEquipment.length === 0 ? (
                                      <div className="p-4 text-center text-sm text-muted-foreground font-medium italic">
                                        Inventory is empty
                                      </div>
                                    ) : (
                                      availableEquipment.map((item: Equipment) => (
                                        <SelectItem key={item.id} value={item.id} className="cursor-pointer py-3">
                                          <div className="flex items-center justify-between gap-4">
                                            <span className="font-semibold">{item.name}</span>
                                            <Badge variant="secondary" className="text-[10px] font-black uppercase tracking-tighter h-5 px-1.5 cursor-pointer">
                                              {item.availableQuantity ?? item.totalQuantity ?? 0} In Stock
                                            </Badge>
                                          </div>
                                        </SelectItem>
                                      ))
                                    )}
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="quantity"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-1 block">Qty</FormLabel>
                                <FormControl>
                                  <Input
                                    type="number"
                                    min={1}
                                    className="h-12 bg-neutral-50 dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 transition-all focus:ring-2 focus:ring-primary/20"
                                    data-testid="input-quantity"
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <FormField
                          control={form.control}
                          name="purpose"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-1 block">Project Purpose</FormLabel>
                              <FormControl>
                                <Textarea
                                  placeholder="What project are you working on?"
                                  className="min-h-[120px] bg-neutral-50 dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 transition-all focus:ring-2 focus:ring-primary/20 resize-none p-4"
                                  data-testid="input-purpose"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <div className="grid gap-6 md:grid-cols-2">
                          <FormField
                            control={form.control}
                            name="borrowDate"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-1 block">Borrow Date & Time</FormLabel>
                                <FormControl>
                                  <div className="relative">
                                    <Input
                                      type="datetime-local"
                                      className="h-12 pl-10 bg-neutral-50 dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 transition-all focus:ring-2 focus:ring-primary/20"
                                      data-testid="input-borrow-date"
                                      {...field}
                                    />
                                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                  </div>
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="expectedReturnDate"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-1 block">Expected Return</FormLabel>
                                <FormControl>
                                  <div className="relative">
                                    <Input
                                      type="datetime-local"
                                      className="h-12 pl-10 bg-neutral-50 dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 transition-all focus:ring-2 focus:ring-primary/20"
                                      data-testid="input-return-date"
                                      {...field}
                                    />
                                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                  </div>
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <Button
                          type="submit"
                          className="w-full h-14 text-base font-black shadow-xl shadow-primary/20 group relative overflow-hidden active:scale-[0.98] transition-all"
                          disabled={createRequestMutation.isPending}
                          data-testid="button-submit-request"
                        >
                          {createRequestMutation.isPending ? (
                            <>
                              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                              Processing...
                            </>
                          ) : (
                            <span className="flex items-center gap-2">
                              Send Request
                              <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                            </span>
                          )}
                        </Button>
                      </form>
                    </Form>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Recent Requests */}
              <motion.div variants={itemVariants} className="lg:col-span-2">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-black tracking-tight flex items-center gap-2">
                    <Clock className="h-5 w-5 text-neutral-400" />
                    History
                  </h3>
                  {recentRequests && recentRequests.length > 5 && (
                    <Button variant="ghost" className="text-xs font-bold uppercase tracking-widest text-primary p-0 h-auto hover:bg-transparent hover:underline">
                      View All
                    </Button>
                  )}
                </div>

                <div className="space-y-4">
                  {requestsLoading ? (
                    <div className="space-y-4">
                      {[1, 2, 3, 4].map((i) => (
                        <Skeleton key={i} className="h-24 w-full rounded-2xl" />
                      ))}
                    </div>
                  ) : !recentRequests || recentRequests.length === 0 ? (
                    <div className="py-20 text-center bg-neutral-100 dark:bg-neutral-900/50 rounded-3xl border border-dashed">
                      <Package className="mx-auto h-12 w-12 text-muted-foreground/30 mb-4" />
                      <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">
                        No History
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4 max-h-[700px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-neutral-200">
                      {recentRequests.slice(0, 5).map((request: BorrowRequestWithDetails) => (
                        <motion.div
                          key={request.id}
                          className="group relative flex flex-col gap-3 rounded-2xl border border-neutral-200/60 dark:border-neutral-800/60 bg-white/50 dark:bg-neutral-900/50 p-5 hover:bg-white dark:hover:bg-neutral-900 hover:shadow-lg hover:shadow-neutral-200/20 dark:hover:shadow-none transition-all duration-300"
                          data-testid={`request-item-${request.id}`}
                          whileHover={{ x: 4 }}
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="space-y-1">
                              <h4 className="font-bold text-base group-hover:text-primary transition-colors">
                                {request.equipment?.name || `Request #${request.id.slice(0, 8)}`}
                              </h4>
                              <div className="flex items-center gap-3 text-[11px] font-bold uppercase tracking-tight text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  {format(new Date(request.createdAt), "MMM d")}
                                </span>
                                {request.quantity > 1 && (
                                  <span className="flex items-center gap-1">
                                    <User className="h-3 w-3" />
                                    Qty: {request.quantity}
                                  </span>
                                )}
                              </div>
                            </div>
                            <StatusBadge status={request.status} />
                          </div>

                          <div className="h-[1px] w-full bg-neutral-100 dark:bg-neutral-800" />

                          <p className="text-xs text-muted-foreground line-clamp-1 italic group-hover:line-clamp-none transition-all">
                            "{request.purpose}"
                          </p>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            </div>
          </motion.div>
        </main>

        <footer className="border-t py-12 bg-white dark:bg-neutral-950/20 mt-20">
          <div className="container mx-auto px-4 text-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-100 dark:bg-neutral-900 mx-auto mb-4 border border-neutral-200 dark:border-neutral-800">
              <Wrench className="h-5 w-5 text-neutral-400" />
            </div>
            <p className="text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground">
              Holy Cross of Davao College
            </p>
            <p className="text-[10px] text-muted-foreground/60 mt-2">
              ToolLedger System &copy; {new Date().getFullYear()}
            </p>
          </div>
        </footer>
      </div>

      {/* Not-enough-equipment modal - Redesigned */}
      <Dialog open={notEnoughModal.open} onOpenChange={(isOpen) => setNotEnoughModal((s) => ({ ...s, open: isOpen }))}>
        <DialogContent className="max-w-md rounded-3xl p-8 border-none overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1.5 bg-red-500" />
          <DialogHeader className="pt-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-100 dark:bg-red-900/30 mb-4">
              <AlertCircle className="h-6 w-6 text-red-500" />
            </div>
            <DialogTitle className="text-2xl font-black tracking-tight">Insufficient Stock</DialogTitle>
            <DialogDescription className="text-base font-medium pt-2 leading-relaxed">
              We're sorry, but there aren't enough {notEnoughModal.itemName ? <strong>{notEnoughModal.itemName}</strong> : "items"} available right now.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-6 p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 space-y-3">
            <div className="flex justify-between items-center text-sm font-bold">
              <span className="text-muted-foreground uppercase tracking-tight">Requested</span>
              <span className="text-red-500">{notEnoughModal.requested} Units</span>
            </div>
            <div className="h-[1px] w-full bg-neutral-200 dark:bg-neutral-800" />
            <div className="flex justify-between items-center text-sm font-bold">
              <span className="text-muted-foreground uppercase tracking-tight">Available</span>
              <span className="text-green-500">{notEnoughModal.available} Units</span>
            </div>
          </div>

          <DialogFooter className="mt-8 flex flex-col sm:flex-row gap-3">
            <Button variant="outline" className="flex-1 h-12 rounded-xl font-bold border-neutral-200" onClick={() => setNotEnoughModal({ open: false })}>
              Cancel
            </Button>
            <Button className="flex-1 h-12 rounded-xl font-bold shadow-lg shadow-primary/20" onClick={() => {
              setNotEnoughModal({ open: false });
              form.setValue("quantity", notEnoughModal.available ?? 1);
            }}>
              Use {notEnoughModal.available} Available
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
