"use client";

import React, { useState } from "react";
import {
  HeartPulse,
  Sparkles,
  ShieldAlert,
  Moon,
  Clock,
  Coffee,
  Car,
  Pill,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Smile,
  ArrowLeft,
  Zap,
  Timer,
  CheckCircle2,
  Copy,
  Check,
  Bed,
  Sun,
  Flame,
} from "lucide-react";
import { NurseGoal, PeriodSummary } from "@/types";
import { computeNurseEnergy, formatBaht } from "@/lib/calculations";
import { FatigueSafetyCard } from "./FatigueSafetyCard";
import { ShiftToDreamCard } from "./ShiftToDreamCard";

interface WellnessScreenProps {
  summary: PeriodSummary;
  goals: NurseGoal[];
  onSaveGoal: (goal: NurseGoal) => Promise<void>;
  onSelectGoal: (goalId: string) => Promise<void>;
  onUpdateGoalAmount: (goalId: string, addedOrNewAmount: number, isAbsolute?: boolean) => Promise<void>;
  onSaveFatigueCounts: (quickTurnaround: number, doubleShift: number) => Promise<void>;
  onBackToDashboard?: () => void;
}

type SleepRoutineType = "NIGHT_AFTER" | "QUICK_TURNAROUND" | "POWER_NAP" | "DOUBLE_SHIFT" | "SPLIT_SHIFT";

interface RoutineInfo {
  type: SleepRoutineType;
  title: string;
  badge: string;
  badgeClass: string;
  icon: string;
  shortDesc: string;
  steps: {
    timeRange: string;
    action: string;
    detail: string;
    highlight?: boolean;
  }[];
  criticalWarning: string;
}

