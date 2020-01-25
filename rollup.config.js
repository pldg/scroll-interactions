import buble from 'rollup-plugin-buble';
import { terser } from 'rollup-plugin-terser';
import pkg from './package.json';

const licence =
  `/**
 * @license MIT
 * @author Luca Poldelmengo
 * @see {@link https://github.com/pldg/scrollzzz}
 */
`;

const input = 'src/index.js';
const output_cjs = 'dist/scrollzzz.cjs.js';
const output_iife = 'dist/scrollzzz.iife.js';
const output_umd = 'dist/scrollzzz.umd.js';
const output_esm = 'dist/scrollzzz.esm.js';

function addPlugins({
  transpile = false,
  minify = false
} = {}) {
  const p = [];
  if (transpile) {
    p.push(
      // Note: Spread operator doesn't work on array-like objects (for example
      // dom list): https://github.com/bublejs/buble/issues/131
      buble({
        exclude: ['node_modules/**']
      })
    );
  }
  if (minify) {
    p.push(
      terser({
        output: {
          // Preserve licence comments
          comments: 'some'
        }
      })
    );
  }
  return p;
};

function addOutput({
  file,
  format,
  minify
}) {
  return {
    banner: licence,
    name: pkg.name,
    file: minify ? file.replace(/.js$/i, '.min.js') : file,
    format
  };
}

export default [
  {
    input,
    output: [
      addOutput({
        file: output_iife,
        format: 'iife'
      }),
      addOutput({
        file: output_umd,
        format: 'umd'
      }),
      addOutput({
        file: output_cjs,
        format: 'cjs'
      }),
    ],
    plugins: addPlugins({
      transpile: true
    })
  },
  {
    input,
    output: addOutput({
      file: output_esm,
      format: 'es'
    })
  },

  // Minify versions:
  {
    input,
    output: [
      addOutput({
        file: output_iife,
        format: 'iife',
        minify: true
      }),
      addOutput({
        file: output_umd,
        format: 'umd',
        minify: true
      }),
      addOutput({
        file: output_cjs,
        format: 'cjs',
        minify: true
      }),
    ],
    plugins: addPlugins({
      transpile: true,
      minify: true
    })
  },
  {
    input,
    output: addOutput({
      file: output_esm,
      format: 'es',
      minify: true
    }),
    plugins: addPlugins({
      minify: true
    })
  }
];