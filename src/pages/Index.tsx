import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Heart, Shield, Smile, Clock, ArrowRight } from "lucide-react";

const features = [
  {
    icon: Smile,
    title: "Gentle Care",
    description: "We prioritize your comfort with gentle techniques and a warm, friendly environment.",
  },
  {
    icon: Shield,
    title: "Experienced Team",
    description: "Our skilled dental professionals bring years of expertise to every treatment.",
  },
  {
    icon: Clock,
    title: "Flexible Scheduling",
    description: "Book appointments online at your convenience — we work around your schedule.",
  },
];

const Index = () => {
  return (
    <div>
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-accent via-secondary to-background" />
        <div className="container relative py-24 md:py-32">
          <div className="max-w-2xl animate-fade-in">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary rounded-full px-4 py-1.5 text-sm font-medium mb-6">
              <Heart className="h-4 w-4 fill-primary/30" />
              Accepting new patients
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif leading-tight mb-6">
              Your smile deserves{" "}
              <span className="text-primary">the best care</span>
            </h1>
            <p className="text-lg text-muted-foreground mb-8 max-w-lg">
              Welcome to SmileCare Dental — where every visit feels like coming home. 
              Gentle, personalized dental care for you and your family.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link to="/book">
                <Button size="lg" className="rounded-full gap-2 w-full sm:w-auto">
                  Book an Appointment
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link to="/inquiry">
                <Button variant="outline" size="lg" className="rounded-full w-full sm:w-auto">
                  Send an Inquiry
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-serif mb-4">Why choose SmileCare?</h2>
          <p className="text-muted-foreground max-w-md mx-auto">
            We believe everyone deserves a healthy, beautiful smile — delivered with care and compassion.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {features.map((feature) => (
            <Card key={feature.title} className="border-none shadow-md hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <div className="h-12 w-12 rounded-full bg-accent flex items-center justify-center mb-4">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-primary/5 py-20">
        <div className="container text-center">
          <h2 className="text-3xl font-serif mb-4">Ready for your next visit?</h2>
          <p className="text-muted-foreground mb-8 max-w-md mx-auto">
            Schedule your appointment online in just a few clicks, or reach out with any questions.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/book">
              <Button size="lg" className="rounded-full gap-2">
                Book Now
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link to="/inquiry">
              <Button variant="outline" size="lg" className="rounded-full">
                Contact Us
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Index;
