import buble from "rollup-plugin-buble";
import { terser } from "rollup-plugin-terser";
import pkg from "./package.json";

const license = `
/**
 * @author Luca Poldelmengo
 * @license MIT
 * @see {@link https://github.com/pldg/scroll-interactions}
 */
`;

const input = "src/index.js";

const output_cjs = "dist/scroll-interactions.cjs.js";
const output_iife = "dist/scroll-interactions.iife.js";
const output_umd = "dist/scroll-interactions.umd.js";
const output_esm = "dist/scroll-interactions.esm.js";

function addPlugins({ transpile = false, minify = false } = {}) {
  const p = [];

  if (transpile) {
    p.push(
      // Note: Spread operator doesn't work on array-like objects (for example
      // dom list): https://github.com/bublejs/buble/issues/131
      buble({
        exclude: ["node_modules/**"],
      })
    );
  }

  if (minify) {
    p.push(
      terser({
        output: {
          // Preserve license comments
          comments: "some",
        },
      })
    );
  }

  return p;
}

function addOutput({ file, format, minify }) {
  // https://rollupjs.org/guide/en/#outputname
  //
  // The iife and umd builds expose a global variable: use a valid JS
  // identifier as name of the package
  const name =
    format === "iife" || format === "umd"
      ? pkg.name.replace("-", "_")
      : undefined;

  return {
    banner: license,
    file: minify ? file.replace(/.js$/i, ".min.js") : file,
    name,
    format,
  };
}

export default [
  {
    input,
    output: [
      addOutput({
        file: output_iife,
        format: "iife",
      }),
      addOutput({
        file: output_umd,
        format: "umd",
      }),
      addOutput({
        file: output_cjs,
        format: "cjs",
      }),
    ],
    plugins: addPlugins({
      transpile: true,
    }),
  },
  {
    input,
    output: addOutput({
      file: output_esm,
      format: "es",
    }),
  },

  // Minify versions:

  {
    input,
    output: [
      addOutput({
        file: output_iife,
        format: "iife",
        minify: true,
      }),
      addOutput({
        file: output_umd,
        format: "umd",
        minify: true,
      }),
      addOutput({
        file: output_cjs,
        format: "cjs",
        minify: true,
      }),
    ],
    plugins: addPlugins({
      transpile: true,
      minify: true,
    }),
  },
  {
    input,
    output: addOutput({
      file: output_esm,
      format: "es",
      minify: true,
    }),
    plugins: addPlugins({
      minify: true,
    }),
  },
];
