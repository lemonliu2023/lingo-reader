import { describe, expect, it } from 'vitest'
import { measureFont } from '../src/measureFont.ts'
// @ts-expect-error __BROWSER__ is defined in rollup options
globalThis.__BROWSER__ = false

describe('measureFont', () => {
  it('measureFont', async () => {
    const { width, height } = await measureFont('a', {
      fontSize: 20,
    })
    expect(width).toBe(12.0625)
    expect(height).toBe(20)
  })
})
