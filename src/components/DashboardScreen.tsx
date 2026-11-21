"use client";

import React, { useState } from "react";
import confetti from "canvas-confetti";
import {
  Building2,
  Users,
  CheckCircle2,
  AlertCircle,
  Clock,
  Check,
  Plus,
  Lightbulb,
  Copy,
  HeartPulse,
  ChevronRight,
  Wallet,
  Trash2,
  X,
  Sparkles,
} from "lucide-react";
import { ExtraLog, PeriodSummary } from "@/types";
import {
  computeNurseEnergy,
  formatBaht,
  formatThaiDate,
} from "@/lib/calculations";
import { LOG_TYPE_CONFIG } from "@/lib/constants";

interface DashboardScreenProps {
  userId?: string;
  periodKey?: string;
  summary: PeriodSummary;
  onOpenTally: () => void;
  onOpenQuickAdd: () => void;
  onNavigateToWellness?: () => void;
  onSaveReconcile: (actualSlip: number | null, note: string) => Promise<void>;
  onToggleLogPaid: (logId: string, isPaid: boolean) => Promise<void>;
  onDeleteLog?: (logId: string) => Promise<void>;
  onSelectPeriodKey?: (periodKey: string) => void;
  historySummary?: {
    periodKey: string;
    labelTh: string;
    hospitalSlip: number;
    directIncome: number;
    totalIncome: number;
    isMatched: boolean;
  }[];
  userName?: string;
}

