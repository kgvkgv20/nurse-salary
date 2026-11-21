import { ExtraLog, ExtraPreset, NurseGoal, PayPeriod, ShiftCounts, UserSettings } from "@/types";
import { computePeriodInfo, estimateThaiTax, TaxEstimate } from "./calculations";
import { DEFAULT_RATES, DEFAULT_SHIFT_COUNTS, DEFAULT_USER_SETTINGS } from "./constants";
import { isSupabaseConfigured, supabase } from "./supabaseClient";

const STORAGE_KEYS = {
  USER_SETTINGS: "nursepay_user_settings",
  PRESETS: "nursepay_presets",
  PAY_PERIODS: "nursepay_pay_periods",
  EXTRA_LOGS: "nursepay_extra_logs",
  GOALS: "nursepay_goals",
};

// Default seed presets
const SEED_PRESETS: ExtraPreset[] = [
  {
    id: "preset-1",
    line_user_id: DEFAULT_USER_SETTINGS.line_user_id,
    title: "คลินิกหมอสมชาย (17:00-20:00)",
    default_amount: 900,
    payout_channel: "DIRECT",
    is_active: true,
  },
  {
    id: "preset-2",
    line_user_id: DEFAULT_USER_SETTINGS.line_user_id,
    title: "รพ.เอกชน B (กะดึก)",
    default_amount: 2000,
    payout_channel: "DIRECT",
    is_active: true,
  },
  {
    id: "preset-3",
    line_user_id: DEFAULT_USER_SETTINGS.line_user_id,
    title: "OT อยู่ต่อ 2 ชม. (วอร์ด 5)",
    default_amount: 240,
    payout_channel: "HOSPITAL",
    is_active: true,
  },
];

// Default seed goals for "Shift-to-Dream"
export const SEED_GOALS: NurseGoal[] = [
  {
    id: "goal-japan",
    line_user_id: DEFAULT_USER_SETTINGS.line_user_id,
    title: "ทริปเที่ยวญี่ปุ่น 🌸",
    targetAmount: 45000,
    currentAmount: 24000,
    category: "travel",
    emoji: "✈️",
    targetDate: "2026-12-31",
    isActive: true,
    created_at: new Date().toISOString(),
  },
  {
    id: "goal-debt",
    line_user_id: DEFAULT_USER_SETTINGS.line_user_id,
    title: "ปลดหนี้ กยศ. 🎓",
    targetAmount: 60000,
    currentAmount: 18000,
    category: "debt",
    emoji: "🎓",
    isActive: false,
    created_at: new Date().toISOString(),
  },
  {
    id: "goal-ipad",
    line_user_id: DEFAULT_USER_SETTINGS.line_user_id,
    title: "ซื้อ iPad ให้คุณแม่ 📱",
    targetAmount: 25000,
    currentAmount: 12000,
    category: "family",
    emoji: "🎁",
    isActive: false,
    created_at: new Date().toISOString(),
  },
];

