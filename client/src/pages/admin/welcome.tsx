import { useAuth } from "@/lib/auth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowRight, Shield, Users, Package, BarChart3, Settings, ClipboardCheck, Zap, TrendingUp, Activity } from "lucide-react";
import { useEffect, useState } from "react";

export default function AdminWelcome() {
    const { user } = useAuth();
    const [, setLocation] = useLocation();
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        setIsVisible(true);
    }, []);

    const handleGoToDashboard = () => {
        setLocation("/admin/overview");
    };

    const capabilities = [
        {
            icon: ClipboardCheck,
            title: "Manage Requests",
            description: "Review, approve, or decline student borrowing requests",
            gradient: "from-blue-500 to-blue-600"
        },
        {
            icon: Package,
            title: "Inventory Control",
            description: "Add, edit, and track all equipment in the system",
            gradient: "from-purple-500 to-purple-600"
        },
        {
            icon: Users,
            title: "User Management",
            description: "Oversee student accounts and borrowing history",
            gradient: "from-green-500 to-green-600"
        },
        {
            icon: BarChart3,
            title: "Analytics & Reports",
            description: "Generate insights and reports on equipment usage",
            gradient: "from-orange-500 to-orange-600"
        },
        {
            icon: Settings,
            title: "System Settings",
            description: "Configure system preferences and policies",
            gradient: "from-pink-500 to-pink-600"
        },
        {
            icon: Shield,
            title: "Access Control",
            description: "Manage permissions and security settings",
            gradient: "from-cyan-500 to-cyan-600"
        }
    ];

    const stats = [
        { icon: Zap, label: "Quick Actions", value: "6+", color: "text-blue-500" },
        { icon: TrendingUp, label: "Full Control", value: "100%", color: "text-green-500" },
        { icon: Activity, label: "Real-time", value: "Live", color: "text-purple-500" }
    ];

    return (
        <div className="min-h-screen bg-background">
            {/* Header Section */}
            <div className="bg-gradient-to-r from-primary via-primary/95 to-primary/90 text-white">
                <div className="max-w-7xl mx-auto px-6 lg:px-8 py-12">
                    <div className={`transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                        <div className="flex items-center gap-3 mb-6">
                            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm ring-4 ring-white/30">
                                <Shield className="h-8 w-8" />
                            </div>
                            <div>
                                <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-xs font-medium mb-2">
                                    <span className="h-2 w-2 bg-green-400 rounded-full animate-pulse"></span>
                                    Administrator Access
                                </div>
                                <h1 className="text-3xl md:text-4xl font-bold">Welcome Back, {user?.name}</h1>
                            </div>
                        </div>
                        <p className="text-white/90 text-lg max-w-2xl">
                            You have full administrative access to the ToolLedger system. Manage equipment, approve requests, and oversee all operations.
                        </p>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-6 lg:px-8 py-12">
                {/* Stats Row */}
                <div className={`grid md:grid-cols-3 gap-6 mb-12 transition-all duration-1000 delay-200 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                    {stats.map((stat, index) => {
                        const Icon = stat.icon;
                        return (
                            <div key={index} className="bg-card border border-border rounded-xl p-6 hover:shadow-lg transition-shadow">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-muted-foreground mb-1">{stat.label}</p>
                                        <p className="text-3xl font-bold">{stat.value}</p>
                                    </div>
                                    <div className={`${stat.color}`}>
                                        <Icon className="h-10 w-10" />
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Capabilities Section */}
                <div className={`mb-12 transition-all duration-1000 delay-300 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                    <div className="mb-8">
                        <h2 className="text-2xl font-bold mb-2">Your Administrative Capabilities</h2>
                        <p className="text-muted-foreground">
                            Comprehensive tools to manage the entire equipment borrowing system
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {capabilities.map((capability, index) => {
                            const Icon = capability.icon;
                            return (
                                <div
                                    key={index}
                                    className="group bg-card border border-border rounded-xl p-6 hover:border-primary/50 hover:shadow-xl transition-all duration-300"
                                    style={{ transitionDelay: `${index * 50}ms` }}
                                >
                                    <div className={`inline-flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br ${capability.gradient} mb-4 group-hover:scale-110 transition-transform shadow-lg`}>
                                        <Icon className="h-7 w-7 text-white" />
                                    </div>
                                    <h3 className="font-semibold text-lg mb-2">{capability.title}</h3>
                                    <p className="text-sm text-muted-foreground leading-relaxed">
                                        {capability.description}
                                    </p>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Important Notice */}
                <div className={`bg-primary/5 border-l-4 border-primary rounded-lg p-6 mb-8 transition-all duration-1000 delay-500 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                    <div className="flex items-start gap-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 flex-shrink-0">
                            <Shield className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-lg mb-2">Administrator Responsibilities</h3>
                            <p className="text-muted-foreground leading-relaxed">
                                As an administrator, you have full access to manage the equipment borrowing system.
                                Please ensure all requests are processed promptly and equipment inventory is kept up to date.
                                Your actions directly impact the student experience and system efficiency.
                            </p>
                        </div>
                    </div>
                </div>

                {/* CTA Section */}
                <div className={`text-center transition-all duration-1000 delay-600 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                    <Button
                        size="lg"
                        onClick={handleGoToDashboard}
                        className="px-10 py-6 text-base font-medium shadow-lg hover:shadow-xl transition-all group"
                    >
                        Go to Dashboard
                        <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                    </Button>
                    <p className="text-sm text-muted-foreground mt-6">
                        Holy Cross of Davao College - Admin Portal
                    </p>
                </div>
            </div>
        </div>
    );
}
