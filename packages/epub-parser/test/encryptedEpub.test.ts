import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { initEpubFile } from '../src'
import { AesSymmetricKey16, RsaPrivateKey } from '../src/constant'

describe('rsa-sha1+aes', () => {
  // @ts-expect-error __BROWSER__ is for build process
  globalThis.__BROWSER__ = false

  it('should parse encrypted epub with rsa-sha1 and aes-128-cbc', async () => {
    const epub = await initEpubFile(
      fileURLToPath(new URL('./encryptionEpub/rsa-sha1+aes-256-cbc-ctr-gcm.epub', import.meta.url)),
      undefined,
      {
        rsaPrivateKey: RsaPrivateKey,
        aesSymmetricKey: AesSymmetricKey16,
      },
    )
    const spine = epub.getSpine()
    const item = spine[2]
    const a = await epub.loadChapter(item.id)
    expect(a).toBeDefined()
    // console.log(a)
    // console.log(item)
  })
})
