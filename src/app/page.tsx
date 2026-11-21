"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useLiff } from "@/lib/liff";
import {
  computePeriodInfo,
  calculatePeriodSummary,
  shiftPeriodKey,
  formatThaiDate,
} from "@/lib/calculations";
import {
  getUserSettings,
  saveUserSettings,
  getPayPeriod,
  saveShiftCounts,
  saveSlipReconcile,
  getExtraLogs,
  addExtraLog,
  deleteExtraLog,
  toggleExtraLogPaid,
  getExtraPresets,
  addExtraPreset,
  deleteExtraPreset,
  getHistorySummary,
  resetStorageData,
  initSeedDataIfEmpty,
  getNurseGoals,
  saveNurseGoal,
  setActiveNurseGoal,
  updateGoalCurrentAmount,
  saveFatigueCounts,
} from "@/lib/storage";
import {
  ExtraLog,
  ExtraPreset,
  NurseGoal,
  PayPeriod,
  PeriodSummary,
  ShiftCounts,
  ShiftRates,
  UserSettings,
} from "@/types";
import { PeriodHeader } from "@/components/PeriodHeader";
import { BottomNav, NavTab } from "@/components/BottomNav";
import { DashboardScreen } from "@/components/DashboardScreen";
import { ShiftTallyScreen } from "@/components/ShiftTallyScreen";
import { WellnessScreen } from "@/components/WellnessScreen";
import { ScheduleScreen } from "@/components/ScheduleScreen";
import { QuickAddSheet } from "@/components/QuickAddSheet";
import { SettingsScreen } from "@/components/SettingsScreen";
import { DEFAULT_USER_SETTINGS, LOG_TYPE_CONFIG } from "@/lib/constants";

