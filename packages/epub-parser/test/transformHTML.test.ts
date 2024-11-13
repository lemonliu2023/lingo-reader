import { describe, expect, it } from 'vitest'
import { transformHTML } from '../src/transformHTML'

describe('transformHTML', () => {
  it('should return message when it has no <body>', () => {
    expect(transformHTML('<html></html>', '')).toBe('There is no body tag in html')
  })
})
