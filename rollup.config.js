import buble from 'rollup-plugin-buble';
import { terser } from "rollup-plugin-terser";
import pkg from './package.json';

const licence =
`/**
 * @license MIT
 * @author Luca Poldelmengo
 * @see {@link https://github.com/pldg/scrollzzz}
 */
`;

const input = 'src/index.js';

function plugins({
  transpile = false,
  minify = false
} = {}) {
  const p = [];
  if (transpile) {
    p.push(
      // Note: Spread operator doesn't work on array-like objects (for example dom
      // list): https://github.com/bublejs/buble/issues/131
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

function addOutput(file, format) {
  return {
    banner: licence,
    name: pkg.name,
    file,
    format
  };
}

function setOutputName(file, minify = false) {
  if (minify) return file.replace(/.js$/i, '.min.js')
  return file;
}

export default [
  {
    input,
    output: [
      addOutput(setOutputName(pkg.browser), 'iife'),
      addOutput(setOutputName(pkg.main), 'cjs'),
    ],
    plugins: plugins({
      transpile: true
    })
  },
  {
    input,
    output: [
      addOutput(setOutputName(pkg.browser, true), 'iife'),
      addOutput(setOutputName(pkg.main, true), 'cjs'),
    ],
    plugins: plugins({
      transpile: true,
      minify: true
    })
  },
  {
    input,
    output: addOutput(setOutputName(pkg.module), 'es')
  },
  {
    input,
    output: addOutput(setOutputName(pkg.module, true), 'es'),
    plugins: plugins({
      minify: true
    })
  }
];