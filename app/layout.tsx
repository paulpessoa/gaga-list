import type { Metadata, Viewport } from "next"
import "./globals.css" // Global styles
import "leaflet/dist/leaflet.css" // Leaflet styles
import Providers from "./providers"
import Script from "next/script"
import { NavigationWrapper } from "@/components/navigation-wrapper"

export const metadata: Metadata = {
  title: "Lista Pronta",
  description: "Listas de compras colaborativas em tempo real.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Lista Pronta"
  }
}

export const viewport: Viewport = {
  themeColor: "#09090b",
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
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        {/* Microsoft Clarity Script */}
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
        className="bg-zinc-950 text-zinc-50 min-h-screen antialiased selection:bg-indigo-500/30 pb-20 md:pb-0"
      >
        <Providers>
          {children}
          <NavigationWrapper />
        </Providers>
      </body>
    </html>
  )
}
