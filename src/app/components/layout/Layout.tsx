import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { LayoutDashboard, PlusCircle, History, Activity, Menu, User, Settings, Bell, FileText, HelpCircle, LogOut, ChevronRight, Shield, Leaf } from "lucide-react";
import { useState, useEffect, useContext } from "react";
import { supabase } from "../../../lib/supabaseClient";
import { AuthContext } from "../../App";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetDescription,
} from "../ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Separator } from "../ui/separator";
import { VisuallyHidden } from "../ui/visually-hidden";
import { toast } from "sonner";

export function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [logoError, setLogoError] = useState(false);
  
  // Access context reactively from AuthContext
  const context = useContext(AuthContext);
  
  const isMessUser = context?.role === "mess";
  const isAdminUser = context?.role === "admin";
  const [userEntries, setUserEntries] = useState(0);

  // Fetch dynamic user contribution count
  useEffect(() => {
    if (context?.userId) {
      const fetchCount = async () => {
        try {
          const { count: wCount } = await supabase
            .from("waste_entries")
            .select("*", { count: "exact", head: true })
            .eq("created_by", context.userId);
          const { count: fCount } = await supabase
            .from("fertilizer_entries")
            .select("*", { count: "exact", head: true })
            .eq("created_by", context.userId);
          setUserEntries((wCount || 0) + (fCount || 0));
        } catch (err) {
          console.error("Error fetching user contributions:", err);
        }
      };
      fetchCount();
    }
  }, [context?.userId]);

  const isWorkerUser = context?.role === "worker";

  // Redirect mess → live, admin/worker → away from live
  useEffect(() => {
    if (context?.role) {
      if (isMessUser && location.pathname !== "/live-monitoring") {
        navigate("/live-monitoring", { replace: true });
      } else if (!isAdminUser && location.pathname === "/admin") {
        navigate(isMessUser ? "/live-monitoring" : "/", { replace: true });
      } else if ((isAdminUser || isWorkerUser) && location.pathname === "/live-monitoring") {
        navigate("/", { replace: true });
      }
    }
  }, [context?.role, location.pathname, isMessUser, isAdminUser, isWorkerUser, navigate]);

  const navItems = isMessUser
    ? [{ path: "/live-monitoring", icon: Activity, label: "Live" }]
    : [
        { path: "/", icon: LayoutDashboard, label: "Dashboard" },
        { path: "/add-entry", icon: PlusCircle, label: "Add Entry" },
        { path: "/history", icon: History, label: "History" },
      ];

  const menuItems = [
    ...(isAdminUser
      ? [
          {
            icon: Shield,
            label: "Admin Panel",
            action: () => {
              navigate("/admin");
              setIsOpen(false);
            },
          },
        ]
      : []),
    {
      icon: User,
      label: "Profile",
      action: () => {
        navigate("/profile");
        setIsOpen(false);
      },
    },
    {
      icon: Settings,
      label: "Settings",
      action: () => {
        navigate("/settings");
        setIsOpen(false);
      },
    },
    {
      icon: FileText,
      label: "Reports",
      action: () => {
        navigate("/reports");
        setIsOpen(false);
      },
    },
    {
      icon: HelpCircle,
      label: "About",
      action: () => {
        navigate("/about");
        setIsOpen(false);
      },
    },
  ];

  const isActive = (path: string) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  };

  const handleLogout = () => {
    // Call the logout handler from context if available
    if (context?.onLogout) {
      context.onLogout();
    }
    setIsOpen(false);
  };

  const displayName = context?.username ? context.username.split("@")[0] : "User";
  const initials = displayName.slice(0, 2).toUpperCase();
  const displayRole = context?.role
    ? context.role === "mess"
      ? "Mess User"
      : context.role.charAt(0).toUpperCase() + context.role.slice(1)
    : "Mess User";

  const isLivePage = location.pathname === "/live-monitoring";

  return (
    <div className={`flex flex-col min-h-[100dvh] h-[100dvh] bg-background relative ${
      isLivePage ? "w-full" : "max-w-md mx-auto"
    }`}>
      <header 
        className="bg-[#ffffff] dark:bg-card text-gray-900 dark:text-white px-4 pb-3 border-b border-gray-100 dark:border-border shadow-sm transition-colors duration-200"
        style={{ paddingTop: "calc(12px + env(safe-area-inset-top, 0px))" }}
      >
        <div className="relative flex items-center justify-between w-full">
          {/* Left: Hamburger */}
          <div className="flex items-center">
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors text-gray-700 dark:text-gray-200" title="Open Menu">
                  <Menu className="w-6 h-6" />
                </button>
              </SheetTrigger>
              <SheetContent 
                side="left" 
                className="w-[85%] max-w-[320px] p-0 left-0 right-auto"
                style={{ 
                  position: 'fixed',
                  left: 'max(0px, calc((100vw - 448px) / 2))',
                  maxWidth: '320px'
                }}
              >
                <VisuallyHidden>
                  <SheetTitle>Menu</SheetTitle>
                </VisuallyHidden>
                <VisuallyHidden>
                  <SheetDescription>
                    Access your profile, settings, notifications, reports, and other app features
                  </SheetDescription>
                </VisuallyHidden>
                <div className="flex flex-col h-full">
                  {/* Profile Section */}
                  <div className="bg-gradient-to-br from-[#1E8449] to-[#166534] p-6 text-white">
                    <div className="flex items-center gap-4">
                      <Avatar className="w-16 h-16 border-2 border-white">
                        <AvatarImage src="" alt="User" />
                        <AvatarFallback className="bg-white/20 text-white text-xl">
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-semibold text-lg">{displayName}</h3>
                        <p className="text-sm text-white/90">{displayRole}</p>
                      </div>
                    </div>
                  </div>


                  {/* Menu Items */}
                  <div className="flex-1 overflow-y-auto p-4 bg-white dark:bg-card">
                    <div className="space-y-2">
                      {menuItems.map((item, index) => {
                        const Icon = item.icon;
                        return (
                          <button
                            key={index}
                            onClick={item.action}
                            className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-[#D1FAE5] dark:hover:bg-green-950/20 transition-colors group"
                          >
                            <div className="flex items-center gap-3">
                              <div className="bg-[#D1FAE5] dark:bg-green-900/30 p-2 rounded-lg group-hover:bg-[#A7F3D0] dark:group-hover:bg-green-900/50 transition-colors">
                                <Icon className="w-5 h-5 text-[#1E8449] dark:text-green-400" />
                              </div>
                              <span className="font-medium text-gray-700 dark:text-gray-200">
                                {item.label}
                              </span>
                            </div>
                            <ChevronRight className="w-5 h-5 text-gray-400 dark:text-gray-500 group-hover:text-[#1E8449] dark:group-hover:text-green-400 transition-colors" />
                          </button>
                        );
                      })}
                    </div>

                    <Separator className="my-4 dark:bg-border" />

                    {/* About Section */}

                    {/* Logout Button */}
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center justify-center gap-2 p-3 rounded-xl bg-red-50 dark:bg-red-950/20 hover:bg-red-100 dark:hover:bg-red-950/40 text-red-600 dark:text-red-400 font-medium transition-colors"
                    >
                      <LogOut className="w-5 h-5" />
                      <span>Logout</span>
                    </button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>

          {/* Center: Logo — absolutely centered */}
          <div className="absolute left-1/2 -translate-x-1/2">
            {!logoError ? (
              <img
                src="/logo_header.png"
                onError={() => setLogoError(true)}
                className="h-13 w-auto max-w-[240px] object-contain mix-blend-multiply dark:mix-blend-normal dark:brightness-0 dark:invert"
                alt="Brand Logo"
              />
            ) : (
              <Leaf className="w-8 h-8 text-[#1E8449] dark:text-green-400" />
            )}
          </div>

          {/* Right: spacer to balance hamburger */}
          <div className="w-10" />
        </div>
      </header>

      {/* Main Content */}
      <main className={`flex-1 min-h-0 ${isLivePage ? "overflow-hidden" : "overflow-y-auto pb-16"}`}>
        <div className={isLivePage ? "h-full" : ""}>
          <Outlet />
        </div>
      </main>

      {/* Bottom Navigation */}
      <nav className={`fixed bottom-0 left-0 right-0 bg-white dark:bg-card border-t border-gray-200 dark:border-border shadow-lg ${
        isLivePage ? "w-full" : "max-w-md mx-auto"
      }`}>
        <div className="flex justify-around items-center h-14">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${
                  active
                    ? "text-[#1E8449]"
                    : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                }`}
              >
                <Icon className={`w-5 h-5 ${active ? "stroke-[2.5]" : ""}`} />
                <span className="text-[10px] mt-0.5">{item.label}</span>
              </Link>
            );
          })}
          {/* Profile button in nav — only for non-mess users */}
          {!isMessUser && (
            <button
              onClick={() => navigate("/profile")}
              className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${
                isActive("/profile")
                  ? "text-[#1E8449]"
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
              }`}
            >
              <User className={`w-5 h-5 ${isActive("/profile") ? "stroke-[2.5]" : ""}`} />
              <span className="text-[10px] mt-0.5">Profile</span>
            </button>
          )}
        </div>
      </nav>
    </div>
  );
}