// Seed full 12 months of 2026 for rich year-round view and bug-free multi-month browsing
function getSeedPeriods(userId: string, settings: UserSettings): { periods: PayPeriod[]; logs: ExtraLog[] } {
  const monthsData = [
    { key: "2026-01", a: 9, n: 8, ot_m: 2, ot_a: 3, ot_n: 2, h: 2, slip: 15600, status: "MATCHED" as const },
    { key: "2026-02", a: 8, n: 7, ot_m: 2, ot_a: 2, ot_n: 2, h: 1, slip: 14200, status: "MATCHED" as const },
    { key: "2026-03", a: 10, n: 9, ot_m: 3, ot_a: 3, ot_n: 2, h: 0, slip: 16100, status: "MATCHED" as const },
    { key: "2026-04", a: 8, n: 8, ot_m: 4, ot_a: 4, ot_n: 3, h: 3, slip: 18200, status: "MATCHED" as const },
    { key: "2026-05", a: 11, n: 8, ot_m: 1, ot_a: 2, ot_n: 2, h: 2, slip: 14900, status: "MATCHED" as const },
    { key: "2026-06", a: 9, n: 8, ot_m: 2, ot_a: 2, ot_n: 2, h: 2, slip: 14800, status: "MATCHED" as const },
    { key: "2026-07", a: 10, n: 8, ot_m: 2, ot_a: 3, ot_n: 2, h: 1, slip: 15300, status: "MATCHED" as const },
    { key: "2026-08", a: 11, n: 9, ot_m: 1, ot_a: 2, ot_n: 1, h: 0, slip: 13200, status: "MATCHED" as const },
    { key: "2026-09", a: 9, n: 7, ot_m: 3, ot_a: 3, ot_n: 3, h: 2, slip: 16800, status: "MATCHED" as const },
    { key: "2026-10", a: 8, n: 8, ot_m: 2, ot_a: 2, ot_n: 2, h: 1, slip: 14500, status: "MATCHED" as const },
    { key: "2026-11", a: 10, n: 8, ot_m: 2, ot_a: 4, ot_n: 3, h: 2, slip: 17200, status: "DISCREPANCY" as const },
    { key: "2026-12", a: 10, n: 9, ot_m: 2, ot_a: 3, ot_n: 2, h: 2, slip: null, status: "PENDING" as const },
  ];

  const periods: PayPeriod[] = monthsData.map((m) => {
    const pInfo = computePeriodInfo(m.key, settings.cutoff_start_day, settings.payout_month_offset);
    return {
      id: `period-${m.key}`,
      line_user_id: userId,
      period_key: m.key,
      start_date: pInfo.startDate,
      end_date: pInfo.endDate,
      rates_snapshot: { ...settings.default_rates },
      shift_counts: {
        m: 0,
        a: m.a,
        n: m.n,
        ot_m: m.ot_m,
        ot_a: m.ot_a,
        ot_n: m.ot_n,
        holiday: m.h,
      },
      actual_slip_amount: m.slip,
      reconcile_status: m.status,
      reconcile_note: m.status === "DISCREPANCY" ? "ขาด OT บ่ายวันที่ 12 พ.ย. แจ้งพี่ธุรการแล้ว" : "",
      quick_turnaround_count: m.key === "2026-11" ? 2 : (m.key === "2026-10" ? 1 : 0),
      double_shift_count: m.key === "2026-11" ? 0 : 0,
    };
  });

  const logs: ExtraLog[] = [
    {
      id: "log-1",
      period_id: "period-2026-11",
      line_user_id: userId,
      work_date: "2026-11-04",
      log_type: "COVER_PEER",
      title_note: "รับดึกแทนฟ้า",
      amount: 800,
      payout_channel: "DIRECT",
      is_paid: false,
    },
    {
      id: "log-2",
      period_id: "period-2026-11",
      line_user_id: userId,
      work_date: "2026-11-08",
      log_type: "OT_HOURLY",
      title_note: "อยู่ต่อเคส CPR ฉุกเฉิน 2 ชม.",
      amount: 240,
      payout_channel: "HOSPITAL",
      is_paid: true,
    },
    {
      id: "log-3",
      period_id: "period-2026-11",
      line_user_id: userId,
      work_date: "2026-11-12",
      log_type: "EXTERNAL_CLINIC",
      title_note: "คลินิกหมอสมชาย",
      amount: 900,
      payout_channel: "DIRECT",
      is_paid: true,
    },
    {
      id: "log-4",
      period_id: "period-2026-11",
      line_user_id: userId,
      work_date: "2026-11-15",
      log_type: "COVER_PEER",
      title_note: "รับบ่ายแทนเนย",
      amount: 700,
      payout_channel: "DIRECT",
      is_paid: false,
    },
    {
      id: "log-h1",
      period_id: "period-2026-10",
      line_user_id: userId,
      work_date: "2026-10-05",
      log_type: "EXTERNAL_CLINIC",
      title_note: "คลินิกหมอสมชาย",
      amount: 1800,
      payout_channel: "DIRECT",
      is_paid: true,
    },
    {
      id: "log-h2",
      period_id: "period-2026-09",
      line_user_id: userId,
      work_date: "2026-09-10",
      log_type: "EXTERNAL_CLINIC",
      title_note: "รพ.เอกชน B",
      amount: 2000,
      payout_channel: "DIRECT",
      is_paid: true,
    },
  ];

  return { periods, logs };
}

