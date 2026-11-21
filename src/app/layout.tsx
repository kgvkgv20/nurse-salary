import type { Metadata, Viewport } from "next";
import { Noto_Sans_Thai, Kanit, Anuphan, Prompt, Geist_Mono } from "next/font/google";
import "./globals.css";

const notoSansThai = Noto_Sans_Thai({
  variable: "--font-noto",
  subsets: ["thai", "latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

const kanit = Kanit({
  variable: "--font-kanit",
  subsets: ["thai", "latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

const anuphan = Anuphan({
  variable: "--font-anuphan",
  subsets: ["thai", "latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

const prompt = Prompt({
  variable: "--font-prompt",
  subsets: ["thai", "latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "NursePay Check - ระบบคำนวณและกระทบยอดค่าเวรพยาบาล",
  description: "LINE LIFF แอปสำหรับพยาบาล บันทึก คำนวณ และกระทบยอดค่าเวร แยกกระเป๋าสลิปและเวรนอกอย่างแม่นยำ",
  icons: {
    icon: "/favicon.ico",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#0f766e",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="th"
      data-font="noto"
      className={`${notoSansThai.variable} ${kanit.variable} ${anuphan.variable} ${prompt.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans select-none bg-slate-100 dark:bg-slate-950">
        {children}
      </body>
    </html>
  );
}
