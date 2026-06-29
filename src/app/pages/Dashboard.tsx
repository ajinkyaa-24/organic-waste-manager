import { useState, useEffect } from "react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { TrendingUp, Calendar, Trash2, Sprout } from "lucide-react";
import { supabase } from "../../lib/supabaseClient";
import { toast } from "sonner";

type DashboardType = "waste" | "fertilizer";
type ChartView = "weekly" | "monthly";

export function Dashboard() {
  const [activeType, setActiveType] = useState<DashboardType>("waste");
  const [chartView, setChartView] = useState<ChartView>("weekly");
  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchEntries = async () => {
    setLoading(true);
    try {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      
      if (activeType === "waste") {
        const { data, error } = await supabase
          .from("waste_entries")
          .select("*")
          .gte("created_at", thirtyDaysAgo.toISOString())
          .order("created_at", { ascending: true });

        if (error) {
          toast.error("Failed to load waste analytics");
        } else {
          setEntries(data || []);
        }
      } else {
        const { data, error } = await supabase
          .from("fertilizer_entries")
          .select("*")
          .gte("created_at", thirtyDaysAgo.toISOString())
          .order("created_at", { ascending: true });

        if (error) {
          toast.error("Failed to load fertilizer analytics");
        } else {
          setEntries(data || []);
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
  }, [activeType]);

  // Aggregation metrics
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const weekStart = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const monthStart = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const todayEntries = entries.filter((e) => new Date(e.created_at) >= todayStart);
  const weeklyEntries = entries.filter((e) => new Date(e.created_at) >= weekStart);
  const monthlyEntries = entries.filter((e) => new Date(e.created_at) >= monthStart);

  const todaySum = todayEntries.reduce((sum, e) => sum + Number(activeType === "waste" ? e.waste : e.amount), 0);
  const weeklySum = weeklyEntries.reduce((sum, e) => sum + Number(activeType === "waste" ? e.waste : e.amount), 0);
  const monthlySum = monthlyEntries.reduce((sum, e) => sum + Number(activeType === "waste" ? e.waste : e.amount), 0);

  // Compare today vs yesterday
  const getComparison = () => {
    const yesterdayStart = new Date(todayStart.getTime() - 24 * 60 * 60 * 1000);
    const yesterdayEntries = entries.filter((e) => {
      const d = new Date(e.created_at);
      return d >= yesterdayStart && d < todayStart;
    });

    const yesterdaySum = yesterdayEntries.reduce(
      (sum, e) => sum + Number(activeType === "waste" ? e.waste : e.amount),
      0
    );

    if (yesterdaySum === 0) {
      return todaySum > 0 ? "No data from yesterday" : "No entries logged yet";
    }

    const diff = ((todaySum - yesterdaySum) / yesterdaySum) * 100;
    const sign = diff >= 0 ? "+" : "";
    return `${sign}${diff.toFixed(0)}% from yesterday`;
  };

  // Compile Chart Data (Weekly Overview)
  const getWeeklyData = () => {
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const now = new Date();
    const chartData: any[] = [];

    for (let i = 6; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dayLabel = days[d.getDay()];
      const dayStr = d.toLocaleDateString();
      chartData.push({ day: dayLabel, dayStr, value: 0 });
    }

    entries.forEach((e) => {
      const dateStr = new Date(e.created_at).toLocaleDateString();
      const match = chartData.find((c) => c.dayStr === dateStr);
      if (match) {
        match.value += Number(activeType === "waste" ? e.waste : e.amount);
      }
    });

    return chartData.map((c) => ({
      day: c.day,
      amount: Number(c.value.toFixed(1)),
    }));
  };

  // Compile Chart Data (Monthly Trend - 4 weeks)
  const getMonthlyData = () => {
    const chartData = [
      { week: "Week 1", startDaysAgo: 28, endDaysAgo: 21, value: 0 },
      { week: "Week 2", startDaysAgo: 21, endDaysAgo: 14, value: 0 },
      { week: "Week 3", startDaysAgo: 14, endDaysAgo: 7, value: 0 },
      { week: "Week 4", startDaysAgo: 7, endDaysAgo: 0, value: 0 },
    ];

    const now = new Date();
    entries.forEach((e) => {
      const time = new Date(e.created_at).getTime();
      const diffDays = (now.getTime() - time) / (1000 * 60 * 60 * 24);

      for (const w of chartData) {
        if (diffDays >= w.endDaysAgo && diffDays < w.startDaysAgo) {
          w.value += Number(activeType === "waste" ? e.waste : e.amount);
          break;
        }
      }
    });

    return chartData.map((w) => ({
      week: w.week,
      amount: Number(w.value.toFixed(1)),
    }));
  };

  const tooltipStyle = {
    contentStyle: {
      backgroundColor: "var(--card)",
      border: "1px solid var(--border)",
      borderRadius: "8px",
      color: "var(--foreground)",
    },
  };

  return (
    <div className="p-4 space-y-4">
      {/* Category Toggle */}
      <div className="flex gap-2 bg-gray-100 dark:bg-gray-900/50 p-1 rounded-xl shadow-inner">
        <button
          onClick={() => setActiveType("waste")}
          className={`flex-1 py-2.5 rounded-lg font-medium text-sm transition-all flex items-center justify-center gap-2 ${
            activeType === "waste" ? "bg-white dark:bg-gray-800 text-[#166534] dark:text-green-400 shadow-sm" : "text-gray-500 dark:text-gray-400 hover:text-gray-700"
          }`}
        >
          <Trash2 className="w-4 h-4" />
          <span>Waste Tracking</span>
        </button>
        <button
          onClick={() => setActiveType("fertilizer")}
          className={`flex-1 py-2.5 rounded-lg font-medium text-sm transition-all flex items-center justify-center gap-2 ${
            activeType === "fertilizer" ? "bg-white dark:bg-gray-800 text-[#166534] dark:text-green-400 shadow-sm" : "text-gray-500 dark:text-gray-400 hover:text-gray-700"
          }`}
        >
          <Sprout className="w-4 h-4" />
          <span>Fertilizer Tracking</span>
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="w-10 h-10 border-4 border-[#1E8449] border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 gap-4">
            {/* Today's Sum */}
            <div className="bg-white dark:bg-card rounded-2xl p-4 shadow-sm border border-green-100 dark:border-border">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                  Total {activeType === "waste" ? "Waste" : "Fertilizer"} Today
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{todaySum.toFixed(1)} kg</p>
                <p className="text-sm text-[#1E8449] dark:text-green-400 mt-2 flex items-center gap-1">
                  <TrendingUp className="w-4 h-4" />
                  <span>{getComparison()}</span>
                </p>
              </div>
            </div>

            {/* Weekly & Monthly Cards */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 rounded-2xl p-3 shadow-sm border border-green-100 dark:border-border">
                <div className="bg-white/60 dark:bg-card/40 p-2.5 rounded-lg inline-block mb-2">
                  <Calendar className="w-5 h-5 text-[#1E8449]" />
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Weekly Total</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">{weeklySum.toFixed(1)} kg</p>
              </div>
              <div className="bg-gradient-to-br from-green-50 to-teal-50 dark:from-emerald-950/20 dark:to-teal-950/20 rounded-2xl p-3 shadow-sm border border-green-100 dark:border-border">
                <div className="bg-white/60 dark:bg-card/40 p-2.5 rounded-lg inline-block mb-2">
                  <TrendingUp className="w-5 h-5 text-[#1E8449]" />
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Monthly Total</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">{monthlySum.toFixed(1)} kg</p>
              </div>
            </div>
          </div>

          {/* Combined Chart Card with toggle */}
          <div className="bg-white dark:bg-card rounded-2xl p-4 shadow-sm border border-green-100 dark:border-border">
            {/* Chart header with toggle */}
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900 dark:text-white">
                {chartView === "weekly" ? "Weekly Overview" : "Monthly Trend"} (kg)
              </h3>
              <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-0.5 gap-0.5">
                <button
                  onClick={() => setChartView("weekly")}
                  className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${
                    chartView === "weekly"
                      ? "bg-white dark:bg-gray-700 text-[#1E8449] shadow-sm"
                      : "text-gray-500 dark:text-gray-400 hover:text-gray-700"
                  }`}
                >
                  7 Days
                </button>
                <button
                  onClick={() => setChartView("monthly")}
                  className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${
                    chartView === "monthly"
                      ? "bg-white dark:bg-gray-700 text-[#1E8449] shadow-sm"
                      : "text-gray-500 dark:text-gray-400 hover:text-gray-700"
                  }`}
                >
                  30 Days
                </button>
              </div>
            </div>

            {/* Chart render — only one visible at a time */}
            {chartView === "weekly" ? (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={getWeeklyData()} id="weekly-chart">
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="day" tick={{ fontSize: 12 }} stroke="#9CA3AF" />
                  <YAxis tick={{ fontSize: 12 }} stroke="#9CA3AF" />
                  <Tooltip {...tooltipStyle} />
                  <Bar dataKey="amount" fill="#1E8449" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={getMonthlyData()} id="monthly-chart">
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="week" tick={{ fontSize: 12 }} stroke="#9CA3AF" />
                  <YAxis tick={{ fontSize: 12 }} stroke="#9CA3AF" />
                  <Tooltip {...tooltipStyle} />
                  <Line
                    type="monotone"
                    dataKey="amount"
                    stroke="#1E8449"
                    strokeWidth={3}
                    dot={{ fill: "#1E8449", r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </>
      )}
    </div>
  );
}
