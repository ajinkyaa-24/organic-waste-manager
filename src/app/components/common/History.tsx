import { useState, useEffect } from "react";
import { Clock, Utensils, Sprout } from "lucide-react";
import { supabase } from "../../../lib/supabaseClient";
import { toast } from "sonner";

type FilterType = "daily" | "weekly" | "monthly";
type LogType = "waste" | "fertilizer";

interface WasteEntry {
  id: string;
  mess: string;
  waste: number;
  created_at: string;
}

interface FertilizerEntry {
  id: string;
  amount: number;
  created_at: string;
}

export function History() {
  const [filter, setFilter] = useState<FilterType>("daily");
  const [logType, setLogType] = useState<LogType>("waste");
  const [wasteEntries, setWasteEntries] = useState<WasteEntry[]>([]);
  const [fertilizerEntries, setFertilizerEntries] = useState<FertilizerEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const getStartDate = () => {
    const now = new Date();
    if (filter === "daily") {
      now.setHours(0, 0, 0, 0);
      return now.toISOString();
    } else if (filter === "weekly") {
      const d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      d.setHours(0, 0, 0, 0);
      return d.toISOString();
    } else {
      const d = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      d.setHours(0, 0, 0, 0);
      return d.toISOString();
    }
  };

  const fetchEntries = async () => {
    setLoading(true);
    try {
      const startDate = getStartDate();
      if (logType === "waste") {
        const { data, error } = await supabase
          .from("waste_entries")
          .select("*")
          .gte("created_at", startDate)
          .order("created_at", { ascending: false });

        if (error) {
          toast.error("Failed to load waste history");
          console.error(error);
        } else {
          setWasteEntries(data || []);
        }
      } else {
        const { data, error } = await supabase
          .from("fertilizer_entries")
          .select("*")
          .gte("created_at", startDate)
          .order("created_at", { ascending: false });

        if (error) {
          toast.error("Failed to load fertilizer history");
          console.error(error);
        } else {
          setFertilizerEntries(data || []);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEntries();
  }, [filter, logType]);

  const getMessColor = (mess: string) => {
    switch (mess) {
      case "Boys Mess":
        return "bg-blue-100 text-blue-700";
      case "Girls Mess":
        return "bg-pink-100 text-pink-700";
      case "Staff Mess":
        return "bg-purple-100 text-purple-700";
      case "Canteen":
        return "bg-yellow-100 text-yellow-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const totalEntries = logType === "waste" ? wasteEntries.length : fertilizerEntries.length;
  const totalAmount = logType === "waste"
    ? wasteEntries.reduce((sum, entry) => sum + Number(entry.waste), 0)
    : fertilizerEntries.reduce((sum, entry) => sum + Number(entry.amount), 0);

  return (
    <div className="p-5 space-y-5">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
          History Logs
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          View all waste and fertilizer records
        </p>
      </div>

      {/* Log Type Toggle */}
      <div className="flex gap-2 bg-gray-100 dark:bg-gray-900/50 p-1 rounded-xl shadow-inner">
        <button
          onClick={() => setLogType("waste")}
          className={`flex-1 py-2 rounded-lg font-medium text-xs transition-all ${
            logType === "waste" ? "bg-white dark:bg-gray-800 text-[#166534] dark:text-green-400 shadow-sm" : "text-gray-500 dark:text-gray-400 hover:text-gray-700"
          }`}
        >
          Waste Logs
        </button>
        <button
          onClick={() => setLogType("fertilizer")}
          className={`flex-1 py-2 rounded-lg font-medium text-xs transition-all ${
            logType === "fertilizer" ? "bg-white dark:bg-gray-800 text-[#166534] dark:text-green-400 shadow-sm" : "text-gray-500 dark:text-gray-400 hover:text-gray-700"
          }`}
        >
          Fertilizer Production
        </button>
      </div>

      {/* Filter Buttons */}
      <div className="flex gap-2 bg-white dark:bg-card p-1.5 rounded-xl shadow-sm border border-gray-200 dark:border-border">
        {(["daily", "weekly", "monthly"] as FilterType[]).map((filterType) => (
          <button
            key={filterType}
            onClick={() => setFilter(filterType)}
            className={`flex-1 py-2.5 px-4 rounded-lg font-medium text-xs transition-all duration-200 ${
              filter === filterType
                ? "bg-gradient-to-r from-[#1E8449] to-[#166534] text-white shadow-md"
                : "text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
            }`}
          >
            {filterType.charAt(0).toUpperCase() + filterType.slice(1)}
          </button>
        ))}
      </div>

      {/* Summary Card */}
      <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 rounded-2xl p-5 shadow-md border border-green-100 dark:border-border">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Entries</p>
            <p className="text-3xl font-semibold text-gray-900 dark:text-white">
              {totalEntries}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
              {logType === "waste" ? "Total Waste" : "Total Fertilizer"}
            </p>
            <p className="text-3xl font-semibold text-[#1E8449] dark:text-green-400">
              {totalAmount.toFixed(1)} kg
            </p>
          </div>
        </div>
      </div>

      {/* History List */}
      {loading ? (
        <div className="flex justify-center items-center py-10">
          <div className="w-8 h-8 border-4 border-[#1E8449] border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : totalEntries === 0 ? (
        <div className="text-center py-10 text-gray-500">No logs found for this period.</div>
      ) : (
        <div className="space-y-1">
          {(() => {
            const entries = logType === "waste" ? wasteEntries : fertilizerEntries;

            // Group entries by date
            const grouped: Record<string, typeof entries> = {};
            entries.forEach((entry) => {
              const dateKey = new Date(entry.created_at).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              });
              if (!grouped[dateKey]) grouped[dateKey] = [];
              grouped[dateKey].push(entry);
            });

            const formatDateLabel = (dateStr: string) => {
              const today = new Date();
              const yesterday = new Date(today);
              yesterday.setDate(yesterday.getDate() - 1);

              const todayKey = today.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
              const yesterdayKey = yesterday.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

              if (dateStr === todayKey) return "Today";
              if (dateStr === yesterdayKey) return "Yesterday";
              return dateStr;
            };

            return Object.entries(grouped).map(([date, dateEntries]) => (
              <div key={date} className="mb-5">
                {/* Date Header */}
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex-1 h-px bg-gray-200 dark:bg-border" />
                  <span className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 bg-background dark:bg-background px-2 py-0.5 rounded-full border border-gray-200 dark:border-border whitespace-nowrap">
                    {formatDateLabel(date)}
                  </span>
                  <div className="flex-1 h-px bg-gray-200 dark:bg-border" />
                </div>

                {/* Entries for this date */}
                <div className="space-y-2.5">
                  {dateEntries.map((entry: any) => (
                    <div
                      key={entry.id}
                      className="bg-white dark:bg-card rounded-xl p-4 shadow-sm border border-gray-100 dark:border-border hover:shadow-md transition-shadow duration-200"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <div className="bg-green-100 dark:bg-green-900/30 p-2 rounded-lg">
                            {logType === "waste"
                              ? <Utensils className="w-5 h-5 text-[#1E8449] dark:text-green-400" />
                              : <Sprout className="w-5 h-5 text-[#1E8449] dark:text-green-400" />
                            }
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-900 dark:text-white text-sm">
                              {logType === "waste" ? entry.mess : "Fertilizer Production"}
                            </h4>
                            <span className="flex items-center gap-1 mt-1 text-xs text-gray-400 dark:text-gray-500">
                              <Clock className="w-3 h-3" />
                              {new Date(entry.created_at).toLocaleTimeString("en-US", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xl font-bold text-[#1E8449] dark:text-green-400">
                            {logType === "waste" ? entry.waste : entry.amount}
                          </p>
                          <p className="text-xs text-gray-400 dark:text-gray-500">kg</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ));
          })()}
        </div>
      )}
    </div>
  );
}