export const DashboardScreen: React.FC<DashboardScreenProps> = ({
  userId,
  periodKey,
  summary,
  onOpenTally,
  onOpenQuickAdd,
  onNavigateToWellness,
  onSaveReconcile,
  onToggleLogPaid,
  onDeleteLog,
  onSelectPeriodKey,
  historySummary = [],
  userName = "พยาบาล",
}) => {
  const [slipInput, setSlipInput] = useState<string>(
    summary.actualSlipAmount !== null && summary.actualSlipAmount !== undefined
      ? String(summary.actualSlipAmount)
      : ""
  );
  const [memoInput, setMemoInput] = useState<string>(summary.period.reconcile_note || "");
  const [isSavingReconcile, setIsSavingReconcile] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copiedMessage, setCopiedMessage] = useState<string | null>(null);

  // Sync inputs when switching month period
  React.useEffect(() => {
    setSlipInput(
      summary.actualSlipAmount !== null && summary.actualSlipAmount !== undefined
        ? String(summary.actualSlipAmount)
        : ""
    );
    setMemoInput(summary.period.reconcile_note || "");
  }, [summary.period.id, summary.period.period_key, summary.actualSlipAmount, summary.period.reconcile_note]);

  // Nurse Work Hours & Energy Stats (for Mini Glance Banner)
  const energy = computeNurseEnergy(summary);

  // Check if Wallet 2 is enabled
  const isDirectWalletEnabled = summary.settings.enable_direct_wallet !== false;

  // Pending logs from Wallet 2
  const pendingLogs = summary.extraLogs.filter(
    (l) => l.payout_channel === "DIRECT" && !l.is_paid
  );

  const handleUpdateSlip = async () => {
    setIsSavingReconcile(true);
    const num = slipInput.trim() === "" ? null : parseFloat(slipInput);
    await onSaveReconcile(isNaN(num as number) ? null : num, memoInput);
    setIsSavingReconcile(false);

    // If perfectly matched, celebrate with confetti
    if (num !== null && Math.abs(num - summary.expectedHospitalSlip) < 0.01) {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.6 },
        colors: ["#0284c7", "#38bdf8", "#10b981"],
      });
    }
  };

  // Smart Discrepancy Clue Analyzer
  const getDiscrepancyClue = (diff: number) => {
    const absDiff = Math.abs(diff);
    const rates = summary.period.rates_snapshot || summary.settings.default_rates;
    const matches: string[] = [];

    if (Math.abs(absDiff - rates.m) < 1) matches.push("กะเช้า 1 เวร");
    if (Math.abs(absDiff - rates.a) < 1) matches.push("กะบ่าย 1 เวร");
    if (Math.abs(absDiff - rates.n) < 1) matches.push("กะดึก 1 เวร");
    if (Math.abs(absDiff - rates.ot_m) < 1) matches.push("OT เช้า 1 เวร");
    if (Math.abs(absDiff - rates.ot_a) < 1) matches.push("OT บ่าย 1 เวร");
    if (Math.abs(absDiff - rates.ot_n) < 1) matches.push("OT ดึก 1 เวร");
    if (Math.abs(absDiff - rates.holiday) < 1) matches.push("ค่าเวรวันหยุด 1 เวร");
    if (Math.abs(absDiff - rates.ot_hr * 4) < 5) matches.push("OT 4 ชั่วโมง (ครึ่งกะ)");
    if (Math.abs(absDiff - rates.ot_hr * 8) < 5) matches.push("OT ราย ชม. 8 ชั่วโมง");

    if (matches.length > 0) {
      return `ยอดที่ขาด ฿${formatBaht(absDiff)} ตรงกับ ${matches.join(" หรือ ")} พอดี ลองตรวจว่ามีเวรนี้ตกเบิกหรือไม่`;
    }
    return null;
  };

  const handleCopyReminder = (log: ExtraLog) => {
    const msg = `เตือนความจำ: ค่า${log.title_note || "เวร"} วันที่ ${formatThaiDate(log.work_date, false)} จำนวน ${formatBaht(log.amount)} บาท รบกวนโอนแล้วแจ้งได้เลยนะคะ ขอบคุณมากค่ะ`;
    navigator.clipboard.writeText(msg);
    setCopiedId(log.id);
    setCopiedMessage(msg);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const clueText = summary.slipStatus === "DISCREPANCY" ? getDiscrepancyClue(summary.deltaSlip) : null;

  return (
    <div className="space-y-3 px-4 py-3 animate-in fade-in duration-200">
      {/* ------------------------------------------------------------- */}
      {/* 1. HERO GRAND TOTAL BALANCE CARD */}
      {/* ------------------------------------------------------------- */}
      <div className="bg-gradient-to-br from-white via-sky-50/50 to-white dark:from-[#0e1726] dark:via-[#112137] dark:to-[#0e1726] rounded-2xl p-4 border border-sky-100 dark:border-sky-900/80 shadow-2xs">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
              {isDirectWalletEnabled ? "รายได้รวมทุกกระเป๋าในรอบนี้" : "ยอดรายได้สลิปโรงพยาบาลในรอบนี้"}
            </span>
          </div>

          <span className="text-[10px] font-semibold bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300 px-2 py-0.5 rounded-full border border-sky-200">
            {summary.slipStatus === "MATCHED"
              ? "สลิปตรงเป๊ะ ✅"
              : summary.slipStatus === "DISCREPANCY"
              ? `สลิปขาด ฿${formatBaht(Math.abs(summary.deltaSlip))}`
              : "รอตรวจสลิป"}
          </span>
        </div>

        <div className="my-2">
          <div className="flex items-baseline gap-1.5">
            <span className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight tabular-nums">
              ฿{formatBaht(isDirectWalletEnabled ? summary.grandTotal : summary.expectedHospitalSlip, true)}
            </span>
            <span className="text-xs text-slate-500 font-medium">บาท</span>
          </div>

          {/* Wallet Split Sub-badges */}
          {isDirectWalletEnabled ? (
            <div className="mt-2.5 flex flex-wrap items-center gap-2 text-xs">
              <div className="px-2.5 py-1 rounded-lg bg-sky-50/80 dark:bg-slate-800/80 border border-sky-200/60 dark:border-slate-700 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                <span className="text-slate-600 dark:text-slate-400">สลิป รพ.:</span>
                <strong className="text-slate-900 dark:text-slate-100 tabular-nums">฿{formatBaht(summary.expectedHospitalSlip)}</strong>
              </div>

              <div className="px-2.5 py-1 rounded-lg bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200/60 dark:border-amber-800/50 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                <span className="text-amber-900 dark:text-amber-300">เวรนอก/เพื่อน:</span>
                <strong className="text-slate-900 dark:text-slate-100 tabular-nums">฿{formatBaht(summary.directTotalSum)}</strong>
                {pendingLogs.length > 0 && (
                  <span className="text-[9px] px-1 rounded-full bg-amber-500 text-white font-bold">
                    รอโอน {pendingLogs.length}
                  </span>
                )}
              </div>
            </div>
          ) : (
            <div className="mt-2 flex items-center gap-2 text-xs">
              <div className="px-2.5 py-1 rounded-lg bg-sky-50/80 dark:bg-slate-800/80 border border-sky-200/60 dark:border-slate-700 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                <span className="text-slate-600 dark:text-slate-400">เวรตาราง:</span>
                <strong className="text-slate-900 dark:text-slate-100 tabular-nums">฿{formatBaht(summary.shiftSum)}</strong>
                {summary.extraHospitalSum > 0 && (
                  <>
                    <span className="text-slate-300 dark:text-slate-700">•</span>
                    <span className="text-sky-700 dark:text-sky-300">OT: <strong className="tabular-nums">฿{formatBaht(summary.extraHospitalSum)}</strong></span>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 2. MINI HEALTH GLANCE BANNER (WAY 2: 1-LINE JUMP WIDGET)      */}
      {/* ------------------------------------------------------------- */}
      <button
        onClick={onNavigateToWellness}
        aria-label="ดูแดชบอร์ดพลังชีวิตและเรดาร์เซฟตี้"
        className="w-full p-2.5 rounded-xl bg-gradient-to-r from-emerald-50/90 via-teal-50/70 to-sky-50/90 dark:from-emerald-950/40 dark:via-[#112338] dark:to-teal-950/40 border border-emerald-200/80 dark:border-emerald-800/60 flex items-center justify-between text-xs transition-all active:scale-[0.98] hover:shadow-2xs group"
      >
        <div className="flex items-center gap-2 truncate">
          <span className="text-sm">🌿</span>
          <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">
            พลังชีวิตรอบนี้: ทำงาน <strong className="tabular-nums font-bold text-sky-700 dark:text-sky-300">{energy.totalHours} ชม.</strong>
            {energy.diffHours > 0 ? (
              <span className="text-amber-700 dark:text-amber-400 font-bold ml-1">
                (เกินเกณฑ์ +{energy.diffHours} ชม.)
              </span>
            ) : (
              <span className="text-emerald-700 dark:text-emerald-300 font-medium ml-1">
                (สมดุลดี)
              </span>
            )}
            {summary.period.quick_turnaround_count && summary.period.quick_turnaround_count > 0 ? (
              <span className="text-rose-600 dark:text-rose-400 font-semibold ml-1">
                • บ่ายต่อเช้า {summary.period.quick_turnaround_count} ครั้ง
              </span>
            ) : null}
          </span>
        </div>

        <div className="flex items-center gap-1 text-emerald-700 dark:text-emerald-300 font-bold shrink-0 ml-2">
          <span className="text-[11px] group-hover:underline">ดูดัชนีเซฟตี้</span>
          <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
        </div>
      </button>

      {/* ------------------------------------------------------------- */}
      {/* 3. WALLET 1 - HOSPITAL PAYROLL SLIP RECONCILIATION */}
      {/* ------------------------------------------------------------- */}
      <div className="bg-white dark:bg-[#0e1726] rounded-2xl p-4 border border-sky-100 dark:border-sky-900/70 shadow-2xs transition-colors">
        {/* Card Header */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-sky-50 dark:bg-sky-950/80 border border-sky-100 dark:border-sky-800/60 flex items-center justify-center text-sky-600 dark:text-sky-400">
              <Building2 className="w-4 h-4" strokeWidth={1.8} />
            </div>
            <div>
              <span className="text-[10px] font-semibold text-sky-700 dark:text-sky-400 uppercase tracking-wide">
                กระเป๋าที่ 1: โรงพยาบาล
              </span>
              <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100 leading-tight">
                ยอดรอเข้าสลิปเงินเดือน
              </h2>
            </div>
          </div>

          <span className="text-[11px] font-medium bg-sky-50 dark:bg-sky-950/70 text-sky-800 dark:text-sky-300 px-2.5 py-0.5 rounded-full border border-sky-100 dark:border-sky-800/70">
            {summary.settings.include_base_salary ? "รวมฐานเงินเดือน" : "เฉพาะค่าเวร"}
          </span>
        </div>

        {/* Expected Amount Display */}
        <div className="my-3">
          <div className="flex items-baseline gap-1.5">
            <span className="text-3xl font-bold text-slate-900 dark:text-slate-100 tracking-tight tabular-nums">
              ฿{formatBaht(summary.expectedHospitalSlip, true)}
            </span>
            <span className="text-xs text-slate-500 font-medium">บาท</span>
          </div>

          {/* Breakdown tags */}
          <div className="text-xs text-slate-600 dark:text-slate-400 mt-2 flex flex-wrap items-center gap-1.5">
            <span className="bg-[#f0f6fc] dark:bg-[#152033] px-2.5 py-1 rounded-lg border border-sky-100/80 dark:border-slate-700/60">
              เวรตาราง: <strong className="tabular-nums font-semibold text-slate-900 dark:text-slate-100">฿{formatBaht(summary.shiftSum)}</strong>
            </span>
            <span className="bg-[#f0f6fc] dark:bg-[#152033] px-2.5 py-1 rounded-lg border border-sky-100/80 dark:border-slate-700/60">
              OT/งอก: <strong className="tabular-nums font-semibold text-slate-900 dark:text-slate-100">฿{formatBaht(summary.extraHospitalSum)}</strong>
            </span>
            {summary.deductHospitalSum > 0 && (
              <span className="bg-rose-50 dark:bg-rose-950/40 px-2.5 py-1 rounded-lg border border-rose-200/60 dark:border-rose-800/50 text-rose-700 dark:text-rose-400">
                หักขายเวร: <strong className="tabular-nums font-semibold">-฿{formatBaht(summary.deductHospitalSum)}</strong>
              </span>
            )}
            {summary.baseSalaryAmount > 0 && (
              <span className="bg-slate-50 dark:bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-200/80 dark:border-slate-700">
                ฐานเงินเดือน: <strong className="tabular-nums font-semibold text-slate-900 dark:text-slate-100">฿{formatBaht(summary.baseSalaryAmount)}</strong>
              </span>
            )}
          </div>
        </div>

        {/* Reconcile Slip Box */}
        <div className="mt-3.5 pt-3.5 border-t border-sky-100 dark:border-sky-900/60 bg-[#f7fbfe] dark:bg-[#121c2c] -mx-4 -mb-4 p-4 rounded-b-2xl">
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <span>ยอดเงินเข้าจริงตามสลิป</span>
              <span className="text-[10px] text-slate-500 font-normal">(กรอกเมื่อสลิปออก)</span>
            </label>

            {/* Reconcile Status Pill */}
            {summary.slipStatus === "PENDING" && (
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-600 dark:text-slate-300 bg-slate-200/70 dark:bg-slate-700 px-2.5 py-0.5 rounded-full">
                <Clock className="w-3 h-3 text-slate-500" strokeWidth={1.8} />
                รอตรวจสลิป
              </span>
            )}
            {summary.slipStatus === "MATCHED" && (
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" strokeWidth={2} />
                ยอดตรงครบถ้วน
              </span>
            )}
            {summary.slipStatus === "DISCREPANCY" && (
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-rose-800 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/60 px-2.5 py-0.5 rounded-full border border-rose-200 dark:border-rose-800">
                <AlertCircle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" strokeWidth={2} />
                ขาด ฿{formatBaht(Math.abs(summary.deltaSlip))}
              </span>
            )}
            {summary.slipStatus === "OVERPAID" && (
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-sky-800 dark:text-sky-300 bg-sky-50 dark:bg-sky-950/60 px-2.5 py-0.5 rounded-full border border-sky-200 dark:border-sky-800">
                <CheckCircle2 className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" strokeWidth={2} />
                เกิน +฿{formatBaht(summary.deltaSlip)}
              </span>
            )}
          </div>

          <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-2 leading-relaxed">
            {summary.settings.include_base_salary
              ? "ℹ️ กรอกยอดเงินสุทธิเข้าบัญชีทั้งสลิป (รวมฐานเงินเดือน + ค่าเวร)"
              : "ℹ️ กรอกเฉพาะยอดช่อง 'ค่าตอบแทน/ค่าเวร OT' ในสลิปเงินเดือน (ไม่รวมเงินเดือน)"}
          </p>

          <div className="flex gap-2">
            <div className="relative flex-1">
              <span className="absolute left-3.5 top-3 text-sky-600 dark:text-sky-400 font-semibold text-sm">฿</span>
              <input
                type="number"
                step="any"
                placeholder={
                  summary.settings.include_base_salary
                    ? "ระบุยอดสุทธิทั้งสลิป..."
                    : "ระบุเฉพาะยอดค่าเวรในสลิป..."
                }
                value={slipInput}
                onChange={(e) => setSlipInput(e.target.value)}
                className="w-full h-11 pl-8 pr-3 bg-white dark:bg-[#0e1726] border border-sky-200/90 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 tabular-nums shadow-2xs"
              />
            </div>
            <button
              onClick={handleUpdateSlip}
              disabled={isSavingReconcile}
              className="h-11 px-4 bg-sky-600 hover:bg-sky-700 active:scale-[0.97] text-white text-xs font-semibold rounded-xl transition-all shrink-0 flex items-center justify-center gap-1 shadow-2xs"
            >
              {isSavingReconcile ? "บันทึก..." : "ตรวจสลิป"}
            </button>
          </div>

          {/* Smart Discrepancy Clue Notification */}
          {clueText && (
            <div className="mt-2.5 p-3 bg-rose-50/90 dark:bg-rose-950/40 border border-rose-200/80 dark:border-rose-800/60 rounded-xl text-xs text-rose-800 dark:text-rose-200 flex items-start gap-2">
              <Lightbulb className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" strokeWidth={2} />
              <div className="flex-1 font-normal leading-relaxed">{clueText}</div>
            </div>
          )}

          {/* Memo Note Input */}
          <div className="mt-2.5">
            <input
              type="text"
              placeholder="บันทึกช่วยจำ เช่น ขาด OT บ่าย 12 พ.ย. แจ้งธุรการแล้ว"
              value={memoInput}
              onChange={(e) => setMemoInput(e.target.value)}
              onBlur={handleUpdateSlip}
              className="w-full h-10 px-3 bg-white dark:bg-[#0e1726] border border-sky-100 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-sky-500"
            />
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 4. WALLET 2 - DIRECT / PEER TRANSFERS (OPTIONAL TOGGLE)       */}
      {/* ------------------------------------------------------------- */}
      {isDirectWalletEnabled && (
      <div className="bg-white dark:bg-[#0e1726] rounded-2xl p-4 border border-sky-100 dark:border-sky-900/70 shadow-2xs transition-colors">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200/60 dark:border-amber-800/60 flex items-center justify-center text-amber-600 dark:text-amber-400">
              <Users className="w-4 h-4" strokeWidth={1.8} />
            </div>
            <div>
              <span className="text-[10px] font-semibold text-amber-700 dark:text-amber-400 uppercase tracking-wide">
                กระเป๋าที่ 2: นอกสลิป
              </span>
              <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100 leading-tight">
                เวรแทนเพื่อนและคลินิกนอก
              </h2>
            </div>
          </div>
        </div>

        {/* Preview of copied LINE message */}
        {copiedMessage && (
          <div className="mb-3 p-2.5 bg-sky-50 dark:bg-sky-950/70 border border-sky-200 dark:border-sky-800 rounded-xl text-xs text-sky-950 dark:text-sky-100 flex items-start justify-between gap-2 animate-in fade-in duration-150">
            <div className="flex-1">
              <span className="font-semibold block text-[11px] text-sky-700 dark:text-sky-300">
                📋 คัดลอกข้อความทวงเงินพร้อมส่งใน LINE แล้ว:
              </span>
              <p className="mt-1 text-[11px] bg-white/90 dark:bg-slate-900/90 p-2 rounded-lg border border-sky-100 dark:border-slate-800 select-all leading-relaxed">
                &ldquo;{copiedMessage}&rdquo;
              </p>
            </div>
            <button
              onClick={() => setCopiedMessage(null)}
              className="w-6 h-6 rounded-lg hover:bg-sky-100 dark:hover:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 shrink-0"
              title="ปิดการแจ้งเตือน"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* 2-Column Split: Pending vs Paid */}
        <div className="grid grid-cols-2 gap-2.5 mb-3">
          <div className="bg-[#fffbf0] dark:bg-amber-950/20 border border-amber-200/70 dark:border-amber-900/40 rounded-xl p-3">
            <span className="text-[11px] font-medium text-amber-800 dark:text-amber-300 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-amber-500" strokeWidth={1.8} />
              ค้างรับ (รอโอน)
            </span>
            <div className="text-xl font-bold text-slate-900 dark:text-slate-100 mt-1 tabular-nums">
              ฿{formatBaht(summary.directPendingSum)}
            </div>
            <span className="text-[11px] text-slate-500 dark:text-slate-400">
              {pendingLogs.length} รายการ
            </span>
          </div>

          <div className="bg-[#f0faf5] dark:bg-emerald-950/20 border border-emerald-200/70 dark:border-emerald-900/40 rounded-xl p-3">
            <span className="text-[11px] font-medium text-emerald-800 dark:text-emerald-300 flex items-center gap-1">
              <Check className="w-3.5 h-3.5 text-emerald-500" strokeWidth={1.8} />
              ได้รับแล้ว
            </span>
            <div className="text-xl font-bold text-slate-900 dark:text-slate-100 mt-1 tabular-nums">
              ฿{formatBaht(summary.directPaidSum)}
            </div>
            <span className="text-[11px] text-slate-500 dark:text-slate-400">
              รวม ฿{formatBaht(summary.directTotalSum)}
            </span>
          </div>
        </div>

        {/* Pending checklist */}
        {pendingLogs.length > 0 ? (
          <div className="space-y-2 pt-2 border-t border-sky-100 dark:border-sky-900/60">
            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
              รายการที่รอตามเงิน:
            </span>
            <div className="space-y-2 max-h-48 overflow-y-auto pr-0.5">
              {pendingLogs.map((log) => (
                <div
                  key={log.id}
                  className="p-3 rounded-xl bg-[#f0f6fc]/70 dark:bg-slate-800/60 border border-sky-100 dark:border-slate-700/60 text-xs space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <div className="font-semibold text-slate-900 dark:text-slate-100 truncate">
                      {log.title_note || LOG_TYPE_CONFIG[log.log_type]?.label}
                    </div>
                    <span className="font-bold text-amber-700 dark:text-amber-400 tabular-nums">
                      ฿{formatBaht(log.amount)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[10px] text-slate-500">
                      {formatThaiDate(log.work_date, false)}
                    </span>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleCopyReminder(log)}
                        className="h-8 px-2.5 flex items-center gap-1 bg-white dark:bg-slate-700 hover:bg-sky-50 dark:hover:bg-slate-600 text-sky-700 dark:text-sky-300 font-medium text-xs rounded-lg border border-sky-200/80 dark:border-slate-600 transition-all active:scale-[0.96]"
                        title="คัดลอกข้อความทวงเงินส่งใน LINE"
                      >
                        <Copy className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" strokeWidth={1.8} />
                        <span>
                          {copiedId === log.id
                            ? "คัดลอกแล้ว"
                            : log.log_type === "EXTERNAL_CLINIC" ||
                              (log.title_note && log.title_note.toLowerCase().includes("คลินิก"))
                            ? "ทวงเงิน (LINE)"
                            : "ทวงเพื่อน (LINE)"}
                        </span>
                      </button>

                      <button
                        onClick={() => onToggleLogPaid(log.id, true)}
                        className="h-8 px-2.5 flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.96] text-white font-medium text-xs rounded-lg transition-all"
                        title="ทำเครื่องหมายว่าได้รับเงินแล้ว"
                      >
                        <Check className="w-3.5 h-3.5" strokeWidth={2} />
                        <span>รับแล้ว</span>
                      </button>

                      {onDeleteLog && (
                        <button
                          onClick={async () => {
                            if (window.confirm(`ต้องการลบรายการ "${log.title_note || "นี้"}" ใช่หรือไม่?`)) {
                              await onDeleteLog(log.id);
                            }
                          }}
                          className="w-8 h-8 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 flex items-center justify-center transition-colors active:scale-95"
                          title="ลบรายการนี้"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <p className="text-xs text-slate-500 dark:text-slate-400 text-center py-1.5">
            ไม่มีรายการค้างรับในรอบนี้
          </p>
        )}
      </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 5. MAIN ACTION BUTTONS (44px+ mobile touch targets) */}
      {/* ------------------------------------------------------------- */}
      <div className="grid grid-cols-2 gap-2.5">
        <button
          onClick={onOpenTally}
          className="h-12 flex items-center justify-center gap-2 px-3 rounded-xl bg-white dark:bg-[#0e1726] border border-sky-200/90 dark:border-sky-900/80 hover:bg-sky-50/70 dark:hover:bg-slate-800 text-slate-900 dark:text-slate-100 font-semibold text-xs active:scale-[0.97] transition-all shadow-2xs"
        >
          <Building2 className="w-4 h-4 text-sky-600 dark:text-sky-400" strokeWidth={1.8} />
          <span>นับเวรตามตาราง</span>
        </button>

        <button
          onClick={onOpenQuickAdd}
          className="h-12 flex items-center justify-center gap-2 px-3 rounded-xl bg-sky-600 hover:bg-sky-700 active:scale-[0.97] text-white font-semibold text-xs transition-all shadow-2xs"
        >
          <Plus className="w-4 h-4" strokeWidth={2} />
          <span>{isDirectWalletEnabled ? "จดงานงอก / เวรนอก" : "จด OT งอก"}</span>
        </button>
      </div>
    </div>
  );
};
