"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  User,
  Sun,
  Moon,
  X,
  Stethoscope,
  Settings,
} from "lucide-react";
import { PeriodInfo } from "@/types";
import { THAI_MONTH_SHORT } from "@/lib/constants";

interface PeriodHeaderProps {
  periodInfo: PeriodInfo;
  onPrevPeriod: () => void;
  onNextPeriod: () => void;
  onSelectPeriodKey?: (newKey: string) => void;
  displayName: string;
  isMock: boolean;
  onOpenSettings: () => void;
  theme: "light" | "dark";
  onToggleTheme: () => void;
  selectedFont?: string;
  onChangeFont?: (newFont: string) => void;
}

export const PeriodHeader: React.FC<PeriodHeaderProps> = ({
  periodInfo,
  onPrevPeriod,
  onNextPeriod,
  onSelectPeriodKey,
  displayName,
  isMock,
  onOpenSettings,
  theme,
  onToggleTheme,
  selectedFont = "noto",
  onChangeFont,
}) => {
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Parse current year & month from periodKey 'YYYY-MM'
  const [currentYear, currentMonthStr] = periodInfo.periodKey.split("-");
  const [pickerYear, setPickerYear] = useState<number>(parseInt(currentYear, 10));
  const currentMonthNum = parseInt(currentMonthStr, 10);

  const handleSelectMonth = (monthIndex: number) => {
    const monthFormatted = String(monthIndex + 1).padStart(2, "0");
    const newKey = `${pickerYear}-${monthFormatted}`;
    if (onSelectPeriodKey) {
      onSelectPeriodKey(newKey);
    }
    setIsPickerOpen(false);
  };

  return (
    <header className="sticky top-0 z-30 bg-white/95 dark:bg-[#0e1726]/95 backdrop-blur-md border-b border-sky-100/80 dark:border-sky-950/80 px-4 pt-3 pb-3 transition-colors">
      {/* Top Bar: Brand, User & Theme Toggle */}
      <div className="flex items-center justify-between mb-2.5">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-sky-50 dark:bg-sky-950/80 border border-sky-100 dark:border-sky-800/60 flex items-center justify-center text-sky-600 dark:text-sky-400 shadow-2xs">
            <Stethoscope className="w-4 h-4" strokeWidth={1.8} />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-semibold tracking-tight text-slate-900 dark:text-slate-100">
                NursePay
              </span>
              <span className="text-[10px] font-medium text-sky-700 dark:text-sky-300 bg-sky-50 dark:bg-sky-950/70 px-1.5 py-0.5 rounded border border-sky-100 dark:border-sky-800/60">
                คำนวณค่าเวร
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
              กระทบยอดสลิป & เวรนอก
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Theme Switcher (Comfortable Mobile Touch Target) */}
          <button
            onClick={onToggleTheme}
            aria-label="สลับโหมดแสงสว่างหรือเวรดึก"
            className="w-9 h-9 rounded-xl bg-sky-50/80 dark:bg-slate-800/80 hover:bg-sky-100 dark:hover:bg-slate-700 active:scale-[0.96] transition-all flex items-center justify-center text-slate-600 dark:text-slate-300 border border-sky-100/80 dark:border-slate-700/60"
            title={theme === "dark" ? "เปลี่ยนเป็นโหมดสว่าง ฟ้าขาว" : "เปลี่ยนเป็นโหมดเวรดึก (Dark mode)"}
          >
            {theme === "dark" ? (
              <Sun className="w-4 h-4 text-amber-400" strokeWidth={1.8} />
            ) : (
              <Moon className="w-4 h-4 text-sky-700" strokeWidth={1.8} />
            )}
          </button>

          {/* User Profile & Settings */}
          <button
            onClick={onOpenSettings}
            className="h-9 flex items-center gap-1.5 bg-sky-50/80 dark:bg-slate-800/80 hover:bg-sky-100 dark:hover:bg-slate-700 active:scale-[0.96] transition-all text-xs font-semibold px-2.5 rounded-xl border border-sky-100/90 dark:border-slate-700/60 text-slate-800 dark:text-slate-200 group"
            title="ตั้งค่ารอบเวร เรตค่าเวร และระบบ"
          >
            <User className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" strokeWidth={2} />
            <span className="max-w-[75px] sm:max-w-[100px] truncate font-medium">{displayName}</span>
            <Settings className="w-3 h-3 text-slate-400 group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors" />
            {isMock && (
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" title="โหมดจำลอง (Mock)" />
            )}
          </button>
        </div>
      </div>

      {/* Period Selector Bar (Card style with large touch buttons) */}
      <div className="bg-[#f0f6fc] dark:bg-[#131d2e] rounded-xl p-1.5 border border-sky-100 dark:border-sky-900/60 flex items-center justify-between">
        <button
          onClick={onPrevPeriod}
          aria-label="รอบเดือนก่อนหน้า"
          className="w-10 h-9 rounded-lg hover:bg-white dark:hover:bg-slate-800 active:scale-[0.96] flex items-center justify-center text-slate-600 dark:text-slate-300 border border-transparent hover:border-sky-100 dark:hover:border-slate-700 transition-all"
        >
          <ChevronLeft className="w-4 h-4" strokeWidth={2} />
        </button>

        {/* Center: Month + Year Trigger */}
        <button
          onClick={() => setIsPickerOpen(true)}
          className="flex-1 py-1 px-2 rounded-lg hover:bg-white/80 dark:hover:bg-slate-800/70 transition-all text-center"
        >
          <div className="flex items-center justify-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" strokeWidth={1.8} />
            <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
              {periodInfo.payoutMonthNameTh}
            </span>
            <span className="text-[10px] font-semibold text-sky-700 dark:text-sky-300 bg-sky-50 dark:bg-sky-950/80 px-2 py-0.5 rounded-full border border-sky-200/60 dark:border-sky-800">
              รอบเงินออก
            </span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
            รอบเวร: {periodInfo.shiftRangeLabelTh}
          </p>
        </button>

        <button
          onClick={onNextPeriod}
          aria-label="รอบเดือนถัดไป"
          className="w-10 h-9 rounded-lg hover:bg-white dark:hover:bg-slate-800 active:scale-[0.96] flex items-center justify-center text-slate-600 dark:text-slate-300 border border-transparent hover:border-sky-100 dark:hover:border-slate-700 transition-all"
        >
          <ChevronRight className="w-4 h-4" strokeWidth={2} />
        </button>
      </div>

      {/* Month Picker Mobile Bottom Sheet */}
      {mounted && isPickerOpen && createPortal(
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150 p-0 sm:p-4 overflow-y-auto">
          {/* Backdrop click to dismiss */}
          <div className="fixed inset-0" onClick={() => setIsPickerOpen(false)} />

          <div className="relative w-full max-w-md bg-white dark:bg-[#0e1726] rounded-t-3xl sm:rounded-2xl border-t sm:border border-sky-100 dark:border-sky-900 shadow-2xl flex flex-col max-h-[85dvh] sm:max-h-[80dvh] my-auto overflow-hidden animate-in slide-in-from-bottom duration-200 z-10">
            {/* Grab Handle for mobile gesture affordance */}
            <div className="w-12 h-1 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto mt-2.5 mb-1 sm:hidden" />

            {/* Modal Header (Fixed at top) */}
            <div className="shrink-0 flex items-center justify-between px-5 py-3 border-b border-sky-100 dark:border-sky-900">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-sky-50 dark:bg-sky-900/80 flex items-center justify-center text-sky-600 dark:text-sky-400">
                  <Calendar className="w-4 h-4" strokeWidth={1.8} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    เลือกรอบเดือนที่ต้องการดู
                  </h3>
                  <p className="text-[10px] text-slate-500">สลับรอบเงินออกและรอบเวรของเดือนที่ผ่านมา</p>
                </div>
              </div>
              <button
                onClick={() => setIsPickerOpen(false)}
                className="w-8 h-8 rounded-xl hover:bg-sky-50 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable Modal Body */}
            <div className="flex-1 overflow-y-auto overscroll-contain px-5 py-3 space-y-3">
              {/* Year Switcher */}
              <div className="flex items-center justify-between px-2 py-1.5 bg-sky-50/60 dark:bg-slate-800/60 rounded-xl border border-sky-100 dark:border-slate-700">
                <button
                  onClick={() => setPickerYear((y) => y - 1)}
                  className="w-9 h-9 rounded-lg hover:bg-white dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center transition-colors active:scale-95"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <div className="text-center">
                  <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                    พ.ศ. {pickerYear + 543}
                  </span>
                  <span className="text-[11px] text-slate-500 ml-1 tabular-nums">({pickerYear})</span>
                </div>
                <button
                  onClick={() => setPickerYear((y) => y + 1)}
                  className="w-9 h-9 rounded-lg hover:bg-white dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center transition-colors active:scale-95"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {/* 12 Months Grid */}
              <div className="grid grid-cols-4 gap-2">
                {THAI_MONTH_SHORT.map((mName, idx) => {
                  const isSelected =
                    pickerYear === parseInt(currentYear, 10) && idx + 1 === currentMonthNum;
                  return (
                    <button
                      key={mName}
                      onClick={() => handleSelectMonth(idx)}
                      className={`py-3 px-1 rounded-xl text-xs font-medium transition-all active:scale-[0.96] ${
                        isSelected
                          ? "bg-sky-600 text-white font-semibold shadow-xs"
                          : "bg-sky-50/40 dark:bg-slate-800/40 hover:bg-sky-100/70 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border border-sky-100/60 dark:border-slate-700/60"
                      }`}
                    >
                      <div>{mName}</div>
                      <div
                        className={`text-[9px] mt-0.5 tabular-nums ${
                          isSelected ? "text-sky-100" : "text-slate-400"
                        }`}
                      >
                        {String(idx + 1).padStart(2, "0")}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Modal Footer Quick Shortcuts (Fixed at bottom) */}
            <div className="shrink-0 px-5 py-3 pb-[max(1rem,env(safe-area-inset-bottom))] border-t border-sky-100 dark:border-sky-900 bg-white/95 dark:bg-[#0e1726]/95 backdrop-blur-xs flex items-center justify-between text-xs">
              <button
                onClick={() => {
                  const now = new Date();
                  const y = now.getFullYear();
                  const m = String(now.getMonth() + 1).padStart(2, "0");
                  if (onSelectPeriodKey) onSelectPeriodKey(`${y}-${m}`);
                  setIsPickerOpen(false);
                }}
                className="text-sky-600 dark:text-sky-400 hover:underline font-semibold min-h-[36px] flex items-center"
              >
                กลับสู่เดือนปัจจุบัน
              </button>
              <button
                onClick={() => setIsPickerOpen(false)}
                className="px-4 py-2 rounded-xl bg-sky-50 dark:bg-slate-800 hover:bg-sky-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold transition-colors"
              >
                ปิด
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </header>
  );
};
