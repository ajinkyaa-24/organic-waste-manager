import { useState, useEffect, createContext } from "react";
import { RouterProvider } from "react-router-dom";
import { Toaster } from "./components/ui/sonner";
import { router } from "./routes";
import { Login } from "./pages/Login";
import { supabase } from "../lib/supabaseClient";
import { KeyRound, Lock } from "lucide-react";
import { toast } from "sonner";

export const AuthContext = createContext<any>(null);

export default function App() {
  const [session, setSession] = useState<any>(null);
  const [role, setRole] = useState<string>("mess");
  const [loading, setLoading] = useState(true);
  const [showSplash, setShowSplash] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);

  // Recovery modal state
  const [showRecoveryModal, setShowRecoveryModal] = useState(false);
  const [recoveryPassword, setRecoveryPassword] = useState("");
  const [recoveryConfirmPassword, setRecoveryConfirmPassword] = useState("");
  const [resettingPassword, setResettingPassword] = useState(false);

  useEffect(() => {
    const fadeTimer = setTimeout(() => setFadeOut(true), 1700);
    const removeTimer = setTimeout(() => setShowSplash(false), 2000);
    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(removeTimer);
    };
  }, []);

  const fetchUserProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", userId)
        .single();

      if (error) {
        console.error("Error fetching user profile:", error);
        // Do not force log out on profile load error (e.g., table missing, RLS policy, or missing record during recovery)
        setRole("mess");
      } else if (data) {
        setRole(data.role);
      }
    } catch (err) {
      console.error(err);
      setRole("mess");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        fetchUserProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    // Listen to changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === "PASSWORD_RECOVERY") {
          setSession(session);
          setShowRecoveryModal(true);
          setLoading(false);
          return;
        }

        setSession(session);
        if (session) {
          await fetchUserProfile(session.user.id);
        } else {
          setRole("mess");
          setLoading(false);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Apply saved theme at boot time
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const handleRecoverySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (recoveryPassword.length < 6) {
      toast.error("Password must be at least 6 characters long");
      return;
    }
    if (recoveryPassword !== recoveryConfirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    setResettingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: recoveryPassword });
      if (error) {
        toast.error(error.message);
      } else {
        setShowRecoveryModal(false);
        // Clear recovery credentials
        setRecoveryPassword("");
        setRecoveryConfirmPassword("");
        // Load user profile to complete login
        if (session) {
          await fetchUserProfile(session.user.id);
        }
      }
    } catch (err: any) {
      console.error(err);
      toast.error("Failed to reset password");
    } finally {
      setResettingPassword(false);
    }
  };

  // Store context globally for components to access
  useEffect(() => {
    (window as any).__ROUTE_CONTEXT__ = {
      username: session?.user?.email || "",
      role,
      onLogout: handleLogout,
      userId: session?.user?.id || null,
    };
  }, [session, role]);

  return (
    <AuthContext.Provider value={{ username: session?.user?.email || "", role, onLogout: handleLogout, userId: session?.user?.id || null }}>
      {/* Main App Content */}
      {loading ? (
        <div className="min-h-screen flex items-center justify-center bg-[#F8FBF9]">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-gray-500 font-medium">Loading session...</p>
          </div>
        </div>
      ) : !session ? (
        <>
          <Login />
          <Toaster position="top-center" />
        </>
      ) : (
        <>
          <RouterProvider router={router} />
          <Toaster position="top-center" />
        </>
      )}

      {/* Password Recovery Modal Overlay */}
      {showRecoveryModal && (
        <div className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-sm z-[99999] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-card rounded-3xl p-6 shadow-2xl max-w-[360px] w-full border border-green-50 dark:border-border space-y-4 animate-scale-up">
            <div className="flex items-center gap-3 border-b border-gray-100 dark:border-border pb-3">
              <div className="bg-green-100 dark:bg-green-950/30 p-2 rounded-xl text-[#1E8449]">
                <KeyRound className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                  Reset Password
                </h2>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Secure your account with a new password
                </p>
              </div>
            </div>

            <form onSubmit={handleRecoverySubmit} className="space-y-4">
              <div className="space-y-1">
                <input
                  type="password"
                  placeholder="New Password (min 6 chars)"
                  value={recoveryPassword}
                  onChange={(e) => setRecoveryPassword(e.target.value)}
                  className="w-full px-4 py-3 text-sm rounded-xl border border-gray-200 dark:border-border focus:border-[#1E8449] focus:ring-2 focus:ring-[#A7F3D0] dark:focus:ring-green-900/30 focus:outline-none bg-white dark:bg-gray-900 text-gray-900 dark:text-white transition-all"
                />
              </div>

              <div className="space-y-1">
                <input
                  type="password"
                  placeholder="Confirm New Password"
                  value={recoveryConfirmPassword}
                  onChange={(e) => setRecoveryConfirmPassword(e.target.value)}
                  className="w-full px-4 py-3 text-sm rounded-xl border border-gray-200 dark:border-border focus:border-[#1E8449] focus:ring-2 focus:ring-[#A7F3D0] dark:focus:ring-green-900/30 focus:outline-none bg-white dark:bg-gray-900 text-gray-900 dark:text-white transition-all"
                />
              </div>

              <button
                type="submit"
                disabled={resettingPassword || !recoveryPassword || recoveryPassword.length < 6 || recoveryPassword !== recoveryConfirmPassword}
                className="w-full bg-gradient-to-r from-[#1E8449] to-[#166534] text-white py-3 rounded-xl font-semibold text-sm hover:from-[#166534] hover:to-[#0F4C2A] transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                <Lock className="w-4.5 h-4.5" />
                <span>{resettingPassword ? "Updating..." : "Update & Login"}</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Startup Animated Splash Screen Overlay */}
      {showSplash && (
        <div 
          className={`fixed inset-0 z-[99999] bg-[#1E8449] flex items-center justify-center transition-all duration-300 ease-out ${
            fadeOut ? "opacity-0 pointer-events-none scale-105" : "opacity-100"
          }`}
        >
          <div className="bg-white dark:bg-gray-800 rounded-3xl p-8 shadow-2xl flex flex-col items-center gap-5 max-w-[280px] w-full mx-4 border border-white/10 transform transition-all duration-500">
            <img
              src="/logo_login.png"
              className="h-20 w-auto object-contain"
              alt="Logo"
            />
            <div className="flex flex-col items-center gap-1">
              <h1 className="text-lg font-bold text-gray-800 dark:text-white">BioCycle</h1>
              <p className="text-[10px] text-gray-400 dark:text-gray-500 font-semibold tracking-wider uppercase">MIT ADT University</p>
            </div>
            <div className="w-6 h-6 border-2 border-[#1E8449] border-t-transparent rounded-full animate-spin mt-2"></div>
          </div>
        </div>
      )}
    </AuthContext.Provider>
  );
}