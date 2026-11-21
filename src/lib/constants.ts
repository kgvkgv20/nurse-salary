import { ShiftCounts, ShiftRates, UserSettings } from "@/types";

export const DEFAULT_RATES: ShiftRates = {
  m: 0,        // เวรเช้า (มักรวมในเงินเดือนฐาน)
  a: 300,      // เวรบ่าย
  n: 360,      // เวรดึก
  ot_m: 750,   // OT เช้า
  ot_a: 750,   // OT บ่าย
  ot_n: 800,   // OT ดึก
  holiday: 300,// บวกเพิ่มวันหยุดนักขัตฤกษ์ / เวรควง
  ot_hr: 120,  // OT รายชั่วโมง
};

export const DEFAULT_SHIFT_COUNTS: ShiftCounts = {
  m: 0,
  a: 0,
  n: 0,
  ot_m: 0,
  ot_a: 0,
  ot_n: 0,
  holiday: 0,
};

export const DEFAULT_SHIFT_TIMES: Record<keyof ShiftCounts, { timeRange: string; hours: number }> = {
  m: { timeRange: "08:00 - 16:00", hours: 8 },
  a: { timeRange: "16:00 - 24:00", hours: 8 },
  n: { timeRange: "00:00 - 08:00", hours: 8 },
  ot_m: { timeRange: "08:00 - 16:00", hours: 8 },
  ot_a: { timeRange: "16:00 - 24:00", hours: 8 },
  ot_n: { timeRange: "00:00 - 08:00", hours: 8 },
  holiday: { timeRange: "ทั้งวัน / ตามเวร", hours: 0 },
};

export const SHIFT_CONFIG: {
  key: keyof ShiftCounts;
  label: string;
  badge: string;
  color: string;
  defaultTime: string;
}[] = [
  { key: "m", label: "เวรเช้า (กะปกติ)", badge: "ช", color: "bg-amber-100/90 text-amber-800 border-amber-200", defaultTime: "08:00 - 16:00" },
  { key: "a", label: "เวรบ่าย (กะปกติ)", badge: "บ", color: "bg-sky-100/90 text-sky-800 border-sky-200", defaultTime: "16:00 - 24:00" },
  { key: "n", label: "เวรดึก (กะปกติ)", badge: "ด", color: "bg-indigo-100/90 text-indigo-800 border-indigo-200", defaultTime: "00:00 - 08:00" },
  { key: "ot_m", label: "OT เช้า (เต็มกะ)", badge: "OT-ช", color: "bg-emerald-100/90 text-emerald-800 border-emerald-200", defaultTime: "08:00 - 16:00" },
  { key: "ot_a", label: "OT บ่าย (เต็มกะ)", badge: "OT-บ", color: "bg-cyan-100/90 text-cyan-800 border-cyan-200", defaultTime: "16:00 - 24:00" },
  { key: "ot_n", label: "OT ดึก (เต็มกะ)", badge: "OT-ด", color: "bg-purple-100/90 text-purple-800 border-purple-200", defaultTime: "00:00 - 08:00" },
  { key: "holiday", label: "บวกเพิ่มวันหยุด / เวรควง", badge: "หยุด", color: "bg-rose-100/90 text-rose-800 border-rose-200", defaultTime: "วันหยุดนักขัตฤกษ์" },
];

export const LOG_TYPE_CONFIG: {
  [key: string]: { label: string; icon: string; defaultChannel: "HOSPITAL" | "DIRECT"; isDeduction?: boolean };
} = {
  OT_HOURLY: {
    label: "OT รายชั่วโมง (อยู่ต่อ)",
    icon: "Clock",
    defaultChannel: "HOSPITAL",
  },
  COVER_PEER: {
    label: "รับเวรแทนเพื่อน",
    icon: "Users",
    defaultChannel: "DIRECT",
  },
  EXTERNAL_CLINIC: {
    label: "เวรคลินิก / รพ.นอก",
    icon: "Building2",
    defaultChannel: "DIRECT",
  },
  SELL_SHIFT: {
    label: "ขายเวรให้เพื่อน (หักยอด)",
    icon: "ArrowDownRight",
    defaultChannel: "DIRECT",
    isDeduction: true,
  },
};

export const THAI_MONTH_SHORT = [
  "ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.",
  "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."
];

export const THAI_MONTH_FULL = [
  "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
  "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"
];

export const DEFAULT_USER_SETTINGS: UserSettings = {
  line_user_id: "U_MOCK_NURSE_001",
  display_name: "พยาบาลเมย์",
  cutoff_start_day: 21,
  payout_month_offset: 1,
  include_base_salary: false,
  base_salary: 24500,
  enable_direct_wallet: true,
  default_rates: DEFAULT_RATES,
  shift_times: DEFAULT_SHIFT_TIMES,
  selected_font: "noto",
};

export const AVAILABLE_FONTS = [
  {
    key: "noto" as const,
    nameTh: "Noto Sans Thai",
    subTh: "ละมุน สบายตา โค้งมนเป็นธรรมชาติ (สไตล์ Apple Sukhumvit)",
    tag: "แนะนำ 🌟",
    preview: "คำนวณค่าเวรพยาบาล ฿123,456",
  },
  {
    key: "kanit" as const,
    nameTh: "Kanit (คณิต)",
    subTh: "คมชัด กระชับ สไตล์สปอร์ต ยอดนิยมอันดับ 1 ของไทย",
    tag: "ยอดนิยม 🔥",
    preview: "คำนวณค่าเวรพยาบาล ฿123,456",
  },
  {
    key: "anuphan" as const,
    nameTh: "Anuphan (อนุพันธ์)",
    subTh: "เรียบหรู ปราณีต ออกแบบพิเศษสำหรับอ่านบนหน้าจอมือถือ",
    tag: "โมเดิร์น ✨",
    preview: "คำนวณค่าเวรพยาบาล ฿123,456",
  },
  {
    key: "prompt" as const,
    nameTh: "Prompt (พร้อมพท์)",
    subTh: "ทรงเรขาคณิตตัดตรง สไตล์โมบายแบงก์กิ้ง",
    tag: "การเงิน 🏦",
    preview: "คำนวณค่าเวรพยาบาล ฿123,456",
  },
];
