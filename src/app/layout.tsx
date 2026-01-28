import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Toaster } from 'react-hot-toast'
import FloatingWidgetsContainer from '@/components/FloatingWidgetsContainer'
import ContractorRedirect from '@/components/ContractorRedirect'
import AdminRedirect from '@/components/AdminRedirect'
import ConsoleGuard from '@/components/ConsoleGuard'
import { AuthProvider } from '@/contexts/auth-context'
import { GoogleProvider } from '@/components/GoogleProvider'
import RealtimeNotificationWatcher from '@/components/RealtimeNotificationWatcher'
import Footer from '@/components/Footer'
import SystemInterceptor from '@/components/SystemInterceptor'
import GlobalAuthModals from '@/components/auth/GlobalAuthModals'
import OrganizationJsonLd from '@/components/seo/OrganizationJsonLd'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  title: {
    default: 'SmartBuild | Hệ thống Cung ứng Vật tư & Nhà thầu Xây dựng Công nghệ',
    template: '%s | SmartBuild'
  },
  description: 'SmartBuild - Nền tảng thương mại điện tử vật liệu xây dựng hàng đầu. Kết nối nhà cung cấp uy tín, đội ngũ nhà thầu chuyên nghiệp và giải pháp tính toán vật tư thông minh AI.',
  keywords: ['vật liệu xây dựng', 'nhà thầu xây dựng', 'báo giá vật liệu', 'xây nhà trọn gói', 'SmartBuild', 'mua vật liệu online'],
  authors: [{ name: 'SmartBuild Team' }],
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  manifest: '/manifest.json',
  openGraph: {
    type: 'website',
    locale: 'vi_VN',
    url: 'https://smartbuild.vn',
    siteName: 'SmartBuild Materials Store',
    title: 'SmartBuild | Hệ thống Cung ứng Vật tư & Nhà thầu Xây dựng',
    description: 'Mua vật liệu xây dựng chính hãng, tìm nhà thầu uy tín và quản lý dự án xây dựng dễ dàng với SmartBuild.',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'SmartBuild Ecosystem',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SmartBuild | Hệ thống Cung ứng Vật tư & Nhà thầu',
    description: 'Nền tảng công nghệ cho ngành xây dựng Việt Nam.',
  },
}

export function generateViewport() {
  return {
    themeColor: '#667eea',
  }
}

export const runtime = 'nodejs'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <body className={inter.className}>
        <OrganizationJsonLd />
        <GoogleProvider>
          <AuthProvider>
            <SystemInterceptor />
            <ConsoleGuard />
            <ContractorRedirect />
            <AdminRedirect />
            <GlobalAuthModals />
            <div id="root" className="min-h-screen flex flex-col">
              <main className="flex-grow">
                {children}
              </main>
              <Footer />
            </div>
            <FloatingWidgetsContainer />
            <RealtimeNotificationWatcher />
            <script
              dangerouslySetInnerHTML={{
                __html: `
              (function(c,l,a,r,i,t,y){
                  c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
                  t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
                  y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
              })(window, document, "clarity", "script", "p914clid12");
            `,
              }}
            />
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: {
                  background: '#333',
                  color: '#fff',
                },
              }}
            />
          </AuthProvider>
        </GoogleProvider>
      </body>
    </html>
  )
}
