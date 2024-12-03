import { describe, expect, it } from 'vitest'
import { parsexml } from '../src'

describe('parsexml', () => {
  it('parsexml', async () => {
    const xml = '<root><a>1</a><b>2</b></root>'
    const result = await parsexml(xml)
    expect(result).toEqual({ root: { a: ['1'], b: ['2'] } })
  })
})
