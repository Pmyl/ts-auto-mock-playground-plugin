import typescript from '@rollup/plugin-typescript'
import node from '@rollup/plugin-node-resolve'
import commonjs from '@rollup/plugin-commonjs'
import json from '@rollup/plugin-json'
import externalGlobals from "rollup-plugin-external-globals";
import nodePoly from "rollup-plugin-polyfill-node";

// You can have more root bundles by extending this array
const rootFiles = ['index.ts']

export default rootFiles.map(name => {
  return {
    input: `src/${name}`,
    external: ['typescript', 'fs', 'winston', 'micromatch'],
    output: {
      paths: {
        "typescript": "typescript-sandbox/index",
        "fs": "typescript-sandbox/index",
        "winston": "typescript-sandbox/index",
        "micromatch": "typescript-sandbox/index"
      },
      name,
      dir: "dist",
      format: 'amd'
    },
    plugins: [typescript({tsconfig: "tsconfig.json"}), externalGlobals({typescript: "window.ts"}), commonjs(), node(), json(), nodePoly()]
  }
})
