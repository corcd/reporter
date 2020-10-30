/*
 * @Author: Whzcorcd
 * @Date: 2020-10-28 17:15:14
 * @LastEditors: Whzcorcd
 * @LastEditTime: 2020-10-30 17:34:02
 * @Description: file content
 */
import typescript from '@rollup/plugin-typescript'
import resolve from '@rollup/plugin-node-resolve'
import { terser } from 'rollup-plugin-terser'

export default {
  onwarn(warning) {
    // 跳过某些警告
    if (warning.code === 'UNUSED_EXTERNAL_IMPORT') return
    // 抛出异常
    if (warning.code === 'NON_EXISTENT_EXPORT') throw new Error(warning.message)
    // 控制台打印一切警告
    console.warn(warning.message)
  },
  input: 'src/index.ts',
  output: [
    {
      name: 'reporter',
      file: 'dist/reporter.js',
      format: 'iife',
    },
    {
      name: 'reporter',
      file: 'dist/reporter.min.js',
      format: 'iife',
      plugins: [
        terser({
          compress: {
            ecma: 2015,
            pure_getters: true,
          },
        }),
      ],
    },
  ],
  watch: {
    include: 'src/**',
  },
  plugins: [
    resolve(),
    typescript({
      tsconfig: 'rollup.tsconfig.json',
    }),
  ],
}
