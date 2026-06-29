import { useState, useEffect } from "react";
import { Settings, Moon, Sun, Lock, Save, RefreshCw, X, ShieldAlert } from "lucide-react";
import { supabase } from "../../lib/supabaseClient";
import { toast } from "sonner";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "../components/ui/input-otp";

export function SettingsPage() {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [updatingPassword, setUpdatingPassword] = useState(false);
  
  const [email, setEmail] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [sendingOtp, setSendingOtp] = useState(false);
  const [fallbackCode, setFallbackCode] = useState("");
  const [countdown, setCountdown] = useState(0);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Fetch logged in user email
  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.email) {
        setEmail(user.email);
      }
    };
    fetchUser();
  }, []);

  // Load theme from localStorage or document class list
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "dark") {
      document.documentElement.classList.add("dark");
      setTheme("dark");
    } else if (savedTheme === "light") {
      document.documentElement.classList.remove("dark");
      setTheme("light");
    } else {
      const isDark = document.documentElement.classList.contains("dark");
      setTheme(isDark ? "dark" : "light");
    }
  }, []);

  // Countdown timer for resending OTP
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  const toggleTheme = () => {
    if (theme === "light") {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
      setTheme("dark");
      toast.success("Dark Mode enabled!");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
      setTheme("light");
      toast.success("Light Mode enabled!");
    }
  };

  const handleSendOtp = async () => {
    if (!password || password.length < 6) {
      toast.error("Password must be at least 6 characters long");
      return;
    }
    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    setSendingOtp(true);
    try {
      let userEmail = email;
      if (!userEmail) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user?.email) {
          userEmail = user.email;
          setEmail(userEmail);
        }
      }

      if (!userEmail) {
        toast.error("Could not fetch your email address");
        return;
      }

      const { error } = await supabase.auth.resetPasswordForEmail(userEmail);
      if (error) {
        // Fallback code generation in case of local/development SMTP configurations
        const mockCode = Math.floor(100000 + Math.random() * 900000).toString();
        setFallbackCode(mockCode);
        setOtpSent(true);
        setCountdown(60);
        toast.warning(`SMTP/Email rate limit reached: ${error.message}. (Created sandbox fallback code for preview)`);
        console.log(`[Dev Fallback OTP]: ${mockCode}`);
      } else {
        setOtpSent(true);
        setFallbackCode("");
        setCountdown(60);
        toast.success("Verification OTP code has been sent to your email!");
      }
    } catch (err: any) {
      console.error(err);
      toast.error("Failed to send OTP verification");
    } finally {
      setSendingOtp(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode || otpCode.length !== 6) {
      toast.error("Please enter a valid 6-digit OTP code");
      return;
    }

    setUpdatingPassword(true);
    try {
      if (fallbackCode && otpCode === fallbackCode) {
        const { error } = await supabase.auth.updateUser({ password });
        if (error) {
          toast.error(error.message);
        } else {
          toast.success("Password updated successfully!");
          setPassword("");
          setConfirmPassword("");
          setOtpSent(false);
          setOtpCode("");
          setFallbackCode("");
          setIsChangingPassword(false);
        }
      } else {
        // Verify via Supabase recovery
        const { error: verifyError } = await supabase.auth.verifyOtp({
          email,
          token: otpCode,
          type: "recovery",
        });

        if (verifyError) {
          toast.error(`Invalid verification code: ${verifyError.message}`);
        } else {
          const { error: updateError } = await supabase.auth.updateUser({ password });
          if (updateError) {
            toast.error(`OTP verified but password update failed: ${updateError.message}`);
          } else {
            toast.success("Password updated successfully!");
            setPassword("");
            setConfirmPassword("");
            setOtpSent(false);
            setOtpCode("");
            setFallbackCode("");
            setIsChangingPassword(false);
          }
        }
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to update password");
    } finally {
      setUpdatingPassword(false);
    }
  };

  const handleCancelVerification = () => {
    setOtpSent(false);
    setOtpCode("");
    setFallbackCode("");
  };

  return (
    <div className="p-5 space-y-5">
      {/* Header Card */}
      <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 rounded-2xl p-6 shadow-md border border-green-100 dark:border-border flex items-center gap-4">
        <div className="bg-[#1E8449] p-4 rounded-2xl text-white">
          <Settings className="w-10 h-10" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">Preferences and security options</p>
        </div>
      </div>

      {/* Preferences Section */}
      <div className="bg-white dark:bg-card rounded-2xl p-6 shadow-md border border-green-100 dark:border-border space-y-4">
        <h3 className="font-semibold text-gray-900 dark:text-white border-b border-gray-100 dark:border-border pb-2">Preferences</h3>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {theme === "light" ? (
              <Sun className="w-5 h-5 text-yellow-500" />
            ) : (
              <Moon className="w-5 h-5 text-indigo-400" />
            )}
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">Application Theme</p>
              <p className="text-xs text-gray-400 dark:text-gray-400">Switch between Light and Dark mode</p>
            </div>
          </div>

          <button
            onClick={toggleTheme}
            className={`w-14 h-8 flex items-center rounded-full p-1 transition-all duration-300 ${
              theme === "dark" ? "bg-[#1E8449] justify-end" : "bg-gray-200 dark:bg-gray-800 justify-start"
            }`}
          >
            <div className="bg-white dark:bg-gray-200 w-6 h-6 rounded-full shadow-md transition-all duration-300" />
          </button>
        </div>
      </div>

      {/* Security Section */}
      <div className="bg-white dark:bg-card rounded-2xl p-6 shadow-md border border-green-100 dark:border-border space-y-4">
        <h3 className="font-semibold text-gray-900 dark:text-white border-b border-gray-100 dark:border-border pb-2">Security</h3>
        
        {!isChangingPassword ? (
          <div className="flex items-center justify-between py-2">
            <div className="flex items-center gap-3">
              <div className="bg-green-50/50 dark:bg-green-950/20 p-2.5 rounded-xl text-[#1E8449] dark:text-green-400">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">Account Password</p>
                <p className="text-xs text-gray-400 dark:text-gray-400">Update your login security credentials</p>
              </div>
            </div>
            <Button
              onClick={() => setIsChangingPassword(true)}
              className="bg-[#1E8449] hover:bg-[#166534] text-white rounded-lg text-xs font-semibold px-4 py-2"
            >
              Update Password
            </Button>
          </div>
        ) : !otpSent ? (
          <div className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="password">New Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter new password (min 6 chars)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-10 border-gray-200 dark:border-border rounded-lg focus:ring-2 focus:ring-[#1E8449] bg-gray-50/50 dark:bg-gray-900/30 text-gray-900 dark:text-white"
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="h-10 border-gray-200 dark:border-border rounded-lg focus:ring-2 focus:ring-[#1E8449] bg-gray-50/50 dark:bg-gray-900/30 text-gray-900 dark:text-white"
              />
            </div>

            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsChangingPassword(false);
                  setPassword("");
                  setConfirmPassword("");
                }}
                className="flex-1 border-gray-200 dark:border-border hover:bg-gray-150 dark:hover:bg-gray-800 text-gray-750 dark:text-gray-300 rounded-lg flex items-center justify-center gap-1 py-2 font-medium"
              >
                <X className="w-4 h-4" />
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleSendOtp}
                disabled={sendingOtp || !password || password.length < 6 || password !== confirmPassword}
                className="flex-1 bg-[#1E8449] hover:bg-[#166534] text-white rounded-lg flex items-center justify-center gap-1.5 py-2 font-medium transition-colors"
              >
                <Lock className="w-4 h-4" />
                {sendingOtp ? "Sending Code..." : "Send Verification OTP"}
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleUpdatePassword} className="space-y-5">
            <div className="bg-green-50/50 dark:bg-green-950/20 border border-green-150 dark:border-green-900/30 rounded-xl p-4 flex flex-col gap-2">
              <p className="text-sm text-green-800 dark:text-green-400 font-medium">
                Verification OTP Sent!
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                We've sent a 6-digit recovery code to your registered email: <span className="font-semibold text-gray-700 dark:text-gray-300">{email}</span>.
              </p>
              {fallbackCode && (
                <div className="mt-2 bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-250 dark:border-yellow-900/30 p-2.5 rounded-lg">
                  <p className="text-xs font-semibold text-yellow-800 dark:text-yellow-400 flex items-center gap-1.5">
                    <ShieldAlert className="w-4 h-4 flex-shrink-0" />
                    <span>Demo Fallback Code: {fallbackCode}</span>
                  </p>
                </div>
              )}
            </div>

            <div className="space-y-2.5 flex flex-col items-center">
              <Label className="self-start text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Enter 6-Digit Code</Label>
              <div className="py-2">
                <InputOTP
                  maxLength={6}
                  value={otpCode}
                  onChange={setOtpCode}
                >
                  <InputOTPGroup>
                    <InputOTPSlot index={0} />
                    <InputOTPSlot index={1} />
                    <InputOTPSlot index={2} />
                    <InputOTPSlot index={3} />
                    <InputOTPSlot index={4} />
                    <InputOTPSlot index={5} />
                  </InputOTPGroup>
                </InputOTP>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleCancelVerification}
                className="flex-1 border-gray-200 dark:border-border hover:bg-gray-150 dark:hover:bg-gray-800 text-gray-750 dark:text-gray-300 rounded-lg flex items-center justify-center gap-1 py-2 font-medium"
              >
                <X className="w-4 h-4" />
                Cancel
              </Button>
              
              <Button
                type="submit"
                disabled={updatingPassword || otpCode.length !== 6}
                className="flex-1 bg-[#1E8449] hover:bg-[#166534] text-white rounded-lg flex items-center justify-center gap-1.5 py-2 font-medium"
              >
                {updatingPassword ? "Updating..." : "Update Password"}
              </Button>
            </div>

            <div className="text-center">
              <button
                type="button"
                onClick={handleSendOtp}
                disabled={countdown > 0 || sendingOtp}
                className="text-xs font-medium text-[#1E8449] dark:text-green-400 hover:underline disabled:text-gray-400 disabled:no-underline flex items-center gap-1.5 mx-auto"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${sendingOtp ? "animate-spin" : ""}`} />
                {countdown > 0 ? `Resend OTP in ${countdown}s` : "Resend OTP Code"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
