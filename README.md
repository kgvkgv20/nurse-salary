# NursePay Check (LINE LIFF) 🩺
**ระบบช่วยบันทึก คำนวณ และกระทบยอดค่าเวรสำหรับพยาบาล**

ออกแบบตามข้อกำหนดและสเปคใน [line_liff.md](file:///d:/project-gemini/nurse-salary/line_liff.md) เพื่อแก้ปัญหาความเหนื่อยล้าจากการจิ้มปฏิทินรายวัน และแยกกระเป๋าเงินสลิปโรงพยาบาลออกจากเวรนอกอย่างชัดเจน

---

## ✨ จุดเด่นและฟีเจอร์หลัก (Key Features)

1. **ไม่ทำงานซ้ำซ้อน (Tally Stepper):**
   - สรุปยอดเวรตารางประจำรอบ (บ่าย, ดึก, OT เช้า, OT บ่าย, OT ดึก, วันหยุด) ด้วยปุ่มบวกลบขนาดใหญ่สำหรับนิ้วโป้ง จบใน 30 วินาที
   - ซ่อนเวรที่เรต 0 บาทอัตโนมัติ (เช่น เวรเช้าที่รวมในฐานเงินเดือนแล้ว)
   - บันทึกแบบ **Rate Snapshot** เพื่อล็อกเรตค่าเวรประจำรอบเดือน ป้องกันประวัติย้อนหลังคลาดเคลื่อนเมื่อมีการปรับขึ้นค่าเวรในอนาคต

2. **แยกกระเป๋าเงิน 2 ช่องทางเด็ดขาด:**
   - **กระเป๋าที่ 1: ยอดรอเข้าสลิปโรงพยาบาล ($E_{\text{hosp}}$)** สำหรับกระทบยอดกับเงินที่ฝ่ายการเงินโอนจริง
   - **กระเป๋าที่ 2: ยอดนอกสลิป / รับโอนตรง ($E_{\text{direct}}$)** สำหรับติดตามเงินเวรแทนเพื่อนหรือคลินิกนอก แยกชัดเจนระหว่าง `ค้างรับ` และ `ได้รับแล้ว` พร้อมปุ่มกดติ๊กยืนยันรับเงินได้ทันทีจากหน้าแรก

3. **ตรวจกระทบยอดสลิปเงินเดือน ($\Delta_{\text{slip}}$):**
   - กรอกยอดเงินที่ได้รับจริงตามสลิป ระบบคำนวณส่วนต่างทันที:
     - ยอดตรงครบถ้วน (สีเขียว พร้อมเอฟเฟกต์ Confetti)
     - เงินเข้าขาด (สีแดง แจ้งเตือนยอดที่ขาด)
     - เงินเข้าเกิน (สีฟ้า)
   - ช่องบันทึกช่วยจำเพื่อติดตามเคส เช่น *"ขาดค่า OT วันที่ 12 พ.ย. แจ้งพี่ธุรการแล้ว"*

4. **จดงานงอก / เวรนอกด่วนใน 3 คลิก (Bottom Sheet):**
   - **คลิก 1:** เลือกประเภทงาน (OT ชม., รับเวรแทน, คลินิกนอก, ขายเวร) พร้อมปุ่มลัดคลินิกประจำ (Presets)
   - **คลิก 2:** ระบุวันที่และจำนวนเงิน (มีปุ่มลัด 1, 2, 4 ชม. คูณเรตให้อัตโนมัติ)
   - **คลิก 3:** เลือกกระเป๋าเงิน (เข้าสลิป หรือ รับโอนตรง)

5. **ส่งออกรายงาน Excel (.xlsx 2 Sheets):**
   - Sheet 1: `สรุปรายเดือน` (ภาพรวมทั้งปี/รอบเดือน)
   - Sheet 2: `รายการงานเสริมและ OT` (รายละเอียดรายวัน พร้อมตัวกรองแยกกระเป๋าเงิน)
   - รองรับการเปิดลิงก์ดาวน์โหลดบน External Browser ป้องกันปัญหา LINE In-App Browser บล็อกการดาวน์โหลด Blob

6. **ระบบจำลองการทำงาน (Mock Mode):**
   - สามารถรันและทดสอบระบบบนเครื่องคอมพิวเตอร์ผ่าน Browser ทั่วไปได้ทันทีโดยไม่ต้องรอลงทะเบียน LINE LIFF หรือ Supabase

---

## 🚀 เริ่มต้นใช้งานในเครื่อง (Quick Start)

### 1. ติดตั้ง Dependencies
```bash
npm install
```

### 2. รันโหมด Development
```bash
npm run dev
```
เปิดบราวเซอร์ไปที่ `http://localhost:3000` สามารถทดลองบวกลบเวร จดงานงอก ตรวจสลิป และดาวน์โหลด Excel ได้ทันที!

---

## 🗄️ การเชื่อมต่อ Supabase (Database Setup)

1. สมัครหรือสร้างโปรเจกต์ที่ [Supabase](https://supabase.com)
2. ไปที่เมนู **SQL Editor** แล้วคัดลอกคำสั่งจากไฟล์ [`supabase/schema.sql`](file:///d:/project-gemini/nurse-salary/supabase/schema.sql) ไปวางและกด **Run**
3. สร้างไฟล์ `.env.local` จากตัวอย่าง [`.env.example`](file:///d:/project-gemini/nurse-salary/.env.example):
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

---

## 📱 การผูกกับ LINE LIFF

1. เข้าไปที่ [LINE Developers Console](https://developers.line.biz/)
2. สร้าง Provider และ Channel แบบ **LINE Login**
3. ไปที่แท็บ **LIFF** แล้วกด **Add**:
   - **Endpoint URL:** ใส่ URL ของเว็บคุณที่ Deploy บน Vercel เช่น `https://your-app.vercel.app`
   - **Scope:** เลือก `profile`, `openid`
4. คัดลอก **LIFF ID** มาใส่ใน `.env.local`:
```env
NEXT_PUBLIC_LIFF_ID=1234567890-abcdefgh
```

---

## 📁 โครงสร้างโปรเจกต์ (Project Structure)

```
nurse-salary/
├── src/
│   ├── app/
│   │   ├── api/export-excel/route.ts  # API สร้างไฟล์ Excel .xlsx 2 แผ่นงาน
│   │   ├── globals.css                # สไตล์ Tailwind CSS v4 & Mobile optimizations
│   │   ├── layout.tsx                 # Root layout พร้อม viewport สำหรับ LINE LIFF
│   │   └── page.tsx                   # หน้าหลักและ Controller รวมทุกแท็บ
│   ├── components/
│   │   ├── BottomNav.tsx              # เมนูนำทางด้านล่างสไตล์แอปธนาคาร
│   │   ├── DashboardScreen.tsx        # หน้าหลักสรุปยอด 2 กระเป๋า + กล่องตรวจสลิป + กราฟ
│   │   ├── PeriodHeader.tsx           # แถบเลือกรอบวิกเงินออก
│   │   ├── QuickAddSheet.tsx          # แผ่นจดงานงอก 3 คลิก (Bottom Sheet)
│   │   ├── SettingsScreen.tsx         # หน้าตั้งค่าวันตัดวิก เรตค่าเวร และ Presets
│   │   └── ShiftTallyScreen.tsx       # หน้านับเวรตารางด้วยปุ่ม Stepper บวกลบ
│   ├── lib/
│   │   ├── calculations.ts            # สูตรคำนวณเงิน, รอบวิก, Reconcile, แปลงวันที่ไทย
│   │   ├── constants.ts               # ค่าคงที่, เรตมาตรฐาน, สีและป้ายเวร
│   │   ├── liff.ts                    # LINE LIFF SDK wrapper พร้อม Mock Mode
│   │   ├── storage.ts                 # Data Access Layer (Supabase + LocalStorage Fallback)
│   │   └── supabaseClient.ts          # Supabase client initializer
│   └── types/
│       └── index.ts                   # Type definitions ทั้งหมดตาม Data Schema
├── supabase/
│   └── schema.sql                     # คำสั่ง SQL สร้างทั้ง 4 ตาราง + RLS
├── line_liff.md                       # เอกสารสเปคทางเทคนิคต้นฉบับ
├── package.json
└── README.md
```
