import React from "react";
import { KeyRound, Lock, ArrowRight } from "lucide-react";

interface ResetPasswordProps {
  recoveryPassword: string;
  setRecoveryPassword: (val: string) => void;
  recoveryConfirmPassword: string;
  setRecoveryConfirmPassword: (val: string) => void;
  resettingPassword: boolean;
  onSubmit: (e: React.FormEvent) => void;
}

export function ResetPassword({
  recoveryPassword,
  setRecoveryPassword,
  recoveryConfirmPassword,
  setRecoveryConfirmPassword,
  resettingPassword,
  onSubmit,
}: ResetPasswordProps) {
  const isSubmitDisabled =
    resettingPassword ||
    !recoveryPassword ||
    recoveryPassword.length < 6 ||
    recoveryPassword !== recoveryConfirmPassword;

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 dark:bg-background flex flex-col items-center justify-center p-6 max-w-[400px] mx-auto w-full">
      <div className="w-full bg-white dark:bg-card rounded-3xl p-8 shadow-xl border border-green-50 dark:border-border space-y-6">
        
        {/* Header Section */}
        <div className="text-center space-y-3">
          <div className="bg-[#1E8449]/10 dark:bg-green-950/40 p-4 rounded-2xl text-[#1E8449] dark:text-green-400 w-16 h-16 flex items-center justify-center mx-auto shadow-sm">
            <KeyRound className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
              Reset Your Password
            </h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Please choose a secure new password for your BioCycle account.
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-1">
            <input
              type="password"
              placeholder="New Password (min 6 chars)"
              value={recoveryPassword}
              onChange={(e) => setRecoveryPassword(e.target.value)}
              className="w-full px-4 py-3 text-sm rounded-xl border border-gray-200 dark:border-border focus:border-[#1E8449] focus:ring-2 focus:ring-[#A7F3D0] dark:focus:ring-green-900/30 focus:outline-none bg-white dark:bg-gray-900 text-gray-900 dark:text-white transition-all h-12"
            />
          </div>

          <div className="space-y-1">
            <input
              type="password"
              placeholder="Confirm New Password"
              value={recoveryConfirmPassword}
              onChange={(e) => setRecoveryConfirmPassword(e.target.value)}
              className="w-full px-4 py-3 text-sm rounded-xl border border-gray-200 dark:border-border focus:border-[#1E8449] focus:ring-2 focus:ring-[#A7F3D0] dark:focus:ring-green-900/30 focus:outline-none bg-white dark:bg-gray-900 text-gray-900 dark:text-white transition-all h-12"
            />
          </div>

          {recoveryPassword && recoveryConfirmPassword && recoveryPassword !== recoveryConfirmPassword && (
            <p className="text-[11px] text-red-500 font-medium text-center">
              Passwords do not match
            </p>
          )}

          <button
            type="submit"
            disabled={isSubmitDisabled}
            className="w-full h-12 bg-gradient-to-r from-[#1E8449] to-[#166534] text-white py-3 rounded-xl font-semibold text-sm hover:from-[#166534] hover:to-[#0F4C2A] transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer mt-2"
          >
            {resettingPassword ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <>
                <Lock className="w-4.5 h-4.5" />
                <span>Update Password & Login</span>
                <ArrowRight className="w-4 h-4 ml-1" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
