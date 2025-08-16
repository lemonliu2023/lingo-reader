import { beforeAll, describe, expect, it } from 'vitest'
import { transformHTML } from '../src/transformChapter'

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
    expect(transformHTML(`<body><a href="%2ca.html"></a><a href="https://www.baidu.com"></a></body>`, 'temp', '')).toEqual({
      css: [],
      html: '<a href="epub:temp/,a.html"></a><a href="https://www.baidu.com"></a>',
    })
  })

  it('replace <image> src in browser', () => {
    const transformed = transformHTML(
      '<body><image xlink:href="src.jpg"></image></body>',
      '',
      './images',
    ).html
    const dir = process.cwd()
    const href = transformed.match(/xlink:href="([^"]*)"/)?.[1]
    expect(href?.startsWith(dir)).toBe(true)
  })

  it('do not allow to reference external resources', () => {
    const transformed = transformHTML(
      '<body><img src="https://www.baidu.com/image.jpg"/></body>',
      '',
      '',
    )
    expect(transformed.html).not.toBe('<img src="https://www.baidu.com/image.jpg"/>')
  })
})
