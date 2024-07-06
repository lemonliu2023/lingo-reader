import { describe, expect, it } from 'vitest'
import { measureFont } from '../src/measureFont.ts'
// @ts-ignore
globalThis.__BROWSER__ = false

describe('measureFont', () => {
  it('measureFont', async () => {
    const { width, height } = await measureFont('a', {
      fontSize: 20,
    })
    expect(width).toBe(12.1)
    expect(height).toBe(20)
  })
})
