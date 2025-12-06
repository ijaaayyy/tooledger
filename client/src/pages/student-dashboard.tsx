import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { 
  Package, 
  LogOut, 
  Loader2, 
  Calendar, 
  CheckCircle2, 
  Clock,
  Wrench
} from "lucide-react";
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

const borrowRequestSchema = z.object({
  equipmentId: z.string().min(1, "Please select an equipment"),
  quantity: z.coerce.number().min(1, "Quantity must be at least 1"),
  purpose: z.string().min(10, "Please describe your purpose (at least 10 characters)"),
  borrowDate: z.string().min(1, "Please select a borrow date"),
  expectedReturnDate: z.string().min(1, "Please select a return date"),
});

type BorrowFormValues = z.infer<typeof borrowRequestSchema>;

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

export default function StudentDashboard() {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const [showSuccess, setShowSuccess] = useState(false);

  const { data: equipment, isLoading: equipmentLoading } = useQuery<Equipment[]>({
    queryKey: ["/api/equipment"],
  });

  const { data: recentRequests, isLoading: requestsLoading } = useQuery<BorrowRequestWithDetails[]>({
    queryKey: ["/api/borrow-requests/my"],
  });

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
    onError: (error) => {
      toast({
        title: "Request failed",
        description: error instanceof Error ? error.message : "Could not submit request",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: BorrowFormValues) => {
    createRequestMutation.mutate(data);
  };

  const availableEquipment = equipment?.filter(e => e.isActive && e.availableQuantity > 0) || [];

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary">
                <Wrench className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="font-semibold text-lg">ToolLedger</span>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground hidden sm:block">
                Welcome, {user?.name}
              </span>
              <ThemeToggle />
              <Button 
                variant="ghost" 
                size="icon"
                onClick={logout}
                data-testid="button-logout"
              >
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="space-y-2">
            <h1 className="text-3xl font-semibold tracking-tight">
              Welcome back, {user?.name?.split(" ")[0]}!
            </h1>
            <p className="text-muted-foreground">
              Submit a borrowing request below. You'll receive email updates on your request status.
            </p>
          </div>

          {showSuccess && (
            <Card className="border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-900/20">
              <CardContent className="flex items-center gap-4 py-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/50">
                  <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="font-medium text-green-800 dark:text-green-300">Request Sent Successfully!</p>
                  <p className="text-sm text-green-700 dark:text-green-400">
                    Awaiting Approval. You will receive an email once your request is reviewed.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Borrowing Request Form
              </CardTitle>
              <CardDescription>
                Fill out the form below to request equipment
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <div className="grid gap-6 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="equipmentId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Equipment</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-equipment">
                                <SelectValue placeholder="Select equipment" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {equipmentLoading ? (
                                <div className="p-2">
                                  <Skeleton className="h-8 w-full" />
                                </div>
                              ) : availableEquipment.length === 0 ? (
                                <div className="p-2 text-sm text-muted-foreground">
                                  No equipment available
                                </div>
                              ) : (
                                availableEquipment.map((item) => (
                                  <SelectItem key={item.id} value={item.id}>
                                    {item.name} ({item.availableQuantity} available)
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
                          <FormLabel>Quantity</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              min={1}
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
                        <FormLabel>Purpose</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Describe why you need this equipment..."
                            className="min-h-[100px]"
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
                          <FormLabel>Borrow Date</FormLabel>
                          <FormControl>
                            <Input 
                              type="datetime-local"
                              data-testid="input-borrow-date"
                              {...field} 
                            />
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
                          <FormLabel>Expected Return Date</FormLabel>
                          <FormControl>
                            <Input 
                              type="datetime-local"
                              data-testid="input-return-date"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full"
                    disabled={createRequestMutation.isPending}
                    data-testid="button-submit-request"
                  >
                    {createRequestMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      "Submit Request"
                    )}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Recent Requests
              </CardTitle>
              <CardDescription>
                Your latest borrowing requests (updates sent via email)
              </CardDescription>
            </CardHeader>
            <CardContent>
              {requestsLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : !recentRequests || recentRequests.length === 0 ? (
                <div className="py-8 text-center">
                  <Package className="mx-auto h-12 w-12 text-muted-foreground/50" />
                  <p className="mt-2 text-sm text-muted-foreground">
                    No requests yet. Submit your first borrowing request above!
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentRequests.slice(0, 5).map((request) => (
                    <div
                      key={request.id}
                      className="flex items-center justify-between rounded-lg border p-4"
                      data-testid={`request-item-${request.id}`}
                    >
                      <div className="space-y-1">
                        <p className="font-medium">{request.equipment?.name || `Request #${request.id.slice(0, 8)}`}</p>
                        <p className="text-sm text-muted-foreground">
                          <Calendar className="mr-1 inline h-3 w-3" />
                          {format(new Date(request.createdAt), "MMM d, yyyy 'at' h:mm a")}
                          {request.quantity > 1 && ` (Qty: ${request.quantity})`}
                        </p>
                      </div>
                      <StatusBadge status={request.status} />
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      <footer className="border-t py-6 text-center text-sm text-muted-foreground">
        Holy Cross of Davao College
      </footer>
    </div>
  );
}
