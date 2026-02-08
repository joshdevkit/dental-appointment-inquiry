import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { Search, Eye, Loader2 } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

const statusColors: Record<string, string> = {
  new: "bg-primary/10 text-primary border-primary/20",
  read: "bg-muted text-muted-foreground border-border",
  archived: "bg-secondary text-secondary-foreground border-border",
};

export default function InquiriesPage() {
  const [inquiries, setInquiries] = useState<Tables<"inquiries">[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [selected, setSelected] = useState<Tables<"inquiries"> | null>(null);
  const [adminNotes, setAdminNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const fetchInquiries = async () => {
    const { data } = await supabase
      .from("inquiries")
      .select("*")
      .order("created_at", { ascending: false });
    setInquiries(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchInquiries();
  }, []);

  const updateStatus = async (id: string, status: string) => {
    setSaving(true);
    await supabase.from("inquiries").update({ status, admin_notes: adminNotes }).eq("id", id);
    setSaving(false);
    toast({ title: `Inquiry marked as ${status}` });
    setSelected(null);
    fetchInquiries();
  };

  const filtered = inquiries.filter((inq) => {
    const matchSearch =
      inq.full_name.toLowerCase().includes(search.toLowerCase()) ||
      inq.email.toLowerCase().includes(search.toLowerCase()) ||
      inq.message.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "all" || inq.status === filterStatus;
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-serif">Inquiries</h1>
        <p className="text-muted-foreground">View and manage patient inquiries</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search inquiries..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Filter status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="new">New</SelectItem>
            <SelectItem value="read">Read</SelectItem>
            <SelectItem value="archived">Archived</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">No inquiries found.</div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead className="hidden md:table-cell">Email</TableHead>
                <TableHead className="hidden lg:table-cell">Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-10"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((inq) => (
                <TableRow key={inq.id} className="cursor-pointer" onClick={() => { setSelected(inq); setAdminNotes(inq.admin_notes || ""); }}>
                  <TableCell className="font-medium">{inq.full_name}</TableCell>
                  <TableCell className="hidden md:table-cell text-muted-foreground">{inq.email}</TableCell>
                  <TableCell className="hidden lg:table-cell text-muted-foreground">{format(new Date(inq.created_at), "MMM d, yyyy")}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={statusColors[inq.status]}>
                      {inq.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-serif">Inquiry Details</DialogTitle>
            <DialogDescription>From {selected?.full_name}</DialogDescription>
          </DialogHeader>
          {selected && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Email</span>
                  <p className="font-medium">{selected.email}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Phone</span>
                  <p className="font-medium">{selected.contact_number}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Submitted</span>
                  <p className="font-medium">{format(new Date(selected.created_at), "PPP")}</p>
                </div>
                {selected.preferred_date && (
                  <div>
                    <span className="text-muted-foreground">Preferred Date</span>
                    <p className="font-medium">{format(new Date(selected.preferred_date), "PPP")}</p>
                  </div>
                )}
              </div>
              <div>
                <span className="text-sm text-muted-foreground">Message</span>
                <p className="mt-1 bg-muted/50 p-3 rounded-lg text-sm">{selected.message}</p>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">Admin Notes</span>
                <Textarea
                  className="mt-1"
                  placeholder="Add internal notes..."
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={() => updateStatus(selected.id, "read")} disabled={saving}>
                  Mark as Read
                </Button>
                <Button size="sm" variant="secondary" onClick={() => updateStatus(selected.id, "archived")} disabled={saving}>
                  Archive
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
