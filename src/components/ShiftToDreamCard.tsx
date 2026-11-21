"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import confetti from "canvas-confetti";
import {
  Target,
  Sparkles,
  Plus,
  Edit3,
  Check,
  X,
  TrendingUp,
  Plane,
  GraduationCap,
  Gift,
  PiggyBank,
  Car,
  Heart,
  ChevronRight,
  Flame,
} from "lucide-react";
import { GoalProgressInfo, NurseGoal } from "@/types";
import { computeGoalProgress, formatBaht } from "@/lib/calculations";

interface ShiftToDreamCardProps {
  goals: NurseGoal[];
  avgOtRate?: number;
  onSaveGoal: (goal: NurseGoal) => Promise<void>;
  onSelectGoal: (goalId: string) => Promise<void>;
  onUpdateGoalAmount: (goalId: string, addedOrNewAmount: number, isAbsolute?: boolean) => Promise<void>;
}

// Preset life goals designed specifically for Thai nurses
const PRESET_GOALS = [
  {
    title: "ทริปเที่ยวญี่ปุ่น 🌸",
    targetAmount: 45000,
    category: "travel" as const,
    emoji: "✈️",
  },
  {
    title: "ปลดหนี้ กยศ. 🎓",
    targetAmount: 60000,
    category: "debt" as const,
    emoji: "🎓",
  },
  {
    title: "ซื้อ iPad / ของขวัญให้แม่ 🎁",
    targetAmount: 25000,
    category: "family" as const,
    emoji: "📱",
  },
  {
    title: "เงินออมสำรองฉุกเฉิน 💰",
    targetAmount: 50000,
    category: "savings" as const,
    emoji: "💰",
  },
  {
    title: "เงินดาวน์รถคันแรก 🚗",
    targetAmount: 70000,
    category: "other" as const,
    emoji: "🚗",
  },
  {
    title: "ของขวัญรางวัลชีวิตชิ้นใหญ่ ✨",
    targetAmount: 35000,
    category: "gadget" as const,
    emoji: "💎",
  },
];

