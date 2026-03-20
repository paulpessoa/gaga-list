import type { NextConfig } from "next"
import withPWAInit from "@ducanh2912/next-pwa"

const withPWA = withPWAInit({
  dest: "public",
  register: true,
  cacheOnFrontEndNav: false,
  reloadOnOnline: true,
  disable: false
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