// -------------------------------------------------------------
// LOCAL STORAGE HELPERS
// -------------------------------------------------------------
function getLocalItem<T>(key: string, defaultValue: T): T {
  if (typeof window === "undefined") return defaultValue;
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : defaultValue;
  } catch {
    return defaultValue;
  }
}

function setLocalItem<T>(key: string, value: T): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.warn("Error saving to localStorage", err);
  }
}

// Initialize seed data if empty
export function initSeedDataIfEmpty(userId: string = DEFAULT_USER_SETTINGS.line_user_id): void {
  if (typeof window === "undefined") return;
  const currentSettings = localStorage.getItem(STORAGE_KEYS.USER_SETTINGS);
  if (!currentSettings) {
    const settings: UserSettings = { ...DEFAULT_USER_SETTINGS, line_user_id: userId };
    setLocalItem(STORAGE_KEYS.USER_SETTINGS, settings);
    setLocalItem(STORAGE_KEYS.PRESETS, SEED_PRESETS);

    const { periods, logs } = getSeedPeriods(userId, settings);
    setLocalItem(STORAGE_KEYS.PAY_PERIODS, periods);
    setLocalItem(STORAGE_KEYS.EXTRA_LOGS, logs);
    setLocalItem(STORAGE_KEYS.GOALS, SEED_GOALS);
  }

  // Ensure goals exist in case of previous seed
  const currentGoals = localStorage.getItem(STORAGE_KEYS.GOALS);
  if (!currentGoals) {
    setLocalItem(STORAGE_KEYS.GOALS, SEED_GOALS);
  }
}

// -------------------------------------------------------------
// USER SETTINGS
// -------------------------------------------------------------
export async function getUserSettings(lineUserId: string): Promise<UserSettings> {
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase
      .from("user_settings")
      .select("*")
      .eq("line_user_id", lineUserId)
      .single();

    if (data && !error) {
      return data as UserSettings;
    }
  }

  // Fallback to LocalStorage
  initSeedDataIfEmpty(lineUserId);
  const settings = getLocalItem<UserSettings>(STORAGE_KEYS.USER_SETTINGS, {
    ...DEFAULT_USER_SETTINGS,
    line_user_id: lineUserId,
  });
  return settings;
}

export async function saveUserSettings(settings: UserSettings): Promise<void> {
  if (isSupabaseConfigured && supabase) {
    await supabase.from("user_settings").upsert({
      ...settings,
      updated_at: new Date().toISOString(),
    });
  }

  setLocalItem(STORAGE_KEYS.USER_SETTINGS, settings);
}

