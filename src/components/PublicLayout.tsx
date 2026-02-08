import { Outlet, Link } from "react-router-dom";
import { Heart, Phone, Mail, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function PublicLayout() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2">
            <Heart className="h-6 w-6 text-primary fill-primary/20" />
            <span className="font-serif text-xl">SmileCare Dental</span>
          </Link>
          <nav className="hidden md:flex items-center gap-6">
            <Link to="/" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Home
            </Link>
            <Link to="/inquiry" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Contact Us
            </Link>
            <Link to="/book">
              <Button size="sm" className="rounded-full">
                Book Appointment
              </Button>
            </Link>
          </nav>
          <div className="md:hidden">
            <Link to="/book">
              <Button size="sm" className="rounded-full">
                Book Now
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="border-t bg-card py-12">
        <div className="container">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Heart className="h-5 w-5 text-primary fill-primary/20" />
                <span className="font-serif text-lg">SmileCare Dental</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Providing gentle, comprehensive dental care for the whole family.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Contact</h4>
              <div className="space-y-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  <span>(555) 123-4567</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  <span>hello@smilecare.com</span>
                </div>
              </div>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Hours</h4>
              <div className="space-y-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  <span>Mon–Fri: 9:00 AM – 5:00 PM</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  <span>Sat: 9:00 AM – 1:00 PM</span>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t text-center text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} SmileCare Dental Clinic. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
