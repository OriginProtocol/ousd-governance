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
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    /* Add any environmental variables here and they will be available in the JS code under
     * `process.env.[variable]`. 
     *
     * Note: these get "baked in" to the code at build time when building for Rinkeby / Mainnet
     */
    const envVars = {
      'prod': {
        NETWORK_ID: 1,
      },
      'dev': {
        NETWORK_ID: 31337,
      },
      'staging': {
        NETWORK_ID: 4,
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

module.exports = nextConfig;