// -------------------------------------------------------------
// PAY PERIODS & SNAPSHOTS
// -------------------------------------------------------------
export async function getPayPeriod(
  lineUserId: string,
  periodKey: string,
  settings: UserSettings
): Promise<PayPeriod> {
  if (isSupabaseConfigured && supabase) {
    const { data } = await supabase
      .from("pay_periods")
      .select("*")
      .eq("line_user_id", lineUserId)
      .eq("period_key", periodKey)
      .maybeSingle();

    if (data) {
      return data as PayPeriod;
    }
  }

  // Fallback to local
  initSeedDataIfEmpty(lineUserId);
  const allPeriods = getLocalItem<PayPeriod[]>(STORAGE_KEYS.PAY_PERIODS, []);
  let found = allPeriods.find((p) => p.period_key === periodKey && p.line_user_id === lineUserId);

  if (!found) {
    const pInfo = computePeriodInfo(periodKey, settings.cutoff_start_day, settings.payout_month_offset);
    found = {
      id: `period-${periodKey}-${Date.now()}`,
      line_user_id: lineUserId,
      period_key: periodKey,
      start_date: pInfo.startDate,
      end_date: pInfo.endDate,
      rates_snapshot: { ...settings.default_rates },
      shift_counts: { ...DEFAULT_SHIFT_COUNTS },
      actual_slip_amount: null,
      reconcile_status: "PENDING",
      reconcile_note: "",
    };

    allPeriods.push(found);
    setLocalItem(STORAGE_KEYS.PAY_PERIODS, allPeriods);

    if (isSupabaseConfigured && supabase) {
      await supabase.from("pay_periods").insert(found);
    }
  }

  return found;
}

export async function saveShiftCounts(
  periodId: string,
  shiftCounts: ShiftCounts,
  ratesSnapshot?: PayPeriod["rates_snapshot"]
): Promise<void> {
  if (isSupabaseConfigured && supabase) {
    const updateData: Record<string, unknown> = {
      shift_counts: shiftCounts,
      updated_at: new Date().toISOString(),
    };
    if (ratesSnapshot) {
      updateData.rates_snapshot = ratesSnapshot;
    }
    await supabase.from("pay_periods").update(updateData).eq("id", periodId);
  }

  const allPeriods = getLocalItem<PayPeriod[]>(STORAGE_KEYS.PAY_PERIODS, []);
  const index = allPeriods.findIndex((p) => p.id === periodId);
  if (index >= 0) {
    allPeriods[index] = {
      ...allPeriods[index],
      shift_counts: shiftCounts,
      rates_snapshot: ratesSnapshot || allPeriods[index].rates_snapshot,
    };
    setLocalItem(STORAGE_KEYS.PAY_PERIODS, allPeriods);
  }
}

export async function saveSlipReconcile(
  periodId: string,
  actualSlipAmount: number | null,
  reconcileNote: string,
  reconcileStatus: PayPeriod["reconcile_status"]
): Promise<void> {
  if (isSupabaseConfigured && supabase) {
    await supabase
      .from("pay_periods")
      .update({
        actual_slip_amount: actualSlipAmount,
        reconcile_note: reconcileNote,
        reconcile_status: reconcileStatus,
        updated_at: new Date().toISOString(),
      })
      .eq("id", periodId);
  }

  const allPeriods = getLocalItem<PayPeriod[]>(STORAGE_KEYS.PAY_PERIODS, []);
  const index = allPeriods.findIndex((p) => p.id === periodId);
  if (index >= 0) {
    allPeriods[index] = {
      ...allPeriods[index],
      actual_slip_amount: actualSlipAmount,
      reconcile_note: reconcileNote,
      reconcile_status: reconcileStatus,
    };
    setLocalItem(STORAGE_KEYS.PAY_PERIODS, allPeriods);
  }
}

// -------------------------------------------------------------
// EXTRA LOGS
// -------------------------------------------------------------
export async function getExtraLogs(periodId: string): Promise<ExtraLog[]> {
  if (isSupabaseConfigured && supabase) {
    const { data } = await supabase
      .from("extra_logs")
      .select("*")
      .eq("period_id", periodId)
      .order("work_date", { ascending: false });

    if (data) return data as ExtraLog[];
  }

  const allLogs = getLocalItem<ExtraLog[]>(STORAGE_KEYS.EXTRA_LOGS, []);
  return allLogs
    .filter((log) => log.period_id === periodId)
    .sort((a, b) => b.work_date.localeCompare(a.work_date));
}

