# Git Branching Workflow & Development Guide 🌿

คู่มือมาตรฐานการทำงานร่วมกับ Git และ GitHub สำหรับโครงการ **NursePay Check (`nurse-salary`)** เพื่อความเป็นระเบียบ ความปลอดภัยของโค้ด และการย้อนดูประวัติการพัฒนาได้ง่าย

---

## 🌳 1. โครงสร้าง Branch (Branching Strategy)

ระบบนี้ใช้รูปแบบ **Feature Branch Workflow (Git Flow แบบกระชับ)** โดยมีโครงสร้างหลักดังนี้:

```text
main (Production / Stable)
  ▲
  │ (Merge เมื่อทดสอบและพร้อมปล่อยเวอร์ชันใหม่ พร้อมติด Tag)
  │
develop (Main Development Branch) ◀── [จุดเริ่มต้นของทุกงาน]
  ▲             ▲             ▲
  │             │             │
feat/xxx      fix/xxx      refactor/xxx
```

| ชื่อ Branch | หน้าที่ | คำอธิบาย |
| :--- | :--- | :--- |
| `develop` | **Branch หลักในการพัฒนา (Default)** | รวมโค้ดล่าสุดที่ผ่านการทดสอบแล้ว ทุกคนจะแตกกิ่งออกจากที่นี่ |
| `main` | **Production Release** | โค้ดเวอร์ชันเสถียรที่ใช้งานจริง (มี Tag กำกับ เช่น `R1.0.1`, `v1.1.0`) |
| `feat/<ชื่อฟีเจอร์>` | **พัฒนาฟีเจอร์ใหม่** | แตกออกจาก `develop` เมื่อทำเสร็จให้ merge กลับเข้า `develop` |
| `fix/<ชื่อบั๊ก>` | **แก้ไขปัญหา/บั๊ก** | แตกออกจาก `develop` เพื่อแก้บั๊ก แล้ว merge กลับเข้า `develop` |
| `refactor/<หัวข้อ>` | **ปรับปรุงโค้ด/ดีไซน์** | แตกออกจาก `develop` เพื่อจัดระเบียบโค้ดหรือ UI |

---

## 🚀 2. ขั้นตอนการทำงานจริง (Step-by-Step Workflow)

### ขั้นตอนที่ 1: ก่อนเริ่มทำฟีเจอร์ใหม่ (Checkout New Branch)
ก่อนลงมือเขียนโค้ด ให้กลับมาที่ `develop` ดึงโค้ดล่าสุด แล้วแตก branch ใหม่เสมอ:

```bash
# 1. สลับมาที่ branch develop
git checkout develop

# 2. ดึงโค้ดล่าสุดจาก GitHub
git pull origin develop

# 3. แตก branch ใหม่สำหรับงานชิ้นนั้น (ตั้งชื่อให้สื่อความหมาย)
git checkout -b feat/reconcile-enhancement
```

*ตัวอย่างการตั้งชื่อ Branch:*
- `feat/slip-line-items` (ฟีเจอร์ตรวจสลิปแยกหมวดผลัดกับ OT)
- `feat/dispute-line-copy` (ปุ่มคัดลอกข้อความทักการเงิน)
- `fix/calendar-leap-year` (แก้บั๊กวันในปฏิทิน)
- `refactor/wellness-styles` (ปรับแต่ง CSS หน้าพลังชีวิต)

---

### ขั้นตอนที่ 2: พัฒนาและบันทึกโค้ด (Commit)
ระหว่างการทำงาน ให้บันทึกโค้ดเป็นระยะๆ ด้วยข้อความที่ชัดเจน (Conventional Commits):

```bash
# ตรวจสอบไฟล์ที่เปลี่ยนแปลง
git status

# เพิ่มไฟล์เข้าระบบ
git add .

# บันทึกพร้อมข้อความ
git commit -m "feat: add slip line-item breakdown matcher"
```