const SLEEP_ROUTINES: RoutineInfo[] = [
  {
    type: "NIGHT_AFTER",
    title: "เพิ่งลงเวรดึก (08:00 น.)",
    badge: "สูตรนอน 2 บล็อก (Split Sleep)",
    badgeClass: "bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300 border-indigo-200",
    icon: "🌙",
    shortDesc: "นอนหลับลึกรอบแรก 4 ชม. แล้วตื่นมารับแสง ก่อนงีบสั้นก่อนขึ้นเวรคืนนี้",
    steps: [
      {
        timeRange: "08:30 - 09:30",
        action: "สวมแว่นกันแดดตอนกลับบ้าน & ทานมื้อเบา",
        detail: "หลีกเลี่ยงแสงแดดจ้าเข้าตาเพื่อรักษาเมลาโทนิน ทานโจ๊ก กล้วย หรือนมอุ่น ห้ามทานมื้อหนัก",
      },
      {
        timeRange: "09:30 - 13:30 (4 ชม.)",
        action: "บล็อกที่ 1: นอนหลัก (Core Sleep)",
        detail: "ห้องนอนต้องมืดสนิท 100% (ผ้าม่านกันแสง) เปิดแอร์ 24-25°C ใส่ที่อุดหู ปิดเสียงมือถือ",
        highlight: true,
      },
      {
        timeRange: "14:00 - 18:30",
        action: "ตื่นมารับแสงแดดอ่อนๆ & ทำธุระส่วนตัว",
        detail: "ขยับร่างกาย ดื่มน้ำ ทานอาหารปกติ เพื่อรักษานาฬิกาชีวิต ไม่นอนยาวติดกันจนปวดหัว",
      },
      {
        timeRange: "19:30 - 20:30 (1 ชม.)",
        action: "บล็อกที่ 2: งีบสั้นก่อนขึ้นกะ (Pre-shift Nap)",
        detail: "งีบ 45-60 นาที ชาร์จแบตสมองให้พร้อม ตาใส ไม่ง่วงตอน 03:00 - 05:00 น.",
        highlight: true,
      },
    ],
    criticalWarning: "⚠️ ระวังหลับในขณะเดินทางกลับบ้านเวลา 08:00 น. หากรู้สึกตาปรือ ให้แวะจอดพักงีบ 15 นาที ห้ามฝืนเด็ดขาด!",
  },
  {
    type: "QUICK_TURNAROUND",
    title: "เวรบ่ายต่อเช้า (บ. ➔ ช.)",
    badge: "สูตรประคองเวลานอน 4.5 ชม.",
    badgeClass: "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border-rose-200",
    icon: "⚡",
    shortDesc: "บ่ายเลิก 24:00 น. ต่อเช้า 08:00 น. ต้องรัดกุมทุกนาทีก่อนขึ้นเวร",
    steps: [
      {
        timeRange: "ก่อน 18:00 น.",
        action: "งดกาแฟและเครื่องดื่มชูกำลังเด็ดขาด",
        detail: "คาเฟอีนมีค่าครึ่งชีวิต 5 ชม. ถ้าดื่มหลัง 18:00 น. จะนอนไม่หลับตอนตี 1 เสียเวลาพักผ่อน",
        highlight: true,
      },
      {
        timeRange: "24:00 - 01:15",
        action: "กลับถึงบ้าน รีบอาบน้ำอุ่นทันที",
        detail: "งดเล่นมือถือ/ไถฟีด เพราะแสงสีฟ้ากดเมลาโทนิน เตรียมชุดและกระเป๋าไว้ล่วงหน้า",
      },
      {
        timeRange: "01:30 - 06:15 (4.75 ชม.)",
        action: "นอนหลับให้สนิทที่สุด",
        detail: "ตั้งเวลาปลุก 2 รอบ ใส่ที่อุดหูเพื่อให้นอนได้ลึกที่สุดในเวลาจำกัด",
        highlight: true,
      },
      {
        timeRange: "12:00 - 12:30 (กะเช้า)",
        action: "งีบสั้น 15-20 นาทีช่วงพักเที่ยง",
        detail: "หาที่เงียบๆ นั่งพิงหลับตา 15 นาที ช่วยฟื้นฟูสมาธิช่วงบ่ายได้ถึง 40%",
      },
    ],
    criticalWarning: "🚨 ช่วงเวลา 10:00 - 12:00 น. ของกะเช้า สมองจะล้าสะสมสูงสุด ให้ Double-Check ยาเสี่ยงสูง (High Alert Drugs) ร่วมกับเพื่อนเสมอ!",
  },
  {
    type: "POWER_NAP",
    title: "งีบด่วน 20 นาที (Power Nap)",
    badge: "สูตร Coffee Nap ปลุกพลัง",
    badgeClass: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-200",
    icon: "☕",
    shortDesc: "งีบ 15-20 นาที ตื่นมาไม่งัวเงีย สดชื่นทันตา ลดข้อผิดพลาด 34%",
    steps: [
      {
        timeRange: "นาทีที่ 0",
        action: "ดื่มกาแฟ 1 ช็อตทันที (Coffee Nap)",
        detail: "ดื่มกาแฟดำหรือชาเขียว 1 ช็อตแบบเร็วๆ ก่อนหลับตา",
      },
      {
        timeRange: "นาทีที่ 1 - 20",
        action: "หลับตางีบ 20 นาที (ห้ามเกิน 25 นาที)",
        detail: "การงีบ 20 นาทีอยู่ใน Stage 2 Light Sleep สมองจะเคลียร์สารอะดีโนซีน (สารความล้า) โดยยังไม่ตกลงสู่ Deep Sleep",
        highlight: true,
      },
      {
        timeRange: "นาทีที่ 21 เป็นต้นไป",
        action: "ตื่นพร้อมพลังเต็มร้อย",
        detail: "คาเฟอีนจะเริ่มออกฤทธิ์ที่นาทีที่ 20 พอดี ผสานกับการงีบ ทำให้ตื่นมาตาใส ไร้อาการงัวเงีย (Sleep Inertia)",
      },
    ],
    criticalWarning: "💡 ห้ามงีบยาว 30-60 นาที เพราะร่างกายจะเข้าสู่ Deep Sleep และตื่นมามีอาการมึนงง ปวดหัว และทำงานต่อลำบาก",
  },
  {
    type: "DOUBLE_SHIFT",
    title: "เวรควง 16 ชม. (ช.+บ. หรือ บ.+ด.)",
    badge: "สูตรประคองสมอง ชม. ที่ 12-16",
    badgeClass: "bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 border-purple-200",
    icon: "🚨",
    shortDesc: "เทคนิคป้องกันความผิดพลาดและพยุงร่างกายตลอด 16 ชั่วโมงติด",
    steps: [
      {
        timeRange: "ทุกๆ 2 ชั่วโมง",
        action: "จิบน้ำเปล่า 1 แก้วเต็มๆ",
        detail: "ภาวะขาดน้ำในห้องแอร์ทำให้เลือดหนืดและสมองเฉื่อยชา การดื่มน้ำช่วยรักษาออกซิเจนในสมอง",
      },
      {
        timeRange: "ชั่วโมงที่ 8 (เปลี่ยนกะ)",
        action: "เปลี่ยนถุงเท้าคู่ใหม่ & ล้างหน้าด้วยน้ำเย็น",
        detail: "การเปลี่ยนถุงเท้าสะอาดช่วยลดแรงกดที่ฝ่าเท้า และน้ำเย็นช่วยกระตุ้นเส้นประสาทคู่ที่ 5",
      },
      {
        timeRange: "ชั่วโมงที่ 12 - 16",
        action: "เปิดโหมดเซฟตี้สูงสุด (Safety Check)",
        detail: "ทุกคำสั่งแพทย์ที่มีการปรับขนาดยา หรือการให้ยาทางหลอดเลือดดำ ต้องทวนคำสั่งซ้ำกับเพื่อนพยาบาลเสมอ",
        highlight: true,
      },
    ],
    criticalWarning: "🤍 หลังลงเวรควง 16 ชม. ห้ามรับปากขึ้นเวรแทนใครเพิ่ม ให้กลับไปนอนหลับพักฟื้นร่างกายทันทีเพื่อป้องกัน Burnout",
  },
  {
    type: "SPLIT_SHIFT",
    title: "เช้าแล้วต่อ OT ดึก (ช. ➔ OT-ด.)",
    badge: "สูตรนอนชาร์จแบตช่วงบ่าย 4.5 ชม.",
    badgeClass: "bg-cyan-100 text-cyan-900 dark:bg-cyan-950 dark:text-cyan-300 border-cyan-200",
    icon: "🌙",
    shortDesc: "เลิกเช้า 16:00 น. มีเวลา 8 ชม. ก่อนขึ้น OT ดึกตอนเที่ยงคืน เทคนิคนอนให้อิ่มไม่เพลีย",
    steps: [
      {
        timeRange: "16:00 - 17:30 น.",
        action: "กลับถึงบ้าน รีบทานมื้อเย็นย่อยง่าย",
        detail: "ทานอาหารโปรตีนย่อยง่าย เช่น ข้าวต้มปลา ไข่ต้ม หรือแกงจืด หลีกเลี่ยงของทอดมันและกาแฟช่วงเย็น",
      },
      {
        timeRange: "17:45 - 22:15 น. (4.5 ชม.)",
        action: "ช่วงเวลานอนทองคำ (3 รอบ Sleep Cycles)",
        detail: "นอนให้ครบ 3 รอบวงจรหลับ (รอบละ 90 นาที) ห้องนอนต้องมืดสนิท อุณหภูมิ 24°C ปิดเสียงแจ้งเตือนมือถือ",
        highlight: true,
      },
      {
        timeRange: "22:30 - 23:30 น.",
        action: "ตื่นมาอาบน้ำ & เติมพลังเบาๆ",
        detail: "อาบน้ำอุ่นสลับเย็นให้สดชื่น ดื่มน้ำเปล่า 1 แก้วเต็มๆ และผลไม้สด เพื่อให้สมองตื่นตัวพร้อมเดินทางไป รพ.",
      },
      {
        timeRange: "24:00 - 08:00 น. (กะดึก)",
        action: "ขึ้น OT ดึกด้วยความสดชื่นเต็มร้อย",
        detail: "ร่างกายจะตื่นตัวดีเพราะได้นอนมาแล้ว 4.5 ชม. ช่วง 04:00 - 05:00 น. ให้จิบน้ำเย็นเพื่อคงสมาธิ",
        highlight: true,
      },
    ],
    criticalWarning: "⚠️ ห้ามนอนเล่นไถมือถือจนถึง 20:00 น. เด็ดขาด เพราะจะเหลือเวลานอนจริงแค่ 2 ชม. ทำให้เกิดอาการหลับในหรือจ่ายยาผิดช่วงตี 3 - ตี 5!",
  },
];

