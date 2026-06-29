import { useState, useEffect, createContext } from "react";
import { RouterProvider } from "react-router-dom";
import { Toaster } from "./components/ui/sonner";
import { router } from "./routes";
import { Login } from "./pages/Login";
import { supabase } from "../lib/supabaseClient";
import { App as CapApp } from "@capacitor/app";
import { StatusBar, Style } from "@capacitor/status-bar";

export const AuthContext = createContext<any>(null);

export default function App() {
  const [session, setSession] = useState<any>(null);
  const [role, setRole] = useState<string>("mess");
  const [loading, setLoading] = useState(true);
  const [showSplash, setShowSplash] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    const fadeTimer = setTimeout(() => setFadeOut(true), 1700);
    const removeTimer = setTimeout(() => setShowSplash(false), 2000);
    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(removeTimer);
    };
  }, []);

  // Native Android physical back button handling
  useEffect(() => {
    let backButtonListener: any;
    try {
      backButtonListener = CapApp.addListener("backButton", ({ canGoBack }) => {
        if (canGoBack) {
          window.history.back();
        } else {
          CapApp.exitApp();
        }
      });
    } catch (e) {
      console.warn("Capacitor App plugin not available in web browser:", e);
    }
    return () => {
      if (backButtonListener) {
        backButtonListener.then((l: any) => l.remove());
      }
    };
  }, []);

  // Dynamically update StatusBar color to blend with light/dark theme changes
  useEffect(() => {
    const updateStatusBar = () => {
      try {
        const isDark = document.documentElement.classList.contains("dark");
        StatusBar.setStyle({ style: isDark ? Style.Dark : Style.Light });
        StatusBar.setBackgroundColor({ color: isDark ? "#121212" : "#F8FBF9" });
      } catch (e) {
        // Silent catch for browser environment
      }
    };

    // Update once initially
    updateStatusBar();

    // Listen to theme switches
    const observer = new MutationObserver(updateStatusBar);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => observer.disconnect();
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

  // Store context globally for components to access
  useEffect(() => {
    (window as any).__ROUTE_CONTEXT__ = {
      username: session?.user?.email || "",
      role,
      onLogout: handleLogout,
      userId: session?.user?.id || null,
    };
  }, [session, role]);

  const isResetPath = window.location.pathname === "/reset-password";

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
      ) : !session && !isResetPath ? (
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

      {/* Startup Animated Splash Screen Overlay */}
      {showSplash && (
        <div 
          className={`fixed inset-0 z-[99999] bg-[#1E8449] flex items-center justify-center transition-all duration-300 ease-out ${
            fadeOut ? "opacity-0 pointer-events-none scale-105" : "opacity-100"
          }`}
        >
          <div className="bg-white dark:bg-gray-800 rounded-3xl p-8 shadow-2xl flex flex-col items-center gap-6 max-w-[280px] w-full mx-4 border border-white/10 transform transition-all duration-500">
            <img
              src="/logo_login.png"
              className="h-32 w-auto object-contain dark:brightness-0 dark:invert"
              alt="Logo"
            />
            <div className="w-6 h-6 border-2 border-[#1E8449] dark:border-white border-t-transparent rounded-full animate-spin"></div>
          </div>
        </div>
      )}
    </AuthContext.Provider>
  );
}