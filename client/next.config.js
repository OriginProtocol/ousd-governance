// This file sets a custom webpack configuration to use your Next.js app
// with Sentry.
// https://nextjs.org/docs/api-reference/next.config.js/introduction
// https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/
const { withSentryConfig } = require('@sentry/nextjs');

const path = require("path");
require('dotenv').config()

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  typescript: {
    // !! WARN !!
    // Dangerously allow production builds to successfully complete even if
    // your project has type errors.
    // !! WARN !!
    ignoreBuildErrors: true,
  },
  sentry: {
    hideSourceMaps: true,
  },
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    /* Add any environmental variables here and they will be available in the JS code under
     * `process.env.[variable]`. 
     *
     * Note: these get "baked in" to the code at build time when building for Goerli / Mainnet
     */
    const envVars = {
      'production': {
        NETWORK_ID: 1
      },
      'dev': {
        NETWORK_ID: 31337,
        CLAIM_OPENS: 1657580400,
        CLAIM_CLOSES: 1665356400,
      },
      'staging': {
        NETWORK_ID: 5
      },
    }

    /**
     * Returns environment variables as an object
     */
    const env = Object.keys(process.env)
      .concat(Object.keys(envVars[process.env.NODE_ENV]))
      .reduce((acc, curr) => {
        acc[`process.env.${curr}`] = JSON.stringify(process.env[curr])
        return acc
      }, {})

    config.plugins.push(new webpack.DefinePlugin(env))

    if (isServer) {
      return {
        ...config,
        entry() {
          return config.entry().then((entry) => ({
            ...entry,
            listener: path.resolve(process.cwd(), "./listener.ts"),
          }));
        },
      };
    }
    // Important: return the modified config
    return config;
  },
};

module.exports = withSentryConfig(
  nextConfig,
  { silent: true },
);
