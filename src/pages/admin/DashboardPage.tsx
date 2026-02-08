import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessageSquare, CalendarDays, Clock, ArrowRight } from "lucide-react";
import { format } from "date-fns";

interface DashboardStats {
  pendingInquiries: number;
  pendingAppointments: number;
  todayAppointments: number;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    pendingInquiries: 0,
    pendingAppointments: 0,
    todayAppointments: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      const today = format(new Date(), "yyyy-MM-dd");

      const [inquiries, pendingAppts, todayAppts] = await Promise.all([
        supabase.from("inquiries").select("id", { count: "exact", head: true }).eq("status", "new"),
        supabase.from("appointments").select("id", { count: "exact", head: true }).eq("status", "pending"),
        supabase.from("appointments").select("id", { count: "exact", head: true }).eq("appointment_date", today).neq("status", "cancelled"),
      ]);

      setStats({
        pendingInquiries: inquiries.count || 0,
        pendingAppointments: pendingAppts.count || 0,
        todayAppointments: todayAppts.count || 0,
      });
      setLoading(false);
    };

    fetchStats();
  }, []);

  const cards = [
    {
      title: "New Inquiries",
      value: stats.pendingInquiries,
      icon: MessageSquare,
      link: "/admin/inquiries",
      color: "text-primary",
      bg: "bg-primary/10",
    },
    {
      title: "Pending Appointments",
      value: stats.pendingAppointments,
      icon: Clock,
      link: "/admin/appointments",
      color: "text-status-pending",
      bg: "bg-[hsl(var(--status-pending)/0.1)]",
    },
    {
      title: "Today's Appointments",
      value: stats.todayAppointments,
      icon: CalendarDays,
      link: "/admin/calendar",
      color: "text-status-approved",
      bg: "bg-[hsl(var(--status-approved)/0.1)]",
    },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-3xl font-serif">Dashboard</h1>
        <p className="text-muted-foreground">Welcome back. Here's your clinic overview.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {cards.map((card) => (
          <Card key={card.title} className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{card.title}</CardTitle>
              <div className={cn(card.bg, "h-8 w-8 rounded-full flex items-center justify-center")}>
                <card.icon className={cn("h-4 w-4", card.color)} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold mb-3">
                {loading ? "..." : card.value}
              </div>
              <Link to={card.link}>
                <Button variant="ghost" size="sm" className="gap-1 -ml-3 text-muted-foreground">
                  View Details <ArrowRight className="h-3 w-3" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link to="/admin/calendar">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="flex items-center gap-4 p-6">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <CalendarDays className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">Open Calendar</h3>
                <p className="text-sm text-muted-foreground">View and manage your appointment schedule</p>
              </div>
              <ArrowRight className="h-5 w-5 text-muted-foreground ml-auto" />
            </CardContent>
          </Card>
        </Link>
        <Link to="/admin/services">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="flex items-center gap-4 p-6">
              <div className="h-12 w-12 rounded-full bg-accent flex items-center justify-center">
                <Clock className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">Manage Services</h3>
                <p className="text-sm text-muted-foreground">Add, edit, or remove dental services</p>
              </div>
              <ArrowRight className="h-5 w-5 text-muted-foreground ml-auto" />
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}

function cn(...classes: (string | undefined | false)[]) {
  return classes.filter(Boolean).join(" ");
}
