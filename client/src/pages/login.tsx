import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLocation } from "wouter";
import { Wrench, Eye, EyeOff, Loader2, Shield, Sparkles, Lock, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { ThemeToggle } from "@/components/theme-toggle";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [, setLocation] = useLocation();
  const { login } = useAuth();
  const { toast } = useToast();

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginFormValues) => {
    setIsLoading(true);
    try {
      await login(data.email, data.password);
      toast({
        title: "Welcome back!",
        description: "You have successfully logged in.",
      });
      // navigate to welcome page and reload to ensure session cookie is active
      setLocation("/welcome");
      if (typeof window !== "undefined") {
        window.location.replace("/welcome");
      }
    } catch (error) {
      toast({
        title: "Login failed",
        description: error instanceof Error ? error.message : "Invalid email or password",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAdminQuickLogin = () => {
    form.setValue("email", "admin@example.com");
    form.setValue("password", "AdminPass123");
  };

  return (
    <div className="min-h-screen flex bg-background">
      {/* Theme Toggle */}
      <div className="absolute top-4 right-4 z-50">
        <ThemeToggle />
      </div>

      {/* Left Side - Hero Section */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary via-primary/90 to-primary/70 relative overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-72 h-72 bg-white rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-white rounded-full blur-3xl animate-pulse" style={{ animationDelay: '700ms' }}></div>
        </div>

        <div className="relative z-10 flex flex-col justify-center px-16 text-white">
          <div className="mb-8">
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm mb-6">
              <Wrench className="h-10 w-10" />
            </div>
            <h1 className="text-5xl font-bold mb-4 leading-tight">
              ToolLedger
            </h1>
            <p className="text-xl text-white/90 mb-8 leading-relaxed">
              Equipment Borrowing Management System
            </p>
          </div>

          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-white/20 backdrop-blur-sm flex-shrink-0">
                <Sparkles className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Streamlined Process</h3>
                <p className="text-white/80 text-sm">Borrow and return equipment with ease</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-white/20 backdrop-blur-sm flex-shrink-0">
                <Shield className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Secure & Reliable</h3>
                <p className="text-white/80 text-sm">Your data is protected and secure</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-white/20 backdrop-blur-sm flex-shrink-0">
                <Lock className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Role-Based Access</h3>
                <p className="text-white/80 text-sm">Student and admin portals with tailored features</p>
              </div>
            </div>
          </div>

          <div className="mt-12 pt-8 border-t border-white/20">
            <p className="text-white/70 text-sm">
              Holy Cross of Davao College
            </p>
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="flex-1 flex items-center justify-center p-8 lg:p-16">
        <div className="w-full max-w-md">
          {/* Mobile Header */}
          <div className="lg:hidden text-center mb-8">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary mx-auto mb-4">
              <Wrench className="h-8 w-8 text-primary-foreground" />
            </div>
            <h1 className="text-3xl font-bold mb-2">ToolLedger</h1>
            <p className="text-muted-foreground">Equipment Borrowing Management</p>
          </div>

          {/* Login Card */}
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-2">Welcome back</h2>
              <p className="text-muted-foreground">Sign in to your account to continue</p>
            </div>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            type="email"
                            placeholder="Enter your email"
                            className="pl-10"
                            data-testid="input-email"
                            {...field}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            type={showPassword ? "text" : "password"}
                            placeholder="Enter your password"
                            className="pr-10"
                            data-testid="input-password"
                            {...field}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                            onClick={() => setShowPassword(!showPassword)}
                            data-testid="button-toggle-password"
                          >
                            {showPassword ? (
                              <EyeOff className="h-4 w-4 text-muted-foreground" />
                            ) : (
                              <Eye className="h-4 w-4 text-muted-foreground" />
                            )}
                          </Button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  className="w-full"
                  disabled={isLoading}
                  data-testid="button-login"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    "Sign In"
                  )}
                </Button>
              </form>
            </Form>

            {/* Admin Quick Login */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  Quick Access
                </span>
              </div>
            </div>

            <Button
              variant="outline"
              className="w-full border-primary/20 hover:bg-primary/5 hover:border-primary/40"
              onClick={handleAdminQuickLogin}
              type="button"
            >
              <Shield className="mr-2 h-4 w-4 text-primary" />
              Fill Admin Credentials
            </Button>

            {/* Register Link */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  New to ToolLedger?
                </span>
              </div>
            </div>

            <Button
              variant="outline"
              className="w-full"
              onClick={() => setLocation("/register")}
              data-testid="button-register-link"
            >
              Create an Account
            </Button>
          </div>

          {/* Footer */}
          <p className="text-center text-sm text-muted-foreground mt-8 lg:hidden">
            Holy Cross of Davao College
          </p>
        </div>
      </div>
    </div>
  );
}
