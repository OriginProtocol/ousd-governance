import adapter from '@sveltejs/adapter-auto';
import preprocess from 'svelte-preprocess';
import { resolve } from 'path';
import { NodeGlobalsPolyfillPlugin } from '@esbuild-plugins/node-globals-polyfill';
import { NodeModulesPolyfillPlugin } from '@esbuild-plugins/node-modules-polyfill';
import { build } from 'esbuild';

/** @type {import('@sveltejs/kit').Config} */
const config = {
  // Consult https://github.com/sveltejs/svelte-preprocess
  // for more information about preprocessors
  preprocess: preprocess(),

  kit: {
    adapter: adapter(),

    // hydrate the <div id="svelte"> element in src/app.html
    target: '#svelte',

    vite: {
      define: {
        Buffer: {},
        global: {}
      },
      resolve: {
        alias: {
          $src: resolve('./src'),
          $components: resolve('./src/components')
        }
      },
      build: {
        define: {
          global: 'globalThis'
        },
        plugins: [
          NodeGlobalsPolyfillPlugin({
            process: true,
            buffer: true,
            define: { 'process.env.NODE_ENV': '"production"' } // https://github.com/evanw/esbuild/issues/660
          }),
          NodeModulesPolyfillPlugin()
        ]
      }
    }
  }
};

export default config;
