import json from '@rollup/plugin-json';
import nodeResolve from '@rollup/plugin-node-resolve';
import cjs from '@rollup/plugin-commonjs';
import copy from 'rollup-plugin-copy';
import typescript from '@rollup/plugin-typescript';
import terser from '@rollup/plugin-terser';

const developmentConfig = {
  input: 'src/plugin/main.ts',
  external: ['obsidian'],
  output: {
    dir: 'test-vault/.obsidian/plugins/html-server',
    sourcemap: false,
    format: 'cjs',
    exports: 'default',
    name: 'Html Server',
  },
  plugins: [
    json(),
    nodeResolve({ preferBuiltins: true }),
    cjs({ include: 'node_modules/**' }),
    typescript({ tsconfig: './tsconfig.dev.json' }),
    copy({
      targets: [
        {
          src: 'styles.css',
          dest: 'test-vault/.obsidian/plugins/html-server/',
        },
        {
          src: 'manifest.json',
          dest: 'test-vault/.obsidian/plugins/html-server/',
        },
      ],
    }),
  ],
};

const productionConfig = {
  input: 'src/plugin/main.ts',
  external: ['obsidian'],
  output: {
    dir: 'dist',
    sourcemap: false,
    sourcemapExcludeSources: true,
    format: 'cjs',
    exports: 'default',
    name: 'Html Server',
  },
  plugins: [
    json(),
    nodeResolve({ preferBuiltins: true }),
    cjs({ include: 'node_modules/**' }),
    typescript({ tsconfig: './tsconfig.json', outDir: './' }),
    copy({
      targets: [
        {
          src: 'styles.css',
          dest: 'dist/',
        },
        {
          src: 'manifest.json',
          dest: 'dist/',
        },
        {
          src: 'manifest.json',
          dest: 'test-vault/.obsidian/plugins/html-server/',
        },
        {
          src: 'dist/main.js',
          dest: 'test-vault/.obsidian/plugins/html-server/',
        },
      ],
    }),
    terser({ compress: true, mangle: true }),
  ],
};

const config =
  process.env.PRODUCTION === '1' ? productionConfig : developmentConfig;
export default config;
