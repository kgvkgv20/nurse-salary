export type PayoutChannel = 'HOSPITAL' | 'DIRECT';

export type LogType = 'OT_HOURLY' | 'COVER_PEER' | 'EXTERNAL_CLINIC' | 'SELL_SHIFT';

export type ReconcileStatus = 'PENDING' | 'MATCHED' | 'DISCREPANCY' | 'OVERPAID' | 'RESOLVED';

export interface ShiftRates {
  m: number;       // เวรเช้า (Morning)
  a: number;       // เวรบ่าย (Afternoon)
  n: number;       // เวรดึก (Night)
  ot_m: number;    // OT เช้า
  ot_a: number;    // OT บ่าย
  ot_n: number;    // OT ดึก
  holiday: number; // เพิ่มวันหยุดนักขัตฤกษ์ / เวรควง
  ot_hr: number;   // OT รายชั่วโมง
}

export interface ShiftCounts {
  m: number;
  a: number;
  n: number;
  ot_m: number;
  ot_a: number;
  ot_n: number;
  holiday: number;
}

export interface ShiftTimeConfig {
  timeRange: string;  // เช่น "08:00 - 16:00" หรือ "07:00 - 19:00"
  hours: number;      // จำนวนชั่วโมงต่อกะ เช่น 8 หรือ 12
}

export type ShiftTimesMap = { [key in keyof ShiftCounts]?: ShiftTimeConfig };

export interface UserSettings {
  line_user_id: string;
  display_name: string;
  cutoff_start_day: number;      // 1 - 31 (default 21)
  payout_month_offset: number;   // 0 = same month, 1 = next month
  include_base_salary: boolean;
  base_salary: number;
  enable_direct_wallet?: boolean; // เปิด/ปิด การใช้งานกระเป๋า 2 (เวรนอก & เวรแทนเพื่อน)
  default_rates: ShiftRates;
  shift_times?: ShiftTimesMap;   // ปรับแต่งเวลาและจำนวนชั่วโมงของแต่ละเวร
  selected_font?: "noto" | "kanit" | "anuphan" | "prompt";
  updated_at?: string;
}

export interface ExtraPreset {
  id: string;
  line_user_id: string;
  title: string;
  default_amount: number;
  payout_channel: PayoutChannel;
  is_active: boolean;
  created_at?: string;
}

export interface PayPeriod {
  id: string;
  line_user_id: string;
  period_key: string;            // 'YYYY-MM'
  start_date: string;            // 'YYYY-MM-DD'
  end_date: string;              // 'YYYY-MM-DD'
  rates_snapshot: ShiftRates;
  shift_counts: ShiftCounts;
  actual_slip_amount: number | null;
  reconcile_status: ReconcileStatus;
  reconcile_note: string;
  quick_turnaround_count?: number; // เวรบ่ายต่อเช้า (นอน ~4-5 ชม.)
  double_shift_count?: number;     // เวรควง 16 ชม. ติด
  created_at?: string;
  updated_at?: string;
}

export interface NurseGoal {
  id: string;
  line_user_id?: string;
  title: string;
  targetAmount: number;
  currentAmount: number;
  category: 'travel' | 'debt' | 'family' | 'savings' | 'gadget' | 'other';
  emoji: string;
  targetDate?: string;
  isActive: boolean;
  created_at?: string;
}

export interface GoalProgressInfo {
  goal: NurseGoal;
  remainingAmount: number;
  progressPercent: number;
  ratePerShift: number;
  totalShiftsNeeded: number;
  shiftsCompleted: number;
  shiftsRemaining: number;
  encouragingMessage: string;
}

export interface FatigueSafetyStats {
  quickTurnaroundCount: number; // เวรบ่ายต่อเช้า (นอน ~4-5 ชม.)
  doubleShiftCount: number;     // เวรควง 16 ชม. ติด
  nightShiftCount: number;      // เวรดึกสะสม
  sleepDebtHours: number;       // หนี้การนอนสะสม (ชม.)
  safetyScore: number;          // 0 - 100
  fatigueLevel: 'good' | 'moderate' | 'high' | 'critical';
  levelLabel: string;
  levelBadge: string;
  levelColor: string;
  warnings: string[];
  powerNapAdvice: string;
  clinicalSafetyTip: string;
}

export interface ExtraLog {
  id: string;
  period_id: string;
  line_user_id: string;
  work_date: string;             // 'YYYY-MM-DD'
  log_type: LogType;
  title_note: string;
  amount: number;
  payout_channel: PayoutChannel;
  is_paid: boolean;
  created_at?: string;
}

export interface PeriodSummary {
  period: PayPeriod;
  settings: UserSettings;
  extraLogs: ExtraLog[];
  
  // Shift breakdown
  shiftTotals: { [key in keyof ShiftCounts]: { count: number; rate: number; total: number } };
  shiftSum: number;

  // Extra breakdowns
  extraHospitalSum: number;      // Extra into hospital slip
  deductHospitalSum: number;     // Deductions from slip (e.g. sell shift)
  
  // Hospital slip wallet
  baseSalaryAmount: number;
  expectedHospitalSlip: number;  // E_hosp
  actualSlipAmount: number | null;
  deltaSlip: number;             // Actual - Expected
  slipStatus: ReconcileStatus;

  // Direct wallet
  directPaidSum: number;         // E_paid
  directPendingSum: number;      // E_pending
  directTotalSum: number;        // E_direct

  // Net total of all wallets combined
  grandTotal: number;
}

export interface PeriodInfo {
  periodKey: string;             // 'YYYY-MM' (Payout month or period ref)
  payoutMonthNameTh: string;     // e.g. 'พ.ย. 2569'
  startDate: string;             // 'YYYY-MM-DD'
  endDate: string;               // 'YYYY-MM-DD'
  shiftRangeLabelTh: string;     // e.g. '21 ต.ค. - 20 พ.ย. 2569'
  fullLabelTh: string;           // e.g. 'รอบเงินออก พ.ย. 69 (เวร 21 ต.ค. - 20 พ.ย.)'
}