*Prefix ที่แนะนำ:*
- `feat:` เพิ่มฟีเจอร์ใหม่
- `fix:` แก้ไขบั๊ก
- `style:` ปรับแก้ UI, สไตล์ หรือการจัดวาง
- `refactor:` ปรับปรุงโครงสร้างโค้ดโดยไม่เปลี่ยนผลลัพธ์
- `docs:` แก้ไขเอกสารประกอบ

---

### ขั้นตอนที่ 3: ตรวจสอบความถูกต้องก่อนส่งงาน (Verification)
ทุกครั้งก่อนที่จะรวมโค้ดกลับเข้า branch หลัก **ต้องรันคำสั่งทดสอบว่า build ผ่าน 100%**:

```bash
npm run build
```
*(ต้องขึ้น compiled successfully โดยไม่มี error หรือ type mismatch ใดๆ)*

---

### ขั้นตอนที่ 4: รวมโค้ดกลับเข้า Branch หลัก (`develop`)
เมื่อฟีเจอร์ทำงานถูกต้องและ build ผ่านแล้ว ให้รวมโค้ดกลับเข้า `develop`:

```bash
# 1. สลับกลับมาที่ branch develop
git checkout develop

# 2. รวม branch ฟีเจอร์เข้ามา (แนะนำใส่ --no-ff เพื่อเก็บบันทึกประวัติ branch ไว้)
git merge --no-ff feat/reconcile-enhancement -m "merge: feat/reconcile-enhancement into develop"

# 3. Push ขึ้น GitHub
git push origin develop

# 4. (ทางเลือก) ลบ branch ชั่วคราวที่ใช้งานเสร็จแล้ว
git branch -d feat/reconcile-enhancement
```

---

## 🏷️ 3. การติด Tag เวอร์ชัน (Release Tagging)

เมื่อพัฒนาฟีเจอร์ครบตามเป้าหมายของเวอร์ชัน ให้สร้าง Tag กำกับไว้ เพื่อใช้เป็นหมุดอ้างอิงย้อนหลัง:

```bash
# 1. สร้าง Annotated Tag พร้อมข้อความกำกับ
git tag -a R1.0.1 -m "Release R1.0.1: Wellness Hub, Symmetrical BottomNav, and Shift Tally enhancements"

# 2. ตรวจสอบรายการ Tag ในเครื่อง
git tag -l

# 3. Push Tag ขึ้น GitHub
git push origin --tags
```

---

## ⚙️ 4. คำสั่งสำหรับเชื่อมต่อ GitHub ครั้งแรก (First-Time Setup)

หากเพิ่งเปิดโปรเจกต์ใหม่และต้องการผูกกับ GitHub Repository:

```bash
# 1. ตั้งค่าชื่อและอีเมลสำหรับบันทึกประวัติ (ทำครั้งเดียว)
git config user.name "ชื่อของคุณ"
git config user.email "อีเมลของคุณ@example.com"

# 2. เชื่อมโยงกับ GitHub Repository URL ของคุณ
git remote add origin https://github.com/<USERNAME>/nurse-salary.git

# 3. ตรวจสอบว่า remote เชื่อมต่อถูกต้อง
git remote -v

# 4. Push branch develop และ Tag ขึ้น GitHub ครั้งแรก
git push -u origin develop
git push origin --tags
```

---

## 🛡️ 5. กฎเหล็กเพื่อความปลอดภัยของระบบ (Safety Guardrails)

1. **ไม่ Commit ไฟล์ความลับ (`.env*`):** 
   - ไฟล์ `.env`, `.env.local` หรือ Service Key ต่างๆ ถูกใส่ไว้ใน `.gitignore` แล้ว ห้ามบังคับเพิ่ม (`git add -f`) เด็ดขาด
2. **ห้าม Merge โค้ดที่ Build ไม่ผ่านเข้า `develop`:**
   - ต้องมั่นใจว่ารัน `npm run build` ผ่านทุกครั้ง
3. **อย่าทำงานตรงๆ บน `main` หรือ `develop`:**
   - แตก branch แยกเสมอ แม้จะเป็นการแก้ไขเล็กน้อยก็ตาม เพื่อให้สามารถย้อนกลับหรือทดสอบได้ง่ายโดยไม่กระทบโค้ดหลัก
