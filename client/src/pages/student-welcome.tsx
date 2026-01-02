import { useAuth } from "@/lib/auth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowRight, Package, Clock, CheckCircle2, Sparkles, BookOpen, Bell } from "lucide-react";
import { useEffect, useState } from "react";

export default function StudentWelcome() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const handleGetStarted = () => {
    setLocation("/");
  };

  const features = [
    {
      icon: Package,
      title: "Browse Equipment",
      description: "Access a wide range of tools and equipment available for borrowing",
      color: "from-blue-500 to-cyan-500"
    },
    {
      icon: Clock,
      title: "Track Requests",
      description: "Monitor your borrowing requests and return deadlines in real-time",
      color: "from-purple-500 to-pink-500"
    },
    {
      icon: CheckCircle2,
      title: "Easy Returns",
      description: "Simple and streamlined process for returning borrowed equipment",
      color: "from-green-500 to-emerald-500"
    }
  ];

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left Side - Hero Section */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary via-primary/90 to-primary/70 relative overflow-hidden">
        {/* Animated Background Patterns */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-72 h-72 bg-white rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-white rounded-full blur-3xl animate-pulse delay-700"></div>
        </div>

        <div className="relative z-10 flex flex-col justify-center px-16 text-white">
          <div className={`transition-all duration-1000 ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-8'}`}>
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full mb-6">
              <Sparkles className="h-4 w-4" />
              <span className="text-sm font-medium">Equipment Management System</span>
            </div>

            <h1 className="text-5xl font-bold mb-6 leading-tight">
              Welcome to<br />ToolLedger
            </h1>

            <p className="text-xl text-white/90 mb-8 leading-relaxed">
              Your comprehensive solution for managing equipment borrowing at Holy Cross of Davao College
            </p>

            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/20 backdrop-blur-sm">
                  <BookOpen className="h-5 w-5" />
                </div>
                <span className="text-white/90">Easy-to-use interface</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/20 backdrop-blur-sm">
                  <Bell className="h-5 w-5" />
                </div>
                <span className="text-white/90">Real-time notifications</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/20 backdrop-blur-sm">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
                <span className="text-white/90">Seamless borrowing process</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Content */}
      <div className="flex-1 flex items-center justify-center p-8 lg:p-16">
        <div className={`w-full max-w-xl transition-all duration-1000 delay-300 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          {/* Mobile Header */}
          <div className="lg:hidden mb-8 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full mb-4">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-primary">Equipment Management</span>
            </div>
            <h1 className="text-4xl font-bold mb-2">Welcome to ToolLedger</h1>
          </div>

          {/* Greeting Card */}
          <div className="bg-gradient-to-br from-primary/5 via-primary/10 to-accent/5 rounded-2xl p-8 mb-8 border border-primary/10">
            <div className="flex items-center gap-4 mb-4">
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-2xl font-bold text-primary">
                  {user?.name?.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Hello,</p>
                <h2 className="text-2xl font-semibold">{user?.name}</h2>
              </div>
            </div>
            <p className="text-muted-foreground">
              We're excited to have you here. Let's get you started with borrowing equipment!
            </p>
          </div>

          {/* Features Grid */}
          <div className="space-y-4 mb-8">
            <h3 className="text-lg font-semibold mb-4">What you can do:</h3>
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div
                  key={index}
                  className={`group p-5 rounded-xl border border-border bg-card hover:border-primary/50 transition-all duration-300 hover:shadow-lg ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4'
                    }`}
                  style={{ transitionDelay: `${400 + index * 100}ms` }}
                >
                  <div className="flex items-start gap-4">
                    <div className={`flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br ${feature.color} flex-shrink-0 group-hover:scale-110 transition-transform`}>
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium mb-1">{feature.title}</h4>
                      <p className="text-sm text-muted-foreground">{feature.description}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Quick Tips */}
          <div className="bg-muted/50 rounded-xl p-6 mb-8">
            <h3 className="font-medium mb-3 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              Quick Tips
            </h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                <span>Submit borrowing requests through the dashboard form</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                <span>Check your request status and upcoming return dates</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                <span>Return equipment on time to maintain good privileges</span>
              </li>
            </ul>
          </div>

          {/* CTA Button */}
          <Button
            size="lg"
            onClick={handleGetStarted}
            className="w-full text-base font-medium shadow-lg hover:shadow-xl transition-all group"
          >
            Get Started
            <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
          </Button>

          <p className="text-center text-sm text-muted-foreground mt-6">
            Holy Cross of Davao College
          </p>
        </div>
      </div>
    </div>
  );
}
