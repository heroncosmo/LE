import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'IA Vendedora Luchoa - Leandro Uchoa',
  description: 'Sistema de IA especializada em prospecção e relacionamento com clientes para rochas ornamentais premium',
  keywords: 'IA, vendas, prospecção, relacionamento, rochas ornamentais, Luchoa, Leandro Uchoa',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <body className={inter.className}>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
          {children}
        </div>
      </body>
    </html>
  )
}
