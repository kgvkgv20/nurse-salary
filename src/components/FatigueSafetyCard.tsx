"use client";

import React, { useState, useEffect } from "react";
import {
  ShieldAlert,
  Moon,
  AlertTriangle,
  Clock,
  Sparkles,
  Zap,
  Info,
  CheckCircle,
  Pill,
  Car,
  ChevronDown,
  ChevronUp,
  Plus,
  Minus,
} from "lucide-react";
import { FatigueSafetyStats, PeriodSummary } from "@/types";
import { computeFatigueSafety } from "@/lib/calculations";

interface FatigueSafetyCardProps {
  summary: PeriodSummary;
  onSaveFatigueCounts: (quickTurnaround: number, doubleShift: number) => Promise<void>;
}

export const FatigueSafetyCard: React.FC<FatigueSafetyCardProps> = ({
  summary,
  onSaveFatigueCounts,
}) => {
  const initialQuick = summary.period.quick_turnaround_count ?? 2;
  const initialDouble = summary.period.double_shift_count ?? 0;

  const [quickTurnaround, setQuickTurnaround] = useState<number>(initialQuick);
  const [doubleShift, setDoubleShift] = useState<number>(initialDouble);
  const [showAdviceDetails, setShowAdviceDetails] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Sync state when period changes
  useEffect(() => {
    setQuickTurnaround(summary.period.quick_turnaround_count ?? 2);
    setDoubleShift(summary.period.double_shift_count ?? 0);
  }, [summary.period.id, summary.period.quick_turnaround_count, summary.period.double_shift_count]);

  const stats: FatigueSafetyStats = computeFatigueSafety(summary, quickTurnaround, doubleShift);

  const handleUpdateQuick = async (delta: number) => {
    const nextVal = Math.max(0, quickTurnaround + delta);
    setQuickTurnaround(nextVal);
    try {
      setIsSaving(true);
      await onSaveFatigueCounts(nextVal, doubleShift);
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateDouble = async (delta: number) => {
    const nextVal = Math.max(0, doubleShift + delta);
    setDoubleShift(nextVal);
    try {
      setIsSaving(true);
      await onSaveFatigueCounts(quickTurnaround, nextVal);
    } finally {
      setIsSaving(false);
    }
  };

  // Color theme mapping
  const badgeStyle =
    stats.fatigueLevel === "good"
      ? "bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/70 dark:text-emerald-300 dark:border-emerald-800"
      : stats.fatigueLevel === "moderate"
      ? "bg-sky-50 text-sky-800 border-sky-200 dark:bg-sky-950/70 dark:text-sky-300 dark:border-sky-800"
      : stats.fatigueLevel === "high"
      ? "bg-amber-50 text-amber-900 border-amber-200 dark:bg-amber-950/70 dark:text-amber-300 dark:border-amber-800"
      : "bg-rose-50 text-rose-900 border-rose-200 dark:bg-rose-950/70 dark:text-rose-300 dark:border-rose-800";

  const scoreTextColor =
    stats.fatigueLevel === "good"
      ? "text-emerald-600 dark:text-emerald-400"
      : stats.fatigueLevel === "moderate"
      ? "text-sky-600 dark:text-sky-400"
      : stats.fatigueLevel === "high"
      ? "text-amber-600 dark:text-amber-400"
      : "text-rose-600 dark:text-rose-400";

  return (
    <div className="bg-white dark:bg-[#0e1726] rounded-2xl p-4 border border-sky-100 dark:border-sky-900/70 shadow-2xs transition-colors">
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/80 border border-amber-200/80 dark:border-amber-800/60 flex items-center justify-center text-amber-600 dark:text-amber-400">
            <ShieldAlert className="w-4 h-4" strokeWidth={2} />
          </div>
          <div>
            <span className="text-[10px] font-semibold text-amber-700 dark:text-amber-400 uppercase tracking-wide">
              เรดาร์ความปลอดภัย & คุณภาพชีวิต
            </span>
            <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 leading-tight">
              ระบุเวรเสี่ยง & เวรควงในรอบนี้
            </h2>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
              กด +/- ตามตารางเวรจริงของคุณเพื่อคำนวณเวลานอนที่หายไป
            </p>
          </div>
        </div>

        <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-full border tabular-nums text-right shrink-0 ${badgeStyle}`}>
          {stats.levelBadge}
        </span>
      </div>

      {/* Safety Score & Sleep Debt Hero Grid */}
      <div className="grid grid-cols-2 gap-2.5 mb-3">
        {/* Safety Score Meter */}
        <div className="bg-[#f8fbfe] dark:bg-slate-900/70 rounded-xl p-3 border border-sky-100 dark:border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[11px] text-slate-500">
            <span>คะแนนความปลอดภัย</span>
            <span className="font-semibold">{stats.safetyScore}/100</span>
          </div>

          <div className="my-1.5 flex items-baseline gap-1.5">
            <span className={`text-2xl sm:text-3xl font-extrabold tracking-tight tabular-nums ${scoreTextColor}`}>
              {stats.safetyScore}
            </span>
            <span className="text-xs font-semibold text-slate-400">คะแนน</span>
          </div>

          <p className="text-[10px] font-semibold text-slate-600 dark:text-slate-300 leading-tight mb-1 truncate">
            {stats.safetyScore >= 85
              ? "ร่างกายสมดุล (ปลอดภัยดี) 🌿"
              : stats.safetyScore >= 65
              ? "ควรพักผ่อนเพิ่ม (เริ่มล้า) ⚠️"
              : "เสี่ยงล้าสะสมสูง (ระวังหลับใน) 🚨"}
          </p>

          {/* Mini progress bar */}
          <div className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${
                stats.safetyScore >= 80
                  ? "bg-emerald-500"
                  : stats.safetyScore >= 60
                  ? "bg-sky-500"
                  : stats.safetyScore >= 40
                  ? "bg-amber-500"
                  : "bg-rose-500"
              }`}
              style={{ width: `${stats.safetyScore}%` }}
            />
          </div>
        </div>

        {/* Sleep Debt Index */}
        <div className="bg-[#f8fbfe] dark:bg-slate-900/70 rounded-xl p-3 border border-sky-100 dark:border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[11px] text-slate-500">
            <span>ขาดเวลานอนสะสม (Sleep Debt)</span>
            <Moon className="w-3.5 h-3.5 text-indigo-500" />
          </div>

          <div className="my-1.5 flex items-baseline gap-1">
            <span className="text-2xl sm:text-3xl font-extrabold text-indigo-600 dark:text-indigo-400 tracking-tight tabular-nums">
              {stats.sleepDebtHours > 0 ? `-${stats.sleepDebtHours}` : "0"}
            </span>
            <span className="text-xs font-semibold text-slate-400">ชม. ที่ขาด</span>
          </div>

          <span className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight truncate">
            {stats.sleepDebtHours > 0 ? "เวลานอนจริงหายไปจากเวรติด" : "พักผ่อนได้ครบตามเกณฑ์"}
          </span>
        </div>
      </div>

      {/* Interactive Quick Stepper Counters */}
      <div className="bg-[#f3f8fc] dark:bg-slate-900/90 rounded-xl p-3 border border-sky-100 dark:border-slate-800 mb-3 space-y-2.5">
        <div className="text-[11px] font-bold text-slate-800 dark:text-slate-200 flex items-center justify-between">
          <div>
            <span className="block">ระบุเวรเสี่ยง & เวรควงในรอบนี้</span>
            <span className="text-[10px] font-normal text-slate-500 dark:text-slate-400 block">
              กด +/- ตามตารางเวรจริงของคุณเพื่อคำนวณเวลานอนที่หายไป
            </span>
          </div>
          {isSaving && <span className="text-[10px] text-sky-600 animate-pulse">กำลังบันทึก...</span>}
        </div>

        {/* Stepper 1: บ่ายต่อเช้า (Quick Turnaround) */}
        <div className="flex items-center justify-between bg-white dark:bg-[#121c2c] p-2.5 rounded-xl border border-sky-100 dark:border-slate-800">
          <div className="flex-1 pr-2">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                เวรบ่ายต่อเช้า (บ. ➔ ช.)
              </span>
              <span className="text-[9px] font-semibold bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300 px-1.5 py-0.2 rounded border border-rose-200 dark:border-rose-900">
                นอนจริง 4.5-5 ชม.
              </span>
            </div>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
              บ่ายเลิกเที่ยงคืน ต่อเช้า 8 โมงเช้า เสียเวลานอน ~3.5 ชม./ครั้ง
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => handleUpdateQuick(-1)}
              disabled={quickTurnaround <= 0}
              aria-label="ลดจำนวนเวรบ่ายต่อเช้า"
              className="w-8 h-8 rounded-lg bg-sky-50 dark:bg-slate-800 hover:bg-sky-100 dark:hover:bg-slate-700 disabled:opacity-30 disabled:pointer-events-none flex items-center justify-center text-slate-700 dark:text-slate-200 transition-all active:scale-90"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
            <span className="w-7 text-center font-bold text-sm tabular-nums text-slate-900 dark:text-slate-100">
              {quickTurnaround}
            </span>
            <button
              onClick={() => handleUpdateQuick(1)}
              aria-label="เพิ่มจำนวนเวรบ่ายต่อเช้า"
              className="w-8 h-8 rounded-lg bg-sky-50 dark:bg-slate-800 hover:bg-sky-100 dark:hover:bg-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-200 transition-all active:scale-90"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Stepper 2: เวรควง 16 ชม. ติด */}
        <div className="flex items-center justify-between bg-white dark:bg-[#121c2c] p-2.5 rounded-xl border border-sky-100 dark:border-slate-800">
          <div className="flex-1 pr-2">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                เวรควง 16 ชม. ติด
              </span>
              <span className="text-[9px] font-semibold bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300 px-1.5 py-0.2 rounded border border-amber-200 dark:border-amber-900">
                ล้าเฉียบพลัน
              </span>
            </div>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
              เช่น ช.+บ. หรือ บ.+ด. สมองล้าสะสมรุนแรงหลัง ชม. ที่ 12
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => handleUpdateDouble(-1)}
              disabled={doubleShift <= 0}
              aria-label="ลดจำนวนเวรควง 16 ชม."
              className="w-8 h-8 rounded-lg bg-sky-50 dark:bg-slate-800 hover:bg-sky-100 dark:hover:bg-slate-700 disabled:opacity-30 disabled:pointer-events-none flex items-center justify-center text-slate-700 dark:text-slate-200 transition-all active:scale-90"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
            <span className="w-7 text-center font-bold text-sm tabular-nums text-slate-900 dark:text-slate-100">
              {doubleShift}
            </span>
            <button
              onClick={() => handleUpdateDouble(1)}
              aria-label="เพิ่มจำนวนเวรควง 16 ชม."
              className="w-8 h-8 rounded-lg bg-sky-50 dark:bg-slate-800 hover:bg-sky-100 dark:hover:bg-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-200 transition-all active:scale-90"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Shift Badge: Auto-counted night shifts */}
        <div className="flex items-center justify-between text-xs px-2 pt-1 text-slate-600 dark:text-slate-400">
          <span className="flex items-center gap-1.5">
            <Moon className="w-3.5 h-3.5 text-sky-500" />
            <span>เวรดึกสะสมในรอบนี้ (นับจากตาราง):</span>
          </span>
          <span className="font-bold text-slate-800 dark:text-slate-200 tabular-nums">
            {stats.nightShiftCount} เวร
          </span>
        </div>
      </div>

      {/* Proactive Clinical Warning Pill */}
      {stats.warnings.length > 0 && (
        <div className="mb-3 p-3 bg-amber-50/90 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800/60 rounded-xl text-xs text-amber-900 dark:text-amber-200 space-y-1">
          <div className="font-bold flex items-center gap-1.5 text-amber-800 dark:text-amber-300">
            <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
            <span>ข้อควรระวังเวรในรอบนี้:</span>
          </div>
          <ul className="list-disc list-inside space-y-0.5 text-[11px] leading-relaxed pl-1">
            {stats.warnings.map((w, i) => (
              <li key={i}>{w}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Collapsible Evidence-based Advice (Power Nap & HAD Double-Check) */}
      <div className="pt-2 border-t border-sky-100 dark:border-slate-800">
        <button
          onClick={() => setShowAdviceDetails(!showAdviceDetails)}
          className="w-full flex items-center justify-between py-1 text-xs text-slate-600 dark:text-slate-400 hover:text-sky-600 transition-colors"
        >
          <span className="font-semibold flex items-center gap-1.5 text-sky-700 dark:text-sky-300">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>คู่มือฟื้นฟู & กฎความปลอดภัยทางคลินิก</span>
          </span>
          <div className="flex items-center gap-1 text-[11px] text-sky-600 dark:text-sky-400 font-semibold">
            <span>{showAdviceDetails ? "ซ่อน" : "อ่านคำแนะนำ"}</span>
            {showAdviceDetails ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </div>
        </button>

        {showAdviceDetails && (
          <div className="mt-2 space-y-2.5 bg-[#f8fbfe] dark:bg-slate-900/70 p-3 rounded-xl border border-sky-100 dark:border-slate-800 text-xs">
            {/* Power Nap advice */}
            <div className="flex items-start gap-2 text-slate-700 dark:text-slate-300">
              <Clock className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
              <div>
                <strong className="text-slate-900 dark:text-slate-100 block mb-0.5">
                  💤 แผนงีบสั้น (Power Nap 20 นาที):
                </strong>
                <p className="text-[11px] leading-relaxed text-slate-600 dark:text-slate-400">
                  {stats.powerNapAdvice}
                </p>
              </div>
            </div>

            {/* High Alert Drugs rule */}
            <div className="flex items-start gap-2 text-slate-700 dark:text-slate-300 pt-2 border-t border-sky-100/80 dark:border-slate-800">
              <Pill className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <div>
                <strong className="text-slate-900 dark:text-slate-100 block mb-0.5">
                  💊 ป้องกัน Medication Error (Double-Check):
                </strong>
                <p className="text-[11px] leading-relaxed text-slate-600 dark:text-slate-400">
                  {stats.clinicalSafetyTip}
                </p>
              </div>
            </div>

            {/* Drowsy Driving alert */}
            <div className="flex items-start gap-2 text-slate-700 dark:text-slate-300 pt-2 border-t border-sky-100/80 dark:border-slate-800">
              <Car className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <strong className="text-slate-900 dark:text-slate-100 block mb-0.5">
                  🚗 ระวังหลับในขณะเดินทางกลับบ้าน:
                </strong>
                <p className="text-[11px] leading-relaxed text-slate-600 dark:text-slate-400">
                  หากรู้สึกหนังตาหนักตอนขับรถหลังลงเวรดึก/บ่ายต่อเช้า แนะนำแวะจอดพักงีบในรถ 15 นาที หรือจิบน้ำเย็นก่อนออกเดินทาง ความปลอดภัยของคุณสำคัญที่สุดเสมอ
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