export async function addExtraLog(
  log: Omit<ExtraLog, "id" | "created_at">
): Promise<ExtraLog> {
  const newLog: ExtraLog = {
    ...log,
    id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    created_at: new Date().toISOString(),
  };

  if (isSupabaseConfigured && supabase) {
    const { data } = await supabase.from("extra_logs").insert(newLog).select().single();
    if (data) return data as ExtraLog;
  }

  const allLogs = getLocalItem<ExtraLog[]>(STORAGE_KEYS.EXTRA_LOGS, []);
  allLogs.unshift(newLog);
  setLocalItem(STORAGE_KEYS.EXTRA_LOGS, allLogs);

  return newLog;
}

export async function deleteExtraLog(id: string): Promise<void> {
  if (isSupabaseConfigured && supabase) {
    await supabase.from("extra_logs").delete().eq("id", id);
  }

  const allLogs = getLocalItem<ExtraLog[]>(STORAGE_KEYS.EXTRA_LOGS, []);
  const filtered = allLogs.filter((l) => l.id !== id);
  setLocalItem(STORAGE_KEYS.EXTRA_LOGS, filtered);
}

export async function toggleExtraLogPaid(id: string, isPaid: boolean): Promise<void> {
  if (isSupabaseConfigured && supabase) {
    await supabase.from("extra_logs").update({ is_paid: isPaid }).eq("id", id);
  }

  const allLogs = getLocalItem<ExtraLog[]>(STORAGE_KEYS.EXTRA_LOGS, []);
  const index = allLogs.findIndex((l) => l.id === id);
  if (index >= 0) {
    allLogs[index].is_paid = isPaid;
    setLocalItem(STORAGE_KEYS.EXTRA_LOGS, allLogs);
  }
}

// -------------------------------------------------------------
// EXTRA PRESETS
// -------------------------------------------------------------
export async function getExtraPresets(lineUserId: string): Promise<ExtraPreset[]> {
  if (isSupabaseConfigured && supabase) {
    const { data } = await supabase
      .from("extra_presets")
      .select("*")
      .eq("line_user_id", lineUserId)
      .eq("is_active", true);

    if (data) return data as ExtraPreset[];
  }

  const presets = getLocalItem<ExtraPreset[]>(STORAGE_KEYS.PRESETS, SEED_PRESETS);
  return presets.filter((p) => p.line_user_id === lineUserId && p.is_active);
}

export async function addExtraPreset(
  preset: Omit<ExtraPreset, "id" | "created_at">
): Promise<ExtraPreset> {
  const newPreset: ExtraPreset = {
    ...preset,
    id: `preset-${Date.now()}`,
    created_at: new Date().toISOString(),
  };

  if (isSupabaseConfigured && supabase) {
    const { data } = await supabase.from("extra_presets").insert(newPreset).select().single();
    if (data) return data as ExtraPreset;
  }

  const all = getLocalItem<ExtraPreset[]>(STORAGE_KEYS.PRESETS, SEED_PRESETS);
  all.push(newPreset);
  setLocalItem(STORAGE_KEYS.PRESETS, all);

  return newPreset;
}

export async function deleteExtraPreset(id: string): Promise<void> {
  if (isSupabaseConfigured && supabase) {
    await supabase.from("extra_presets").delete().eq("id", id);
  }

  const all = getLocalItem<ExtraPreset[]>(STORAGE_KEYS.PRESETS, SEED_PRESETS);
  const filtered = all.filter((p) => p.id !== id);
  setLocalItem(STORAGE_KEYS.PRESETS, filtered);
}

