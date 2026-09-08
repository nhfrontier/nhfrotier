import type { Metadata } from "next";
import "./globals.css";
import { UserProvider } from "./contexts/UserContext";

export const metadata: Metadata = {
  title: "MockupGen - AI 목업 생성 도구",
  description: "기획안을 입력하면 AI가 목업 화면을 자동으로 생성해드립니다.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // 히어로의 부트스트랩 스크립트가 하이드레이션 전에 <html>에 js 클래스를 붙인다.
  // 서버 렌더와 달라지는 것이 의도이므로 그 경고만 끈다.
  return (
    <html lang="ko" className="h-full" suppressHydrationWarning>
      <body className="min-h-full flex flex-col bg-slate-50">
        <UserProvider>{children}</UserProvider>
      </body>
    </html>
  );
}
