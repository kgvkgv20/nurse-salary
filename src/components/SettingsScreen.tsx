"use client";

import React, { useState } from "react";
import {
  Save,
  Plus,
  Trash2,
  RotateCcw,
  Building2,
  Calendar,
  DollarSign,
  Briefcase,
  Check,
  User,
  Clock,
  Sun,
  Moon,
  Type,
  ArrowLeft,
} from "lucide-react";
import { ExtraPreset, ShiftCounts, ShiftRates, ShiftTimesMap, UserSettings } from "@/types";
import { formatBaht } from "@/lib/calculations";
import { AVAILABLE_FONTS, DEFAULT_SHIFT_TIMES, SHIFT_CONFIG } from "@/lib/constants";

interface SettingsScreenProps {
  settings: UserSettings;
  presets: ExtraPreset[];
  onSaveSettings: (newSettings: UserSettings) => Promise<void>;
  onAddPreset: (preset: Omit<ExtraPreset, "id" | "created_at">) => Promise<void>;
  onDeletePreset: (presetId: string) => Promise<void>;
  onResetData: () => void;
  isMock: boolean;
  theme?: "light" | "dark";
  onToggleTheme?: () => void;
  selectedFont?: string;
  onChangeFont?: (newFont: string) => void;
  onBackToDashboard?: () => void;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({
  settings,
  presets,
  onSaveSettings,
  onAddPreset,
  onDeletePreset,
  onResetData,
  isMock,
  theme = "light",
  onToggleTheme,
  selectedFont = "noto",
  onChangeFont,
  onBackToDashboard,
}) => {
  const [displayName, setDisplayName] = useState(settings.display_name);
  const [cutoffDay, setCutoffDay] = useState(settings.cutoff_start_day);
  const [payoutOffset, setPayoutOffset] = useState(settings.payout_month_offset);
  const [includeBaseSalary, setIncludeBaseSalary] = useState(settings.include_base_salary);
  const [baseSalary, setBaseSalary] = useState(settings.base_salary);
  const [rates, setRates] = useState<ShiftRates>({ ...settings.default_rates });

  const [shiftTimes, setShiftTimes] = useState<ShiftTimesMap>({
    ...DEFAULT_SHIFT_TIMES,
    ...(settings.shift_times || {}),
  });

  const [newPresetTitle, setNewPresetTitle] = useState("");
  const [newPresetAmount, setNewPresetAmount] = useState("");
  const [newPresetChannel, setNewPresetChannel] = useState<"HOSPITAL" | "DIRECT">("DIRECT");

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleRateChange = (key: keyof ShiftRates, val: string) => {
    const num = parseFloat(val);
    setRates((prev) => ({
      ...prev,
      [key]: isNaN(num) ? 0 : Math.max(0, num),
    }));
  };

  const handleShiftTimeChange = (key: keyof ShiftCounts, timeRange: string) => {
    setShiftTimes((prev) => ({
      ...prev,
      [key]: {
        hours: prev?.[key]?.hours ?? 8,
        timeRange,
      },
    }));
  };

  const handleShiftHoursChange = (key: keyof ShiftCounts, hoursStr: string) => {
    const hours = parseFloat(hoursStr) || 0;
    setShiftTimes((prev) => ({
      ...prev,
      [key]: {
        timeRange: prev?.[key]?.timeRange ?? "08:00 - 16:00",
        hours,
      },
    }));
  };

  const applyStandard8Hours = () => {
    setShiftTimes({
      m: { timeRange: "08:00 - 16:00", hours: 8 },
      a: { timeRange: "16:00 - 24:00", hours: 8 },
      n: { timeRange: "00:00 - 08:00", hours: 8 },
      ot_m: { timeRange: "08:00 - 16:00", hours: 8 },
      ot_a: { timeRange: "16:00 - 24:00", hours: 8 },
      ot_n: { timeRange: "00:00 - 08:00", hours: 8 },
      holiday: { timeRange: "ทั้งวัน / ตามเวร", hours: 0 },
    });
  };

  const applyLong12Hours = () => {
    setShiftTimes({
      m: { timeRange: "08:00 - 20:00", hours: 12 },
      a: { timeRange: "12:00 - 24:00", hours: 12 },
      n: { timeRange: "20:00 - 08:00", hours: 12 },
      ot_m: { timeRange: "08:00 - 20:00", hours: 12 },
      ot_a: { timeRange: "12:00 - 24:00", hours: 12 },
      ot_n: { timeRange: "20:00 - 08:00", hours: 12 },
      holiday: { timeRange: "ทั้งวัน (12 ชม.)", hours: 0 },
    });
  };

  const handleSaveAll = async () => {
    try {
      setIsSaving(true);
      await onSaveSettings({
        ...settings,
        display_name: displayName,
        cutoff_start_day: cutoffDay,
        payout_month_offset: payoutOffset,
        include_base_salary: includeBaseSalary,
        base_salary: baseSalary,
        default_rates: rates,
        shift_times: shiftTimes,
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddNewPreset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPresetTitle.trim()) return;
    const amount = parseFloat(newPresetAmount) || 0;
    await onAddPreset({
      line_user_id: settings.line_user_id,
      title: newPresetTitle.trim(),
      default_amount: amount,
      payout_channel: newPresetChannel,
      is_active: true,
    });
    setNewPresetTitle("");
    setNewPresetAmount("");
  };

  return (
    <div className="pb-32 pt-2 px-4 space-y-3">
      {/* Navigation & Header */}
      {onBackToDashboard && (
        <button
          onClick={onBackToDashboard}
          className="h-9 flex items-center gap-1.5 text-xs font-semibold text-sky-800 dark:text-sky-300 hover:text-sky-950 bg-white dark:bg-[#0e1726] px-3.5 rounded-xl border border-sky-100 dark:border-sky-900 transition-all active:scale-[0.96] shadow-2xs"
        >
          <ArrowLeft className="w-3.5 h-3.5" strokeWidth={2} />
          <span>กลับหน้าสรุปเงิน</span>
        </button>
      )}

      {/* Header */}
      <div className="bg-white dark:bg-[#0e1726] rounded-2xl p-4 border border-sky-100 dark:border-sky-900 shadow-2xs flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
            <span>ตั้งค่าระบบพื้นฐาน</span>
            {isMock && (
              <span className="text-[10px] font-medium bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-400 px-2 py-0.2 rounded-full border border-amber-200 dark:border-amber-800">
                Mock
              </span>
            )}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            รอบตัดวิก เรตค่าเวร เวลาทำงาน และคลินิกประจำ
          </p>
        </div>

        <button
          onClick={handleSaveAll}
          disabled={isSaving}
          className="h-9 flex items-center gap-1.5 px-3.5 bg-sky-600 hover:bg-sky-700 active:scale-[0.96] text-white text-xs font-semibold rounded-xl transition-all shadow-2xs"
        >
          {saveSuccess ? <Check className="w-4 h-4" strokeWidth={2} /> : <Save className="w-4 h-4" strokeWidth={2} />}
          <span>{saveSuccess ? "บันทึกแล้ว" : isSaving ? "กำลังบันทึก..." : "บันทึก"}</span>
        </button>
      </div>

      {/* Theme Switcher Card */}
      <div className="bg-white dark:bg-[#0e1726] rounded-2xl p-4 border border-sky-100 dark:border-sky-900 shadow-2xs flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-sky-50 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300">
            {theme === "dark" ? <Moon className="w-4 h-4 text-sky-400" /> : <Sun className="w-4 h-4 text-amber-500" />}
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-900 dark:text-slate-100 block">
              {theme === "dark" ? "โหมดเวรดึก (Dark)" : "โหมดสว่าง ฟ้าขาว (Light)"}
            </span>
            <span className="text-[11px] text-slate-500">
              {theme === "dark" ? "ลดแสงหน้าจอ ถนอมสายตาช่วงดึก" : "สบายตา สะอาด นวลตา สไตล์การแพทย์"}
            </span>
          </div>
        </div>

        {onToggleTheme && (
          <button
            type="button"
            onClick={onToggleTheme}
            className="h-9 px-3 rounded-xl text-xs font-semibold bg-sky-50 dark:bg-slate-800 hover:bg-sky-100 dark:hover:bg-slate-700 text-sky-800 dark:text-slate-200 border border-sky-200/80 dark:border-slate-700 transition-all active:scale-[0.96]"
          >
            {theme === "dark" ? "สลับเป็นฟ้าขาว" : "สลับเป็นโหมดดึก"}
          </button>
        )}
      </div>

      {/* Font / Typography Selector Card */}
      <div className="bg-white dark:bg-[#0e1726] rounded-2xl p-4 border border-sky-100 dark:border-sky-900 shadow-2xs space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-sky-50 dark:bg-slate-800 flex items-center justify-center text-sky-600 dark:text-sky-400">
            <Type className="w-4 h-4" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-900 dark:text-slate-100 block">
              แบบตัวอักษรของระบบ (Typography)
            </span>
            <span className="text-[11px] text-slate-500">
              เลือกฟอนต์ภาษาไทยและตัวเลขที่อ่านสบายตาที่สุดสำหรับคุณ
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
          {AVAILABLE_FONTS.map((f) => {
            const isSelected = selectedFont === f.key;
            return (
              <button
                key={f.key}
                type="button"
                onClick={() => {
                  if (onChangeFont) onChangeFont(f.key);
                }}
                className={`text-left p-3 rounded-xl border transition-all active:scale-[0.98] ${
                  isSelected
                    ? "bg-sky-50 dark:bg-sky-950/70 border-sky-400 dark:border-sky-600 shadow-xs ring-1 ring-sky-400"
                    : "bg-[#f8fafd] dark:bg-slate-900/60 hover:bg-sky-50/50 dark:hover:bg-slate-800 border-sky-100/80 dark:border-slate-800"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                      {f.nameTh}
                    </span>
                    <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full bg-sky-100/80 dark:bg-sky-900/80 text-sky-700 dark:text-sky-300 border border-sky-200/60 dark:border-sky-800/60">
                      {f.tag}
                    </span>
                  </div>
                  {isSelected && <Check className="w-4 h-4 text-sky-600 dark:text-sky-400" strokeWidth={2.5} />}
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight mb-1.5">
                  {f.subTh}
                </p>
                <div className="text-xs font-medium text-slate-700 dark:text-slate-300 bg-white/80 dark:bg-slate-800/80 px-2 py-1 rounded border border-sky-100/60 dark:border-slate-700/60 truncate">
                  {f.preview}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Profile info */}
      <div className="bg-white dark:bg-[#0e1726] rounded-2xl p-4 border border-sky-100 dark:border-sky-900 shadow-2xs space-y-2.5">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-900 dark:text-slate-100">
          <User className="w-4 h-4 text-sky-600 dark:text-sky-400" strokeWidth={1.8} />
          <span>ข้อมูลผู้ใช้</span>
        </div>

        <div>
          <label className="text-[11px] text-slate-500 block mb-1">
            ชื่อแสดงผล
          </label>
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="w-full h-11 px-3 bg-[#f7fbfe] dark:bg-slate-900 border border-sky-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
        </div>
      </div>

      {/* 1. Shift Times & Hours */}
      <div className="bg-white dark:bg-[#0e1726] rounded-2xl p-4 border border-sky-100 dark:border-sky-900 shadow-2xs space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-900 dark:text-slate-100">
            <Clock className="w-4 h-4 text-sky-600 dark:text-sky-400" strokeWidth={1.8} />
            <span>ช่วงเวลาและชั่วโมงของแต่ละเวร</span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={applyStandard8Hours}
              className="h-7 text-[11px] font-semibold bg-sky-50 dark:bg-slate-800 hover:bg-sky-100 text-sky-800 dark:text-sky-300 px-2.5 rounded-lg border border-sky-200/80 dark:border-slate-700 transition-all active:scale-[0.96]"
            >
              กะ 8 ชม.
            </button>
            <button
              type="button"
              onClick={applyLong12Hours}
              className="h-7 text-[11px] font-semibold bg-sky-50 dark:bg-slate-800 hover:bg-sky-100 text-sky-800 dark:text-sky-300 px-2.5 rounded-lg border border-sky-200/80 dark:border-slate-700 transition-all active:scale-[0.96]"
            >
              กะ 12 ชม.
            </button>
          </div>
        </div>

        <p className="text-[11px] text-slate-500">
          ปรับเวลาเริ่ม-เลิกเวร และจำนวนชั่วโมงทำงานต่อกะ เพื่อคำนวณชั่วโมงชีวิตได้ตรงตามจริง
        </p>

        <div className="space-y-2 pt-1">
          {SHIFT_CONFIG.filter((s) => s.key !== "holiday").map((shift) => {
            const currentConf = shiftTimes?.[shift.key] || {
              timeRange: shift.defaultTime,
              hours: 8,
            };

            return (
              <div
                key={shift.key}
                className="bg-[#f0f6fc]/80 dark:bg-slate-800/60 p-2.5 rounded-xl border border-sky-100 dark:border-slate-700/60 flex items-center justify-between gap-2"
              >
                <div className="flex items-center gap-2 min-w-[85px]">
                  <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-white dark:bg-slate-700 text-sky-800 dark:text-sky-300 font-semibold border border-sky-100">
                    {shift.badge}
                  </span>
                  <span className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                    {shift.label.split(" ")[0]}
                  </span>
                </div>

                <div className="flex items-center gap-2 flex-1 justify-end">
                  <input
                    type="text"
                    value={currentConf.timeRange}
                    onChange={(e) => handleShiftTimeChange(shift.key, e.target.value)}
                    className="w-full max-w-[130px] h-9 px-2 bg-white dark:bg-slate-900 border border-sky-200 dark:border-slate-700 rounded-lg text-xs font-medium text-slate-900 dark:text-slate-100 text-center"
                  />

                  <div className="flex items-center gap-1 w-[65px]">
                    <input
                      type="number"
                      step="any"
                      min="1"
                      max="24"
                      value={currentConf.hours}
                      onChange={(e) => handleShiftHoursChange(shift.key, e.target.value)}
                      className="w-10 h-9 px-1 bg-white dark:bg-slate-900 border border-sky-200 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-900 dark:text-slate-100 text-center tabular-nums"
                    />
                    <span className="text-[10px] text-slate-500">ชม.</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. Cutoff & Payout Lag */}
      <div className="bg-white dark:bg-[#0e1726] rounded-2xl p-4 border border-sky-100 dark:border-sky-900 shadow-2xs space-y-2.5">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-900 dark:text-slate-100">
          <Calendar className="w-4 h-4 text-sky-600 dark:text-sky-400" strokeWidth={1.8} />
          <span>รอบตัดวิกและเดือนที่เงินออก</span>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          <div>
            <label className="text-[11px] text-slate-500 block mb-1">
              วันเริ่มตัดยอด
            </label>
            <select
              value={cutoffDay}
              onChange={(e) => setCutoffDay(parseInt(e.target.value, 10))}
              className="w-full h-11 px-2.5 bg-[#f7fbfe] dark:bg-slate-900 border border-sky-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500"
            >
              {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                <option key={d} value={d}>
                  วันที่ {d}
                </option>
              ))}
            </select>
            <span className="text-[10px] text-slate-400 mt-1 block">
              เช่น วันที่ 21 (วิก 21 ถึง 20)
            </span>
          </div>

          <div>
            <label className="text-[11px] text-slate-500 block mb-1">
              เดือนที่เงินออก
            </label>
            <select
              value={payoutOffset}
              onChange={(e) => setPayoutOffset(parseInt(e.target.value, 10))}
              className="w-full h-11 px-2.5 bg-[#f7fbfe] dark:bg-slate-900 border border-sky-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500"
            >
              <option value={1}>ออกเดือนถัดไป (+1)</option>
              <option value={0}>ออกในเดือนเดียวกัน</option>
            </select>
            <span className="text-[10px] text-slate-400 mt-1 block">
              รองรับรอบจ่ายเงินเหลื่อมเดือน
            </span>
          </div>
        </div>
      </div>

      {/* 3. Base Salary */}
      <div className="bg-white dark:bg-[#0e1726] rounded-2xl p-4 border border-sky-100 dark:border-sky-900 shadow-2xs space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-900 dark:text-slate-100">
            <DollarSign className="w-4 h-4 text-sky-600 dark:text-sky-400" strokeWidth={1.8} />
            <span>ฐานเงินเดือนประจำ</span>
          </div>

          <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700 dark:text-slate-300">
            <input
              type="checkbox"
              checked={includeBaseSalary}
              onChange={(e) => setIncludeBaseSalary(e.target.checked)}
              className="w-4 h-4 rounded text-sky-600 focus:ring-sky-500"
            />
            <span>รวมเทียบในสลิป</span>
          </label>
        </div>

        {includeBaseSalary && (
          <div>
            <label className="text-[11px] text-slate-500 block mb-1">
              เงินเดือนฐาน (บาท)
            </label>
            <input
              type="number"
              step="any"
              value={baseSalary}
              onChange={(e) => setBaseSalary(parseFloat(e.target.value) || 0)}
              className="w-full h-11 px-3 bg-[#f7fbfe] dark:bg-slate-900 border border-sky-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500 tabular-nums"
            />
          </div>
        )}
      </div>

      {/* 4. Shift Rates */}
      <div className="bg-white dark:bg-[#0e1726] rounded-2xl p-4 border border-sky-100 dark:border-sky-900 shadow-2xs space-y-2.5">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-900 dark:text-slate-100">
          <Briefcase className="w-4 h-4 text-sky-600 dark:text-sky-400" strokeWidth={1.8} />
          <span>เรตค่าเวรมาตรฐาน (บาท/เวร)</span>
        </div>
        <p className="text-[11px] text-slate-400">
          * หากเวรใดรวมอยู่ในฐานเงินเดือนแล้ว ให้ใส่ 0 บาท ระบบจะซ่อนให้เองในหน้านับเวร
        </p>

        <div className="grid grid-cols-2 gap-2">
          {SHIFT_CONFIG.map((shift) => (
            <div key={shift.key} className="bg-[#f0f6fc]/80 dark:bg-slate-800/60 p-2.5 rounded-xl border border-sky-100 dark:border-slate-700/60">
              <label className="text-[11px] font-medium text-slate-700 dark:text-slate-300 flex items-center justify-between mb-1">
                <span>{shift.label}</span>
                <span className="text-[9px] px-1.5 py-0.2 rounded-md bg-white dark:bg-slate-700 text-sky-800 dark:text-sky-300 font-semibold">{shift.badge}</span>
              </label>
              <div className="relative">
                <span className="absolute left-2.5 top-2 text-slate-400 text-xs">฿</span>
                <input
                  type="number"
                  min="0"
                  value={rates[shift.key] ?? 0}
                  onChange={(e) => handleRateChange(shift.key, e.target.value)}
                  className="w-full h-9 pl-6 pr-2 bg-white dark:bg-slate-900 border border-sky-200 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-900 dark:text-slate-100 tabular-nums"
                />
              </div>
            </div>
          ))}

          {/* OT Hourly Rate */}
          <div className="bg-[#f0f6fc]/80 dark:bg-slate-800/60 p-2.5 rounded-xl border border-sky-100 dark:border-slate-700/60 col-span-2">
            <label className="text-[11px] font-medium text-slate-700 dark:text-slate-300 block mb-1">
              เรต OT รายชั่วโมง (บาท/ชั่วโมง)
            </label>
            <div className="relative">
              <span className="absolute left-2.5 top-2 text-slate-400 text-xs">฿</span>
              <input
                type="number"
                min="0"
                value={rates.ot_hr ?? 120}
                onChange={(e) => handleRateChange("ot_hr", e.target.value)}
                className="w-full h-9 pl-6 pr-2 bg-white dark:bg-slate-900 border border-sky-200 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-900 dark:text-slate-100 tabular-nums"
              />
            </div>
          </div>
        </div>
      </div>

      {/* 5. Presets */}
      <div className="bg-white dark:bg-[#0e1726] rounded-2xl p-4 border border-sky-100 dark:border-sky-900 shadow-2xs space-y-2.5">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-900 dark:text-slate-100">
          <Building2 className="w-4 h-4 text-sky-600 dark:text-sky-400" strokeWidth={1.8} />
          <span>รายการเวรนอกและคลินิกประจำ (Presets)</span>
        </div>

        <div className="space-y-1.5">
          {presets.map((preset) => (
            <div
              key={preset.id}
              className="flex items-center justify-between p-2.5 rounded-xl bg-[#f0f6fc]/70 dark:bg-slate-800/60 border border-sky-100 dark:border-slate-700/60 text-xs"
            >
              <div>
                <span className="font-semibold text-slate-900 dark:text-slate-100">
                  {preset.title}
                </span>
                <div className="text-[10px] text-slate-500 tabular-nums mt-0.5">
                  ฿{formatBaht(preset.default_amount)} •{" "}
                  {preset.payout_channel === "HOSPITAL" ? "เข้าสลิป" : "รับโอนตรง"}
                </div>
              </div>

              <button
                onClick={() => onDeletePreset(preset.id)}
                className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-rose-500 rounded-lg transition-colors"
                title="ลบรายการนี้"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>

        {/* Add Preset Form */}
        <form onSubmit={handleAddNewPreset} className="pt-2 border-t border-sky-100 dark:border-sky-900/60 space-y-2">
          <span className="text-[11px] text-slate-500 block font-medium">
            + เพิ่มคลินิกหรือเวรประจำใหม่:
          </span>
          <div className="grid grid-cols-2 gap-2">
            <input
              type="text"
              placeholder="ชื่อคลินิก / รายการ"
              value={newPresetTitle}
              onChange={(e) => setNewPresetTitle(e.target.value)}
              className="h-10 px-3 bg-[#f7fbfe] dark:bg-slate-900 border border-sky-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100"
            />
            <input
              type="number"
              placeholder="เรตค่าจ้าง (บาท)"
              value={newPresetAmount}
              onChange={(e) => setNewPresetAmount(e.target.value)}
              className="h-10 px-3 bg-[#f7fbfe] dark:bg-slate-900 border border-sky-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 tabular-nums"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={newPresetChannel}
              onChange={(e) => setNewPresetChannel(e.target.value as any)}
              className="h-10 px-3 bg-[#f7fbfe] dark:bg-slate-900 border border-sky-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 flex-1"
            >
              <option value="DIRECT">รับโอนตรง / เงินสด</option>
              <option value="HOSPITAL">เข้าสลิปโรงพยาบาล</option>
            </select>
            <button
              type="submit"
              className="h-10 px-4 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-semibold active:scale-[0.96] transition-all shadow-2xs"
            >
              เพิ่ม
            </button>
          </div>
        </form>
      </div>

      {/* 6. Reset Test Data */}
      <div className="bg-[#f0f6fc]/60 dark:bg-slate-800/40 rounded-2xl p-4 border border-sky-100 dark:border-slate-800 space-y-2 text-center">
        <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">
          จัดการข้อมูลและทดสอบระบบ
        </span>
        <p className="text-[11px] text-slate-400">
          หากต้องการล้างข้อมูลและเริ่มต้นข้อมูลตัวอย่างใหม่สำหรับการสาธิต
        </p>
        <button
          onClick={() => {
            if (confirm("ต้องการรีเซ็ตข้อมูลตัวอย่างทั้งหมดหรือไม่?")) {
              onResetData();
            }
          }}
          className="h-9 inline-flex items-center gap-1.5 text-xs text-rose-600 dark:text-rose-400 font-medium px-3 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-white dark:bg-slate-900 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>รีเซ็ตเป็นข้อมูลตัวอย่าง</span>
        </button>
      </div>
    </div>
  );
};
