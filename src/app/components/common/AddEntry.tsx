import { useState, useEffect } from "react";
import { CheckCircle2, Trash2, Sprout } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "../../../lib/supabaseClient";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Button } from "../ui/button";

export function AddEntry() {
  const [entryType, setEntryType] = useState<"waste" | "fertilizer">("waste");
  const [mess, setMess] = useState("");
  const [amount, setAmount] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [todayCount, setTodayCount] = useState(0);
  const [lastEntryText, setLastEntryText] = useState("None");
  const [sources, setSources] = useState<{ id: string; name: string }[]>([]);

  const context = (window as any).__ROUTE_CONTEXT__;

  const fetchStats = async () => {
    try {
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);

      // Fetch today's waste entries
      const { count: wasteCount, error: wError } = await supabase
        .from("waste_entries")
        .select("*", { count: "exact", head: true })
        .gte("created_at", startOfDay.toISOString());

      // Fetch today's fertilizer entries
      const { count: fertCount, error: fError } = await supabase
        .from("fertilizer_entries")
        .select("*", { count: "exact", head: true })
        .gte("created_at", startOfDay.toISOString());

      if (!wError && !fError) {
        setTodayCount((wasteCount || 0) + (fertCount || 0));
      }

      // Fetch last entry
      const { data: lastWaste } = await supabase
        .from("waste_entries")
        .select("waste, mess, created_at")
        .order("created_at", { ascending: false })
        .limit(1);

      const { data: lastFert } = await supabase
        .from("fertilizer_entries")
        .select("amount, created_at")
        .order("created_at", { ascending: false })
        .limit(1);

      let lastText = "None";
      if (lastWaste?.[0] && lastFert?.[0]) {
        const wTime = new Date(lastWaste[0].created_at).getTime();
        const fTime = new Date(lastFert[0].created_at).getTime();
        if (wTime > fTime) {
          lastText = `${lastWaste[0].waste} kg (${lastWaste[0].mess})`;
        } else {
          lastText = `${lastFert[0].amount} kg (Fertilizer)`;
        }
      } else if (lastWaste?.[0]) {
        lastText = `${lastWaste[0].waste} kg (${lastWaste[0].mess})`;
      } else if (lastFert?.[0]) {
        lastText = `${lastFert[0].amount} kg (Fertilizer)`;
      }
      setLastEntryText(lastText);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchSources = async () => {
    try {
      const { data, error } = await supabase
        .from("waste_sources")
        .select("id, name")
        .order("name", { ascending: true });
      if (!error && data) {
        setSources(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchStats();
    fetchSources();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (entryType === "waste") {
      if (!mess || !amount) {
        toast.error("Please fill all fields");
        return;
      }
    } else {
      if (!amount) {
        toast.error("Please enter the fertilizer amount");
        return;
      }
    }

    setIsSubmitting(true);
    try {
      if (entryType === "waste") {
        const { error } = await supabase
          .from("waste_entries")
          .insert({
            mess: mess,
            waste: parseFloat(amount),
            created_by: context?.userId
          });

        if (error) {
          toast.error(error.message);
        } else {
          toast.success("Waste entry recorded successfully!");
          setAmount("");
          fetchStats();
        }
      } else {
        const { error } = await supabase
          .from("fertilizer_entries")
          .insert({
            amount: parseFloat(amount),
            created_by: context?.userId
          });

        if (error) {
          toast.error(error.message);
        } else {
          toast.success("Fertilizer production recorded successfully!");
          setAmount("");
          fetchStats();
        }
      }
    } catch (err: any) {
      console.error(err);
      toast.error("Failed to submit entry");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-4 min-h-full flex flex-col">
      {/* Header Section */}
      <div className="mb-4">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          {entryType === "waste" ? "Add Waste Entry" : "Record Fertilizer Made"}
        </h2>
      </div>

      {/* Entry Type Selector */}
      <div className="flex gap-2 bg-gray-100 dark:bg-gray-900/50 p-1.5 rounded-xl mb-4 shadow-inner">
        <button
          type="button"
          onClick={() => {
            setEntryType("waste");
            setAmount("");
          }}
          className={`flex-1 py-2.5 rounded-lg font-medium text-sm transition-all ${
            entryType === "waste" ? "bg-white dark:bg-gray-800 text-[#166534] dark:text-green-400 shadow-sm" : "text-gray-500 dark:text-gray-400 hover:text-gray-700"
          }`}
        >
          Waste Entry
        </button>
        <button
          type="button"
          onClick={() => {
            setEntryType("fertilizer");
            setAmount("");
          }}
          className={`flex-1 py-2.5 rounded-lg font-medium text-sm transition-all ${
            entryType === "fertilizer" ? "bg-white dark:bg-gray-800 text-[#166534] dark:text-green-400 shadow-sm" : "text-gray-500 dark:text-gray-400 hover:text-gray-700"
          }`}
        >
          Fertilizer Production
        </button>
      </div>

      {/* Form Card */}
      <div className="bg-white dark:bg-card rounded-2xl p-4 shadow-[0_1px_3px_rgba(0,0,0,0.05),0_10px_15px_-3px_rgba(0,0,0,0.05)] border border-gray-100 dark:border-border">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Mess Selection (only for waste entries) */}
          {entryType === "waste" && (
            <div className="space-y-1.5">
              <Label htmlFor="mess" className="block text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-1">
                Select Source
              </Label>
              <Select value={mess} onValueChange={setMess}>
                <SelectTrigger
                  id="mess"
                  className="h-10 bg-white dark:bg-gray-900/30 border-gray-200 dark:border-border rounded-lg focus:ring-1 focus:ring-[#1E8449] focus:border-[#1E8449] text-sm"
                >
                  <SelectValue placeholder="Choose a source" />
                </SelectTrigger>
                <SelectContent>
                  {sources.map((src) => (
                    <SelectItem key={src.id} value={src.name}>
                      {src.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Amount Input */}
          <div className="space-y-1.5">
            <Label htmlFor="amount" className="block text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-1">
              {entryType === "waste" ? "Waste Amount (kg)" : "Fertilizer Amount (kg)"}
            </Label>
            <Input
              id="amount"
              type="number"
              step="0.1"
              placeholder={entryType === "waste" ? "Enter waste in kg" : "Enter fertilizer in kg"}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="h-10 bg-white dark:bg-gray-900/30 border-gray-200 dark:border-border rounded-lg focus:ring-1 focus:ring-[#1E8449] focus:border-[#1E8449] text-sm"
            />
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full h-10 bg-[#1E8449] hover:bg-[#166534] text-white rounded-lg text-sm font-semibold shadow-sm transition-colors duration-150 cursor-pointer mt-1"
          >
            {isSubmitting ? "Submitting..." : "Submit Entry"}
          </Button>
        </form>
      </div>

      {/* Quick Stats */}
      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="bg-white dark:bg-card rounded-xl p-4 shadow-sm border border-gray-100 dark:border-border">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Today's Entries</p>
          <p className="text-2xl font-semibold text-gray-900 dark:text-white">{todayCount}</p>
        </div>
        <div className="bg-white dark:bg-card rounded-xl p-4 shadow-sm border border-gray-100 dark:border-border">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Last Entry</p>
          <p className="text-sm font-semibold text-gray-900 dark:text-white truncate" title={lastEntryText}>
            {lastEntryText}
          </p>
        </div>
      </div>
    </div>
  );
}
