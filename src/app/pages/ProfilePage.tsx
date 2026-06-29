import { useEffect, useState } from "react";
import { User, Mail, Award, Edit2, Check, X } from "lucide-react";
import { supabase } from "../../lib/supabaseClient";
import { toast } from "sonner";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";

export function ProfilePage() {
  const context = (window as any).__ROUTE_CONTEXT__;
  const [stats, setStats] = useState({ wasteCount: 0, fertCount: 0, totalKg: 0 });
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [saving, setSaving] = useState(false);

  const displayName = context?.username ? context.username.split("@")[0] : "User";
  const displayRole = context?.role
    ? context.role === "mess"
      ? "Mess User"
      : context.role.charAt(0).toUpperCase() + context.role.slice(1)
    : "Mess User";

  useEffect(() => {
    if (context?.username) {
      setNewEmail(context.username);
    }
  }, [context?.username]);

  const fetchProfileStats = async () => {
    try {
      setLoading(true);
      // Fetch stats
      const { data: wData } = await supabase
        .from("waste_entries")
        .select("waste")
        .eq("created_by", context.userId);
        
      const { data: fData } = await supabase
        .from("fertilizer_entries")
        .select("amount")
        .eq("created_by", context.userId);

      const wCount = wData?.length || 0;
      const fCount = fData?.length || 0;
      const wKg = wData?.reduce((sum, e) => sum + Number(e.waste), 0) || 0;
      const fKg = fData?.reduce((sum, e) => sum + Number(e.amount), 0) || 0;

      setStats({
        wasteCount: wCount,
        fertCount: fCount,
        totalKg: wKg + fKg
      });

      // Fetch profile name
      const { data: pData } = await supabase
        .from("profiles")
        .select("username, email")
        .eq("id", context.userId)
        .single();

      if (pData) {
        setNewName(pData.username || displayName);
        setNewEmail(pData.email || context.username);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (context?.userId) {
      fetchProfileStats();
    }
  }, [context?.userId]);

  const handleSaveChanges = async () => {
    if (!newName.trim() || !newEmail.trim()) {
      toast.error("Name and Email cannot be empty");
      return;
    }

    setSaving(true);
    try {
      // 1. Update Supabase Auth Email
      if (newEmail !== context.username) {
        const { error: authError } = await supabase.auth.updateUser({
          email: newEmail,
        });
        if (authError) {
          toast.error(`Auth Update Failed: ${authError.message}`);
          setSaving(false);
          return;
        }
      }

      // 2. Update Profiles table
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          username: newName,
          email: newEmail,
        })
        .eq("id", context.userId);

      if (profileError) {
        toast.error(`Profile Table Failed: ${profileError.message}`);
      } else {
        toast.success("Profile updated successfully!");
        setIsEditing(false);
        // Update context trigger
        if ((window as any).__ROUTE_CONTEXT__) {
          (window as any).__ROUTE_CONTEXT__.username = newEmail;
        }
        fetchProfileStats();
      }
    } catch (err: any) {
      console.error(err);
      toast.error("Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-5 space-y-5">
      {/* Header Card */}
      <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 rounded-2xl p-6 shadow-md border border-green-100 dark:border-border flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="bg-[#1E8449] p-4 rounded-2xl text-white">
            <User className="w-10 h-10" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white capitalize">{newName || displayName}</h2>
            <p className="text-sm text-[#166534] dark:text-green-400 font-medium">{displayRole}</p>
          </div>
        </div>
        {!isEditing ? (
          <button
            onClick={() => setIsEditing(true)}
            className="p-2.5 bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/40 rounded-xl text-[#1E8449] dark:text-green-400 transition-colors border border-green-200 dark:border-border"
            title="Edit Profile"
          >
            <Edit2 className="w-5 h-5" />
          </button>
        ) : (
          <div className="flex gap-2">
            <button
              onClick={() => {
                setIsEditing(false);
                fetchProfileStats(); // Reset inputs
              }}
              className="p-2.5 bg-red-50 dark:bg-red-950/20 hover:bg-red-100 dark:hover:bg-red-950/40 rounded-xl text-red-600 dark:text-red-400 transition-colors border border-red-200 dark:border-border"
              title="Cancel"
            >
              <X className="w-5 h-5" />
            </button>
            <button
              onClick={handleSaveChanges}
              disabled={saving}
              className="p-2.5 bg-[#1E8449] hover:bg-[#166534] rounded-xl text-white transition-colors border border-[#166534] dark:border-border"
              title="Save Changes"
            >
              <Check className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>

      {/* Profile Details */}
      <div className="bg-white dark:bg-card rounded-2xl p-6 shadow-md border border-green-100 dark:border-border space-y-4">
        <h3 className="font-semibold text-gray-900 dark:text-white border-b border-gray-100 dark:border-border pb-2">Account Information</h3>
        
        {isEditing ? (
          <div className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider block">Full Name</label>
              <Input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="h-11 border-gray-200 dark:border-border rounded-xl focus:ring-2 focus:ring-[#1E8449] bg-gray-50/50 dark:bg-gray-900/30"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider block">Email Address</label>
              <Input
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                className="h-11 border-gray-200 dark:border-border rounded-xl focus:ring-2 focus:ring-[#1E8449] bg-gray-50/50 dark:bg-gray-900/30"
              />
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-3 text-gray-700 dark:text-gray-200">
              <User className="w-5 h-5 text-gray-400 dark:text-gray-500" />
              <div>
                <p className="text-xs text-gray-400 dark:text-gray-500">Full Name</p>
                <p className="text-sm font-medium">{newName || displayName}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 text-gray-700 dark:text-gray-200">
              <Mail className="w-5 h-5 text-gray-400 dark:text-gray-500" />
              <div>
                <p className="text-xs text-gray-400 dark:text-gray-500">Email Address</p>
                <p className="text-sm font-medium">{newEmail || context?.username || "N/A"}</p>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Contributions Stats */}
      <div className="bg-white dark:bg-card rounded-2xl p-6 shadow-md border border-green-100 dark:border-border space-y-4">
        <h3 className="font-semibold text-gray-900 dark:text-white border-b border-gray-100 dark:border-border pb-2">My Contribution Stats</h3>
        
        {loading ? (
          <div className="flex justify-center items-center py-4">
            <div className="w-6 h-6 border-2 border-[#1E8449] border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-green-50/50 dark:bg-green-950/20 p-4 rounded-xl border border-green-100 dark:border-border text-center">
              <p className="text-2xl font-bold text-[#166534] dark:text-green-400">{stats.wasteCount}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mt-1">Waste Entries</p>
            </div>
            <div className="bg-green-50/50 dark:bg-green-950/20 p-4 rounded-xl border border-green-100 dark:border-border text-center">
              <p className="text-2xl font-bold text-[#166534] dark:text-green-400">{stats.fertCount}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mt-1">Fertilizer Logs</p>
            </div>
            <div className="col-span-2 bg-gradient-to-br from-[#1E8449] to-[#166534] p-4 rounded-xl text-white text-center flex items-center justify-center gap-2">
              <Award className="w-5 h-5" />
              <span className="font-medium text-sm">Total Logged: {stats.totalKg.toFixed(1)} kg</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

