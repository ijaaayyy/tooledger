import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Plus,
  Package,
  Pencil,
  Trash2,
  Loader2,
  Search,
  Box,
  Tags,
  Layers,
  CheckCircle2,
  XCircle,
  AlertCircle,
  BarChart3,
  MoreVertical,
  ChevronRight,
  Shield
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import type { Equipment } from "@shared/schema";

const equipmentSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  category: z.string().min(1, "Category is required"),
  totalQuantity: z.coerce.number().min(1, "Must be at least 1"),
  availableQuantity: z.coerce.number().min(0, "Cannot be negative"),
  isActive: z.boolean(),
});

type EquipmentFormValues = z.infer<typeof equipmentSchema>;

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

function EquipmentDialog({
  equipment,
  open,
  onClose,
}: {
  equipment: Equipment | null;
  open: boolean;
  onClose: () => void;
}) {
  const { toast } = useToast();
  const isEditing = !!equipment;

  const form = useForm<EquipmentFormValues>({
    resolver: zodResolver(equipmentSchema),
    defaultValues: {
      name: equipment?.name || "",
      description: equipment?.description || "",
      category: equipment?.category || "",
      totalQuantity: equipment?.totalQuantity || 1,
      availableQuantity: equipment?.availableQuantity || 1,
      isActive: equipment?.isActive ?? true,
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: EquipmentFormValues) => {
      if (isEditing) {
        return apiRequest("PATCH", `/api/equipment/${equipment.id}`, data);
      }
      return apiRequest("POST", "/api/equipment", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/equipment"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      toast({
        title: isEditing ? "Equipment Updated" : "Equipment Added",
        description: isEditing
          ? "The equipment has been updated successfully."
          : "New equipment has been added to inventory.",
      });
      onClose();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Operation failed",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: EquipmentFormValues) => {
    mutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-xl rounded-[2.5rem] border-none shadow-2xl p-0 overflow-hidden">
        <div className="bg-neutral-900 p-8 text-white relative">
          <div className="absolute top-0 right-0 -mt-10 -mr-10 h-40 w-40 rounded-full bg-primary/20 blur-[60px]" />
          <DialogHeader>
            <DialogTitle className="text-3xl font-black tracking-tight">{isEditing ? "Edit Equipment" : "Add Equipment"}</DialogTitle>
            <DialogDescription className="text-white/50 font-medium">
              {isEditing
                ? "Modify the specifications and availability."
                : "Register new tools or devices into the system."}
            </DialogDescription>
          </DialogHeader>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="p-8 space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem className="space-y-1.5">
                    <FormLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Asset Name</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Box className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary opacity-50" />
                        <Input
                          placeholder="e.g. MacBook Pro M3"
                          className="pl-10 rounded-xl bg-neutral-50 dark:bg-neutral-900 border-neutral-100 dark:border-neutral-800 transition-all focus:ring-primary shadow-sm h-11"
                          data-testid="input-equipment-name"
                          {...field}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem className="space-y-1.5">
                    <FormLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Classification</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Tags className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary opacity-50" />
                        <Input
                          placeholder="e.g. Electronics, Tools"
                          className="pl-10 rounded-xl bg-neutral-50 dark:bg-neutral-900 border-neutral-100 dark:border-neutral-800 transition-all focus:ring-primary shadow-sm h-11"
                          data-testid="input-equipment-category"
                          {...field}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem className="space-y-1.5">
                  <FormLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Detailed Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Specifications, condition, or special handling instructions..."
                      className="rounded-xl min-h-[100px] bg-neutral-50 dark:bg-neutral-900 border-neutral-100 dark:border-neutral-800 focus:ring-primary shadow-inner p-4"
                      data-testid="input-equipment-description"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-6 bg-neutral-50/50 dark:bg-neutral-900/50 p-6 rounded-2xl border border-dashed border-neutral-200 dark:border-neutral-800">
              <FormField
                control={form.control}
                name="totalQuantity"
                render={({ field }) => (
                  <FormItem className="space-y-1.5">
                    <FormLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Total Stock</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-black opacity-20 uppercase">Units</div>
                        <Input
                          type="number"
                          min={1}
                          className="rounded-xl bg-background border-neutral-200 dark:border-neutral-700 font-black h-11"
                          data-testid="input-equipment-total"
                          {...field}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="availableQuantity"
                render={({ field }) => (
                  <FormItem className="space-y-1.5">
                    <FormLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Available</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-black opacity-20 uppercase">Ready</div>
                        <Input
                          type="number"
                          min={0}
                          className="rounded-xl bg-background border-neutral-200 dark:border-neutral-700 font-black h-11"
                          data-testid="input-equipment-available"
                          {...field}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-2xl border border-neutral-100 dark:border-neutral-800 p-4 bg-background shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center transition-colors", field.value ? "bg-green-500/10 text-green-600" : "bg-neutral-100 dark:bg-neutral-800 text-muted-foreground")}>
                      <Shield className="h-4 w-4" />
                    </div>
                    <div className="space-y-0.5">
                      <FormLabel className="text-sm font-black tracking-tight cursor-pointer">Live Status</FormLabel>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase opacity-60">Visible for students</p>
                    </div>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      data-testid="switch-equipment-active"
                      className="data-[state=checked]:bg-green-500"
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <DialogFooter className="gap-3">
              <Button type="button" variant="ghost" onClick={onClose} className="rounded-xl font-bold uppercase tracking-widest text-[10px]">
                Cancel
              </Button>
              <Button type="submit" disabled={mutation.isPending} className="rounded-xl h-11 px-8 font-black uppercase tracking-widest text-[10px] bg-primary shadow-lg shadow-primary/20 hover:scale-[1.02] transition-all" data-testid="button-save-equipment">
                {mutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : isEditing ? (
                  "Save Specifications"
                ) : (
                  "Register Equipment"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export default function AdminInventory() {
  const [searchQuery, setSearchQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEquipment, setEditingEquipment] = useState<Equipment | null>(null);
  const [deleteEquipment, setDeleteEquipment] = useState<Equipment | null>(null);
  const { toast } = useToast();

  const { data: equipment, isLoading } = useQuery<Equipment[]>({
    queryKey: ["/api/equipment"],
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/equipment/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/equipment"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      toast({
        title: "Equipment Deleted",
        description: "The equipment has been removed from inventory.",
      });
      setDeleteEquipment(null);
    },
    onError: (error) => {
      toast({
        title: "Delete Failed",
        description: error instanceof Error ? error.message : "Could not delete equipment",
        variant: "destructive",
      });
    },
  });

  const filteredEquipment = equipment?.filter(item =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.category.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const handleEdit = (item: Equipment) => {
    setEditingEquipment(item);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingEquipment(null);
  };

  return (
    <motion.div
      className="max-w-7xl mx-auto space-y-10"
      initial="hidden"
      animate="show"
      variants={container}
    >
      <motion.div variants={item} className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2 border-b border-neutral-100 dark:border-neutral-800">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-primary font-black text-[10px] uppercase tracking-[0.2em]">
            <Layers className="h-3 w-3" />
            Asset Control
          </div>
          <h1 className="text-4xl font-black tracking-tighter">Inventory</h1>
          <p className="text-muted-foreground font-medium">Manage and monitor organizational hardware and resources.</p>
        </div>

        <div className="flex items-center gap-4 flex-wrap">
          <div className="relative w-full md:w-72">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground opacity-40" />
            <Input
              placeholder="Quick search assets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-11 rounded-xl bg-neutral-100/50 dark:bg-neutral-900/50 border-none shadow-sm placeholder:font-bold placeholder:text-[10px] placeholder:uppercase placeholder:tracking-widest"
              data-testid="input-search-equipment"
            />
          </div>
          <Button onClick={() => setDialogOpen(true)} className="h-11 rounded-xl px-6 bg-primary shadow-lg shadow-primary/20 hover:scale-105 transition-all font-black uppercase tracking-widest text-[10px]" data-testid="button-add-equipment">
            <Plus className="mr-2 h-4 w-4" />
            Add Equipment
          </Button>
        </div>
      </motion.div>

      <motion.div variants={item}>
        <Card className="border-none shadow-2xl shadow-neutral-200/50 dark:shadow-none bg-background/60 backdrop-blur-xl rounded-[2.5rem] overflow-hidden">
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-8 space-y-6">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-16 w-full rounded-2xl" />
                ))}
              </div>
            ) : filteredEquipment.length === 0 ? (
              <div className="py-24 text-center bg-neutral-50/30 dark:bg-neutral-900/10">
                <div className="h-24 w-24 rounded-[2.5rem] bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center mx-auto mb-6 shadow-xl border border-white dark:border-neutral-700">
                  <Package className="h-10 w-10 text-muted-foreground opacity-40" />
                </div>
                <h3 className="text-xl font-black tracking-tight text-muted-foreground opacity-80 uppercase">No Equipment Found</h3>
                <p className="text-sm font-medium text-muted-foreground opacity-60 mt-2 max-w-xs mx-auto">
                  {searchQuery ? "Try adjusting your search filters to find what you're looking for." : "Start populating your system by adding your first organizational asset."}
                </p>
                {!searchQuery && (
                  <Button
                    className="mt-8 h-12 rounded-xl px-8 font-black uppercase tracking-widest text-[10px] bg-primary shadow-lg shadow-primary/20"
                    onClick={() => setDialogOpen(true)}
                    data-testid="button-add-first-equipment"
                  >
                    Register First Asset
                  </Button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-b border-neutral-100 dark:border-neutral-800 hover:bg-transparent px-6">
                      <TableHead className="h-14 font-black text-[10px] uppercase tracking-widest text-muted-foreground pl-8">Asset Name</TableHead>
                      <TableHead className="h-14 font-black text-[10px] uppercase tracking-widest text-muted-foreground">Category</TableHead>
                      <TableHead className="h-14 font-black text-[10px] uppercase tracking-widest text-muted-foreground text-center">In Stock</TableHead>
                      <TableHead className="h-14 font-black text-[10px] uppercase tracking-widest text-muted-foreground text-center">Available</TableHead>
                      <TableHead className="h-14 font-black text-[10px] uppercase tracking-widest text-muted-foreground text-center">Status</TableHead>
                      <TableHead className="h-14 font-black text-[10px] uppercase tracking-widest text-muted-foreground text-right pr-8">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <AnimatePresence mode="popLayout">
                      {filteredEquipment.map((item, idx) => (
                        <motion.tr
                          key={item.id}
                          layout
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="group border-b border-neutral-50 dark:border-neutral-900/50 transition-colors hover:bg-neutral-50/50 dark:hover:bg-neutral-900/30"
                          data-testid={`equipment-row-${item.id}`}
                        >
                          <TableCell className="py-5 font-black text-sm tracking-tight pl-8">
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 rounded-xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all">
                                <Box className="h-5 w-5 opacity-60 group-hover:opacity-100" />
                              </div>
                              <div>
                                <p className="block truncate max-w-[200px]">{item.name}</p>
                                <p className="text-[10px] font-bold text-muted-foreground opacity-40 uppercase truncate max-w-[200px]">Asset ID: #{item.id.slice(0, 8)}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="py-5">
                            <Badge variant="outline" className="bg-neutral-100/50 dark:bg-neutral-800/50 text-muted-foreground text-[10px] font-black uppercase tracking-widest group-hover:bg-primary/10 group-hover:text-primary transition-colors border-none">
                              {item.category}
                            </Badge>
                          </TableCell>
                          <TableCell className="py-5 text-center font-bold text-sm tracking-tighter opacity-60">{item.totalQuantity}</TableCell>
                          <TableCell className="py-5 text-center px-4">
                            <div className="flex flex-col items-center">
                              <Badge
                                variant="outline"
                                className={cn(
                                  "h-7 min-w-[3.5rem] justify-center text-[10px] font-black uppercase tracking-widest border-2",
                                  item.availableQuantity === 0
                                    ? "bg-red-500/10 text-red-600 border-red-500/20"
                                    : item.availableQuantity <= 2
                                      ? "bg-orange-500/10 text-orange-600 border-orange-500/20"
                                      : "bg-green-500/10 text-green-600 border-green-500/20"
                                )}
                              >
                                {item.availableQuantity}
                              </Badge>
                              {item.availableQuantity / item.totalQuantity < 0.3 && (
                                <span className="text-[8px] font-black text-destructive uppercase mt-1">LOW STOCK</span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="py-5 text-center">
                            <div className="flex items-center justify-center">
                              {item.isActive ? (
                                <div className="flex items-center gap-1.5 px-3 py-1 bg-green-500/10 text-green-600 rounded-full">
                                  <div className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                                  <span className="text-[10px] font-black uppercase tracking-widest">Active</span>
                                </div>
                              ) : (
                                <div className="flex items-center gap-1.5 px-3 py-1 bg-neutral-500/10 text-neutral-500 rounded-full">
                                  <span className="text-[10px] font-black uppercase tracking-widest opacity-60">Paused</span>
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="py-5 text-right pr-8">
                            <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-9 w-9 rounded-xl hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-all hover:scale-110 active:scale-90"
                                onClick={() => handleEdit(item)}
                                data-testid={`button-edit-${item.id}`}
                              >
                                <Pencil className="h-4 w-4 text-primary" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-9 w-9 rounded-xl hover:bg-destructive/10 hover:text-destructive transition-all hover:scale-110 active:scale-90"
                                onClick={() => setDeleteEquipment(item)}
                                data-testid={`button-delete-${item.id}`}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </motion.tr>
                      ))}
                    </AnimatePresence>
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      <EquipmentDialog
        equipment={editingEquipment}
        open={dialogOpen}
        onClose={handleCloseDialog}
      />

      <AlertDialog open={!!deleteEquipment} onOpenChange={() => setDeleteEquipment(null)}>
        <AlertDialogContent className="rounded-[2.5rem] border-none shadow-2xl p-8">
          <AlertDialogHeader>
            <div className="h-16 w-16 rounded-3xl bg-destructive/10 flex items-center justify-center mb-6">
              <AlertCircle className="h-8 w-8 text-destructive" />
            </div>
            <AlertDialogTitle className="text-2xl font-black tracking-tighter">Decommission Asset?</AlertDialogTitle>
            <AlertDialogDescription className="text-sm font-medium opacity-60 leading-relaxed">
              You are about to permanently remove <span className="font-black text-foreground">"{deleteEquipment?.name}"</span> from the inventory. All historical records for this asset will be archived, but it will no longer be available for borrowing.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="pt-6 gap-3">
            <AlertDialogCancel className="rounded-xl font-bold uppercase tracking-widest text-[10px]" data-testid="button-cancel-delete">Keep Asset</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteEquipment && deleteMutation.mutate(deleteEquipment.id)}
              className="bg-destructive text-destructive-foreground rounded-xl font-black uppercase tracking-widest text-[10px] px-8 h-11 shadow-lg shadow-destructive/20 hover:scale-[1.02] transition-all"
              data-testid="button-confirm-delete"
            >
              {deleteMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Delete Permanent"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  );
}
