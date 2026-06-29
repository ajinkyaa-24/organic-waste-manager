import { Leaf, Award, Info, Heart, ShieldCheck } from "lucide-react";

export function AboutPage() {
  return (
    <div className="p-5 space-y-6 flex-1 flex flex-col justify-between">
      <div className="space-y-6">
        {/* Header Section */}
        <div>
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-1">
            About
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Learn more about the application and its mission
          </p>
        </div>

        {/* Brand Card */}
        <div className="bg-white dark:bg-card rounded-2xl p-6 shadow-[0_1px_3px_rgba(0,0,0,0.05),0_10px_15px_-3px_rgba(0,0,0,0.05)] border border-gray-100 dark:border-border text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 bg-[#1E8449]/10 dark:bg-green-400/10 text-[#1E8449] dark:text-green-400 text-xs px-3 py-1 rounded-bl-xl font-bold uppercase tracking-wider">
            Active
          </div>
          <div className="bg-green-100 dark:bg-green-900/30 p-4 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4 border border-green-200 dark:border-green-800/30">
            <Leaf className="w-8 h-8 text-[#1E8449] dark:text-green-400" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
            Organic Waste Manager
          </h3>
          <span className="inline-block px-3 py-1 bg-green-50 dark:bg-green-950/30 text-[#166534] dark:text-green-400 rounded-full text-xs font-semibold mb-4 border border-green-100 dark:border-green-900/20">
            Version 1.0.0
          </span>
          <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed text-left">
            Organic Waste Management System helps colleges track and manage waste efficiently, promoting sustainability.
          </p>
        </div>

        {/* Features List */}
        <div className="space-y-3">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 pl-1">
            System Features
          </h4>
          <div className="bg-white dark:bg-card rounded-xl p-4 shadow-sm border border-gray-100 dark:border-border space-y-3">
            <div className="flex gap-3">
              <Info className="w-5 h-5 text-[#1E8449] dark:text-green-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">Real-time Tracking</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Monitor organic waste inputs and compost outputs instantly.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <ShieldCheck className="w-5 h-5 text-[#1E8449] dark:text-green-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">Role-Based Access</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Secure operator-level access control for accurate logging.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <Award className="w-5 h-5 text-[#1E8449] dark:text-green-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">College Sustainability</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Supporting MIT ADT University in its green campus initiatives.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer credits */}
      <div className="text-center py-4 border-t border-gray-100 dark:border-border mt-auto">
        <p className="text-xs text-gray-400 dark:text-gray-500 flex items-center justify-center gap-1">
          Made with <Heart className="w-3.5 h-3.5 text-red-500 fill-red-500" /> for a greener campus
        </p>
      </div>
    </div>
  );
}
