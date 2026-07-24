import type { NextConfig } from "next";

function getSupabaseHostname(): string | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) return null;
  try {
    return new URL(url).hostname;
  } catch {
    return null;
  }
}

const supabaseHostname = getSupabaseHostname();

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "http2.mlstatic.com" },
      { protocol: "https", hostname: "placehold.co" },
      { protocol: "https", hostname: "logzz-s3.s3.us-east-2.amazonaws.com" },
      ...(supabaseHostname
        ? [{
            protocol: "https" as const,
            hostname: supabaseHostname,
            pathname: "/storage/v1/object/public/product-images/**",
          }]
        : []),
    ]
  }
};

export default nextConfig;
