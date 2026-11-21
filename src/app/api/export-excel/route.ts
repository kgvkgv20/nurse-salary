import { NextRequest, NextResponse } from "next/server";
import ExcelJS from "exceljs";
import { isSupabaseConfigured, supabase } from "@/lib/supabaseClient";
import { LOG_TYPE_CONFIG } from "@/lib/constants";
import { formatThaiDate } from "@/lib/calculations";

interface ExportPeriodData {
  period_key: string;
  periodLabel?: string;
  shiftRange?: string;
  counts?: { [key: string]: number };
  expectedHospitalSlip: number;
  actualSlipAmount: number | null;
  deltaSlip: number;
  slipStatusLabel?: string;
  directIncome: number;
  grandTotal: number;
  reconcile_note?: string;
}

interface ExportLogData {
  work_date: string;
  period_label?: string;
  type_label?: string;
  log_type?: string;
  title_note: string;
  amount: number;
  payout_channel: string;
  is_paid: boolean;
}

async function createExcelWorkbook(
  periods: ExportPeriodData[],
  logs: ExportLogData[]
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "NursePay Check";
  workbook.created = new Date();

  // -------------------------------------------------------------
  // SHEET 1: สรุปรายเดือน
  // -------------------------------------------------------------
  const sheet1 = workbook.addWorksheet("สรุปรายเดือน", {
    views: [{ showGridLines: true }],
  });

  sheet1.columns = [
    { header: "รอบวิก", key: "period_label", width: 22 },
    { header: "ช่วงวันที่ขึ้นเวร", key: "shift_range", width: 26 },
    { header: "เวรปกติ (บ/ด)", key: "normal_shifts", width: 16 },
    { header: "เวร OT (ชม/บ/ด)", key: "ot_shifts", width: 16 },
    { header: "เวรวันหยุด", key: "holiday_shifts", width: 14 },
    { header: "ยอดรอเข้าสลิป รพ. (บาท)", key: "expected_slip", width: 24 },
    { header: "ยอดเข้าจริงตามสลิป (บาท)", key: "actual_slip", width: 24 },
    { header: "ส่วนต่าง (บาท)", key: "delta_slip", width: 16 },
    { header: "สถานะสลิป", key: "slip_status", width: 18 },
    { header: "รายได้เวรนอกสลิป (บาท)", key: "direct_income", width: 24 },
    { header: "รวมรายได้สุทธิ (บาท)", key: "grand_total", width: 22 },
    { header: "หมายเหตุ / โน้ตตรวจสลิป", key: "note", width: 32 },
  ];

  const headerRow1 = sheet1.getRow(1);
  headerRow1.height = 30;
  headerRow1.eachCell((cell) => {
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF38BDF8" }, // Sky 400
    };
    cell.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 11, name: "Tahoma" };
    cell.alignment = { vertical: "middle", horizontal: "center" };
  });

  for (const p of periods) {
    const normalCount = (p.counts?.a || 0) + (p.counts?.n || 0);
    const otCount = (p.counts?.ot_m || 0) + (p.counts?.ot_a || 0) + (p.counts?.ot_n || 0);
    const holidayCount = p.counts?.holiday || 0;

    const row = sheet1.addRow({
      period_label: p.periodLabel || p.period_key,
      shift_range: p.shiftRange || "-",
      normal_shifts: normalCount,
      ot_shifts: otCount,
      holiday_shifts: holidayCount,
      expected_slip: p.expectedHospitalSlip,
      actual_slip: p.actualSlipAmount !== null && p.actualSlipAmount !== undefined ? p.actualSlipAmount : "-",
      delta_slip: p.actualSlipAmount !== null && p.actualSlipAmount !== undefined ? p.deltaSlip : "-",
      slip_status: p.slipStatusLabel || "-",
      direct_income: p.directIncome,
      grand_total: p.grandTotal,
      note: p.reconcile_note || "",
    });

    row.height = 24;
    row.alignment = { vertical: "middle" };

    row.getCell("expected_slip").numFmt = "#,##0.00";
    if (typeof p.actualSlipAmount === "number") {
      row.getCell("actual_slip").numFmt = "#,##0.00";
      row.getCell("delta_slip").numFmt = "#,##0.00";
    }
    row.getCell("direct_income").numFmt = "#,##0.00";
    row.getCell("grand_total").numFmt = "#,##0.00";

    if (typeof p.deltaSlip === "number" && p.actualSlipAmount !== null) {
      if (p.deltaSlip < 0) {
        row.getCell("delta_slip").font = { color: { argb: "FFE11D48" }, bold: true };
      } else if (p.deltaSlip === 0) {
        row.getCell("delta_slip").font = { color: { argb: "FF059669" }, bold: true };
      }
    }
  }

  // -------------------------------------------------------------
  // SHEET 2: รายการงานเสริมและ OT
  // -------------------------------------------------------------
  const sheet2 = workbook.addWorksheet("รายการงานเสริมและ OT", {
    views: [{ showGridLines: true }],
  });

  sheet2.columns = [
    { header: "วันที่ปฏิบัติงาน", key: "work_date", width: 18 },
    { header: "รอบวิก", key: "period_label", width: 18 },
    { header: "ประเภทงาน", key: "type_label", width: 24 },
    { header: "รายละเอียด / ชื่อเพื่อน / คลินิก", key: "title_note", width: 35 },
    { header: "จำนวนเงิน (บาท)", key: "amount", width: 18 },
    { header: "ช่องทางรับเงิน", key: "channel_label", width: 22 },
    { header: "สถานะการรับเงิน", key: "status_label", width: 20 },
  ];

  const headerRow2 = sheet2.getRow(1);
  headerRow2.height = 30;
  headerRow2.eachCell((cell) => {
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF818CF8" }, // Indigo 400
    };
    cell.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 11, name: "Tahoma" };
    cell.alignment = { vertical: "middle", horizontal: "center" };
  });

  for (const log of logs) {
    const row = sheet2.addRow({
      work_date: log.work_date,
      period_label: log.period_label || "-",
      type_label: log.type_label || log.log_type,
      title_note: log.title_note,
      amount: Number(log.amount) || 0,
      channel_label: log.payout_channel === "HOSPITAL" ? "เข้าสลิปโรงพยาบาล" : "รับโอนตรง / เงินสด",
      status_label:
        log.payout_channel === "HOSPITAL"
          ? "รอเงินออกพร้อมสลิป"
          : log.is_paid
          ? "ได้รับเงินแล้ว"
          : "ค้างรับ (รอโอน)",
    });

    row.height = 24;
    row.alignment = { vertical: "middle" };
    row.getCell("amount").numFmt = "#,##0.00";

    if (log.payout_channel === "DIRECT") {
      if (!log.is_paid) {
        row.getCell("status_label").font = { color: { argb: "FFD97706" }, bold: true };
      } else {
        row.getCell("status_label").font = { color: { argb: "FF059669" } };
      }
    }
  }

  const arrayBuffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(arrayBuffer);
}

