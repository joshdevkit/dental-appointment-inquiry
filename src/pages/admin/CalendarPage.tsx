import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  isToday,
} from "date-fns";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

type AppointmentWithService = Tables<"appointments"> & { services: Tables<"services"> | null };

const statusColors: Record<string, string> = {
  pending: "bg-status-pending",
  approved: "bg-status-approved",
  rescheduled: "bg-status-rescheduled",
  cancelled: "bg-status-cancelled",
};

const statusBadgeStyles: Record<string, string> = {
  pending: "bg-[hsl(var(--status-pending)/0.1)] text-[hsl(var(--status-pending))] border-[hsl(var(--status-pending)/0.3)]",
  approved: "bg-[hsl(var(--status-approved)/0.1)] text-[hsl(var(--status-approved))] border-[hsl(var(--status-approved)/0.3)]",
  rescheduled: "bg-[hsl(var(--status-rescheduled)/0.1)] text-[hsl(var(--status-rescheduled))] border-[hsl(var(--status-rescheduled)/0.3)]",
  cancelled: "bg-[hsl(var(--status-cancelled)/0.1)] text-[hsl(var(--status-cancelled))] border-[hsl(var(--status-cancelled)/0.3)]",
};

export default function CalendarPage() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [appointments, setAppointments] = useState<AppointmentWithService[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<AppointmentWithService | null>(null);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const fetchAppointments = async () => {
    const start = format(startOfMonth(currentMonth), "yyyy-MM-dd");
    const end = format(endOfMonth(currentMonth), "yyyy-MM-dd");

    const { data } = await supabase
      .from("appointments")
      .select("*, services(*)")
      .gte("appointment_date", start)
      .lte("appointment_date", end)
      .neq("status", "cancelled")
      .order("start_time", { ascending: true });

    setAppointments((data as AppointmentWithService[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchAppointments();

    // Realtime subscription
    const channel = supabase
      .channel("calendar-appointments")
      .on("postgres_changes", { event: "*", schema: "public", table: "appointments" }, () => {
        fetchAppointments();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [currentMonth]);

  const updateStatus = async (id: string, status: string) => {
    setSaving(true);
    await supabase.from("appointments").update({ status, notes }).eq("id", id);
    setSaving(false);
    toast({ title: `Appointment ${status}` });
    setSelected(null);
    fetchAppointments();
  };

  // Calendar grid
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const appointmentsByDate = useMemo(() => {
    const map: Record<string, AppointmentWithService[]> = {};
    appointments.forEach((apt) => {
      const key = apt.appointment_date;
      if (!map[key]) map[key] = [];
      map[key].push(apt);
    });
    return map;
  }, [appointments]);

  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-serif">Calendar</h1>
          <p className="text-muted-foreground">View your appointment schedule at a glance</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-lg font-semibold min-w-[160px] text-center">
            {format(currentMonth, "MMMM yyyy")}
          </span>
          <Button variant="outline" size="icon" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-sm">
        <div className="flex items-center gap-2"><div className="h-3 w-3 rounded-full bg-status-pending" /> Pending</div>
        <div className="flex items-center gap-2"><div className="h-3 w-3 rounded-full bg-status-approved" /> Approved</div>
        <div className="flex items-center gap-2"><div className="h-3 w-3 rounded-full bg-status-rescheduled" /> Rescheduled</div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : (
        <Card className="overflow-hidden">
          <CardContent className="p-0">
            {/* Week day headers */}
            <div className="grid grid-cols-7 border-b">
              {weekDays.map((day) => (
                <div key={day} className="p-2 text-center text-xs font-medium text-muted-foreground bg-muted/30">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7">
              {calendarDays.map((day, i) => {
                const dateKey = format(day, "yyyy-MM-dd");
                const dayAppointments = appointmentsByDate[dateKey] || [];
                const inMonth = isSameMonth(day, currentMonth);

                return (
                  <div
                    key={i}
                    className={`min-h-[100px] border-b border-r p-1.5 ${
                      !inMonth ? "bg-muted/20" : ""
                    } ${isToday(day) ? "bg-primary/5" : ""}`}
                  >
                    <div className={`text-xs mb-1 ${
                      isToday(day) ? "bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center" : 
                      !inMonth ? "text-muted-foreground/50" : "text-muted-foreground"
                    }`}>
                      {format(day, "d")}
                    </div>
                    <div className="space-y-0.5">
                      {dayAppointments.slice(0, 3).map((apt) => (
                        <button
                          key={apt.id}
                          onClick={() => { setSelected(apt); setNotes(apt.notes || ""); }}
                          className={`w-full text-left text-[10px] leading-tight px-1 py-0.5 rounded truncate text-white ${statusColors[apt.status]}`}
                        >
                          {apt.start_time.substring(0, 5)} {apt.patient_name.split(" ")[0]}
                        </button>
                      ))}
                      {dayAppointments.length > 3 && (
                        <div className="text-[10px] text-muted-foreground px-1">
                          +{dayAppointments.length - 3} more
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Appointment detail modal */}
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
                  <span className="text-muted-foreground">Status</span>
                  <p>
                    <Badge variant="outline" className={statusBadgeStyles[selected.status]}>
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
