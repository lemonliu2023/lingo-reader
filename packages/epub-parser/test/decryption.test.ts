import { Buffer } from 'node:buffer'
import crypto from 'node:crypto'
import { beforeAll, describe, expect, it } from 'vitest'
import { decryptAes, decryptRsa } from '../src/decryption'
import { AesSymmetricKey16, AesSymmetricKey24, AesSymmetricKey32, RsaPrivateKey } from './keys/encryptionKey'

describe('decrypt Rsa in browser', () => {
  beforeAll(() => {
    const [major] = process.versions.node.split('.').map(Number)
    if (major <= 18) {
      // Node 18 does not support crypto.subtle, so we need to use the node:crypto module
      // @ts-expect-error Node 18 does not support crypto.subtle
      globalThis.crypto = crypto.webcrypto
    }
    // @ts-expect-error __BROWSER__ is for build process
    globalThis.__BROWSER__ = true
  })

  const privateKey = new Uint8Array(Buffer.from(RsaPrivateKey, 'base64'))
  it('rsa-oaep-sha1', async () => {
    const base64Data = 'T6RxwemtUM2u9TMWLN3t1ybpoXIsjWwuMeBbuth/f6YGVIuWYRqZudgV1dNdxXz9bKvbDAUMoxjaJDTW5GwSbh6Yyqw6b4i0jFhojt2X5oaR034EX7Sc7vjhrR0ihul9rmbQw+O0VDcPvKK+7BDq0oDpaS3UoJKmwQ92QFrEOkfpZTM4chKpmGJQI4UF7f+/GP/2ZOdpSoRWdss7vF+jVEyY2i83eqP5jloUyrt+/umy7LzC4PUFD62PONwmCtJJGk7oOK1Zj26nuHMoqflrh+M12D8Y9ScUAMSyqBpWY/pdyecA9l+JILW6NrGIsT/4U9CaMJN+GVxfcXsGHwvFww=='
    const decryptedData = await decryptRsa(privateKey, base64Data, 'sha1')
    expect(Buffer.from(decryptedData).toString('base64')).toBe(AesSymmetricKey32)
  })

  it('rsa-oaep-sha256', async () => {
    const base64Data = 'iH4GFXJu9XuS6dlBGOMi27/CqkN10niFrnKNN1ZLDuuTHlb6voJ5c0rX+0+wqAC3vwx7/F5hdj+l+2JgdnXanEsEMK7SjObaqi+0/rAky0N4i6N2j1a4w4/VMhYDViyy08jkvFR6jXDAiOXfWXwtcble0HxlWe2g2+BLjyXdUhP8vfsW3M7iKAy20opQb/CdcHb5W4XBmZpIXlUz0weU5F01Aex7A1h6uXEXnBeW1CYxBfFuSJoR7iZSb9585GbEw5gvJAfChpzzW5HjlBMRjJAX/COQxFMTwKvpNkKGopud4H+CWqLLUuJVPhyeVzsbdAh1yrsbVz6jV9DXkUp0OQ=='
    const decryptedData = await decryptRsa(privateKey, base64Data, 'sha256')
    expect(Buffer.from(decryptedData).toString('base64')).toBe(AesSymmetricKey24)
  })
})

describe('decrypt Aes in browser', () => {
  beforeAll(() => {
    const [major] = process.versions.node.split('.').map(Number)
    if (major <= 18) {
      // Node 18 does not support crypto.subtle, so we need to use the node:crypto module
      // @ts-expect-error Node 18 does not support crypto.subtle
      globalThis.crypto = crypto.webcrypto
    }
    // @ts-expect-error __BROWSER__ is for build process
    globalThis.__BROWSER__ = true
  })
  const symmetricKey32 = Buffer.from(AesSymmetricKey32, 'base64')
  const expectedData = new Uint8Array(Buffer.from('helloWorld', 'utf-8'))

  it('aes-256-cbc', async () => {
    const base64Data = '7cJPU0FQRodlTqY7dB3Zm+OWn3rVAWAKzSrrvC+Qr0A='
    const decryptedData = await decryptAes(
      'aes-256-cbc',
      symmetricKey32,
      Buffer.from(base64Data, 'base64'),
    )
    expect(decryptedData).toEqual(expectedData)
  })

  it('aes-256-ctr', async () => {
    const base64Data = '7cJPU0FQRodlTqY7dB3Zm9mboluA+pKDHAg='
    const decryptedData = await decryptAes(
      'aes-256-ctr',
      symmetricKey32,
      Buffer.from(base64Data, 'base64'),
    )
    expect(decryptedData).toEqual(expectedData)
  })

  it('aes-256-gcm', async () => {
    const base64Data = 'N5wl7Z6dyhgGBKOyy69RXi2CIi3MyMBL7BiAj9BpULcRRdddzBw='
    const decryptedData = await decryptAes(
      'aes-256-gcm',
      symmetricKey32,
      Buffer.from(base64Data, 'base64'),
    )
    expect(decryptedData).toEqual(expectedData)
  })

  it('aes-192-cbc', async () => {
    const symmetricKey24 = Buffer.from(AesSymmetricKey24, 'base64')
    const base64Data = '7cJPU0FQRodlTqY7dB3Zm20pXpbJlMPSwP8aDGi1RnA='
    await expect(async () => {
      await decryptAes(
        'aes-192-cbc',
        symmetricKey24,
        Buffer.from(base64Data, 'base64'),
      )
    }).rejects.toThrowError()
  })

  const symmetricKey16 = Buffer.from(AesSymmetricKey16, 'base64')
  it('aes-128-cbc', async () => {
    const base64Data = '7cJPU0FQRodlTqY7dB3ZmzQzzlLoLviaEHuHMU2CO+0='
    const decryptedData = await decryptAes(
      'aes-128-cbc',
      symmetricKey16,
      Buffer.from(base64Data, 'base64'),
    )
    expect(decryptedData).toEqual(expectedData)
  })

  it('aes-128-ctr', async () => {
    const base64Data = '7cJPU0FQRodlTqY7dB3Zm7YDbaHbdx+Treg='
    const decryptedData = await decryptAes(
      'aes-128-ctr',
      symmetricKey16,
      Buffer.from(base64Data, 'base64'),
    )
    expect(decryptedData).toEqual(expectedData)
  })

  it('aes-128-gcm', async () => {
    const base64Data = 'N5wl7Z6dyhgGBKOyiyAH+h9PW9EH/7x2QYLkUdoGo5taMFVvju4='
    const decryptedData = await decryptAes(
      'aes-128-gcm',
      symmetricKey16,
      Buffer.from(base64Data, 'base64'),
    )
    expect(decryptedData).toEqual(expectedData)
  })
})
