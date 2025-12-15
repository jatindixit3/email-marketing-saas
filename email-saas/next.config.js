/** @type {import('next').NextConfig} */

const nextConfig = {
  // ============================================
  // Performance Optimizations
  // ============================================

  // Enable React strict mode for better error detection
  reactStrictMode: true,

  // Enable SWC minification (faster than Terser)
  swcMinify: true,

  // Compiler options
  compiler: {
    // Remove console logs in production
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn']
    } : false,
  },

  // ============================================
  // Image Optimization
  // ============================================

  images: {
    // Image domains (add your CDN/storage domains)
    domains: [
      'localhost',
      'supabase.co',
      // Add your domains here
    ],

    // Image formats
    formats: ['image/avif', 'image/webp'],

    // Device sizes for responsive images
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],

    // Image sizes for different layouts
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],

    // Minimize layout shift
    minimumCacheTTL: 60,

    // Disable static imports in favor of next/image
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },

  // ============================================
  // Compression
  // ============================================

  compress: true, // Enable gzip compression

  // ============================================
  // Headers
  // ============================================

  async headers() {
    return [
      {
        // Apply security headers to all routes
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()'
          }
        ],
      },
      {
        // Cache static assets
        source: '/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        // Cache images
        source: '/_next/image/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ]
  },

  // ============================================
  // Redirects
  // ============================================

  async redirects() {
    return [
      // Add your redirects here
      // {
      //   source: '/old-route',
      //   destination: '/new-route',
      //   permanent: true,
      // },
    ]
  },

  // ============================================
  // Rewrites (for API proxying)
  // ============================================

  async rewrites() {
    return [
      // Add rewrites if needed
      // {
      //   source: '/api/:path*',
      //   destination: 'https://api.example.com/:path*',
      // },
    ]
  },

  // ============================================
  // Build Configuration
  // ============================================

  // Production browser support
  productionBrowserSourceMaps: false, // Disable source maps in production for security

  // Disable x-powered-by header
  poweredByHeader: false,

  // Generate etags
  generateEtags: true,

  // ============================================
  // Experimental Features
  // ============================================

  experimental: {
    // Enable optimized package imports
    optimizePackageImports: [
      'lucide-react',
      '@radix-ui/react-icons',
      'date-fns',
    ],

    // Optimize CSS - disabled due to critters dependency issue
    // optimizeCss: true,
  },

  // ============================================
  // Webpack Configuration
  // ============================================

  webpack: (config, { dev, isServer }) => {
    // Production optimizations
    if (!dev) {
      // Tree shaking
      config.optimization.usedExports = true

      // Split chunks for better caching
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          default: false,
          vendors: false,
          // Vendor chunk
          vendor: {
            name: 'vendor',
            chunks: 'all',
            test: /node_modules/,
            priority: 20
          },
          // Common chunk
          common: {
            name: 'common',
            minChunks: 2,
            chunks: 'all',
            priority: 10,
            reuseExistingChunk: true,
            enforce: true
          }
        }
      }
    }

    // Analyze bundle size
    if (process.env.ANALYZE === 'true') {
      const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer')
      config.plugins.push(
        new BundleAnalyzerPlugin({
          analyzerMode: 'static',
          reportFilename: isServer
            ? '../analyze/server.html'
            : './analyze/client.html',
          openAnalyzer: false,
        })
      )
    }

    return config
  },

  // ============================================
  // Environment Variables (Public)
  // ============================================

  env: {
    // Add public env vars here if needed
  },
}

module.exports = nextConfig
