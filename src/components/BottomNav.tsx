"use client";

import React from "react";
import {
  Wallet,
  ClipboardList,
  Plus,
  HeartPulse,
  CalendarDays,
} from "lucide-react";

export type NavTab = "dashboard" | "tally" | "wellness" | "schedule" | "settings";

interface BottomNavProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  onOpenQuickAdd: () => void;
  pendingCount?: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  currentTab,
  onSelectTab,
  onOpenQuickAdd,
  pendingCount = 0,
}) => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-[#0e1726]/95 backdrop-blur-md border-t border-sky-100/90 dark:border-sky-950/90 shadow-[0_-2px_16px_rgba(2,132,199,0.06)] pb-[max(0.5rem,env(safe-area-inset-bottom))] transition-colors">
      <div className="max-w-md mx-auto px-2 h-16 grid grid-cols-5 items-center relative">
        {/* Tab 1: Dashboard (💰 สรุปเงิน) */}
        <button
          onClick={() => onSelectTab("dashboard")}
          aria-label="หน้าสรุปเงินและสลิป"
          className={`flex flex-col items-center justify-center h-full py-1 transition-all active:scale-[0.92] ${
            currentTab === "dashboard"
              ? "text-sky-600 dark:text-sky-400 font-bold"
              : "text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 font-medium"
          }`}
        >
          <div className="relative flex items-center justify-center">
            <Wallet
              className="w-5 h-5 transition-transform"
              strokeWidth={currentTab === "dashboard" ? 2.3 : 1.8}
            />
            {pendingCount > 0 && (
              <span className="absolute -top-1 -right-2.5 min-w-[15px] h-3.5 px-1 rounded-full bg-amber-500 text-white text-[9px] font-bold flex items-center justify-center shadow-xs">
                {pendingCount}
              </span>
            )}
          </div>
          <span className="text-[10px] mt-1 tracking-tight truncate max-w-full">
            สรุปเงิน
          </span>
          {currentTab === "dashboard" && (
            <span className="w-1 h-1 rounded-full bg-sky-600 dark:bg-sky-400 mt-0.5" />
          )}
        </button>

        {/* Tab 2: Shift Tally (📋 นับเวร) */}
        <button
          onClick={() => onSelectTab("tally")}
          aria-label="หน้านับเวรตามตาราง"
          className={`flex flex-col items-center justify-center h-full py-1 transition-all active:scale-[0.92] ${
            currentTab === "tally"
              ? "text-sky-600 dark:text-sky-400 font-bold"
              : "text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 font-medium"
          }`}
        >
          <ClipboardList
            className="w-5 h-5 transition-transform"
            strokeWidth={currentTab === "tally" ? 2.3 : 1.8}
          />
          <span className="text-[10px] mt-1 tracking-tight truncate max-w-full">
            นับเวร
          </span>
          {currentTab === "tally" && (
            <span className="w-1 h-1 rounded-full bg-sky-600 dark:bg-sky-400 mt-0.5" />
          )}
        </button>

        {/* Center Floating Action: Quick Add (➕ งานงอก) */}
        <div className="flex flex-col items-center justify-center h-full">
          <button
            onClick={onOpenQuickAdd}
            aria-label="จดงานงอกหรือเวรนอกด่วน"
            className="w-12 h-12 -mt-5 rounded-full bg-sky-600 hover:bg-sky-700 active:scale-[0.90] text-white flex items-center justify-center transition-all border-4 border-[#f1f6fb] dark:border-[#080d16] shadow-md group"
            title="จดงานงอกหรือเวรนอกด่วน (ใน 3 คลิก)"
          >
            <Plus
              className="w-6 h-6 group-hover:rotate-90 transition-transform duration-200"
              strokeWidth={2.4}
            />
          </button>
          <span className="text-[9px] mt-0.5 font-semibold text-sky-700 dark:text-sky-400">
            งานงอก
          </span>
        </div>

        {/* Tab 3: Wellness (🌿 พลังชีวิต) */}
        <button
          onClick={() => onSelectTab("wellness")}
          aria-label="หน้าพลังชีวิตและเซฟตี้"
          className={`flex flex-col items-center justify-center h-full py-1 transition-all active:scale-[0.92] ${
            currentTab === "wellness"
              ? "text-sky-600 dark:text-sky-400 font-bold"
              : "text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 font-medium"
          }`}
        >
          <HeartPulse
            className="w-5 h-5 transition-transform"
            strokeWidth={currentTab === "wellness" ? 2.3 : 1.8}
          />
          <span className="text-[10px] mt-1 tracking-tight truncate max-w-full">
            พลังชีวิต
          </span>
          {currentTab === "wellness" && (
            <span className="w-1 h-1 rounded-full bg-sky-600 dark:bg-sky-400 mt-0.5" />
          )}
        </button>

        {/* Tab 4: Schedule (📅 ตารางเวร) */}
        <button
          onClick={() => onSelectTab("schedule")}
          aria-label="หน้าตารางเวรและวันหยุด"
          className={`flex flex-col items-center justify-center h-full py-1 transition-all active:scale-[0.92] ${
            currentTab === "schedule"
              ? "text-sky-600 dark:text-sky-400 font-bold"
              : "text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 font-medium"
          }`}
        >
          <CalendarDays
            className="w-5 h-5 transition-transform"
            strokeWidth={currentTab === "schedule" ? 2.3 : 1.8}
          />
          <span className="text-[10px] mt-1 tracking-tight truncate max-w-full">
            ตารางเวร
          </span>
          {currentTab === "schedule" && (
            <span className="w-1 h-1 rounded-full bg-sky-600 dark:bg-sky-400 mt-0.5" />
          )}
        </button>
      </div>
    </nav>
  );
};