export const WellnessScreen: React.FC<WellnessScreenProps> = ({
  summary,
  goals,
  onSaveGoal,
  onSelectGoal,
  onUpdateGoalAmount,
  onSaveFatigueCounts,
  onBackToDashboard,
}) => {
  const energy = computeNurseEnergy(summary);
  const [selectedRoutine, setSelectedRoutine] = useState<SleepRoutineType>("NIGHT_AFTER");
  const [copiedTip, setCopiedTip] = useState<boolean>(false);

  const activeRoutine = SLEEP_ROUTINES.find((r) => r.type === selectedRoutine) || SLEEP_ROUTINES[0];

  const handleCopyRoutine = () => {
    const text = `สูตรพักผ่อนพยาบาล: ${activeRoutine.title}\n${activeRoutine.steps
      .map((s) => `• [${s.timeRange}] ${s.action}: ${s.detail}`)
      .join("\n")}\n\n${activeRoutine.criticalWarning}`;
    navigator.clipboard.writeText(text);
    setCopiedTip(true);
    setTimeout(() => setCopiedTip(false), 2500);
  };

  return (
    <div className="pb-28 pt-2 px-4 space-y-3.5 animate-in fade-in duration-200">
      {/* ------------------------------------------------------------- */}
      {/* 0. HEADER & TITLE */}
      {/* ------------------------------------------------------------- */}
      <div className="bg-white dark:bg-[#0e1726] rounded-2xl p-4 border border-sky-100 dark:border-sky-900 shadow-2xs flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-200/70 dark:border-emerald-800/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <HeartPulse className="w-5 h-5" strokeWidth={2.2} />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                พลังชีวิต & คุณภาพชีวิตพยาบาล
              </h2>
              <span className="text-[10px] font-semibold bg-emerald-100/80 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                Wellness Hub
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              เรดาร์ความล้า คำนวณเวลานอนจริง และเติมพลังให้ความฝัน
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
      {/* 1. HERO WORKLOAD & OVERWORK METRICS */}
      {/* ------------------------------------------------------------- */}
      <div className="bg-gradient-to-br from-white via-sky-50/40 to-white dark:from-[#0e1726] dark:via-[#132035] dark:to-[#0e1726] rounded-2xl p-4 border border-sky-100 dark:border-sky-900/80 shadow-2xs">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-semibold text-sky-700 dark:text-sky-400 uppercase tracking-wide flex items-center gap-1">
            <Zap className="w-3.5 h-3.5 text-amber-500" />
            <span>สถิติชั่วโมงการทำงานรอบนี้</span>
          </span>
          <span className="text-xs font-bold text-slate-700 dark:text-slate-300 tabular-nums">
            {energy.totalShiftCount} กะ ({energy.totalHours} ชม.)
          </span>
        </div>

        {/* Empathy Warning Banner */}
        <div className="p-3 bg-amber-50/90 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800/60 rounded-xl mb-3 flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div className="text-xs text-amber-900 dark:text-amber-200 leading-relaxed font-medium">
            {energy.diffHours > 0 ? (
              <span>
                คุณทำงานไปแล้ว <strong className="font-bold underline">{energy.totalHours} ชม.</strong> ซึ่งเกินกว่าเกณฑ์คนทั่วไป{" "}
                <strong className="font-bold text-amber-800 dark:text-amber-300">+{energy.diffHours} ชม.</strong> (ทำงานหนักกว่าปกติ +{Math.round(energy.overworkPercent)}% เทียบเท่ากับขึ้นเวรเพิ่มไปอีก +{energy.extraDaysEquivalent} วันทำงาน!)
              </span>
            ) : (
              <span>ชั่วโมงทำงานในรอบนี้ของคุณอยู่ในระดับมาตรฐานสมดุล พักผ่อนให้เพียงพอต่อไปนะคนเก่ง! 🌿</span>
            )}
          </div>
        </div>

        {/* 3 Metrics Grid */}
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="bg-white dark:bg-slate-900/80 p-2.5 rounded-xl border border-sky-100 dark:border-slate-800">
            <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-medium">ชั่วโมงเวรสะสม</span>
            <span className="text-lg font-bold text-slate-900 dark:text-slate-100 tabular-nums">
              {energy.totalHours}
            </span>
            <span className="text-[10px] text-slate-400 block">ชม.</span>
          </div>

          <div className="bg-white dark:bg-slate-900/80 p-2.5 rounded-xl border border-sky-100 dark:border-slate-800">
            <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-medium">เกณฑ์คนทั่วไป</span>
            <span className="text-lg font-bold text-slate-600 dark:text-slate-300 tabular-nums">
              {energy.standardWorkHours}
            </span>
            <span className="text-[10px] text-slate-400 block">ชม.</span>
          </div>

          <div className="bg-white dark:bg-slate-900/80 p-2.5 rounded-xl border border-sky-100 dark:border-slate-800">
            <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-medium">เวรดึกสะสม</span>
            <span className="text-lg font-bold text-indigo-600 dark:text-indigo-400 tabular-nums">
              {energy.nightShifts}
            </span>
            <span className="text-[10px] text-slate-400 block">เวร</span>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 2. COMPONENT: FATIGUE SAFETY RADAR & SLEEP DEBT METER */}
      {/* ------------------------------------------------------------- */}
      <FatigueSafetyCard
        summary={summary}
        onSaveFatigueCounts={onSaveFatigueCounts}
      />

      {/* ------------------------------------------------------------- */}
      {/* 3. NEW KILLER FEATURE: POWER NAP & SLEEP SHIFT CALCULATOR */}
      {/* (ตัวช่วยคำนวณเวลานอนฟื้นฟู & Power Nap ตามกะงานจริงของพยาบาล) */}
      {/* ------------------------------------------------------------- */}
      <div className="bg-white dark:bg-[#0e1726] rounded-2xl p-4 border border-sky-100 dark:border-sky-900 shadow-2xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/80 border border-indigo-200/80 dark:border-indigo-800/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <Bed className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                ตัวช่วยคำนวณเวลานอน & งีบด่วน (Sleep & Power Nap Guide)
              </h3>
              <p className="text-[10px] text-slate-500">สูตรการนอนทางการแพทย์ที่ออกแบบมาเพื่อพยาบาลโดยเฉพาะ</p>
            </div>
          </div>

          <button
            onClick={handleCopyRoutine}
            className="h-7 px-2.5 rounded-lg bg-sky-50 dark:bg-slate-800 hover:bg-sky-100 text-sky-800 dark:text-sky-300 text-[10px] font-semibold border border-sky-200/80 dark:border-slate-700 flex items-center gap-1 active:scale-95 transition-all"
            title="คัดลอกสูตรการนอนนี้"
          >
            {copiedTip ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
            <span>{copiedTip ? "คัดลอกแล้ว" : "คัดลอกสูตร"}</span>
          </button>
        </div>

        {/* 4 Scenario Buttons */}
        <div className="grid grid-cols-2 gap-2">
          {SLEEP_ROUTINES.map((routine) => {
            const isSelected = selectedRoutine === routine.type;
            return (
              <button
                key={routine.type}
                onClick={() => setSelectedRoutine(routine.type)}
                className={`p-2.5 rounded-xl border text-left transition-all active:scale-[0.97] flex flex-col justify-between min-h-[58px] ${
                  isSelected
                    ? "bg-sky-50 dark:bg-sky-950/80 border-sky-500 dark:border-sky-500 shadow-2xs ring-1 ring-sky-500"
                    : "bg-[#f8fbfe] dark:bg-slate-900/60 border-sky-100 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-sky-50/60"
                }`}
              >
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="text-sm">{routine.icon}</span>
                  <span className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                    {routine.title}
                  </span>
                </div>
                <span className={`text-[9px] px-1.5 py-0.2 rounded-md font-medium border truncate ${routine.badgeClass}`}>
                  {routine.badge}
                </span>
              </button>
            );
          })}
        </div>

        {/* Routine Step Timeline */}
        <div className="bg-[#f8fbfe] dark:bg-slate-900/80 rounded-xl p-3 border border-sky-100 dark:border-slate-800 space-y-2.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
              <span>{activeRoutine.icon}</span>
              <span>{activeRoutine.title}</span>
            </span>
            <span className="text-[10px] text-slate-500">{activeRoutine.shortDesc}</span>
          </div>

          <div className="space-y-2 pt-1 border-t border-sky-100 dark:border-slate-800">
            {activeRoutine.steps.map((step, idx) => (
              <div
                key={idx}
                className={`p-2 rounded-lg border text-xs ${
                  step.highlight
                    ? "bg-white dark:bg-[#132035] border-sky-200 dark:border-sky-800 shadow-2xs"
                    : "bg-white/60 dark:bg-slate-800/50 border-transparent"
                }`}
              >
                <div className="flex items-center justify-between mb-0.5">
                  <span className="font-bold text-sky-800 dark:text-sky-300 tabular-nums">
                    🕒 {step.timeRange}
                  </span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {step.action}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                  {step.detail}
                </p>
              </div>
            ))}
          </div>

          {/* Critical Warning Alert Box */}
          <div className="p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200/80 dark:border-rose-900/60 text-xs text-rose-800 dark:text-rose-300 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
            <p className="leading-relaxed font-medium">{activeRoutine.criticalWarning}</p>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 4. COMPONENT: SHIFT TO DREAM / FULL GOAL TRACKER CARD */}
      {/* ------------------------------------------------------------- */}
      <ShiftToDreamCard
        goals={goals}
        avgOtRate={
          (summary.period.rates_snapshot && summary.period.rates_snapshot.ot_m) ||
          summary.settings.default_rates.ot_m ||
          750
        }
        onSaveGoal={onSaveGoal}
        onSelectGoal={onSelectGoal}
        onUpdateGoalAmount={onUpdateGoalAmount}
      />

      {/* ------------------------------------------------------------- */}
      {/* 5. CLINICAL MEDICATION & COMMUTE SAFETY GUARD */}
      {/* ------------------------------------------------------------- */}
      <div className="bg-white dark:bg-[#0e1726] rounded-2xl p-4 border border-sky-100 dark:border-sky-900 shadow-2xs space-y-2.5">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/80 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <Pill className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100">
              ข้อควรระวังความปลอดภัยในการทำงาน (Clinical Safety)
            </h3>
            <p className="text-[10px] text-slate-500">เซฟทั้งคนไข้และเซฟทั้งตัวเราเองในทุกๆ กะ</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
          <div className="p-3 rounded-xl bg-[#f8fbfe] dark:bg-slate-900/60 border border-sky-100 dark:border-slate-800 space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-slate-100">
              <Pill className="w-3.5 h-3.5 text-emerald-600" />
              <span>Double-Check ยาเสี่ยงสูง</span>
            </div>
            <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
              เมื่อขาดนอนสะสมเกิน 4 ชม. สมาธิจะลดลงเทียบเท่าคนดื่มแอลกอฮอล์ ให้เพื่อนช่วยอ่านฉลากยา High Alert เสมอ
            </p>
          </div>

          <div className="p-3 rounded-xl bg-[#f8fbfe] dark:bg-slate-900/60 border border-sky-100 dark:border-slate-800 space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-slate-100">
              <Car className="w-3.5 h-3.5 text-rose-500" />
              <span>งดขับรถทางไกลหลังลงเวรดึก</span>
            </div>
            <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
              ภาวะหลับใน (Microsleep) มักเกิดช่วง 08:30 - 09:30 น. หากขับรถไม่ไหว แวะนอนที่แฟลตวอร์ดหรือจุดพักรถก่อนเสมอ
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
