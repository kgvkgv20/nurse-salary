"use client";

import React, { useState } from "react";
import { Minus, Plus, Save, Eye, EyeOff, Check, ArrowLeft, Wand2, RotateCcw } from "lucide-react";
import { PayPeriod, ShiftCounts, ShiftRates, UserSettings } from "@/types";
import { formatBaht } from "@/lib/calculations";
import { DEFAULT_SHIFT_COUNTS, SHIFT_CONFIG } from "@/lib/constants";

interface ShiftTallyScreenProps {
  period: PayPeriod;
  settings: UserSettings;
  onSaveShiftCounts: (counts: ShiftCounts, ratesSnapshot: ShiftRates) => Promise<void>;
  onBackToDashboard: () => void;
}

export const ShiftTallyScreen: React.FC<ShiftTallyScreenProps> = ({
  period,
  settings,
  onSaveShiftCounts,
  onBackToDashboard,
}) => {
  const rates: ShiftRates = period.rates_snapshot || settings.default_rates;

  const [counts, setCounts] = useState<ShiftCounts>({ ...period.shift_counts });
  const [inputDrafts, setInputDrafts] = useState<{ [key in keyof ShiftCounts]?: string }>({});
  const [showZeroRates, setShowZeroRates] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);

  React.useEffect(() => {
    setCounts({ ...period.shift_counts });
    setInputDrafts({});
  }, [period.id, period.period_key]);

  const visibleShifts = SHIFT_CONFIG.filter((shift) => {
    const rate = rates[shift.key] || 0;
    if (rate > 0) return true;
    return showZeroRates;
  });

  const zeroRateCount = SHIFT_CONFIG.filter((shift) => (rates[shift.key] || 0) === 0).length;

  const handleIncrement = (key: keyof ShiftCounts) => {
    setInputDrafts((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
    setCounts((prev) => ({
      ...prev,
      [key]: (prev[key] || 0) + 1,
    }));
    setSavedSuccess(false);
  };

  const handleDecrement = (key: keyof ShiftCounts) => {
    setInputDrafts((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
    setCounts((prev) => ({
      ...prev,
      [key]: Math.max(0, (prev[key] || 0) - 1),
    }));
    setSavedSuccess(false);
  };

  const handleDirectChange = (key: keyof ShiftCounts, valStr: string) => {
    setInputDrafts((prev) => ({ ...prev, [key]: valStr }));
    if (valStr.trim() !== "") {
      const parsed = parseInt(valStr, 10);
      if (!isNaN(parsed)) {
        setCounts((prev) => ({
          ...prev,
          [key]: Math.max(0, parsed),
        }));
      }
    }
    setSavedSuccess(false);
  };

  const handleInputBlur = (key: keyof ShiftCounts) => {
    const raw = inputDrafts[key];
    if (raw !== undefined) {
      const parsed = parseInt(raw, 10);
      setCounts((prev) => ({
        ...prev,
        [key]: isNaN(parsed) ? 0 : Math.max(0, parsed),
      }));
      setInputDrafts((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  };

  const handleApplyQuickPattern = () => {
    if (window.confirm("ต้องการใส่ข้อมูล 'เวรตัวอย่าง' หรือไม่? ยอดเวรที่กรอกไว้ในรอบนี้จะถูกแทนที่")) {
      setCounts({
        m: 0,
        a: 10,
        n: 8,
        ot_m: 2,
        ot_a: 4,
        ot_n: 3,
        holiday: 2,
      });
      setSavedSuccess(false);
    }
  };

  const handleClearAll = () => {
    if (window.confirm("ต้องการล้างจำนวนเวรทั้งหมดในรอบนี้ให้เป็น 0 หรือไม่?")) {
      setCounts({ ...DEFAULT_SHIFT_COUNTS });
      setSavedSuccess(false);
    }
  };

  const liveTotal = Object.keys(counts).reduce((sum, k) => {
    const key = k as keyof ShiftCounts;
    const count = counts[key] || 0;
    const rate = rates[key] || 0;
    return sum + count * rate;
  }, 0);

  const totalShiftCount = Object.values(counts).reduce((a, b) => a + b, 0);

  const handleSave = async () => {
    try {
      setIsSaving(true);
      await onSaveShiftCounts(counts, rates);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2500);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="pb-32 pt-2 px-4 space-y-3">
      {/* Title & Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBackToDashboard}
          className="h-9 flex items-center gap-1.5 text-xs font-medium text-sky-800 dark:text-sky-300 hover:text-sky-950 bg-white dark:bg-[#0e1726] px-3 rounded-xl border border-sky-100 dark:border-sky-900 transition-all active:scale-[0.96] shadow-2xs"
        >
          <ArrowLeft className="w-3.5 h-3.5" strokeWidth={2} />
          <span>กลับหน้าสรุปยอด</span>
        </button>

        {zeroRateCount > 0 && (
          <button
            onClick={() => setShowZeroRates(!showZeroRates)}
            className="h-9 flex items-center gap-1.5 text-[11px] font-medium text-slate-600 dark:text-slate-400 bg-white dark:bg-[#0e1726] px-3 rounded-xl border border-sky-100 dark:border-sky-900 transition-all active:scale-[0.96] shadow-2xs"
          >
            {showZeroRates ? (
              <EyeOff className="w-3.5 h-3.5" strokeWidth={1.8} />
            ) : (
              <Eye className="w-3.5 h-3.5" strokeWidth={1.8} />
            )}
            <span>{showZeroRates ? "ซ่อนเวร 0 บ." : `เวร 0 บ. (${zeroRateCount})`}</span>
          </button>
        )}
      </div>

      <div className="bg-white dark:bg-[#0e1726] rounded-2xl p-4 border border-sky-100 dark:border-sky-900 shadow-2xs">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              นับเวรตามตารางประจำรอบ
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              กดปุ่ม + - เพื่อสรุปยอดเวรของวิกนี้
            </p>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={handleApplyQuickPattern}
              className="h-8 flex items-center gap-1 text-[11px] font-medium bg-sky-50 dark:bg-slate-800 hover:bg-sky-100 text-sky-800 dark:text-sky-300 px-2.5 rounded-lg border border-sky-200/80 dark:border-slate-700 active:scale-[0.96] transition-all"
              title="ใส่ข้อมูลเวรตัวอย่างสำหรับทดสอบ"
            >
              <Wand2 className="w-3 h-3 text-sky-600 dark:text-sky-400" strokeWidth={1.8} />
              <span>เวรตัวอย่าง</span>
            </button>
            <button
              onClick={handleClearAll}
              className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-rose-500 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
              title="ล้างยอดเป็น 0"
            >
              <RotateCcw className="w-3.5 h-3.5" strokeWidth={1.8} />
            </button>
          </div>
        </div>
      </div>

      {/* Tally Stepper List with generous 44px touch ergonomics */}
      <div className="space-y-2.5">
        {visibleShifts.map((shift) => {
          const count = counts[shift.key] || 0;
          const rate = rates[shift.key] || 0;
          const rowTotal = count * rate;
          const isZeroRate = rate === 0;
          const timeConfig = settings.shift_times?.[shift.key];
          const timeLabel = timeConfig ? `${timeConfig.timeRange} (${timeConfig.hours} ชม.)` : shift.defaultTime;

          return (
            <div
              key={shift.key}
              className={`p-3.5 rounded-2xl border transition-all ${
                count > 0
                  ? "bg-white dark:bg-[#0e1726] border-sky-300 dark:border-sky-800 shadow-2xs"
                  : "bg-white dark:bg-[#0e1726] border-sky-100/90 dark:border-sky-950/90"
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-lg bg-sky-50 dark:bg-sky-950 text-sky-800 dark:text-sky-300 border border-sky-200/60 dark:border-sky-800">
                    {shift.badge}
                  </span>
                  <div>
                    <h3 className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                      {shift.label}
                    </h3>
                    <p className="text-[11px] text-slate-500 flex items-center gap-1">
                      <span>{isZeroRate ? "รวมในฐานเงินเดือน" : `฿${formatBaht(rate)}/เวร`}</span>
                      <span>•</span>
                      <span>{timeLabel}</span>
                    </p>
                    {shift.key === "ot_n" && (
                      <span className="text-[10px] text-indigo-600 dark:text-indigo-400 block font-medium mt-0.5">
                        💡 นับรวม: OT ดึกเดี่ยว หรือ กะเช้าแล้วต่อ OT ดึก (ช.-ด.)
                      </span>
                    )}
                    {shift.key === "ot_a" && (
                      <span className="text-[10px] text-cyan-600 dark:text-cyan-400 block font-medium mt-0.5">
                        💡 นับรวม: OT บ่ายเดี่ยว หรือ ควงเช้าต่อบ่าย 16 ชม. (ช.-บ.)
                      </span>
                    )}
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-xs font-bold text-slate-900 dark:text-slate-100 tabular-nums">
                    ฿{formatBaht(rowTotal)}
                  </div>
                  <span className="text-[10px] text-slate-400 tabular-nums">
                    {count} เวร × {formatBaht(rate)}
                  </span>
                </div>
              </div>

              {/* Stepper Control: Min 44px tap targets */}
              <div className="flex items-center justify-between mt-2.5 pt-2.5 border-t border-sky-100/80 dark:border-sky-950/80">
                <span className="text-xs font-medium text-slate-600 dark:text-slate-400">จำนวนเวร:</span>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleDecrement(shift.key)}
                    disabled={count <= 0}
                    aria-label={`ลดจำนวน ${shift.label}`}
                    className="w-11 h-11 rounded-xl bg-sky-50 dark:bg-slate-800 hover:bg-sky-100 dark:hover:bg-slate-700 active:scale-[0.93] flex items-center justify-center text-slate-700 dark:text-slate-200 disabled:opacity-30 disabled:pointer-events-none transition-all border border-sky-100 dark:border-slate-700 shadow-2xs"
                  >
                    <Minus className="w-4 h-4" strokeWidth={2.2} />
                  </button>

                  <input
                    type="number"
                    min="0"
                    value={inputDrafts[shift.key] !== undefined ? inputDrafts[shift.key] : count}
                    onChange={(e) => handleDirectChange(shift.key, e.target.value)}
                    onBlur={() => handleInputBlur(shift.key)}
                    className="w-14 h-11 text-center font-bold text-base bg-[#f7fbfe] dark:bg-slate-900 border border-sky-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500 tabular-nums shadow-inner"
                  />

                  <button
                    onClick={() => handleIncrement(shift.key)}
                    aria-label={`เพิ่มจำนวน ${shift.label}`}
                    className="w-11 h-11 rounded-xl bg-sky-600 hover:bg-sky-700 active:scale-[0.93] flex items-center justify-center text-white transition-all shadow-2xs"
                  >
                    <Plus className="w-4 h-4" strokeWidth={2.2} />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Sticky Bottom Footer (Elevated and thumb-friendly) */}
      <div className="fixed bottom-14 left-0 right-0 z-30 bg-white/95 dark:bg-[#0e1726]/95 backdrop-blur-md border-t border-sky-100 dark:border-sky-900/80 p-3.5 shadow-md">
        <div className="max-w-md mx-auto flex items-center justify-between gap-3">
          <div>
            <div className="text-[11px] text-slate-500">
              รวม {totalShiftCount} เวรตาราง
            </div>
            <div className="text-lg font-bold text-slate-900 dark:text-slate-100 leading-tight tabular-nums">
              ฿{formatBaht(liveTotal)}
            </div>
          </div>

          <button
            onClick={handleSave}
            disabled={isSaving}
            className={`h-11 px-5 rounded-xl font-semibold text-xs transition-all flex items-center gap-1.5 active:scale-[0.96] shadow-2xs ${
              savedSuccess
                ? "bg-emerald-600 text-white"
                : "bg-sky-600 hover:bg-sky-700 text-white"
            }`}
          >
            {savedSuccess ? (
              <>
                <Check className="w-4 h-4" strokeWidth={2} /> บันทึกแล้ว
              </>
            ) : isSaving ? (
              "กำลังบันทึก..."
            ) : (
              <>
                <Save className="w-4 h-4" strokeWidth={2} /> บันทึกยอดเวร
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
