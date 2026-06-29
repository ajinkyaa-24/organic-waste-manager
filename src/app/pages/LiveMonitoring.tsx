import { useEffect, useState } from "react";
import { Activity, TrendingUp, BarChart2 } from "lucide-react";
import {
  PieChart, Pie, Cell, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
} from "recharts";
import { supabase } from "../../lib/supabaseClient";

const GREEN_COLORS = [
  "#1E8449", "#15803D", "#059669", "#1E8449", "#065F46",
  "#34D399", "#166534", "#4ADE80", "#0D9488", "#A7F3D0",
];

export function LiveMonitoring() {
  const [totalWaste, setTotalWaste] = useState(0);
  const [messBreakdown, setMessBreakdown] = useState<any[]>([]);
  const [weeklyData, setWeeklyData] = useState<any[]>([]);
  const [isLive] = useState(true);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchLiveStats = async () => {
    try {
      const now = new Date();
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      const monthStart = new Date();
      monthStart.setDate(monthStart.getDate() - 29);
      monthStart.setHours(0, 0, 0, 0);

      const { data: sourcesData } = await supabase
        .from("waste_sources")
        .select("name")
        .order("name", { ascending: true });

      const { data: todayEntries } = await supabase
        .from("waste_entries")
        .select("mess, waste")
        .gte("created_at", todayStart.toISOString());

      const { data: recentEntries } = await supabase
        .from("waste_entries")
        .select("mess, waste, created_at")
        .gte("created_at", monthStart.toISOString())
        .order("created_at", { ascending: true });

      const sourcesList = sourcesData || [];
      const entries = todayEntries || [];
      const allRecentEntries = recentEntries || [];

      const sum = entries.reduce((s, e) => s + Number(e.waste), 0);
      setTotalWaste(sum);

      const breakdown = sourcesList.map((source, index) => {
        const sourceSum = entries
          .filter((e) => e.mess === source.name)
          .reduce((s, e) => s + Number(e.waste), 0);
        return {
          name: source.name,
          value: Number(sourceSum.toFixed(1)),
          color: GREEN_COLORS[index % GREEN_COLORS.length],
        };
      });
      setMessBreakdown(breakdown);

      // Weekly (last 7 days)
      const weekly: any[] = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        d.setHours(0, 0, 0, 0);
        const dayEnd = new Date(d);
        dayEnd.setHours(23, 59, 59, 999);
        const dayTotal = allRecentEntries
          .filter((e) => { const t = new Date(e.created_at); return t >= d && t <= dayEnd; })
          .reduce((s, e) => s + Number(e.waste), 0);
        weekly.push({ day: d.toLocaleDateString("en-US", { weekday: "short" }), total: Number(dayTotal.toFixed(1)), isToday: i === 0 });
      }
      setWeeklyData(weekly);
      setLastUpdated(now);
    } catch (err) {
      console.error("Error fetching live monitoring data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLiveStats();
    const interval = setInterval(fetchLiveStats, 30000);
    return () => clearInterval(interval);
  }, []);

  const chartData = messBreakdown.filter((m) => m.value > 0);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white border border-green-100 rounded-xl px-3 py-2 shadow-lg text-sm">
          <p className="font-semibold text-gray-700">{label}</p>
          <p className="text-[#1E8449] font-bold">{payload[0].value} kg</p>
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
        <div className="w-10 h-10 border-4 border-[#1E8449] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    /* Full-height, no-scroll dashboard grid */
    <div className="h-full w-full overflow-hidden bg-gray-50 dark:bg-background flex flex-col p-3 md:p-4 gap-3">

      {/* ── Header row ── */}
      <div className="flex items-center justify-between flex-shrink-0">
        <div>
          <h2 className="text-lg md:text-2xl xl:text-3xl font-bold text-gray-900 dark:text-white leading-tight">Live Monitoring</h2>
          {lastUpdated && (
            <p className="text-[10px] md:text-xs text-gray-400 dark:text-gray-500">
              Updated {lastUpdated.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
            </p>
          )}
        </div>
        <div className="flex items-center gap-1.5 bg-green-100 dark:bg-green-900/30 px-3 py-1 rounded-full">
          <div className={`w-2 h-2 rounded-full bg-[#1E8449] ${isLive ? "animate-pulse" : ""}`} />
          <span className="text-xs md:text-sm font-semibold text-[#166534] dark:text-green-400">Live</span>
        </div>
      </div>

      {/* ── Main grid: flex-1 fills remaining height ── */}
      <div className="flex-1 min-h-0 grid grid-cols-1 md:grid-cols-2 gap-3">

        {/* Left column on tablet: Today + Pie stacked */}
        <div className="flex flex-col gap-3 min-h-0">

          {/* Today's Total hero */}
          <div className="bg-gradient-to-br from-[#1E8449] to-[#0F4C2A] rounded-2xl px-5 py-4 md:px-6 md:py-5 shadow-xl text-white flex-shrink-0">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs md:text-sm font-medium opacity-80 uppercase tracking-widest mb-1">Total Waste Today</p>
                <p className="text-5xl md:text-6xl xl:text-7xl font-extrabold leading-none">
                  {totalWaste.toFixed(1)}
                  <span className="text-xl md:text-2xl xl:text-3xl opacity-70 ml-2 font-semibold">kg</span>
                </p>
              </div>
              <div className="opacity-20">
                <Activity className="w-16 h-16 md:w-20 md:h-20" />
              </div>
            </div>
            <div className="mt-3 flex items-center gap-1.5 bg-white/20 rounded-lg py-1.5 px-3 w-fit backdrop-blur-sm">
              <TrendingUp className="w-3.5 h-3.5" />
              <span className="text-[11px] md:text-xs">Refreshes every 30s</span>
            </div>
          </div>

          {/* Pie Chart — fills remaining left space */}
          <div className="bg-white dark:bg-card rounded-2xl p-4 shadow-md border border-green-100 dark:border-border flex flex-col flex-1 min-h-0">
            <div className="flex items-center gap-2 mb-2 flex-shrink-0">
              <div className="bg-green-100 dark:bg-green-900/30 p-1.5 rounded-lg">
                <Activity className="w-3.5 h-3.5 text-[#1E8449] dark:text-green-400" />
              </div>
              <h3 className="font-semibold text-sm md:text-base text-gray-900 dark:text-white">Today's Distribution</h3>
            </div>
            <div className="flex-1 min-h-0">
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      labelLine={true}
                      label={({ name, percent, cx, cy, midAngle, outerRadius }) => {
                        const RADIAN = Math.PI / 180;
                        const radius = outerRadius + 16;
                        const x = cx + radius * Math.cos(-midAngle * RADIAN);
                        const y = cy + radius * Math.sin(-midAngle * RADIAN);
                        return (
                          <text x={x} y={y} fill="#6B7280" textAnchor={x > cx ? "start" : "end"} dominantBaseline="central" fontSize={11}>
                            {`${name.split(" ")[0]}: ${(percent * 100).toFixed(0)}%`}
                          </text>
                        );
                      }}
                      outerRadius="40%"
                      dataKey="value"
                    >
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-400 text-sm">No waste logged today</div>
              )}
            </div>
          </div>
        </div>

        {/* Right column on tablet: Weekly + Monthly + Breakdown */}
        <div className="flex flex-col gap-3 min-h-0">

          {/* Mess Breakdown */}
          <div className="bg-white dark:bg-card rounded-2xl p-4 shadow-md border border-green-100 dark:border-border flex flex-col flex-shrink-0">
            <div className="flex items-center gap-2 mb-3">
              <div className="bg-green-100 dark:bg-green-900/30 p-1.5 rounded-lg">
                <BarChart2 className="w-3.5 h-3.5 text-[#1E8449] dark:text-green-400" />
              </div>
              <h3 className="font-semibold text-sm md:text-base text-gray-900 dark:text-white">Mess Breakdown</h3>
              <span className="ml-auto text-[10px] text-gray-400">Today</span>
            </div>
            <div className="space-y-2">
              {messBreakdown.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-2">No data yet</p>
              ) : (
                messBreakdown.map((mess) => {
                  const pct = totalWaste > 0 ? ((mess.value / totalWaste) * 100).toFixed(1) : "0.0";
                  return (
                    <div key={mess.name} className="space-y-1">
                      <div className="flex items-center justify-between text-xs md:text-sm">
                        <div className="flex items-center gap-1.5">
                          <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: mess.color }} />
                          <span className="text-gray-700 dark:text-gray-300 truncate max-w-[110px] md:max-w-[150px]">{mess.name}</span>
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <span className="font-bold text-gray-900 dark:text-white">{mess.value} kg</span>
                          <span className="text-[10px] text-gray-400">({pct}%)</span>
                        </div>
                      </div>
                      <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-1.5 overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, backgroundColor: mess.color }} />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Weekly Bar — fills half of right remaining */}
          <div className="bg-white dark:bg-card rounded-2xl p-4 shadow-md border border-green-100 dark:border-border flex flex-col flex-1 min-h-0">
            <div className="flex items-center gap-2 mb-2 flex-shrink-0">
              <div className="bg-green-100 dark:bg-green-900/30 p-1.5 rounded-lg">
                <BarChart2 className="w-3.5 h-3.5 text-[#1E8449] dark:text-green-400" />
              </div>
              <h3 className="font-semibold text-sm md:text-base text-gray-900 dark:text-white">Weekly Overview</h3>
              <span className="ml-auto text-[10px] text-gray-400">Last 7 days</span>
            </div>
            <div className="flex-1 min-h-0">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyData} barSize={22} margin={{ top: 4, right: 8, left: -18, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F0FDF4" vertical={false} />
                  <XAxis dataKey="day" tick={{ fontSize: 11, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: "#9CA3AF" }} axisLine={false} tickLine={false} unit="kg" />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: "#F0FDF4" }} />
                  <Bar dataKey="total" radius={[5, 5, 0, 0]}>
                    {weeklyData.map((entry, index) => (
                      <Cell key={`week-${index}`} fill={entry.isToday ? "#1E8449" : "#A7F3D0"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}