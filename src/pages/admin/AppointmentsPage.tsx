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

const statusStyles: Record<string, string> = {
  pending: "bg-[hsl(var(--status-pending)/0.1)] text-[hsl(var(--status-pending))] border-[hsl(var(--status-pending)/0.3)]",
  approved: "bg-[hsl(var(--status-approved)/0.1)] text-[hsl(var(--status-approved))] border-[hsl(var(--status-approved)/0.3)]",
  rescheduled: "bg-[hsl(var(--status-rescheduled)/0.1)] text-[hsl(var(--status-rescheduled))] border-[hsl(var(--status-rescheduled)/0.3)]",
  cancelled: "bg-[hsl(var(--status-cancelled)/0.1)] text-[hsl(var(--status-cancelled))] border-[hsl(var(--status-cancelled)/0.3)]",
};

type AppointmentWithService = Tables<"appointments"> & { services: Tables<"services"> | null };

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<AppointmentWithService[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [selected, setSelected] = useState<AppointmentWithService | null>(null);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const fetchAppointments = async () => {
    const { data } = await supabase
      .from("appointments")
      .select("*, services(*)")
      .order("appointment_date", { ascending: false });
    setAppointments((data as AppointmentWithService[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  const updateStatus = async (id: string, status: string) => {
    setSaving(true);
    await supabase.from("appointments").update({ status, notes }).eq("id", id);
    setSaving(false);
    toast({ title: `Appointment ${status}` });
    setSelected(null);
    fetchAppointments();
  };

  const filtered = appointments.filter((apt) => {
    const matchSearch =
      apt.patient_name.toLowerCase().includes(search.toLowerCase()) ||
      apt.patient_email.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "all" || apt.status === filterStatus;
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-serif">Appointments</h1>
        <p className="text-muted-foreground">Manage appointment requests and schedules</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search appointments..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Filter status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rescheduled">Rescheduled</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">No appointments found.</div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Patient</TableHead>
                <TableHead className="hidden md:table-cell">Service</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="hidden sm:table-cell">Time</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-10"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((apt) => (
                <TableRow key={apt.id} className="cursor-pointer" onClick={() => { setSelected(apt); setNotes(apt.notes || ""); }}>
                  <TableCell className="font-medium">{apt.patient_name}</TableCell>
                  <TableCell className="hidden md:table-cell text-muted-foreground">
                    {apt.services?.name || "—"}
                  </TableCell>
                  <TableCell>{format(new Date(apt.appointment_date), "MMM d, yyyy")}</TableCell>
                  <TableCell className="hidden sm:table-cell text-muted-foreground">
                    {apt.start_time.substring(0, 5)}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={statusStyles[apt.status]}>
                      {apt.status}
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
            <DialogTitle className="font-serif">Appointment Details</DialogTitle>
            <DialogDescription>{selected?.patient_name} — {selected?.services?.name}</DialogDescription>
          </DialogHeader>
          {selected && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Email</span>
                  <p className="font-medium">{selected.patient_email}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Phone</span>
                  <p className="font-medium">{selected.patient_phone}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Date</span>
                  <p className="font-medium">{format(new Date(selected.appointment_date), "PPP")}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Time</span>
                  <p className="font-medium">{selected.start_time.substring(0, 5)} – {selected.end_time.substring(0, 5)}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Duration</span>
                  <p className="font-medium">{selected.services?.duration_minutes} minutes</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Status</span>
                  <p>
                    <Badge variant="outline" className={statusStyles[selected.status]}>
                      {selected.status}
                    </Badge>
                  </p>
                </div>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">Notes</span>
                <Textarea
                  className="mt-1"
                  placeholder="Add notes..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
              <div className="flex flex-wrap gap-2">
                {selected.status !== "approved" && (
                  <Button size="sm" onClick={() => updateStatus(selected.id, "approved")} disabled={saving}
                    className="bg-status-approved hover:bg-status-approved/90 text-white">
                    Approve
                  </Button>
                )}
                {selected.status !== "rescheduled" && (
                  <Button size="sm" variant="outline" onClick={() => updateStatus(selected.id, "rescheduled")} disabled={saving}
                    className="border-status-rescheduled text-status-rescheduled hover:bg-status-rescheduled/10">
                    Reschedule
                  </Button>
                )}
                {selected.status !== "cancelled" && (
                  <Button size="sm" variant="outline" onClick={() => updateStatus(selected.id, "cancelled")} disabled={saving}
                    className="border-status-cancelled text-status-cancelled hover:bg-status-cancelled/10">
                    Cancel
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
