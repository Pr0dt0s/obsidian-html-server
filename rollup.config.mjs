import typescript from "@rollup/plugin-typescript";
import json from "@rollup/plugin-json";
import terser from "@rollup/plugin-terser";
import resolve from "rollup-plugin-node-resolve";
import commonJS from "rollup-plugin-commonjs";

export default {
  input: "src/index.ts",
  external: [
    "obsidian",
    "path",
    "util",
    "tty",
    "fs",
    "net",
    "events",
    "stream",
    "zlib",
    "buffer",
    "string_decoder",
    "async_hooks",
    "querystring",
    "url",
    "http",
    "crypto",
  ],
  output: {
    file: "main.js",
    format: "cjs",
  },
  plugins: [
    json(),
    resolve({
      preferBuiltins: true,
    }),
    commonJS({
      include: "node_modules/**",
    }),
    typescript(),
    terser(),
  ],
};