export const ShiftToDreamCard: React.FC<ShiftToDreamCardProps> = ({
  goals,
  avgOtRate = 750,
  onSaveGoal,
  onSelectGoal,
  onUpdateGoalAmount,
}) => {
  const [mounted, setMounted] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isUpdatingAmount, setIsUpdatingAmount] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const activeGoal: NurseGoal = goals.find((g) => g.isActive) || goals[0] || {
    id: "goal-default",
    title: "ทริปเที่ยวญี่ปุ่น 🌸",
    targetAmount: 45000,
    currentAmount: 24000,
    category: "travel",
    emoji: "✈️",
    isActive: true,
  };

  const progress: GoalProgressInfo = computeGoalProgress(activeGoal, avgOtRate);

  // Modal form states
  const [editTitle, setEditTitle] = useState(activeGoal.title);
  const [editTarget, setEditTarget] = useState(String(activeGoal.targetAmount));
  const [editCurrent, setEditCurrent] = useState(String(activeGoal.currentAmount));
  const [editEmoji, setEditEmoji] = useState(activeGoal.emoji || "🎯");
  const [editCategory, setEditCategory] = useState<NurseGoal["category"]>(activeGoal.category || "travel");

  // Sync edit form with active goal
  useEffect(() => {
    if (activeGoal) {
      setEditTitle(activeGoal.title);
      setEditTarget(String(activeGoal.targetAmount));
      setEditCurrent(String(activeGoal.currentAmount));
      setEditEmoji(activeGoal.emoji || "🎯");
      setEditCategory(activeGoal.category || "travel");
    }
  }, [activeGoal]);

  const handleQuickAdd = async (amount: number) => {
    try {
      setIsUpdatingAmount(true);
      await onUpdateGoalAmount(activeGoal.id, amount, false);

      // Micro celebration
      confetti({
        particleCount: 35,
        spread: 50,
        origin: { y: 0.7 },
        colors: ["#0284c7", "#38bdf8", "#10b981", "#f59e0b"],
      });
    } finally {
      setIsUpdatingAmount(false);
    }
  };

  const handleSaveModal = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetNum = parseFloat(editTarget);
    const currentNum = parseFloat(editCurrent) || 0;

    if (isNaN(targetNum) || targetNum <= 0) {
      alert("กรุณาระบุจำนวนเงินเป้าหมายที่ถูกต้อง");
      return;
    }

    const updated: NurseGoal = {
      ...activeGoal,
      title: editTitle.trim() || "เป้าหมายของฉัน",
      targetAmount: targetNum,
      currentAmount: Math.max(0, currentNum),
      emoji: editEmoji,
      category: editCategory,
      isActive: true,
    };

    await onSaveGoal(updated);
    setIsModalOpen(false);
  };

  const handleSelectPreset = (preset: (typeof PRESET_GOALS)[0]) => {
    setEditTitle(preset.title);
    setEditTarget(String(preset.targetAmount));
    setEditEmoji(preset.emoji);
    setEditCategory(preset.category);
  };

  return (
    <div className="bg-white dark:bg-[#0e1726] rounded-2xl p-4 border border-sky-100 dark:border-sky-900/70 shadow-2xs transition-colors">
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-sky-50 dark:bg-sky-950/80 border border-sky-100 dark:border-sky-800/60 flex items-center justify-center text-sky-600 dark:text-sky-400">
            <Target className="w-4 h-4" strokeWidth={2} />
          </div>
          <div>
            <span className="text-[10px] font-semibold text-sky-700 dark:text-sky-400 uppercase tracking-wide">
              พลังใจในการขึ้นเวร
            </span>
            <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 leading-tight">
              เหนื่อยเพื่อเป้าหมาย — แปลงความฝันเป็น &quot;จำนวนเวร&quot;
            </h2>
          </div>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="text-xs font-semibold text-sky-700 dark:text-sky-300 hover:text-sky-900 dark:hover:text-sky-100 bg-sky-50 dark:bg-slate-800/80 px-2.5 py-1 rounded-xl border border-sky-100 dark:border-slate-700 flex items-center gap-1 active:scale-95 transition-all"
        >
          <Edit3 className="w-3 h-3 text-sky-600 dark:text-sky-400" />
          <span>ปรับเป้าหมาย</span>
        </button>
      </div>

      {/* Active Goal Highlight Card */}
      <div className="bg-gradient-to-br from-[#f0f7fe] via-[#f5faff] to-white dark:from-[#111c2e] dark:via-[#0e1726] dark:to-[#0b121e] rounded-xl p-3.5 border border-sky-100 dark:border-sky-900/80 mb-3">
        {/* Title & Emoji */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-2xl select-none">{activeGoal.emoji || "🎯"}</span>
            <div>
              <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
                {activeGoal.title}
              </span>
              <p className="text-[10px] text-slate-500 dark:text-slate-400">
                เป้าหมาย: ฿{formatBaht(activeGoal.targetAmount)} (เฉลี่ย ฿{avgOtRate}/เวร)
              </p>
            </div>
          </div>

          <span className="text-xs font-extrabold text-sky-700 dark:text-sky-300 bg-sky-100/80 dark:bg-sky-950 px-2 py-0.5 rounded-full border border-sky-200/60 dark:border-sky-800 tabular-nums">
            {progress.progressPercent}%
          </span>
        </div>

        {/* Hero Shifts Remaining Counter */}
        <div className="my-2 p-2.5 bg-white/90 dark:bg-[#131f33]/90 rounded-xl border border-sky-100/80 dark:border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 block">
              {progress.shiftsRemaining > 0 ? "ขึ้นเวรอีกประมาณ:" : "ผลลัพธ์:"}
            </span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-2xl font-black text-sky-700 dark:text-sky-400 tabular-nums">
                {progress.shiftsRemaining > 0 ? progress.shiftsRemaining : "🎉 สำเร็จแล้ว!"}
              </span>
              {progress.shiftsRemaining > 0 && (
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">เวร</span>
              )}
            </div>
          </div>

          <div className="text-right">
            <span className="text-[10px] text-slate-500 dark:text-slate-400 block">
              เก็บแล้ว / เป้าหมาย
            </span>
            <span className="text-xs font-bold text-slate-900 dark:text-slate-100 tabular-nums">
              ฿{formatBaht(activeGoal.currentAmount)} / ฿{formatBaht(activeGoal.targetAmount)}
            </span>
            <span className="text-[10px] text-slate-400 block tabular-nums">
              (ทำไปแล้ว {progress.shiftsCompleted}/{progress.totalShiftsNeeded} เวร)
            </span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="relative w-full h-3 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden mb-2">
          <div
            className="absolute left-0 top-0 bottom-0 bg-gradient-to-r from-sky-500 to-sky-600 rounded-full transition-all duration-500 shadow-2xs"
            style={{ width: `${progress.progressPercent}%` }}
          />
        </div>

        {/* Empathy Microcopy (Quote) */}
        <div className="p-2.5 rounded-xl bg-sky-50/70 dark:bg-slate-900/60 border border-sky-100/70 dark:border-slate-800 text-xs text-sky-950 dark:text-sky-100 flex items-start gap-2">
          <Sparkles className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
          <p className="leading-relaxed font-medium">
            &ldquo;{activeGoal.title.split(" ")[0]} ฿{formatBaht(activeGoal.targetAmount)} = คุณต้องขึ้น OT อีก {progress.totalShiftsNeeded} เวร (ตอนนี้ทำไปแล้ว {progress.shiftsCompleted} เวร เหลืออีก {progress.shiftsRemaining} เวร) {progress.encouragingMessage}&rdquo;
          </p>
        </div>
      </div>

      {/* Quick Deposit Actions (+1 เวร, +2 เวร, +4 เวร) */}
      <div className="space-y-1.5">
        <div className="flex flex-col gap-0.5 px-0.5">
          <div className="flex items-center justify-between text-[11px] text-slate-700 dark:text-slate-300">
            <span className="font-semibold flex items-center gap-1">
              <Plus className="w-3 h-3 text-sky-600" />
              <span>บันทึกเงินเก็บสะสมจากเวรที่ทำได้ (จำลองการสะสม):</span>
            </span>
            {isUpdatingAmount && <span className="text-[10px] text-sky-600 animate-pulse">กำลังบันทึก...</span>}
          </div>
          <p className="text-[10px] text-slate-500 dark:text-slate-400">
            (บันทึกความคืบหน้าเพื่อเป็นกำลังใจ ไม่มีการหักเงินจริงจากบัญชี)
          </p>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={() => handleQuickAdd(avgOtRate)}
            disabled={isUpdatingAmount}
            className="h-10 px-2 rounded-xl bg-[#f0f6fc] dark:bg-slate-800/80 hover:bg-sky-50 dark:hover:bg-slate-700 active:scale-95 text-slate-800 dark:text-slate-200 text-xs font-semibold border border-sky-100 dark:border-slate-700 transition-all flex flex-col items-center justify-center shadow-2xs"
          >
            <span>+฿{formatBaht(avgOtRate)}</span>
            <span className="text-[9px] text-slate-500 font-normal">(1 เวร)</span>
          </button>

          <button
            onClick={() => handleQuickAdd(avgOtRate * 2)}
            disabled={isUpdatingAmount}
            className="h-10 px-2 rounded-xl bg-[#f0f6fc] dark:bg-slate-800/80 hover:bg-sky-50 dark:hover:bg-slate-700 active:scale-95 text-slate-800 dark:text-slate-200 text-xs font-semibold border border-sky-100 dark:border-slate-700 transition-all flex flex-col items-center justify-center shadow-2xs"
          >
            <span>+฿{formatBaht(avgOtRate * 2)}</span>
            <span className="text-[9px] text-slate-500 font-normal">(2 เวร)</span>
          </button>

          <button
            onClick={() => handleQuickAdd(avgOtRate * 4)}
            disabled={isUpdatingAmount}
            className="h-10 px-2 rounded-xl bg-sky-600 hover:bg-sky-700 active:scale-95 text-white text-xs font-semibold transition-all flex flex-col items-center justify-center shadow-2xs"
          >
            <span>+฿{formatBaht(avgOtRate * 4)}</span>
            <span className="text-[9px] text-sky-100 font-normal">(4 เวร)</span>
          </button>
        </div>
      </div>

      {/* Goal Edit / Creation Bottom Sheet Modal using createPortal to prevent LINE LIFF clipping */}
      {mounted && isModalOpen && createPortal(
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150 p-0 sm:p-4 overflow-y-auto">
          <div className="fixed inset-0" onClick={() => setIsModalOpen(false)} />

          <div className="relative w-full max-w-md bg-white dark:bg-[#0e1726] rounded-t-3xl sm:rounded-2xl border-t sm:border border-sky-100 dark:border-sky-900 shadow-2xl flex flex-col max-h-[85dvh] sm:max-h-[80dvh] my-auto overflow-hidden animate-in slide-in-from-bottom duration-200 z-10">
            {/* Grab Handle for mobile gesture */}
            <div className="w-12 h-1 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto mt-2.5 mb-1 sm:hidden" />

            {/* Modal Header */}
            <div className="shrink-0 flex items-center justify-between px-5 py-3 border-b border-sky-100 dark:border-sky-900">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-sky-50 dark:bg-sky-900/80 flex items-center justify-center text-sky-600 dark:text-sky-400">
                  <Target className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    ตั้งเป้าหมายชีวิต (Shift to Dream)
                  </h3>
                  <p className="text-[10px] text-slate-500">แปลงความฝันเป็นจำนวนเวรที่ต้องขึ้นเพื่อฮีลใจ</p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-xl hover:bg-sky-50 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable Form Body */}
            <form onSubmit={handleSaveModal} className="flex-1 flex flex-col overflow-hidden">
              <div className="flex-1 overflow-y-auto overscroll-contain px-5 py-3 space-y-3.5">
                {/* Presets Quick Picker */}
                <div>
                  <label className="text-xs font-semibold text-slate-800 dark:text-slate-200 block mb-1.5">
                    เลือกเป้าหมายยอดฮิตของพยาบาล:
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {PRESET_GOALS.map((p) => (
                      <button
                        key={p.title}
                        type="button"
                        onClick={() => handleSelectPreset(p)}
                        className={`p-2.5 rounded-xl border text-left flex items-center gap-2 text-xs transition-all active:scale-95 ${
                          editTitle === p.title
                            ? "bg-sky-50 dark:bg-sky-950/70 border-sky-500 text-sky-950 dark:text-sky-100 font-semibold shadow-2xs"
                            : "bg-[#f8fbfe] dark:bg-slate-900/60 hover:bg-sky-50/50 border-sky-100/80 dark:border-slate-800 text-slate-700 dark:text-slate-300"
                        }`}
                      >
                        <span className="text-lg">{p.emoji}</span>
                        <div className="min-w-0">
                          <span className="truncate block font-semibold">{p.title}</span>
                          <span className="text-[10px] text-slate-500 dark:text-slate-400 tabular-nums">
                            ฿{formatBaht(p.targetAmount)}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Custom Goal Title & Emoji */}
                <div>
                  <label className="text-xs font-semibold text-slate-800 dark:text-slate-200 block mb-1">
                    ชื่อเป้าหมายความฝัน:
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={editEmoji}
                      onChange={(e) => setEditEmoji(e.target.value)}
                      className="w-12 h-11 text-center text-lg bg-sky-50/60 dark:bg-slate-800 rounded-xl border border-sky-100 dark:border-slate-700 focus:outline-none focus:ring-1 focus:ring-sky-500"
                      maxLength={2}
                      title="เลือกอีโมจิ"
                    />
                    <input
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      placeholder="เช่น ทริปเที่ยวญี่ปุ่น, ปลดหนี้ กยศ."
                      className="flex-1 h-11 px-3 bg-white dark:bg-slate-800 border border-sky-100 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-sky-500 shadow-2xs"
                      required
                    />
                  </div>
                </div>

                {/* Target Amount */}
                <div>
                  <label className="text-xs font-semibold text-slate-800 dark:text-slate-200 block mb-1">
                    จำนวนเงินเป้าหมาย (บาท):
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-3 text-sky-600 dark:text-sky-400 font-semibold text-sm">฿</span>
                    <input
                      type="number"
                      step="any"
                      value={editTarget}
                      onChange={(e) => setEditTarget(e.target.value)}
                      placeholder="เช่น 45000"
                      className="w-full h-11 pl-8 pr-3 bg-white dark:bg-slate-800 border border-sky-100 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-sky-500 tabular-nums shadow-2xs"
                      required
                    />
                  </div>
                </div>

                {/* Current Savings */}
                <div>
                  <label className="text-xs font-semibold text-slate-800 dark:text-slate-200 block mb-1">
                    เงินเก็บสะสมปัจจุบัน (บาท):
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-3 text-emerald-600 dark:text-emerald-400 font-semibold text-sm">฿</span>
                    <input
                      type="number"
                      step="any"
                      value={editCurrent}
                      onChange={(e) => setEditCurrent(e.target.value)}
                      placeholder="เช่น 24000"
                      className="w-full h-11 pl-8 pr-3 bg-white dark:bg-slate-800 border border-sky-100 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-sky-500 tabular-nums shadow-2xs"
                    />
                  </div>
                </div>

                {/* Calculated shifts preview */}
                {parseFloat(editTarget) > 0 && (
                  <div className="p-3 bg-[#f0f7fe] dark:bg-slate-900/80 rounded-xl border border-sky-100 dark:border-slate-800 text-xs">
                    <span className="text-slate-500 block mb-1">สรุปการแปลงเป็นจำนวนเวร:</span>
                    <div className="font-bold text-sky-900 dark:text-sky-200 leading-relaxed">
                      เป้าหมาย ฿{formatBaht(parseFloat(editTarget))} = ต้องขึ้นเวรประมาณ{" "}
                      <strong className="text-sky-600 dark:text-sky-400 text-sm">
                        {Math.ceil(parseFloat(editTarget) / (avgOtRate || 750))}
                      </strong>{" "}
                      เวร (คำนวณที่ ฿{avgOtRate}/เวร)
                    </div>
                  </div>
                )}
              </div>

              {/* Fixed Footer */}
              <div className="shrink-0 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] border-t border-sky-100 dark:border-sky-900 bg-white/95 dark:bg-[#0e1726]/95 backdrop-blur-xs flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 h-11 rounded-xl bg-sky-50 dark:bg-slate-800 hover:bg-sky-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold transition-all active:scale-95"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="flex-1 h-11 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold transition-all shadow-2xs active:scale-95"
                >
                  บันทึกเป้าหมาย
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