export default function Home() {
  const liff = useLiff();
  const userId = liff.profile?.userId || DEFAULT_USER_SETTINGS.line_user_id;
  const userDisplayName = liff.profile?.displayName || "พยาบาลเมย์";

  // App State
  const [currentTab, setCurrentTab] = useState<NavTab>("dashboard");
  const [isQuickAddOpen, setIsQuickAddOpen] = useState<boolean>(false);
  const [periodKey, setPeriodKey] = useState<string>("2026-11");
  const [loading, setLoading] = useState<boolean>(true);
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [selectedFont, setSelectedFont] = useState<string>("noto");

  // Load and apply theme & font
  useEffect(() => {
    const savedTheme = (localStorage.getItem("nursepay_theme") as "light" | "dark") || "light";
    setTheme(savedTheme);
    if (savedTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }

    const savedFont = localStorage.getItem("nursepay_font") || "noto";
    setSelectedFont(savedFont);
    document.documentElement.setAttribute("data-font", savedFont);
  }, []);

  const handleToggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    localStorage.setItem("nursepay_theme", newTheme);
    if (newTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  const handleChangeFont = (newFont: string) => {
    setSelectedFont(newFont);
    localStorage.setItem("nursepay_font", newFont);
    document.documentElement.setAttribute("data-font", newFont);
  };

  // Data States
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_USER_SETTINGS);
  const [currentPeriod, setCurrentPeriod] = useState<PayPeriod | null>(null);
  const [extraLogs, setExtraLogs] = useState<ExtraLog[]>([]);
  const [presets, setPresets] = useState<ExtraPreset[]>([]);
  const [historySummary, setHistorySummary] = useState<any[]>([]);
  const [goals, setGoals] = useState<NurseGoal[]>([]);

  // Load / Refresh all data for current period
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      initSeedDataIfEmpty(userId);

      const userSettings = await getUserSettings(userId);
      setSettings(userSettings);

      const period = await getPayPeriod(userId, periodKey, userSettings);
      setCurrentPeriod(period);

      const logs = await getExtraLogs(period.id);
      setExtraLogs(logs);

      const userPresets = await getExtraPresets(userId);
      setPresets(userPresets);

      const history = await getHistorySummary(userId, 12);
      setHistorySummary(history);

      const userGoals = await getNurseGoals(userId);
      setGoals(userGoals);
    } catch (err) {
      console.error("Error loading data:", err);
    } finally {
      setLoading(false);
    }
  }, [userId, periodKey]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Calculations
  const periodInfo = computePeriodInfo(
    periodKey,
    settings.cutoff_start_day,
    settings.payout_month_offset
  );

  const summary: PeriodSummary | null = currentPeriod
    ? calculatePeriodSummary(currentPeriod, settings, extraLogs)
    : null;

  // Period Navigation
  const handlePrevPeriod = () => {
    setPeriodKey((prev) => shiftPeriodKey(prev, -1));
  };

  const handleNextPeriod = () => {
    setPeriodKey((prev) => shiftPeriodKey(prev, 1));
  };

  // Actions
  const handleSaveShiftCounts = async (counts: ShiftCounts, ratesSnapshot: ShiftRates) => {
    if (!currentPeriod) return;
    await saveShiftCounts(currentPeriod.id, counts, ratesSnapshot);
    await loadData();
  };

  const handleSaveReconcile = async (actualSlip: number | null, note: string) => {
    if (!currentPeriod || !summary) return;

    let newStatus = currentPeriod.reconcile_status;
    if (actualSlip === null) {
      newStatus = "PENDING";
    } else {
      const delta = actualSlip - summary.expectedHospitalSlip;
      if (Math.abs(delta) < 0.01) newStatus = "MATCHED";
      else if (delta < 0) newStatus = "DISCREPANCY";
      else newStatus = "OVERPAID";
    }

    await saveSlipReconcile(currentPeriod.id, actualSlip, note, newStatus);
    await loadData();
  };

  const handleToggleLogPaid = async (logId: string, isPaid: boolean) => {
    await toggleExtraLogPaid(logId, isPaid);
    await loadData();
  };

  const handleDeleteLog = async (logId: string) => {
    await deleteExtraLog(logId);
    await loadData();
  };

  const handleAddLog = async (log: Omit<ExtraLog, "id" | "created_at">) => {
    await addExtraLog(log);
    await loadData();
  };

  const handleSaveSettings = async (newSettings: UserSettings) => {
    await saveUserSettings(newSettings);
    setSettings(newSettings);
    await loadData();
  };

  const handleAddPreset = async (preset: Omit<ExtraPreset, "id" | "created_at">) => {
    await addExtraPreset(preset);
    const updatedPresets = await getExtraPresets(userId);
    setPresets(updatedPresets);
  };

  const handleDeletePreset = async (presetId: string) => {
    await deleteExtraPreset(presetId);
    const updatedPresets = await getExtraPresets(userId);
    setPresets(updatedPresets);
  };

  const handleResetData = () => {
    resetStorageData();
    loadData();
  };

  const handleSaveGoal = async (goal: NurseGoal) => {
    await saveNurseGoal(goal);
    await loadData();
  };

  const handleSelectGoal = async (goalId: string) => {
    await setActiveNurseGoal(goalId);
    await loadData();
  };

  const handleUpdateGoalAmount = async (goalId: string, addedOrNewAmount: number, isAbsolute?: boolean) => {
    await updateGoalCurrentAmount(goalId, addedOrNewAmount, isAbsolute);
    await loadData();
  };

  const handleSaveFatigueCounts = async (quickTurnaround: number, doubleShift: number) => {
    if (!currentPeriod) return;
    await saveFatigueCounts(currentPeriod.id, quickTurnaround, doubleShift);
    await loadData();
  };

  const pendingCount = settings.enable_direct_wallet === false
    ? 0
    : extraLogs.filter((l) => l.payout_channel === "DIRECT" && !l.is_paid).length;

  return (
    <div className={`min-h-screen ${theme === "dark" ? "dark" : ""} bg-[#e8f1f8] dark:bg-[#05080e] flex justify-center text-slate-900 dark:text-slate-100 selection:bg-sky-500 selection:text-white transition-colors duration-150`}>
      {/* Mobile Shell Frame */}
      <main className="w-full max-w-md min-h-screen bg-[#f1f6fb] dark:bg-[#080d16] flex flex-col relative border-x border-sky-100/90 dark:border-sky-950 shadow-sm transition-colors duration-150">
        {/* Top Header */}
        <PeriodHeader
          periodInfo={periodInfo}
          onPrevPeriod={handlePrevPeriod}
          onNextPeriod={handleNextPeriod}
          onSelectPeriodKey={(key) => setPeriodKey(key)}
          displayName={settings.display_name || userDisplayName}
          isMock={liff.isMock}
          onOpenSettings={() => setCurrentTab("settings")}
          theme={theme}
          onToggleTheme={handleToggleTheme}
          selectedFont={selectedFont}
          onChangeFont={handleChangeFont}
        />

        {/* Content Area */}
        <div className="flex-1 pb-24">
          {loading || !summary ? (
            <div className="flex flex-col items-center justify-center py-24 gap-2.5 text-slate-400">
              <div className="w-6 h-6 border-2 border-slate-300 dark:border-slate-700 border-t-sky-600 rounded-full animate-spin" />
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">กำลังคำนวณยอดเวร...</p>
            </div>
          ) : (
            <>
              {currentTab === "dashboard" && currentPeriod && (
                <DashboardScreen
                  key={currentPeriod.id}
                  userId={userId}
                  periodKey={periodKey}
                  summary={summary}
                  onOpenTally={() => setCurrentTab("tally")}
                  onOpenQuickAdd={() => setIsQuickAddOpen(true)}
                  onNavigateToWellness={() => setCurrentTab("wellness")}
                  onSaveReconcile={handleSaveReconcile}
                  onToggleLogPaid={handleToggleLogPaid}
                  onDeleteLog={handleDeleteLog}
                  onSelectPeriodKey={(key) => setPeriodKey(key)}
                  historySummary={historySummary}
                  userName={settings.display_name}
                />
              )}

              {currentTab === "tally" && currentPeriod && (
                <ShiftTallyScreen
                  key={currentPeriod.id}
                  period={currentPeriod}
                  settings={settings}
                  onSaveShiftCounts={handleSaveShiftCounts}
                  onBackToDashboard={() => setCurrentTab("dashboard")}
                />
              )}

              {currentTab === "wellness" && currentPeriod && (
                <WellnessScreen
                  summary={summary}
                  goals={goals}
                  onSaveGoal={handleSaveGoal}
                  onSelectGoal={handleSelectGoal}
                  onUpdateGoalAmount={handleUpdateGoalAmount}
                  onSaveFatigueCounts={handleSaveFatigueCounts}
                  onBackToDashboard={() => setCurrentTab("dashboard")}
                />
              )}

              {currentTab === "schedule" && currentPeriod && (
                <ScheduleScreen
                  period={currentPeriod}
                  summary={summary}
                  historySummary={historySummary}
                  userName={settings.display_name}
                  allPeriodsForExport={historySummary.map((h) => ({
                    period_key: h.periodKey,
                    periodLabel: `รอบ ${h.labelTh}`,
                    shiftRange: "-",
                    expectedHospitalSlip: h.hospitalSlip,
                    actualSlipAmount: h.isMatched ? h.hospitalSlip : null,
                    deltaSlip: 0,
                    slipStatusLabel: h.isMatched ? "ยอดตรงครบถ้วน" : "ตรวจสอบแล้ว",
                    directIncome: h.directIncome,
                    grandTotal: h.totalIncome,
                    reconcile_note: "",
                  }))}
                  allLogsForExport={extraLogs.map((l) => ({
                    ...l,
                    period_label: periodKey,
                    type_label: LOG_TYPE_CONFIG[l.log_type]?.label || l.log_type,
                  }))}
                  onBackToDashboard={() => setCurrentTab("dashboard")}
                />
              )}

              {currentTab === "settings" && (
                <SettingsScreen
                  settings={settings}
                  presets={presets}
                  onSaveSettings={handleSaveSettings}
                  onAddPreset={handleAddPreset}
                  onDeletePreset={handleDeletePreset}
                  onResetData={handleResetData}
                  isMock={liff.isMock}
                  theme={theme}
                  onToggleTheme={handleToggleTheme}
                  selectedFont={selectedFont}
                  onChangeFont={handleChangeFont}
                  onBackToDashboard={() => setCurrentTab("dashboard")}
                />
              )}
            </>
          )}
        </div>

        {/* Quick Add Bottom Sheet Modal */}
        {currentPeriod && (
          <QuickAddSheet
            isOpen={isQuickAddOpen}
            onClose={() => setIsQuickAddOpen(false)}
            periodId={currentPeriod.id}
            lineUserId={userId}
            presets={presets}
            enableDirectWallet={settings.enable_direct_wallet !== false}
            hourlyRate={
              (currentPeriod.rates_snapshot && currentPeriod.rates_snapshot.ot_hr) ||
              settings.default_rates.ot_hr ||
              120
            }
            onAddLog={handleAddLog}
          />
        )}

        {/* Fixed Bottom Navigation */}
        <BottomNav
          currentTab={currentTab}
          onSelectTab={setCurrentTab}
          onOpenQuickAdd={() => setIsQuickAddOpen(true)}
          pendingCount={pendingCount}
        />
      </main>
    </div>
  );
}
