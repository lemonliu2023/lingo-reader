import { fileURLToPath } from 'node:url'
import { readFileSync } from 'node:fs'
import { Buffer } from 'node:buffer'
import { describe, expect, it } from 'vitest'
import { initEpubFile } from '../src'

export const RsaPrivateKey = 'MIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQC+z49/PVM3InyMX9TaH9lMarpcDWfYVt4979ZAU/ojklxJT13ddhPSiXDTtW2cMVFo9z13pxvU03A+grE1sIhN973SkYUhdDQh0AwIh0bh4dnhpMfj4zkx4ynSsZ6hKf2gFJXf2r3uyEkqJsfQ1eeOzzFmx8t2N/cs6675JPzoW3zUmVtinBu2WLbHcnXRzK4619kg8Rcczn82ZvotFA8N1gjf7Z3hlnx+dm9dfrShsibcnQv3IrJ0Y7jhS6gtDUyg0b8zky1FoUgq0hN8WjTYw2Ecqt6QAgJfJqh5WOAF1UBhZ2xdPe2IGFTNeK2NXmDElQ63+QsF4azSmeOCB4nHAgMBAAECggEAAJ0fxGMgOjT7YkWYLkJcWhPYHgBgk3thSCrf+/okQJIKOM0R0vS8Afkrltq++AOwcYqlb+6EGZgxmFnhWL0Oqy9hoTNX8Ct+oqpJAD1AsgBPteojWp5rYHyC6+PY6ZYvfcg23JZIbKi0gCi1stUAY2jdSLNkDfYGgmZxXq4tWtpwmSrCVi1By9VvBHsv2VB4QWi+BK1dslQvsdYypcP9LncgEy8D6Vu/H0KgfVcfcrHsWfeALSYJM76kvaqJ6SQZ0ZWFiWrk1EVXsM+o1DXG65wvlrb1QLSE2FoRkFrzc3XoGM67Rpk6vhu0IDRF2LYQbbpmIpx1qqUnQsKG5PqO+QKBgQDRV2lyP9EFcFCnIK08Sw9bw2DSGCtKOcrtNeFYAYxxyyGKiPBGbPUWAyj86UYJPRAPybpKg/3QYpIAWfpKfdb+hTpVBQyzzytqvo/tLzT+8Q4jMyqoS54FAVRV5SdLQVPHIwAWPHUVY7gBrRB0uhbs+yY1mjOCb7XVlcvQ7rpdLwKBgQDpVtPA89UpaBTyMH57wUvtNpeHt0UK9P+GZAtrwRshxssBBh++CXrYHGs5C14+yZUwecYLQIlMFIdhjt8q+eHchpqVjYSKQ5MyYfpgv/ZMdiDMuN51iyX+1MuPHCOeE4UMBEZyc67JuFC4f7f7eNKzyzr7ktgE4uVJomqiGThm6QKBgB3P2fdoOScSIJo8YA9HDS/fOgmRYZDXfBud4bJ7vflymRs2dylAWQLCfnLN8ahdJs1ox/vWoi2r6+ja53b2RsjGRlFXP8DXjvJLowl/AIgR4haHMdr3sdA6qTz2PktMSVcBmACSqYXbRpgOglptKdijx4Q4qn8302hQRc9CQA4HAoGBAMGtFRQaD3tP7drcj4+u8JOTdZDreL5QfuuQjL5CyX9unr9Z0u0Mt087v2/Y1MAu18sluFFMnulsPLaoPOpSALvnadXqYfHVhw8Rrh2yGAB9KFpktBlChyYOgGtnwtSJhSxlPAfxp0m92BpbwF1VeyZK8MkxqGXd4s0Mp4+meV9JAoGBAIZzHmcYKl0Cj0VyBgTwkKF22rFDoX9I3oyCRe8PfXQ/C2bf7hU8CCj1A9OyuAyI0FksUIRPTrvyAsOwjZY3I1mwf2fSxWEll9EZr7ABeNe03AXbYx+xCPqjHNi90+Lnj33ZMNDxnqARtYcgh0Qp28j+Cbnid1qVhXFzTxPNJhIb'

export const AesSymmetricKey16 = 'D2wVcst49HU6KqC1T2N8gw=='

function isJpg(img: Uint8Array): boolean {
  return img[0] === 0xFF && img[1] === 0xD8 && img[img.length - 2] === 0xFF && img[img.length - 1] === 0xD9
}

describe('initEpubFile options interface', () => {
  it('not throw error', async () => {
    // @ts-expect-error __BROWSER__ is for build process
    globalThis.__BROWSER__ = false
    const epub = await initEpubFile(
      fileURLToPath(new URL('./encryptionEpub/rsa-sha1+aes-256-cbc-ctr-gcm.epub', import.meta.url)),
      './images',
      {
        rsaPrivateKey: new Uint8Array(Buffer.from(RsaPrivateKey, 'base64')),
        aesSymmetricKey: new Uint8Array(Buffer.from(AesSymmetricKey16, 'base64')),
      },
    )
    const spine = epub.getSpine()
    expect(spine.length).toBeGreaterThan(0)
  })
})

