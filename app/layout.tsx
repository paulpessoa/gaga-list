import type { Metadata, Viewport } from "next"
import "./globals.css" // Global styles
import "leaflet/dist/leaflet.css" // Leaflet styles
import Providers from "./providers"
import Script from "next/script"
import { NavigationWrapper } from "@/components/navigation-wrapper"
import { DesktopBlocker } from "@/components/ui/desktop-blocker"

export const metadata: Metadata = {
  title: "Lista Pronta",
  description: "Listas de compras colaborativas em tempo real.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Lista Pronta"
  },
  icons: {
    apple: "/icons/icon-192x192.png"
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
        {/* Script Crítico para Evitar Flash de Tema */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  const theme = localStorage.getItem('theme');
                  const supportDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches === true;
                  if (theme === 'dark' || (theme === 'system' && supportDarkMode) || (!theme && supportDarkMode)) {
                    document.documentElement.classList.add('dark');
                  } else if (theme === 'light') {
                    document.documentElement.classList.remove('dark');
                  } else if (!theme) {
                     // Default app preference is dark if no theme is set
                     document.documentElement.classList.add('dark');
                  }
                } catch (e) {}
              })();
            `
          }}
        />
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
      <body className="bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 min-h-screen antialiased selection:bg-indigo-500/30 pb-20 md:pb-0 transition-colors duration-300">
        <Providers>
          <DesktopBlocker />
          {children}
          <NavigationWrapper />
        </Providers>
      </body>
    </html>
  )
}
