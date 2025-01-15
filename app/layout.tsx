import { Inter } from 'next/font/google'
import Header from '@/components/header'
import Footer from '@/components/footer'
import './globals.css'

const inter = Inter({ subsets: ['latin', 'cyrillic'] })

export const metadata = {
  title: 'VasperNews',
  description: 'Ваш источник актуальных новостей',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <body className={inter.className}>
          <div className="relative min-h-screen flex flex-col bg-background">
            <Header />
            <main className="flex-1">
              {children}
            </main>
            <Footer />
            <div className="fixed bottom-0 left-0 right-0 h-24 pointer-events-none">
              <svg
                viewBox="0 0 1440 320"
                className="w-full h-full"
                preserveAspectRatio="none"
              >
                <path
                  fill="#FFB6C1"
                  fillOpacity="0.2"
                  d="M0,96L48,112C96,128,192,160,288,186.7C384,213,480,235,576,213.3C672,192,768,128,864,128C960,128,1056,192,1152,208C1248,224,1344,192,1392,176L1440,160L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
                ></path>
              </svg>
            </div>
          </div>
      </body>
    </html>
  )
}

