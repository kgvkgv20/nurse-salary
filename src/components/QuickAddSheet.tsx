"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, Clock, Users, Building2, ArrowDownRight, Check } from "lucide-react";
import { ExtraLog, ExtraPreset, LogType, PayoutChannel } from "@/types";
import { formatDate } from "@/lib/calculations";
import { LOG_TYPE_CONFIG } from "@/lib/constants";

interface QuickAddSheetProps {
  isOpen: boolean;
  onClose: () => void;
  periodId: string;
  lineUserId: string;
  presets: ExtraPreset[];
  hourlyRate: number;
  enableDirectWallet?: boolean;
  onAddLog: (log: Omit<ExtraLog, "id" | "created_at">) => Promise<void>;
}

export const QuickAddSheet: React.FC<QuickAddSheetProps> = ({
  isOpen,
  onClose,
  periodId,
  lineUserId,
  presets,
  hourlyRate,
  enableDirectWallet = true,
  onAddLog,
}) => {
  const [mounted, setMounted] = useState(false);
  const [logType, setLogType] = useState<LogType>("OT_HOURLY");
  const [workDate, setWorkDate] = useState<string>(formatDate(new Date()));
  const [amountStr, setAmountStr] = useState<string>(String(hourlyRate * 2 || 240));
  const [titleNote, setTitleNote] = useState<string>("อยู่ต่อ 2 ชม.");
  const [payoutChannel, setPayoutChannel] = useState<PayoutChannel>("HOSPITAL");
  const [isPaid, setIsPaid] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!isOpen || !mounted) return null;

  const handleSelectType = (type: LogType) => {
    setLogType(type);
    const config = LOG_TYPE_CONFIG[type];
    if (config) {
      setPayoutChannel(config.defaultChannel);
    }
    if (type === "OT_HOURLY") {
      setTitleNote("อยู่ต่อ 2 ชม.");
      setAmountStr(String(hourlyRate * 2 || 240));
      setPayoutChannel("HOSPITAL");
    } else if (type === "COVER_PEER") {
      setTitleNote("รับเวรแทนเพื่อน");
      setAmountStr("800");
      setPayoutChannel("DIRECT");
      setIsPaid(false);
    } else if (type === "EXTERNAL_CLINIC") {
      setTitleNote("เวรคลินิกนอก");
      setAmountStr("900");
      setPayoutChannel("DIRECT");
      setIsPaid(false);
    } else if (type === "SELL_SHIFT") {
      setTitleNote("ขายเวรบ่ายให้เพื่อน");
      setAmountStr("300");
      setPayoutChannel("HOSPITAL");
      setIsPaid(false);
    }
  };

  const handleQuickHours = (hours: number) => {
    const calc = hours * (hourlyRate || 120);
    setAmountStr(String(calc));
    setTitleNote(`อยู่ต่อ ${hours} ชม.`);
  };

  const handleSelectPreset = (preset: ExtraPreset) => {
    setLogType("EXTERNAL_CLINIC");
    setTitleNote(preset.title);
    setAmountStr(String(preset.default_amount));
    setPayoutChannel(preset.payout_channel);
    setIsPaid(false);
  };

  const visiblePresets = enableDirectWallet
    ? presets
    : presets.filter((p) => p.payout_channel === "HOSPITAL");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(amountStr);
    if (isNaN(amountNum) || amountNum <= 0) {
      alert("กรุณาระบุจำนวนเงินที่ถูกต้อง");
      return;
    }

    const finalChannel = enableDirectWallet ? payoutChannel : "HOSPITAL";

    try {
      setIsSubmitting(true);
      await onAddLog({
        period_id: periodId,
        line_user_id: lineUserId,
        work_date: workDate,
        log_type: logType,
        title_note: titleNote.trim() || LOG_TYPE_CONFIG[logType]?.label || "งานเสริม",
        amount: amountNum,
        payout_channel: finalChannel,
        is_paid: finalChannel === "HOSPITAL" ? true : isPaid,
      });
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      {/* Backdrop click to dismiss */}
      <div className="absolute inset-0" onClick={onClose} />

      <div className="relative w-full max-w-md bg-white dark:bg-[#0e1726] rounded-t-3xl border-t border-sky-100 dark:border-sky-900 z-10 max-h-[85dvh] flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-200 shadow-2xl">
        {/* Grab Handle */}
        <div className="w-12 h-1 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto mt-2.5 mb-1" />

        {/* Title Bar & Close (Fixed Header) */}
        <div className="shrink-0 flex items-center justify-between px-5 py-3 border-b border-sky-100 dark:border-sky-900">
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              {enableDirectWallet ? "จดงานงอก / เวรนอกด่วน" : "จด OT งอกด่วน"}
            </h2>
            <p className="text-[11px] text-slate-500">
              {enableDirectWallet ? "บันทึกเวรเสริมหรือ OT นอกตารางใน 3 คลิก" : "บันทึก OT เพิ่มเติมเข้าสลิปใน 3 คลิก"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl hover:bg-sky-50 dark:hover:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Container with Scrollable Body and Sticky Footer */}
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto overscroll-contain px-5 py-3 space-y-4">
            {/* STEP 1: ประเภทงาน */}
          <div>
            <label className="text-xs font-semibold text-slate-800 dark:text-slate-200 block mb-2">
              1. เลือกประเภทงาน
            </label>

            <div className={enableDirectWallet ? "grid grid-cols-2 gap-2" : "grid grid-cols-1 gap-2"}>
              <button
                type="button"
                onClick={() => handleSelectType("OT_HOURLY")}
                className={`min-h-[48px] p-2.5 rounded-xl border text-left flex items-center gap-2 text-xs font-medium transition-all active:scale-[0.97] ${
                  logType === "OT_HOURLY"
                    ? "bg-sky-50 dark:bg-sky-950/70 border-sky-500 text-sky-950 dark:text-sky-100 font-semibold shadow-2xs"
                    : "bg-white dark:bg-[#121c2c] border-sky-100 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-sky-50/50"
                }`}
              >
                <div className="w-7 h-7 rounded-lg bg-sky-100 dark:bg-sky-900/80 flex items-center justify-center shrink-0 text-sky-600 dark:text-sky-400">
                  <Clock className="w-3.5 h-3.5" strokeWidth={2} />
                </div>
                <span>OT อยู่ต่อ (ราย ชม.)</span>
              </button>

              {enableDirectWallet && (
                <>
                  <button
                    type="button"
                    onClick={() => handleSelectType("COVER_PEER")}
                    className={`min-h-[48px] p-2.5 rounded-xl border text-left flex items-center gap-2 text-xs font-medium transition-all active:scale-[0.97] ${
                      logType === "COVER_PEER"
                        ? "bg-sky-50 dark:bg-sky-950/70 border-sky-500 text-sky-950 dark:text-sky-100 font-semibold shadow-2xs"
                        : "bg-white dark:bg-[#121c2c] border-sky-100 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-sky-50/50"
                    }`}
                  >
                    <div className="w-7 h-7 rounded-lg bg-indigo-100 dark:bg-indigo-950 flex items-center justify-center shrink-0 text-indigo-600 dark:text-indigo-400">
                      <Users className="w-3.5 h-3.5" strokeWidth={2} />
                    </div>
                    <span>รับเวรแทนเพื่อน</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSelectType("EXTERNAL_CLINIC")}
                    className={`min-h-[48px] p-2.5 rounded-xl border text-left flex items-center gap-2 text-xs font-medium transition-all active:scale-[0.97] ${
                      logType === "EXTERNAL_CLINIC"
                        ? "bg-sky-50 dark:bg-sky-950/70 border-sky-500 text-sky-950 dark:text-sky-100 font-semibold shadow-2xs"
                        : "bg-white dark:bg-[#121c2c] border-sky-100 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-sky-50/50"
                    }`}
                  >
                    <div className="w-7 h-7 rounded-lg bg-amber-100 dark:bg-amber-950 flex items-center justify-center shrink-0 text-amber-600 dark:text-amber-400">
                      <Building2 className="w-3.5 h-3.5" strokeWidth={2} />
                    </div>
                    <span>เวรคลินิก / รพ.นอก</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSelectType("SELL_SHIFT")}
                    className={`min-h-[48px] p-2.5 rounded-xl border text-left flex items-center gap-2 text-xs font-medium transition-all active:scale-[0.97] ${
                      logType === "SELL_SHIFT"
                        ? "bg-rose-50 dark:bg-rose-950/70 border-rose-500 text-rose-950 dark:text-rose-100 font-semibold shadow-2xs"
                        : "bg-white dark:bg-[#121c2c] border-sky-100 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-rose-50/50"
                    }`}
                  >
                    <div className="w-7 h-7 rounded-lg bg-rose-100 dark:bg-rose-950 flex items-center justify-center shrink-0 text-rose-600 dark:text-rose-400">
                      <ArrowDownRight className="w-3.5 h-3.5" strokeWidth={2} />
                    </div>
                    <span>ขายเวร (หักยอด)</span>
                  </button>
                </>
              )}
            </div>

            {/* Presets */}
            {visiblePresets.length > 0 && (
              <div className="mt-2.5 pt-2 border-t border-sky-100 dark:border-sky-900/60">
                <span className="text-[10px] text-slate-400 block mb-1.5 font-medium">
                  ปุ่มลัดเวรประจำ:
                </span>
                <div className="flex flex-wrap gap-2">
                  {visiblePresets.map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => handleSelectPreset(preset)}
                      className="h-8 text-xs font-medium bg-[#f0f6fc] dark:bg-slate-800 hover:bg-sky-100/80 dark:hover:bg-slate-700 px-3 rounded-lg border border-sky-200/80 dark:border-slate-700 text-slate-800 dark:text-slate-200 transition-all flex items-center gap-1 active:scale-[0.96]"
                    >
                      <span>{preset.title}</span>
                      <strong className="text-sky-600 dark:text-sky-400 tabular-nums">฿{preset.default_amount}</strong>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* STEP 2: วันที่และจำนวนเงิน (44px touch friendly) */}
          <div className="space-y-2.5">
            <label className="text-xs font-semibold text-slate-800 dark:text-slate-200 block">
              2. วันที่และจำนวนเงิน
            </label>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="text-[10px] text-slate-500 block mb-1">วันที่ปฏิบัติงาน</span>
                <input
                  type="date"
                  value={workDate}
                  onChange={(e) => setWorkDate(e.target.value)}
                  className="w-full h-11 px-3 bg-[#f7fbfe] dark:bg-slate-900 border border-sky-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div>
                <span className="text-[10px] text-slate-500 block mb-1">จำนวนเงิน (บาท)</span>
                <div className="relative">
                  <span className="absolute left-3 top-3 text-slate-400 font-semibold text-xs">฿</span>
                  <input
                    type="number"
                    step="any"
                    value={amountStr}
                    onChange={(e) => setAmountStr(e.target.value)}
                    required
                    className="w-full h-11 pl-7 pr-3 bg-[#f7fbfe] dark:bg-slate-900 border border-sky-200 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500 tabular-nums"
                  />
                </div>
              </div>
            </div>

            {logType === "OT_HOURLY" && (
              <div className="flex items-center gap-2 pt-0.5">
                <span className="text-[11px] text-slate-500 font-medium">ปุ่มลัด ชม.:</span>
                <div className="flex gap-1.5">
                  {[1, 2, 4, 8].map((hr) => (
                    <button
                      key={hr}
                      type="button"
                      onClick={() => handleQuickHours(hr)}
                      className="h-8 px-3 text-xs font-semibold bg-[#f0f6fc] dark:bg-slate-800 hover:bg-sky-100 dark:hover:bg-slate-700 text-sky-800 dark:text-sky-300 rounded-lg border border-sky-200/80 dark:border-slate-700 active:scale-[0.96] transition-all tabular-nums"
                    >
                      {hr} ชม.
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div>
              <input
                type="text"
                placeholder="โน้ตช่วยจำ เช่น รับบ่ายแทนเนย, ผ่าตัดฉุกเฉิน..."
                value={titleNote}
                onChange={(e) => setTitleNote(e.target.value)}
                className="w-full h-11 px-3 bg-[#f7fbfe] dark:bg-slate-900 border border-sky-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>
          </div>

          {/* STEP 3: เลือกกระเป๋าเงิน (แสดงเฉพาะเมื่อเปิดใช้งานกระเป๋าที่ 2) */}
          {enableDirectWallet && (
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-800 dark:text-slate-200 block">
                3. เลือกกระเป๋าเงิน
              </label>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setPayoutChannel("HOSPITAL")}
                  className={`h-14 p-2.5 rounded-xl border text-center transition-all active:scale-[0.97] flex flex-col justify-center items-center ${
                    payoutChannel === "HOSPITAL"
                      ? "bg-sky-50 dark:bg-sky-950/70 border-sky-500 text-sky-950 dark:text-sky-100 font-semibold shadow-2xs"
                      : "bg-white dark:bg-[#121c2c] border-sky-100 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-sky-50/50"
                  }`}
                >
                  <div className="text-xs font-semibold">เข้าสลิปโรงพยาบาล</div>
                  <span className="text-[10px] text-sky-600 dark:text-sky-400 font-medium">(กระเป๋าที่ 1)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPayoutChannel("DIRECT")}
                  className={`h-14 p-2.5 rounded-xl border text-center transition-all active:scale-[0.97] flex flex-col justify-center items-center ${
                    payoutChannel === "DIRECT"
                      ? "bg-amber-50 dark:bg-amber-950/70 border-amber-500 text-amber-950 dark:text-amber-100 font-semibold shadow-2xs"
                      : "bg-white dark:bg-[#121c2c] border-sky-100 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-amber-50/50"
                  }`}
                >
                  <div className="text-xs font-semibold">รับโอนตรง / เงินสด</div>
                  <span className="text-[10px] text-amber-600 dark:text-amber-400 font-medium">(กระเป๋าที่ 2)</span>
                </button>
              </div>

              {payoutChannel === "DIRECT" && (
                <div className="p-3 bg-[#fffbf0] dark:bg-amber-950/20 rounded-xl border border-amber-200/80 dark:border-amber-900/40 flex items-center justify-between">
                  <span className="text-xs font-medium text-amber-900 dark:text-amber-200">
                    สถานะการรับเงิน
                  </span>

                  <button
                    type="button"
                    onClick={() => setIsPaid(!isPaid)}
                    className={`h-8 flex items-center gap-1 px-3 rounded-lg text-xs font-semibold transition-all active:scale-[0.96] ${
                      isPaid
                        ? "bg-emerald-600 text-white"
                        : "bg-amber-200/80 text-amber-900 border border-amber-300/60"
                    }`}
                  >
                    <Check className="w-3.5 h-3.5" strokeWidth={2.2} />
                    {isPaid ? "ได้รับแล้ว" : "ค้างรับ (รอโอน)"}
                  </button>
                </div>
              )}
            </div>
          )}

          </div>

          {/* Sticky Submit Button at bottom with safe-area padding */}
          <div className="shrink-0 p-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] border-t border-sky-100 dark:border-sky-900 bg-white/95 dark:bg-[#0e1726]/95 backdrop-blur-xs">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-12 bg-sky-600 hover:bg-sky-700 active:scale-[0.98] text-white font-semibold text-sm rounded-xl transition-all flex items-center justify-center gap-2 shadow-xs disabled:opacity-50"
            >
              <Check className="w-4 h-4" strokeWidth={2.2} />
              {isSubmitting ? "กำลังบันทึก..." : "บันทึกรายการ (จบใน 3 คลิก)"}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};
