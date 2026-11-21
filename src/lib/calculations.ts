import {
  ExtraLog,
  FatigueSafetyStats,
  GoalProgressInfo,
  NurseGoal,
  PayPeriod,
  PeriodInfo,
  PeriodSummary,
  ReconcileStatus,
  ShiftCounts,
  ShiftRates,
  UserSettings,
} from "@/types";
import { DEFAULT_SHIFT_COUNTS, THAI_MONTH_FULL, THAI_MONTH_SHORT } from "./constants";

/**
 * Format date to YYYY-MM-DD
 */
export function formatDate(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Format currency to Thai Baht with comma
 */
export function formatBaht(amount: number | null | undefined, showDecimals: boolean = false): string {
  if (amount === null || amount === undefined || isNaN(amount)) return "0";
  return new Intl.NumberFormat("th-TH", {
    minimumFractionDigits: showDecimals ? 2 : 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Format Date to Thai short string: '21 ต.ค. 69'
 */
export function formatThaiDate(dateStr: string, includeYear: boolean = true): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;

  const day = d.getDate();
  const monthShort = THAI_MONTH_SHORT[d.getMonth()];
  const thaiYearShort = String((d.getFullYear() + 543) % 100).padStart(2, "0");

  return includeYear ? `${day} ${monthShort} ${thaiYearShort}` : `${day} ${monthShort}`;
}

/**
 * Helper to safely clamp days without date rollover bug (e.g. Feb 30 -> Feb 28/29)
 */
function getSafeDate(year: number, monthIndex: number, day: number): Date {
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const safeDay = Math.min(Math.max(1, day), daysInMonth);
  return new Date(year, monthIndex, safeDay);
}

/**
 * Calculate Period Information (Dates and Thai Labels) - Bug-free across all months & leap years
 * @param periodKey 'YYYY-MM' (Payout month e.g. '2026-11')
 * @param cutoffStartDay e.g. 21
 * @param payoutMonthOffset 0 = paid same month, 1 = paid next month
 */
export function computePeriodInfo(
  periodKey: string,
  cutoffStartDay: number = 21,
  payoutMonthOffset: number = 1
): PeriodInfo {
  const [yStr, mStr] = periodKey.split("-");
  const year = parseInt(yStr, 10);
  const month = parseInt(mStr, 10); // 1 - 12 (Payout month)

  // Determine cycle end date:
  // If offset === 0: work shifts close in the payout month itself (e.g. 21 Oct - 20 Nov, paid late Nov)
  // If offset === 1: work shifts close in the month before payout (e.g. 21 Sep - 20 Oct, paid late Nov)
  const shiftEndMonthIndex = month - 1 - payoutMonthOffset;
  const shiftEndRefDate = new Date(year, shiftEndMonthIndex, 1);
  const shiftEndYear = shiftEndRefDate.getFullYear();
  const shiftEndMonth = shiftEndRefDate.getMonth(); // 0-based

  let endDateObj: Date;
  let startDateObj: Date;

  if (cutoffStartDay === 1) {
    // If cutoff is 1st of month: runs from 1st to last day of that month
    const daysInMonth = new Date(shiftEndYear, shiftEndMonth + 1, 0).getDate();
    startDateObj = new Date(shiftEndYear, shiftEndMonth, 1);
    endDateObj = new Date(shiftEndYear, shiftEndMonth, daysInMonth);
  } else {
    // Cutoff day - 1 of shiftEndMonth
    const endDayTarget = cutoffStartDay - 1;
    endDateObj = getSafeDate(shiftEndYear, shiftEndMonth, endDayTarget);

    // Start date is cutoffStartDay of previous month (shiftEndMonth - 1)
    const prevMonthRef = new Date(shiftEndYear, shiftEndMonth - 1, 1);
    startDateObj = getSafeDate(prevMonthRef.getFullYear(), prevMonthRef.getMonth(), cutoffStartDay);
  }

  const startDate = formatDate(startDateObj);
  const endDate = formatDate(endDateObj);

  // Thai labels
  const payoutThaiYearShort = String((year + 543) % 100).padStart(2, "0");
  const payoutThaiYearFull = year + 543;
  const payoutMonthName = `${THAI_MONTH_SHORT[month - 1]} ${payoutThaiYearShort}`;
  const payoutMonthNameFull = `${THAI_MONTH_FULL[month - 1]} ${payoutThaiYearFull}`;

  const startThai = formatThaiDate(startDate, false);
  const endThai = formatThaiDate(endDate, true);
  const shiftRangeLabelTh = `${startThai} - ${endThai}`;
  const fullLabelTh = `รอบเงินออก ${payoutMonthName} (เวร ${startThai} - ${formatThaiDate(endDate, false)})`;

  return {
    periodKey,
    payoutMonthNameTh: payoutMonthNameFull,
    startDate,
    endDate,
    shiftRangeLabelTh,
    fullLabelTh,
  };
}

/**
 * Given a periodKey 'YYYY-MM', get previous or next month key bug-free
 */
export function shiftPeriodKey(periodKey: string, deltaMonths: number): string {
  const [yStr, mStr] = periodKey.split("-");
  const d = new Date(parseInt(yStr, 10), parseInt(mStr, 10) - 1 + deltaMonths, 1);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

/**
 * Calculate Summary for a Period
 */
export function calculatePeriodSummary(
  period: PayPeriod,
  settings: UserSettings,
  extraLogs: ExtraLog[]
): PeriodSummary {
  const rates = period.rates_snapshot || settings.default_rates;
  const counts = period.shift_counts || DEFAULT_SHIFT_COUNTS;

  const shiftTotals = {
    m: { count: counts.m || 0, rate: rates.m || 0, total: (counts.m || 0) * (rates.m || 0) },
    a: { count: counts.a || 0, rate: rates.a || 0, total: (counts.a || 0) * (rates.a || 0) },
    n: { count: counts.n || 0, rate: rates.n || 0, total: (counts.n || 0) * (rates.n || 0) },
    ot_m: { count: counts.ot_m || 0, rate: rates.ot_m || 0, total: (counts.ot_m || 0) * (rates.ot_m || 0) },
    ot_a: { count: counts.ot_a || 0, rate: rates.ot_a || 0, total: (counts.ot_a || 0) * (rates.ot_a || 0) },
    ot_n: { count: counts.ot_n || 0, rate: rates.ot_n || 0, total: (counts.ot_n || 0) * (rates.ot_n || 0) },
    holiday: { count: counts.holiday || 0, rate: rates.holiday || 0, total: (counts.holiday || 0) * (rates.holiday || 0) },
  };

  const shiftSum = Object.values(shiftTotals).reduce((sum, item) => sum + item.total, 0);

  // Extra logs
  let extraHospitalSum = 0;
  let deductHospitalSum = 0;
  let directPaidSum = 0;
  let directPendingSum = 0;

  for (const log of extraLogs) {
    if (log.payout_channel === "HOSPITAL") {
      if (log.log_type === "SELL_SHIFT") {
        deductHospitalSum += Number(log.amount) || 0;
      } else {
        extraHospitalSum += Number(log.amount) || 0;
      }
    } else {
      // DIRECT
      if (log.is_paid) {
        directPaidSum += Number(log.amount) || 0;
      } else {
        directPendingSum += Number(log.amount) || 0;
      }
    }
  }

  const directTotalSum = directPaidSum + directPendingSum;

  const baseSalaryAmount = settings.include_base_salary ? Number(settings.base_salary) || 0 : 0;
  const expectedHospitalSlip = shiftSum + extraHospitalSum - deductHospitalSum + baseSalaryAmount;

  const actualSlipAmount = period.actual_slip_amount !== null && period.actual_slip_amount !== undefined
    ? Number(period.actual_slip_amount)
    : null;

  let deltaSlip = 0;
  let slipStatus: ReconcileStatus = "PENDING";

  if (actualSlipAmount !== null) {
    deltaSlip = actualSlipAmount - expectedHospitalSlip;
    if (Math.abs(deltaSlip) < 0.01) {
      slipStatus = "MATCHED";
    } else if (deltaSlip < 0) {
      slipStatus = "DISCREPANCY";
    } else {
      slipStatus = "OVERPAID";
    }
  }

  const grandTotal = expectedHospitalSlip + directTotalSum;

  return {
    period,
    settings,
    extraLogs,
    shiftTotals,
    shiftSum,
    extraHospitalSum,
    deductHospitalSum,
    baseSalaryAmount,
    expectedHospitalSlip,
    actualSlipAmount,
    deltaSlip,
    slipStatus,
    directPaidSum,
    directPendingSum,
    directTotalSum,
    grandTotal,
  };
}

// ==============================================================================
// 1. TAX ESTIMATOR (ภ.ง.ด. 91 / สรรพากรไทย)
// ==============================================================================
export interface TaxEstimate {
  annualGrossIncome: number;
  deductExpense: number;        // 50% สูงสุด 100,000 บ.
  deductPersonal: number;       // ค่าลดหย่อนส่วนตัว 60,000 บ.
  deductSocialSecurity: number; // ประกันสังคม ~9,000 บ./ปี
  netTaxableIncome: number;
  estimatedTax: number;
  currentBracketRate: number;   // 0, 0.05, 0.10, 0.15, 0.20
  nextBracketThreshold: number | null;
  amountToNextBracket: number | null;
  bracketLabel: string;
}

export function estimateThaiTax(annualGrossIncome: number): TaxEstimate {
  const deductExpense = Math.min(annualGrossIncome * 0.5, 100000);
  const deductPersonal = 60000;
  const deductSocialSecurity = 9000;
  const netTaxableIncome = Math.max(0, annualGrossIncome - deductExpense - deductPersonal - deductSocialSecurity);

  let estimatedTax = 0;
  let currentBracketRate = 0;
  let nextBracketThreshold: number | null = 150000;
  let bracketLabel = "ยกเว้นภาษี (0%)";

  if (netTaxableIncome <= 150000) {
    estimatedTax = 0;
    currentBracketRate = 0;
    nextBracketThreshold = 150000;
    bracketLabel = "ยกเว้นภาษี (0%)";
  } else if (netTaxableIncome <= 300000) {
    estimatedTax = (netTaxableIncome - 150000) * 0.05;
    currentBracketRate = 0.05;
    nextBracketThreshold = 300000;
    bracketLabel = "ฐาน 5%";
  } else if (netTaxableIncome <= 500000) {
    estimatedTax = 7500 + (netTaxableIncome - 300000) * 0.10;
    currentBracketRate = 0.10;
    nextBracketThreshold = 500000;
    bracketLabel = "ฐาน 10%";
  } else if (netTaxableIncome <= 750000) {
    estimatedTax = 27500 + (netTaxableIncome - 500000) * 0.15;
    currentBracketRate = 0.15;
    nextBracketThreshold = 750000;
    bracketLabel = "ฐาน 15%";
  } else {
    estimatedTax = 65000 + (netTaxableIncome - 750000) * 0.20;
    currentBracketRate = 0.20;
    nextBracketThreshold = null;
    bracketLabel = "ฐาน 20%";
  }

  const amountToNextBracket = nextBracketThreshold ? Math.max(0, nextBracketThreshold - netTaxableIncome) : null;

  return {
    annualGrossIncome,
    deductExpense,
    deductPersonal,
    deductSocialSecurity,
    netTaxableIncome,
    estimatedTax,
    currentBracketRate,
    nextBracketThreshold,
    amountToNextBracket,
    bracketLabel,
  };
}

// ==============================================================================
// 2. NURSE WORK HOURS & HEALING ENERGY
// ==============================================================================
export interface NurseEnergyStats {
  totalHours: number;
  normalHours: number;
  otHours: number;
  nightShifts: number;
  afternoonShifts: number;
  morningShifts: number;
  totalShiftCount: number;

  // Detailed shift hours breakdown
  hoursBreakdown: {
    morningHours: number;
    afternoonHours: number;
    nightHours: number;
    otShiftHours: number;
    extraLogHours: number;
  };

  // Standard vs Nurse Work Hours Comparison
  standardWorkdays: number;       // e.g. 21 วัน (จันทร์-ศุกร์ ในรอบเดือนนั้น)
  standardWorkHours: number;      // e.g. 168 ชม. (21 วัน x 8 ชม.)
  diffHours: number;              // totalHours - standardWorkHours (เช่น +48 หรือ -8)
  overworkPercent: number;        // เช่น +28.6%
  extraDaysEquivalent: number;    // diffHours / 8 เช่น 6.0 วันทำงาน
  workloadStatus: {
    level: "normal" | "moderate" | "heavy" | "extreme";
    title: string;
    badge: string;
    advice: string;
    color: string;
  };

  healingMessage: {
    title: string;
    quote: string;
    emoji: string;
    badge: string;
  };
}

/**
 * Count the number of standard workdays (Monday through Friday) in a date range [startDate, endDate]
 */
export function countStandardWorkdays(startDateStr: string, endDateStr: string): number {
  if (!startDateStr || !endDateStr) return 21; // fallback standard 21 days
  const start = new Date(startDateStr);
  const end = new Date(endDateStr);
  if (isNaN(start.getTime()) || isNaN(end.getTime())) return 21;

  let count = 0;
  // Use noon to prevent DST/local timezone shifts
  const cur = new Date(start.getFullYear(), start.getMonth(), start.getDate(), 12, 0, 0);
  const stop = new Date(end.getFullYear(), end.getMonth(), end.getDate(), 12, 0, 0);

  while (cur <= stop) {
    const dayOfWeek = cur.getDay(); // 0 is Sun, 6 is Sat
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      count++;
    }
    cur.setDate(cur.getDate() + 1);
  }

  return Math.max(1, count);
}

export function computeNurseEnergy(summary: PeriodSummary): NurseEnergyStats {
  const counts = summary.period.shift_counts || DEFAULT_SHIFT_COUNTS;
  const shiftTimes = summary.settings.shift_times;

  // Normal shift hours based on customized shift hours
  const mHours = (counts.m || 0) * (shiftTimes?.m?.hours ?? 8);
  const aHours = (counts.a || 0) * (shiftTimes?.a?.hours ?? 8);
  const nHours = (counts.n || 0) * (shiftTimes?.n?.hours ?? 8);
  const normalHours = mHours + aHours + nHours;

  // Full OT shift hours based on customized shift hours
  const otMHours = (counts.ot_m || 0) * (shiftTimes?.ot_m?.hours ?? 8);
  const otAHours = (counts.ot_a || 0) * (shiftTimes?.ot_a?.hours ?? 8);
  const otNHours = (counts.ot_n || 0) * (shiftTimes?.ot_n?.hours ?? 8);
  const otShiftHours = otMHours + otAHours + otNHours;
  let extraLogHours = 0;
  
  // Extra logs hours
  for (const log of summary.extraLogs) {
    if (log.log_type === "OT_HOURLY") {
      const match = log.title_note.match(/(\d+)\s*(?:ชม|ชั่วโมง)/);
      if (match) {
        extraLogHours += parseInt(match[1], 10);
      } else {
        const hrRate = summary.period.rates_snapshot?.ot_hr || summary.settings.default_rates.ot_hr || 120;
        extraLogHours += Math.max(1, Math.round(log.amount / hrRate));
      }
    } else if (log.log_type === "COVER_PEER" || log.log_type === "EXTERNAL_CLINIC") {
      extraLogHours += 8;
    }
  }

  const otHours = otShiftHours + extraLogHours;
  const totalHours = normalHours + otHours;
  const morningShifts = (counts.m || 0) + (counts.ot_m || 0);
  const afternoonShifts = (counts.a || 0) + (counts.ot_a || 0);
  const nightShifts = (counts.n || 0) + (counts.ot_n || 0);
  const totalShiftCount = Object.values(counts).reduce((a, b) => a + b, 0);

  // Standard benchmark calculation (เกณฑ์คนทำงานทั่วไป 8 ชม./วัน จันทร์-ศุกร์ ในรอบเดือนนั้น)
  const standardWorkdays = countStandardWorkdays(summary.period.start_date, summary.period.end_date);
  const standardWorkHours = standardWorkdays * 8;
  const diffHours = totalHours - standardWorkHours;
  const overworkPercent = standardWorkHours > 0 ? ((totalHours - standardWorkHours) / standardWorkHours) * 100 : 0;
  const extraDaysEquivalent = Math.round((Math.abs(diffHours) / 8) * 10) / 10;

  let workloadStatus: NurseEnergyStats["workloadStatus"];
  if (diffHours > 48) {
    workloadStatus = {
      level: "extreme",
      title: "ทำงานเกินเกณฑ์หนักมาก (Extreme Load)",
      badge: `เกินคนทั่วไป +${diffHours} ชม. (+${extraDaysEquivalent} วัน)`,
      advice: `ขึ้นเวรสูงถึง ${totalHours} ชม. ในรอบนี้ ซึ่งเกินเวลาทำงานมาตรฐานคนทั่วไปไปถึง ${diffHours} ชม. (เทียบเท่าคนทั่วไปทำงานเพิ่มอีก ${extraDaysEquivalent} วันเต็ม!) โปรดระวังความล้าสะสมและหาเวลาพักผ่อนฟื้นฟูร่างกายด่วนน้า 🤍`,
      color: "rose",
    };
  } else if (diffHours > 16) {
    workloadStatus = {
      level: "heavy",
      title: "ทำงานหนักกว่าคนทั่วไป (High Load)",
      badge: `เกินคนทั่วไป +${diffHours} ชม. (+${extraDaysEquivalent} วัน)`,
      advice: `ขึ้นเวร ${totalHours} ชม. ในรอบนี้ เกินกว่าคนทั่วไปทำกันไป ${diffHours} ชม. (เทียบเท่าเพิ่มอีก ${extraDaysEquivalent} วันทำงาน) เป็นกำลังใจให้คนเก่งของวอร์ดนะ 🌸`,
      color: "amber",
    };
  } else if (diffHours > 0) {
    workloadStatus = {
      level: "moderate",
      title: "มีเวรพิเศษเกินเวลาปกติเล็กน้อย",
      badge: `เกินคนทั่วไป +${diffHours} ชม.`,
      advice: `ทำงานรวม ${totalHours} ชม. เกินเกณฑ์มาตรฐานทั่วไป ${diffHours} ชม. มี OT กำลังดีและรักษาสมดุลชีวิตได้เยี่ยม ✨`,
      color: "sky",
    };
  } else {
    workloadStatus = {
      level: "normal",
      title: "ชั่วโมงงานสมดุลตามเกณฑ์มาตรฐาน",
      badge: `อยู่ในเกณฑ์ปกติ (${totalHours}/${standardWorkHours} ชม.)`,
      advice: `ชั่วโมงทำงานรอบนี้ (${totalHours} ชม.) อยู่ในเกณฑ์มาตรฐานของคนทำงานทั่วไป สุขภาพกายและจิตใจสมดุลดีเยี่ยม 🌿`,
      color: "emerald",
    };
  }

  let healingMessage = {
    title: "คนเก่งของวอร์ด 🌸",
    quote: "รักษาสุขภาพนะคนเก่ง เหนื่อยก็พัก เติมพลังด้วยของหวานแก้วโปรดน้า",
    emoji: "🧋",
    badge: "พักผ่อนเยอะๆ น้า",
  };

  if (diffHours > 48) {
    healingMessage = {
      title: "ฮีโร่ผู้ทุ่มเทเกินร้อย 🤍",
      quote: `รอบนี้ขึ้นเวรไปถึง ${totalHours} ชม. เกินคนทั่วไปถึง +${diffHours} ชม. (${extraDaysEquivalent} วันทำงาน) เก่งที่สุดแล้ว อย่าลืมดูแลตัวเองด้วยนะ`,
      emoji: "🦸‍♀️",
      badge: `เกินคนทั่วไป +${diffHours} ชม.`,
    };
  } else if (nightShifts >= 7) {
    healingMessage = {
      title: "นักสู้กะดึก 🌙",
      quote: `รอบนี้ขึ้นเวรดึกถึง ${nightShifts} กะ! ดื่มน้ำอุ่นเยอะๆ นอนในห้องมืดสนิทนะคนเก่ง`,
      emoji: "😴",
      badge: `เวรดึกสะสม ${nightShifts} กะ`,
    };
  } else if (totalHours >= 190) {
    healingMessage = {
      title: "ฮีโร่เสื้อขาว 🤍",
      quote: `ทำงานหนักมากถึง ${totalHours} ชม.! เก่งที่สุดแล้ว ให้รางวัลตัวเองสักชิ้นนะ`,
      emoji: "✨",
      badge: `ทำงาน ${totalHours} ชม. สุดยอด!`,
    };
  } else if (summary.slipStatus === "MATCHED") {
    healingMessage = {
      title: "ยอดสลิปเป๊ะปัง 🎉",
      quote: "ค่าเวรโรงพยาบาลเข้าตรงครบทุกบาท สบายใจหายเหนื่อยเลยน้า ยินดีด้วยจ้า!",
      emoji: "🥳",
      badge: "ยอดตรงเป๊ะ 100%",
    };
  }

  return {
    totalHours,
    normalHours,
    otHours,
    nightShifts,
    afternoonShifts,
    morningShifts,
    totalShiftCount,
    hoursBreakdown: {
      morningHours: mHours,
      afternoonHours: aHours,
      nightHours: nHours,
      otShiftHours,
      extraLogHours,
    },
    standardWorkdays,
    standardWorkHours,
    diffHours,
    overworkPercent,
    extraDaysEquivalent,
    workloadStatus,
    healingMessage,
  };
}

/**
 * ----------------------------------------------------------------------
 * 🎯 ฟีเจอร์: เหนื่อยเพื่อเป้าหมาย — แปลงความฝันเป็น "จำนวนเวร" (Shift-to-Dream)
 * ----------------------------------------------------------------------
 */
export function computeGoalProgress(
  goal: NurseGoal,
  avgRate: number = 750
): GoalProgressInfo {
  const ratePerShift = avgRate > 0 ? avgRate : 750;
  const target = Math.max(0, goal.targetAmount);
  const current = Math.max(0, goal.currentAmount);
  const remainingAmount = Math.max(0, target - current);

  const totalShiftsNeeded = target > 0 ? Math.ceil(target / ratePerShift) : 0;
  const shiftsCompleted = totalShiftsNeeded > 0 ? Math.min(totalShiftsNeeded, Math.floor(current / ratePerShift)) : 0;
  const shiftsRemaining = Math.max(0, Math.ceil(remainingAmount / ratePerShift));

  const progressPercent = target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 100;

  let encouragingMessage = "";
  if (shiftsRemaining === 0) {
    encouragingMessage = `ยินดีด้วยนะคนเก่ง! 🎉 บรรลุเป้าหมายแล้ว ได้เวลาให้รางวัลชีวิตตัวเองเต็มที่!`;
  } else if (shiftsRemaining <= 3) {
    encouragingMessage = `อีกแค่ ${shiftsRemaining} เวรเท่านั้น! เส้นชัยอยู่ตรงหน้าแล้ว สู้ๆ นะคนเก่ง 🚀`;
  } else if (progressPercent >= 75) {
    encouragingMessage = `ทำไปแล้ว ${shiftsCompleted} เวร เหลืออีกแค่ ${shiftsRemaining} เวร โค้งสุดท้ายแล้ว ความฝันเป็นจริงแน่นอน! ✨`;
  } else if (progressPercent >= 50) {
    encouragingMessage = `เกินครึ่งทางแล้ว! ทำไปแล้ว ${shiftsCompleted} เวร เหลืออีก ${shiftsRemaining} เวร ทุกหยาดเหงื่อมีความหมายนะ 💪`;
  } else if (shiftsCompleted > 0) {
    encouragingMessage = `ก้าวหน้าไปแล้ว ${shiftsCompleted} เวร เหลืออีก ${shiftsRemaining} เวร ค่อยๆ ก้าวเข้าใกล้อนาคตทีละกะ สู้ๆ น้า 🌸`;
  } else {
    encouragingMessage = `เป้าหมายนี้ต้องขึ้นเวรประมาณ ${totalShiftsNeeded} เวร เริ่มก้าวแรกวันนี้กันนะคนเก่ง! 🤍`;
  }

  return {
    goal,
    remainingAmount,
    progressPercent,
    ratePerShift,
    totalShiftsNeeded,
    shiftsCompleted,
    shiftsRemaining,
    encouragingMessage,
  };
}

/**
 * ----------------------------------------------------------------------
 * ⚠️ ฟีเจอร์: เรดาร์ตรวจจับเวรควงอันตราย & คำนวณชั่วโมงนอนจริง (Fatigue & Shift Safety Guard)
 * ----------------------------------------------------------------------
 */
export function computeFatigueSafety(
  summary: PeriodSummary,
  quickTurnaroundOverride?: number,
  doubleShiftOverride?: number
): FatigueSafetyStats {
  const counts = summary.period.shift_counts || DEFAULT_SHIFT_COUNTS;

  // Use override if provided, otherwise period data, otherwise fallback
  const quickTurnaroundCount =
    quickTurnaroundOverride !== undefined
      ? quickTurnaroundOverride
      : summary.period.quick_turnaround_count ?? 2;

  const doubleShiftCount =
    doubleShiftOverride !== undefined
      ? doubleShiftOverride
      : summary.period.double_shift_count ?? 0;

  // Count night shifts
  const nightShiftCount = (counts.n || 0) + (counts.ot_n || 0);

  // Sleep Debt Calculation (ชั่วโมงนอนที่สูญเสียไปเทียบกับเกณฑ์พักผ่อนปกติ 8 ชม.)
  // - Quick Turnaround (บ่ายเลิก 24:00 ต่อ เช้า 08:00): เสียเวลานอน ~3.5 ชม. ต่อครั้ง (นอนได้จริงแค่ 4.5 ชม.)
  // - Double Shift (ควง 16 ชม. ติด): สูญเสียเวลานอนพักฟื้น ~4.0 ชม. ต่อครั้ง
  // - กะดึกสะสมเกิน 5 เวร: นาฬิกาชีวภาพเพี้ยน สูญเสียคุณภาพการนอนลึก ~1.5 ชม. ต่องวดส่วนเกิน
  const sleepDebtHours = Math.round(
    (quickTurnaroundCount * 3.5 +
      doubleShiftCount * 4.0 +
      Math.max(0, nightShiftCount - 5) * 1.5) * 10
  ) / 10;

  // Safety Score (0 - 100): Clinical Alert Score
  let score = 100;
  score -= quickTurnaroundCount * 16;
  score -= doubleShiftCount * 22;
  if (nightShiftCount >= 8) {
    score -= 18;
  } else if (nightShiftCount >= 5) {
    score -= 10;
  }

  // Penalty for excessive overall shift count
  const totalShifts = Object.values(counts).reduce((a, b) => a + b, 0);
  if (totalShifts > 28) {
    score -= 12;
  } else if (totalShifts > 24) {
    score -= 6;
  }

  const safetyScore = Math.max(15, Math.min(100, Math.round(score)));

  let fatigueLevel: FatigueSafetyStats["fatigueLevel"];
  let levelLabel: string;
  let levelBadge: string;
  let levelColor: string;

  if (safetyScore >= 80) {
    fatigueLevel = "good";
    levelLabel = "ความปลอดภัยระดับดี (Green Zone)";
    levelBadge = "ร่างกายสมดุล 🌿";
    levelColor = "emerald";
  } else if (safetyScore >= 60) {
    fatigueLevel = "moderate";
    levelLabel = "เริ่มมีความล้าสะสม (Yellow Zone)";
    levelBadge = "ควรพักผ่อนเพิ่ม ⚠️";
    levelColor = "sky";
  } else if (safetyScore >= 40) {
    fatigueLevel = "high";
    levelLabel = "ล้าสูง เสี่ยงหลับใน (Orange Zone)";
    levelBadge = "เสี่ยงล้าสะสม 🚨";
    levelColor = "amber";
  } else {
    fatigueLevel = "critical";
    levelLabel = "วิกฤตล้าสะสมรุนแรง (Red Zone)";
    levelBadge = "อันตราย พักด่วน! 🛑";
    levelColor = "rose";
  }

  // Warnings list
  const warnings: string[] = [];
  if (quickTurnaroundCount > 0) {
    warnings.push(
      `มีเวรบ่ายต่อเช้า ${quickTurnaroundCount} ครั้ง (บ่ายเลิกเที่ยงคืน ต่อเช้า 8 โมง มีเวลานอนจริงเพียง 4-5 ชม.)`
    );
  }
  if (doubleShiftCount > 0) {
    warnings.push(
      `มีเวรควง 16 ชม. ติดกัน ${doubleShiftCount} ครั้ง สมองและกล้ามเนื้อล้าสะสมอย่างรวดเร็วหลังชั่วโมงที่ 12`
    );
  }
  if (nightShiftCount >= 7) {
    warnings.push(
      `ขึ้นเวรดึกสะสมถึง ${nightShiftCount} กะ ส่งผลต่อฮอร์โมน Melatonin และ Circadian Rhythm`
    );
  }

  // Evidence-based Power Nap Advice
  const powerNapAdvice =
    quickTurnaroundCount > 0 || doubleShiftCount > 0
      ? "แนะนำวางแผนงีบสั้น (Power Nap) 20 นาที ก่อนเวลา 15:00 น. หรือช่วงพักกะ เพื่อรีเซ็ตสมองโดยไม่เข้าสู่ Deep Sleep Inertia (อาการงัวเงียตื่นยาก)"
      : "รักษาเวลานอนให้ตรงเวลา และนอนในห้องที่มืดสนิท อุณหภูมิเย็นสบาย เพื่อฟื้นฟูร่างกายเต็มที่";

  // Clinical Safety Tip to prevent Medication Error
  const clinicalSafetyTip =
    safetyScore < 60
      ? "⚠️ เมื่อร่างกายสะสมความล้าสูง (โดยเฉพาะช่วง 03:00 - 05:00 น.) ความเสี่ยงจ่ายยาผิดพลาด (Medication Error) เพิ่มขึ้นถึง 3 เท่า! ขอแนะนำให้ทำ Double-check กลุ่มยา High Alert Drugs (HAD) และคำนวณ IV Drip ร่วมกับเพื่อนร่วมเวรเสมอ และระวังหลับในขณะขับรถกลับบ้าน"
      : "เพื่อความปลอดภัยของผู้ป่วยและตัวคุณเอง ควรดื่มน้ำเปล่าให้เพียงพอระหว่างเวร และ Double-check คำสั่งแพทย์ยากลุ่ม High Alert Drugs เสมอ";

  return {
    quickTurnaroundCount,
    doubleShiftCount,
    nightShiftCount,
    sleepDebtHours,
    safetyScore,
    fatigueLevel,
    levelLabel,
    levelBadge,
    levelColor,
    warnings,
    powerNapAdvice,
    clinicalSafetyTip,
  };
}
