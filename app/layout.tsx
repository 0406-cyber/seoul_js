export const runtime = "edge";
export const dynamic = 'force-dynamic';

import type { Metadata, Viewport } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Toaster } from 'sonner'
import Script from 'next/script' // ✨ 구글 애널리틱스를 위한 Script 컴포넌트 추가
import './globals.css'
import { ThemeProvider } from "@/components/theme-provider"

const _geist = Geist({ subsets: ["latin"] });
const _geistMono = Geist_Mono({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: 'Enerview',
  description: '에너지 사용량을 분석, AI 쳇봇',
  generator: 'v0.app',
  manifest: '/manifest.json', // 👈 PWA 매니페스트 파일 연결 추가
  icons: {
    icon: [
      {
        url: '/icon.svg', // 👈 실제 존재하는 파일로 브라우저 탭 아이콘 설정
        type: 'image/svg+xml',
      },
    ],
    apple: '/seoul_logo.png', // 👈 홈 화면 바로가기용 모바일 아이콘을 실제 로고 파일로 대체
  },
}

export const viewport: Viewport = {
  themeColor: '#121212',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
<html lang="ko" suppressHydrationWarning>
      <body className="font-sans antialiased bg-background text-foreground">       
        {/* ✨ 구글 애널리틱스 (Google Analytics) 태그 시작 */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-HKH246CX9C"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-HKH246CX9C');
          `}
        </Script>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster richColors position="top-center" />

          {/* ✨ 순수 서비스 워커 등록 스크립트 추가 */}
          <Script id="register-sw" strategy="afterInteractive">
            {`
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js').then(
                    function(registration) { console.log('ServiceWorker registration successful'); },
                    function(err) { console.log('ServiceWorker registration failed: ', err); }
                  );
                });
              }
            `}
          </Script>
        </ThemeProvider>

      </body>
    </html>
  )
}