// -------------------------------------------------------------
// HISTORY SUMMARY & ANNUAL SUMMARY
// -------------------------------------------------------------
export async function getHistorySummary(
  lineUserId: string,
  limit: number = 12
): Promise<{
  periodKey: string;
  labelTh: string;
  hospitalSlip: number;
  directIncome: number;
  totalIncome: number;
  isMatched: boolean;
}[]> {
  const settings = await getUserSettings(lineUserId);
  let userPeriods: PayPeriod[] = [];
  let allLogs: ExtraLog[] = [];

  if (isSupabaseConfigured && supabase) {
    const { data: dbPeriods } = await supabase
      .from("pay_periods")
      .select("*")
      .eq("line_user_id", lineUserId)
      .order("period_key", { ascending: false })
      .limit(limit);

    const { data: dbLogs } = await supabase
      .from("extra_logs")
      .select("*")
      .eq("line_user_id", lineUserId);

    if (dbPeriods && dbPeriods.length > 0) {
      userPeriods = (dbPeriods as PayPeriod[]).reverse();
      allLogs = (dbLogs as ExtraLog[]) || [];
    }
  }

  if (userPeriods.length === 0) {
    initSeedDataIfEmpty(lineUserId);
    const allPeriods = getLocalItem<PayPeriod[]>(STORAGE_KEYS.PAY_PERIODS, []);
    allLogs = getLocalItem<ExtraLog[]>(STORAGE_KEYS.EXTRA_LOGS, []);
    userPeriods = allPeriods
      .filter((p) => p.line_user_id === lineUserId)
      .sort((a, b) => b.period_key.localeCompare(a.period_key))
      .slice(0, limit)
      .reverse();
  }

  return userPeriods.map((p) => {
    const logs = allLogs.filter((l) => l.period_id === p.id);
    const rates = p.rates_snapshot || settings.default_rates;
    const counts = p.shift_counts || DEFAULT_SHIFT_COUNTS;

    const shiftSum =
      (counts.m || 0) * (rates.m || 0) +
      (counts.a || 0) * (rates.a || 0) +
      (counts.n || 0) * (rates.n || 0) +
      (counts.ot_m || 0) * (rates.ot_m || 0) +
      (counts.ot_a || 0) * (rates.ot_a || 0) +
      (counts.ot_n || 0) * (rates.ot_n || 0) +
      (counts.holiday || 0) * (rates.holiday || 0);

    let extraHosp = 0;
    let deductHosp = 0;
    let direct = 0;

    for (const l of logs) {
      if (l.payout_channel === "HOSPITAL") {
        if (l.log_type === "SELL_SHIFT") deductHosp += Number(l.amount) || 0;
        else extraHosp += Number(l.amount) || 0;
      } else {
        direct += Number(l.amount) || 0;
      }
    }

    const hospitalSlip = shiftSum + extraHosp - deductHosp + (settings.include_base_salary ? settings.base_salary : 0);
    const pInfo = computePeriodInfo(p.period_key, settings.cutoff_start_day, settings.payout_month_offset);

    return {
      periodKey: p.period_key,
      labelTh: pInfo.payoutMonthNameTh.replace(" 2569", " 69").replace(" 2568", " 68"),
      hospitalSlip,
      directIncome: direct,
      totalIncome: hospitalSlip + direct,
      isMatched: p.reconcile_status === "MATCHED",
    };
  });
}

/**
 * Annual Tax & Income Summary
 */
export async function getAnnualSummary(
  lineUserId: string,
  yearStr: string = "2026"
): Promise<{
  year: string;
  totalAnnualGross: number;
  totalHospitalSlip: number;
  totalDirectIncome: number;
  monthsCount: number;
  taxEstimate: TaxEstimate;
}> {
  const allHistory = await getHistorySummary(lineUserId, 24);
  const yearPeriods = allHistory.filter((h) => h.periodKey.startsWith(yearStr));

  let totalHospitalSlip = 0;
  let totalDirectIncome = 0;

  for (const p of yearPeriods) {
    totalHospitalSlip += p.hospitalSlip;
    totalDirectIncome += p.directIncome;
  }

  const totalAnnualGross = totalHospitalSlip + totalDirectIncome;
  const taxEstimate = estimateThaiTax(totalAnnualGross);

  return {
    year: yearStr,
    totalAnnualGross,
    totalHospitalSlip,
    totalDirectIncome,
    monthsCount: yearPeriods.length,
    taxEstimate,
  };
}

