import { beforeAll, describe, expect, it } from 'vitest'
import { transformHTML } from '../src/transformHTML'

describe('transformHTML', () => {
  beforeAll(() => {
    // @ts-expect-error __BROWSER__
    globalThis.__BROWSER__ = false
  })
  it('should return message when it has no <body>', () => {
    expect(transformHTML('<html></html>', '', '')).toEqual({
      css: [],
      html: '',
    })
  })

  it('replace a tag href', () => {
    expect(transformHTML('<body><a href="a.html"></a></body>', 'temp', '')).toEqual({
      css: [],
      html: '<a href="Epub:temp/a.html"></a>',
    })
  })
})
