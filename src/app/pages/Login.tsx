import { useState } from "react";
import { LogIn, Leaf, UserPlus, ArrowLeft, KeyRound } from "lucide-react";
import { supabase } from "../../lib/supabaseClient";
import { toast } from "sonner";

export function Login() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [isForgot, setIsForgot] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [errors, setErrors] = useState({ email: "", password: "", username: "" });
  const [isLoading, setIsLoading] = useState(false);
  const [logoError, setLogoError] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({ email: "", password: "", username: "" });

    const newErrors = { email: "", password: "", username: "" };
    let hasError = false;

    if (!email.trim() || !email.includes("@")) {
      newErrors.email = "Please enter a valid email address";
      hasError = true;
    }
    if (!password.trim() || password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
      hasError = true;
    }
    if (isSignUp && !username.trim()) {
      newErrors.username = "Username is required";
      hasError = true;
    }

    if (hasError) {
      setErrors(newErrors);
      return;
    }

    setIsLoading(true);

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              username: username,
            },
          },
        });

        if (error) {
          toast.error(error.message);
        } else {
          setIsSignUp(false);
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          toast.error(error.message);
        } else {
          // Logged in successfully (toast removed)
        }
      }
    } catch (err: any) {
      console.error(err);
      toast.error("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({ email: "", password: "", username: "" });

    if (!email.trim() || !email.includes("@")) {
      setErrors({ ...errors, email: "Please enter a valid email address" });
      return;
    }

    setIsLoading(true);
    try {
      const redirectUrl = import.meta.env.VITE_APP_URL
        ? `${import.meta.env.VITE_APP_URL.replace(/\/$/, "")}/reset-password`
        : `${window.location.origin}/reset-password`;

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectUrl,
      });

      if (error) {
        toast.error(error.message);
      } else {
        setIsForgot(false);
      }
    } catch (err: any) {
      console.error(err);
      toast.error("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 dark:bg-background flex flex-col items-center justify-center p-6 max-w-[400px] mx-auto">
      <div className="w-full">
        {/* Logo Section */}
        <div className="text-center mb-8 animate-fade-in">
          {!logoError ? (
            <img 
              src="/logo_login.png" 
              onError={() => setLogoError(true)} 
              className="w-full max-w-[380px] h-48 object-contain mx-auto mb-2 mix-blend-multiply dark:mix-blend-normal dark:brightness-0 dark:invert" 
              alt="MIT ADT Logo" 
            />
          ) : (
            <div className="bg-gradient-to-br from-[#1E8449] to-[#166534] w-36 h-36 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-lg">
              <Leaf className="w-16 h-16 text-white" />
            </div>
          )}
        </div>

        {/* Tab Selection — Hidden when in Forgot Password flow */}
        {!isForgot && (
          <div className="flex gap-2 bg-gray-100 dark:bg-gray-900/50 p-1.5 rounded-xl mb-4 shadow-sm">
            <button
              onClick={() => {
                setIsSignUp(false);
                setErrors({ email: "", password: "", username: "" });
              }}
              className={`flex-1 py-2.5 rounded-lg font-semibold text-sm transition-all cursor-pointer ${
                !isSignUp ? "bg-white dark:bg-gray-800 text-[#166534] dark:text-green-400 shadow-sm" : "text-gray-500 dark:text-gray-400 hover:text-gray-700"
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => {
                setIsSignUp(true);
                setErrors({ email: "", password: "", username: "" });
              }}
              className={`flex-1 py-2.5 rounded-lg font-semibold text-sm transition-all cursor-pointer ${
                isSignUp ? "bg-white dark:bg-gray-800 text-[#166534] dark:text-green-400 shadow-sm" : "text-gray-500 dark:text-gray-400 hover:text-gray-700"
              }`}
            >
              Request Access
            </button>
          </div>
        )}

        {/* Form Card */}
        <div className="bg-white dark:bg-card rounded-2xl p-6 shadow-xl border border-green-50 dark:border-border">
          {isForgot ? (
            /* Forgot Password Flow */
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <button
                  onClick={() => {
                    setIsForgot(false);
                    setErrors({ email: "", password: "", username: "" });
                  }}
                  className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 transition-colors"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                  Reset Password
                </h2>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 leading-relaxed">
                Enter your email address and we'll send you a recovery link to reset your password.
              </p>

              <form onSubmit={handleForgotPassword} className="space-y-4">
                <div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (errors.email) {
                        setErrors({ ...errors, email: "" });
                      }
                    }}
                    className={`w-full px-4 py-3 text-sm rounded-xl border ${
                      errors.email
                        ? "border-red-300 dark:border-red-900/50 focus:ring-red-200"
                        : "border-gray-200 dark:border-border focus:border-[#1E8449] focus:ring-[#A7F3D0] dark:focus:ring-green-900/30"
                    } focus:outline-none focus:ring-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-white transition-all`}
                    placeholder="Email Address"
                  />
                  {errors.email && (
                    <p className="text-xs font-medium text-red-650 dark:text-red-400 mt-1">{errors.email}</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-[#1E8449] to-[#166534] text-white py-3 rounded-xl font-semibold text-sm hover:from-[#166534] hover:to-[#0F4C2A] transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  <KeyRound className="w-4.5 h-4.5" />
                  <span>{isLoading ? "Sending link..." : "Send Reset Link"}</span>
                </button>
              </form>
            </div>
          ) : (
            /* Sign In / Sign Up Flows */
            <>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                {isSignUp ? "Request New Account" : "Welcome Back"}
              </h2>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Username Field (SignUp only) */}
                {isSignUp && (
                  <div>
                    <input
                      id="username"
                      type="text"
                      value={username}
                      onChange={(e) => {
                        setUsername(e.target.value);
                        if (errors.username) {
                          setErrors({ ...errors, username: "" });
                        }
                      }}
                      className={`w-full px-4 py-3 text-sm rounded-xl border ${
                        errors.username
                          ? "border-red-300 dark:border-red-900/50 focus:ring-red-200"
                          : "border-gray-200 dark:border-border focus:border-[#1E8449] focus:ring-[#A7F3D0] dark:focus:ring-green-900/30"
                      } focus:outline-none focus:ring-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-white transition-all`}
                      placeholder="Full Name"
                    />
                    {errors.username && (
                      <p className="text-xs font-medium text-red-650 dark:text-red-400 mt-1">{errors.username}</p>
                    )}
                  </div>
                )}

                {/* Email Field */}
                <div>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (errors.email) {
                        setErrors({ ...errors, email: "" });
                      }
                    }}
                    className={`w-full px-4 py-3 text-sm rounded-xl border ${
                      errors.email
                        ? "border-red-300 dark:border-red-900/50 focus:ring-red-200"
                        : "border-gray-200 dark:border-border focus:border-[#1E8449] focus:ring-[#A7F3D0] dark:focus:ring-green-900/30"
                    } focus:outline-none focus:ring-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-white transition-all`}
                    placeholder="Email Address"
                  />
                  {errors.email && (
                    <p className="text-xs font-medium text-red-650 dark:text-red-400 mt-1">{errors.email}</p>
                  )}
                </div>

                {/* Password Field */}
                <div>
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (errors.password) {
                        setErrors({ ...errors, password: "" });
                      }
                    }}
                    className={`w-full px-4 py-3 text-sm rounded-xl border ${
                      errors.password
                        ? "border-red-300 dark:border-red-900/50 focus:ring-red-200"
                        : "border-gray-200 dark:border-border focus:border-[#1E8449] focus:ring-[#A7F3D0] dark:focus:ring-green-900/30"
                    } focus:outline-none focus:ring-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-white transition-all`}
                    placeholder={isSignUp ? "Password (min. 6 characters)" : "Password"}
                  />
                  {errors.password && (
                    <p className="text-xs font-medium text-red-650 dark:text-red-400 mt-1">{errors.password}</p>
                  )}
                  
                  {/* Forgot Password link under password input (Sign In only) */}
                  {!isSignUp && (
                    <div className="flex justify-end mt-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          setIsForgot(true);
                          setErrors({ email: "", password: "", username: "" });
                        }}
                        className="text-xs font-semibold text-[#1E8449] dark:text-green-400 hover:underline cursor-pointer transition-colors"
                      >
                        Forgot Password?
                      </button>
                    </div>
                  )}
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-[#1E8449] to-[#166534] text-white py-3 rounded-xl font-semibold text-sm hover:from-[#166534] hover:to-[#0F4C2A] transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer mt-2"
                >
                  {isSignUp ? (
                    <>
                      <UserPlus className="w-4.5 h-4.5" />
                      <span>{isLoading ? "Requesting..." : "Submit Access Request"}</span>
                    </>
                  ) : (
                    <>
                      <LogIn className="w-4.5 h-4.5" />
                      <span>{isLoading ? "Logging in..." : "Login"}</span>
                    </>
                  )}
                </button>
              </form>
            </>
          )}
        </div>

        <p className="text-center text-sm text-gray-500 dark:text-gray-500 mt-6 font-medium">
          © 2026 Organic Waste Management System
        </p>
      </div>
    </div>
  );
}
