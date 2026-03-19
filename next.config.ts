import type { NextConfig } from "next"
import withPWAInit from "@ducanh2912/next-pwa"

const withPWA = withPWAInit({
  dest: "public",
  register: true,
  // customWorkerDir: "worker", // @ducanh2912/next-pwa should find this automatically
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
  disable: false // Forçar ativação para teste mesmo em dev
})

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "qcejgeazpduqpnsakqvn.supabase.co",
        pathname: "/storage/v1/object/public/**"
      },
      {
        protocol: "https",
        hostname: "ui-avatars.com"
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com" // Google OAuth avatars
      }
    ]
  }
}
export default withPWA(nextConfig)
