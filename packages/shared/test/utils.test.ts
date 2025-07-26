import { describe, expect, it } from 'vitest'
import { camelCase, parsexml } from '../src'

describe('parsexml', () => {
  it('parsexml', async () => {
    const xml = '<root><a>1</a><b>2</b></root>'
    const result = await parsexml(xml)
    expect(result).toEqual({ root: { a: ['1'], b: ['2'] } })
  })
})

describe('camelCase', () => {
  it('should convert kebab-case to camelCase', () => {
    expect(camelCase('hello-world')).toBe('helloWorld')
    expect(camelCase('my-variable-name')).toBe('myVariableName')
  })

  it('should return the same string if no hyphen', () => {
    expect(camelCase('hello')).toBe('hello')
  })

  it('should handle multiple hyphens correctly', () => {
    expect(camelCase('a-b-c-d')).toBe('aBCD')
  })

  it('should handle empty string', () => {
    expect(camelCase('')).toBe('')
  })

  it('should not change uppercase letters already in place', () => {
    expect(camelCase('hello-World')).toBe('helloWorld')
  })

  it('should handle leading or trailing hyphens gracefully', () => {
    expect(camelCase('-start')).toBe('Start')
    expect(camelCase('end-')).toBe('end-')
  })
})
