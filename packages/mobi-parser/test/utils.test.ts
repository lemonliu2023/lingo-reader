import { describe, expect, it } from 'vitest'
import { unescapeHTML } from '../src/utils'

describe('unescapeHTML', () => {
  it('should decode common HTML entities', () => {
    expect(unescapeHTML('&lt;div&gt;')).toBe('<div>')
    expect(unescapeHTML('&amp;')).toBe('&')
    expect(unescapeHTML('&quot;')).toBe('"')
    expect(unescapeHTML('&#39;')).toBe('\'')
  })

  it('should decode Unicode hexadecimal entities', () => {
    expect(unescapeHTML('&#x1F600;')).toBe('😀')
    expect(unescapeHTML('&#x2764;&#xFE0F;')).toBe('❤️')
    expect(unescapeHTML('&#x26A1;')).toBe('⚡')
  })

  it('should decode Unicode decimal entities', () => {
    expect(unescapeHTML('&#128512;')).toBe('😀')
    expect(unescapeHTML('&#10084;')).toBe('❤')
    expect(unescapeHTML('&#9731;')).toBe('☃')
  })

  it('should handle unknown or invalid entities gracefully', () => {
    expect(unescapeHTML('&unknown;')).toBe('&unknown;')
    expect(unescapeHTML('&ampx;')).toBe('&ampx;')
    expect(unescapeHTML('&#invalid;')).toBe('&#invalid;')
  })

  it('should decode mixed entities', () => {
    expect(unescapeHTML('&lt;div&gt;&#x1F600; &amp; &#128512;&lt;/div&gt;'))
      .toBe('<div>😀 & 😀</div>')
  })
})
