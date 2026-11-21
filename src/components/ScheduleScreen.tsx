"use client";

import React, { useState, useEffect } from "react";
import {
  CalendarDays,
  Calendar,
  Sparkles,
  Sun,
  Sunset,
  Moon,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Download,
  BarChart3,
  Percent,
  TrendingUp,
  FileSpreadsheet,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Info,
  Coffee,
  Heart,
  Plane,
  Home,
  Check,
  Edit2,
  RotateCcw,
} from "lucide-react";
import { ExtraLog, PayPeriod, PeriodSummary, ShiftCounts } from "@/types";
import { formatBaht, formatThaiDate, estimateThaiTax, computePeriodInfo } from "@/lib/calculations";
import { THAI_MONTH_SHORT } from "@/lib/constants";
import { openExternalUrl } from "@/lib/liff";

interface ScheduleScreenProps {
  period: PayPeriod;
  summary: PeriodSummary;
  historySummary: {
    periodKey: string;
    labelTh: string;
    hospitalSlip: number;
    directIncome: number;
    totalIncome: number;
    isMatched: boolean;
  }[];
  allPeriodsForExport: any[];
  allLogsForExport: any[];
  userName: string;
  onBackToDashboard?: () => void;
}

export type ShiftTypeTag = "OFF" | "M" | "A" | "N" | "DOUBLE" | "QUICK" | "SPLIT";

export interface DayScheduleItem {
  dateStr: string; // YYYY-MM-DD
  dayNum: number;
  monthNum: number;
  yearNum: number;
  dayOfWeekThai: string;
  isWeekend: boolean;
  shiftType: ShiftTypeTag;
  label: string;
  note?: string;
}

const SHIFT_OPTIONS: {
  type: ShiftTypeTag;
  label: string;
  badgeClass: string;
  icon: string;
  desc: string;
  hours: number;
}[] = [
  {
    type: "OFF",
    label: "🌿 OFF",
    icon: "🌿",
    badgeClass: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/90 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700",
    desc: "วันหยุดพักผ่อน ชาร์จพลัง",
    hours: 0,
  },
  {
    type: "M",
    label: "เช้า (ช.)",
    icon: "🌅",
    badgeClass: "bg-sky-100 text-sky-800 dark:bg-sky-950/80 dark:text-sky-300 border-sky-300 dark:border-sky-800",
    desc: "08:00 - 16:00 (8 ชม.)",
    hours: 8,
  },
  {
    type: "A",
    label: "บ่าย (บ.)",
    icon: "☀️",
    badgeClass: "bg-amber-100 text-amber-900 dark:bg-amber-950/80 dark:text-amber-300 border-amber-300 dark:border-amber-800",
    desc: "16:00 - 24:00 (8 ชม.)",
    hours: 8,
  },
  {
    type: "N",
    label: "ดึก (ด.)",
    icon: "🌙",
    badgeClass: "bg-indigo-100 text-indigo-900 dark:bg-indigo-950/80 dark:text-indigo-300 border-indigo-300 dark:border-indigo-800",
    desc: "24:00 - 08:00 (8 ชม.)",
    hours: 8,
  },
  {
    type: "DOUBLE",
    label: "ควง 16h",
    icon: "⚡",
    badgeClass: "bg-rose-100 text-rose-900 dark:bg-rose-950/80 dark:text-rose-300 border-rose-300 dark:border-rose-800",
    desc: "เวรควง 16 ชม. ติด (ช.+บ. หรือ บ.+ด.)",
    hours: 16,
  },
  {
    type: "SPLIT",
    label: "ช.➔OT-ด.",
    icon: "🌙",
    badgeClass: "bg-purple-100 text-purple-900 dark:bg-purple-950/80 dark:text-purple-300 border-purple-300 dark:border-purple-800",
    desc: "เช้าแล้วต่อ OT ดึก (ช. 08-16 น. + OT ดึก 24-08 น.)",
    hours: 16,
  },
  {
    type: "QUICK",
    label: "บ.➔ช.",
    icon: "⚠️",
    badgeClass: "bg-orange-100 text-orange-900 dark:bg-orange-950/80 dark:text-orange-300 border-orange-300 dark:border-orange-800",
    desc: "บ่ายต่อเช้า (นอน 4.5 ชม.)",
    hours: 16,
  },
];

