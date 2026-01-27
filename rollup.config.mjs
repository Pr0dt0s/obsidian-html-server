import 'dotenv/config';
import json from '@rollup/plugin-json';
import nodeResolve from '@rollup/plugin-node-resolve';
import cjs from '@rollup/plugin-commonjs';
import copy from 'rollup-plugin-copy';
import typescript from '@rollup/plugin-typescript';
import terser from '@rollup/plugin-terser';

const name = 'html-server';

// 环境变量配置输出目录（可在 .env 文件中设置）
const devOutputDir = process.env.DEV_OUTPUT_DIR || 'test-vault/.obsidian/plugins/html-server';
const prodOutputDir = process.env.PROD_OUTPUT_DIR || 'dist';

const developmentConfig = {
  input: 'src/plugin/main.ts',
  external: ['obsidian'],
  output: {
    dir: devOutputDir,
    sourcemap: false,
    format: 'cjs',
    exports: 'default',
    name,
  },
  plugins: [
    json(),
    nodeResolve({ preferBuiltins: true }),
    cjs({ include: 'node_modules/**' }),
    typescript({ tsconfig: './tsconfig.dev.json', outDir: devOutputDir }),
    copy({
      targets: [
        {
          src: 'styles.css',
          dest: devOutputDir,
        },
        {
          src: 'manifest.json',
          dest: devOutputDir,
        },
      ],
    }),
  ],
};

const productionConfig = {
  input: 'src/plugin/main.ts',
  external: ['obsidian'],
  output: {
    dir: prodOutputDir,
    sourcemap: false,
    sourcemapExcludeSources: true,
    format: 'cjs',
    exports: 'default',
    name,
  },
  plugins: [
    json(),
    nodeResolve({ preferBuiltins: true }),
    cjs({ include: 'node_modules/**' }),
    typescript({ tsconfig: './tsconfig.json', outDir: prodOutputDir }),
    copy({
      targets: [
        {
          src: 'styles.css',
          dest: prodOutputDir,
        },
        {
          src: 'manifest.json',
          dest: prodOutputDir,
        },
      ],
    }),
    terser({ compress: true, mangle: true }),
  ],
};

const config =
  process.env.PRODUCTION === '1' ? productionConfig : developmentConfig;
export default config;
