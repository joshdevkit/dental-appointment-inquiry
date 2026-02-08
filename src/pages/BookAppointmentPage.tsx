import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { CalendarIcon, CheckCircle2, Loader2, Clock } from "lucide-react";
import { format, addMinutes, parse, isBefore } from "date-fns";
import { cn } from "@/lib/utils";
import type { Tables } from "@/integrations/supabase/types";

const bookingSchema = z.object({
  patient_name: z.string().trim().min(2, "Name must be at least 2 characters").max(100),
  patient_email: z.string().trim().email("Please enter a valid email").max(255),
  patient_phone: z.string().trim().min(7, "Please enter a valid phone number").max(20),
  service_id: z.string().min(1, "Please select a service"),
  appointment_date: z.date({ required_error: "Please select a date" }),
  start_time: z.string().min(1, "Please select a time slot"),
});

type BookingFormData = z.infer<typeof bookingSchema>;

const CLINIC_START = "09:00";
const CLINIC_END = "17:00";

function generateTimeSlots(
  durationMinutes: number,
  bookedSlots: { start_time: string; end_time: string }[]
): string[] {
  const slots: string[] = [];
  let current = parse(CLINIC_START, "HH:mm", new Date());
  const end = parse(CLINIC_END, "HH:mm", new Date());

  while (isBefore(addMinutes(current, durationMinutes), end) || addMinutes(current, durationMinutes).getTime() === end.getTime()) {
    const slotStart = format(current, "HH:mm");
    const slotEnd = format(addMinutes(current, durationMinutes), "HH:mm");

    const isConflict = bookedSlots.some((booked) => {
      const bs = booked.start_time.substring(0, 5);
      const be = booked.end_time.substring(0, 5);
      return (slotStart >= bs && slotStart < be) || (slotEnd > bs && slotEnd <= be) || (slotStart <= bs && slotEnd >= be);
    });

    if (!isConflict) {
      slots.push(slotStart);
    }

    current = addMinutes(current, 30); // step by 30 minutes
  }

  return slots;
}

export default function BookAppointmentPage() {
  const [services, setServices] = useState<Tables<"services">[]>([]);
  const [bookedSlots, setBookedSlots] = useState<{ start_time: string; end_time: string }[]>([]);
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const { toast } = useToast();

  const form = useForm<BookingFormData>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      patient_name: "",
      patient_email: "",
      patient_phone: "",
      service_id: "",
      start_time: "",
    },
  });

  const selectedServiceId = form.watch("service_id");
  const selectedDate = form.watch("appointment_date");
  const selectedService = services.find((s) => s.id === selectedServiceId);

  // Fetch active services
  useEffect(() => {
    supabase
      .from("services")
      .select("*")
      .eq("is_active", true)
      .then(({ data }) => {
        if (data) setServices(data);
      });
  }, []);

  // Fetch booked slots when date changes
  useEffect(() => {
    if (!selectedDate) return;

    const fetchBooked = async () => {
      setLoadingSlots(true);
      form.setValue("start_time", "");
      const dateStr = format(selectedDate, "yyyy-MM-dd");
      const { data } = await supabase.rpc("get_booked_slots", { target_date: dateStr });
      setBookedSlots(data || []);
      setLoadingSlots(false);
    };

    fetchBooked();
  }, [selectedDate]);

  // Regenerate available slots when service or booked slots change
  useEffect(() => {
    if (!selectedService) {
      setAvailableSlots([]);
      return;
    }
    const slots = generateTimeSlots(selectedService.duration_minutes, bookedSlots);
    setAvailableSlots(slots);
  }, [selectedService, bookedSlots]);

  const onSubmit = async (data: BookingFormData) => {
    if (!selectedService) return;

    setIsSubmitting(true);
    const startTime = data.start_time + ":00";
    const endTime = format(addMinutes(parse(data.start_time, "HH:mm", new Date()), selectedService.duration_minutes), "HH:mm:ss");

    const { error } = await supabase.from("appointments").insert({
      patient_name: data.patient_name,
      patient_email: data.patient_email,
      patient_phone: data.patient_phone,
      service_id: data.service_id,
      appointment_date: format(data.appointment_date, "yyyy-MM-dd"),
      start_time: startTime,
      end_time: endTime,
    });

    setIsSubmitting(false);

    if (error) {
      toast({
        title: "Booking failed",
        description: error.message.includes("already booked")
          ? "This time slot was just taken. Please select another."
          : "Something went wrong. Please try again.",
        variant: "destructive",
      });
      return;
    }

    setSubmitted(true);
    toast({ title: "Appointment requested!", description: "We'll confirm your appointment soon." });
  };

  if (submitted) {
    return (
      <div className="container py-20">
        <div className="max-w-md mx-auto text-center animate-fade-in">
          <div className="h-16 w-16 rounded-full bg-status-approved/10 flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="h-8 w-8 text-status-approved" />
          </div>
          <h1 className="text-3xl font-serif mb-4">Request Submitted!</h1>
          <p className="text-muted-foreground mb-6">
            Your appointment request has been submitted. Our team will review and confirm it shortly.
          </p>
          <Button variant="outline" onClick={() => { setSubmitted(false); form.reset(); }}>
            Book Another Appointment
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-12">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-serif mb-3">Book an Appointment</h1>
          <p className="text-muted-foreground">
            Select a service, choose your preferred date and time, and we'll confirm your booking.
          </p>
        </div>

        <Card className="border-none shadow-lg">
          <CardContent className="pt-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                <FormField
                  control={form.control}
                  name="patient_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        <Input placeholder="John Doe" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="patient_email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="john@example.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="patient_phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone Number</FormLabel>
                        <FormControl>
                          <Input placeholder="(555) 123-4567" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="service_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Service</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a dental service" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {services.map((service) => (
                            <SelectItem key={service.id} value={service.id}>
                              {service.name} ({service.duration_minutes} min)
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="appointment_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Preferred Date</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full justify-start text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {field.value ? format(field.value, "PPP") : "Pick a date"}
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) => {
                              const today = new Date();
                              today.setHours(0, 0, 0, 0);
                              return date < today || date.getDay() === 0; // No Sundays
                            }}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {selectedDate && selectedService && (
                  <FormField
                    control={form.control}
                    name="start_time"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Available Time Slots</FormLabel>
                        {loadingSlots ? (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Loading available slots...
                          </div>
                        ) : availableSlots.length === 0 ? (
                          <p className="text-sm text-muted-foreground py-2">
                            No available slots for this date. Please try another date.
                          </p>
                        ) : (
                          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                            {availableSlots.map((slot) => (
                              <Button
                                key={slot}
                                type="button"
                                variant={field.value === slot ? "default" : "outline"}
                                size="sm"
                                className="gap-1"
                                onClick={() => field.onChange(slot)}
                              >
                                <Clock className="h-3 w-3" />
                                {slot}
                              </Button>
                            ))}
                          </div>
                        )}
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                <Button type="submit" className="w-full rounded-full" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    "Request Appointment"
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
