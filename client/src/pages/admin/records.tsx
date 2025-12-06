import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { 
  FileText, 
  Search,
  Calendar,
  User,
  Package,
  Download
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
    a.download = `borrower-records-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Borrower Records</h1>
          <p className="text-muted-foreground">
            Complete history of all borrowing transactions
          </p>
        </div>
        <Button 
          variant="outline" 
          onClick={handleExport}
          disabled={filteredRecords.length === 0}
          data-testid="button-export-records"
        >
          <Download className="mr-2 h-4 w-4" />
          Export CSV
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4 flex-wrap">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by name, email, ID, or equipment..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
                data-testid="input-search-records"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[140px]" data-testid="select-status-filter">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="declined">Declined</SelectItem>
                <SelectItem value="returned">Returned</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : filteredRecords.length === 0 ? (
            <div className="py-12 text-center">
              <FileText className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <p className="mt-2 text-muted-foreground">
                {searchQuery || statusFilter !== "all" 
                  ? "No records match your filters." 
                  : "No borrowing records yet."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Equipment</TableHead>
                    <TableHead className="text-center">Qty</TableHead>
                    <TableHead>Borrow Date</TableHead>
                    <TableHead>Return Date</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                    <TableHead>Actual Return</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRecords.map((record) => (
                    <TableRow key={record.id} data-testid={`record-row-${record.id}`}>
                      <TableCell>
                        <div className="space-y-0.5">
                          <div className="font-medium">{record.user?.name}</div>
                          <div className="text-sm text-muted-foreground">{record.user?.email}</div>
                          {record.user?.studentId && (
                            <div className="text-xs text-muted-foreground">ID: {record.user.studentId}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-0.5">
                          <div className="font-medium">{record.equipment?.name}</div>
                          <div className="text-sm text-muted-foreground">{record.equipment?.category}</div>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">{record.quantity}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3 text-muted-foreground" />
                          {format(new Date(record.borrowDate), "MMM d, yyyy")}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3 text-muted-foreground" />
                          {format(new Date(record.expectedReturnDate), "MMM d, yyyy")}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <StatusBadge status={record.status} />
                      </TableCell>
                      <TableCell>
                        {record.actualReturnDate ? (
                          <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
                            <Calendar className="h-3 w-3" />
                            {format(new Date(record.actualReturnDate), "MMM d, yyyy")}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {filteredRecords.length > 0 && (
        <div className="text-sm text-muted-foreground text-center">
          Showing {filteredRecords.length} of {records?.length || 0} records
        </div>
      )}
    </div>
  );
}
