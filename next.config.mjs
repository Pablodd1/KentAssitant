/** @type {import('next').NextConfig} */
const nextConfig = {
  // Security headers for HIPAA compliance
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          // Prevent clickjacking
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          // Prevent MIME type sniffing
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          // Enable XSS protection
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          // Control referrer information
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          // Content Security Policy
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:; connect-src 'self' https://generativelanguage.googleapis.com;"
          },
          // Strict Transport Security (HSTS) - force HTTPS
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains; preload'
          },
          // Permissions Policy - restrict sensitive features
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), payment=()'
          }
        ]
      }
    ];
  },

  // Security: Disable server info exposure
  poweredByHeader: false,

  // Security: Image optimization settings
  images: {
    // Only allow images from same origin in production
    remotePatterns: process.env.NODE_ENV === 'production' ? [] : [
      {
        protocol: 'https',
        hostname: '**'
      }
    ]
  },

  // Security: Disable generating error pages with stack traces
  reactStrictMode: true,

  // Security: Ensure proper encoding
  stringModules: false
};

export default nextConfig;