// Reset data to default seed
export function resetStorageData(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEYS.USER_SETTINGS);
  localStorage.removeItem(STORAGE_KEYS.PRESETS);
  localStorage.removeItem(STORAGE_KEYS.PAY_PERIODS);
  localStorage.removeItem(STORAGE_KEYS.EXTRA_LOGS);
  localStorage.removeItem(STORAGE_KEYS.GOALS);
  initSeedDataIfEmpty();
}

// -------------------------------------------------------------
// GOALS (SHIFT-TO-DREAM)
// -------------------------------------------------------------
export async function getNurseGoals(lineUserId: string): Promise<NurseGoal[]> {
  if (isSupabaseConfigured && supabase) {
    const { data } = await supabase
      .from("nurse_goals")
      .select("*")
      .eq("line_user_id", lineUserId);
    if (data && data.length > 0) return data as NurseGoal[];
  }

  return getLocalItem<NurseGoal[]>(STORAGE_KEYS.GOALS, SEED_GOALS);
}

export async function saveNurseGoal(goal: NurseGoal): Promise<void> {
  if (isSupabaseConfigured && supabase) {
    await supabase.from("nurse_goals").upsert(goal);
  }

  const allGoals = getLocalItem<NurseGoal[]>(STORAGE_KEYS.GOALS, SEED_GOALS);
  const index = allGoals.findIndex((g) => g.id === goal.id);
  if (index >= 0) {
    allGoals[index] = goal;
  } else {
    allGoals.unshift(goal);
  }
  setLocalItem(STORAGE_KEYS.GOALS, allGoals);
}

export async function setActiveNurseGoal(goalId: string): Promise<void> {
  const allGoals = getLocalItem<NurseGoal[]>(STORAGE_KEYS.GOALS, SEED_GOALS);
  const updated = allGoals.map((g) => ({
    ...g,
    isActive: g.id === goalId,
  }));
  setLocalItem(STORAGE_KEYS.GOALS, updated);
}

export async function updateGoalCurrentAmount(
  goalId: string,
  addedOrNewAmount: number,
  isAbsolute: boolean = false
): Promise<void> {
  const allGoals = getLocalItem<NurseGoal[]>(STORAGE_KEYS.GOALS, SEED_GOALS);
  const index = allGoals.findIndex((g) => g.id === goalId);
  if (index >= 0) {
    const current = allGoals[index].currentAmount || 0;
    allGoals[index].currentAmount = isAbsolute
      ? addedOrNewAmount
      : Math.max(0, current + addedOrNewAmount);
    setLocalItem(STORAGE_KEYS.GOALS, allGoals);
  }
}

// -------------------------------------------------------------
// FATIGUE & SHIFT SAFETY COUNTS
// -------------------------------------------------------------
export async function saveFatigueCounts(
  periodId: string,
  quickTurnaround: number,
  doubleShift: number
): Promise<void> {
  if (isSupabaseConfigured && supabase) {
    await supabase
      .from("pay_periods")
      .update({
        quick_turnaround_count: quickTurnaround,
        double_shift_count: doubleShift,
        updated_at: new Date().toISOString(),
      })
      .eq("id", periodId);
  }

  const allPeriods = getLocalItem<PayPeriod[]>(STORAGE_KEYS.PAY_PERIODS, []);
  const index = allPeriods.findIndex((p) => p.id === periodId);
  if (index >= 0) {
    allPeriods[index] = {
      ...allPeriods[index],
      quick_turnaround_count: quickTurnaround,
      double_shift_count: doubleShift,
    };
    setLocalItem(STORAGE_KEYS.PAY_PERIODS, allPeriods);
  }
}
