import { useEffect, useState } from "react";
import { Users, Save, Shield, UserCheck, RefreshCw, Plus, Trash2, Edit2, X, Check, Database, UserPlus } from "lucide-react";
import { supabase } from "../../lib/supabaseClient";
import { createClient } from "@supabase/supabase-js";
import { toast } from "sonner";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";

interface Profile {
  id: string;
  email: string;
  username: string | null;
  role: "admin" | "worker" | "mess";
  created_at: string;
}

interface WasteSource {
  id: string;
  name: string;
  created_at: string;
}


export function AdminPanel() {
  const [activeTab, setActiveTab] = useState<"users" | "sources" | "cleanup">("users");
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [sources, setSources] = useState<WasteSource[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  
  // Waste source states
  const [newSourceName, setNewSourceName] = useState("");
  const [editingSourceId, setEditingSourceId] = useState<string | null>(null);
  const [editingSourceName, setEditingSourceName] = useState("");
  const [addingSource, setAddingSource] = useState(false);

  // Add User states
  const [showAddUser, setShowAddUser] = useState(false);
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserPassword, setNewUserPassword] = useState("");
  const [newUserName, setNewUserName] = useState("");
  const [newUserRole, setNewUserRole] = useState<"admin" | "worker" | "mess">("worker");
  const [addingUser, setAddingUser] = useState(false);

  // Cleanup/Delete logs states
  const [cleanupTab, setCleanupTab] = useState<"waste" | "fertilizer" | "both">("waste");
  const [cleanupMode, setCleanupMode] = useState<"month" | "range">("month");
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });
  const [cleanupStartDate, setCleanupStartDate] = useState("");
  const [cleanupEndDate, setCleanupEndDate] = useState("");
  const [matchingCount, setMatchingCount] = useState<{ waste: number; fertilizer: number; loading: boolean }>({
    waste: 0,
    fertilizer: 0,
    loading: false
  });

  const fetchProfiles = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        toast.error("Failed to fetch user profiles");
        console.error(error);
      } else {
        setProfiles(data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSources = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("waste_sources")
        .select("*")
        .order("name", { ascending: true });

      if (error) {
        toast.error("Failed to fetch waste sources");
        console.error(error);
      } else {
        setSources(data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getCleanupBounds = () => {
    let startISO = "";
    let endISO = "";

    if (cleanupMode === "month") {
      if (!selectedMonth) return { startISO, endISO };
      const [year, month] = selectedMonth.split("-").map(Number);
      // First day of selected month
      const start = new Date(year, month - 1, 1, 0, 0, 0, 0);
      // Last day of selected month
      const end = new Date(year, month, 0, 23, 59, 59, 999);
      
      startISO = start.toISOString();
      endISO = end.toISOString();
    } else {
      if (!cleanupStartDate || !cleanupEndDate) return { startISO, endISO };
      startISO = new Date(`${cleanupStartDate}T00:00:00`).toISOString();
      endISO = new Date(`${cleanupEndDate}T23:59:59.999`).toISOString();
    }

    return { startISO, endISO };
  };

  const countMatchingEntries = async () => {
    const { startISO, endISO } = getCleanupBounds();
    if (!startISO || !endISO) {
      setMatchingCount({ waste: 0, fertilizer: 0, loading: false });
      return;
    }

    setMatchingCount(prev => ({ ...prev, loading: true }));
    try {
      let wasteCount = 0;
      let fertilizerCount = 0;

      if (cleanupTab === "waste" || cleanupTab === "both") {
        const { count, error } = await supabase
          .from("waste_entries")
          .select("*", { count: "exact", head: true })
          .gte("created_at", startISO)
          .lte("created_at", endISO);
        if (error) throw error;
        wasteCount = count || 0;
      }

      if (cleanupTab === "fertilizer" || cleanupTab === "both") {
        const { count, error } = await supabase
          .from("fertilizer_entries")
          .select("*", { count: "exact", head: true })
          .gte("created_at", startISO)
          .lte("created_at", endISO);
        if (error) throw error;
        fertilizerCount = count || 0;
      }

      setMatchingCount({
        waste: wasteCount,
        fertilizer: fertilizerCount,
        loading: false
      });
    } catch (err) {
      console.error("Failed to count matching entries:", err);
      setMatchingCount({ waste: 0, fertilizer: 0, loading: false });
    }
  };

  const handleDeleteEntries = async () => {
    const { startISO, endISO } = getCleanupBounds();
    if (!startISO || !endISO) {
      toast.error("Please select a valid month or date range");
      return;
    }

    const totalToDelete = matchingCount.waste + matchingCount.fertilizer;
    if (totalToDelete === 0) {
      toast.error("No entries found in the selected range to delete");
      return;
    }

    let message = "";
    if (cleanupTab === "both") {
      message = `Are you sure you want to permanently delete all ${matchingCount.waste} waste entries and ${matchingCount.fertilizer} fertilizer entries from ${new Date(startISO).toLocaleDateString()} to ${new Date(endISO).toLocaleDateString()}?\n\nThis action is irreversible!`;
    } else if (cleanupTab === "waste") {
      message = `Are you sure you want to permanently delete all ${matchingCount.waste} waste entries from ${new Date(startISO).toLocaleDateString()} to ${new Date(endISO).toLocaleDateString()}?\n\nThis action is irreversible!`;
    } else {
      message = `Are you sure you want to permanently delete all ${matchingCount.fertilizer} fertilizer entries from ${new Date(startISO).toLocaleDateString()} to ${new Date(endISO).toLocaleDateString()}?\n\nThis action is irreversible!`;
    }

    if (confirm(message)) {
      setLoading(true);
      try {
        let wasteDeleted = 0;
        let fertilizerDeleted = 0;

        if (cleanupTab === "waste" || cleanupTab === "both") {
          const { data, error } = await supabase
            .from("waste_entries")
            .delete()
            .gte("created_at", startISO)
            .lte("created_at", endISO)
            .select();
          if (error) throw error;
          wasteDeleted = data?.length || 0;
        }

        if (cleanupTab === "fertilizer" || cleanupTab === "both") {
          const { data, error } = await supabase
            .from("fertilizer_entries")
            .delete()
            .gte("created_at", startISO)
            .lte("created_at", endISO)
            .select();
          if (error) throw error;
          fertilizerDeleted = data?.length || 0;
        }

        const totalDeleted = wasteDeleted + fertilizerDeleted;
        if (totalDeleted > 0) {
          toast.success(`Successfully deleted ${totalDeleted} entries!`);
        } else {
          toast.error("0 entries were deleted. This is caused by Supabase Row Level Security (RLS) policies blocking delete actions for authenticated admin users.");
        }
        countMatchingEntries(); // Refresh counts
      } catch (err: any) {
        console.error("Failed to delete entries:", err);
        toast.error(err.message || "Failed to delete entries");
      } finally {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    if (activeTab === "users") {
      fetchProfiles();
    } else if (activeTab === "sources") {
      fetchSources();
    } else if (activeTab === "cleanup") {
      countMatchingEntries();
    }
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === "cleanup") {
      countMatchingEntries();
    }
  }, [cleanupTab, cleanupMode, selectedMonth, cleanupStartDate, cleanupEndDate]);

  const handleRoleChange = (userId: string, newRole: "admin" | "worker" | "mess") => {
    setProfiles((prev) =>
      prev.map((profile) =>
        profile.id === userId ? { ...profile, role: newRole } : profile
      )
    );
  };

  const handleSaveRole = async (profile: Profile) => {
    setSavingId(profile.id);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ role: profile.role })
        .eq("id", profile.id);

      if (error) {
        toast.error(error.message);
      } else {
        // Role updated successfully (toast removed)
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to save changes");
    } finally {
      setSavingId(null);
    }
  };

  // Add a new user via client-only secondary instance (doesn't log current admin out)
  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserEmail.trim() || !newUserPassword.trim() || !newUserName.trim()) {
      toast.error("Please fill in all fields");
      return;
    }
    if (newUserPassword.length < 6) {
      toast.error("Password must be at least 6 characters long");
      return;
    }

    setAddingUser(true);
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "";
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "";
      
      const supabaseCreateClient = createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
          detectSessionInUrl: false
        }
      });

      const { data, error } = await supabaseCreateClient.auth.signUp({
        email: newUserEmail.trim(),
        password: newUserPassword,
        options: {
          data: {
            username: newUserName.trim()
          }
        }
      });

      if (error) {
        toast.error(error.message);
        setAddingUser(false);
        return;
      }

      if (data?.user?.id) {
        // Upgrade role in profiles table immediately
        const { error: roleError } = await supabase
          .from("profiles")
          .update({ role: newUserRole, username: newUserName.trim() })
          .eq("id", data.user.id);

        if (roleError) {
          console.error("Failed to update role:", roleError);
        }

        // User registered successfully (toast removed)
        setNewUserEmail("");
        setNewUserPassword("");
        setNewUserName("");
        setShowAddUser(false);
        fetchProfiles();
      }
    } catch (err) {
      console.error(err);
      toast.error("An error occurred during user creation");
    } finally {
      setAddingUser(false);
    }
  };

  // Delete/Deactivate user
  const handleDeleteUser = async (id: string, email: string) => {
    if (confirm(`Are you sure you want to delete profile for ${email}? This user will be locked out.`)) {
      try {
        const { error } = await supabase
          .from("profiles")
          .delete()
          .eq("id", id);

        if (error) {
          toast.error(error.message);
        } else {
          // User profile deleted (toast removed)
          fetchProfiles();
        }
      } catch (err) {
        console.error(err);
        toast.error("Failed to delete user profile");
      }
    }
  };

  // Add a new waste source
  const handleAddSource = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSourceName.trim()) return;

    setAddingSource(true);
    try {
      const { error } = await supabase
        .from("waste_sources")
        .insert({ name: newSourceName.trim() });

      if (error) {
        toast.error(error.message);
      } else {
        // Source added (toast removed)
        setNewSourceName("");
        fetchSources();
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to add waste source");
    } finally {
      setAddingSource(false);
    }
  };

  // Delete a waste source
  const handleDeleteSource = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"?`)) return;

    try {
      const { error } = await supabase
        .from("waste_sources")
        .delete()
        .eq("id", id);

      if (error) {
        toast.error(error.message);
      } else {
        // Source deleted (toast removed)
        fetchSources();
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete waste source");
    }
  };

  // Save edits of a waste source
  const handleSaveEditSource = async (id: string) => {
    if (!editingSourceName.trim()) return;

    try {
      const { error } = await supabase
        .from("waste_sources")
        .update({ name: editingSourceName.trim() })
        .eq("id", id);

      if (error) {
        toast.error(error.message);
      } else {
        // Source updated (toast removed)
        setEditingSourceId(null);
        fetchSources();
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to update waste source");
    }
  };

  return (
    <div className="p-5 space-y-5">
      {/* Header */}
      <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 rounded-2xl p-6 shadow-md border border-green-100 dark:border-border flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="bg-[#1E8449] p-2.5 rounded-xl">
            {activeTab === "users" ? (
              <Users className="w-6 h-6 text-white" />
            ) : activeTab === "sources" ? (
              <Database className="w-6 h-6 text-white" />
            ) : (
              <Trash2 className="w-6 h-6 text-white" />
            )}
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              {activeTab === "users" ? "User Management" : activeTab === "sources" ? "Waste Sources" : "Manage Logs"}
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {activeTab === "users" ? "Assign roles and verify workers" : activeTab === "sources" ? "Manage campus collection sources" : "Delete historical waste logs or production entries"}
            </p>
          </div>
        </div>
        <button
          onClick={activeTab === "users" ? fetchProfiles : activeTab === "sources" ? fetchSources : countMatchingEntries}
          className="p-2 hover:bg-green-100 dark:hover:bg-green-950/20 rounded-lg text-[#1E8449] dark:text-green-400 transition-colors"
          title="Refresh List"
        >
          <RefreshCw className="w-5 h-5" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 bg-gray-100 dark:bg-gray-900/50 p-1 rounded-xl shadow-inner">
        <button
          onClick={() => setActiveTab("users")}
          className={`flex-1 py-2.5 rounded-lg font-medium text-xs transition-all flex items-center justify-center gap-1.5 ${
            activeTab === "users" ? "bg-white dark:bg-gray-800 text-[#166534] dark:text-green-400 shadow-sm" : "text-gray-500 dark:text-gray-400 hover:text-gray-700"
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>User Roles</span>
        </button>
        <button
          onClick={() => setActiveTab("sources")}
          className={`flex-1 py-2.5 rounded-lg font-medium text-xs transition-all flex items-center justify-center gap-1.5 ${
            activeTab === "sources" ? "bg-white dark:bg-gray-800 text-[#166534] dark:text-green-400 shadow-sm" : "text-gray-500 dark:text-gray-400 hover:text-gray-700"
          }`}
        >
          <Database className="w-3.5 h-3.5" />
          <span>Waste Sources</span>
        </button>
        <button
          onClick={() => setActiveTab("cleanup")}
          className={`flex-1 py-2.5 rounded-lg font-medium text-xs transition-all flex items-center justify-center gap-1.5 ${
            activeTab === "cleanup" ? "bg-white dark:bg-gray-800 text-[#166534] dark:text-green-400 shadow-sm" : "text-gray-500 dark:text-gray-400 hover:text-gray-700"
          }`}
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Manage Logs</span>
        </button>
      </div>

      {/* Section: Users */}
      {activeTab === "users" && (
        <div className="space-y-4">
          {/* Add User Toggle Button */}
          <div className="flex justify-end">
            <Button
              onClick={() => setShowAddUser(!showAddUser)}
              className="bg-[#1E8449] hover:bg-[#166534] text-white rounded-lg flex items-center gap-1.5 px-4 py-2 text-xs font-semibold"
            >
              <UserPlus className="w-4 h-4" />
              {showAddUser ? "Hide Add Form" : "Add New User"}
            </Button>
          </div>

          {/* Add User Form */}
          {showAddUser && (
            <form onSubmit={handleAddUser} className="bg-white dark:bg-card rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-border space-y-4">
              <h3 className="font-semibold text-sm text-gray-800 dark:text-white">Add New User Account</h3>
              <div className="grid grid-cols-1 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-gray-400 uppercase">Display Name</label>
                  <Input
                    type="text"
                    placeholder="John Doe"
                    value={newUserName}
                    onChange={(e) => setNewUserName(e.target.value)}
                    className="h-10 border-gray-200 dark:border-border bg-gray-50/50 dark:bg-gray-900/30"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-gray-400 uppercase">Email Address</label>
                  <Input
                    type="email"
                    placeholder="worker@college.edu"
                    value={newUserEmail}
                    onChange={(e) => setNewUserEmail(e.target.value)}
                    className="h-10 border-gray-200 dark:border-border bg-gray-50/50 dark:bg-gray-900/30"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-gray-400 uppercase">Password</label>
                  <Input
                    type="password"
                    placeholder="Enter password (min 6 chars)"
                    value={newUserPassword}
                    onChange={(e) => setNewUserPassword(e.target.value)}
                    className="h-10 border-gray-200 dark:border-border bg-gray-50/50 dark:bg-gray-900/30"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-gray-400 uppercase">Role Access</label>
                  <select
                    value={newUserRole}
                    onChange={(e) => setNewUserRole(e.target.value as any)}
                    className="w-full h-10 px-3 rounded-lg border border-gray-200 dark:border-border text-sm focus:outline-none focus:ring-2 focus:ring-[#1E8449] bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200"
                  >
                    <option value="mess">Mess User (Read Only)</option>
                    <option value="worker">Worker (Create & View Entries)</option>
                    <option value="admin">Admin (Full Access)</option>
                  </select>
                </div>
              </div>
              <Button
                type="submit"
                disabled={addingUser}
                className="w-full bg-[#1E8449] hover:bg-[#166534] text-white rounded-lg flex items-center justify-center gap-1.5 py-2 font-semibold"
              >
                {addingUser ? "Adding..." : "Register User"}
              </Button>
            </form>
          )}

          {loading ? (
            <div className="flex justify-center items-center py-10">
              <div className="w-8 h-8 border-4 border-[#1E8449] border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : profiles.length === 0 ? (
            <div className="text-center py-10 text-gray-500">No users found.</div>
          ) : (
            <div className="space-y-4">
              {profiles.map((profile) => (
                <div
                  key={profile.id}
                  className="bg-white dark:bg-card rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-border flex flex-col gap-4"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white">
                        {profile.username || "Unnamed User"}
                      </h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{profile.email}</p>
                    </div>
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200">
                      {profile.role === "admin" && (
                        <>
                          <Shield className="w-3.5 h-3.5 text-red-500" />
                          <span className="text-red-700 dark:text-red-400">Admin</span>
                        </>
                      )}
                      {profile.role === "worker" && (
                        <>
                          <UserCheck className="w-3.5 h-3.5 text-blue-500" />
                          <span className="text-blue-700 dark:text-blue-400">Worker</span>
                        </>
                      )}
                      {profile.role === "mess" && (
                        <>
                          <span className="w-1.5 h-1.5 rounded-full bg-[#1E8449]" />
                          <span className="text-[#166534] dark:text-green-400">Mess User</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Role Selection & Actions */}
                  <div className="flex items-center justify-between gap-4 pt-3 border-t border-gray-100 dark:border-border">
                    <div className="flex-1 max-w-[150px]">
                      <select
                        value={profile.role}
                        onChange={(e) =>
                          handleRoleChange(profile.id, e.target.value as any)
                        }
                        className="w-full h-10 px-2 rounded-lg border border-gray-200 dark:border-border text-sm focus:outline-none focus:ring-2 focus:ring-[#1E8449] bg-white dark:bg-gray-900 text-gray-850 dark:text-gray-200"
                      >
                        <option value="mess">Mess User</option>
                        <option value="worker">Worker</option>
                        <option value="admin">Admin</option>
                      </select>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleSaveRole(profile)}
                        disabled={savingId === profile.id}
                        className="bg-[#1E8449] hover:bg-[#166534] text-white rounded-lg flex items-center gap-1 px-3 py-2 text-xs font-semibold"
                      >
                        <Save className="w-3.5 h-3.5" />
                        Save
                      </Button>
                      <Button
                        onClick={() => handleDeleteUser(profile.id, profile.email)}
                        className="bg-red-50 dark:bg-red-950/20 hover:bg-red-100 dark:hover:bg-red-950/40 text-red-600 dark:text-red-400 rounded-lg flex items-center gap-1 px-3 py-2 text-xs font-semibold border border-red-200 dark:border-red-900/30"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Section: Waste Sources */}
      {activeTab === "sources" && (
        <div className="space-y-4">
          {/* Add Source Input Form */}
          <form onSubmit={handleAddSource} className="bg-white dark:bg-card rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-border space-y-3">
            <h3 className="font-semibold text-sm text-gray-800 dark:text-white">Add Campus Waste Source</h3>
            <div className="flex gap-2">
              <Input
                type="text"
                placeholder="Enter source name (e.g., Royal Mess)"
                value={newSourceName}
                onChange={(e) => setNewSourceName(e.target.value)}
                className="h-10 border-gray-200 dark:border-border rounded-lg focus:ring-2 focus:ring-[#1E8449] bg-gray-50/50 dark:bg-gray-900/30"
              />
              <Button
                type="submit"
                disabled={addingSource}
                className="bg-[#1E8449] hover:bg-[#166534] text-white rounded-lg flex items-center gap-1.5 px-4 py-2 text-sm font-semibold whitespace-nowrap"
              >
                <Plus className="w-4 h-4" />
                Add Source
              </Button>
            </div>
          </form>

          {/* Sources List */}
          {loading ? (
            <div className="flex justify-center items-center py-10">
              <div className="w-8 h-8 border-4 border-[#1E8449] border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : sources.length === 0 ? (
            <div className="text-center py-10 text-gray-500 bg-white dark:bg-card rounded-2xl border border-gray-100 dark:border-border">
              No waste sources logged. Add one above.
            </div>
          ) : (
            <div className="space-y-2">
              {sources.map((source) => (
                <div
                  key={source.id}
                  className="bg-white dark:bg-card rounded-xl px-5 py-4 shadow-sm border border-gray-100 dark:border-border flex items-center justify-between gap-4"
                >
                  {editingSourceId === source.id ? (
                    <div className="flex items-center gap-2 flex-1">
                      <Input
                        type="text"
                        value={editingSourceName}
                        onChange={(e) => setEditingSourceName(e.target.value)}
                        className="h-9 border-gray-200 dark:border-border rounded-lg focus:ring-2 focus:ring-[#1E8449] bg-gray-50 dark:bg-gray-900/50"
                      />
                      <button
                        onClick={() => handleSaveEditSource(source.id)}
                        className="p-1.5 bg-green-50 dark:bg-green-950/20 hover:bg-green-100 dark:hover:bg-green-950/40 rounded-lg text-[#1E8449] dark:text-green-400 border border-green-200 dark:border-border"
                        title="Save Changes"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setEditingSourceId(null)}
                        className="p-1.5 bg-red-50 dark:bg-red-950/20 hover:bg-red-100 dark:hover:bg-red-950/40 rounded-lg text-red-600 dark:text-red-400 border border-red-200 dark:border-border"
                        title="Cancel"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <span className="font-semibold text-gray-800 dark:text-gray-250 text-sm">{source.name}</span>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => {
                            setEditingSourceId(source.id);
                            setEditingSourceName(source.name);
                          }}
                          className="p-1.5 hover:bg-green-50 dark:hover:bg-green-950/20 rounded-lg text-[#1E8449] dark:text-green-400 border border-transparent hover:border-green-200 dark:hover:border-border transition-colors"
                          title="Edit Source Name"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteSource(source.id, source.name)}
                          className="p-1.5 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg text-red-600 dark:text-red-400 border border-transparent hover:border-red-200 dark:hover:border-border transition-colors"
                          title="Delete Source"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Section: Log Management and Cleanup */}
      {activeTab === "cleanup" && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-card rounded-2xl p-6 shadow-md border border-green-100 dark:border-border space-y-6">
            
            {/* 1. Log Type Selection */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">Log Type to Clean</label>
              <div className="grid grid-cols-3 gap-2 bg-gray-100 dark:bg-gray-900/50 p-1 rounded-xl shadow-inner">
                <button
                  type="button"
                  onClick={() => setCleanupTab("waste")}
                  className={`py-2 rounded-lg font-medium text-xs transition-all ${
                    cleanupTab === "waste" ? "bg-white dark:bg-gray-800 text-[#166534] dark:text-green-400 shadow-sm" : "text-gray-500 dark:text-gray-400 hover:text-gray-700"
                  }`}
                >
                  Waste Logs
                </button>
                <button
                  type="button"
                  onClick={() => setCleanupTab("fertilizer")}
                  className={`py-2 rounded-lg font-medium text-xs transition-all ${
                    cleanupTab === "fertilizer" ? "bg-white dark:bg-gray-800 text-[#166534] dark:text-green-400 shadow-sm" : "text-gray-500 dark:text-gray-400 hover:text-gray-700"
                  }`}
                >
                  Fertilizer Logs
                </button>
                <button
                  type="button"
                  onClick={() => setCleanupTab("both")}
                  className={`py-2 rounded-lg font-medium text-xs transition-all ${
                    cleanupTab === "both" ? "bg-white dark:bg-gray-800 text-[#166534] dark:text-green-400 shadow-sm" : "text-gray-500 dark:text-gray-400 hover:text-gray-700"
                  }`}
                >
                  Both
                </button>
              </div>
            </div>

            {/* 2. Mode Selection */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">Selection Mode</label>
              <div className="grid grid-cols-2 gap-2 bg-gray-100 dark:bg-gray-900/50 p-1 rounded-xl shadow-inner">
                <button
                  type="button"
                  onClick={() => setCleanupMode("month")}
                  className={`py-2 rounded-lg font-medium text-xs transition-all ${
                    cleanupMode === "month" ? "bg-white dark:bg-gray-800 text-[#166534] dark:text-green-400 shadow-sm" : "text-gray-500 dark:text-gray-400 hover:text-gray-700"
                  }`}
                >
                  Select Whole Month
                </button>
                <button
                  type="button"
                  onClick={() => setCleanupMode("range")}
                  className={`py-2 rounded-lg font-medium text-xs transition-all ${
                    cleanupMode === "range" ? "bg-white dark:bg-gray-800 text-[#166534] dark:text-green-400 shadow-sm" : "text-gray-500 dark:text-gray-400 hover:text-gray-700"
                  }`}
                >
                  Select Date Range
                </button>
              </div>
            </div>

            {/* 3. Date Selectors based on Mode */}
            {cleanupMode === "month" ? (
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">Select Month</label>
                <input
                  type="month"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="w-full h-11 px-3 border border-gray-200 dark:border-border rounded-xl focus:ring-2 focus:ring-[#1E8449] bg-gray-50/50 dark:bg-gray-900/30 text-sm font-medium text-gray-700 dark:text-gray-300"
                />
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">From Date</label>
                  <input
                    type="date"
                    value={cleanupStartDate}
                    onChange={(e) => setCleanupStartDate(e.target.value)}
                    className="w-full h-11 px-3 border border-gray-200 dark:border-border rounded-xl focus:ring-2 focus:ring-[#1E8449] bg-gray-50/50 dark:bg-gray-900/30 text-sm font-medium text-gray-700 dark:text-gray-300"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">To Date</label>
                  <input
                    type="date"
                    value={cleanupEndDate}
                    onChange={(e) => setCleanupEndDate(e.target.value)}
                    className="w-full h-11 px-3 border border-gray-200 dark:border-border rounded-xl focus:ring-2 focus:ring-[#1E8449] bg-gray-50/50 dark:bg-gray-900/30 text-sm font-medium text-gray-700 dark:text-gray-300"
                  />
                </div>
              </div>
            )}

            {/* 4. Match Summary Preview Box */}
            <div className="bg-red-50/50 dark:bg-red-950/10 rounded-xl p-4 border border-red-100 dark:border-red-900/20">
              <p className="text-[11px] font-semibold text-red-600 dark:text-red-400 mb-2 uppercase tracking-wider">Entries matching selection</p>
              {matchingCount.loading ? (
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin"></div>
                  Calculating matches...
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3 text-xs">
                  {(cleanupTab === "waste" || cleanupTab === "both") && (
                    <div className="bg-white dark:bg-gray-900 rounded-lg p-2.5 border border-red-100/50 dark:border-red-900/10">
                      <p className="text-gray-400">Waste Log Entries</p>
                      <p className="text-lg font-bold text-gray-700 dark:text-gray-250 mt-0.5">{matchingCount.waste}</p>
                    </div>
                  )}
                  {(cleanupTab === "fertilizer" || cleanupTab === "both") && (
                    <div className="bg-white dark:bg-gray-900 rounded-lg p-2.5 border border-red-100/50 dark:border-red-900/10">
                      <p className="text-gray-400">Fertilizer Production Logs</p>
                      <p className="text-lg font-bold text-gray-700 dark:text-gray-250 mt-0.5">{matchingCount.fertilizer}</p>
                    </div>
                  )}
                  <div className="col-span-2 pt-2 border-t border-red-100/30 dark:border-red-900/10 flex items-center justify-between text-gray-500 font-medium">
                    <span>Total Selected:</span>
                    <span className="text-red-600 dark:text-red-400 font-bold">
                      {matchingCount.waste + matchingCount.fertilizer} entries
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* 5. Delete Action Button */}
            <Button
              onClick={handleDeleteEntries}
              disabled={loading || (matchingCount.waste + matchingCount.fertilizer === 0) || matchingCount.loading}
              className="w-full bg-red-600 hover:bg-red-700 text-white rounded-xl flex items-center justify-center gap-2 py-3 font-semibold text-sm shadow-md transition-colors disabled:opacity-50"
            >
              <Trash2 className="w-4 h-4" />
              Delete Selected Entries
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
