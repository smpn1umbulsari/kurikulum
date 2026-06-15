const { withSentryConfig } = require("@sentry/nextjs");

/** @type {import('next').NextConfig} */
const nextConfig = {
    // Enable strict mode for better React practices
    reactStrictMode: true,

    // Image optimization domains
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: '**.supabase.co',
                port: '',
                pathname: '/storage/v1/object/public/**',
            },
        ],
    },

    // Environment variables exposed to browser
    env: {
        NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    },

    // Experimental features
    experimental: {
        // Enable server actions
        serverActions: {
            bodySizeLimit: '2mb',
        },
    },
};

// For Capacitor static export (used in Sprint 3)
const isCapacitorBuild = process.env.CAPACITOR_BUILD === 'true';

if (isCapacitorBuild) {
    nextConfig.output = 'export';
    nextConfig.images.unoptimized = true;
    nextConfig.trailingSlash = true;
}

module.exports = withSentryConfig(
    nextConfig,
    {
        // For all available options, see:
        // https://github.com/getsentry/sentry-webpack-plugin#options

        // Suppresses source map uploading logs during bundling
        silent: true,
        org: process.env.SENTRY_ORG || "guru-spenturi",
        project: process.env.SENTRY_PROJECT || "guru-spenturi",
        dryRun: !process.env.SENTRY_AUTH_TOKEN || isCapacitorBuild,
    },
    {
        // For all available options, see:
        // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

        // Upload a larger set of source maps for prettier stack traces
        widenClientFileUpload: true,

        // Transpiles SDK to be compatible with IE11 (should be false for modern apps)
        transpileClientSDK: false,

        // Routes browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers (optional)
        tunnelRoute: "/monitoring",

        // Hides source maps from public uploads
        hideSourceMaps: true,

        // Automatically tree-shake Sentry logger statements to reduce bundle size
        disableLogger: true,

        // Enables automatic instrumentation of Vercel Cron Monitors.
        // See the following for more information:
        // https://docs.sentry.io/product/crons/
        // https://vercel.com/docs/cron-jobs
        automaticVercelMonitors: true,
    }
);