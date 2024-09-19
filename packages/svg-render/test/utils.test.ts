import { describe, expect, it } from 'vitest'
import { iterateWithStr, parsePadding } from '../src/utils'

describe('utils', () => {
  it('parsePadding', () => {
    const result1 = parsePadding('40')
    expect(result1).toEqual([40, 40, 40, 40])

    const result2 = parsePadding('40 20')
    expect(result2).toEqual([40, 20, 40, 20])

    const result3 = parsePadding('40 20 10')
    expect(result3).toEqual([40, 20, 10, 20])

    const result4 = parsePadding('40 20 10 5')
    expect(result4).toEqual([40, 20, 10, 5])

    expect(() => parsePadding('40 20 10 5 2')).toThrow(
      'padding should be 1-4 values with " " separated',
    )
  })

  it('iterateWithStr', () => {
    const text = 'A😄B'
    const result = [...iterateWithStr(text)]
    expect(result).toEqual([
      [0, 'A'],
      [1, '😄'],
      [3, 'B'],
    ])
  })
})
