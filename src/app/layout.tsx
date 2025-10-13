import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Toaster } from 'react-hot-toast'
import Chatbot from '@/components/Chatbot'
import { AuthProvider } from '@/contexts/auth-context'
import { ErrorBoundary } from '@/components/ErrorBoundary'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'SmartBuild Materials Store',
  description: 'Construction Materials E-commerce Platform - Buy quality construction materials online',
  manifest: '/manifest.json',
  themeColor: '#667eea',
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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ErrorBoundary>
          <AuthProvider>
            <div id="root">
              {children}
            </div>
            <Chatbot />
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
          </AuthProvider>
        </ErrorBoundary>
      </body>
    </html>
  )
}
