import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import {
  FileText,
  Search,
  Calendar,
  User,
  Package,
  Download,
  Filter,
  History,
  ChevronRight,
  ArrowUpRight,
  Mail,
  Fingerprint,
  CheckCircle2,
  Clock,
  Shield
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  const variants: Record<string, { className: string; label: string }> = {
    pending: { className: "bg-yellow-500/10 text-yellow-600 border-yellow-200/50", label: "Pending" },
    approved: { className: "bg-green-500/10 text-green-600 border-green-200/50", label: "Approved" },
    declined: { className: "bg-red-500/10 text-red-600 border-red-200/50", label: "Declined" },
    returned: { className: "bg-blue-500/10 text-blue-600 border-blue-200/50", label: "Returned" },
  };

  const variant = variants[status] || variants.pending;

  return (
    <Badge variant="outline" className={cn("text-[10px] font-black uppercase tracking-widest py-1 px-3 rounded-full border-2", variant.className)}>
      {variant.label}
    </Badge>
  );
}

export default function AdminRecords() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const { data: records, isLoading } = useQuery<BorrowRequestWithDetails[]>({
    queryKey: ["/api/borrow-requests"],
  });

  const filteredRecords = records?.filter(record => {
    const matchesSearch =
      record.user?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      record.user?.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      record.equipment?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      record.user?.studentId?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === "all" || record.status === statusFilter;

    return matchesSearch && matchesStatus;
  }) || [];

  const handleExport = () => {
    if (!filteredRecords.length) return;

    const csvContent = [
      ["ID", "Student Name", "Email", "Student ID", "Equipment", "Quantity", "Purpose", "Borrow Date", "Return Date", "Status", "Actual Return"],
      ...filteredRecords.map(r => [
        r.id,
        r.user?.name || "",
        r.user?.email || "",
        r.user?.studentId || "",
        r.equipment?.name || "",
        r.quantity.toString(),
        r.purpose,
        format(new Date(r.borrowDate), "yyyy-MM-dd"),
        format(new Date(r.expectedReturnDate), "yyyy-MM-dd"),
        r.status,
        r.actualReturnDate ? format(new Date(r.actualReturnDate), "yyyy-MM-dd") : ""
      ])
    ].map(row => row.map(cell => `"${cell}"`).join(",")).join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `tooledger-records-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
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
            <History className="h-3 w-3" />
            Transaction Logs
          </div>
          <h1 className="text-4xl font-black tracking-tighter">Borrower Records</h1>
          <p className="text-muted-foreground font-medium">Archived history of all equipment borrowing activities.</p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={handleExport}
            disabled={filteredRecords.length === 0}
            className="h-11 rounded-xl px-6 font-black uppercase tracking-widest text-[10px] border-2 border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-900 transition-all active:scale-95"
            data-testid="button-export-records"
          >
            <Download className="mr-2 h-4 w-4" />
            Export Archive
          </Button>
        </div>
      </motion.div>

      <motion.div variants={item} className="grid md:grid-cols-3 gap-4">
        <div className="md:col-span-2 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground opacity-40" />
          <Input
            placeholder="Search by student name, email, ID, or asset..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-12 h-14 rounded-2xl bg-white dark:bg-neutral-900 border-none shadow-xl shadow-neutral-200/50 dark:shadow-none placeholder:font-bold placeholder:text-[10px] placeholder:uppercase placeholder:tracking-widest"
            data-testid="input-search-records"
          />
        </div>
        <div className="relative">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-14 rounded-2xl bg-white dark:bg-neutral-900 border-none shadow-xl shadow-neutral-200/50 dark:shadow-none px-6 font-black text-[10px] uppercase tracking-widest" data-testid="select-status-filter">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 opacity-40" />
                <SelectValue placeholder="All Status" />
              </div>
            </SelectTrigger>
            <SelectContent className="rounded-2xl border-none shadow-2xl">
              <SelectItem value="all" className="font-bold text-[10px] uppercase py-3">All Status</SelectItem>
              <SelectItem value="pending" className="font-bold text-[10px] uppercase py-3">Pending</SelectItem>
              <SelectItem value="approved" className="font-bold text-[10px] uppercase py-3">Approved</SelectItem>
              <SelectItem value="declined" className="font-bold text-[10px] uppercase py-3">Declined</SelectItem>
              <SelectItem value="returned" className="font-bold text-[10px] uppercase py-3">Returned</SelectItem>
            </SelectContent>
          </Select>
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
            ) : filteredRecords.length === 0 ? (
              <div className="py-24 text-center bg-neutral-50/30 dark:bg-neutral-900/10">
                <div className="h-24 w-24 rounded-[2.5rem] bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center mx-auto mb-6 shadow-xl border border-white dark:border-neutral-700">
                  <FileText className="h-10 w-10 text-muted-foreground opacity-40" />
                </div>
                <h3 className="text-xl font-black tracking-tight text-muted-foreground opacity-80 uppercase">No Records Tracked</h3>
                <p className="text-sm font-medium text-muted-foreground opacity-60 mt-2 max-w-xs mx-auto">
                  {searchQuery || statusFilter !== "all"
                    ? "Adjust your filters or search keywords to find specific logs."
                    : "When students start borrowing equipment, their activities will appear here."}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-b border-neutral-100 dark:border-neutral-800 hover:bg-transparent px-6">
                      <TableHead className="h-14 font-black text-[10px] uppercase tracking-widest text-muted-foreground pl-8">Student Contact</TableHead>
                      <TableHead className="h-14 font-black text-[10px] uppercase tracking-widest text-muted-foreground">Equipment</TableHead>
                      <TableHead className="h-14 font-black text-[10px] uppercase tracking-widest text-muted-foreground text-center">Qty</TableHead>
                      <TableHead className="h-14 font-black text-[10px] uppercase tracking-widest text-muted-foreground">Duration</TableHead>
                      <TableHead className="h-14 font-black text-[10px] uppercase tracking-widest text-muted-foreground text-center">Status</TableHead>
                      <TableHead className="h-14 font-black text-[10px] uppercase tracking-widest text-muted-foreground text-right pr-8">Returned On</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <AnimatePresence mode="popLayout">
                      {filteredRecords.map((record) => (
                        <motion.tr
                          key={record.id}
                          layout
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="group border-b border-neutral-50 dark:border-neutral-900/50 transition-colors hover:bg-neutral-50/50 dark:hover:bg-neutral-900/30"
                          data-testid={`record-row-${record.id}`}
                        >
                          <TableCell className="py-5 pl-8">
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center font-black text-xs text-primary transition-transform group-hover:scale-110">
                                {record.user?.name?.[0].toUpperCase()}
                              </div>
                              <div className="space-y-0.5">
                                <div className="font-black text-sm tracking-tight">{record.user?.name}</div>
                                <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground opacity-60 uppercase">
                                  <Mail className="h-2.5 w-2.5" />
                                  {record.user?.email}
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="py-5">
                            <div className="space-y-1">
                              <div className="font-bold text-sm flex items-center gap-2">
                                <Package className="h-3 w-3 text-primary opacity-40" />
                                {record.equipment?.name}
                              </div>
                              <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-40">{record.equipment?.category}</div>
                            </div>
                          </TableCell>
                          <TableCell className="py-5 text-center font-black text-sm tracking-tighter opacity-60">
                            {record.quantity}
                          </TableCell>
                          <TableCell className="py-5">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2 text-xs font-bold whitespace-nowrap">
                                <span className="text-[10px] font-black opacity-30 uppercase w-8">Out:</span>
                                {format(new Date(record.borrowDate), "MMM d, yyyy")}
                              </div>
                              <div className="flex items-center gap-2 text-xs font-bold whitespace-nowrap text-orange-600">
                                <span className="text-[10px] font-black opacity-30 uppercase w-8">Exp:</span>
                                {format(new Date(record.expectedReturnDate), "MMM d, yyyy")}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="py-5 text-center">
                            <StatusBadge status={record.status} />
                          </TableCell>
                          <TableCell className="py-5 text-right pr-8">
                            {record.actualReturnDate ? (
                              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-green-500/10 text-green-600 font-black text-[10px] uppercase tracking-widest border border-green-500/10">
                                <CheckCircle2 className="h-3 w-3" />
                                {format(new Date(record.actualReturnDate), "MMM d, yyyy")}
                              </div>
                            ) : (
                              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-muted-foreground font-black text-[10px] uppercase tracking-widest opacity-40">
                                <Clock className="h-3 w-3" />
                                Still Out
                              </div>
                            )}
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

      {filteredRecords.length > 0 && (
        <motion.div variants={item} className="flex items-center justify-between px-8 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground opacity-50">
          <div>Displaying {filteredRecords.length} Transactions</div>
          <div className="flex items-center gap-1">
            Archive Consistency: 100% Guaranteed
            <Shield className="h-3 w-3" />
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
