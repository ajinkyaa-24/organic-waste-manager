import { useState } from "react";
import { FileText, Download, Database, FileDown } from "lucide-react";
import { supabase } from "../../lib/supabaseClient";
import { toast } from "sonner";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

type ReportType = "waste" | "fertilizer";

export function ReportsPage() {
  const [reportType, setReportType] = useState<ReportType>("waste");
  
  // Date range selectors (YYYY-MM-DD format)
  const getInitialStartDate = () => {
    const d = new Date();
    d.setDate(d.getDate() - 7); // Default to 7 days ago
    return d.toISOString().split("T")[0];
  };
  const getInitialEndDate = () => {
    return new Date().toISOString().split("T")[0];
  };

  const [startDate, setStartDate] = useState(getInitialStartDate());
  const [endDate, setEndDate] = useState(getInitialEndDate());
  const [downloading, setDownloading] = useState<"csv" | "pdf" | null>(null);

  // Helper date labels for report headers & files
  const formatDateLabel = (dateStr: string) => {
    if (!dateStr) return "";
    const [year, month, day] = dateStr.split("-").map(Number);
    const d = new Date(year, month - 1, day);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  const formatDateToISO = (dateInput: string | Date) => {
    const d = new Date(dateInput);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const startDateLabel = formatDateLabel(startDate);
  const endDateLabel = formatDateLabel(endDate);

  const calculateDurationDays = () => {
    const s = new Date(startDate);
    const e = new Date(endDate);
    const diff = e.getTime() - s.getTime();
    if (diff < 0) return 0;
    return Math.ceil(diff / (1000 * 60 * 60 * 24)) + 1;
  };

  const rangeDays = calculateDurationDays();

  // ─── Fetch full data with user info ────────────────────────────────────────
  const fetchData = async () => {
    // Convert YYYY-MM-DD local dates to ISO strings in UTC
    const startISO = new Date(`${startDate}T00:00:00`).toISOString();
    const endISO = new Date(`${endDate}T23:59:59.999`).toISOString();

    if (reportType === "waste") {
      const { data, error } = await supabase
        .from("waste_entries")
        .select("created_at, mess, waste, created_by")
        .gte("created_at", startISO)
        .lte("created_at", endISO)
        .order("created_at", { ascending: true });

      if (error) throw new Error(error.message);

      // Fetch user profiles for created_by IDs
      const userIds = [...new Set((data || []).map((r) => r.created_by).filter(Boolean))];
      const profileMap: Record<string, string> = {};
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, username, email")
          .in("id", userIds);
        (profiles || []).forEach((p) => {
          profileMap[p.id] = p.username || p.email || "Unknown";
        });
      }

      return (data || []).map((row) => ({
        date: formatDateToISO(row.created_at),
        time: new Date(row.created_at).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
        messName: row.mess || "—",
        amount: Number(row.waste),
        loggedBy: profileMap[row.created_by] || "—",
      }));
    } else {
      const { data, error } = await supabase
        .from("fertilizer_entries")
        .select("created_at, amount, created_by")
        .gte("created_at", startISO)
        .lte("created_at", endISO)
        .order("created_at", { ascending: true });

      if (error) throw new Error(error.message);

      const userIds = [...new Set((data || []).map((r) => r.created_by).filter(Boolean))];
      const profileMap: Record<string, string> = {};
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, username, email")
          .in("id", userIds);
        (profiles || []).forEach((p) => {
          profileMap[p.id] = p.username || p.email || "Unknown";
        });
      }

      return (data || []).map((row) => ({
        date: formatDateToISO(row.created_at),
        time: new Date(row.created_at).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
        messName: "Fertilizer Production",
        amount: Number(row.amount),
        loggedBy: profileMap[row.created_by] || "—",
      }));
    }
  };

  // ─── CSV Download ─────────────────────────────────────────────────────────
  const handleExportCSV = async () => {
    setDownloading("csv");
    try {
      const rows = await fetchData();
      const totalAmount = rows.reduce((s, r) => s + r.amount, 0);
      const reportTitle = reportType === "waste" ? "Organic Waste Log Report" : "Fertilizer Production Report";
      const generatedOn = new Date().toLocaleString("en-US", { dateStyle: "full", timeStyle: "short" });

      let csv = "";
      // Column headers
      const headers = [
        "Date",
        "Time",
        reportType === "waste" ? "Mess Name" : "Source",
        reportType === "waste" ? "Waste Generated (kg)" : "Fertilizer Produced (kg)",
        "Logged By",
        "Downloaded On",
        "Selected Period"
      ];
      csv += headers.map(h => `"${h}"`).join(",") + "\n";

      // Rows
      rows.forEach((row) => {
        const rowData = [
          row.date,
          row.time,
          row.messName,
          row.amount.toFixed(2),
          row.loggedBy,
          generatedOn,
          `${startDateLabel} to ${endDateLabel} (${rangeDays} days)`
        ];
        csv += rowData.map(v => `"${v.replace(/"/g, '""')}"`).join(",") + "\n";
      });

      // Summary footer at end of sheet
      const totalLabel = reportType === "waste" ? "Total Waste Generated" : "Total Fertilizer Produced";
      const totalRow = [
        totalLabel,
        "",
        "",
        totalAmount.toFixed(2),
        "",
        "",
        ""
      ];
      csv += totalRow.map(v => v === "" ? "" : `"${v.replace(/"/g, '""')}"`).join(",") + "\n";

      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `${reportType}_report_${rangeDays}d_${Date.now()}.csv`);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("CSV downloaded successfully!");
    } catch (err: any) {
      toast.error(err.message || "Failed to export CSV");
    } finally {
      setDownloading(null);
    }
  };

  // ─── PDF Download ─────────────────────────────────────────────────────────
  const handleExportPDF = async () => {
    setDownloading("pdf");
    try {
      const rows = await fetchData();
      const totalAmount = rows.reduce((s, r) => s + r.amount, 0);
      const reportTitle = reportType === "waste" ? "Organic Waste Log Report" : "Fertilizer Production Report";
      const generatedOn = new Date().toLocaleString("en-US", { dateStyle: "full", timeStyle: "short" });

      // Load header logo image
      const loadImage = (src: string): Promise<HTMLImageElement> => {
        return new Promise((resolve, reject) => {
          const img = new Image();
          img.onload = () => resolve(img);
          img.onerror = (e) => reject(e);
          img.src = src;
        });
      };

      let logoImg: HTMLImageElement | null = null;
      try {
        logoImg = await loadImage("/logo_header.png");
      } catch (err) {
        console.error("Failed to load header logo:", err);
      }

      const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const brandGreen: [number, number, number] = [30, 132, 73]; // #1E8449

      // ── Header bar ──
      doc.setFillColor(...brandGreen);
      doc.rect(0, 0, 210, 32, "F");

      // Render logo on the right corner of the header bar if loaded successfully
      if (logoImg) {
        const aspectRatio = logoImg.width / logoImg.height;
        const logoHeight = 20; // set standard height
        const logoWidth = logoHeight * aspectRatio;
        
        const padding = 1.5; // 1.5mm padding around the logo
        const boxWidth = logoWidth + padding * 2;
        const boxHeight = logoHeight + padding * 2;
        const boxX = 196 - boxWidth; // align right edge to 14mm margin
        const boxY = (32 - boxHeight) / 2; // vertically centered in 32mm header
        
        // Draw white background card for the logo
        doc.setFillColor(255, 255, 255);
        doc.rect(boxX, boxY, boxWidth, boxHeight, "F");
        
        // Draw logo centered inside the white box
        const logoX = boxX + padding;
        const logoY = boxY + padding;
        doc.addImage(logoImg, "PNG", logoX, logoY, logoWidth, logoHeight);
      }

      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(16);
      doc.text(reportTitle, 14, 12);
      
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(220, 245, 225); // Premium soft green color for metadata
      doc.text(`Period: ${startDateLabel} to ${endDateLabel} (${rangeDays} days)`, 14, 20);
      doc.text(`Downloaded On: ${generatedOn}`, 14, 27);

      // ── Summary stats ──
      doc.setTextColor(30, 30, 30);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.text("Summary", 14, 42);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(80, 80, 80);
      doc.text(`Total Entries: ${rows.length}`, 14, 49);
      doc.text(`Total ${reportType === "waste" ? "Waste" : "Fertilizer"}: ${totalAmount.toFixed(2)} kg`, 80, 49);
      doc.text(`Report Type: ${reportType === "waste" ? "Waste Entries" : "Fertilizer Entries"}`, 150, 49);

      // ── Table ──
      autoTable(doc, {
        startY: 56,
        head: [[
          "Sr.",
          "Date",
          "Time",
          reportType === "waste" ? "Mess Name" : "Source",
          reportType === "waste" ? "Waste Generated" : "Fertilizer Produced",
          "Logged By"
        ]],
        body: rows.map((row, i) => [
          i + 1,
          row.date,
          row.time,
          row.messName,
          row.amount.toFixed(2),
          row.loggedBy,
        ]),
        foot: [
          [
            {
              content: reportType === "waste" ? "Total Waste Generated" : "Total Fertilizer Produced",
              colSpan: 4,
              styles: { halign: "right", fontStyle: "bold" }
            },
            { content: `${totalAmount.toFixed(2)} kg`, styles: { fontStyle: "bold" } },
            { content: `${rows.length} entries`, styles: { fontStyle: "bold" } },
          ],
        ],
        showFoot: "lastPage",
        headStyles: {
          fillColor: brandGreen,
          textColor: [255, 255, 255],
          fontStyle: "bold",
          fontSize: 9,
        },
        footStyles: {
          fillColor: [235, 252, 240],
          textColor: [30, 132, 73],
          fontSize: 9,
        },
        alternateRowStyles: { fillColor: [248, 255, 251] },
        bodyStyles: { fontSize: 8.5, textColor: [40, 40, 40] },
        columnStyles: {
          0: { cellWidth: 10, halign: "center" },
          1: { cellWidth: 28 },
          2: { cellWidth: 20 },
          3: { cellWidth: 45 },
          4: { cellWidth: 35, halign: "right" },
          5: { cellWidth: 42 },
        },
        margin: { left: 14, right: 14 },
      });

      // ── Footer on each page ──
      const pageCount = (doc as any).internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(7);
        doc.setTextColor(160, 160, 160);
        doc.text(
          `Organic Waste Management System  |  Page ${i} of ${pageCount}`,
          105,
          290,
          { align: "center" }
        );
      }

      doc.save(`${reportType}_report_${rangeDays}d_${Date.now()}.pdf`);
      toast.success("PDF downloaded successfully!");
    } catch (err: any) {
      toast.error(err.message || "Failed to export PDF");
    } finally {
      setDownloading(null);
    }
  };

  return (
    <div className="p-5 space-y-5">
      {/* Header Card */}
      <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 rounded-2xl p-6 shadow-md border border-green-100 dark:border-border flex items-center gap-4">
        <div className="bg-[#1E8449] p-4 rounded-2xl text-white">
          <FileText className="w-10 h-10" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Reports</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">Export waste logs & production stats</p>
        </div>
      </div>

      {/* Configuration Card */}
      <div className="bg-white dark:bg-card rounded-2xl p-6 shadow-md border border-green-100 dark:border-border space-y-6">

        {/* Data Source */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">Data Source</label>
          <div className="flex gap-2 bg-gray-100 dark:bg-gray-900/50 p-1 rounded-xl shadow-inner">
            <button
              onClick={() => setReportType("waste")}
              className={`flex-1 py-2 rounded-lg font-medium text-xs transition-all flex justify-center items-center gap-1.5 ${
                reportType === "waste" ? "bg-white dark:bg-gray-800 text-[#166534] dark:text-green-400 shadow-sm" : "text-gray-500 dark:text-gray-400"
              }`}
            >
              <Database className="w-3.5 h-3.5" />
              Waste Log
            </button>
            <button
              onClick={() => setReportType("fertilizer")}
              className={`flex-1 py-2 rounded-lg font-medium text-xs transition-all flex justify-center items-center gap-1.5 ${
                reportType === "fertilizer" ? "bg-white dark:bg-gray-800 text-[#166534] dark:text-green-400 shadow-sm" : "text-gray-500 dark:text-gray-400"
              }`}
            >
              <Database className="w-3.5 h-3.5" />
              Fertilizer Log
            </button>
          </div>
        </div>

        {/* Date Range Selector */}
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">From Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full h-11 px-3 border border-gray-200 dark:border-border rounded-xl focus:ring-2 focus:ring-[#1E8449] bg-gray-50/50 dark:bg-gray-900/30 text-sm font-medium text-gray-700 dark:text-gray-300"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">To Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full h-11 px-3 border border-gray-200 dark:border-border rounded-xl focus:ring-2 focus:ring-[#1E8449] bg-gray-50/50 dark:bg-gray-900/30 text-sm font-medium text-gray-700 dark:text-gray-300"
              />
            </div>
          </div>

          {/* Date range info bar */}
          <div className="flex items-center justify-center bg-gray-50 dark:bg-gray-900/30 rounded-xl px-4 py-3 border border-gray-100 dark:border-border text-center">
            <div>
              <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-0.5">Duration</p>
              <p className="text-xs font-bold text-[#1E8449] dark:text-green-400">{rangeDays} days</p>
            </div>
          </div>
        </div>



        {/* Download Buttons */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={handleExportCSV}
            disabled={downloading !== null}
            className="flex items-center justify-center gap-2 py-3 rounded-xl bg-[#1E8449] hover:bg-[#166534] text-white font-semibold text-sm transition-all shadow-md disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            {downloading === "csv" ? "Exporting..." : "CSV"}
          </button>
          <button
            onClick={handleExportPDF}
            disabled={downloading !== null}
            className="flex items-center justify-center gap-2 py-3 rounded-xl bg-white dark:bg-card hover:bg-gray-50 dark:hover:bg-gray-800 text-[#1E8449] dark:text-green-400 font-semibold text-sm border-2 border-[#1E8449] transition-all disabled:opacity-50"
          >
            <FileDown className="w-4 h-4" />
            {downloading === "pdf" ? "Exporting..." : "PDF"}
          </button>
        </div>
      </div>
    </div>
  );
}