describe('rsa-sha1+aes-256-cbc-ctr-gcm.epub', async () => {
  // @ts-expect-error __BROWSER__ is for build process
  globalThis.__BROWSER__ = false
  const epub = await initEpubFile(
    fileURLToPath(new URL('./encryptionEpub/rsa-sha1+aes-256-cbc-ctr-gcm.epub', import.meta.url)),
    './images',
    {
      rsaPrivateKey: RsaPrivateKey,
    },
  )
  const spine = epub.getSpine()
  // afterAll(() => {
  //   epub.destroy()
  // })

  it('ePUB/xhtml/chapter2.xhtml', async () => {
    const item = spine[2]
    const a = await epub.loadChapter(item.id)
    expect(a.css.length).toBe(0)
    expect(a.html).toContain('<div id="chapter2.xhtml">')
  })

  it('ePUB/xhtml/chapter3.xhtml', async () => {
    const item = spine[3]
    const a = await epub.loadChapter(item.id)
    expect(a.css.length).toBe(0)
    expect(a.html).toContain('<div id="chapter3.xhtml">')
  })

  it('ePUB/xhtml/chapter4.xhtml', async () => {
    const item = spine[4]
    const a = await epub.loadChapter(item.id)
    expect(a.css.length).toBe(0)
    expect(a.html).toContain('<div id="chapter4.xhtml">')
  })

  it('ePUB/xhtml/chapter5.xhtml', async () => {
    const item = spine[5]
    const a = await epub.loadChapter(item.id)
    expect(a.css.length).toBe(0)
    expect(a.html).toContain('<div id="chapter5.xhtml">')
  })

  it('ePUB/images/cover.jpg', async () => {
    const item = spine[0]
    const cover = await epub.loadChapter(item.id)
    expect(cover.css.length).toBe(1)
    expect(cover.html).toContain('<img')

    const src = cover.html.match(/<img[^>]+src="([^"]+)"/)?.[1]
    const img = new Uint8Array(readFileSync(src!))
    expect(isJpg(img)).toBe(true)
  })
})

// rsa-sha256+aes192-cbc-ctr-gcm.epub
describe('rsa-sha256+aes192-cbc-ctr-gcm.epub', async () => {
  // @ts-expect-error __BROWSER__ is for build process
  globalThis.__BROWSER__ = false
  const epub = await initEpubFile(
    fileURLToPath(new URL('./encryptionEpub/rsa-sha256+aes192-cbc-ctr-gcm.epub', import.meta.url)),
    './images',
    {
      rsaPrivateKey: RsaPrivateKey,
    },
  )
  const spine = epub.getSpine()

  it('ePUB/xhtml/cover.xhtml', async () => {
    const item = spine[0]
    const chapter = await epub.loadChapter(item.id)
    expect(chapter.css.length).toBe(1)
    expect(chapter.html).toContain('<img')
  })

  it('ePUB/xhtml/chapter2.xhtml', async () => {
    const item = spine[2]
    const chapter = await epub.loadChapter(item.id)
    expect(chapter.css.length).toBe(0)
    expect(chapter.html).toContain('<div id="chapter2.xhtml">')
  })

  it('ePUB/xhtml/chapter3.xhtml', async () => {
    const item = spine[3]
    const chapter = await epub.loadChapter(item.id)
    expect(chapter.css.length).toBe(0)
    expect(chapter.html).toContain('<div id="chapter3.xhtml">')
  })

  it('ePUB/xhtml/chapter4.xhtml', async () => {
    const item = spine[4]
    const chapter = await epub.loadChapter(item.id)
    expect(chapter.css.length).toBe(0)
    expect(chapter.html).toContain('<div id="chapter4.xhtml">')
  })

  it('ePUB/xhtml/chapter5.xhtml', async () => {
    const item = spine[5]
    const chapter = await epub.loadChapter(item.id)
    expect(chapter.css.length).toBe(0)
    expect(chapter.html).toContain('<div id="chapter5.xhtml">')
  })
})

describe('aes128-cbc-ctr-gcm.epub', async () => {
  // @ts-expect-error __BROWSER__ is for build process
  globalThis.__BROWSER__ = false
  const epub = await initEpubFile(
    fileURLToPath(new URL('./encryptionEpub/aes128-cbc-ctr-gcm.epub', import.meta.url)),
    './images',
    {
      aesSymmetricKey: AesSymmetricKey16,
    },
  )
  const spine = epub.getSpine()
  // afterAll(() => {
  //   epub.destroy()
  // })

  // <!-- aes128-cbc + Compression + IV 16 byte -->
  it('ePUB/xhtml/cover.xhtml', async () => {
    const item = spine[0]
    const chapter = await epub.loadChapter(item.id)
    expect(chapter.css.length).toBe(1)
    expect(chapter.html).toContain('<img src=')
  })

  // <!-- aes128-ctr + Compression + IV 16 byte -->
  it('ePUB/xhtml/chapter2.xhtml', async () => {
    const item = spine[2]
    const chapter = await epub.loadChapter(item.id)
    expect(chapter.css.length).toBe(0)
    expect(chapter.html).toContain('<div id="chapter2.xhtml">')
  })

  // <!-- aes128-gcm + Compression + IV 12 byte -->
  it('ePUB/xhtml/chapter3.xhtml', async () => {
    const item = spine[3]
    const chapter = await epub.loadChapter(item.id)
    expect(chapter.css.length).toBe(0)
    expect(chapter.html).toContain('<div id="chapter3.xhtml">')
  })
})