export const ScheduleScreen: React.FC<ScheduleScreenProps> = ({
  period,
  summary,
  historySummary,
  allPeriodsForExport,
  allLogsForExport,
  userName,
  onBackToDashboard,
}) => {
  const [scheduleDays, setScheduleDays] = useState<DayScheduleItem[]>([]);
  const [selectedDay, setSelectedDay] = useState<DayScheduleItem | null>(null);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [chartRange, setChartRange] = useState<"6m" | "12m">("12m");
  const [dayNoteInput, setDayNoteInput] = useState<string>("");

  const periodInfo = computePeriodInfo(
    period.period_key,
    summary.settings.cutoff_start_day,
    summary.settings.payout_month_offset
  );

  const THAI_DAYS = ["อา.", "จ.", "อ.", "พ.", "พฤ.", "ศ.", "ส."];

  // Initialize schedule days for period start_date -> end_date
  useEffect(() => {
    const storageKey = `nursepay_schedule_${period.period_key}`;
    const saved = localStorage.getItem(storageKey);

    const start = new Date(period.start_date);
    const end = new Date(period.end_date);

    const validStart = isNaN(start.getTime()) ? new Date(2026, 10, 21) : start;
    const validEnd = isNaN(end.getTime()) ? new Date(2026, 11, 20) : end;

    const days: DayScheduleItem[] = [];
    const curr = new Date(validStart);

    let dayIndex = 0;
    while (curr <= validEnd) {
      const y = curr.getFullYear();
      const m = curr.getMonth() + 1;
      const d = curr.getDate();
      const dateStr = `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      const dayOfWeek = curr.getDay();

      // Realistic nurse rota distribution based on weekly rhythm
      let defaultShift: ShiftTypeTag = "OFF";
      if (dayIndex % 7 === 0 || dayIndex % 7 === 1) {
        defaultShift = "M"; // เช้า 2 วัน
      } else if (dayIndex % 7 === 2) {
        defaultShift = "A"; // บ่าย
      } else if (dayIndex % 7 === 3) {
        defaultShift = "QUICK"; // บ่ายต่อเช้า
      } else if (dayIndex % 7 === 4) {
        defaultShift = "N"; // ดึก
      } else {
        defaultShift = "OFF"; // วันหยุด 2 วัน (วันพักผ่อน)
      }

      days.push({
        dateStr,
        dayNum: d,
        monthNum: m,
        yearNum: y,
        dayOfWeekThai: THAI_DAYS[dayOfWeek],
        isWeekend: dayOfWeek === 0 || dayOfWeek === 6,
        shiftType: defaultShift,
        label: SHIFT_OPTIONS.find((s) => s.type === defaultShift)?.label || "OFF",
        note: "",
      });

      curr.setDate(curr.getDate() + 1);
      dayIndex++;
    }

    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length === days.length) {
          setScheduleDays(parsed);
          return;
        }
      } catch (e) {
        console.error("Error reading saved schedule", e);
      }
    }

    setScheduleDays(days);
  }, [period.id, period.period_key, period.start_date, period.end_date]);

  const handleUpdateShiftType = (dateStr: string, newType: ShiftTypeTag, note?: string) => {
    const nextDays = scheduleDays.map((item) => {
      if (item.dateStr === dateStr) {
        const option = SHIFT_OPTIONS.find((s) => s.type === newType);
        return {
          ...item,
          shiftType: newType,
          label: option?.label || newType,
          note: note !== undefined ? note : item.note,
        };
      }
      return item;
    });

    setScheduleDays(nextDays);
    localStorage.setItem(`nursepay_schedule_${period.period_key}`, JSON.stringify(nextDays));
    if (selectedDay && selectedDay.dateStr === dateStr) {
      const updated = nextDays.find((d) => d.dateStr === dateStr);
      setSelectedDay(updated || null);
    }
  };

  const handleSaveDayNote = (dateStr: string, noteText: string) => {
    if (!selectedDay) return;
    handleUpdateShiftType(dateStr, selectedDay.shiftType, noteText);
  };

  // -------------------------------------------------------------
  // ADVANCED STREAK & OFF-DAY ANALYSIS (ตอบโจทย์ Pain Point จริง!)
  // -------------------------------------------------------------
  const totalDays = scheduleDays.length;
  const offDays = scheduleDays.filter((d) => d.shiftType === "OFF").length;
  const workDays = totalDays - offDays;
  const doubleShifts = scheduleDays.filter((d) => d.shiftType === "DOUBLE").length;
  const quickTurnarounds = scheduleDays.filter((d) => d.shiftType === "QUICK").length;

  // 1. Calculate Maximum Consecutive Work Shifts
  let maxWorkStreak = 0;
  let currentWorkStreak = 0;
  scheduleDays.forEach((d) => {
    if (d.shiftType !== "OFF") {
      currentWorkStreak++;
      if (currentWorkStreak > maxWorkStreak) maxWorkStreak = currentWorkStreak;
    } else {
      currentWorkStreak = 0;
    }
  });

  // 2. Identify Golden Off Blocks (ช่วงวันหยุดติดกัน >= 2 วัน)
  interface OffBlock {
    startDateStr: string;
    endDateStr: string;
    length: number;
    daysThai: string;
  }
  const goldenOffBlocks: OffBlock[] = [];
  let tempBlock: DayScheduleItem[] = [];

  scheduleDays.forEach((d, idx) => {
    if (d.shiftType === "OFF") {
      tempBlock.push(d);
    } else {
      if (tempBlock.length >= 2) {
        const first = tempBlock[0];
        const last = tempBlock[tempBlock.length - 1];
        goldenOffBlocks.push({
          startDateStr: first.dateStr,
          endDateStr: last.dateStr,
          length: tempBlock.length,
          daysThai: `${first.dayOfWeekThai} ${first.dayNum} - ${last.dayOfWeekThai} ${last.dayNum}`,
        });
      }
      tempBlock = [];
    }
    // Handle tail
    if (idx === scheduleDays.length - 1 && tempBlock.length >= 2) {
      const first = tempBlock[0];
      const last = tempBlock[tempBlock.length - 1];
      goldenOffBlocks.push({
        startDateStr: first.dateStr,
        endDateStr: last.dateStr,
        length: tempBlock.length,
        daysThai: `${first.dayOfWeekThai} ${first.dayNum} - ${last.dayOfWeekThai} ${last.dayNum}`,
      });
    }
  });

  // 3. Countdown to Next Off Day (คำนวณวันหยุดที่ใกล้ที่สุด)
  // Find current day or first upcoming Off
  const todayStr = new Date().toISOString().split("T")[0];
  let daysUntilNextOff: number | null = null;
  let nextOffDateObj: DayScheduleItem | null = null;

  const todayIndex = scheduleDays.findIndex((d) => d.dateStr === todayStr);
  const searchStartIndex = todayIndex >= 0 ? todayIndex : 0;

  for (let i = searchStartIndex; i < scheduleDays.length; i++) {
    if (scheduleDays[i].shiftType === "OFF") {
      daysUntilNextOff = i - searchStartIndex;
      nextOffDateObj = scheduleDays[i];
      break;
    }
  }

  // Annual Tax Calculation
  const currentYear = period.period_key.split("-")[0];
  const yearHistory = historySummary.filter((h) => h.periodKey.startsWith(currentYear));
  const annualGross = yearHistory.reduce((sum, h) => sum + h.totalIncome, 0);
  const tax = estimateThaiTax(annualGross);

  const handleExportExcel = async (exportAll: boolean = false) => {
    try {
      setIsExporting(true);
      const res = await fetch("/api/export-excel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          periods: exportAll ? allPeriodsForExport : [
            {
              period_key: summary.period.period_key,
              periodLabel: `รอบ ${summary.period.period_key}`,
              shiftRange: `${formatThaiDate(summary.period.start_date, false)} - ${formatThaiDate(summary.period.end_date, true)}`,
              counts: summary.period.shift_counts,
              expectedHospitalSlip: summary.expectedHospitalSlip,
              actualSlipAmount: summary.actualSlipAmount,
              deltaSlip: summary.deltaSlip,
              slipStatusLabel:
                summary.slipStatus === "MATCHED"
                  ? "ยอดตรงครบถ้วน"
                  : summary.slipStatus === "DISCREPANCY"
                  ? `ขาด ${formatBaht(Math.abs(summary.deltaSlip))} บ.`
                  : summary.slipStatus === "OVERPAID"
                  ? `เกิน +${formatBaht(summary.deltaSlip)} บ.`
                  : "รอตรวจสลิป",
              directIncome: summary.directTotalSum,
              grandTotal: summary.grandTotal,
              reconcile_note: summary.period.reconcile_note,
            },
          ],
          logs: exportAll ? allLogsForExport : summary.extraLogs,
          userName,
          periodKey: exportAll ? "all" : summary.period.period_key,
        }),
      });

      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const filename = `สรุปตารางเวร_${userName}_${exportAll ? "ทั้งปี" : summary.period.period_key}.xlsx`;
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (err) {
      console.error(err);
      alert("ไม่สามารถสร้างไฟล์ Excel ได้ กรุณาลองใหม่อีกครั้ง");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="pb-28 pt-2 px-4 space-y-3.5 animate-in fade-in duration-200">
      {/* Title Bar */}
      <div className="bg-white dark:bg-[#0e1726] rounded-2xl p-4 border border-sky-100 dark:border-sky-900 shadow-2xs flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-sky-50 dark:bg-sky-950/80 border border-sky-100 dark:border-sky-800/60 flex items-center justify-center text-sky-600 dark:text-sky-400">
            <CalendarDays className="w-5 h-5" strokeWidth={2.2} />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                ปฏิทินตรวจนับวันหยุด (Off-Day Planner)
              </h2>
              <span className="text-[10px] font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-200/60 dark:border-emerald-800">
                {offDays} วันหยุด
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              เช็ครอบเวร นับวันหยุดพักผ่อน และวางแผนชาร์จพลังชีวิต
            </p>
          </div>
        </div>

        {onBackToDashboard && (
          <button
            onClick={onBackToDashboard}
            className="h-8 px-2.5 rounded-lg bg-sky-50 dark:bg-slate-800 hover:bg-sky-100 text-sky-800 dark:text-sky-300 text-xs font-medium border border-sky-200/80 dark:border-slate-700 active:scale-95 transition-all flex items-center gap-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>กลับสรุปเงิน</span>
          </button>
        )}
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 1. HERO EMOTIONAL CARD: "อีกกี่วันจะได้หยุด (Off Countdown)?" */}
      {/* ------------------------------------------------------------- */}
      <div className="bg-gradient-to-br from-white via-emerald-50/40 to-white dark:from-[#0e1726] dark:via-[#10241f] dark:to-[#0e1726] rounded-2xl p-4 border border-emerald-200/70 dark:border-emerald-900/60 shadow-2xs">
        <div className="flex items-start justify-between gap-2 mb-2.5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-100/80 dark:bg-emerald-900/60 flex items-center justify-center text-emerald-700 dark:text-emerald-300">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-wide">
                นับถอยหลังสู่วันพักผ่อน (Rest Countdown)
              </span>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 leading-tight">
                {daysUntilNextOff === 0 ? (
                  <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    🎉 วันนี้เป็นวัน OFF ของคุณ!
                  </span>
                ) : daysUntilNextOff !== null ? (
                  <span>
                    อีก <strong className="text-emerald-600 dark:text-emerald-400 font-extrabold text-base underline">{daysUntilNextOff} วัน</strong> จะได้หยุดพัก (วัน Off)
                  </span>
                ) : (
                  <span>รอบนี้ขึ้นเวรเต็มที่</span>
                )}
              </h3>
            </div>
          </div>

          <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-100/70 dark:bg-emerald-950/80 px-2.5 py-1 rounded-xl border border-emerald-200 dark:border-emerald-800">
            {offDays} วันหยุด / {totalDays} วัน
          </span>
        </div>

        {/* Empathy Rest Banner */}
        <div className="p-3 bg-white/90 dark:bg-[#121e2d] border border-emerald-100 dark:border-slate-800 rounded-xl mb-3 text-xs leading-relaxed text-slate-700 dark:text-slate-300">
          {daysUntilNextOff === 0 ? (
            <p>
              🌟 วันนี้เป็นวันหยุดพักผ่อนของคุณ ปิดสวิตช์เรื่องงาน นอนหลับให้เต็มอิ่ม และทานของอร่อยให้รางวัลตัวเองนะคนเก่ง!
            </p>
          ) : nextOffDateObj ? (
            <p>
              สัปดาห์นี้ขึ้นเวรติดกัน {maxWorkStreak} วัน ➔ วันพักผ่อนถัดไปคือ{" "}
              <strong className="text-emerald-700 dark:text-emerald-400 font-bold">
                {nextOffDateObj.dayOfWeekThai}ที่ {nextOffDateObj.dayNum} {THAI_MONTH_SHORT[nextOffDateObj.monthNum - 1]}
              </strong>{" "}
              (เหลืออีก {daysUntilNextOff} วัน อดทนอีกนิดนะคนเก่งของวอร์ด! 🌿)
            </p>
          ) : (
            <p>คุณขึ้นเวรเต็มที่ในวิกนี้ อย่าลืมจัดสรรเวลานอนหลับให้ครบถ้วนเพื่อรักษาสุขภาพนะ</p>
          )}
        </div>

        {/* 4 Stats Grid */}
        <div className="grid grid-cols-4 gap-2 text-center">
          <div className="bg-emerald-50/70 dark:bg-emerald-950/30 p-2 rounded-xl border border-emerald-200/60 dark:border-emerald-900/40">
            <span className="text-[10px] text-emerald-800 dark:text-emerald-400 block font-medium">วันหยุด (OFF)</span>
            <span className="text-lg font-extrabold text-emerald-700 dark:text-emerald-300 tabular-nums">
              {offDays}
            </span>
            <span className="text-[10px] text-slate-400 block">วัน</span>
          </div>

          <div className="bg-white dark:bg-slate-900/80 p-2 rounded-xl border border-sky-100 dark:border-slate-800">
            <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-medium">วันขึ้นเวร</span>
            <span className="text-lg font-extrabold text-slate-900 dark:text-slate-100 tabular-nums">
              {workDays}
            </span>
            <span className="text-[10px] text-slate-400 block">วัน</span>
          </div>

          <div className="bg-white dark:bg-slate-900/80 p-2 rounded-xl border border-sky-100 dark:border-slate-800">
            <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-medium">เวรติดกันสุด</span>
            <span className="text-lg font-extrabold text-amber-600 dark:text-amber-400 tabular-nums">
              {maxWorkStreak}
            </span>
            <span className="text-[10px] text-slate-400 block">วันติด</span>
          </div>

          <div className="bg-white dark:bg-slate-900/80 p-2 rounded-xl border border-sky-100 dark:border-slate-800">
            <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-medium">เวรเสี่ยง/ควง</span>
            <span className="text-lg font-extrabold text-rose-600 dark:text-rose-400 tabular-nums">
              {doubleShifts + quickTurnarounds}
            </span>
            <span className="text-[10px] text-slate-400 block">ครั้ง</span>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 2. GOLDEN OFF BLOCKS: "วางแผนหยุดยาว & นัดเจอเพื่อน (Trip Planner)" */}
      {/* ------------------------------------------------------------- */}
      {goldenOffBlocks.length > 0 && (
        <div className="bg-white dark:bg-[#0e1726] rounded-2xl p-4 border border-sky-100 dark:border-sky-900 shadow-2xs space-y-2.5">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-900/60 flex items-center justify-center text-emerald-700 dark:text-emerald-300">
              <Plane className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                โอกาสหยุดพักผ่อนยาวในรอบนี้ (Golden Off Blocks)
              </h4>
              <p className="text-[10px] text-slate-500">พบช่วงวันหยุดติดกัน 2 วันขึ้นไป เหมาะสำหรับวางแผนเที่ยวหรือพักฟื้น</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
            {goldenOffBlocks.map((block, idx) => (
              <div
                key={idx}
                className="p-3 rounded-xl bg-gradient-to-r from-emerald-50/80 to-teal-50/60 dark:from-emerald-950/30 dark:to-teal-950/20 border border-emerald-200/80 dark:border-emerald-800/60 flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-emerald-500 text-white font-extrabold flex items-center justify-center text-xs shadow-xs">
                    +{block.length}
                  </div>
                  <div>
                    <span className="font-bold text-emerald-950 dark:text-emerald-200 block">
                      หยุดยาว {block.length} วันติด ({block.daysThai})
                    </span>
                    <span className="text-[10px] text-emerald-700 dark:text-emerald-400 block">
                      แนะนำ: ล็อคคิวจองตั๋วกลับบ้าน / นัดเจอเพื่อนได้เลย! 🌸
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 3. MINIMALIST INTERACTIVE SHIFT CALENDAR GRID */}
      {/* ------------------------------------------------------------- */}
      <div className="bg-white dark:bg-[#0e1726] rounded-2xl p-4 border border-sky-100 dark:border-sky-900 shadow-2xs">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100">
              ปฏิทินรอบเวรรายวัน (รอบ {periodInfo.payoutMonthNameTh})
            </h3>
            <p className="text-[10px] text-slate-500">แตะที่ช่องวันที่เพื่อเปลี่ยนกะเวร หรือเขียนโน้ตช่วยจำ</p>
          </div>
          <span className="text-[10px] font-semibold text-sky-700 dark:text-sky-300 bg-sky-50 dark:bg-sky-950 px-2 py-0.5 rounded-lg border border-sky-100">
            แตะเปลี่ยนเวรได้เลย
          </span>
        </div>

        {/* Calendar 7-Column Grid */}
        <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
          {scheduleDays.map((day) => {
            const isOff = day.shiftType === "OFF";
            const isSelected = selectedDay?.dateStr === day.dateStr;
            const opt = SHIFT_OPTIONS.find((s) => s.type === day.shiftType);

            return (
              <button
                key={day.dateStr}
                onClick={() => {
                  setSelectedDay(day);
                  setDayNoteInput(day.note || "");
                }}
                className={`flex flex-col items-center justify-between p-1.5 sm:p-2 rounded-xl border text-center transition-all active:scale-95 min-h-[64px] relative ${
                  isSelected
                    ? "ring-2 ring-sky-500 shadow-sm"
                    : ""
                } ${
                  isOff
                    ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800"
                    : day.shiftType === "DOUBLE"
                    ? "bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800"
                    : day.shiftType === "QUICK"
                    ? "bg-orange-50 dark:bg-orange-950/40 border-orange-200 dark:border-orange-800"
                    : "bg-[#f8fbfe] dark:bg-slate-900/60 border-sky-100 dark:border-slate-800"
                }`}
              >
                {/* Day Header */}
                <div className="flex items-center justify-between w-full text-[9px] text-slate-400">
                  <span className={day.isWeekend ? "text-rose-500 font-bold" : ""}>
                    {day.dayOfWeekThai}
                  </span>
                  <span className="font-bold text-slate-800 dark:text-slate-200 tabular-nums">
                    {day.dayNum}
                  </span>
                </div>

                {/* Shift Badge */}
                <div className="my-0.5 flex flex-col items-center">
                  <span
                    className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded-md border tracking-tight truncate max-w-full ${
                      opt?.badgeClass || "bg-slate-100 text-slate-700"
                    }`}
                  >
                    {isOff ? "🌿 OFF" : opt?.label.split(" ")[0]}
                  </span>
                </div>

                {/* Note Indicator dot */}
                {day.note ? (
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500" title={day.note} />
                ) : (
                  <span className="text-[8px] text-slate-400 font-normal">
                    {opt?.hours ? `${opt.hours}h` : "พัก"}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Legend */}
        <div className="mt-3 pt-3 border-t border-sky-100 dark:border-slate-800 flex flex-wrap items-center justify-center gap-2 text-[10px] text-slate-600 dark:text-slate-400">
          {SHIFT_OPTIONS.map((opt) => (
            <span key={opt.type} className="inline-flex items-center gap-1">
              <span className={`px-1.5 py-0.2 rounded border text-[9px] font-bold ${opt.badgeClass}`}>
                {opt.label}
              </span>
            </span>
          ))}
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 4. DAY EDIT SHEET: Quick Switch Shift & Add Note */}
      {/* ------------------------------------------------------------- */}
      {selectedDay && (
        <div className="p-4 bg-sky-50 dark:bg-[#132035] rounded-2xl border border-sky-200 dark:border-sky-800 shadow-md animate-in slide-in-from-bottom duration-200 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-base font-bold text-slate-900 dark:text-slate-100">
                วันที่ {selectedDay.dayNum} {formatThaiDate(selectedDay.dateStr, false)} ({selectedDay.dayOfWeekThai})
              </span>
              <span className="text-[10px] font-semibold bg-white dark:bg-slate-800 text-sky-700 dark:text-sky-300 px-2 py-0.5 rounded-full border border-sky-200">
                สถานะ: {selectedDay.shiftType === "OFF" ? "วันหยุด" : selectedDay.label}
              </span>
            </div>

            <button
              onClick={() => setSelectedDay(null)}
              className="text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 px-2.5 py-1 rounded-lg"
            >
              ปิด
            </button>
          </div>

          {/* Shift Picker Grid */}
          <div className="grid grid-cols-3 gap-2">
            {SHIFT_OPTIONS.map((opt) => {
              const isCurrent = selectedDay.shiftType === opt.type;
              return (
                <button
                  key={opt.type}
                  onClick={() => handleUpdateShiftType(selectedDay.dateStr, opt.type)}
                  className={`p-2.5 rounded-xl text-left border transition-all active:scale-95 text-xs ${
                    isCurrent
                      ? "bg-sky-600 text-white font-bold border-sky-600 shadow-xs"
                      : "bg-white dark:bg-slate-900 border-sky-100 dark:border-slate-800 text-slate-800 dark:text-slate-200 hover:bg-sky-50/70"
                  }`}
                >
                  <div className="font-bold flex items-center justify-between">
                    <span>{opt.label}</span>
                    {isCurrent && <Check className="w-3.5 h-3.5 text-white" strokeWidth={2.5} />}
                  </div>
                  <span className={`text-[9px] block mt-0.5 truncate ${isCurrent ? "text-sky-100" : "text-slate-400"}`}>
                    {opt.desc}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Note input for this day */}
          <div className="pt-1 flex gap-2">
            <input
              type="text"
              placeholder="โน้ตช่วยจำวันนี้ เช่น แลกเวรกับพี่ต่าย, นัดตรวจฟัน..."
              value={dayNoteInput}
              onChange={(e) => setDayNoteInput(e.target.value)}
              className="flex-1 h-9 px-3 bg-white dark:bg-[#0e1726] border border-sky-200/90 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-sky-500"
            />
            <button
              onClick={() => handleSaveDayNote(selectedDay.dateStr, dayNoteInput)}
              className="h-9 px-3 bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold rounded-xl active:scale-95 transition-all"
            >
              บันทึกโน้ต
            </button>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 5. ANNUAL INCOME & TAX & EXCEL REPORT SECTION */}
      {/* ------------------------------------------------------------- */}
      <div className="bg-white dark:bg-[#0e1726] rounded-2xl p-4 border border-sky-100 dark:border-sky-900 shadow-2xs">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/80 border border-indigo-200/70 dark:border-indigo-800/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <BarChart3 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                สถิติรายได้สะสม & ประมาณการภาษี
              </h3>
              <p className="text-[10px] text-slate-500">ปีภาษี {parseInt(currentYear, 10) + 543} (ภ.ง.ด. 91)</p>
            </div>
          </div>

          <div className="flex items-center gap-1 bg-[#f0f6fc] dark:bg-slate-800 p-0.5 rounded-lg border border-sky-100 dark:border-slate-700">
            <button
              onClick={() => setChartRange("6m")}
              className={`text-[10px] font-semibold px-2 py-0.5 rounded-md transition-colors ${
                chartRange === "6m" ? "bg-white dark:bg-slate-700 text-sky-700 dark:text-sky-300 shadow-xs" : "text-slate-500"
              }`}
            >
              6 ด.
            </button>
            <button
              onClick={() => setChartRange("12m")}
              className={`text-[10px] font-semibold px-2 py-0.5 rounded-md transition-colors ${
                chartRange === "12m" ? "bg-white dark:bg-slate-700 text-sky-700 dark:text-sky-300 shadow-xs" : "text-slate-500"
              }`}
            >
              12 ด.
            </button>
          </div>
        </div>

        {/* 2 Metrics */}
        <div className="grid grid-cols-2 gap-2.5 mb-3">
          <div className="bg-[#f8fbfe] dark:bg-slate-900/60 p-3 rounded-xl border border-sky-100 dark:border-slate-800">
            <span className="text-[10px] text-slate-500 block">รายได้รวมสะสม ({yearHistory.length} รอบ)</span>
            <div className="text-base font-extrabold text-slate-900 dark:text-slate-100 mt-1 tabular-nums">
              ฿{formatBaht(annualGross)}
            </div>
          </div>

          <div className="bg-[#f8fbfe] dark:bg-slate-900/60 p-3 rounded-xl border border-sky-100 dark:border-slate-800">
            <span className="text-[10px] text-slate-500 block">ประมาณการภาษีสรรพากร</span>
            <div className="text-base font-extrabold text-indigo-600 dark:text-indigo-400 mt-1 tabular-nums">
              {tax.estimatedTax > 0 ? `฿${formatBaht(tax.estimatedTax)}` : "ไม่ถึงเกณฑ์ภาษี"}
            </div>
          </div>
        </div>

        {/* Excel Export */}
        <div className="pt-2 border-t border-sky-100 dark:border-slate-800 flex items-center justify-between">
          <span className="text-[11px] text-slate-500">ดาวน์โหลดตารางเวร & สรุปเงิน:</span>
          <div className="flex gap-1.5">
            <button
              onClick={() => handleExportExcel(false)}
              disabled={isExporting}
              className="h-8 px-2.5 bg-sky-50 hover:bg-sky-100 text-sky-800 dark:bg-slate-800 dark:text-sky-300 text-xs font-semibold rounded-lg border border-sky-200/80 dark:border-slate-700 transition-all flex items-center gap-1 active:scale-95"
            >
              <Download className="w-3.5 h-3.5" />
              <span>รอบนี้</span>
            </button>
            <button
              onClick={() => handleExportExcel(true)}
              disabled={isExporting}
              className="h-8 px-2.5 bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold rounded-lg transition-all flex items-center gap-1 active:scale-95 shadow-2xs"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>ทั้งปี (.xlsx)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
