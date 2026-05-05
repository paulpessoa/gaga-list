import type { Metadata, Viewport } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import "leaflet/dist/leaflet.css"
import Providers from "./providers"
import Script from "next/script"
import { NavigationWrapper } from "@/components/navigation-wrapper"
import { DesktopBlocker } from "@/components/ui/desktop-blocker"

/**
 * Inter é a fonte oficial do Design System GagaList Pro.
 * Carregamento otimizado via next/font para zero layout shift.
 */
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap"
})

export const metadata: Metadata = {
  title: "GagaList",
  description: "Listas de compras colaborativas com sincronização em tempo real.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "GagaList"
  },
  icons: {
    icon: "/favicon.png",
    apple: "/icons/icon-192x192.png"
  }
}

export const viewport: Viewport = {
  themeColor: "#131313", // Obsidian — base do Design System GagaList Pro
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover"
}

export default function RootLayout({
  children
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR" className="dark" suppressHydrationWarning>
      <head>
        {/*
          Script crítico: garante dark mode desde o primeiro render.
          O GagaList Pro é dark-first por design — sem flash de tema.
        */}
        <script
          dangerouslySetInnerHTML={{
            __html: `document.documentElement.classList.add('dark');`
          }}
        />
        {/* Microsoft Clarity — Observability de UX */}
        <Script id="microsoft-clarity" strategy="afterInteractive">
          {`
            (function(c,l,a,r,i,t,y){
                c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
                t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
                y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
            })(window, document, "clarity", "script", "YOUR_CLARITY_ID");
          `}
        </Script>
      </head>
      <body
        className={`
          ${inter.variable}
          font-[family-name:var(--font-inter)]
          bg-[#131313] text-[#e5e2e1]
          min-h-screen antialiased
          selection:bg-[#53E076]/20 selection:text-[#53E076]
          pb-20 md:pb-0
        `}
      >
        <Providers>
          <DesktopBlocker />
          {children}
          <NavigationWrapper />
        </Providers>
      </body>
    </html>
  )
}