// -------------------------------------------------------------
// POST HANDLER (JSON payload from browser)
// -------------------------------------------------------------
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { periods = [], logs = [], userName = "พยาบาล", periodKey = "all" } = body;

    const buffer = await createExcelWorkbook(periods, logs);
    const filename = `สรุปค่าเวร_${userName}_${periodKey}.xlsx`;

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Disposition": `attachment; filename="${encodeURIComponent(filename)}"`,
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      },
    });
  } catch (error) {
    console.error("Export Excel POST error:", error);
    return NextResponse.json({ error: "Failed to generate Excel file" }, { status: 500 });
  }
}

// -------------------------------------------------------------
// GET HANDLER (External Safari / Chrome download for LINE LIFF)
// -------------------------------------------------------------
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId") || "U_MOCK_NURSE_001";
    const userName = searchParams.get("userName") || "พยาบาล";
    const periodKey = searchParams.get("periodKey") || "all";
    const exportAll = searchParams.get("exportAll") === "true";

    let periods: ExportPeriodData[] = [];
    let logs: ExportLogData[] = [];

    // Query Supabase if configured
    if (isSupabaseConfigured && supabase) {
      let periodQuery = supabase.from("pay_periods").select("*").eq("line_user_id", userId);
      if (!exportAll && periodKey !== "all") {
        periodQuery = periodQuery.eq("period_key", periodKey);
      }
      const { data: dbPeriods } = await periodQuery.order("period_key", { ascending: true });

      const { data: dbLogs } = await supabase
        .from("extra_logs")
        .select("*")
        .eq("line_user_id", userId)
        .order("work_date", { ascending: false });

      if (dbPeriods) {
        periods = dbPeriods.map((p: any) => ({
          period_key: p.period_key,
          periodLabel: `รอบ ${p.period_key}`,
          shiftRange: `${p.start_date} - ${p.end_date}`,
          counts: p.shift_counts,
          expectedHospitalSlip: 15000,
          actualSlipAmount: p.actual_slip_amount,
          deltaSlip: 0,
          slipStatusLabel: p.reconcile_status,
          directIncome: 0,
          grandTotal: p.actual_slip_amount || 15000,
          reconcile_note: p.reconcile_note,
        }));
      }

      if (dbLogs) {
        logs = dbLogs.map((l: any) => ({
          work_date: l.work_date,
          period_label: l.period_id,
          type_label: LOG_TYPE_CONFIG[l.log_type]?.label || l.log_type,
          title_note: l.title_note,
          amount: Number(l.amount) || 0,
          payout_channel: l.payout_channel,
          is_paid: l.is_paid,
        }));
      }
    }

    // Fallback if empty demo data
    if (periods.length === 0) {
      periods = [
        {
          period_key: "2026-11",
          periodLabel: "รอบ 2026-11",
          shiftRange: "21 ต.ค. - 20 พ.ย. 69",
          counts: { a: 10, n: 8, ot_m: 2, ot_a: 4, ot_n: 3, holiday: 2 },
          expectedHospitalSlip: 18240,
          actualSlipAmount: 17200,
          deltaSlip: -1040,
          slipStatusLabel: "ขาด 1,040 บ.",
          directIncome: 1500,
          grandTotal: 19740,
          reconcile_note: "ขาด OT บ่าย 12 พ.ย.",
        },
      ];
    }

    const buffer = await createExcelWorkbook(periods, logs);
    const filename = `สรุปค่าเวร_${userName}_${exportAll ? "ทั้งปี" : periodKey}.xlsx`;

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Disposition": `attachment; filename="${encodeURIComponent(filename)}"`,
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      },
    });
  } catch (error) {
    console.error("Export Excel GET error:", error);
    return NextResponse.json({ error: "Failed to generate Excel file" }, { status: 500 });
  }
}
