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
// import { ErrorBoundary } from '@/components/ErrorBoundary' // Temporarily disabled

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'SmartBuild Materials Store',
  description: 'Construction Materials E-commerce Platform - Buy quality construction materials online',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'SmartBuild',
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: 'website',
    siteName: 'SmartBuild Materials Store',
    title: 'SmartBuild Materials Store',
    description: 'Construction Materials E-commerce Platform',
  },
  twitter: {
    card: 'summary',
    title: 'SmartBuild Materials Store',
    description: 'Construction Materials E-commerce Platform',
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
    <html lang="en">
      <body className={inter.className}>
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
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: {
                  background: '#363636',
                  color: '#fff',
                },
              }}
            />
            <RealtimeNotificationWatcher />
          </AuthProvider>
        </GoogleProvider>
      </body>
    </html>
  )
}
